import React from 'react';
import { Icon } from '../ui.jsx';
import { describeFailure, describeStep } from '../../lab/messages.js';

export default function LabTestPanel({
  t,
  lang,
  nf,
  src,
  setSrc,
  dstKey,
  setDstKey,
  sources,
  targets,
  dname,
  runTest,
  result,
  reduced,
}) {
  const fail = result && !result.ok ? describeFailure(result.failure, lang) : null;
  return (
    <div className="card test-card">
      <div className="test-top">
        <div className="field grow">
          <label htmlFor="srcsel">{t('lab.test.from')}</label>
          <select id="srcsel" className="input" value={src} onChange={(e) => setSrc(e.target.value)}>
            <option value="">{t('lab.test.choose')}</option>
            {sources.map((d) => <option key={d.id} value={d.id}>{dname(d)}</option>)}
          </select>
        </div>
        <Icon name="arrow" className="flip-rtl hide-sm" style={{ marginTop: 20, color: 'var(--muted)' }} />
        <div className="field grow">
          <label htmlFor="dstsel">{t('lab.test.to')}</label>
          <select id="dstsel" className="input mono" value={dstKey} onChange={(e) => setDstKey(e.target.value)}>
            <option value="">{t('lab.test.choose')}</option>
            {targets.filter((x) => x.dev !== src).map((x) => (
              <option key={`${x.dev}|${x.ip}`} value={`${x.dev}|${x.ip}`}>{x.label}</option>
            ))}
          </select>
        </div>
        <button className="btn primary lg test-btn" onClick={runTest}>
          <Icon name="bolt" size={18} />{t('lab.test.run')}
        </button>
      </div>
      {!result ? (
        <p className="muted small" style={{ margin: '14px 0 0' }}>{t('lab.test.empty')}</p>
      ) : (
        <div key={result.id} className="diag">
          <div className={`verdict ${result.ok ? 'ok' : 'bad'}`} role="status">
            <Icon name={result.ok ? 'check' : 'x'} size={22} />
            <div>
              <b>{result.ok ? t('lab.test.ok', { rtt: nf(result.rtt) }) : fail.title}</b>
              {!result.ok && <p>{fail.why}</p>}
            </div>
          </div>
          {!result.ok && (
            <div className="callout tip fixbox">
              <Icon name="wrench" size={18} />
              <div><b>{t('lab.test.fix')}</b> {fail.fix}</div>
            </div>
          )}
          <ol className="steps-out">
            {result.steps.map((s, i) => {
              const m = describeStep(s, lang);
              return (
                <li key={i} className={`st-${s.status}`} style={{ animationDelay: `${reduced ? 0 : i * 120}ms` }}>
                  <i><Icon name={s.status === 'ok' ? 'check' : s.status === 'fail' ? 'x' : 'info'} size={13} /></i>
                  <div><b>{m.label}</b><span>{m.detail}</span></div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
