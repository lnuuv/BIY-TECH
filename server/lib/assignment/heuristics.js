// Deterministic, model-free analysis. Used (1) to verify what the AI claims against the real document and
// (2) as the "basic" fallback when the AI is unavailable. Nothing here invents content: it only finds what is in the text.
import { LESSONS } from '../../../shared/content/lessons.js';

const DIAC = /[\u064B-\u065F\u0670\u0640]/g;
export const normText = (s) => String(s).toLowerCase().replace(DIAC, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/\s+/g, ' ').trim();
const ALNUM = (s) => normText(s).replace(/[^\p{L}\p{N}]+/gu, '');

/* ---------- assessment criteria codes (Pearson style: A.P1, B.M2, BC.D2, also reversed in some Arabic PDFs: "1P.A") ---------- */
const FWD = /(?<![A-Za-z0-9])([A-F]{1,2})\s?\.?\s?([PMD])\s?(\d{1,2})(?![A-Za-z0-9])/g;
const REV = /(?<![A-Za-z0-9])(\d{1,2})\s?([PMD])\s?\.?\s?([A-F]{1,2})(?![A-Za-z0-9])/g;
export const normalizeCode = (a, l, n) => `${a}.${l}${Number(n)}`;
export function findCriteriaCodes(text) {
  const found = new Map();
  for (const m of text.matchAll(FWD)) found.set(normalizeCode(m[1], m[2], m[3]), (found.get(normalizeCode(m[1], m[2], m[3])) || 0) + 1);
  for (const m of text.matchAll(REV)) found.set(normalizeCode(m[3], m[2], m[1]), (found.get(normalizeCode(m[3], m[2], m[1])) || 0) + 1);
  return found; // Map<code, occurrences>
}
export const levelOfCode = (code) => (code.split('.')[1] || '')[0] || '';
export function codeIsInText(code, codeSet) { return codeSet.has(String(code).replace(/\s/g, '').toUpperCase()); }
export const canonicalCode = (code) => { const m = String(code).replace(/\s/g, '').toUpperCase().match(/^([A-F]{1,2})\.?([PMD])(\d{1,2})$/); return m ? normalizeCode(m[1], m[2], m[3]) : null; };

/* ---------- command words ---------- */
export const COMMAND_WORD_DEFS = [
  { id: 'identify', level: 'P', en: /\bidentif(y|ies|ying)\b/i, ar: ['حدد', 'تحديد', 'اذكر'] },
  { id: 'describe', level: 'P', en: /\bdescrib(e|es|ing)\b/i, ar: ['صف', 'وصف', 'اوصف'] },
  { id: 'explain', level: 'P', en: /\bexplain(s|ing)?\b/i, ar: ['اشرح', 'شرح'] },
  { id: 'outline', level: 'P', en: /\boutline\b/i, ar: ['لخص', 'وضح'] },
  { id: 'compare', level: 'M', en: /\bcompar(e|es|ing)\b/i, ar: ['قارن', 'مقارنه'] },
  { id: 'analyse', level: 'M', en: /\banaly[sz](e|es|ing)\b/i, ar: ['حلل', 'تحليل'] },
  { id: 'assess', level: 'M', en: /\bassess(es|ing)?\b/i, ar: ['قيم الاداء'] },
  { id: 'discuss', level: 'M', en: /\bdiscuss(es|ing)?\b/i, ar: ['ناقش'] },
  { id: 'review', level: 'M', en: /\breview(s|ing)?\b/i, ar: ['راجع', 'مراجعه'] },
  { id: 'evaluate', level: 'D', en: /\bevaluat(e|es|ing)\b/i, ar: ['قيم', 'تقييم'] },
  { id: 'justify', level: 'D', en: /\bjustif(y|ies|ying)\b/i, ar: ['برر', 'تبرير'] },
  { id: 'recommend', level: 'D', en: /\brecommend(s|ing)?\b/i, ar: ['اوصي', 'توصيات', 'توصيه'] },
  { id: 'design', level: 'P', en: /\bdesign(s|ing)?\b/i, ar: ['صمم', 'تصميم'] },
  { id: 'develop', level: 'P', en: /\bdevelop(s|ing)?\b/i, ar: ['طور', 'تطوير'] },
  { id: 'test', level: 'P', en: /\btest(s|ing)?\b/i, ar: ['اختبر', 'اختبار'] },
  { id: 'investigate', level: 'P', en: /\binvestigat(e|es|ing)\b/i, ar: ['استكشف', 'تحقق', 'ابحث'] },
];
export function findCommandWords(text) {
  const n = ` ${normText(text)} `;
  const out = [];
  for (const d of COMMAND_WORD_DEFS) {
    const hitAr = d.ar.some((w) => new RegExp(`(?<![\\u0621-\\u064A])${normText(w)}(?![\\u0621-\\u064A])`).test(n));
    if (d.en.test(text) || hitAr) out.push(d.id);
  }
  return out;
}

