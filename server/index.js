import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import crypto from 'node:crypto';
import { Retriever, buildCuratedDocs, buildReferenceDocs } from '../shared/retrieval.js';
import { callGemini, GeminiError, PRIMARY_MODEL } from './lib/gemini.js';
import { extractDocument, ExtractError, MAX_FILE_BYTES } from './lib/extract.js';
import { DocStore } from './lib/assignment/store.js';
import { runAnalysis, AnalysisError } from './lib/assignment/pipeline.js';
import { fenceSafe } from './lib/assignment/heuristics.js';
import { TUTOR_ADDENDUM } from './lib/assignment/prompts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, '..', 'dist');

function loadChunks() {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'book-chunks.json'), 'utf8')); }
  catch { console.warn('[kb] server/data/book-chunks.json not found — run `npm run kb:build`. Using lesson notes only.'); return []; }
}

function loadReferenceChunks() {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'reference-chunks.json'), 'utf8')).chunks || []; }
  catch { console.warn('[kb] server/data/reference-chunks.json not found — run `npm run kb:refs`. Reference briefs disabled.'); return []; }
}

const SYSTEM = (lang, page = '', pageCtx = '', assignmentCtx = '') => `You are "Unit 1 Study Assistant", a friendly tutor for BTEC Level 3 Information Technology, Unit 1: IT Systems — Strategy, Management and Infrastructure. Students talk to you from inside the study website.
LANGUAGE & STYLE
- Reply in the same language and dialect the student uses. If they write in colloquial Levantine/Jordanian Arabic (e.g. "شو يعني", "كيف بعمل"), reply in friendly, simple colloquial Arabic. If they write in Modern Standard Arabic, reply in MSA. If English, reply in English.
- In Arabic, keep technical terms in English in brackets the first time, e.g. جدار الحماية (Firewall).
- Be warm and conversational. Short paragraphs and simple examples. Small talk (e.g. "كيفك؟") is fine: answer briefly and kindly.
KNOWLEDGE
- General IT and computing questions (e.g. "شو يعني كمبيوتر؟") are allowed: answer clearly and simply from your own knowledge, and link to Unit 1 when relevant.
- For Unit 1 content, prefer the numbered SOURCES below and cite them like [S1] or [S2][S3]. Only cite numbers that are in the list. Never invent page numbers or quotes. If the sources don't cover a unit-specific detail, say so briefly and answer from general knowledge.
- Sources marked "Book" are raw text extracted from the Arabic textbook and may contain small glyph errors; interpret them sensibly.
- For assessment questions mention the command word (explain / analyse / evaluate / justify). Use the student's ACTIVE ASSIGNMENT scenario when one is provided below; otherwise the Leshev Outfitters sample scenario may serve as a generic example.
- Do not write the student's assignment for them; guide, explain and give short examples.
CURRENT PAGE
- The student is on: ${page || 'the main assistant page'}.
${pageCtx ? `- Live data from this page (JSON, may be partial):
${pageCtx}
- When the student asks what is wrong or how to do something, inspect this data carefully: point out the specific mistakes (e.g. wrong IP, subnet, gateway, missing connection, wrong device), explain WHY each one is wrong, and guide step by step. Give hints first; give the full fix only if they ask for it.` : '- No live page data was sent. If the student asks about something on the page, ask them to describe what they did.'}${assignmentCtx ? TUTOR_ADDENDUM(assignmentCtx) : ''}`;

