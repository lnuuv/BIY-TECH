import React, { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/index.jsx';
import FullscreenButton from '../components/FullscreenButton.jsx';

function webglOk() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } }

/** Mounts the three.js viewer lazily (code-split). `build()` must return a model; change `modelKey` to rebuild. */
export default function ModelCanvas({ modelKey, build, labels = false, autoRotate = true, onReady, onSelect, onHover, onPick, labelText, ariaLabel, className = '', children }) {
  const { t } = useI18n();
  const host = useRef(null);
  const viewer = useRef(null);
  const cbs = useRef({});
  const stageRef = useRef(null);
  cbs.current = { onSelect, onHover, onPick, labelText, build };
  const [state, setState] = useState('loading');

  useEffect(() => {
    if (!webglOk()) { setState('nogl'); return undefined; }
    let dead = false;
    (async () => {
      try {
        const { Viewer } = await import('./engine.js');
        if (dead || !host.current) return;
        const v = new Viewer(host.current, {
          labels, autoRotate, ariaLabel,
          onSelect: (id) => cbs.current.onSelect?.(id),
          onHover: (id) => cbs.current.onHover?.(id),
          onPick: cbs.current.onPick ? (id) => cbs.current.onPick(id) : undefined,
          labelText: (id, forced) => cbs.current.labelText?.(id, forced),
        });
        viewer.current = v;
        await new Promise((r) => requestAnimationFrame(r));
        v.setModel(cbs.current.build());
        setState('ready'); onReady?.(v);
      } catch (e) { console.error('3D init failed', e); if (!dead) setState('error'); }
    })();
    return () => { dead = true; viewer.current?.dispose(); viewer.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // swap model without recreating the WebGL context
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const v = viewer.current; if (!v) return;
    v.setModel(cbs.current.build()); onReady?.(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelKey]);
  useEffect(() => { viewer.current?.setLabels(labels); }, [labels]);
  useEffect(() => { if (viewer.current) viewer.current.opts.autoRotate = autoRotate; }, [autoRotate]);

  return (
    <div ref={stageRef} className={`stage ${className}`}>
      <div ref={host} className="stage-host" />
      {state === 'loading' && <div className="stage-overlay"><div className="spinner" /><span>{t('3d.loading')}</span></div>}
      {(state === 'nogl' || state === 'error') && <div className="stage-overlay"><span>{t(state === 'nogl' ? '3d.nogl' : '3d.error')}</span></div>}
      <div className="stage-tools stage-fullscreen-tool"><FullscreenButton targetRef={stageRef} /></div>
      {children}
    </div>
  );
}
