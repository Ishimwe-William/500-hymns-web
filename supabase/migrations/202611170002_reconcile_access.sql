-- Reconcile access for the existing, confirmed hymnbook schema.
-- Preserves all rows and columns; replaces policies on these two tables only.
-- Safe to rerun. Run the ENTIRE file as postgres in Supabase SQL Editor.
begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;


-- Firebase UIDs are text, not the UUIDs expected by auth.uid().
-- Verify issuer/audience as well as subject so another provider's UID cannot
-- inherit permissions from this Firebase project.
create or replace function private.firebase_uid()
returns text language sql stable set search_path = '' as $$
  select case when
    auth.jwt()->>'iss' = 'https://securetoken.google.com/hymns-app-ce0aa'
    and auth.jwt()->>'aud' = 'hymns-app-ce0aa'
  then nullif(auth.jwt()->>'sub', '') end;
$$;

-- Definer lookup avoids recursive RLS when reading one's profile.
create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where firebase_uid = private.firebase_uid() and role = 'admin'
  );
$$;
revoke all on function private.firebase_uid() from public;
revoke all on function private.is_admin() from public;
grant execute on function private.firebase_uid(), private.is_admin() to authenticated, service_role;


create or replace function private.stamp_hymn_edit()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  -- Signed-in app edits must attribute the verified Firebase identity.
  -- Trusted imports without a Firebase identity retain their supplied history.
  if private.firebase_uid() is not null then
    new.updated_by = private.firebase_uid();
  end if;
  return new;
end;
$$;
revoke all on function private.stamp_hymn_edit() from public;
drop trigger if exists stamp_hymn_edit on public.hymns;
create trigger stamp_hymn_edit before insert or update on public.hymns
  for each row execute function private.stamp_hymn_edit();

-- Existing permissive policies could otherwise bypass the new admin policies.
do $$
declare item record;
begin
  for item in select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public' and tablename in ('hymns', 'profiles')
  loop
    execute format('drop policy %I on %I.%I', item.policyname, item.schemaname, item.tablename);
  end loop;
  -- Remove any old column-level grants as well as table-level grants below.
  for item in select table_name, column_name from information_schema.columns
    where table_schema = 'public' and table_name in ('hymns', 'profiles')
  loop
    execute format('revoke all (%I) on public.%I from public, anon, authenticated', item.column_name, item.table_name);
  end loop;
end;
$$;

alter table public.profiles enable row level security;
alter table public.hymns enable row level security;

revoke all on public.profiles, public.hymns from public, anon, authenticated;
grant usage on schema public to anon, authenticated, service_role;
grant select on public.hymns to anon, authenticated;
grant insert, update, delete on public.hymns to authenticated;
grant select on public.profiles to authenticated;
grant all on public.profiles, public.hymns to service_role;

create policy hymns_public_read on public.hymns
  for select to anon, authenticated using (true);
create policy hymns_admin_insert on public.hymns
  for insert to authenticated with check ((select private.is_admin()));
create policy hymns_admin_update on public.hymns
  for update to authenticated using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy hymns_admin_delete on public.hymns
  for delete to authenticated using ((select private.is_admin()));
create policy profiles_owner_or_admin_read on public.profiles
  for select to authenticated using (
    firebase_uid = (select private.firebase_uid()) or (select private.is_admin())
  );
-- No client profile writes: roles are provisioned through trusted tools only.

commit;

-- Verification output: both tables should show rls_enabled = true.
select c.relname as table_name, c.relrowsecurity as rls_enabled,
  (select count(*) from pg_policies p where p.schemaname = 'public'
    and p.tablename = c.relname) as policy_count
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('hymns', 'profiles');
