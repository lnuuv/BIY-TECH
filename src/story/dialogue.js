// Generic dialogue manager. Pure and serialisable so it can be saved and unit-tested.
import { DIALOGUES } from './config/dialogues.js';

/** state: { id, node, history: [{node, choice}], done: false, checkpoint: null } */
export function startDialogue(id, db = DIALOGUES) {
  const d = db[id]; if (!d) throw new Error(`Unknown dialogue ${id}`);
  return { id, node: d.start, history: [], done: false, checkpoint: null };
}

export function currentNode(state, db = DIALOGUES) {
  const d = db[state.id];
  return d.nodes[state.node];
}

/** what the UI should show for the current node */
export function view(state, db = DIALOGUES) {
  const d = db[state.id]; const n = d.nodes[state.node];
  return {
    speaker: n.speaker,
    text: n.text,
    gesture: n.gesture || 'talk',
    react: n.react || null,
    choices: n.choices ? n.choices.map((c, i) => ({ i, text: c.text })) : null,
    player: d.player,
    cast: d.cast,
    end: n.end || null,
    canContinue: !n.choices,
  };
}

/** advance: pass the choice index when the node has choices, otherwise nothing */
export function advance(state, choice, db = DIALOGUES) {
  if (state.done) return state;
  const d = db[state.id]; const n = d.nodes[state.node];
  if (n.choices) {
    if (choice == null || !n.choices[choice]) return state; // ignore invalid input – never break the story
    const c = n.choices[choice];
    return { ...state, node: c.next, history: [...state.history, { node: state.node, choice, said: c.text, speaker: d.player, gesture: c.gesture || 'talk' }] };
  }
  if (n.end) return { ...state, done: true, checkpoint: n.end, history: [...state.history, { node: state.node }] };
  if (n.next) return { ...state, node: n.next, history: [...state.history, { node: state.node }] };
  return { ...state, done: true, checkpoint: null };
}

/** design-time check: every node reachable from start must be able to reach an `end` node, and links must exist */
export function validateDialogue(id, db = DIALOGUES) {
  const d = db[id]; const errors = [];
  const seen = new Set(); const stack = [d.start];
  while (stack.length) {
    const k = stack.pop(); if (seen.has(k)) continue; seen.add(k);
    const n = d.nodes[k]; if (!n) { errors.push(`missing node ${k}`); continue; }
    const nexts = n.choices ? n.choices.map((c) => c.next) : n.next ? [n.next] : [];
    if (!n.end && !nexts.length) errors.push(`dead end at ${k}`);
    if (n.choices && n.choices.length > 4) errors.push(`too many choices at ${k}`);
    stack.push(...nexts);
  }
  // every reachable node can reach an end (no loops without exit)
  const ends = new Set(); const endsOf = (k, path = new Set()) => {
    if (ends.has(k)) return true; if (path.has(k)) return false; path.add(k);
    const n = d.nodes[k]; if (!n) return false; if (n.end) { ends.add(k); return true; }
    const nexts = n.choices ? n.choices.map((c) => c.next) : [n.next];
    const ok = nexts.every((x) => endsOf(x, new Set(path))); if (ok) ends.add(k); return ok;
  };
  for (const k of seen) if (!endsOf(k)) errors.push(`node ${k} cannot reach an end`);
  const endIds = new Set([...seen].map((k) => d.nodes[k]?.end).filter(Boolean));
  if (endIds.size !== 1) errors.push(`paths must converge on one checkpoint, found ${[...endIds].join(',')}`);
  return { ok: errors.length === 0, errors, checkpoint: [...endIds][0], reachable: seen.size };
}