/* ---------- Unit 1 detection (controls whether Unit 1 lessons are mapped from criteria codes) ---------- */
export const looksLikeUnit1 = (text) => /unit\s*1\b|IT systems|41055|الوحدة\s*1\b|أنظمة تكنولوجيا المعلومات|انظمة تكنولوجيا المعلومات/i.test(text);
export function lessonsForCriteria(codes) {
  const set = new Set(codes);
  return LESSONS.filter((l) => (l.criteria || []).some((c) => set.has(c))).map((l) => l.id);
}

/* ---------- prompt-injection tripwire (informational: the document is untrusted data either way) ---------- */
const INJECTION = /(ignore|disregard|forget)\s+(all|any|the|previous|above|prior)[\w\s]{0,30}(instruction|prompt|rule)|system prompt|you are now\b|reveal[\w\s]{0,20}(key|secret|prompt)|api[\s_-]?key|developer mode|تجاهل\s+(كل|جميع|التعليمات)|تعليمات النظام|مفتاح\s*(ال)?api|اكشف.{0,15}(المفتاح|التعليمات)/i;
export const looksLikeInjection = (text) => INJECTION.test(text);

/** Make text safe to embed between <document> tags: it can't close or fake the wrapper. */
export const fenceSafe = (t) => String(t).replace(/<\/?\s*(document|reference|system|assistant|user)\b[^>]*>/gi, '[tag removed]');

/** Is `quote` (roughly) present in the source? Whitespace/diacritic/punctuation tolerant. */
export function quoteInText(quote, haystackAlnum) {
  const q = ALNUM(quote);
  return q.length >= 8 && haystackAlnum.includes(q);
}
export const alnumOf = ALNUM;

/* ---------- chunking for long documents ---------- */
export function chunkText(text, max = 14_000, overlap = 600) {
  if (text.length <= max) return [text];
  const out = []; let i = 0;
  while (i < text.length) {
    let end = Math.min(text.length, i + max);
    if (end < text.length) { const cut = text.lastIndexOf('\n', end); if (cut > i + max * 0.6) end = cut; }
    out.push(text.slice(i, end));
    if (end >= text.length) break;
    i = end - overlap;
  }
  return out;
}

/* ---------- basic structure (no AI) ---------- */
const ACT_RE = /^\s*(?:#+\s*)?(?:activity|task|part|النشاط|المهمة|مهمة|نشاط)\s*(\d{1,2})\b[^\n]{0,140}/gim;
export function basicStructure(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const titleRow = text.match(/(?:عنوان الواجب|assignment title|title)\s*[|:\-–]\s*([^|\n]{3,120})/i);
  const codes = [...findCriteriaCodes(text).keys()].sort();
  const activities = []; const seen = new Set();
  for (const m of text.matchAll(ACT_RE)) {
    const n = Number(m[1]); if (seen.has(n)) continue; seen.add(n);
    const start = m.index; const next = [...text.matchAll(ACT_RE)].find((x) => x.index > start && Number(x[1]) !== n);
    let end = next ? next.index : Math.min(text.length, start + 1500);
    const stop = text.slice(start, end).search(/معايير التقييم|assessment criteria|grading criteria|marking criteria/i);   // criteria tables are not part of the last activity
    if (stop > 0) end = start + stop;
    const body = text.slice(start, end);
    const inBody = [...findCriteriaCodes(body).keys()].sort();
    activities.push({ id: String(n), title: m[0].trim().slice(0, 140), requirements: [], deliverables: [], criteria: inBody, commandWords: findCommandWords(body), quote: m[0].trim().slice(0, 120), hours: null });
  }
  return {
    title: titleRow ? titleRow[1].replace(/\*/g, '').trim() : (lines[0] || '').slice(0, 140),
    subject: null, organisation: null, scenario: { summary: '', background: [], stakeholders: [], needs: [], constraints: [] },
    activities, criteria: codes.map((c) => ({ code: c, text: '', level: levelOfCode(c) })), commandWords: findCommandWords(text),
    evidenceRequired: [], missing: ['scenario_summary', 'activity_details', 'criteria_text'], ambiguities: [],
  };
}
