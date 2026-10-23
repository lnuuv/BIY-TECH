// Lightweight bilingual BM25 retrieval over (a) curated lesson notes and (b) raw book chunks.
// Works offline (no embeddings) and is shared by the server and tests.
import { LESSONS } from './content/lessons.js';
import { PARTS } from './content/parts.js';
import { SHORTCUTS } from './content/shortcuts.js';

const AR_RE = /[\u0600-\u06FF]/;
const DIAC = /[\u064B-\u065F\u0670\u0640]/g;

export function normalizeAr(s) {
  return s.replace(DIAC, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/ل/g, ''); // lam is dropped: the PDF text layer mangles lam-alef ligatures, so we match on a skeleton
}

const STOP_EN = new Set('the a an of and or to in is are for on with by as at it its be this that from what how why which do does can i you we'.split(' '));
const STOP_AR = new Set(['في', 'من', 'على', 'الي', 'عن', 'ما', 'هو', 'هي', 'ان', 'او', 'مع', 'هذا', 'هذه', 'كيف', 'لماذا', 'اي'].map(normalizeAr));

export function tokenize(text) {
  const out = [];
  for (const raw of text.toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
    if (!raw) continue;
    if (AR_RE.test(raw)) {
      let t = normalizeAr(raw);
      if (t.startsWith('ا') && t.length > 3) t = t.slice(1);
      if (t.length < 2 || STOP_AR.has(t)) continue;
      out.push(t);
    } else {
      let t = raw;
      if (t.length > 3 && t.endsWith('s') && !t.endsWith('ss')) t = t.slice(0, -1);
      if (t.length < 2 || STOP_EN.has(t)) continue;
      out.push(t);
    }
  }
  return out;
}

// EN <-> AR glossary for cross-language query expansion (built from lesson terms + extras)
const EXTRA = [
  ['ram', 'الذاكره'], ['cpu', 'المعالج'], ['motherboard', 'اللوحه الام'], ['firewall', 'جدار الحمايه'], ['router', 'جهاز التوجيه راوتر'],
  ['switch', 'محول سويتش'], ['network', 'الشبكه الشبكات'], ['cloud', 'السحابي السحابيه الحوسبه'], ['wireless', 'اللاسلكي'], ['wired', 'السلكي'],
  ['encryption', 'التشفير'], ['threat', 'التهديدات'], ['data', 'البيانات'], ['information', 'المعلومات'], ['policy', 'سياسات'], ['storage', 'التخزين'],
  ['operating system', 'نظام التشغيل'], ['bandwidth', 'النطاق الترددي'], ['latency', 'زمن الاستجابة'], ['protocol', 'بروتوكول'], ['ethics', 'الاخلاق'],
  ['legal', 'قانونيه'], ['intellectual property', 'الملكيه الفكريه'], ['malware', 'البرامج الضارة'], ['server', 'الخوادم الخادم'], ['peripheral', 'الاجهزه الطرفيه'],
  ['software', 'البرامج'], ['hardware', 'العتاد الاجهزه'], ['database', 'قاعده البيانات'], ['accuracy', 'دقه'], ['community', 'المجتمعات'], ['stakeholder', 'اصحاب المصلحه'],
  ['emerging', 'الناشئه'], ['virtualisation', 'المحاكاه الافتراضيه'], ['file', 'الملفات'], ['format', 'تنسيقات'], ['backup', 'نسخ احتياطي'], ['organisation', 'المؤسسات'],
];
const GLOSS = new Map();
function addGloss(en, ar) {
  const key = tokenize(en).join(' ');
  if (!key) return;
  GLOSS.set(key, [...(GLOSS.get(key) || []), ...tokenize(ar)]);
}
for (const l of LESSONS) for (const [en, ar] of l.terms) addGloss(en, ar);
for (const p of Object.values(PARTS)) addGloss(p.name.en, p.name.ar);
for (const [en, ar] of EXTRA) addGloss(en, ar);
for (const s of SHORTCUTS) { addGloss(s.code, `${s.ar} ${s.full}`); addGloss(s.full, s.ar); }

export function expandQuery(q) {
  const toks = tokenize(q);
  const extra = [];
  const joined = ' ' + toks.join(' ') + ' ';
  for (const [key, ar] of GLOSS) {
    if (key.includes(' ') ? joined.includes(' ' + key + ' ') : toks.includes(key)) extra.push(...ar);
  }
  return { tokens: toks, expanded: [...toks, ...extra] };
}

