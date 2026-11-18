const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

test('offline updates validate before replacing the pack and preserve lyrics on failures', async () => {
  const stores = new Map();
  let response;
  let options;
  const context = vm.createContext({
    self: { addEventListener() {}, clients: { matchAll: async () => [] }, location: { origin: 'https://example.test' } },
    Response, AbortSignal, URL, Date, Set, Promise,
    caches: {
      open: async name => { if (!stores.has(name)) stores.set(name, new Map()); const store = stores.get(name); return {
        match: async key => store.get(key)?.clone(),
        put: async (key, value) => store.set(key, value.clone()),
      }; },
      delete: async name => stores.delete(name),
    },
    fetch: async (_, init) => { options = init; if (response instanceof Error) throw response; return response.clone(); },
  });
  vm.runInContext(fs.readFileSync('public/sw.js', 'utf8'), context);
  const run = command => vm.runInContext(`command(${JSON.stringify(command)})`, context);
  assert.equal((await run('CHECK')).status, null);
  const pack = { schemaVersion: 1, revision: 'a'.repeat(64), hymns: [{ id: '001', number: 1, title: 'Original', lyricsText: 'Lyrics', sections: [{ type: 'verse', number: 1, lines: ['Lyrics'] }] }] };
  response = Response.json(pack);
  assert.equal((await run('DOWNLOAD')).status.count, 1);
  assert.equal(options.credentials, 'omit');
  response = new Response(null, { status: 304 });
  await run('CHECK');
  assert.equal(options.headers['If-None-Match'], `"${pack.revision}"`);
  for (const failure of [new Error('Offline'), new Response('Unavailable', { status: 503 }), Response.json({ ...pack, hymns: [] })]) {
    response = failure;
    await assert.rejects(run('CHECK'));
    assert.equal((await run('LIBRARY')).library.hymns[0].title, 'Original');
  }
  response = Response.json({ ...pack, revision: 'b'.repeat(64), hymns: [{ ...pack.hymns[0], title: 'Updated' }] });
  await run('CHECK');
  assert.equal((await run('LIBRARY')).library.hymns[0].title, 'Updated');
  await run('REMOVE');
  assert.equal((await run('STATUS')).status, null);
});
