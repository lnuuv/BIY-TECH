import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../i18n/index.jsx';
import ModelCanvas from '../../three/ModelCanvas.jsx';
import { Icon } from '../../components/ui.jsx';
import { TINY_STEPS, TINY_STEP, SLOTS, tryPlace, tinyPost } from '../tinyAssembly.js';
import { playPartSnap, playPostBeep, playUiClick } from '../sfx.js';
import { S } from './strings.js';

const ITEMS = [
  { key: 'cover', icon: 'wrench', steps: ['coverOff', 'coverOn'] },
  { key: 'cpu', icon: 'chip', steps: ['cpu'] },
  { key: 'cooler', icon: 'rotate', steps: ['cooler'] },
  { key: 'ram', icon: 'server', steps: ['ram'] },
  { key: 'm2', icon: 'doc', steps: ['m2'] },
  { key: 'vesa', icon: 'pc', steps: ['vesa'] },
  { key: 'display', icon: 'laptop', steps: ['display'] },
  { key: 'usb', icon: 'link', steps: ['usb'] },
  { key: 'lan', icon: 'network', steps: ['lan'] },
  { key: 'power', icon: 'power', steps: ['power'] },
];
const stepOfItem = (it, installed) => it.steps.find((s) => !installed.has(s)) || null;

