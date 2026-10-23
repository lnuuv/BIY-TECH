import test from 'node:test';
import assert from 'node:assert/strict';
import { DIALOGUES } from '../src/story/config/dialogues.js';
import { startDialogue, advance, view, validateDialogue } from '../src/story/dialogue.js';
import { computeStations, STUDENT_COUNT, DESK_RUNS, FIXTURES, ROOM } from '../src/story/config/labLayout.js';
import { TINY_STEPS, TINY, tryPlace, tinyPost } from '../src/story/tinyAssembly.js';
import { checkLink, contractorPermanentLinks, RACK_UNITS } from '../src/story/config/network.js';
import { newState, finalChecklist, networkReport, DEVICES, PLAN, STATIONS, rackFits, rackComplete } from '../src/story/storyState.js';
import { SOFTWARE_STEPS } from '../src/story/config/software.js';

test('every dialogue converges on exactly one checkpoint and has no dead ends', () => {
  for (const id of Object.keys(DIALOGUES)) { const r = validateDialogue(id); assert.ok(r.ok, `${id}: ${r.errors.join('; ')}`); }
  assert.equal(validateDialogue('request').checkpoint, 'approval');
  assert.equal(validateDialogue('assign').checkpoint, 'classroom');
});
test('every choice path through the request dialogue reaches approval', () => {
  const walk = (st, depth = 0) => {
    assert.ok(depth < 30);
    if (st.done) { assert.equal(st.checkpoint, 'approval'); return 1; }
    const v = view(st);
    if (v.choices) return v.choices.reduce((n, c) => n + walk(advance(st, c.i), depth + 1), 0);
    return walk(advance(st), depth + 1);
  };
  assert.ok(walk(startDialogue('request')) >= 6);
  const s = startDialogue('request'); assert.deepEqual(advance(s, 9), s); // invalid choice is ignored safely
});
test('layout: exactly 25 student stations, no two overlap, all inside the room', () => {
  const st = computeStations(DESK_RUNS);
  assert.equal(st.length, STUDENT_COUNT); assert.equal(STUDENT_COUNT, 25);
  for (let i = 0; i < st.length; i++) for (let j = i + 1; j < st.length; j++) assert.ok(Math.hypot(st[i].x - st[j].x, st[i].z - st[j].z) > 0.7, `${st[i].id}/${st[j].id}`);
  for (const s of st) { assert.ok(Math.abs(s.x) < ROOM.width / 2 && Math.abs(s.z) < ROOM.depth / 2); }
  // nothing on the right wall in front of the door
  for (const s of st.filter((x) => x.wall === 'right')) assert.ok(s.z > FIXTURES.door.z + FIXTURES.door.w / 2 + 0.3);
  assert.equal(FIXTURES.cabinet.wall, 'back'); assert.ok(FIXTURES.cabinet.x < 0); assert.equal(FIXTURES.ac.x, 0);
});
test('tiny PC: wrong slot and wrong order are explained, full order works, POST needs everything', () => {
  const inst = new Set();
  const w = tryPlace('ram', 'm2slot', new Set(['coverOff'])); assert.equal(w.ok, false); assert.equal(w.kind, 'place'); assert.match(w.reason.en, /SO-DIMM/);
  assert.equal(tryPlace('cooler', 'cpuTop', new Set(['coverOff'])).kind, 'order');
  for (const s of TINY_STEPS) { const r = tryPlace(s.id, s.slot, inst); assert.ok(r.ok, `${s.id}: ${JSON.stringify(r.reason)}`); inst.add(s.id); }
  assert.equal(tinyPost(inst).ok, true);
  const noDp = new Set(inst); noDp.delete('display'); assert.equal(tinyPost(noDp).ok, false);
  assert.ok(!TINY_STEPS.some((s) => s.id === 'gpu'), 'integrated graphics: no discrete GPU step');
});
test('network: link checks, contractor fault is detected, a correct network passes', () => {
  assert.equal(checkLink('dev:S01', 'out:S01', PLAN).ok, true);
  assert.equal(checkLink('dev:S01', 'pp:2', PLAN).ok, false);
  const links = [];
  for (const d of DEVICES) { links.push({ a: `dev:${d.id}`, b: `out:${d.id}` }, { a: `pp:${PLAN[d.id]}`, b: `sw:${PLAN[d.id]}` }); }
  const perm = DEVICES.filter((d) => d.kind !== 'student').map((d) => ({ a: `out:${d.id}`, b: `pp:${PLAN[d.id]}` }));
  const bad = [...links, ...perm, ...contractorPermanentLinks(DEVICES, PLAN), { a: 'sw:48', b: 'up' }];
  const r = networkReport(bad); assert.equal(r.ok, false);
  assert.deepEqual(r.per.filter((p) => !p.ok).map((p) => p.id).sort(), ['S14', 'S15']);
  const good = [...links, ...DEVICES.map((d) => ({ a: `out:${d.id}`, b: `pp:${PLAN[d.id]}` })), { a: 'sw:48', b: 'up' }];
  assert.equal(networkReport(good).ok, true);
  assert.equal(DEVICES.length, 28);
});
test('rack placement and final checklist reflect the real state', () => {
  assert.equal(rackFits(2, 'cmB'), true); assert.equal(rackFits(1, 'switch'), false);
  const placed = Object.fromEntries(RACK_UNITS.map((r) => [r.u, r.accepts])); assert.equal(rackComplete(placed), true);
  const s = newState(); const c = finalChecklist(s); assert.equal(c.ok, false); assert.ok(c.items.every((i) => i.stage));
  s.furniture.placed = true; s.asm = { installed: TINY_STEPS.map((x) => x.id), postOk: true, mistakes: 0 };
  s.sw = { done: SOFTWARE_STEPS.map((x) => x.id), verified: true, imaged: true }; s.deploy.deployed = STATIONS.map((x) => x.id);
  s.rack.placed = placed; s.netVerified = true;
  s.links = [...DEVICES.flatMap((d) => [{ a: `dev:${d.id}`, b: `out:${d.id}` }, { a: `out:${d.id}`, b: `pp:${PLAN[d.id]}` }, { a: `pp:${PLAN[d.id]}`, b: `sw:${PLAN[d.id]}` }]), { a: 'sw:48', b: 'up' }];
  s.periph = { printer: { placed: true, ok: true }, ups: { placed: true, ok: true }, display: { placed: true, ok: true } };
  assert.equal(finalChecklist(s).ok, true);
  s.deploy.deployed = s.deploy.deployed.slice(1); assert.equal(finalChecklist(s).ok, false);
});
