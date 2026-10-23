// Validation of everything the model returns. Model output is untrusted: we whitelist fields, cap lengths,
// drop anything not grounded in the real document (criteria codes, command words, lesson ids, sources) and never render HTML.
import { LESSON_BY_ID } from '../../../shared/content/lessons.js';
import { canonicalCode, codeIsInText, levelOfCode, normText, quoteInText } from './heuristics.js';

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
export const str = (v, max = 400) => {
  if (typeof v !== 'string') return typeof v === 'number' ? String(v) : '';
  const t = v.replace(/<[^>]*>/g, '').replace(/\s+\n/g, '\n').trim();   // no markup survives
  if (t.length <= max) return t;
  const cut = t.slice(0, max); const p = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('。'), cut.lastIndexOf('؟'), cut.lastIndexOf('.\n'));
  return (p > max * 0.5 ? cut.slice(0, p + 1) : cut.replace(/\s+\S*$/, '')) + (p > max * 0.5 ? '' : '…');
};
export const strOrNull = (v, max) => { const s = str(v, max); return s || null; };
export const list = (v, max, fn) => (Array.isArray(v) ? v.slice(0, max).map(fn).filter(Boolean) : []);
const strs = (v, max = 8, len = 300) => list(v, max, (x) => str(x, len) || null);
const slug = (s, i) => String(s || i + 1).replace(/[^\p{L}\p{N}_-]+/gu, '-').slice(0, 20) || String(i + 1);

export class ValidationError extends Error { constructor(msg) { super(msg); this.code = 'invalid_ai_output'; } }

/* ================= stage 1: structure ================= */
export function validateStructure(raw, ctx) {
  if (!isObj(raw)) throw new ValidationError('Structure is not an object');
  const { codeSet, alnum, normalized, cwIds } = ctx;
  let droppedCriteria = 0, unverified = 0;

  const criteria = [];
  const seen = new Set();
  for (const c of Array.isArray(raw.criteria) ? raw.criteria.slice(0, 60) : []) {
    const code = canonicalCode(c?.code);
    if (!code || !codeIsInText(code, codeSet)) { droppedCriteria++; continue; }   // never invent criteria
    if (seen.has(code)) continue; seen.add(code);
    const quote = str(c.quote, 160);
    const verified = !!quote && quoteInText(quote, alnum);
    if (!verified) unverified++;
    criteria.push({ code, level: levelOfCode(code), text: str(c.text, 400), learningAim: strOrNull(c.learningAim, 20), quote: verified ? quote : '', verified });
  }
  // codes present in the document but not returned by the model are still real → keep them as bare entries
  for (const code of codeSet) if (!seen.has(code)) criteria.push({ code, level: levelOfCode(code), text: '', learningAim: null, quote: '', verified: false });
  criteria.sort((a, b) => a.code.localeCompare(b.code, 'en', { numeric: true }));

  const activities = list(raw.activities, 12, (a, i) => {
    if (!isObj(a)) return null;
    const quote = str(a.quote, 160); const verified = !!quote && quoteInText(quote, alnum);
    if (!verified) unverified++;
    const codes = [...new Set(list(a.criteria, 20, (c) => { const k = canonicalCode(c); return k && codeIsInText(k, codeSet) ? k : null; }))];
    const hrs = Number(a.hours);
    return {
      id: slug(a.id, i), title: str(a.title, 160) || `#${i + 1}`, hours: Number.isFinite(hrs) && hrs > 0 && hrs < 200 ? hrs : null,
      requirements: strs(a.requirements, 12, 300), deliverables: strs(a.deliverables, 8, 240), criteria: codes,
      commandWords: cleanCommandWords(a.commandWords, normalized, cwIds), quote: verified ? quote : '', verified,
    };
  });
  const ids = new Set(); activities.forEach((a, i) => { if (ids.has(a.id)) a.id = `${a.id}-${i + 1}`; ids.add(a.id); });

  const sc = isObj(raw.scenario) ? raw.scenario : {};
  return {
    structure: {
      title: str(raw.title, 200), subject: strOrNull(raw.subject, 200), organisation: strOrNull(raw.organisation, 160),
      scenario: {
        summary: str(sc.summary, 900), background: strs(sc.background, 8, 300),
        stakeholders: list(sc.stakeholders, 10, (x) => (isObj(x) ? { name: str(x.name, 100), need: str(x.need, 240) } : typeof x === 'string' ? { name: str(x, 100), need: '' } : null)).filter((x) => x.name),
        needs: strs(sc.needs, 12, 260), constraints: strs(sc.constraints, 8, 260),
      },
      activities, criteria, commandWords: cleanCommandWords(raw.commandWords, normalized, cwIds),
      evidenceRequired: strs(raw.evidenceRequired, 12, 260), missing: strs(raw.missing, 12, 160), ambiguities: strs(raw.ambiguities, 10, 260),
    },
    stats: { droppedCriteria, unverified },
  };
}
// a command word is kept only if it (or its canonical English id, detected in the text) really appears in the document
function cleanCommandWords(v, normalized, cwIds) {
  return [...new Set(list(v, 24, (w) => { const s = str(typeof w === 'string' ? w : w?.word, 30).toLowerCase(); return s && (normalized.includes(normText(s)) || cwIds?.has(s)) ? s : null; }))];
}

