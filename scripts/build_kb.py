#!/usr/bin/env python3
"""Extracts Unit 1 (PDF pages 12-105) from the Arabic book into server/data/book-chunks.json.
Usage: python3 scripts/build_kb.py [path/to/L3_Information_Technology_Volume_1.pdf]
Requires `pdftotext` (poppler-utils). Output is used ONLY by the server for retrieval."""
import json, re, subprocess, sys, pathlib
pdf = sys.argv[1] if len(sys.argv) > 1 else 'L3_Information_Technology_Volume_1.pdf'
FIRST, LAST = 12, 105
strip = re.compile('[\u202a-\u202e\u200e\u200f\u2066-\u2069\x0c\b]')
junk = re.compile(r'(M01_INFO_ST_\S+.*?indd\s*\d+|\d{2}/\d{2}/\d{4}\s+\d{2}:\d{2}:\d{2}|�)')
chunks = []
for p in range(FIRST, LAST + 1):
    t = subprocess.run(['pdftotext', '-f', str(p), '-l', str(p), pdf, '-'], capture_output=True).stdout.decode('utf-8', 'ignore')
    t = junk.sub(' ', strip.sub('', t))
    paras = [re.sub(r'\s+', ' ', x).strip() for x in re.split(r'\n\s*\n', t)]
    paras = [x for x in paras if len(x) > 25]
    buf = ''
    n = 0
    for para in paras + ['']:
        if buf and (len(buf) + len(para) > 900 or not para):
            n += 1
            chunks.append({'id': f'book-p{p}-{n}', 'page': p, 'text': buf.strip()})
            buf = ''
        buf += ' ' + para
out = pathlib.Path(__file__).resolve().parent.parent / 'server' / 'data' / 'book-chunks.json'
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(chunks, ensure_ascii=False), encoding='utf-8')
print(f'{len(chunks)} chunks from pages {FIRST}-{LAST} -> {out}')
