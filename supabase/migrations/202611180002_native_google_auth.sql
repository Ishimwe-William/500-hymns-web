-- Switch website identity to native Supabase Auth; preserve all legacy rows.
-- Run the ENTIRE file as postgres in SQL Editor, once Google is configured.
begin;

alter table public.profiles add column if not exists id uuid default gen_random_uuid();
alter table public.profiles add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;

-- The old Firebase UID becomes an optional legacy identifier. Do not cascade:
-- unexpected external dependencies should abort this transaction for review.
do $$
declare existing_key record;
begin
  for existing_key in select conname, pg_get_constraintdef(oid) as definition
    from pg_constraint where conrelid = 'public.profiles'::regclass and contype = 'p'
  loop
    if existing_key.definition <> 'PRIMARY KEY (id)' then
      execute format('alter table public.profiles drop constraint %I', existing_key.conname);
    end if;
  end loop;
  if not exists (select 1 from pg_constraint where conrelid = 'public.profiles'::regclass and contype = 'p') then
    alter table public.profiles add primary key (id);
  end if;
end;
$$;
alter table public.profiles alter column firebase_uid drop not null;
create unique index if not exists profiles_legacy_firebase_uid_key on public.profiles(firebase_uid);

create or replace function private.native_user_id()
returns uuid language sql stable set search_path = '' as $$
  select case when auth.jwt()->>'iss' = 'https://apzlragcnmdbjwfjhwhh.supabase.co/auth/v1'
    then auth.uid() end;
$$;
revoke all on function private.native_user_id() from public;
grant execute on function private.native_user_id() to authenticated, service_role;

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles
    where auth_user_id = private.native_user_id() and role = 'admin');
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated, service_role;

-- Google metadata is display information only. Never read a role from it.
create or replace function private.create_native_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, auth_user_id, display_name, email, role)
  values (new.id, new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), new.email, 'user')
  on conflict (auth_user_id) do nothing;
  return new;
end;
$$;
revoke all on function private.create_native_profile() from public;
drop trigger if exists hymnbook_create_profile on auth.users;
create trigger hymnbook_create_profile after insert on auth.users
  for each row execute function private.create_native_profile();

-- Include native Supabase accounts created before this migration. Never link
-- legacy accounts by email or promote them based on Google user metadata.
insert into public.profiles (id, auth_user_id, display_name, email, role)
select id, id, coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name'), email, 'user'
from auth.users on conflict (auth_user_id) do nothing;

create or replace function private.stamp_hymn_edit()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  if private.native_user_id() is not null then new.updated_by = private.native_user_id()::text; end if;
  return new;
end;
$$;
revoke all on function private.stamp_hymn_edit() from public;

-- Replace old owner checks that used Firebase token subjects.
do $$
declare item record; target text;
begin
  for item in select policyname from pg_policies where schemaname = 'public' and tablename = 'profiles'
  loop execute format('drop policy %I on public.profiles', item.policyname); end loop;
  foreach target in array array['user_favorites', 'user_preferences', 'user_recent'] loop
    if to_regclass('public.' || target) is not null then
      for item in select policyname from pg_policies where schemaname = 'public' and tablename = target
      loop execute format('drop policy %I on public.%I', item.policyname, target); end loop;
      execute format('create policy owner_access on public.%I for all to authenticated using (exists (select 1 from public.profiles p where p.firebase_uid = %I.firebase_uid and p.auth_user_id = (select private.native_user_id()))) with check (exists (select 1 from public.profiles p where p.firebase_uid = %I.firebase_uid and p.auth_user_id = (select private.native_user_id())))', target, target, target);
    end if;
  end loop;
end;
$$;
create policy profiles_owner_or_admin_read on public.profiles for select to authenticated
  using (auth_user_id = (select private.native_user_id()) or (select private.is_admin()));
alter table public.profiles enable row level security;
revoke all on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;
grant all on public.profiles to service_role;

commit;

select count(*) as native_profiles from public.profiles where auth_user_id is not null;
