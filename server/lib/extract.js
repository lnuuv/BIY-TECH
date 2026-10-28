import { createRequire as __createRequire } from "node:module";
if (!process.getBuiltinModule) { const __req = __createRequire(import.meta.url); process.getBuiltinModule = (id) => __req(id); }
// Document text extraction for uploaded assignment briefs.
// Supported: PDF (text layer only), DOCX, TXT/MD. Everything is parsed in memory — uploaded bytes are never
// written to disk, never executed, and never trusted as instructions.
import mammoth from 'mammoth';

export const MAX_FILE_BYTES = 8 * 1024 * 1024;     // upload size limit
export const MAX_PDF_PAGES = 60;                    // parsing budget
export const MAX_TEXT_CHARS = 120_000;              // text kept for analysis
export const MIN_TEXT_CHARS = 80;                   // below this the document is treated as empty/unreadable

export class ExtractError extends Error {
  constructor(code, message, extra = {}) { super(message); this.code = code; this.extra = extra; }
}

const EXT_KIND = { pdf: 'pdf', docx: 'docx', txt: 'txt', md: 'txt', text: 'txt' };
const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04];
const startsWith = (buf, bytes) => bytes.every((b, i) => buf[i] === b);

/** Decide the real format from magic bytes, not from the (spoofable) extension or MIME type. */
export function sniffKind(buf, filename = '') {
  const ext = String(filename).toLowerCase().split('.').pop();
  const declared = EXT_KIND[ext] || null;
  if (buf.length >= 5 && buf.subarray(0, 5).toString('latin1') === '%PDF-') return { kind: 'pdf', declared };
  if (buf.length >= 4 && startsWith(buf, ZIP_MAGIC)) {
    // a .docx is a ZIP containing word/document.xml; legacy .doc / other zips are rejected later by mammoth
    return { kind: 'docx', declared };
  }
  if (buf.length >= 8 && startsWith(buf, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return { kind: 'legacy-office', declared };
  // plain text: no NUL bytes in the first 4 KB (UTF-16 handled separately via BOM)
  const head = buf.subarray(0, 4096);
  const bom16 = head.length >= 2 && ((head[0] === 0xff && head[1] === 0xfe) || (head[0] === 0xfe && head[1] === 0xff));
  if (bom16 || !head.includes(0)) return { kind: 'txt', declared };
  return { kind: 'binary', declared };
}

export function decodeText(buf) {
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) return new TextDecoder('utf-16le').decode(buf.subarray(2));
  if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) {
    const swapped = Buffer.from(buf.subarray(2)); swapped.swap16(); return new TextDecoder('utf-16le').decode(swapped);
  }
  const s = new TextDecoder('utf-8', { fatal: false }).decode(buf.subarray(buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf ? 3 : 0));
  return s;
}