export function buildCuratedDocs() {
  const docs = [];
  for (const l of LESSONS) {
    l.points.forEach((pt, i) => {
      docs.push({
        id: `lesson-${l.id}-${i + 1}`, kind: 'notes', lesson: l.id, pages: l.pages, criteria: l.criteria,
        title: l.title, text: { en: pt.en, ar: pt.ar },
        index: `${l.title.en} ${l.title.ar} ${pt.en} ${pt.ar} ${l.terms.map((t) => t.join(' ')).join(' ')}`,
      });
    });
  }
  for (const [id, p] of Object.entries(PARTS)) {
    docs.push({
      id: `part-${id}`, kind: 'notes', lesson: p.lesson, pages: null, criteria: [], title: p.name,
      text: { en: `${p.role.en} ${p.facts.en.join('. ')}`, ar: `${p.role.ar} ${p.facts.ar.join('. ')}` },
      index: `${p.name.en} ${p.name.ar} ${p.role.en} ${p.role.ar} ${p.facts.en.join(' ')} ${p.facts.ar.join(' ')}`,
    });
  }
  for (const s of SHORTCUTS) {
    docs.push({
      id: `shortcut-${s.id}`,
      kind: 'notes',
      lesson: null,
      pages: s.bookPage ? [parseInt(s.bookPage, 10) || 1, parseInt(s.bookPage, 10) || 1] : null,
      criteria: [],
      title: { en: `${s.code} — ${s.full}`, ar: `${s.code} (${s.full}) — ${s.ar}` },
      text: { en: `${s.code} (${s.full}): ${s.desc.en}`, ar: `${s.code} (${s.full}) — ${s.ar}: ${s.desc.ar}` },
      index: `${s.code} ${s.full} ${s.ar} ${s.desc.en} ${s.desc.ar}`,
    });
  }
  return docs;
}

export class Retriever {
  constructor(curated, bookChunks = []) {
    this.docs = [
      ...curated.map((d) => ({ ...d, _t: tokenize(d.index), boost: 1.25 })),
      ...bookChunks.map((c) => ({ id: c.id, kind: 'book', page: c.page, pages: [c.page, c.page], text: { ar: c.text }, _t: tokenize(c.text), boost: 1 })),
    ];
    this.df = new Map();
    let total = 0;
    for (const d of this.docs) {
      total += d._t.length;
      for (const t of new Set(d._t)) this.df.set(t, (this.df.get(t) || 0) + 1);
      d._tf = new Map();
      for (const t of d._t) d._tf.set(t, (d._tf.get(t) || 0) + 1);
    }
    this.avg = total / Math.max(1, this.docs.length);
  }

  search(query, { k = 6, minBook = 2 } = {}) {
    const { tokens, expanded } = expandQuery(query);
    if (!expanded.length) return [];
    const N = this.docs.length, k1 = 1.4, b = 0.75;
    const weight = new Map();
    for (const t of expanded) weight.set(t, (weight.get(t) || 0) + (tokens.includes(t) ? 1 : 0.7));
    const scored = [];
    for (const d of this.docs) {
      let s = 0;
      for (const [t, w] of weight) {
        const tf = d._tf.get(t);
        if (!tf) continue;
        const df = this.df.get(t) || 0;
        const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
        s += w * idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * d._t.length) / this.avg)));
      }
      if (s > 0) scored.push({ d, s: s * d.boost });
    }
    scored.sort((a, b2) => b2.s - a.s);
    const top = scored.slice(0, k);
    // guarantee some book evidence when it exists, so answers can cite the textbook
    const books = scored.filter((x) => x.d.kind === 'book');
    let have = top.filter((x) => x.d.kind === 'book').length;
    for (const x of books) {
      if (have >= minBook) break;
      if (!top.includes(x)) { top[top.length - 1 - (have === 0 ? 0 : 1)] = x; have++; }
    }
    top.sort((a, b2) => b2.s - a.s);
    return top.map(({ d, s }) => ({ id: d.id, kind: d.kind, lesson: d.lesson || null, page: d.page || null, pages: d.pages, title: d.title || null, text: d.text, score: +s.toFixed(3) }));
  }
}

/** Reference briefs (historical Pearson assignments) → docs for a dedicated Retriever instance. Same BM25 engine as lessons/book. */
export function buildReferenceDocs(chunks = []) {
  return chunks.map((c) => ({
    id: c.id, kind: 'reference', lesson: null, pages: null, criteria: [],
    title: { en: c.file, ar: c.file }, text: AR_RE.test(c.text) ? { en: '', ar: c.text } : { en: c.text, ar: '' }, index: c.text,
  }));
}