export function mergeStructures(parts) {
  const out = JSON.parse(JSON.stringify(parts[0]));
  const byId = new Map(out.activities.map((a) => [a.id, a]));
  for (const p of parts.slice(1)) {
    if (!out.title && p.title) out.title = p.title;
    if (!out.scenario.summary && p.scenario.summary) out.scenario.summary = p.scenario.summary;
    for (const k of ['background', 'needs', 'constraints']) out.scenario[k] = [...new Set([...out.scenario[k], ...p.scenario[k]])].slice(0, 12);
    for (const s of p.scenario.stakeholders) if (!out.scenario.stakeholders.some((x) => x.name === s.name)) out.scenario.stakeholders.push(s);
    for (const a of p.activities) { const ex = byId.get(a.id); if (!ex) { out.activities.push(a); byId.set(a.id, a); } else { for (const k of ['requirements', 'deliverables', 'criteria', 'commandWords']) ex[k] = [...new Set([...ex[k], ...a[k]])]; } }
    for (const c of p.criteria) { const ex = out.criteria.find((x) => x.code === c.code); if (!ex) out.criteria.push(c); else if (!ex.text && c.text) Object.assign(ex, { text: c.text, quote: c.quote, verified: c.verified }); }
    out.commandWords = [...new Set([...out.commandWords, ...p.commandWords])];
    for (const k of ['evidenceRequired', 'missing', 'ambiguities']) out[k] = [...new Set([...out[k], ...p[k]])].slice(0, 14);
    out.subject ||= p.subject; out.organisation ||= p.organisation;
  }
  return out;
}

/* ================= stage 2: guidance ================= */
const refIdsIn = (v, refIds) => list(v, 4, (x) => (refIds.has(x) ? x : null));
const lessonRecs = (v, max = 4) => list(v, max, (r) => {
  const id = String(r?.lessonId || r?.id || '');
  return LESSON_BY_ID[id] ? { lessonId: id, why: str(r.why, 260) } : null;   // never fabricate lesson ids
});

