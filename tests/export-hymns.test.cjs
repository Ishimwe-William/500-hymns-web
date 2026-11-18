const { test } = require('node:test');
const assert = require('node:assert/strict');
test('Firestore export preserves IDs, zero refrains, audio, and SQL quotes', async () => {
  const { decode, importSql } = await import('../scripts/export-hymns.mjs');
  const data = decode({ mapValue: { fields: {
    number: { integerValue: '1' }, title: { stringValue: "God's hymn" },
    audioUrl: { stringValue: 'https://example.test/audio' },
    refrains: { arrayValue: { values: [{ mapValue: { fields: { refrainNumber: { integerValue: '0' }, text: { stringValue: 'Real refrain' } } } }] } },
  } } });
  assert.equal(data.refrains[0].refrainNumber, 0);
  const sql = importSql([{ id: '001', data }]);
  assert.match(sql, /'001'/); assert.match(sql, /God''s hymn/);
  assert.match(sql, /"refrainNumber":0/); assert.match(sql, /example.test\/audio/);
  assert.match(sql, /on conflict \(id\) do update/); assert.doesNotMatch(sql, /delete from|truncate/i);
});
test('export rejects empty, invalid, and duplicate records before generating SQL', async () => {
  const { importSql } = await import('../scripts/export-hymns.mjs');
  assert.throws(() => importSql([]), /No hymns/);
  assert.throws(() => importSql([{ id: '001', data: { number: 1 } }]), /Invalid/);
  const item = { id: '001', data: { number: 1, title: 'Actual title' } };
  assert.throws(() => importSql([item, item]), /duplicate/);
});

test('private export preserves explicit admin roles and owner records without overwriting existing accounts', async () => {
  const { userImportSql } = await import('../scripts/export-user-data.mjs');
  const sql = userImportSql({
    users: [{ id: 'uid-admin', data: { role: 'admin', displayName: "User's name" } }, { id: 'uid-reader', data: { role: 'moderator' } }],
    userFavorites: [{ id: 'uid-reader', data: { favorites: ['001'] } }],
    userPreferences: [{ id: 'uid-reader', data: { fontSize: 22 } }],
    userRecent: [{ id: 'uid-reader', data: { hymns: ['002'] } }],
  });
  assert.match(sql, /'uid-admin'.*'admin'/);
  assert.match(sql, /'uid-reader', null, null, 'user'/);
  assert.match(sql, /User''s name/);
  for (const table of ['profiles', 'user_favorites', 'user_preferences', 'user_recent']) assert.match(sql, new RegExp(`insert into public.${table}`));
  assert.match(sql, /on conflict \(firebase_uid\) do nothing/);
  assert.doesNotMatch(sql, /delete from|truncate/i);
});