export function createApp({ retriever, refRetriever, fetchImpl = fetch, env = process.env, docStore } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '96kb' }));
  const r = retriever || new Retriever(buildCuratedDocs(), loadChunks());
  const refs = refRetriever || new Retriever(buildReferenceDocs(loadReferenceChunks()), []);
  const docs = docStore || new DocStore();

  // very small in-memory rate limiter (per IP) — replace with a shared store when scaling out
  const hits = new Map();
  const limit = (max, windowMs) => (req, res, next) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (arr.length >= max) return res.status(429).json({ error: 'rate_limited', message: 'Too many requests. Please wait a moment.' });
    arr.push(now); hits.set(key, arr); next();
  };

  app.get('/api/health', (_req, res) => res.json({ ok: true, ai: !!env.GEMINI_API_KEY, model: env.GEMINI_MODEL || PRIMARY_MODEL, docs: r.docs.length, references: refs.docs.length }));

  const excerpt = (d, lang) => {
    const t = (d.text[lang] || d.text.en || d.text.ar || '').replace(/\s+/g, ' ').trim();
    return t.length > 320 ? t.slice(0, 320) + '…' : t;
  };
  const label = (d, lang) => d.kind === 'book'
    ? (lang === 'ar' ? `الكتاب — الصفحة ${d.page} (PDF)` : `Book — PDF p.${d.page}`)
    : `${(d.title && (d.title[lang] || d.title.en)) || ''}${d.pages ? (lang === 'ar' ? ` — ص ${d.pages[0]}–${d.pages[1]}` : ` — p.${d.pages[0]}–${d.pages[1]}`) : ''}`;
  const publicSource = (d, n, lang) => ({ n, id: d.id, kind: d.kind, lesson: d.lesson, pages: d.pages, label: label(d, lang), excerpt: excerpt(d, d.kind === 'book' ? 'ar' : lang) });

  app.post('/api/search', limit(60, 60_000), (req, res) => {
    const q = String(req.body?.q || '').slice(0, 300);
    const lang = req.body?.lang === 'ar' ? 'ar' : 'en';
    if (!q.trim()) return res.json({ results: [] });
    res.json({ results: r.search(q, { k: 6 }).map((d, i) => publicSource(d, i + 1, lang)) });
  });

  /** Active-assignment context sent by the client: parsed, bounded, and fenced — it is DATA, never instructions. */
  const cleanAssignmentCtx = (v) => {
    if (typeof v !== 'string' || !v || v.length > 9000) return '';
    try { const o = JSON.parse(v); if (!o || typeof o !== 'object' || Array.isArray(o)) return ''; return fenceSafe(JSON.stringify(o)).slice(0, 7000); } catch { return ''; }
  };

  app.post('/api/chat', limit(15, 60_000), async (req, res) => {
    const lang = req.body?.lang === 'ar' ? 'ar' : 'en';
    const page = String(req.body?.page || '').slice(0, 100);
    const pageCtx = String(req.body?.pageContext || '').slice(0, 6000);
    const assignmentCtx = cleanAssignmentCtx(req.body?.assignmentContext);
    const msgs = Array.isArray(req.body?.messages) ? req.body.messages.slice(-8) : [];
    // with an active assignment the student may paste a draft for review, so the newest message may be longer
    const lastIdx = msgs.length - 1;
    const clean = msgs.map((m, i) => ({ m, i })).filter(({ m }) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map(({ m, i }) => ({ role: m.role, content: m.content.slice(0, assignmentCtx && i === lastIdx && m.role === 'user' ? 6000 : 1500) }));
    const last = [...clean].reverse().find((m) => m.role === 'user');
    if (!last) return res.status(400).json({ error: 'bad_request', message: 'No user message.' });

    const prevUser = clean.filter((m) => m.role === 'user').slice(-2, -1)[0];
    const lastQ = last.content.slice(0, 400);
    const query = lastQ.split(/\s+/).length < 4 && prevUser ? `${prevUser.content.slice(0, 300)} ${lastQ}` : lastQ;
    const found = r.search(query, { k: 6 });
    const sources = found.map((d, i) => publicSource(d, i + 1, lang));

    if (!env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'no_api_key', message: 'The AI service is not configured on the server (GEMINI_API_KEY missing).', sources });
    }
    const context = found.map((d, i) => {
      const body = d.kind === 'book' ? (d.text.ar || '').slice(0, 900) : `${d.text.en}\n${d.text.ar}`;
      return `[S${i + 1}] (${d.kind === 'book' ? 'Book' : 'Notes'}: ${label(d, 'en')})\n${body}`;
    }).join('\n\n');

    const contents = clean.map((m, i) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m === last && i === clean.length - 1 ? `SOURCES:\n${context || '(no relevant sources found)'}\n\nSTUDENT QUESTION:\n${m.content}` : m.content }],
    }));
    try {
      const out = await callGemini({ env, fetchImpl, system: SYSTEM(lang, page, pageCtx, assignmentCtx), contents, generationConfig: { temperature: 0.3, maxOutputTokens: 2000, thinkingConfig: { thinkingLevel: 'low' } } });
      const text = out.text;
      const cited = [...new Set([...text.matchAll(/\[S(\d+)\]/g)].map((m) => +m[1]))].filter((n) => n >= 1 && n <= sources.length);
      res.json({ answer: text, sources, cited });
    } catch (e) {
      if (!(e instanceof GeminiError)) throw e;
      const status = { timeout: 504, network: 504 }[e.kind] || 502;
      const error = ['timeout', 'network', 'empty'].includes(e.kind) ? e.kind : 'upstream';
      res.status(status).json({ error, message: e.message, sources });
    }
  });

  /* =============== Assignment Studio =============== */
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_FILE_BYTES, files: 1, fields: 4, parts: 6 } }).single('file');
  const fixName = (n = '') => { let s = String(n); if (/[\u00c0-\u00ff]/.test(s) && !/[^\u0000-\u00ff]/.test(s)) { const d = Buffer.from(s, 'latin1').toString('utf8'); if (!d.includes('\ufffd')) s = d; } return s.split(/[\\/]/).pop().replace(/[\u0000-\u001f\u202a-\u202e]/g, '').slice(0, 120) || 'document'; };
  const EXTRACT_STATUS = { empty_file: 400, empty_text: 422, too_large: 413, unsupported: 415, legacy_doc: 415, encrypted: 422, corrupt: 422, scanned_pdf: 422 };

  app.post('/api/assignment/extract', limit(12, 60_000), (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        const tooBig = err.code === 'LIMIT_FILE_SIZE';
        return res.status(tooBig ? 413 : 400).json({ error: tooBig ? 'too_large' : 'bad_upload', message: tooBig ? `The file is larger than ${MAX_FILE_BYTES / 1024 / 1024} MB.` : 'The upload could not be read.' });
      }
      if (!req.file) return res.status(400).json({ error: 'no_file', message: 'No file was uploaded.' });
      const name = fixName(req.file.originalname);
      try {
        const x = await extractDocument(req.file.buffer, name);
        const hash8 = crypto.createHash('sha256').update(req.file.buffer).digest('hex').slice(0, 8);
        const doc = docs.create({ text: x.text, hash8, warnings: x.warnings, file: { name, size: req.file.size, kind: x.kind } });
        res.json({ docId: doc.id, file: doc.file, stats: { chars: x.chars, words: x.words, pages: x.pages, truncated: x.truncated }, warnings: x.warnings, preview: x.text.slice(0, 500) });
      } catch (e) {
        if (e instanceof ExtractError) return res.status(EXTRACT_STATUS[e.code] || 422).json({ error: e.code, message: e.message });
        console.error('[extract]', e?.message);
        res.status(500).json({ error: 'extract_failed', message: 'The document could not be processed.' });
      } finally { req.file.buffer = null; }
    });
  });

  const STAGES = ['reading', 'identify', 'connect', 'prepare'];
  const jobSnapshot = (j) => ({ jobId: j.id, status: j.status, stages: STAGES.map((id) => ({ id, state: j.stages[id] })), result: j.status === 'done' ? j.result : undefined, error: j.status === 'error' ? j.error : undefined });

  app.post('/api/assignment/analyze', limit(6, 60_000), (req, res) => {
    const doc = docs.get(String(req.body?.docId || ''));
    if (!doc) return res.status(404).json({ error: 'doc_expired', message: 'This upload is no longer available. Please upload the file again.' });
    const lang = req.body?.lang === 'ar' ? 'ar' : 'en';
    const basic = req.body?.basic === true;
    if (!basic && !env.GEMINI_API_KEY) return res.status(503).json({ error: 'no_api_key', message: 'The AI service is not configured on the server (GEMINI_API_KEY missing).', canUseBasic: true });
    const key = `${lang}:${basic ? 'basic' : 'ai'}`;
    const make = (patch) => { const id = `${doc.id}.${doc.jobs.size + 1}`; const j = { id, status: 'running', stages: { reading: 'done', identify: 'pending', connect: 'pending', prepare: 'pending' }, ...patch }; doc.jobs.set(id, j); return j; };
    if (doc.results[key]) { const j = make({ status: 'done', result: doc.results[key], stages: { reading: 'done', identify: 'done', connect: 'done', prepare: 'done' } }); return res.status(200).json(jobSnapshot(j)); }   // cached: no API calls
    const running = [...doc.jobs.values()].find((j) => j.status === 'running' && j.key === key);
    if (running) return res.status(202).json(jobSnapshot(running));
    const job = make({ key });
    runAnalysis({ doc, lang, basic, env, fetchImpl, retriever: r, refRetriever: refs, setStage: (id, state) => { job.stages[id] = state; } })
      .then((result) => { job.result = result; job.status = 'done'; if (!result.warnings.includes('partial_result')) doc.results[key] = result; })
      .catch((e) => { const a = e instanceof AnalysisError ? e : new AnalysisError('internal', 'Unexpected error while analysing the document.'); if (!(e instanceof AnalysisError)) console.error('[analyze]', e?.stack || e); job.status = 'error'; job.error = { code: a.code, message: a.message, retryable: a.retryable, canUseBasic: true }; });
    res.status(202).json(jobSnapshot(job));
  });

  app.get('/api/assignment/jobs/:id', limit(240, 60_000), (req, res) => {
    const doc = docs.get(String(req.params.id).split('.')[0]);
    const job = doc?.jobs.get(req.params.id);
    if (!job) return res.status(404).json({ error: 'job_not_found', message: 'This analysis is no longer available. Please upload the file again.' });
    res.json(jobSnapshot(job));
  });

  app.delete('/api/assignment/docs/:id', limit(30, 60_000), (req, res) => { docs.delete(String(req.params.id)); res.json({ ok: true }); });

  if (fs.existsSync(DIST)) {
    app.use(express.static(DIST, { maxAge: '1h', setHeaders: (res, p) => { if (/\/assets\//.test(p)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); } }));
    app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(DIST, 'index.html')));
  }
  return app;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 8787;
  const app = createApp();
  const server = app.listen(port, () => console.log(`API + static server on http://localhost:${port} (AI ${process.env.GEMINI_API_KEY ? 'enabled' : 'DISABLED — set GEMINI_API_KEY'})`));
  server.on("error", (err) => {
    if (err && err.code === "EADDRINUSE") {
      console.warn(`[server] Port ${port} is already in use by another process; retrying on port ${port + 1}...`);
      app.listen(port + 1, () => console.log(`API + static server on http://localhost:${port + 1}`));
    } else {
      console.error(err);
    }
  });
}