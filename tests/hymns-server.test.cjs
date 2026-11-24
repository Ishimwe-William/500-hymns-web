const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const compile = path => ts.transpileModule(fs.readFileSync(require.resolve(path), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const sections = { exports: {} };
new Function('exports', 'require', 'module', compile('../lib/hymn-sections.ts'))(sections.exports, require, sections);
function loader({ rows = [], error, batches } = {}) {
  const calls = [], lifetimes = [];
  const deps = {
    '@/lib/cache-tags': { HYMNS_CACHE_TAG: 'hymns' },
    '@/lib/hymn-sections': sections.exports,
    '@/lib/hymns': { lyricsTextFor: sections => sections.flatMap(s => s.lines).join('\n') },
    'next/cache': { cacheTag() {}, cacheLife: value => lifetimes.push(value) },
    'next/navigation': { unstable_rethrow: e => { if (e.internal) throw e; } },
    '@/lib/supabase': { supabaseRequest: async (path, options) => {
      calls.push({ path, options });
      if (error) throw error;
      const query = new URLSearchParams(path.split('?')[1]);
      if (query.has('id')) return rows.filter(row => row.id === query.get('id').slice(3));
      return batches ? batches.shift() : rows;
    } },
  };
  const m = { exports: {} };
  new Function('exports', 'require', 'module', compile('../lib/hymns-server.ts'))(m.exports, name => { assert.ok(name in deps, name); return deps[name]; }, m);
  return { ...m.exports, calls, lifetimes };
}
test('Supabase failures throw instead of caching an empty hymnbook', async () => {
  const h = loader({ error: new Error('Quota exceeded') });
  await assert.rejects(h.getHymns(), /temporarily unavailable/);
  assert.deepEqual(h.lifetimes, ['hours']);
});
test('a genuinely empty Supabase table stays empty with a stable lifetime', async () => {
  const h = loader(); assert.deepEqual(await h.getHymns(), []); assert.deepEqual(h.lifetimes, ['hours']);
});
test('real rows map SQL field names, preserve zero sections, and exclude invalid rows', async () => {
  const h = loader({ rows: [{ id: '001', number: 1, title: 'Real hymn', audio_url: 'https://example.test/audio', origin: 'Original', refrains: [{ refrainNumber: 0, text: 'Opening refrain' }], stanzas: [{ stanzaNumber: 1, text: 'Actual lyrics' }] }, { id: '002', number: 2 }] });
  const rows = await h.getHymns();
  assert.equal(rows.length, 1); assert.equal(rows[0].id, '001'); assert.equal(rows[0].sections[0].number, 0); assert.equal(rows[0].hasAudio, true); assert.match(rows[0].lyricsText, /Actual lyrics/);
  assert.equal(h.calls[0].options.cache, 'force-cache');
  assert.equal(h.calls[0].options.next.revalidate, 86400);
  assert.deepEqual(h.calls[0].options.next.tags, ['hymns']);
});
test('library pagination does not silently truncate at the Data API limit', async () => {
  const batch = Array.from({ length: 500 }, (_, i) => ({ id: String(i + 1), number: i + 1, title: 'Real record' }));
  const h = loader({ batches: [batch, [{ id: '501', number: 501, title: 'Last record' }]] });
  assert.equal((await h.getHymns()).length, 501);
  assert.match(h.calls[1].path, /offset=500/);
});
test('Next internal signals are rethrown unchanged', async () => {
  const internal = Object.assign(new Error('Prerender'), { internal: true });
  const h = loader({ error: internal }); await assert.rejects(h.getHymns(), e => e === internal);
});

test('offline downloads bypass public caches and reject empty or invalid libraries', async () => {
  const h = loader({ rows: [{ id: '001', number: 1, title: 'Fresh hymn', stanzas: [{ stanzaNumber: 1, text: 'Fresh lyrics' }] }] });
  assert.equal((await h.getFreshHymns())[0].title, 'Fresh hymn');
  assert.equal(h.calls[0].options.cache, 'no-store');
  await assert.rejects(loader().getFreshHymns(), /unavailable/);
  await assert.rejects(loader({ rows: [{ id: '001', number: 1 }] }).getFreshHymns(), /Invalid/);
});
test('details reuse the shared cached library without issuing per-hymn queries', async () => {
  const h = loader({ rows: [{ id: '001', number: 1, title: 'Real hymn', youtube_url: 'https://example.test/video' }] });
  assert.equal((await h.getHymnById('001')).youtubeUrl, 'https://example.test/video');
  assert.equal(h.calls.length, 1); assert.match(h.calls[0].path, /order=number.asc,id.asc/);
  assert.ok(!h.calls[0].path.includes('id=eq.'));
  assert.equal(await h.getHymnById('missing'), undefined);
  assert.equal(await h.getHymnById('../bad'), undefined);
});
