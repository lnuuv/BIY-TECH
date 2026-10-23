import React, { useEffect, useRef } from 'react';
import { iconPath } from '../ui.jsx';
import * as S from '../../lab/sim.js';
import { ICON } from './LabToolbar.jsx';

export const W = 1000, H = 640;

export const size = (d) =>
  d.type === 'switch'
    ? { w: 170, h: 52 }
    : d.type === 'router' || d.type === 'internet'
      ? { w: 124, h: 62 }
      : d.type === 'ap'
        ? { w: 100, h: 58 }
        : { w: 86, h: 62 };

export function portPos(d, portId) {
  const { w, h } = size(d);
  const p = d.ports.find((x) => x.id === portId) || d.ports[0];
  const edge = d.ports.filter((x) => (x.kind === 'wifi') === (p.kind === 'wifi'));
  const i = edge.indexOf(p), n = edge.length;
  const top = p.kind === 'wifi';
  return { x: d.x - w / 2 + (w * (i + 1)) / (n + 1), y: d.y + (top ? -h / 2 - 9 : h / 2 + 9), top };
}

export default function LabSchematic2D({
  t,
  svgRef,
  model,
  cfgs,
  sel,
  setSel,
  conn,
  setConn,
  connTargets,
  failDev,
  hot,
  setHot,
  anim,
  fwdPts,
  backPts,
  reduced,
  dev,
  dname,
  onMove,
  onUpCanvas,
  onDrop2D,
  onDevDown,
  onPortDown,
  onPortUp,
  mut,
}) {
  return (
    <div className="canvas-wrap">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="lab-svg"
        onPointerMove={onMove}
        onPointerUp={onUpCanvas}
        onPointerDown={() => { setSel(null); if (!conn?.dragged) setConn(null); }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop2D}
        role="group"
        aria-label={t('lab.canvas')}
      >
        <defs>
          <pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1.2" fill="var(--grid)" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#dots)" />
        {model.devices.length === 0 && (
          <g className="empty-hint">
            <text x={W / 2} y={H / 2 - 6} textAnchor="middle">{t('lab.empty.t')}</text>
            <text x={W / 2} y={H / 2 + 22} textAnchor="middle" className="sub">{t('lab.empty.d')}</text>
          </g>
        )}
        {model.links.map((l) => {
          const a = dev(l.a.d), b = dev(l.b.d);
          if (!a || !b) return null;
          const pa = portPos(a, l.a.p), pb = portPos(b, l.b.p);
          const up = S.isLinkUp(model, l);
          const hotL = hot.links.has(l.id);
          const mx = (pa.x + pb.x) / 2, my = (pa.y + pb.y) / 2 + (l.kind === 'wifi' ? -30 : 28);
          const d = `M${pa.x},${pa.y} Q${mx},${my} ${pb.x},${pb.y}`;
          return (
            <g
              key={l.id}
              className={`cable ${l.kind} ${up ? 'up' : 'down'} ${hotL ? 'hot' : ''} ${sel?.id === l.id ? 'sel' : ''}`}
              onPointerDown={(e) => { e.stopPropagation(); setSel({ type: 'link', id: l.id }); }}
            >
              <path d={d} className="hit" />
              <path d={d} className="line" pathLength="1" />
            </g>
          );
        })}
        {conn && (() => {
          const d = dev(conn.d);
          if (!d) return null;
          const p = portPos(d, conn.p);
          return <path className="rubber" d={`M${p.x},${p.y} L${conn.x},${conn.y}`} />;
        })()}
        {model.devices.map((d) => {
          const { w, h } = size(d);
          const isSel = sel?.id === d.id;
          const isFail = failDev === d.id;
          const cf = d.kind === 'host' ? cfgs.get(d.id) : null;
          const ip = cf ? cf.ip : null;
          return (
            <g
              key={d.id}
              transform={`translate(${d.x},${d.y})`}
              className={`node ${d.on ? '' : 'off'} ${isSel ? 'sel' : ''} ${isFail ? 'fail' : ''} ${hot.devs.has(d.id) ? 'hot' : ''}`}
              tabIndex={0}
              role="button"
              aria-label={`${dname(d)} ${ip || ''}`}
              onPointerDown={(e) => onDevDown(e, d)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSel({ type: 'dev', id: d.id }); }
                const st = e.shiftKey ? 30 : 10;
                const mv = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, -st], ArrowDown: [0, st] }[e.key];
                if (mv) {
                  e.preventDefault();
                  mut((m) => {
                    const x = m.devices.find((z) => z.id === d.id);
                    S.moveDevice(m, d.id, { x: x.x + mv[0], y: x.y + mv[1] });
                  });
                }
              }}
            >
              {isFail && <rect className="fail-ring" x={-w / 2 - 8} y={-h / 2 - 8} width={w + 16} height={h + 16} rx="18" />}
              <rect className="body" x={-w / 2} y={-h / 2} width={w} height={h} rx="14" />
              <g transform={`translate(${d.type === 'switch' ? -w / 2 + 14 : -12},${d.type === 'switch' ? -10 : -h / 2 + 8}) scale(1)`} className="glyph">
                <path d={iconPath(ICON[d.type])} fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </g>
              {d.type === 'switch' && <text className="nm" x={-w / 2 + 44} y={4}>{dname(d)}</text>}
              {d.type !== 'switch' && <text className="nm" y={h / 2 - 9} textAnchor="middle">{dname(d)}</text>}
              {ip !== null && <text className="ip" y={h / 2 + 34} textAnchor="middle">{ip || '—'}</text>}
              {d.kind === 'router' && <text className="ip" y={h / 2 + 34} textAnchor="middle">{d.ports.filter((p) => p.ip).map((p) => p.ip).slice(0, 2).join(' · ')}</text>}
              {!d.on && <text className="offtag" x={w / 2 - 6} y={-h / 2 + 12} textAnchor="end">OFF</text>}
              {d.ports.map((p) => {
                const pp = portPos(d, p.id);
                const linked = model.links.some((l) => (l.a.d === d.id && l.a.p === p.id) || (l.b.d === d.id && l.b.p === p.id));
                const key = `${d.id}:${p.id}`;
                const okT = connTargets?.has(key);
                const isFrom = conn && conn.d === d.id && conn.p === p.id;
                return (
                  <g
                    key={p.id}
                    className={`port ${p.kind} ${linked ? 'linked' : ''} ${connTargets ? (okT ? 'ok' : 'no') : ''} ${isFrom ? 'from' : ''}`}
                    transform={`translate(${pp.x - d.x},${pp.y - d.y})`}
                    onPointerDown={(e) => onPortDown(e, d, p)}
                    onPointerUp={(e) => onPortUp(e, d, p)}
                  >
                    <circle r="13" className="phit" />
                    <circle r={p.kind === 'wifi' ? 5.5 : 5} className="pdot" />
                    <text y={pp.top ? -11 : 21} textAnchor="middle" className="plabel">{p.id}</text>
                  </g>
                );
              })}
            </g>
          );
        })}
        <PacketLayer key={anim?.id} anim={anim} fwdPts={fwdPts} backPts={backPts} reduced={reduced} model={model} onHot={setHot} />
      </svg>
      {conn && (
        <div className="canvas-note" role="status">
          {t('lab.connecting')}{' '}
          <button className="btn sm ghost" onClick={() => setConn(null)}>{t('common.cancel')}</button>
        </div>
      )}
    </div>
  );
}

