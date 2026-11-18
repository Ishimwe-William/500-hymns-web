const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { PGlite } = require('@electric-sql/pglite');

test('native Google schema preserves legacy records and enforces owner/admin access', async () => {
  const db = new PGlite();
  const admin = '11111111-1111-4111-8111-111111111111';
  const reader = '22222222-2222-4222-8222-222222222222';
  const newcomer = '33333333-3333-4333-8333-333333333333';
  const issuer = 'https://apzlragcnmdbjwfjhwhh.supabase.co/auth/v1';
  const asUser = async (id, iss = issuer) => {
    await db.exec('reset role; set role authenticated;');
    await db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify({ sub: id, iss, role: 'authenticated', user_metadata: { role: 'admin' } })]);
  };
  const migration = async name => db.exec(await fs.readFile(new URL(`../supabase/migrations/${name}`, `file://${__filename.replaceAll('\\', '/')}`), 'utf8'));
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth;
      create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);
      create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb) $$;
      create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$;
      grant usage on schema auth to anon, authenticated;
    `);
    await migration('202611170001_hymnbook.sql');
    await migration('202611180001_user_data.sql');
    await db.exec(`insert into public.profiles (firebase_uid, email, role) values ('legacy-admin-uid', 'reader@example.test', 'admin');
      insert into public.hymns (id, number, title) values ('001', 1, 'Real hymn');
      insert into auth.users (id, email, raw_user_meta_data) values ('${reader}', 'reader@example.test', '{"role":"admin"}');`);
    await migration('202611180002_native_google_auth.sql');
    await migration('202611180002_native_google_auth.sql');
    assert.equal((await db.query("select role from public.profiles where firebase_uid = 'legacy-admin-uid'")).rows[0].role, 'admin');
    assert.equal((await db.query('select role from public.profiles where auth_user_id = $1', [reader])).rows[0].role, 'user');
    await db.exec(`insert into auth.users (id, email, raw_user_meta_data) values ('${admin}', 'admin@example.test', '{}'), ('${newcomer}', 'new@example.test', '{"role":"admin"}');`);
    assert.equal((await db.query('select role from public.profiles where auth_user_id = $1', [newcomer])).rows[0].role, 'user');
    await db.query("update public.profiles set role = 'admin' where auth_user_id = $1", [admin]);

    await db.exec('set role anon');
    assert.equal((await db.query('select id from public.hymns')).rows.length, 1);
    await assert.rejects(db.query('select * from public.profiles'), /permission denied/);
    await assert.rejects(db.query("insert into public.hymns (id, number, title) values ('002',2,'Bad write')"), /permission denied/);

    await asUser(reader);
    assert.equal((await db.query('select auth_user_id from public.profiles')).rows.length, 1);
    assert.equal((await db.query("update public.hymns set title = 'Unauthorized' returning id")).rows.length, 0);
    await assert.rejects(db.query("update public.profiles set role = 'admin'"), /permission denied/);
    await assert.rejects(db.query("insert into public.hymns (id, number, title) values ('002',2,'Unauthorized')"), /row-level security/);

    await asUser(admin);
    const edited = await db.query("update public.hymns set title = 'Authorized edit' where id = '001' returning updated_by");
    assert.equal(edited.rows[0].updated_by, admin);
    await asUser(admin, 'https://securetoken.google.com/other-project');
    assert.equal((await db.query('select * from public.profiles')).rows.length, 0);
    assert.equal((await db.query("update public.hymns set title = 'Wrong issuer' returning id")).rows.length, 0);
  } finally { await db.close(); }
});
