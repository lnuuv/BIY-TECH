import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/index.jsx';
import { PARTS, MODELS } from '../../shared/content/parts.js';
import { LESSON_BY_ID } from '../../shared/content/lessons.js';
import { actions, useProgress } from '../store/progress.js';
import { Icon, PageHead, Toggle, toast } from '../components/ui.jsx';
import ModelCanvas from '../three/ModelCanvas.jsx';

const loadBuilders = () => import('../three/models.js');
const ORDER = ['motherboard', 'pc', 'rack', 'network'];

export default function Models() {
  const { t, c, lang } = useI18n();
  const nav = useNavigate();
  const prog = useProgress();
  const [model, setModel] = useState(() => new URLSearchParams(location.search).get('m') || 'motherboard');
  const [sel, setSel] = useState(null);
  const [hover, setHover] = useState(null);
  const [exploded, setExploded] = useState(false);
  const [labels, setLabels] = useState(false);
  const [rotate, setRotate] = useState(true);
  const [ids, setIds] = useState([]);
  const viewer = useRef(null);
  const builders = useRef(null);
  const [ready, setReady] = useState(false);
  useEffect(() => { loadBuilders().then((m) => { builders.current = m.BUILDERS; setReady(true); }); }, []);

  const build = useCallback(() => builders.current[model](), [model, ready]); // eslint-disable-line react-hooks/exhaustive-deps
  const onReady = useCallback((v) => { viewer.current = v; setIds(Object.keys(v.parts).filter((id) => v.parts[id].pickable !== false && PARTS[id])); setSel(null); v.setExploded(false, 0.01); v.opts.autoRotate = true; }, []);
  const onSelect = useCallback((id) => { setSel(id); if (id) { actions.inspect(model, id); } }, [model]);
  useEffect(() => { viewer.current?.setExploded(exploded); }, [exploded]);
  const pick = (id) => { const v = viewer.current; if (!v) return; v.select(id === sel ? null : id); };
  const hasExplode = model !== 'network';
  const info = sel ? PARTS[sel] : null;
  const seen = ids.filter((id) => prog.parts[`${model}:${id}`]).length;
  const labelText = useCallback((id) => (PARTS[id] ? c(PARTS[id].name) : ''), [c]);

  return (
    <div className="content wide">
      <PageHead eyebrow={t('models.eyebrow')} title={t('models.title')}>{t('models.lead')}</PageHead>
      <div className="tabs" role="tablist" aria-label={t('models.pick')} style={{ marginBottom: 16 }}>
        {ORDER.map((m) => (<button key={m} role="tab" aria-selected={model === m} onClick={() => { setModel(m); setSel(null); setExploded(false); }}>{c(MODELS[m].name)}</button>))}
        <button role="tab" aria-selected={false} onClick={() => nav('/infrastructure')} style={{ borderColor: 'var(--accent-line)', color: 'var(--accent)' }}>
          🌍 {t('nav.infrastructure')} (3D)
        </button>
        <button role="tab" aria-selected={false} onClick={() => nav('/story')} style={{ borderColor: 'var(--accent-line)', color: 'var(--accent)' }}>
          ▶ {t('nav.story')}
        </button>
      </div>
      <div className="viewer-layout">
        <div className="viewer-main">
          {ready && (
            <ModelCanvas modelKey={model} build={build} labels={labels} autoRotate={rotate} onReady={onReady} onSelect={onSelect} onHover={setHover} labelText={labelText} ariaLabel={`${c(MODELS[model].name)} — 3D`}>
              <div className="stage-tools">
                {hasExplode && <button className="btn sm" aria-pressed={exploded} onClick={() => { setExploded(!exploded); toast(t(exploded ? 'models.assembled' : 'models.exploded'), 'explode'); }}><Icon name="explode" size={16} />{t(exploded ? 'models.assemble' : 'models.explode')}</button>}
                <button className="btn sm" aria-pressed={labels} onClick={() => setLabels(!labels)}><Icon name="tag" size={16} />{t('models.labels')}</button>
                <button className="btn sm" onClick={() => { setSel(null); viewer.current?.select(null); }}><Icon name="reset" size={16} />{t('models.reset')}</button>
              </div>
              <div className="stage-hint">{hover && PARTS[hover] ? c(PARTS[hover].name) : t('models.hint.touch')}</div>
            </ModelCanvas>
          )}
          <div className="row between wrap" style={{ marginTop: 12 }}>
            <p className="small muted" style={{ margin: 0 }}>{c(MODELS[model].hint)}</p>
            <Toggle checked={rotate} onChange={setRotate}>{t('models.autorotate')}</Toggle>
          </div>
        </div>
        <aside className="viewer-side">
          <div className="card info-panel" aria-live="polite">
            {info ? (
              <div key={sel} className="info-in">
                <div className="row between"><span className="chip accent">{t('models.selected')}</span><button className="btn sm icon ghost" onClick={() => pick(sel)} aria-label={t('common.close')}><Icon name="x" size={16} /></button></div>
                <h2 style={{ marginTop: 10 }}>{c(info.name)}</h2>
                <p>{c(info.role)}</p>
                <ul className="facts">{info.facts[lang].map((f, i) => <li key={i}>{f}</li>)}</ul>
                {LESSON_BY_ID[info.lesson] && <Link className="btn sm" to={`/learn/${info.lesson}`}><Icon name="book" size={16} />{t('models.readlesson')}</Link>}
              </div>
            ) : (
              <div className="empty-info"><Icon name="cube" size={30} /><h3>{t('models.empty.t')}</h3><p className="muted small">{t('models.empty.d')}</p></div>
            )}
          </div>
          <div className="card tight">
            <div className="row between" style={{ marginBottom: 8 }}><h4 style={{ margin: 0 }}>{t('models.parts')}</h4><span className="chip">{seen}/{ids.length} {t('models.inspected')}</span></div>
            <div className="part-list">
              {ids.map((id) => (<button key={id} className={`part-btn ${sel === id ? 'on' : ''}`} onClick={() => pick(id)} onMouseEnter={() => viewer.current && (viewer.current.setHover(id))} onMouseLeave={() => viewer.current?.setHover(null)}><i className={prog.parts[`${model}:${id}`] ? 'dot seen' : 'dot'} />{c(PARTS[id].name)}</button>))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