/** Animated data packet travelling along the real path in 2D schematic mode. */
function PacketLayer({ anim, fwdPts, backPts, reduced, model, onHot }) {
  const ref = useRef(null);
  const mark = useRef(null);
  useEffect(() => {
    if (!anim || fwdPts.length < 2) {
      onHot({ devs: new Set(), links: new Set() });
      return undefined;
    }
    const el = ref.current, x = mark.current;
    let raf, cancelled = false;
    const seg = (pts) => {
      const L = [];
      let tot = 0;
      for (let i = 0; i < pts.length - 1; i++) {
        const d = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
        L.push(d);
        tot += d;
      }
      return { L, tot };
    };
    const at = (pts, s, u) => {
      let acc = 0;
      for (let i = 0; i < s.L.length; i++) {
        if (u <= acc + s.L[i] || i === s.L.length - 1) {
          const k = s.L[i] ? Math.min(1, (u - acc) / s.L[i]) : 1;
          return { x: pts[i].x + (pts[i + 1].x - pts[i].x) * k, y: pts[i].y + (pts[i + 1].y - pts[i].y) * k };
        }
        acc += s.L[i];
      }
      return pts.at(-1);
    };
    const legs = [{ pts: fwdPts, color: 'var(--accent)' }];
    if (backPts.length > 1) legs.push({ pts: backPts, color: anim.ok ? 'var(--ok)' : 'var(--warn)' });
    const speed = 420;
    let li = 0;
    let t0 = performance.now();
    const hotFor = (ids) => {
      const devs = new Set(ids);
      const links = new Set();
      for (let i = 0; i < ids.length - 1; i++) {
        const l = model.links.find((q) => (q.a.d === ids[i] && q.b.d === ids[i + 1]) || (q.a.d === ids[i + 1] && q.b.d === ids[i]));
        if (l) links.add(l.id);
      }
      return { devs, links };
    };
    onHot(hotFor(anim.path));
    const frame = (now) => {
      if (cancelled) return;
      const leg = legs[li];
      const s = seg(leg.pts);
      const dur = reduced ? 1 : (s.tot / speed) * 1000 + 120;
      const k = Math.min(1, (now - t0) / dur);
      const p = at(leg.pts, s, s.tot * k);
      el.setAttribute('transform', `translate(${p.x},${p.y})`);
      el.style.opacity = 1;
      el.firstChild.setAttribute('fill', leg.color);
      if (k >= 1) {
        if (li === 0 && !anim.ok) {
          x.setAttribute('transform', `translate(${p.x},${p.y})`);
          x.style.opacity = 1;
          el.style.opacity = 0;
          return;
        }
        if (li + 1 < legs.length) {
          li += 1;
          t0 = now + 160;
          el.style.opacity = 0;
          raf = requestAnimationFrame(frame);
          return;
        }
        setTimeout(() => {
          if (!cancelled) {
            el.style.opacity = 0;
            onHot({ devs: new Set(), links: new Set() });
          }
        }, 600);
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [anim]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <g pointerEvents="none">
      <g ref={ref} style={{ opacity: 0 }}>
        <circle r="8" fill="var(--accent)" className="packet" />
        <circle r="14" fill="none" stroke="var(--accent)" opacity=".35" />
      </g>
      <g ref={mark} style={{ opacity: 0 }} className="xmark">
        <circle r="13" />
        <path d="M-5,-5 L5,5 M5,-5 L-5,5" />
      </g>
    </g>
  );
}
