import { useSyncExternalStore } from 'react';
import { buildTutorContext } from '../../shared/assignment-context.js';

// Analysed assignments are kept in this browser's localStorage (same approach as the progress store).
// There are no student accounts on this site, so this is per-browser/device storage — not per-student, not private from other users of the same browser.
const KEY = 'u1.assignment.v1';
const MAX_ITEMS = 3;
const fresh = () => ({ active: null, items: {} });
let state = (() => { try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); return s && typeof s === 'object' && s.items ? { ...fresh(), ...s } : fresh(); } catch { return fresh(); } })();
const subs = new Set();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full or blocked */ } };
const set = (next) => { state = next; save(); subs.forEach((f) => f()); };

export const useAssignments = () => useSyncExternalStore((cb) => (subs.add(cb), () => subs.delete(cb)), () => state, () => state);
export const getAssignments = () => state;

export const assignmentActions = {
  /** @param result server analysis result  @param meta {docId, name, size} */
  save(result, meta) {
    const id = result.id;
    const items = { ...state.items, [id]: { id, at: Date.now(), docId: meta?.docId || id, name: meta?.name || result.file?.name || '', size: meta?.size || 0, result } };
    const ids = Object.keys(items).sort((a, b) => items[b].at - items[a].at);
    for (const old of ids.slice(MAX_ITEMS)) delete items[old];
    set({ active: id, items });
  },
  open: (id) => { if (state.items[id]) set({ ...state, active: id }); },
  close: () => set({ ...state, active: null }),
  remove: (id) => { const items = { ...state.items }; delete items[id]; set({ active: state.active === id ? null : state.active, items }); },
};

export const getActiveAssignment = () => (state.active ? state.items[state.active] || null : null);
/** compact JSON string describing the active assignment for the AI tutor, or '' */
let memo = { id: null, at: 0, ctx: '' };
export function getTutorContext() {
  const a = getActiveAssignment(); if (!a) return '';
  if (memo.id === a.id && memo.at === a.at) return memo.ctx;
  memo = { id: a.id, at: a.at, ctx: buildTutorContext(a.result) || '' };
  return memo.ctx;
}
