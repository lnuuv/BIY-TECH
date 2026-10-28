import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useI18n } from '../i18n/index.jsx';
import { PARTS, MODELS } from '../../shared/content/parts.js';
import { LESSON_BY_ID } from '../../shared/content/lessons.js';
import { actions } from '../store/progress.js';
import { Icon } from '../components/ui.jsx';
import ModelCanvas from '../three/ModelCanvas.jsx';
import '../styles/ar.css';

// AR page — works on every phone and laptop:
//  • 'view'   — normal 3D (teacher's computer, or before the camera is opened). Shows a QR code on big screens.
//  • 'camera' — the back/front camera fills the screen and the model stands in the room; turning the phone
//               keeps the model in place (gyroscope). Works on iPhone, Android, and laptops.
//  • 'xr'     — Android Chrome (ARCore): real WebXR, the PC stands on the real table at true size.
//  • iPhone   — "On the table" opens Apple AR Quick Look with the model exported on the fly (true size,
//               assembled or taken apart).
const loadBuilders = () => import('../three/models.js');
const AR_MODELS = ['pc', 'motherboard', 'rack', 'network'];
const SHORT = {
  pc: { en: 'PC', ar: 'الحاسوب' },
  motherboard: { en: 'Motherboard', ar: 'اللوحة الأم' },
  rack: { en: 'Server rack', ar: 'رف الخوادم' },
  network: { en: 'Network', ar: 'الشبكة' },
};
// the parts that get a floating name tag when taken apart, and the order of the guided tour
const KEY_PARTS = {
  pc: ['sidepanel', 'gpu', 'cooler', 'ram', 'cpu', 'm2', 'pcb', 'psu', 'case'],
  motherboard: ['cooler', 'cpu', 'ram', 'm2', 'chipset', 'vrm', 'battery', 'io', 'atx', 'pcb'],
  rack: ['ups', 'storage2u', 'server1u', 'rackswitch', 'patch', 'rackcables'],
  network: ['isp', 'router', 'firewall', 'switch', 'ap', 'server', 'nas', 'pc1', 'pc2', 'laptop', 'printer'],
};
// world-space offsets (1 unit = 10 cm) seen from the glass side: −x comes towards you, +z goes right, +y up
const PC_AR_EXPLODE = {
  sidepanel: [-0.6, 0, 4.4], cooler: [-2.4, 2.6, -0.6], cpu: [-2.8, 1.2, -1.9], ram: [-2.3, 2.2, 1.5], vrm: [-1.6, 3.2, 0.3],
  gpu: [-2.4, -0.5, 3.1], m2: [-2.6, 0.3, 2.2], chipset: [-1.8, -0.2, 1.4], battery: [-2.0, 0.5, 0.8], atx: [-1.6, -0.1, 2.6],
  cpupower: [-1.6, 2.6, -2.2], sata: [-1.6, -0.6, 1.8], io: [-1.3, 0.8, -3.4], psu: [-2.4, -0.3, -3.0],
};
const isPhone = () => typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
const canQuickLook = () => { try { return document.createElement('a').relList.supports('ar'); } catch { return false; } };