// invisible / bidi control characters and other junk that confuses tokenisation and prompts
const JUNK = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2060-\u2069\ufeff\ufffd]/g;
export function cleanText(s) {
  return s.replace(/\r\n?/g, '\n').replace(JUNK, ' ').replace(/[ \t\u00a0]+/g, ' ').replace(/ ?\n ?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

const AR = /[\u0600-\u06FF]/;
/** Word→PDF exports often swap lam/meem after the alef (e.g. "املستوى" for "المستوى"). Count occurrences. */
export function arabicGlitchScore(text) {
  const toks = text.split(/[^\u0621-\u064A]+/).filter((t) => t.length >= 4);
  if (!toks.length) return 0;
  return toks.filter((t) => /^ام[ل][\u0621-\u064A]{2,}/.test(t)).length;
}
/** Conservative repair of the one systematic glitch: leading "امل" → "الم". */
export function repairArabicPdf(text) {
  let n = 0;
  const out = text.replace(/(^|[^\u0621-\u064A])ام[ل](?=[\u0621-\u064A]{2,})/g, (_m, pre) => { n++; return `${pre}الم`; });
  return { text: out, repaired: n };
}

let pdfjsPromise;
const loadPdfjs = () => (pdfjsPromise ||= import('pdfjs-dist/legacy/build/pdf.mjs'));

async function extractPdf(buf) {
  const pdfjs = await loadPdfjs();
  let doc; let task;
  try {
    task = pdfjs.getDocument({ data: new Uint8Array(buf), isEvalSupported: false, disableFontFace: true, useSystemFonts: false, verbosity: 0, stopAtErrors: false });
    doc = await task.promise;
  } catch (e) {
    if (e?.name === 'PasswordException') throw new ExtractError('encrypted', 'This PDF is password-protected. Remove the password and upload it again.');
    throw new ExtractError('corrupt', 'This PDF could not be opened. It may be damaged — try exporting it again.');
  }
  try {
    const total = doc.numPages;
    const limit = Math.min(total, MAX_PDF_PAGES);
    const pages = [];
    for (let p = 1; p <= limit; p++) {
      const page = await doc.getPage(p);
      const tc = await page.getTextContent();
      pages.push(tc.items.map((i) => (i.str || '') + (i.hasEOL ? '\n' : ' ')).join(''));
      page.cleanup();
    }
    const text = cleanText(pages.join('\n\n'));
    const perPage = text.length / Math.max(1, limit);
    return { text, pages: total, parsedPages: limit, perPage };
  } finally {
    await Promise.resolve(task?.destroy?.()).catch(() => {});
  }
}

async function extractDocx(buf) {
  try {
    const r = await mammoth.extractRawText({ buffer: buf });
    return { text: cleanText(r.value || ''), warnings: (r.messages || []).length };
  } catch {
    throw new ExtractError('corrupt', 'This Word file could not be read. Make sure it is a .docx file (not an old .doc) and is not damaged.');
  }
}

/**
 * @returns {{text:string, kind:string, pages:number|null, chars:number, words:number, truncated:boolean, warnings:string[]}}
 * warnings are stable codes the UI translates: truncated_pages, truncated_text, arabic_pdf_glitch, arabic_pdf_repaired
 * @throws ExtractError  code: empty_file | too_large | unsupported | legacy_doc | encrypted | corrupt | scanned_pdf | empty_text
 */
export async function extractDocument(buf, filename = '') {
  if (!buf || !buf.length) throw new ExtractError('empty_file', 'The file is empty.');
  if (buf.length > MAX_FILE_BYTES) throw new ExtractError('too_large', `The file is larger than ${MAX_FILE_BYTES / 1024 / 1024} MB.`);
  const { kind, declared } = sniffKind(buf, filename);
  if (kind === 'legacy-office') throw new ExtractError('legacy_doc', 'Old .doc files are not supported. Save the file as .docx or PDF and upload it again.');
  if (kind === 'binary' || (declared && declared !== kind && !(declared === 'txt' && kind === 'txt'))) {
    throw new ExtractError('unsupported', 'This file type is not supported, or its content does not match its extension. Upload a PDF, DOCX or TXT file.');
  }
  if (!declared) throw new ExtractError('unsupported', 'Unsupported file type. Upload a PDF, DOCX or TXT file.');

  const warnings = [];
  let text = ''; let pages = null; let truncated = false;
  if (kind === 'pdf') {
    const r = await extractPdf(buf);
    text = r.text; pages = r.pages;
    if (r.parsedPages < r.pages) { warnings.push('truncated_pages'); truncated = true; }
    // image-only PDF: almost no text per page → scanned. We do not run OCR (not reliable enough) and say so.
    if (r.text.length < MIN_TEXT_CHARS || r.perPage < 40) throw new ExtractError('scanned_pdf', 'This PDF looks scanned (it has no readable text layer). Upload the original Word/PDF file, or a text version, so the content can be read accurately.', { pages });
    if (AR.test(text)) {
      const g = arabicGlitchScore(text);
      if (g >= 3) { const fixed = repairArabicPdf(text); text = fixed.text; warnings.push('arabic_pdf_glitch'); if (fixed.repaired) warnings.push('arabic_pdf_repaired'); }
    }
  } else if (kind === 'docx') {
    const r = await extractDocx(buf); text = r.text;
  } else {
    text = cleanText(decodeText(buf));
  }
  if (text.replace(/\s/g, '').length < MIN_TEXT_CHARS) throw new ExtractError('empty_text', 'No readable text was found in this document.');
  if (text.length > MAX_TEXT_CHARS) { text = text.slice(0, MAX_TEXT_CHARS); warnings.push('truncated_text'); truncated = true; }
  return { text, kind, pages, chars: text.length, words: text.split(/\s+/).filter(Boolean).length, truncated, warnings };
}
