import crypto from 'node:crypto';

/** In-memory document store with TTL. Ids are 128-bit random secrets: knowing the id is the only access control,
 *  so this is NOT per-user isolation — it is "unguessable link" access, and data disappears after the TTL or restart. */
export class DocStore {
  constructor({ ttlMs = 60 * 60_000, max = 200 } = {}) { this.ttlMs = ttlMs; this.max = max; this.map = new Map(); }
  create(data) {
    this.sweep();
    if (this.map.size >= this.max) { const oldest = [...this.map.entries()].sort((a, b) => a[1].touched - b[1].touched)[0]; if (oldest) this.map.delete(oldest[0]); }
    const id = crypto.randomBytes(16).toString('hex');
    const doc = { id, createdAt: Date.now(), touched: Date.now(), jobs: new Map(), results: {}, ...data };
    this.map.set(id, doc); return doc;
  }
  get(id) { const d = typeof id === 'string' ? this.map.get(id) : null; if (!d) return null; if (Date.now() - d.touched > this.ttlMs) { this.map.delete(id); return null; } d.touched = Date.now(); return d; }
  delete(id) { return this.map.delete(id); }
  sweep() { const now = Date.now(); for (const [k, d] of this.map) if (now - d.touched > this.ttlMs) this.map.delete(k); }
}