export default function ARView() {
  const { t, c, lang, setLang, dir } = useI18n();
  const [params] = useSearchParams();
  const [model, setModel] = useState(() => { const m = params.get('m'); return AR_MODELS.includes(m) ? m : 'pc'; });
  const [mode, setMode] = useState('view');
  const [gyro, setGyro] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [sel, setSel] = useState(null);
  const [tour, setTour] = useState(false);
  const [xrOk, setXrOk] = useState(false);
  const [xrStatus, setXrStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [ready, setReady] = useState(false);
  const [qr, setQr] = useState('');
  const phone = useRef(isPhone()).current;
  const quickLook = useRef(canQuickLook()).current;
  const viewer = useRef(null);
  const builders = useRef(null);
  const video = useRef(null);
  const stream = useRef(null);
  const ui = useRef(null);
  const lastMulti = useRef(0);
  const usdz = useRef({});
  const tourTimer = useRef(null);
  const modeRef = useRef(mode); modeRef.current = mode;
  const modelRef = useRef(model); modelRef.current = model;
  const langRef = useRef(lang); langRef.current = lang;
  const cRef = useRef(c); cRef.current = c;

  useEffect(() => { loadBuilders().then((m) => { builders.current = m.BUILDERS; setReady(true); }); }, []);
  useEffect(() => {
    let live = true;
    navigator.xr?.isSessionSupported?.('immersive-ar').then((ok) => live && setXrOk(!!ok)).catch(() => {});
    return () => { live = false; };
  }, []);

  // QR code (for the teacher's screen) that opens this exact model on a phone
  useEffect(() => {
    if (phone) return;
    const lan = typeof __LAN_IP__ !== 'undefined' ? __LAN_IP__ : '';
    const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
    const origin = local && lan ? `${location.protocol}//${lan}${location.port ? `:${location.port}` : ''}` : location.origin;
    const base = `${origin}${import.meta.env.BASE_URL.replace(/\/$/, '')}`;
    const url = location.hash.startsWith('#/') ? `${base}/#/ar?m=${model}` : `${base}/ar?m=${model}`;
    import('../three/qrcode.js')
      .then((Q) => Q.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#0b1220', light: '#ffffff' } }))
      .then(setQr)
      .catch(() => setQr(''));
  }, [model, phone]);

  const stopCamera = () => { stream.current?.getTracks().forEach((tr) => tr.stop()); stream.current = null; if (video.current) video.current.srcObject = null; };
  useEffect(() => () => { stopCamera(); clearTimeout(tourTimer.current); }, []);

  const build = useCallback(() => {
    const m = builders.current[model]();
    if (model === 'pc') {
      m.home.dir.set(-1, 0.32, 0.22);
      const board = m.parts.board?.group; const inv = board ? board.quaternion.clone().invert() : null;
      for (const [id, [x, y, z]] of Object.entries(PC_AR_EXPLODE)) {
        const p = m.parts[id]; if (!p?.explode) continue;
        p.explode.set(x, y * 1.45, z * 1.3);
        if (inv && p.group.parent === board) p.explode.applyQuaternion(inv);
      }
    }
    return m;
  }, [model, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const onReady = useCallback((v) => {
    viewer.current = v; setSel(null); setExploded(false); stopTour();
    v.setExploded(false, 0.01); v.opts.autoRotate = modeRef.current === 'view';
    v.setContactShadow(true);
    if (v.gyro) v.gyroRetarget();
    if (quickLook) setTimeout(() => getUsdz(), 1200);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { const v = viewer.current; if (v) v.opts.autoRotate = mode === 'view'; }, [mode]);
  useEffect(() => {
    const v = viewer.current; if (!v) return;
    const side = sel && mode !== 'xr' && window.innerWidth < 900;
    v.setFrameShift(side ? (dir === 'rtl' ? -0.22 : 0.22) : 0);
  }, [sel, mode, dir]);

  const choose = (id) => { setSel(id); if (id) actions.inspect(model, id); };
  const selectPart = (id) => { const v = viewer.current; if (!v) return; if (modeRef.current === 'xr') { v.selectedId = id; v.setIsolate(id); choose(id); } else v.select(id); };

  // ---------- explode / guided tour / scale / screenshot ----------
  const explode = (next) => { setExploded(next); viewer.current?.setExploded(next, 1.1, 0.07); };
  function stopTour() { clearTimeout(tourTimer.current); setTour(false); }
  function startTour() {
    const ids = (KEY_PARTS[model] || []).filter((id) => viewer.current?.parts[id]);
    if (!ids.length) return;
    setTour(true);
    let i = 0;
    const step = () => { if (i >= ids.length) { stopTour(); selectPart(null); setSel(null); return; } selectPart(ids[i]); i += 1; tourTimer.current = setTimeout(step, 4200); };
    if (!exploded && model !== 'network') { explode(true); tourTimer.current = setTimeout(step, 1900); } else step();
  }
  const toggleTour = () => (tour ? (stopTour(), closeInfo()) : startTour());
  function closeInfo() { setSel(null); const v = viewer.current; if (!v) return; if (modeRef.current === 'xr') { v.selectedId = null; v.setIsolate(null); } else if (v.selectedId) v.select(null); }
  const switchModel = (m) => { if (mode === 'xr' || m === model) return; stopTour(); setModel(m); setSel(null); setExploded(false); };

  const adjustScale = (factor) => {
    const v = viewer.current;
    if (!v) return;
    if (mode === 'xr') {
      v.xrScaleBy?.(factor);
    } else if (v.model?.group) {
      const next = Math.max(0.45, Math.min(2.4, v.model.group.scale.x * factor));
      v.model.group.scale.setScalar(next);
    }
  };

  const captureSnapshot = () => {
    const v = viewer.current;
    if (!v?.renderer?.domElement) return;
    try {
      v.renderer.render(v.scene, v.camera);
      const dataUrl = v.renderer.domElement.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `ar-${model}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error(e);
    }
  };

  // ---------- camera (every phone & webcam) ----------
  async function openCamera() {
    setErr(null);
    const perm = typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function'
      ? DeviceOrientationEvent.requestPermission().catch(() => 'denied') : Promise.resolve('granted');
    if (!navigator.mediaDevices?.getUserMedia) { setErr(t(location.protocol === 'https:' ? 'ar.err.nocam' : 'ar.err.https')); return; }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
      stream.current = s; video.current.srcObject = s; await video.current.play().catch(() => {});
      const v = viewer.current;
      v.setCameraFeed(video.current);
      setMode('camera'); closeInfo(); v.resetView(0.6);
      if ((await perm) === 'granted' && phone) setGyro(await v.enableGyro());
    } catch (e) {
      setErr(t(e?.name === 'NotAllowedError' ? 'ar.err.denied' : 'ar.err.nocam'));
    }
  }
  function closeCamera() { const v = viewer.current; v?.disableGyro(); v?.setCameraFeed(null); setGyro(false); stopCamera(); setMode('view'); }

  // ---------- on the real table ----------
  function getUsdz() {
    const m = modelRef.current; const key = `${m}:${langRef.current}`;
    const labels = (KEY_PARTS[m] || []).filter((id) => id !== 'case' && PARTS[id]).map((id) => ({ id, text: cRef.current(PARTS[id].name) }));
    if (!usdz.current[key]) usdz.current[key] = viewer.current.exportUSDZ({ animate: true, labels }).then((b) => URL.createObjectURL(b)).catch((e) => { delete usdz.current[key]; throw e; });
    return usdz.current[key];
  }
  async function openQuickLook() {
    setErr(null); setBusy(true); stopTour(); closeInfo();
    try {
      const url = await getUsdz();
      const a = document.createElement('a'); a.rel = 'ar'; a.href = url; a.appendChild(document.createElement('img'));
      document.body.appendChild(a); a.click(); a.remove();
    } catch (e) { console.error(e); setErr(t('ar.err.xr')); } finally { setBusy(false); }
  }
  async function startXR() {
    setErr(null); stopTour();
    const v = viewer.current; if (!v || !navigator.xr) return;
    if (mode === 'camera') closeCamera();
    try {
      const session = await navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['hit-test'], optionalFeatures: ['dom-overlay'], domOverlay: { root: ui.current } });
      setSel(null); setMode('xr'); setXrStatus('searching');
      await v.startXR(session, {
        onStatus: setXrStatus,
        onPick: (id) => { v.setIsolate(id); choose(id); },
        onEnd: () => { setMode('view'); setXrStatus(null); setSel(null); },
        ignoreTap: () => performance.now() - lastMulti.current < 450,
      });
    } catch (e) { console.error(e); setMode('view'); setErr(t('ar.err.xr')); }
  }
  const tableAR = xrOk ? startXR : quickLook ? openQuickLook : null;

  // two fingers in real AR (Android): pinch = resize, twist = rotate
  useEffect(() => {
    const el = ui.current; if (!el) return undefined;
    let start = null;
    const geo = (ts) => { const [a, b] = [ts[0], ts[1]]; return { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), a: Math.atan2(b.clientY - a.clientY, b.clientX - a.clientX) }; };
    const onStart = (e) => { if (e.touches.length === 2) { start = geo(e.touches); lastMulti.current = performance.now(); } };
    const onMove = (e) => {
      if (mode !== 'xr' || e.touches.length !== 2 || !start) return;
      const g = geo(e.touches); lastMulti.current = performance.now();
      if (start.d > 10) viewer.current?.xrScaleBy(g.d / start.d);
      let da = g.a - start.a; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI;
      viewer.current?.xrRotateBy(-da);
      start = g;
    };
    const onEnd = (e) => { if (e.touches.length < 2) { if (start) lastMulti.current = performance.now(); start = null; } };
    const noXrSelect = (e) => { if (e.target.closest?.('[data-ui]')) e.preventDefault(); };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: true });
    el.addEventListener('touchend', onEnd, { passive: true });
    el.addEventListener('touchcancel', onEnd, { passive: true });
    el.addEventListener('beforexrselect', noXrSelect);
    return () => { el.removeEventListener('touchstart', onStart); el.removeEventListener('touchmove', onMove); el.removeEventListener('touchend', onEnd); el.removeEventListener('touchcancel', onEnd); el.removeEventListener('beforexrselect', noXrSelect); };
  }, [mode]);

  const keyParts = KEY_PARTS[model] || [];
  const labelText = useCallback((id, forced) => (PARTS[id] && (forced || keyParts.includes(id)) ? c(PARTS[id].name) : ''), [c, keyParts]);
  const info = sel && PARTS[sel] ? PARTS[sel] : null;
  const hint = busy ? t('ar.busy')
    : mode === 'xr' ? t(`ar.xr.${xrStatus || 'searching'}`)
    : mode === 'camera' ? t(gyro ? 'ar.hint.gyro' : 'ar.hint.camera')
    : t(phone ? (quickLook ? 'ar.hint.view.ios' : 'ar.hint.view') : 'ar.hint.desktop');

  return (
    <div className={`ar-page mode-${mode}`}>
      <video ref={video} className="ar-video" playsInline muted autoPlay aria-hidden="true" />
      {ready && (
        <ModelCanvas
          className="ar-stage"
          modelKey={model}
          build={build}
          labels={showLabels && (exploded || model === 'network') && mode !== 'xr'}
          autoRotate={mode === 'view'}
          onReady={(v) => { v.opts.declutter = true; v.opts.isolate = true; onReady(v); }}
          onSelect={choose}
          labelText={labelText}
          ariaLabel={`${c(MODELS[model].name)} — AR`}
        />
      )}

      <div ref={ui} className="ar-ui">
        <header className="ar-top" data-ui>
          <div className="ar-models" role="tablist" aria-label={t('models.pick')}>
            {AR_MODELS.map((m) => (<button key={m} role="tab" aria-selected={model === m} disabled={mode === 'xr' && model !== m} onClick={() => switchModel(m)}>{c(SHORT[m])}</button>))}
          </div>
          <button className="ar-btn round" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} aria-label={t('a11y.lang')}>{lang === 'ar' ? 'EN' : 'ع'}</button>
        </header>

        <div className="ar-hint" aria-live="polite" data-status={mode === 'xr' ? xrStatus : undefined}>
          {(busy || (mode === 'xr' && xrStatus === 'searching')) && <span className="ar-scan" aria-hidden="true" />}
          {hint}
        </div>
        {err && <div className="ar-err" role="alert" data-ui>{err}<button className="ar-link" onClick={() => setErr(null)}>{t('common.close')}</button></div>}

        {!phone && mode === 'view' && qr && (
          <aside className="ar-qr" data-ui>
            <div className="ar-qr-code" dangerouslySetInnerHTML={{ __html: qr }} />
            <div><b>{t('ar.qr.t')}</b><p>{t('ar.qr.d')}</p></div>
          </aside>
        )}

        {info && (
          <section className="ar-sheet" data-ui key={sel}>
            <div className="ar-sheet-head">
              <span className="ar-chip">{tour ? `${keyParts.indexOf(sel) + 1} / ${keyParts.length}` : t('models.selected')}</span>
              <button className="ar-btn round sm" onClick={() => { stopTour(); closeInfo(); }} aria-label={t('common.close')}><Icon name="x" size={16} /></button>
            </div>
            <h2>{c(info.name)}</h2>
            <p>{c(info.role)}</p>
            <ul>{(info.facts[lang] || info.facts.en).slice(0, 3).map((f, i) => <li key={i}>{f}</li>)}</ul>
            {mode !== 'xr' && LESSON_BY_ID[info.lesson] && <Link className="ar-link" to={`/learn/${info.lesson}`}>{t('models.readlesson')} →</Link>}
            {tour && <div className="ar-progress" key={`p-${sel}`} aria-hidden="true" />}
          </section>
        )}

        <nav className="ar-dock" data-ui aria-label="AR">
          {mode === 'xr' ? (
            <>
              <button className="ar-btn" onClick={() => viewer.current?.xrReplace()} disabled={xrStatus !== 'placed'}><Icon name="target" size={18} /><span>{t('ar.move')}</span></button>
              {model !== 'network' && (
                <button className="ar-btn primary" onClick={() => explode(!exploded)} disabled={xrStatus !== 'placed'}><Icon name="explode" size={18} /><span>{t(exploded ? 'models.assemble' : 'models.explode')}</span></button>
              )}
              <button className="ar-btn" onClick={toggleTour} disabled={xrStatus !== 'placed'}><Icon name={tour ? 'x' : 'play'} size={18} /><span>{t(tour ? 'ar.tour.stop' : 'ar.tour')}</span></button>
              <button className="ar-btn" onClick={() => viewer.current?.stopXR()}><Icon name="x" size={18} /><span>{t('ar.exit')}</span></button>
            </>
          ) : (
            <>
              {mode === 'camera'
                ? <button className="ar-btn" onClick={closeCamera}><Icon name="cube" size={18} /><span>{t('ar.cam.off')}</span></button>
                : <button className="ar-btn" onClick={openCamera}><Icon name="camera" size={18} /><span>{t('ar.cam.on')}</span></button>}
              {model !== 'network' && (
                <button className="ar-btn primary" onClick={() => { stopTour(); explode(!exploded); }}><Icon name="explode" size={18} /><span>{t(exploded ? 'models.assemble' : 'models.explode')}</span></button>
              )}
              <button className="ar-btn" onClick={toggleTour}><Icon name={tour ? 'x' : 'play'} size={18} /><span>{t(tour ? 'ar.tour.stop' : 'ar.tour')}</span></button>
              <button className="ar-btn" onClick={() => setShowLabels((s) => !s)}><Icon name="tag" size={18} /><span>{t('models.labels')}</span></button>
              <button className="ar-btn" onClick={() => adjustScale(1.18)} title={lang === 'ar' ? 'تكبير' : 'Zoom in'}><span>＋</span></button>
              <button className="ar-btn" onClick={() => adjustScale(0.85)} title={lang === 'ar' ? 'تصغير' : 'Zoom out'}><span>－</span></button>
              {tableAR && <button className="ar-btn accent" onClick={tableAR} disabled={busy}><Icon name="target" size={18} /><span>{t('ar.xr.start')}</span></button>}
              <button className="ar-btn" onClick={captureSnapshot} title={lang === 'ar' ? 'التقاط صورة' : 'Snapshot'}><Icon name="download" size={18} /><span>{lang === 'ar' ? 'صورة' : 'Snap'}</span></button>
              <button className="ar-btn" onClick={() => { stopTour(); closeInfo(); if (viewer.current?.model?.group) viewer.current.model.group.scale.setScalar(1); viewer.current?.resetView(0.9); }}><Icon name="reset" size={18} /><span>{t(gyro ? 'ar.recenter' : 'models.reset')}</span></button>
            </>
          )}
        </nav>
      </div>
    </div>
  );
}
