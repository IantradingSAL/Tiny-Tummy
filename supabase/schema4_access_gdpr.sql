-- Tiny Tummy — custom roles, page access, supplier payments, invoice scans,
-- children's data under a signed confidentiality agreement (GDPR).
-- Run AFTER schema.sql, schema2_operations.sql and schema3_family.sql.
-- Mirrors js/access.js, js/gdpr.js, js/sup-file.js and js/inv-scan.js.

-- ── custom roles ─────────────────────────────────────────────────────────
-- Roles are no longer a fixed list: built-in roles + roles created in Team & Access.
create table if not exists public.tt_roles (
  id          text primary key,                 -- 'manager' … or 'r_xxxx' for a created role
  label       text not null,
  description text not null default '',
  color       text not null default '#55606b',
  builtin     boolean not null default false,
  created_at  timestamptz not null default now()
);
insert into public.tt_roles (id, label, description, builtin) values
  ('super_admin', 'Super admin', 'Everything, always', true),
  ('manager', 'Manager', 'Runs daily operations', true),
  ('kitchen', 'Kitchen', 'Cooks & prepares meals', true),
  ('delivery', 'Delivery', 'Delivers orders', true),
  ('support', 'Support', 'Answers parents', true)
on conflict (id) do nothing;
alter table public.tt_staff drop constraint if exists tt_staff_role_check;
alter table public.tt_staff drop constraint if exists tt_staff_role_fk;
alter table public.tt_staff add constraint tt_staff_role_fk foreign key (role) references public.tt_roles(id) on update cascade;

