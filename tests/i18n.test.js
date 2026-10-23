import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DICT } from '../src/i18n/dict.js';
import { SHORTCUT_CATEGORIES, SHORTCUTS } from '../shared/content/shortcuts.js';
import { LESSONS } from '../shared/content/lessons.js';
import { QUESTIONS, QUIZ_BANK, SHORTCUT_QUESTIONS } from '../shared/content/quizzes.js';
import { PAIRS, SPRINT, SORTS } from '../shared/content/games.js';
import { createQuizSet } from '../shared/quiz-session.js';

const files = [];
(function walk(d) { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); f.isDirectory() ? walk(p) : /\.jsx?$/.test(f.name) && files.push(p); } })('src');

test('every UI string has English and Arabic', () => {
  for (const [k, v] of Object.entries(DICT)) { assert.equal(v.length, 2, k); assert.ok(v[0] && v[1], k); }
});
test('every t("key") literal used in the UI exists in the dictionary', () => {
  const missing = new Set();
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    for (const m of src.matchAll(/\bt\('([a-zA-Z0-9_.]+)'/g)) if (!DICT[m[1]]) missing.add(`${f}: ${m[1]}`);
    for (const m of src.matchAll(/'((?:nav|home|lab|asm|chat|quiz|games|asg|prog|models|lesson|learn|sc|common|a11y|brand|side|streak|3d)\.[a-zA-Z0-9_.]+)'/g)) if (!DICT[m[1]]) missing.add(`${f}: ${m[1]}`);
  }
  assert.deepEqual([...missing], []);
});
test('dynamic key families are complete', () => {
  for (const k of ['award', 'lesson', 'quiz', 'game', 'mission', 'inspect', 'assembly', 'disassembly', 'checklist', 'mapper', 'chat']) assert.ok(DICT[`xp.${k}`], `xp.${k}`);
  for (const k of ['missing', 'self', 'kind', 'wifi', 'busy', 'dup']) assert.ok(DICT[`lab.err.${k}`], `lab.err.${k}`);
  for (const k of ['models', 'assembly', 'lab', 'assistant', 'practice', 'games']) { assert.ok(DICT[`home.f.${k}.t`]); assert.ok(DICT[`home.f.${k}.d`]); }
  for (const code of ['too_large', 'unsupported', 'scanned_pdf', 'empty_text', 'doc_expired', 'rate_limited', 'invalid_ai_output', 'no_api_key', 'network', 'generic']) assert.ok(DICT[`asg.err.${code}`], `asg.err.${code}`);
  for (const st of ['reading', 'identify', 'connect', 'prepare']) assert.ok(DICT[`asg.stage.${st}`], `asg.stage.${st}`);
  for (const w of ['truncated_pages', 'truncated_text', 'arabic_pdf_glitch', 'possible_injection', 'partial_result']) assert.ok(DICT[`asg.w.${w}`], `asg.w.${w}`);
});

test('shortcuts glossary has all 4 categories and 171 complete bilingual entries', () => {
  assert.equal(SHORTCUT_CATEGORIES.length, 4);
  assert.equal(SHORTCUTS.length, 171);
  const catIds = new Set(SHORTCUT_CATEGORIES.map((c) => c.id));
  const ids = new Set();
  for (const s of SHORTCUTS) {
    assert.ok(!ids.has(s.id), `duplicate shortcut id: ${s.id}`);
    ids.add(s.id);
    assert.ok(catIds.has(s.cat), `unknown category: ${s.cat}`);
    assert.ok(s.code && s.full && s.ar && s.desc?.ar && s.desc?.en, `incomplete shortcut: ${s.id}`);
  }
});

test('every key term listed in the lessons is present in the shortcuts glossary', () => {
  const normalise = (value) => value.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]/g, '');
  const glossaryText = SHORTCUTS.map((s) =>
    normalise([s.code, s.full, s.ar, s.desc.en, s.desc.ar].join(' '))
  );

  for (const lesson of LESSONS) {
    for (const [english, arabic] of lesson.terms) {
      const en = normalise(english);
      const ar = normalise(arabic);
      assert.ok(
        glossaryText.some((entry) => entry.includes(en) || entry.includes(ar)),
        `missing lesson glossary term: ${english} / ${arabic}`
      );
    }
  }
});

