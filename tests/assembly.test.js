import test from 'node:test';
import assert from 'node:assert/strict';
import { STEPS, canInstall, canRemove, runPost, scoreFor } from '../src/lab/assembly.js';

test('install order is enforced and every step is reachable', () => {
  const inst = new Set();
  assert.equal(canInstall('cooler', inst).ok, false);
  assert.equal(canInstall('psu', inst).ok, false);
  for (const s of STEPS) { const r = canInstall(s.id, inst); assert.ok(r.ok, `${s.id}: ${JSON.stringify(r.reason)}`); inst.add(s.id); }
  assert.equal(canInstall('cpu', inst).ok, false); // already installed
});
test('removal is blocked while dependants exist and works in reverse order', () => {
  const inst = new Set(STEPS.map((s) => s.id));
  assert.equal(canRemove('cpu', inst).ok, false);
  for (const s of [...STEPS].reverse()) { assert.ok(canRemove(s.id, inst).ok, s.id); inst.delete(s.id); }
  assert.equal(inst.size, 0);
});
test('POST is computed from the real state', () => {
  const all = new Set(STEPS.map((s) => s.id));
  assert.equal(runPost(all).ok, true);
  const noEps = new Set(all); noEps.delete('cableEps'); noEps.delete('sidepanel');
  const r = runPost(noEps); assert.equal(r.ok, false); assert.ok(r.lines.some((l) => !l.ok && /EPS/.test(l.msg.en)));
  assert.equal(runPost(new Set()).ok, false);
  assert.equal(scoreFor(2), 80); assert.equal(scoreFor(99), 40);
});
test('each step has a bilingual question and the dependencies reference known steps', () => {
  const ids = new Set(STEPS.map((s) => s.id));
  for (const s of STEPS) { assert.ok(s.ask.q.en && s.ask.q.ar && s.ask.options.length === 2); for (const r of s.requires) assert.ok(ids.has(r)); }
});
