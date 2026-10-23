import React, { useRef, useState } from 'react';
import { useI18n } from '../../i18n/index.jsx';
import { ACCEPT } from '../../assignment/api.js';
import { Bar, Chip, Icon } from '../ui.jsx';

const fmtSize = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const STAGE_ICON = { pending: 'info', active: 'reset', done: 'check', error: 'x' };

export function Stages({ stages, busy }) {
  const { t } = useI18n();
  return (
    <ol className="asg-stages" aria-live="polite" aria-busy={busy}>
      {stages.map((s) => (
        <li key={s.id} className={`st ${s.state}`}>
          <span className="ic"><Icon name={STAGE_ICON[s.state]} size={16} stroke={2.2} className={s.state === 'active' ? 'spin' : ''} /></span>
          <span className="grow">{t(`asg.stage.${s.id}`)}</span>
          <span className="tiny muted">{t(`asg.stage.${s.state}`)}</span>
        </li>
      ))}
    </ol>
  );
}

/** Presentational upload area: drag-and-drop + picker, file info, progress, remove/replace and the start button. */
export default function UploadPanel({ phase, pct, file, up, stages, onPick, onRemove, onStart, disabled }) {
  const { t, nf } = useI18n();
  const inputRef = useRef(null);
  const [over, setOver] = useState(false);
  const busy = phase === 'uploading' || phase === 'processing' || phase === 'analysing';
  const choose = () => !busy && inputRef.current?.click();
  const onDrop = (e) => { e.preventDefault(); setOver(false); if (busy) return; const f = e.dataTransfer?.files?.[0]; if (f) onPick(f); };
  const hasFile = !!file && phase !== 'idle' && phase !== 'error';

  return (
    <div className="card asg-up">
      <h3 style={{ marginTop: 0 }}>{t('asg.up.title')}</h3>
      <input ref={inputRef} type="file" accept={ACCEPT} hidden aria-label={t('asg.up.choose')} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onPick(f); }} />
      {!hasFile ? (
        <div className={`asg-drop ${over ? 'over' : ''}`} role="button" tabIndex={0} aria-label={t('asg.up.hint')}
          onClick={choose} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(); } }}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={onDrop}>
          <Icon name="download" size={34} style={{ color: 'var(--accent)', transform: 'rotate(180deg)' }} />
          <b>{t('asg.up.hint')}</b>
          <span className="muted small">{t('asg.up.formats')}</span>
          <span className="btn primary" aria-hidden="true">{t('asg.up.choose')}</span>
        </div>
      ) : (
        <div className="asg-file">
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <span className="asg-file-ic"><Icon name="doc" size={24} /></span>
            <div className="grow">
              <b className="asg-file-name" dir="auto">{file.name}</b>
              <div className="row wrap tiny muted" style={{ gap: 8, marginTop: 4 }}>
                <Chip className="mono">{(up?.file?.kind || file.name.split('.').pop() || '').toUpperCase()}</Chip>
                <span>{fmtSize(file.size)}</span>
                {up && <span>{t('asg.up.stats', { words: nf(up.stats.words), chars: nf(up.stats.chars) })}</span>}
                {up?.stats?.pages ? <span>{t('asg.up.pages', { n: nf(up.stats.pages) })}</span> : null}
              </div>
            </div>
            <div className="row" style={{ gap: 6 }}>
              <button className="btn sm" onClick={choose} disabled={busy}>{t('asg.up.replace')}</button>
              <button className="btn sm ghost danger" onClick={onRemove} disabled={phase === 'analysing'} aria-label={t('asg.up.remove')}><Icon name="trash" size={15} />{t('asg.up.remove')}</button>
            </div>
          </div>
          {phase === 'uploading' && (<div style={{ marginTop: 12 }}><Bar pct={pct / 100} label={t('asg.up.uploading', { pct })} /><p className="tiny muted" style={{ margin: '6px 0 0' }}>{t('asg.up.uploading', { pct })}</p></div>)}
          {phase === 'processing' && <p className="small muted row" style={{ marginTop: 12 }}><Icon name="reset" size={16} className="spin" />{t('asg.up.reading')}</p>}
          {phase === 'ready' && up && (
            <>
              <p className="small row" style={{ margin: '12px 0 6px', color: 'var(--ok)' }}><Icon name="check" size={16} stroke={2.4} />{t('asg.up.ready')}</p>
              <details className="asg-det" style={{ marginBottom: 12 }}><summary><span className="grow">{t('asg.up.preview')}</span><Icon name="chevron" size={16} className="chev" /></summary><pre className="asg-pre" dir="auto">{up.preview}…</pre></details>
              <button className="btn primary lg" onClick={() => onStart(false)} disabled={disabled}><Icon name="bolt" size={18} />{t('asg.up.start')}</button>
            </>
          )}
          {(phase === 'analysing') && (<div style={{ marginTop: 14 }}><h4 style={{ margin: '0 0 8px' }}>{t('asg.analysing')}</h4><Stages stages={stages} busy /></div>)}
        </div>
      )}
      {!hasFile && (
        <div className="asg-get">
          <h4>{t('asg.get.t')}</h4>
          <ul className="facts">{[1, 2, 3, 4, 5, 6].map((n) => <li key={n}>{t(`asg.get.${n}`)}</li>)}</ul>
        </div>
      )}
      <p className="tiny muted" style={{ margin: '12px 0 0' }}>{t('asg.up.privacy')}</p>
    </div>
  );
}