-- ── page access per role and per person (overrides the page's permission) ──
create table if not exists public.tt_page_access (
  scope   text not null check (scope in ('role','user')),
  who     text not null,                        -- role id, or staff uuid as text
  page    text not null,                        -- dashboard page key (orders, inventory, …)
  allowed boolean not null,
  primary key (scope, who, page)
);
create or replace function public.tt_page_ok(p_page text, p_perm text)
returns boolean language sql stable security definer set search_path = public as $$
  select case
    when exists (select 1 from tt_staff s where s.id = auth.uid() and s.role = 'super_admin') then true
    else coalesce(
      (select allowed from tt_page_access where scope = 'user' and who = auth.uid()::text and page = p_page),
      (select pa.allowed from tt_page_access pa join tt_staff s on s.id = auth.uid() and pa.scope = 'role' and pa.who = s.role and pa.page = p_page),
      p_perm is null or public.tt_has_perm(p_perm))
  end $$;

alter table public.tt_roles enable row level security;
alter table public.tt_page_access enable row level security;
drop policy if exists "roles read" on public.tt_roles;
create policy "roles read" on public.tt_roles for select to authenticated using ((select public.tt_is_staff()));
drop policy if exists "roles write" on public.tt_roles;
create policy "roles write" on public.tt_roles for all to authenticated
  using (public.tt_has_perm('users_manage') and not builtin) with check (public.tt_has_perm('users_manage') and not builtin);
drop policy if exists "page access read" on public.tt_page_access;
create policy "page access read" on public.tt_page_access for select to authenticated using ((select public.tt_is_staff()));
drop policy if exists "page access write" on public.tt_page_access;
create policy "page access write" on public.tt_page_access for all to authenticated
  using (public.tt_has_perm('users_manage')) with check (public.tt_has_perm('users_manage'));

-- ── supplier file: details, payments allocated to invoices, scans ─────────
alter table public.tt_providers
  add column if not exists contact text, add column if not exists email text, add column if not exists address text,
  add column if not exists vat_no text, add column if not exists bank text, add column if not exists notes text,
  add column if not exists opening_balance numeric(12,2) not null default 0, add column if not exists opening_date date,
  add column if not exists approved boolean not null default false, add column if not exists cert_expiry date;
alter table public.tt_sup_invoices
  add column if not exists source text not null default 'manual' check (source in ('manual','scan')),
  add column if not exists scan_path text,                 -- storage: invoice-scans/<invoice id>.jpg
  add column if not exists scan_text text;
-- goods line now also carries: {…, loc} — the put-away location of the lot
alter table public.tt_lots add column if not exists location text;
alter table public.tt_ingredients add column if not exists location text;

create table if not exists public.tt_sup_payments (
  id          uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.tt_providers(id) on delete restrict,
  paid_on     date not null default current_date,
  amount      numeric(12,2) not null check (amount > 0),
  method      text not null,
  reference   text,
  note        text,
  created_by  uuid references public.tt_staff(id),
  created_at  timestamptz not null default now()
);
create table if not exists public.tt_sup_payment_alloc (
  payment_id uuid not null references public.tt_sup_payments(id) on delete cascade,
  invoice_id uuid not null references public.tt_sup_invoices(id) on delete cascade,
  amount     numeric(12,2) not null check (amount > 0),
  primary key (payment_id, invoice_id)
);
alter table public.tt_sup_payments enable row level security;
alter table public.tt_sup_payment_alloc enable row level security;
drop policy if exists "sup payments" on public.tt_sup_payments;
create policy "sup payments" on public.tt_sup_payments for all to authenticated
  using (public.tt_has_perm('suppliers_manage')) with check (public.tt_has_perm('suppliers_manage'));
drop policy if exists "sup payment alloc" on public.tt_sup_payment_alloc;
create policy "sup payment alloc" on public.tt_sup_payment_alloc for all to authenticated
  using (public.tt_has_perm('suppliers_manage')) with check (public.tt_has_perm('suppliers_manage'));

-- statement of account per provider: invoices (debit), payments (credit), running balance
create or replace view public.tt_supplier_ledger with (security_invoker = true) as
  select provider_id, entry_date, kind, reference, debit, credit,
         sum(debit - credit) over (partition by provider_id order by entry_date, ord, reference rows unbounded preceding) as balance
  from (
    select provider_id, invoice_date as entry_date, 'invoice' as kind, code as reference, total as debit, 0::numeric as credit, 1 as ord from public.tt_sup_invoices
    union all
    select provider_id, paid_on, 'payment', coalesce(reference, method), 0, amount, 2 from public.tt_sup_payments
    union all
    select id, coalesce(opening_date, created_at::date), 'opening', '—', greatest(opening_balance, 0), greatest(-opening_balance, 0), 0 from public.tt_providers where opening_balance <> 0
  ) e;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('invoice-scans', 'invoice-scans', false, 10485760, array['image/jpeg','image/png','application/pdf'])
on conflict (id) do nothing;
drop policy if exists "invoice scans" on storage.objects;
create policy "invoice scans" on storage.objects for all to authenticated
  using (bucket_id = 'invoice-scans' and (public.tt_has_perm('suppliers_manage') or public.tt_has_perm('inventory_manage')))
  with check (bucket_id = 'invoice-scans' and (public.tt_has_perm('suppliers_manage') or public.tt_has_perm('inventory_manage')));

-- ── children's data: permission + signed confidentiality agreement ───────
insert into public.tt_role_perms (role, key, allowed)
  select r, 'children_view', r = 'super_admin' from unnest(array['super_admin','manager','kitchen','delivery','support']) r
on conflict do nothing;

create table if not exists public.tt_gdpr_agreements (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.tt_staff(id) on delete cascade,
  version     text not null,                    -- e.g. GDPR-CONF-1.0
  full_name   text not null,
  signature   text not null,                    -- PNG data URL of the drawn signature
  user_agent  text,
  signed_at   timestamptz not null default now(),
  revoked_at  timestamptz,
  revoked_by  uuid references public.tt_staff(id),
  revoked_why text
);
create index if not exists tt_gdpr_user on public.tt_gdpr_agreements (user_id, version);
alter table public.tt_gdpr_agreements enable row level security;
drop policy if exists "gdpr own sign" on public.tt_gdpr_agreements;
create policy "gdpr own sign" on public.tt_gdpr_agreements for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "gdpr read" on public.tt_gdpr_agreements;
create policy "gdpr read" on public.tt_gdpr_agreements for select to authenticated
  using (user_id = auth.uid() or public.tt_has_perm('users_manage'));
drop policy if exists "gdpr revoke" on public.tt_gdpr_agreements;
create policy "gdpr revoke" on public.tt_gdpr_agreements for update to authenticated
  using (public.tt_has_perm('users_manage')) with check (public.tt_has_perm('users_manage'));

create or replace function public.tt_can_see_children()
returns boolean language sql stable security definer set search_path = public as $$
  select public.tt_has_perm('children_view') and exists (
    select 1 from tt_gdpr_agreements a where a.user_id = auth.uid() and a.version = 'GDPR-CONF-1.0' and a.revoked_at is null)
$$;

-- Staff no longer read tt_children directly: parents keep full access to their own children;
-- staff read tt_children_staff, where the name is a code unless tt_can_see_children().
drop policy if exists "children read" on public.tt_children;
create policy "children read" on public.tt_children for select to authenticated
  using (family_id = (select public.tt_my_family()) or ((select public.tt_is_staff()) and (select public.tt_can_see_children())));

create or replace view public.tt_children_staff with (security_invoker = false) as
  select c.id, c.family_id,
         case when public.tt_can_see_children() then c.name else 'Child #' || upper(substr(replace(c.id::text, '-', ''), 1, 4)) end as name,
         case when public.tt_can_see_children() then c.dob else null end as dob,
         date_part('year', age(c.dob)) * 12 + date_part('month', age(c.dob)) as age_months,
         c.allergies,                                   -- always visible: food-safety control
         case when public.tt_can_see_children() then c.diet else null end as diet
  from public.tt_children c
  where public.tt_is_staff();
revoke all on public.tt_children_staff from anon;
grant select on public.tt_children_staff to authenticated;
