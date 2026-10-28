#!/usr/bin/env node
// Indexes historical Pearson BTEC briefs / reference files in server/data/reference/ into server/data/reference-chunks.json.
// Re-run (npm run kb:refs) whenever files are added or removed. The server loads the JSON at startup and searches it with
// the same BM25 Retriever used for the lessons and the textbook — nothing is hardcoded per assignment.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { extractDocument } from '../server/lib/extract.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'server', 'data', 'reference');
const out = path.join(root, 'server', 'data', 'reference-chunks.json');

export function chunkReference(text, max = 800) {
  const paras = text.split(/\n{2,}|\n(?=[|#▪•\-\d])/).map((p) => p.replace(/\s+/g, ' ').trim()).filter((p) => p.length > 20);
  const chunks = []; let buf = '';
  for (const p of paras) { if (buf && buf.length + p.length > max) { chunks.push(buf); buf = ''; } buf += (buf ? ' ' : '') + p; }
  if (buf) chunks.push(buf);
  return chunks;
}

const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /\.(pdf|docx|txt|md)$/i.test(f)).sort() : [];
const chunks = []; const manifest = [];
for (const f of files) {
  const buf = fs.readFileSync(path.join(dir, f));
  const hash8 = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 8);
  try {
    const r = await extractDocument(buf, f);
    const parts = chunkReference(r.text);
    parts.forEach((t, i) => chunks.push({ id: `ref-${hash8}-${i + 1}`, file: f, hash8, text: t }));
    manifest.push({ file: f, hash8, chars: r.chars, chunks: parts.length, warnings: r.warnings });
    console.log(`✓ ${f}: ${parts.length} chunks${r.warnings.length ? ` (${r.warnings.join(',')})` : ''}`);
  } catch (e) { console.warn(`✗ ${f}: ${e.code || e.message} — skipped`); manifest.push({ file: f, hash8, error: e.code || 'error' }); }
}
fs.writeFileSync(out, JSON.stringify({ built: new Date().toISOString(), manifest, chunks }), 'utf8');
console.log(`${chunks.length} chunks from ${manifest.filter((m) => !m.error).length}/${files.length} files -> ${path.relative(root, out)}`);