export function validateActivityGuidance(raw, activity, ctx) {
  if (!isObj(raw)) throw new ValidationError('Guidance is not an object');
  const allowedCodes = new Set(activity.criteria.concat(ctx.allCodes || []));
  return {
    activityId: activity.id,
    plainExplanation: str(raw.plainExplanation, 700),
    whatToInvestigate: strs(raw.whatToInvestigate, 6, 260),
    conceptsNeeded: strs(raw.conceptsNeeded, 8, 120),
    criteriaMeaning: list(raw.criteriaMeaning, 10, (c) => { const k = canonicalCode(c?.code); return k && allowedCodes.has(k) ? { code: k, meaning: str(c.meaning, 320) } : null; }),
    commandWordNotes: list(raw.commandWordNotes, 6, (c) => (c?.word ? { word: str(c.word, 30), meaning: str(c.meaning, 300) } : null)),
    evidence: strs(raw.evidence, 6, 240),
    firstStep: str(raw.firstStep, 520),
    startingStructure: strs(raw.startingStructure, 8, 120),          // headings only — never paragraphs
    starterQuestions: strs(raw.starterQuestions, 5, 220),
    lessons: lessonRecs(raw.lessons),
    checklist: list(raw.checklist, 10, (c) => { const text = str(typeof c === 'string' ? c : c?.text, 240); const k = c && c.criteria ? canonicalCode(c.criteria) : null; return text ? { text, criteria: k && allowedCodes.has(k) ? k : null } : null; }),
    pitfalls: strs(raw.pitfalls, 5, 260),
    refs: refIdsIn(raw.refs, ctx.refIds),
  };
}

const EX_TYPES = ['classify', 'match', 'mcq'];
export function validateExercise(e) {
  if (!isObj(e) || !EX_TYPES.includes(e.type)) return null;
  const title = str(e.title, 120), prompt = str(e.prompt, 300);
  if (e.type === 'classify') {
    const cats = [...new Set(strs(e.categories, 5, 60))]; if (cats.length < 2) return null;
    const items = list(e.items, 10, (it) => (cats.includes(it?.category) && str(it.text, 200) ? { text: str(it.text, 200), category: it.category, explanation: str(it.explanation, 300) } : null));
    return items.length >= 3 ? { type: 'classify', title, prompt, categories: cats, items } : null;
  }
  if (e.type === 'match') {
    const pairs = list(e.pairs, 8, (p) => (str(p?.left, 160) && str(p?.right, 160) ? { left: str(p.left, 160), right: str(p.right, 160), explanation: str(p.explanation, 300) } : null));
    return pairs.length >= 3 && new Set(pairs.map((p) => p.right)).size === pairs.length ? { type: 'match', title, prompt, pairs } : null;
  }
  const opts = strs(e.options, 5, 200); const ans = Number(e.answer);
  if (opts.length < 2 || !Number.isInteger(ans) || ans < 0 || ans >= opts.length || !str(e.question, 300)) return null;
  return { type: 'mcq', title, prompt, question: str(e.question, 300), options: opts, answer: ans, explanation: str(e.explanation, 400) };
}

export function validateGlobal(raw, ctx) {
  if (!isObj(raw)) throw new ValidationError('Global guidance is not an object');
  return {
    summaryPlain: str(raw.summaryPlain, 900),
    keyFacts: strs(raw.keyFacts, 10, 240),
    terminology: list(raw.terminology, 14, (t) => (str(t?.term, 60) ? { term: str(t.term, 60), meaning: str(t.meaning, 240) } : null)),
    commandWordGuides: list(raw.commandWordGuides, 8, (c) => {
      const word = str(c?.word, 30).toLowerCase(); if (!word || (ctx.commandWords.length && !ctx.commandWords.includes(word))) return null;
      return { word, definition: str(c.definition, 300), demonstrate: str(c.demonstrate, 300), structure: strs(c.structure, 5, 160), example: str(c.example, 320) };
    }),
    exercises: list(raw.exercises, 4, validateExercise),
    studyPlan: list(raw.studyPlan, 8, (s) => (str(s?.step, 200) ? { step: str(s.step, 200), focus: str(s.focus, 200), activityId: ctx.activityIds.includes(String(s.activityId)) ? String(s.activityId) : null } : null)),
    reportStructure: strs(raw.reportStructure, 10, 140),
    evidenceTips: strs(raw.evidenceTips, 6, 240),
    reviewChecklist: strs(raw.reviewChecklist, 8, 220),
    commonMistakes: strs(raw.commonMistakes, 6, 260),
    lessons: lessonRecs(raw.lessons, 8),
    knowledgeGaps: list(raw.knowledgeGaps, 5, (g) => (str(g?.topic, 100) ? { topic: str(g.topic, 100), explanation: str(g.explanation, 420) } : null)),
  };
}
