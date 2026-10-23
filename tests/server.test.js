import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server/index.js';

async function withServer(opts, fn) {
  const app = createApp(opts);
  const srv = app.listen(0);
  const base = `http://127.0.0.1:${srv.address().port}`;
  try { await fn(base); } finally { srv.close(); }
}
const post = (base, path, body) => fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then(async (r) => ({ status: r.status, json: await r.json() }));

test('chat returns 503 with sources when key missing, and never leaks a key', async () => {
  await withServer({ env: {} }, async (base) => {
    const r = await post(base, '/api/chat', { lang: 'en', messages: [{ role: 'user', content: 'What is a router?' }] });
    assert.equal(r.status, 503);
    assert.ok(r.json.sources.length > 0);
    assert.ok(!JSON.stringify(r.json).includes('AIza'));
  });
});

test('chat calls Gemini with key in header, grounds on sources and reports cited ids', async () => {
  let seen;
  const fetchImpl = async (url, init) => {
    seen = { url, init };
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: 'A router connects networks [S1]. Bogus [S99].' }] } }] }) };
  };
  await withServer({ env: { GEMINI_API_KEY: 'test-key' }, fetchImpl }, async (base) => {
    const r = await post(base, '/api/chat', { lang: 'en', messages: [{ role: 'user', content: 'What does a router do?' }] });
    assert.equal(r.status, 200);
    assert.deepEqual(r.json.cited, [1]);
    assert.equal(seen.init.headers['x-goog-api-key'], 'test-key');
    assert.ok(!seen.url.includes('test-key'));
    const body = JSON.parse(seen.init.body);
    assert.match(body.contents.at(-1).parts[0].text, /\[S1\]/);
  });
});

test('upstream errors are reported without crashing', async () => {
  const fetchImpl = async () => ({ ok: false, status: 500, text: async () => 'boom' });
  await withServer({ env: { GEMINI_API_KEY: 'k' }, fetchImpl }, async (base) => {
    const r = await post(base, '/api/chat', { lang: 'en', messages: [{ role: 'user', content: 'hi router' }] });
    assert.equal(r.status, 502);
  });
});

test('search works in Arabic', async () => {
  await withServer({ env: {} }, async (base) => {
    const r = await post(base, '/api/search', { q: 'ما هو التشفير', lang: 'ar' });
    assert.ok(r.json.results.length > 0);
  });
});