test('shortcut questions and games cover the glossary with valid answers', () => {
  assert.equal(SHORTCUT_QUESTIONS.length, SHORTCUTS.length);
  for (const question of SHORTCUT_QUESTIONS) {
    assert.equal(question.options.length, 4, question.id);
    assert.equal(question.ans, 0, question.id);
    assert.equal(new Set(question.options.map((option) => option.en)).size, 4, question.id);
    assert.ok(question.options.every((option) => option.en && option.ar), question.id);
    const shortcut = SHORTCUTS.find((s) => question.id === `shortcut-${s.id}`);
    assert.ok(shortcut && question.options.some((option) => option.en === shortcut.full), question.id);
  }

  assert.equal(QUIZ_BANK.length, SHORTCUT_QUESTIONS.length + QUESTIONS.length);
  assert.ok(SHORTCUTS.every((s) => PAIRS.some((pair) => pair.id === `shortcut-${s.id}`)));
  assert.ok(SHORTCUTS.every((s) => SPRINT.some((question) => question.id === `shortcut-${s.id}`)));
  assert.ok(SPRINT.every((question) => new Set(question.options).size === question.options.length && question.options.includes(question.answer)), 'sprint options must be unique and contain the answer');
  assert.equal(SORTS.acronyms.items.length, SHORTCUTS.length);
  assert.equal(SORTS.acronyms.buckets.length, SHORTCUT_CATEGORIES.length);
});

test('shortcut lesson matching avoids accidental substring matches', () => {
  const erp = SHORTCUT_QUESTIONS.find((question) => question.code === 'ERP');
  const lan = SHORTCUT_QUESTIONS.find((question) => question.code === 'LAN');
  assert.ok(erp.lessonIds.includes('data-info'));
  assert.ok(!erp.lessonIds.includes('connectivity'));
  assert.ok(lan.lessonIds.includes('connectivity'));
});

test('quiz builder returns 12 scoped questions for every mode and difficulty', () => {
  for (const difficulty of ['easy', 'hard']) {
    for (const mode of ['book', 'mixed', 'shortcuts']) {
      const allLessons = createQuizSet({ lessonId: 'all', mode, difficulty });
      assert.equal(allLessons.length, 12, `${difficulty}/${mode} count`);
      if (mode === 'book') assert.ok(allLessons.every((question) => QUESTIONS.some((item) => item.id === question.id)));
      if (mode === 'shortcuts') assert.ok(allLessons.every((question) => question.id.startsWith('shortcut-')));
      assert.ok(allLessons.every((question) => question.options.length === 4), `${difficulty}/${mode} should have four answer choices`);
      if (difficulty === 'hard') assert.ok(allLessons.every((question) => question.q.en.includes('Which explanation') || question.q.en.includes('technical definition')));

      const lessonId = 'connectivity';
      const lessonQuestions = createQuizSet({ lessonId, mode, difficulty });
      assert.equal(lessonQuestions.length, 12, `${difficulty}/${mode}/${lessonId} count`);
      assert.ok(lessonQuestions.every((question) => question.options.length === 4), `${difficulty}/${mode}/${lessonId} should have four answer choices`);
      assert.ok(lessonQuestions.every((question) =>
        question.lesson === lessonId || question.lessonIds?.includes(lessonId)
      ), `${difficulty}/${mode} must stay within ${lessonId}`);
    }
  }
});

test('weak-spot quiz builder only returns questions in the wrong-answer set and never adds extras', () => {
  const weakIds = new Set([QUESTIONS[0].id, SHORTCUT_QUESTIONS[0].id]);
  const questions = createQuizSet({ source: 'weak', weakIds: [...weakIds], difficulty: 'hard', count: 20 });
  assert.equal(questions.length, weakIds.size);
  assert.ok(questions.every((question) => weakIds.has(question.id)));
  assert.ok(createQuizSet({ source: 'weak', weakIds: [...weakIds], mode: 'book', count: 1 }).every((question) => weakIds.has(question.id)));
  assert.ok(createQuizSet({ source: 'weak', weakIds: [...weakIds], mode: 'shortcuts', count: 1 }).every((question) => weakIds.has(question.id)));
});

test('hard quizzes can be built with 20 questions while easy quizzes remain 12', () => {
  assert.equal(createQuizSet({ difficulty: 'easy', count: 12 }).length, 12);
  assert.equal(createQuizSet({ difficulty: 'hard', count: 20 }).length, 20);
});

test('fresh quiz rounds avoid the previous round questions when alternatives are available', () => {
  const firstRound = createQuizSet({ lessonId: 'all', mode: 'mixed', difficulty: 'easy', count: 12 });
  const secondRound = createQuizSet({
    lessonId: 'all',
    mode: 'mixed',
    difficulty: 'easy',
    count: 12,
    excludeIds: firstRound.map((question) => question.id),
  });
  const firstIds = new Set(firstRound.map((question) => question.id));
  assert.ok(secondRound.every((question) => !firstIds.has(question.id)));
});
