import React from 'react';
import { Icon } from '../ui.jsx';
import { failMsg } from '../../lab/messages.js';

export default function LabStatusStrip({
  t,
  lang,
  deviceCount,
  upLinksCount,
  totalLinksCount,
  conflicts,
  onSelectDevice,
}) {
  return (
    <div className="lab-status-strip" role="status" aria-live="polite">
      <div className="row wrap" style={{ gap: 8 }}>
        <span className="chip">{t('lab.status.devs', { n: deviceCount })}</span>
        <span className="chip">{t('lab.status.links', { u: upLinksCount, t: totalLinksCount })}</span>
        {conflicts.length === 0 ? (
          <span className="chip ok"><Icon name="check" size={13} /> {t('lab.status.ok')}</span>
        ) : (
          <span className="chip bad"><Icon name="info" size={13} /> {t('lab.status.issues', { n: conflicts.length })}</span>
        )}
      </div>
      {conflicts.length > 0 && (
        <div className="lab-issues-list">
          {conflicts.slice(0, 4).map((iss, idx) => {
            const msg = failMsg(iss.code, iss.p, lang);
            return (
              <button
                key={`${iss.deviceId}-${iss.code}-${idx}`}
                type="button"
                className={`chip ${iss.severity === 'error' ? 'bad' : 'warn'}`}
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectDevice(iss.deviceId)}
              >
                {msg.title}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