export default function AssemblyPanel({ initial, onChange, onDone }) {
  const { c } = useI18n();
  const [installed, setInstalled] = useState(() => new Set(initial?.installed || []));
  const [mistakes, setMistakes] = useState(initial?.mistakes || 0);
  const [sel, setSel] = useState(null); // item key
  const [fb, setFb] = useState(null);
  const [post, setPost] = useState(null);
  const [drag, setDrag] = useState(null); // {key, x, y, over}
  const V = useRef(null); const model = useRef(null); const lib = useRef(null); const stageRef = useRef(null);
  const [ready, setReady] = useState(false);
  useEffect(() => { import('../../three/story/tinyModel.js').then((m) => { lib.current = m; setReady(true); }); }, []);
  useEffect(() => { onChange?.({ installed: [...installed], mistakes }); }, [installed, mistakes]); // eslint-disable-line react-hooks/exhaustive-deps

  const build = useCallback(() => { const m = lib.current.buildTinyAssembly(); model.current = m; return m; }, []);
  const onReady = useCallback((v) => {
    V.current = v; if (typeof window !== 'undefined') window.__asm = { viewer: v, model: model.current }; v.opts.autoRotate = false; v.controls.maxPolarAngle = Math.PI * 0.49;
    lib.current.applyTinyState(v, model.current, installed);
    if (installed.has('vesa')) setTimeout(() => focusMount(v), 50);
    else if (installed.has('coverOn')) setTimeout(() => focusBench(v), 50);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const focusBench = (v) => { const P = model.current.mountPos.constructor; v.flyTo(new P(2.1, 1.5, 0), new P(0.05, 0.42, 1), 9.8, 1.4); };
  const focusMount = (v) => { const p = model.current.mountPos; const P = p.constructor; v.flyTo(new P(p.x - 0.3, p.y - 0.6, p.z + 0.4), new P(0.2, 0.22, 1), 7.2, 1.4); };

  const next = useMemo(() => TINY_STEPS.find((s) => !installed.has(s.id) && s.requires.every((r) => installed.has(r))) || null, [installed]);
  const complete = TINY_STEPS.every((s) => installed.has(s.id));

  const place = (itemKey, slotRaw) => {
    const it = ITEMS.find((x) => x.key === itemKey); if (!it) return;
    const stepId = stepOfItem(it, installed);
    if (!stepId) { setFb({ ok: false, msg: { en: 'Already installed.', ar: 'مركّبة بالفعل.' } }); return; }
    const slot = slotRaw === 'frame' ? 'chassis' : slotRaw;
    const r = tryPlace(stepId, slot, installed);
    if (!r.ok) {
      playPostBeep(false);
      setMistakes((m) => m + 1);
      setFb({ ok: false, msg: r.reason, wrongSlot: r.wrongSlot, kind: r.kind, step: stepId });
      if (r.wrongSlot) V.current?.select(null);
      return;
    }
    playPartSnap();
    const n = new Set(installed); n.add(stepId); setInstalled(n);
    setFb({ ok: true, msg: r.msg, why: TINY_STEP[stepId].why, step: stepId });
    setSel(null); setPost(null);
    lib.current.applyTinyState(V.current, model.current, n, stepId);
    if (stepId === 'vesa') setTimeout(() => focusMount(V.current), 900);
    if (stepId === 'coverOn') setTimeout(() => focusBench(V.current), 700);
  };

  // tap-to-place on the canvas
  const onPick = (id) => {
    if (!id) return;
    const slot = id === 'frame' ? 'chassis' : id;
    if (sel) { place(sel, slot); return; }
    playUiClick('click');
    if (SLOTS[slot]) setFb({ ok: null, msg: { en: `${SLOTS[slot].name.en}: holds ${SLOTS[slot].holds.en}.`, ar: `${SLOTS[slot].name.ar}: مخصص لـ ${SLOTS[slot].holds.ar}.` } });
  };
  const labelText = (id) => { const s = SLOTS[id === 'frame' ? 'chassis' : id]; return s ? c(s.name) : ''; };

  // pointer-based drag (mouse + touch)
  const startDrag = (e, key) => {
    const it = ITEMS.find((x) => x.key === key); if (!stepOfItem(it, installed)) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDrag({ key, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, moved: false, over: null });
  };
  const pickAt = (x, y) => {
    const v = V.current; if (!v) return null;
    const b = v.renderer.domElement.getBoundingClientRect();
    if (x < b.left || x > b.right || y < b.top || y > b.bottom) return null;
    v.pointer.set(((x - b.left) / b.width) * 2 - 1, -((y - b.top) / b.height) * 2 + 1);
    return v.pick();
  };
  const moveDrag = (e) => {
    if (!drag) return;
    const moved = drag.moved || Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 6;
    const over = moved ? pickAt(e.clientX, e.clientY) : null;
    V.current?.setHover(over);
    setDrag({ ...drag, x: e.clientX, y: e.clientY, moved, over });
  };
  const endDrag = (e) => {
    if (!drag) return;
    const d = drag; setDrag(null); V.current?.setHover(null);
    if (!d.moved) { playUiClick('click'); setSel(sel === d.key ? null : d.key); return; }
    const over = pickAt(e.clientX, e.clientY);
    if (over) place(d.key, over);
  };

  const showHint = () => { if (!next) return; playUiClick('click'); const slot = next.slot === 'chassis' ? (installed.has('coverOff') ? 'frame' : 'chassis') : next.slot; V.current?.select(slot); setFb({ ok: null, msg: next.how }); };
  const doPost = () => { const r = tinyPost(installed); playPostBeep(r.ok); setPost(r); if (!r.ok) setMistakes((m) => m + 1); };

  return (
    <div className="st-asm" onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={() => setDrag(null)}>
      <div className="st-col">
        <h3 style={{ marginTop: 0 }}>{c(S.inventory)}</h3>
        <div className="st-inv">
          {ITEMS.map((it) => {
            const st = stepOfItem(it, installed); const done = !st;
            const step = TINY_STEP[st || it.steps[it.steps.length - 1]];
            return (
              <button key={it.key} className={`st-item ${sel === it.key ? 'sel' : ''} ${done ? 'done' : ''}`} onPointerDown={(e) => startDrag(e, it.key)} aria-pressed={sel === it.key} disabled={done}>
                <span className="ic"><Icon name={it.icon} size={16} /></span>
                <span style={{ flex: 1 }}>{c(step.part)}</span>
                {done && <Icon name="check" size={14} />}
              </button>
            );
          })}
        </div>
        {sel && <div className="st-msg info">{c(S.selected)}</div>}
        <h3>{c(S.instr)}</h3>
        <ol className="st-steps">
          {TINY_STEPS.map((s, i) => (<li key={s.id} className={`${installed.has(s.id) ? 'on' : ''} ${next?.id === s.id ? 'cur' : ''}`}><i>{installed.has(s.id) ? '✓' : i + 1}</i>{c(s.title)}</li>))}
        </ol>
      </div>
      <div className="stage" ref={stageRef}>
        {ready && <ModelCanvas modelKey="tiny" build={build} onReady={onReady} onPick={onPick} labelText={labelText} autoRotate={false} ariaLabel="Tiny PC assembly 3D" />}
        {drag?.moved && <div className="st-drophint st-chip">{drag.over ? c(SLOTS[drag.over === 'frame' ? 'chassis' : drag.over]?.name) : c(S.dragHere)}</div>}
        <div className="st-row" style={{ position: 'absolute', bottom: 12, insetInlineStart: 12, zIndex: 3 }}>
          <button className="st-btn sm" onClick={showHint} disabled={!next}><Icon name="info" size={15} />{c(S.hint)}</button>
          <span className="st-chip">{installed.size}/{TINY_STEPS.length}</span>
          <span className="st-chip">{c(S.mistakes).replace('{n}', mistakes)}</span>
        </div>
      </div>
      <div className="st-col" aria-live="polite">
        <h2 style={{ marginTop: 0, fontSize: 18 }}>{c(S.asTitle)}</h2>
        <p className="st-small" style={{ margin: '0 0 10px' }}>{c(S.asLead)}</p>
        {next && !complete && (
          <div className="st-card">
            <h4><span className="st-dot">{TINY_STEPS.indexOf(next) + 1}</span>{c(next.title)}</h4>
            <p style={{ fontSize: 13.5, margin: '6px 0' }}>{c(next.how)}</p>
            <p className="st-small" style={{ margin: 0 }}><b>{c(S.why)}:</b> {c(next.why)}</p>
            {next.safety.en !== '—' && <p className="st-small" style={{ margin: '6px 0 0' }}><b>{c(S.safety)}:</b> {c(next.safety)}</p>}
          </div>
        )}
        {fb && <div className={`st-msg ${fb.ok === true ? 'ok' : fb.ok === false ? 'bad' : 'info'}`} key={JSON.stringify(fb.msg) + mistakes}>{c(fb.msg)}{fb.ok && fb.why && <div className="st-small" style={{ marginTop: 6 }}>{c(fb.why)}</div>}</div>}
        <h3>{c(S.postTitle)}</h3>
        <button className={`st-btn ${complete ? 'primary' : ''}`} onClick={doPost} style={{ width: '100%' }}><Icon name="power" size={16} />{c(S.post)}</button>
        {post && (
          <>
            <ul className="st-list" style={{ marginTop: 8 }}>{post.lines.map((l, i) => (<li key={i} className={l.ok ? 'ok' : 'bad'}><span className={`st-dot ${l.ok ? 'ok' : 'bad'}`}>{l.ok ? '✓' : '!'}</span>{c(l.msg)}</li>))}</ul>
            {post.warn && <div className="st-msg warn">{c(post.warn)}</div>}
            {post.ok && <div className="st-msg ok">{c(S.asDone)}</div>}
          </>
        )}
        {post?.ok && <button className="st-btn primary" style={{ width: '100%', marginTop: 10 }} onClick={() => onDone({ installed: [...installed], mistakes, postOk: true })}>{c(S.toSoftware)} ›</button>}
        <p className="st-small" style={{ marginTop: 12 }}>{c(S.simplified)}</p>
      </div>
      {drag?.moved && <div className="st-chip" style={{ position: 'fixed', left: drag.x + 12, top: drag.y + 12, zIndex: 30, pointerEvents: 'none' }}>{c(TINY_STEP[stepOfItem(ITEMS.find((x) => x.key === drag.key), installed)]?.part)}</div>}
    </div>
  );
}
