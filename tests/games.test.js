import test from 'node:test';
import assert from 'node:assert/strict';
import { SPRINT, SPRINT_VOCAB, buildSprintRound, pickDistractors } from '../shared/content/games.js';
import { SHORTCUTS } from '../shared/content/shortcuts.js';

const norm = (s) => String(s).toLowerCase().replace(/\s+/g, ' ').trim();
function seeded(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

test('sprint: every round has 4 distinct options with exactly one correct answer', () => {
  const random = seeded(42);
  for (let pass = 0; pass < 3; pass++) {
    for (const q of SPRINT) {
      const r = buildSprintRound(q, { random });
      assert.equal(r.options.length, 4, q.id);
      assert.equal(new Set(r.options.map((o) => norm(o.text))).size, 4, `${q.id}: duplicate option`);
      assert.equal(r.options.filter((o) => o.correct).length, 1, `${q.id}: exactly one correct`);
      assert.equal(r.options[r.answerIndex].text, q.answer);
      assert.ok(r.options.filter((o) => !o.correct).every((o) => norm(o.text) !== norm(q.answer)));
      assert.ok(r.options.every((o) => o.id.startsWith(`${q.id}:`)), 'options are tied to their own question');
    }
  }
});

test('sprint: distractors are not one fixed set and vary between questions and plays', () => {
  const random = seeded(7);
  const sets = SPRINT.map((q) => buildSprintRound(q, { random }).options.filter((o) => !o.correct).map((o) => o.text).sort().join('|'));
  assert.ok(new Set(sets).size > SPRINT.length * 0.9, 'different questions get different distractors');
  // the same glossary question replayed gets different distractors
  const q = SPRINT.find((x) => x.id.startsWith('shortcut-'));
  const replays = new Set(Array.from({ length: 12 }, () => buildSprintRound(q, { random }).options.filter((o) => !o.correct).map((o) => o.text).sort().join('|')));
  assert.ok(replays.size > 6);
  // the static compatibility field is no longer the same three terms everywhere
  const counts = new Map();
  for (const x of SPRINT) for (const o of x.options) if (o !== x.answer) counts.set(o, (counts.get(o) || 0) + 1);
  assert.ok(Math.max(...counts.values()) < SPRINT.length * 0.1, 'no distractor dominates the question set');
});

test('sprint: glossary distractors come from the same category and never mean the same thing', () => {
  const random = seeded(99);
  const byCode = new Map(SHORTCUTS.map((s) => [norm(s.code), s]));
  let sameCat = 0, total = 0;
  for (const q of SPRINT.filter((x) => x.id.startsWith('shortcut-'))) {
    for (const d of pickDistractors(q, { random })) {
      const s = byCode.get(norm(d)); total += 1;
      if (s && s.cat === q.cat) sameCat += 1;
      if (s) assert.notEqual(norm(s.full), norm(q.meaning));
    }
  }
  assert.equal(sameCat, total, 'every category has enough terms, so all distractors are same-category');
});

test('sprint: correct-answer position is spread fairly across the four slots', () => {
  const random = seeded(2024); const slots = [0, 0, 0, 0];
  for (let i = 0; i < 4000; i++) slots[buildSprintRound(SPRINT[i % SPRINT.length], { random }).answerIndex] += 1;
  for (const n of slots) assert.ok(n > 850 && n < 1150, `slot counts ${slots}`);
});

test('sprint: tiny pools fall back safely without duplicates or crashes', () => {
  const q = { id: 'x', answer: 'RAM', cat: 'hardware' };
  const pool = [{ text: 'ram', cat: 'hardware' }, { text: 'SSD', cat: 'hardware' }, { text: 'SSD ', cat: 'hardware' }];
  const r = buildSprintRound(q, { pool });
  assert.deepEqual(r.options.map((o) => norm(o.text)).sort(), ['ram', 'ssd']);
  assert.equal(r.options.filter((o) => o.correct).length, 1);
  assert.equal(buildSprintRound(q, { pool: [] }).options.length, 1);
  assert.ok(SPRINT_VOCAB.length > 150);
});
