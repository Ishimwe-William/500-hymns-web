// Trusted, read-only export. Never writes to Firebase or prints credentials.
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { decode } from './export-hymns.mjs';

const literal = value => value == null ? 'null' : "'" + String(value).replaceAll("'", "''") + "'";
const collections = { userFavorites: 'user_favorites', userPreferences: 'user_preferences', userRecent: 'user_recent' };

export function userImportSql(backup) {
  const statements = [];
  for (const { id, data } of backup.users ?? []) {
    if (typeof id !== 'string' || !id) throw new Error('Invalid Firebase UID.');
    const role = data.role === 'admin' ? 'admin' : 'user';
    statements.push(`insert into public.profiles (firebase_uid, display_name, email, role, source_data) values (${literal(id)}, ${literal(data.displayName ?? data.name)}, ${literal(data.email)}, ${literal(role)}, ${literal(JSON.stringify(data))}::jsonb) on conflict (firebase_uid) do nothing;`);
  }
  for (const [source, target] of Object.entries(collections)) {
    for (const { id, data } of backup[source] ?? []) {
      if (typeof id !== 'string' || !id) throw new Error('Invalid Firebase UID.');
      statements.push(`insert into public.${target} (firebase_uid, data) values (${literal(id)}, ${literal(JSON.stringify(data))}::jsonb) on conflict (firebase_uid) do nothing;`);
    }
  }
  if (!statements.length) throw new Error('No private records found.');
  return ['-- Private user import. Apply the user-data schema migration first.', '-- Existing Supabase rows are preserved. No automatic role promotion.', 'begin;', ...statements, 'commit;', "select 'profiles' as collection, count(*) from public.profiles union all select 'user_favorites', count(*) from public.user_favorites union all select 'user_preferences', count(*) from public.user_preferences union all select 'user_recent', count(*) from public.user_recent;", ''].join('\n');
}

async function main() {
  const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!project) throw new Error('Firebase project configuration is missing.');
  let token = process.env.FIREBASE_ACCESS_TOKEN;
  if (!token && process.env.FIREBASE_CLI_AUTH_MODULE) {
    const auth = createRequire(import.meta.url)(process.env.FIREBASE_CLI_AUTH_MODULE);
    const account = auth.getGlobalDefaultAccount();
    if (!account) throw new Error('Run firebase login --reauth first.');
    try { token = (await auth.getAccessToken(account.tokens.refresh_token, ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/firebase'])).access_token; }
    catch { throw new Error('Firebase CLI access has expired. Run firebase login --reauth.'); }
  }
  if (!token) throw new Error('Trusted Firebase access is required. Configure FIREBASE_ACCESS_TOKEN or FIREBASE_CLI_AUTH_MODULE locally; never paste tokens into chat.');
  const backup = {};
  for (const collection of ['users', ...Object.keys(collections)]) {
    const rows = [];
    let pageToken;
    do {
      const query = new URLSearchParams({ pageSize: '1000' });
      if (pageToken) query.set('pageToken', pageToken);
      const response = await fetch(`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(project)}/databases/(default)/documents/${collection}?${query}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`Protected export failed (HTTP ${response.status}). No import generated. Check Firebase CLI login and project IAM access.`);
      const result = await response.json();
      for (const doc of result.documents ?? []) rows.push({ id: decodeURIComponent(doc.name.split('/').at(-1)), data: Object.fromEntries(Object.entries(doc.fields ?? {}).map(([key, value]) => [key, decode(value)])) });
      pageToken = result.nextPageToken;
    } while (pageToken);
    backup[collection] = rows;
  }
  const sql = userImportSql(backup);
  await mkdir('.data', { recursive: true });
  await writeFile('.data/users-backup.json', JSON.stringify(backup, null, 2));
  await writeFile('.data/users-import.sql', sql);
  console.log(JSON.stringify({ exported: Object.fromEntries(Object.entries(backup).map(([name, rows]) => [name, rows.length])), backup: '.data/users-backup.json', import: '.data/users-import.sql' }));
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main().catch(error => { console.error(error instanceof Error ? error.message : 'Private export failed.'); process.exitCode = 1; });
