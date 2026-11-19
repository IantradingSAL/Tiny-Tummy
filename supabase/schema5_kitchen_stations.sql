-- Tiny Tummy — kitchen stations per role and per person.
-- Run AFTER schema.sql, schema2_operations.sql, schema3_family.sql and schema4_access_gdpr.sql.
-- Mirrors userStations() / roleStations() in dashboard.html and the Roles tab in js/access.js.
--
-- A role carries kitchen stations (e.g. a Chef role with every station, a Prep
-- cook role with Prep only). A person gets the stations of their role plus any
-- extra stations given on their own card. Super admin always has every station;
-- manager has every station unless a row for the role says otherwise.

-- the stations a person was given on top of their role
alter table public.tt_staff add column if not exists stations text[] not null default '{}';

create table if not exists public.tt_role_stations (
  role     text primary key references public.tt_roles(id) on update cascade on delete cascade,
  stations text[] not null default '{}'
    check (stations <@ array['prep','cook','assembly','portion','chill','pack','qc']::text[])
);

-- does the signed-in person work this station?
create or replace function public.tt_has_station(p_station text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from tt_staff s
    left join tt_role_stations rs on rs.role = s.role
    where s.id = auth.uid()
      and (s.role = 'super_admin'
        or p_station = any (s.stations)
        or p_station = any (coalesce(rs.stations,
             case when s.role = 'manager' then array['prep','cook','assembly','portion','chill','pack','qc']::text[] else '{}'::text[] end)))
  ) $$;

alter table public.tt_role_stations enable row level security;
drop policy if exists "role stations read" on public.tt_role_stations;
create policy "role stations read" on public.tt_role_stations for select to authenticated using ((select public.tt_is_staff()));
drop policy if exists "role stations write" on public.tt_role_stations;
create policy "role stations write" on public.tt_role_stations for all to authenticated
  using (public.tt_has_perm('users_manage')) with check (public.tt_has_perm('users_manage'));
