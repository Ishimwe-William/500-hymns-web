-- Preserve the private Firestore collections alongside migrated profiles.
-- Run the entire file in Supabase SQL Editor. No existing rows are removed.
begin;
alter table public.profiles add column if not exists source_data jsonb not null default '{}'::jsonb;

create table if not exists public.user_favorites (
  firebase_uid text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table if not exists public.user_preferences (
  firebase_uid text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table if not exists public.user_recent (
  firebase_uid text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

do $$
declare target text; item record;
begin
  foreach target in array array['user_favorites', 'user_preferences', 'user_recent'] loop
    execute format('alter table public.%I enable row level security', target);
    execute format('revoke all on public.%I from public, anon, authenticated', target);
    execute format('grant select, insert, update, delete on public.%I to authenticated', target);
    execute format('grant all on public.%I to service_role', target);
    for item in select policyname from pg_policies
      where schemaname = 'public' and tablename = target
    loop
      execute format('drop policy %I on public.%I', item.policyname, target);
    end loop;
    execute format('create policy owner_access on public.%I for all to authenticated using (firebase_uid = (select private.firebase_uid())) with check (firebase_uid = (select private.firebase_uid()))', target);
  end loop;
end;
$$;
commit;
