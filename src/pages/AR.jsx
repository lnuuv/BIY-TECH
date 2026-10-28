import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { useI18n } from '../i18n/index.jsx';
import { PARTS } from '../../shared/content/parts.js';
import { Icon } from '../components/ui.jsx';
import ModelCanvas from '../three/ModelCanvas.jsx';

const MODELS = ['pc', 'motherboard', 'rack'];
const buildModel = (module, model) => {
  if (model !== 'pc') return module.BUILDERS[model]();
  const pc = module.buildPC({ mode: 'assembly' });
  pc.parts.sidepanel.initialFactor = 1;
  return pc;
};

export default function AR() {
  const { t, c, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const [model, setModel] = useState(() => {
    const initial = new URLSearchParams(location.search).get('model');
    return MODELS.includes(initial) ? initial : 'pc';
  });
  const [builders, setBuilders] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [qr, setQr] = useState('');
  const [qrError, setQrError] = useState(false);
  const [supported, setSupported] = useState(false);
  const [arActive, setArActive] = useState(false);
  const [arError, setArError] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [labels, setLabels] = useState(false);
  const [selected, setSelected] = useState(null);
  const [rotate, setRotate] = useState(true);
  const viewer = useRef(null);

  useEffect(() => {
    import('../three/models.js')
      .then(setBuilders)
      .catch((error) => {
        console.error('AR model loading failed', error);
        setLoadError(true);
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!navigator.xr) return undefined;
    navigator.xr.isSessionSupported('immersive-ar')
      .then((value) => { if (!cancelled) setSupported(value); })
      .catch((error) => {
        console.error('AR capability check failed', error);
        if (!cancelled) setSupported(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('model', model);
    QRCode.toDataURL(url.toString(), { width: 180, margin: 1, color: { dark: '#0b1220', light: '#ffffff' } })
      .then(setQr)
      .catch((error) => {
        console.error('AR QR code generation failed', error);
        setQrError(true);
      });
  }, [model]);

  const onReady = useCallback((instance) => { viewer.current = instance; }, []);
  const onSelect = useCallback((id) => setSelected(id), []);
  const labelText = useCallback((id) => (PARTS[id] ? c(PARTS[id].name) : ''), [c]);
  const build = useCallback(() => builders && buildModel(builders, model), [builders, model]);

  const startAR = async () => {
    setArError(false);
    try {
      await viewer.current?.startAR(setArActive);
    } catch (error) {
      console.error('AR session failed', error);
      setArError(true);
    }
  };

  const toggleExploded = () => {
    const next = !exploded;
    setExploded(next);
    viewer.current?.setExploded(next);
  };

  const localHost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);

  return (
    <main className="ar-page">
      {builders && (
        <ModelCanvas modelKey={model} build={build} labels={labels} autoRotate={rotate} onReady={onReady} onSelect={onSelect} labelText={labelText} ariaLabel={`${model} augmented reality model`} className="ar-stage">
          <button type="button" className="btn icon ar-language" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} aria-label={t('a11y.lang')}>{lang === 'ar' ? 'EN' : 'ع'}</button>
          <div className="ar-top">
            <div className="ar-top-center">
              <div className="ar-model-tabs" role="tablist" aria-label={t('nav.ar')}>
                {MODELS.map((key) => (
                  <button key={key} type="button" role="tab" aria-selected={model === key} onClick={() => { setModel(key); setExploded(false); }}>
                    {t(`ar.model.${key}`)}
                  </button>
                ))}
              </div>
              <p className="ar-instruction">{arActive ? t('ar.camera.active') : t('ar.lead')}</p>
            </div>
          </div>

          <aside className="ar-qr card">
            {qr ? <img src={qr} alt={t('ar.qr.title')} /> : qrError ? <p className="small">{t('ar.qr.error')}</p> : <div className="spinner" aria-label={t('3d.loading')} />}
            <b>{t('ar.qr.title')}</b>
            <p>{t('ar.qr.hint')}</p>
            {localHost && <small>{t('ar.qr.localhost')}</small>}
          </aside>

          {selected && PARTS[selected] && (
            <aside className="ar-part-info card" aria-live="polite">
              <div className="row between">
                <span className="chip accent">{t('ar.selected')}</span>
                <button type="button" className="btn icon sm ghost" onClick={() => viewer.current?.select(null)} aria-label={t('common.close')}><Icon name="x" size={16} /></button>
              </div>
              <h2>{c(PARTS[selected].name)}</h2>
              <p>{c(PARTS[selected].role)}</p>
              <p className="ar-part-fact">{PARTS[selected].facts[lang][0]}</p>
            </aside>
          )}

          <div className="ar-bottom">
            <button type="button" className="btn ar-action" onClick={() => viewer.current?.resetView()}><Icon name="reset" size={16} />{t('ar.reset')}</button>
            <button type="button" className="btn ar-action" aria-pressed={rotate} onClick={() => setRotate((value) => !value)}><Icon name="play" size={16} />{t('ar.rotate')}</button>
            <button type="button" className="btn ar-action" aria-pressed={labels} onClick={() => setLabels((value) => !value)}><Icon name="tag" size={16} />{t(labels ? 'ar.labels.hide' : 'ar.labels.show')}</button>
            <button type="button" className="btn ar-action" aria-pressed={exploded} onClick={toggleExploded}><Icon name="explode" size={16} />{t(exploded ? 'ar.assemble' : 'ar.explode')}</button>
            <button type="button" className="btn ar-action primary" disabled={!supported} onClick={arActive ? () => viewer.current?.exitAR() : startAR}><Icon name="eye" size={16} />{t(arActive ? 'ar.close' : 'ar.camera')}</button>
          </div>
        </ModelCanvas>
      )}

      <button type="button" className="btn icon ar-close" onClick={() => navigate('/models')} aria-label={t('common.close')} title={t('common.close')}><Icon name="x" size={20} /></button>

      {!builders && (
        <div className="ar-loading">{loadError ? t('3d.error') : <><span className="spinner" />{t('3d.loading')}</>}</div>
      )}

      {!supported && builders && <div className="ar-notice" role="status">{t('ar.unsupported')}</div>}
      {arError && <div className="ar-notice error" role="alert">{t('ar.startError')}</div>}
    </main>
  );
}
