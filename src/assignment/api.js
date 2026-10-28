// Client for the Assignment Studio endpoints. Errors are normalised to { code, message, retryable, canUseBasic }.
export const MAX_FILE_BYTES = 8 * 1024 * 1024;
export const ACCEPT = '.pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain';
const EXT_OK = /\.(pdf|docx|txt|md)$/i;

export class ApiError extends Error {
  constructor(code, message, extra = {}) { super(message); this.code = code; Object.assign(this, extra); }
}

/** Cheap checks before uploading (the server re-validates everything). */
export function precheck(file) {
  if (!file) return new ApiError('no_file', '');
  if (file.size === 0) return new ApiError('empty_file', '');
  if (file.size > MAX_FILE_BYTES) return new ApiError('too_large', '');
  if (/\.doc$/i.test(file.name)) return new ApiError('legacy_doc', '');
  if (!EXT_OK.test(file.name)) return new ApiError('unsupported', '');
  return null;
}

/** multipart upload with real progress (fetch cannot report upload progress). onProgress(pct) then onProcessing() once bytes are sent. */
export function uploadFile(file, { onProgress, onProcessing, signal } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/assignment/extract');
    xhr.responseType = 'json';
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100)); };
    xhr.upload.onload = () => onProcessing?.();
    xhr.onerror = () => reject(new ApiError('network', 'network'));
    xhr.onabort = () => reject(new ApiError('aborted', 'aborted'));
    xhr.onload = () => {
      const d = xhr.response;
      if (xhr.status >= 200 && xhr.status < 300 && d?.docId) resolve(d);
      else reject(new ApiError(d?.error || 'extract_failed', d?.message || '', { status: xhr.status }));
    };
    signal?.addEventListener('abort', () => xhr.abort());
    const fd = new FormData(); fd.append('file', file, file.name);
    xhr.send(fd);
  });
}

const json = async (res) => { const d = await res.json().catch(() => ({})); if (!res.ok) throw new ApiError(d.error || 'generic', d.message || '', { retryable: !!d.retryable, canUseBasic: !!d.canUseBasic, status: res.status }); return d; };

export async function startAnalysis(docId, lang, basic = false) {
  try { return await json(await fetch('/api/assignment/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ docId, lang, basic }) })); }
  catch (e) { throw e instanceof ApiError ? e : new ApiError('network', 'network'); }
}

/** Polls the job until it finishes. onUpdate(stages) receives the real server-side stage states. */
export async function waitForJob(first, { onUpdate, signal, intervalMs = 700 } = {}) {
  let snap = first;
  for (;;) {
    onUpdate?.(snap.stages);
    if (snap.status === 'done') return snap.result;
    if (snap.status === 'error') throw new ApiError(snap.error?.code || 'internal', snap.error?.message || '', { retryable: !!snap.error?.retryable, canUseBasic: !!snap.error?.canUseBasic });
    await new Promise((r, rej) => { const t = setTimeout(r, intervalMs); signal?.addEventListener('abort', () => { clearTimeout(t); rej(new ApiError('aborted', 'aborted')); }, { once: true }); });
    try { snap = await json(await fetch(`/api/assignment/jobs/${encodeURIComponent(first.jobId)}`, { signal })); }
    catch (e) { if (e instanceof ApiError) throw e; if (e?.name === 'AbortError') throw new ApiError('aborted', 'aborted'); throw new ApiError('network', 'network'); }
  }
}

export const discardDoc = (docId) => fetch(`/api/assignment/docs/${encodeURIComponent(docId)}`, { method: 'DELETE' }).catch(() => {});
