-- Tiny Tummy — Family Portal schema (portal.html backend)
-- Run AFTER schema.sql and schema2_operations.sql.
--
-- Who can see what:
--   • Parents sign in with Supabase Auth (phone OTP or email link). A parent
--     sees ONLY their own family, children and the records below.
--   • Staff (rows in tt_staff) see children's names, ages and allergies so
--     the kitchen can stop unsafe orders; they never see photos or notes
--     unless they hold the matching permission.
--   • Doctors do not get an account. The parent shares a per-child link with
--     a random token; only its SHA-256 hash is stored. Doctors reach the
--     record through security-definer functions that check the token, and
--     the parent can revoke the link at any time.
--
-- Also tightens the read policies from schema.sql / schema2 that allowed
-- ANY signed-in user (which will now include parents) to read staff-only
-- data such as every customer's orders.

create extension if not exists pgcrypto;

-- ── helpers ──────────────────────────────────────────────────────────────
create or replace function public.tt_is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from tt_staff s where s.id = auth.uid());
$$;

-- ── families & children ──────────────────────────────────────────────────
create table if not exists public.tt_families (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users(id) on delete cascade,
  parent_name text not null default '',
  phone       text,
  email       text,
  address     text,
  created_at  timestamptz not null default now()
);

create table if not exists public.tt_children (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references public.tt_families(id) on delete cascade,
  name          text not null check (length(name) between 1 and 60),
  sex           text check (sex in ('girl','boy')),
  dob           date not null check (dob <= current_date),
  allergies     text[] not null default '{}',
  diet          text not null default '',
  doctor_name   text not null default '',
  doctor_phone  text not null default '',
  avatar_path   text,                       -- storage: child-photos/<family>/<child>/avatar.jpg
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists tt_children_family_idx on public.tt_children(family_id);

drop trigger if exists tt_children_touch on public.tt_children;
create trigger tt_children_touch before update on public.tt_children
  for each row execute function public.touch_updated_at();

create or replace function public.tt_my_family()
returns uuid language sql stable security definer set search_path = public as $$
  select id from tt_families where user_id = auth.uid();
$$;
create or replace function public.tt_is_my_child(p_child uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from tt_children c join tt_families f on f.id = c.family_id
                  where c.id = p_child and f.user_id = auth.uid());
$$;

-- ── child records ────────────────────────────────────────────────────────
create table if not exists public.tt_growth (
  id          uuid primary key default gen_random_uuid(),
  child_id    uuid not null references public.tt_children(id) on delete cascade,
  measured_on date not null check (measured_on <= current_date),
  weight_kg   numeric(5,2) check (weight_kg between 0.5 and 60),
  height_cm   numeric(5,1) check (height_cm between 25 and 160),
  added_by    text not null default 'parent',
  created_at  timestamptz not null default now(),
  check (weight_kg is not null or height_cm is not null)
);
create index if not exists tt_growth_child_idx on public.tt_growth(child_id, measured_on);

create table if not exists public.tt_child_photos (
  id           uuid primary key default gen_random_uuid(),
  child_id     uuid not null references public.tt_children(id) on delete cascade,
  taken_on     date not null default current_date,
  storage_path text not null,               -- child-photos/<family>/<child>/<uuid>.jpg
  caption      text not null default '' check (length(caption) <= 80),
  created_at   timestamptz not null default now()
);
create index if not exists tt_child_photos_child_idx on public.tt_child_photos(child_id, taken_on);

create table if not exists public.tt_vaccines (
  id         uuid primary key default gen_random_uuid(),
  child_id   uuid not null references public.tt_children(id) on delete cascade,
  name       text not null check (length(name) between 1 and 100),
  due_on     date not null,
  given_on   date,
  note       text not null default '',
  set_by     text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists tt_vaccines_child_idx on public.tt_vaccines(child_id, due_on);

create table if not exists public.tt_doctor_notes (
  id         uuid primary key default gen_random_uuid(),
  child_id   uuid not null references public.tt_children(id) on delete cascade,
  noted_on   date not null default current_date,
  author     text not null,
  body       text not null check (length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists tt_doctor_notes_child_idx on public.tt_doctor_notes(child_id, noted_on);

-- Doctor share links: only the hash of the token is stored.
create table if not exists public.tt_doctor_links (
  token_hash  text primary key,
  child_id    uuid not null references public.tt_children(id) on delete cascade,
  doctor_name text not null default '',
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '1 year',
  revoked_at  timestamptz
);
create index if not exists tt_doctor_links_child_idx on public.tt_doctor_links(child_id);

-- One-time greetings / alerts already sent (birthday, milestone, vaccine).
create table if not exists public.tt_greetings (
  key     text primary key,
  sent_at timestamptz not null default now()
);

-- Orders: which child an order is for (kitchen allergy checks, food diary).
alter table public.orders add column if not exists child_id uuid references public.tt_children(id) on delete set null;
alter table public.orders add column if not exists family_id uuid references public.tt_families(id) on delete set null;
alter table public.orders add column if not exists batch_lot text;
create index if not exists orders_child_idx on public.orders(child_id);
create index if not exists orders_family_idx on public.orders(family_id);
-- The dashboard pipeline has more stages than the first website schema.
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('new','confirmed','kitchen','portioning','qc','dispatch','delivering','delivered','cancelled','preparing'));

-- ── row level security ───────────────────────────────────────────────────
alter table public.tt_families     enable row level security;
alter table public.tt_children     enable row level security;
alter table public.tt_growth       enable row level security;
alter table public.tt_child_photos enable row level security;
alter table public.tt_vaccines     enable row level security;
alter table public.tt_doctor_notes enable row level security;
alter table public.tt_doctor_links enable row level security;
alter table public.tt_greetings    enable row level security;

-- families: the parent owns their row; staff with orders_manage can read it.
drop policy if exists "family own read" on public.tt_families;
create policy "family own read" on public.tt_families for select to authenticated
  using (user_id = (select auth.uid()) or (select public.tt_has_perm('orders_manage')));
drop policy if exists "family own insert" on public.tt_families;
create policy "family own insert" on public.tt_families for insert to authenticated
  with check (user_id = (select auth.uid()));
drop policy if exists "family own update" on public.tt_families;
create policy "family own update" on public.tt_families for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- children: parent full control; staff read (allergies for the kitchen).
drop policy if exists "children read" on public.tt_children;
create policy "children read" on public.tt_children for select to authenticated
  using (family_id = (select public.tt_my_family()) or (select public.tt_is_staff()));
drop policy if exists "children insert" on public.tt_children;
create policy "children insert" on public.tt_children for insert to authenticated
  with check (family_id = (select public.tt_my_family()));
drop policy if exists "children update" on public.tt_children;
create policy "children update" on public.tt_children for update to authenticated
  using (family_id = (select public.tt_my_family())) with check (family_id = (select public.tt_my_family()));
drop policy if exists "children delete" on public.tt_children;
create policy "children delete" on public.tt_children for delete to authenticated
  using (family_id = (select public.tt_my_family()));

-- growth & photos: parent full control.
drop policy if exists "growth parent" on public.tt_growth;
create policy "growth parent" on public.tt_growth for all to authenticated
  using (child_id in (select c.id from public.tt_children c where c.family_id = (select public.tt_my_family()))) with check (child_id in (select c.id from public.tt_children c where c.family_id = (select public.tt_my_family())));
drop policy if exists "photos parent" on public.tt_child_photos;
create policy "photos parent" on public.tt_child_photos for all to authenticated
  using (child_id in (select c.id from public.tt_children c where c.family_id = (select public.tt_my_family()))) with check (child_id in (select c.id from public.tt_children c where c.family_id = (select public.tt_my_family())));

-- vaccines: parent reads, adds and marks done; doctors write through the RPCs below.
drop policy if exists "vaccines parent read" on public.tt_vaccines;
create policy "vaccines parent read" on public.tt_vaccines for select to authenticated
  using (child_id in (select c.id from public.tt_children c where c.family_id = (select public.tt_my_family())));
drop policy if exists "vaccines parent insert" on public.tt_vaccines;
create policy "vaccines parent insert" on public.tt_vaccines for insert to authenticated
  with check (child_id in (select c.id from public.tt_children c where c.family_id = (select public.tt_my_family())));
drop policy if exists "vaccines parent update" on public.tt_vaccines;
create policy "vaccines parent update" on public.tt_vaccines for update to authenticated
  using (child_id in (select c.id from public.tt_children c where c.family_id = (select public.tt_my_family()))) with check (child_id in (select c.id from public.tt_children c where c.family_id = (select public.tt_my_family())));

-- doctor notes: parent reads only (doctors write through the RPC).
drop policy if exists "notes parent read" on public.tt_doctor_notes;
create policy "notes parent read" on public.tt_doctor_notes for select to authenticated
  using (child_id in (select c.id from public.tt_children c where c.family_id = (select public.tt_my_family())));

-- doctor links: the parent sees and revokes their own child's links.
drop policy if exists "links parent read" on public.tt_doctor_links;
create policy "links parent read" on public.tt_doctor_links for select to authenticated
  using (child_id in (select c.id from public.tt_children c where c.family_id = (select public.tt_my_family())));
drop policy if exists "links parent update" on public.tt_doctor_links;
create policy "links parent update" on public.tt_doctor_links for update to authenticated
  using (child_id in (select c.id from public.tt_children c where c.family_id = (select public.tt_my_family()))) with check (child_id in (select c.id from public.tt_children c where c.family_id = (select public.tt_my_family())));

-- greetings: staff only.
drop policy if exists "greetings staff" on public.tt_greetings;
create policy "greetings staff" on public.tt_greetings for all to authenticated
  using ((select public.tt_is_staff())) with check ((select public.tt_is_staff()));

-- ── tighten staff-only reads now that parents can sign in ────────────────
drop policy if exists "staff read orders" on public.orders;
create policy "staff read orders" on public.orders for select to authenticated
  using ((select public.tt_is_staff())
         or family_id = (select public.tt_my_family())
         or (child_id is not null and child_id in (select c.id from public.tt_children c where c.family_id = (select public.tt_my_family()))));
drop policy if exists "staff update orders" on public.orders;
create policy "staff update orders" on public.orders for update to authenticated
  using ((select public.tt_has_perm('orders_manage'))) with check ((select public.tt_has_perm('orders_manage')));

drop policy if exists "staff read all products" on public.products;
create policy "staff read all products" on public.products for select to authenticated
  using (available or (select public.tt_is_staff()));

drop policy if exists "staff read own profile" on public.tt_staff;
create policy "staff read own profile" on public.tt_staff for select to authenticated using ((select public.tt_is_staff()));
drop policy if exists "read role perms" on public.tt_role_perms;
create policy "read role perms" on public.tt_role_perms for select to authenticated using ((select public.tt_is_staff()));
drop policy if exists "read own user perms" on public.tt_user_perms;
create policy "read own user perms" on public.tt_user_perms for select to authenticated using ((select public.tt_is_staff()));
drop policy if exists "lots read" on public.tt_lots;
create policy "lots read" on public.tt_lots for select to authenticated using ((select public.tt_is_staff()));
drop policy if exists "agents read" on public.tt_agents;
create policy "agents read" on public.tt_agents for select to authenticated using ((select public.tt_is_staff()));
drop policy if exists "reqs read" on public.tt_requisitions;
create policy "reqs read" on public.tt_requisitions for select to authenticated using ((select public.tt_is_staff()));
drop policy if exists "iso read" on public.tt_iso;
create policy "iso read" on public.tt_iso for select to authenticated using ((select public.tt_is_staff()));
drop policy if exists "settings read" on public.tt_settings;
create policy "settings read" on public.tt_settings for select to authenticated using ((select public.tt_is_staff()));
-- Ingredients and recipes stay readable by families (the food diary shows them).
drop policy if exists "inventory read" on public.tt_ingredients;
create policy "inventory read" on public.tt_ingredients for select to authenticated using (true);
drop policy if exists "bom read" on public.tt_bom;
create policy "bom read" on public.tt_bom for select to authenticated using (true);

-- ── doctor access (no account; token checked server-side) ───────────────
create or replace function public.tt_doctor_child(p_token text)
returns uuid language sql stable security definer set search_path = public as $$
  select l.child_id from tt_doctor_links l
   where l.token_hash = encode(digest(p_token, 'sha256'), 'hex')
     and l.revoked_at is null and l.expires_at > now();
$$;
revoke all on function public.tt_doctor_child(text) from public, anon, authenticated;

-- Parent creates (or replaces) the share link for one child; returns the raw
-- token once. Older links for that child are revoked.
create or replace function public.tt_create_doctor_link(p_child uuid, p_doctor text)
returns text language plpgsql security definer set search_path = public as $$
declare v_token text;
begin
  if not tt_is_my_child(p_child) then raise exception 'not your child'; end if;
  update tt_doctor_links set revoked_at = now() where child_id = p_child and revoked_at is null;
  v_token := encode(gen_random_bytes(24), 'hex');
  insert into tt_doctor_links(token_hash, child_id, doctor_name)
  values (encode(digest(v_token, 'sha256'), 'hex'), p_child, coalesce(p_doctor, ''));
  return v_token;
end $$;

-- Full record for the doctor view (read-only JSON).
create or replace function public.tt_doctor_record(p_token text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_child uuid := tt_doctor_child(p_token);
begin
  if v_child is null then return null; end if;
  return jsonb_build_object(
    'child',   (select to_jsonb(c) - 'avatar_path' from tt_children c where c.id = v_child),
    'family',  (select jsonb_build_object('parent_name', f.parent_name) from tt_children c join tt_families f on f.id = c.family_id where c.id = v_child),
    'doctor',  (select doctor_name from tt_doctor_links where token_hash = encode(digest(p_token, 'sha256'), 'hex')),
    'growth',  coalesce((select jsonb_agg(to_jsonb(g) order by g.measured_on) from tt_growth g where g.child_id = v_child), '[]'),
    'vaccines',coalesce((select jsonb_agg(to_jsonb(v) order by v.due_on) from tt_vaccines v where v.child_id = v_child), '[]'),
    'notes',   coalesce((select jsonb_agg(to_jsonb(n) order by n.noted_on desc) from tt_doctor_notes n where n.child_id = v_child), '[]'),
    'photos',  coalesce((select jsonb_agg(to_jsonb(p) order by p.taken_on desc) from tt_child_photos p where p.child_id = v_child), '[]'),
    'orders',  coalesce((select jsonb_agg(jsonb_build_object('id', o.id, 'items', o.items, 'status', o.status, 'created_at', o.created_at, 'batch_lot', o.batch_lot) order by o.created_at desc)
                          from orders o where o.child_id = v_child), '[]')
  );
end $$;

create or replace function public.tt_doctor_add_note(p_token text, p_body text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_child uuid := tt_doctor_child(p_token); v_id uuid; v_doc text;
begin
  if v_child is null then raise exception 'link not valid'; end if;
  select doctor_name into v_doc from tt_doctor_links where token_hash = encode(digest(p_token, 'sha256'), 'hex');
  insert into tt_doctor_notes(child_id, author, body) values (v_child, coalesce(nullif(v_doc, ''), 'Doctor'), p_body) returning id into v_id;
  return v_id;
end $$;

create or replace function public.tt_doctor_add_vaccine(p_token text, p_name text, p_due date, p_given date, p_note text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_child uuid := tt_doctor_child(p_token); v_id uuid; v_doc text;
begin
  if v_child is null then raise exception 'link not valid'; end if;
  select doctor_name into v_doc from tt_doctor_links where token_hash = encode(digest(p_token, 'sha256'), 'hex');
  insert into tt_vaccines(child_id, name, due_on, given_on, note, set_by)
  values (v_child, p_name, p_due, p_given, coalesce(p_note, ''), coalesce(nullif(v_doc, ''), 'Doctor')) returning id into v_id;
  return v_id;
end $$;

create or replace function public.tt_doctor_vaccine_given(p_token text, p_vaccine uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_child uuid := tt_doctor_child(p_token);
begin
  if v_child is null then raise exception 'link not valid'; end if;
  update tt_vaccines set given_on = current_date where id = p_vaccine and child_id = v_child;
end $$;

grant execute on function public.tt_doctor_record(text) to anon, authenticated;
grant execute on function public.tt_doctor_add_note(text, text) to anon, authenticated;
grant execute on function public.tt_doctor_add_vaccine(text, text, date, date, text) to anon, authenticated;
grant execute on function public.tt_doctor_vaccine_given(text, uuid) to anon, authenticated;
grant execute on function public.tt_create_doctor_link(uuid, text) to authenticated;
revoke execute on function public.tt_create_doctor_link(uuid, text) from anon;

-- ── private photo storage ────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('child-photos', 'child-photos', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- Files live at <family_id>/<child_id>/<file>; only that family can touch them.
drop policy if exists "child photos family read" on storage.objects;
create policy "child photos family read" on storage.objects for select to authenticated
  using (bucket_id = 'child-photos' and (storage.foldername(name))[1] = (select public.tt_my_family())::text);
drop policy if exists "child photos family write" on storage.objects;
create policy "child photos family write" on storage.objects for insert to authenticated
  with check (bucket_id = 'child-photos' and (storage.foldername(name))[1] = (select public.tt_my_family())::text);
drop policy if exists "child photos family delete" on storage.objects;
create policy "child photos family delete" on storage.objects for delete to authenticated
  using (bucket_id = 'child-photos' and (storage.foldername(name))[1] = (select public.tt_my_family())::text);

-- Doctor view: short-lived signed photo URLs are created by an edge function
-- with the service key after tt_doctor_child() validates the token.
