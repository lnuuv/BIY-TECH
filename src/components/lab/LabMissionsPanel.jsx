import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../ui.jsx';
import * as S from '../../lab/sim.js';

export default function LabMissionsPanel({
  t,
  c,
  prog,
  mission,
  setMission,
  loadPreset,
  checkMission,
  mcheck,
}) {
  const M = S.MISSIONS[mission];
  return (
    <div className="card tight">
      <div className="row between">
        <h4 style={{ margin: 0 }}>{t('lab.missions')}</h4>
        <span className="chip">{Object.keys(prog.missions).length}/5</span>
      </div>
      <div className="stack" style={{ marginTop: 10 }}>
        <ol className="mlist">
          {S.MISSIONS.map((m, i) => (
            <li key={m.id}>
              <button
                className={`${i === mission ? 'on' : ''} ${prog.missions[m.id] ? 'done' : ''}`}
                onClick={() => setMission(i)}
              >
                <i>{prog.missions[m.id] ? <Icon name="check" size={13} /> : i + 1}</i>
                {c(m.title)}
              </button>
            </li>
          ))}
        </ol>
        <div className="callout tip small">
          <Icon name="flask" size={18} />
          <div>{c(M.goal)}</div>
        </div>
        <div className="row wrap">
          {M.preset && (
            <button className="btn sm" onClick={loadPreset}>
              <Icon name="download" size={15} />{t('lab.m.load')}
            </button>
          )}
          <button className="btn sm primary" onClick={checkMission}>
            <Icon name="check" size={15} />{t('lab.m.check')}
          </button>
          <Link className="btn sm ghost" to={`/learn/${M.lesson}`}>
            <Icon name="book" size={15} />{t('lab.m.lesson')}
          </Link>
        </div>
        {mcheck && (
          <div className={`callout ${mcheck.done ? 'ok' : 'warn'} small`} role="status">
            <Icon name={mcheck.done ? 'check' : 'info'} size={18} />
            <div>{mcheck.done ? t('lab.m.done') : `${t('lab.m.notyet')} ${mcheck.hint || ''}`}</div>
          </div>
        )}
      </div>
    </div>
  );
}
