// Renders the real Assignment Studio components (server-side) with an analysed result, in English and Arabic.
// This checks structure, RTL, the notice banner and "no Leshev leakage" — it does not exercise browser interactions.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const store = new Map();
const I18N_KEY = (fs.readFileSync(path.join(root, 'src/i18n/index.jsx'), 'utf8').match(/const KEY = '([^']+)'/) || [])[1];
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
globalThis.window ??= { matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }), addEventListener() {}, removeEventListener() {} };
globalThis.document ??= { documentElement: { setAttribute() {}, style: {}, lang: '', dir: '' }, body: {} };

const RESULT = {
  id: 'abc', lang: 'en', mode: 'ai', file: { name: 'library.docx' }, warnings: [],
  structure: {
    title: 'Smart Library System', subject: 'Databases', organisation: 'Northside Library',
    scenario: { summary: 'Northside Library needs a loan system.', background: [], stakeholders: [{ name: 'Librarian', need: 'record loans' }], needs: ['record loans'], constraints: [] },
    activities: [{ id: '1', title: 'Design', hours: 4, requirements: ['Explain table design'], deliverables: ['table design'], criteria: ['B.P3'], commandWords: ['explain'], quote: 'Explain table design', verified: true }],
    criteria: [{ code: 'B.P3', level: 'P', text: 'Explain how data is organised.', verified: true }], commandWords: ['explain'], evidenceRequired: [], missing: ['deadline'], ambiguities: [],
  },
  guidance: { activities: { 1: { activityId: '1', plainExplanation: 'Show how data is split.', whatToInvestigate: ['What does the library record?'], conceptsNeeded: ['primary key'], criteriaMeaning: [{ code: 'B.P3', meaning: 'Say how and why.' }], commandWordNotes: [], evidence: [], firstStep: 'List the things the library records.', startingStructure: ['Entities'], starterQuestions: [], lessons: [{ lessonId: 'data-info', why: 'Data vs information.' }], checklist: [{ text: 'Describe the fields', criteria: 'B.P3' }], pitfalls: [], refs: [] } },
    global: { summaryPlain: 'A library needs a simple loan system.', keyFacts: [], terminology: [{ term: 'Primary key', meaning: 'Unique id.' }], commandWordGuides: [{ word: 'explain', definition: 'Say what and why.', demonstrate: 'point + reason', structure: ['Point', 'Reason'], example: 'Each member has a unique ID.' }], exercises: [{ type: 'mcq', title: 'Quick check', prompt: '', question: 'What is a primary key?', options: ['Unique id', 'A password'], answer: 0, explanation: 'It identifies a row.' }], studyPlan: [], reportStructure: ['Intro'], evidenceTips: [], reviewChecklist: ['Used each command word?'], commonMistakes: [], lessons: [], knowledgeGaps: [] } },
  lessons: [{ id: 'data-info', why: 'Data vs information.', activities: ['1'], source: 'ai' }], refs: [], grounding: {},
};

let mod;
test('bundle the real components', async () => {
  const entry = `
    import React from 'react'; import { renderToString } from 'react-dom/server'; import { MemoryRouter } from 'react-router-dom';
    import { I18nProvider } from ${JSON.stringify(path.join(root, 'src/i18n/index.jsx'))};
    import Workspace from ${JSON.stringify(path.join(root, 'src/components/assignment/Workspace.jsx'))};
    import UploadPanel from ${JSON.stringify(path.join(root, 'src/components/assignment/UploadPanel.jsx'))};
    import Assignment from ${JSON.stringify(path.join(root, 'src/pages/Assignment.jsx'))};
    export const render = (el) => renderToString(React.createElement(MemoryRouter, null, React.createElement(I18nProvider, null, el)));
    export { React, Workspace, UploadPanel, Assignment };`;
  const out = path.join(os.tmpdir(), `asg-ui-${process.pid}.mjs`);
  await build({ stdin: { contents: entry, resolveDir: root, loader: 'jsx' }, bundle: true, platform: 'node', format: 'esm', outfile: out, jsx: 'automatic', logLevel: 'silent', banner: { js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);" }, loader: { '.jsx': 'jsx' } });
  mod = await import(pathToFileURL(out).href); fs.rmSync(out, { force: true });
  assert.ok(mod.render);
});

for (const lang of ['en', 'ar']) {
  test(`workspace renders every tab (${lang}) from the analysed result, with no Leshev content`, () => {
    store.set(I18N_KEY, JSON.stringify({ lang, theme: 'dark' }));
    for (const tab of ['overview', 'tasks', 'lessons', 'plan', 'practice', 'words', 'more']) {
      const html = mod.render(mod.React.createElement(mod.Workspace, { result: RESULT, tab, setTab() {}, taskId: null, setTaskId() {} }));
      assert.ok(html.length > 200, tab);
      assert.ok(!/Leshev/i.test(html), `${tab}: Leshev leaked`);
    }
    const ov = mod.render(mod.React.createElement(mod.Workspace, { result: RESULT, tab: 'overview', setTab() {}, taskId: null, setTaskId() {} }));
    assert.match(ov, lang === 'ar' ? /السيناريو بكلمات بسيطة/ : /Scenario in plain words/); assert.match(ov, /Smart Library System/); assert.match(ov, /Northside Library/);
    const tasks = mod.render(mod.React.createElement(mod.Workspace, { result: RESULT, tab: 'tasks', setTab() {}, taskId: null, setTaskId() {} }));
    assert.match(tasks, /List the things the library records\./); assert.match(tasks, /B\.P3/);
    assert.ok(!tasks.includes('<script'));
  });
}

test('upload page shows the updated notice banner (shield icon, original warn style) and the drop zone', () => {
  const html = mod.render(mod.React.createElement(mod.Assignment));
  assert.match(html, /class="callout warn"/);
  assert.ok(html.includes('This section helps you understand the task and start working on it yourself.') || html.includes('هذا القسم بساعدك تفهم المهمة وتبدأ بحلّها بنفسك. الذكاء الاصطناعي بوجّهك وبعطيك الخطوة الأولى، لكن إكمال المهمة وكتابة إجابتك مسؤوليتك.'));
  assert.match(html, /asg-drop/); assert.match(html, /type="file"/);
  assert.ok(!/Leshev/i.test(html));
});
