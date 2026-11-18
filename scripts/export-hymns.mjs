// Public Firestore export -> backup JSON + SQL for Supabase SQL Editor.
// Run once reads are available: node --env-file=.env scripts/export-hymns.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export function decode(field) {
  if (!field || 'nullValue' in field) return null;
  if ('stringValue' in field) return field.stringValue;
  if ('integerValue' in field) return Number(field.integerValue);
  if ('doubleValue' in field) return field.doubleValue;
  if ('booleanValue' in field) return field.booleanValue;
  if ('timestampValue' in field) return field.timestampValue;
  if ('arrayValue' in field) return (field.arrayValue.values ?? []).map(decode);
  if ('mapValue' in field) return Object.fromEntries(Object.entries(field.mapValue.fields ?? {}).map(([key, value]) => [key, decode(value)]));
  throw new Error('Unsupported Firestore field type; export stopped.');
}
const literal = (value) => value == null ? 'null' : "'" + String(value).replaceAll("'", "''") + "'";

export function importSql(documents) {
  const seenIds = new Set(), seenNumbers = new Set();
  const columns = ['id', 'number', 'title', 'origin', 'doh', 'category', 'stanzas', 'refrains', 'audio_url', 'youtube', 'youtube_url', 'lyrics_text', 'updated_by'];
  const statements = documents.map(({ id, data }) => {
    const number = Number(data.number);
    if (!id || !Number.isInteger(number) || number < 1 || typeof data.title !== 'string' || !data.title.trim() || seenIds.has(id) || seenNumbers.has(number)) throw new Error('Invalid or duplicate hymn; export stopped.');
    seenIds.add(id); seenNumbers.add(number);
    const uid = typeof data.updatedBy === 'string' ? data.updatedBy : data.updatedBy?.uid;
    const values = [id, number, data.title, data.origin, data.doh ?? data.key, data.category, JSON.stringify(data.stanzas ?? []), JSON.stringify(data.refrains ?? []), data.audioUrl, data.youtube, data.youtubeUrl, data.lyricsText, uid];
    return `insert into public.hymns (${columns.join(', ')}) values (${values.map((value, i) => literal(value) + ([6, 7].includes(i) ? '::jsonb' : '')).join(', ')}) on conflict (id) do update set ${columns.slice(1).map(column => `${column} = excluded.${column}`).join(', ')};`;
  });
  if (!statements.length) throw new Error('No hymns found; no import generated.');
  return ['-- Real Firestore hymn export. Run this entire file in Supabase SQL Editor.', 'begin;', ...statements, 'commit;', 'select count(*) as imported_hymns from public.hymns;', ''].join('\n');
}

async function main() {
  const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!project || !key) throw new Error('Firebase public settings are missing.');
  const documents = [];
  let pageToken;
  do {
    const query = new URLSearchParams({ key, pageSize: '1000' });
    if (pageToken) query.set('pageToken', pageToken);
    const response = await fetch(`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(project)}/databases/(default)/documents/hymns?${query}`, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) {
      if (response.status === 429) throw new Error('Firestore quota is exhausted. Wait for quota recovery; no automatic retries were made.');
      throw new Error(`Firestore export failed (HTTP ${response.status}). No import generated.`);
    }
    const result = await response.json();
    for (const doc of result.documents ?? []) documents.push({ id: decodeURIComponent(doc.name.split('/').at(-1)), data: Object.fromEntries(Object.entries(doc.fields ?? {}).map(([key, value]) => [key, decode(value)])) });
    pageToken = result.nextPageToken;
  } while (pageToken);
  documents.sort((a, b) => Number(a.data.number) - Number(b.data.number));
  const sql = importSql(documents);
  await mkdir('.data', { recursive: true });
  await writeFile('.data/hymns-backup.json', JSON.stringify(documents, null, 2));
  await writeFile('.data/hymns-import.sql', sql);
  console.log(`Exported ${documents.length} real hymns. Backup: .data/hymns-backup.json. Run .data/hymns-import.sql in Supabase SQL Editor.`);
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch(error => { console.error(error instanceof Error ? error.message : 'Export failed.'); process.exitCode = 1; });
}
