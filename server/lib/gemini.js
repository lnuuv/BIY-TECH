// Single Gemini integration used by /api/chat and the Assignment Studio. The API key only ever travels in a header
// from the server; it is never logged, returned or put in a URL.
export const PRIMARY_MODEL = 'gemini-3.8-flash';
export const FALLBACK_MODEL = 'gemini-3.1-flash-lite';
const RETRYABLE = [404, 429, 500, 503];

export class GeminiError extends Error {
  constructor(kind, message, status = 0) { super(message); this.kind = kind; this.status = status; }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @param {object} o
 * @param {object} o.env  process.env-like
 * @param {Function} o.fetchImpl
 * @param {string} o.system  system instruction
 * @param {Array} o.contents Gemini contents array
 * @param {object} o.generationConfig
 * @param {number} [o.timeoutMs]
 * @param {number} [o.retries]  extra passes over the model list on 429/5xx (with backoff)
 * @returns {Promise<{text:string, finishReason:string|null, model:string}>}
 */
export async function callGemini({ env, fetchImpl = fetch, system, contents, generationConfig, timeoutMs = 60_000, retries = 0 }) {
  if (!env.GEMINI_API_KEY) throw new GeminiError('no_api_key', 'GEMINI_API_KEY missing');
  const models = [...new Set([env.GEMINI_MODEL || PRIMARY_MODEL, env.GEMINI_FALLBACK_MODEL || FALLBACK_MODEL])];
  const backoff = Number(env.GEMINI_RETRY_MS ?? 1500);
  let resp; let model;
  for (let pass = 0; pass <= retries; pass++) {
    for (model of models) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        resp = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
          method: 'POST', signal: ctrl.signal,
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
          body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents, generationConfig }),
        });
      } catch (e) {
        throw new GeminiError(e?.name === 'AbortError' ? 'timeout' : 'network', e?.name === 'AbortError' ? 'The AI took too long to answer.' : 'Could not reach the AI service.');
      } finally { clearTimeout(timer); }
      if (resp.ok || !RETRYABLE.includes(resp.status)) break;
      console.warn('[gemini]', model, resp.status, '→ trying next model');
    }
    if (resp.ok || !RETRYABLE.includes(resp.status) || pass === retries) break;
    await sleep(backoff * (pass + 1));
  }
  if (!resp.ok) {
    const detail = await resp.text().catch(() => '');
    console.error('[gemini]', resp.status, detail.slice(0, 300));
    throw new GeminiError(resp.status === 429 ? 'rate_limited' : 'upstream', `The AI service returned an error (${resp.status}).`, resp.status);
  }
  const data = await resp.json();
  const cand = data.candidates?.[0];
  const text = (cand?.content?.parts || []).map((p) => p.text || '').join('').trim();
  if (!text) throw new GeminiError(data.promptFeedback?.blockReason ? 'blocked' : 'empty', data.promptFeedback?.blockReason ? 'The request was blocked by the AI safety filter.' : 'The AI returned an empty answer.');
  return { text, finishReason: cand?.finishReason || null, model };
}

/** Parse model output as JSON (tolerates ```json fences and surrounding prose). Returns null if impossible. */
export function parseJsonLoose(text) {
  const t = String(text).trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try { return JSON.parse(t); } catch { /* fall through */ }
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch { /* ignore */ } }
  return null;
}
