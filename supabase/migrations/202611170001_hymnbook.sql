-- Initial schema for Firebase-authenticated web and mobile clients.
-- Enable the Firebase third-party Auth integration before authenticated access.
begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.profiles (
  firebase_uid text primary key check (length(firebase_uid) > 0),
  display_name text,
  email text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- Firebase UIDs are text, not the UUIDs expected by auth.uid().
-- Verify issuer/audience as well as subject so another provider's UID cannot
-- inherit permissions from this Firebase project.
create function private.firebase_uid()
returns text language sql stable set search_path = '' as $$
  select case when
    auth.jwt()->>'iss' = 'https://securetoken.google.com/hymns-app-ce0aa'
    and auth.jwt()->>'aud' = 'hymns-app-ce0aa'
  then nullif(auth.jwt()->>'sub', '') end;
$$;

-- Definer lookup avoids recursive RLS when reading one's profile.
create function private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where firebase_uid = private.firebase_uid() and role = 'admin'
  );
$$;
revoke all on function private.firebase_uid() from public;
revoke all on function private.is_admin() from public;
grant execute on function private.firebase_uid(), private.is_admin() to authenticated;

create table public.hymns (
  id text primary key check (length(id) > 0),
  number integer not null unique check (number > 0),
  title text not null check (length(trim(title)) > 0),
  origin text,
  doh text,
  category text,
  stanzas jsonb not null default '[]'::jsonb
    check (jsonb_typeof(stanzas) in ('array', 'object')),
  refrains jsonb not null default '[]'::jsonb
    check (jsonb_typeof(refrains) in ('array', 'object')),
  audio_url text,
  youtube text,
  youtube_url text,
  lyrics_text text,
  updated_at timestamptz not null default now(),
  updated_by text
);

create function private.stamp_hymn_edit()
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
create trigger stamp_hymn_edit before insert or update on public.hymns
  for each row execute function private.stamp_hymn_edit();

alter table public.profiles enable row level security;
alter table public.hymns enable row level security;

revoke all on public.profiles, public.hymns from anon, authenticated;
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
