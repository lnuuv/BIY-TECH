import React from 'react';
import { useI18n } from '../i18n/index.jsx';
import { LESSONS } from '../../shared/content/lessons.js';
import { QUIZ_BANK } from '../../shared/content/quizzes.js';
import { ACHIEVEMENTS, actions, levelOf, useProgress } from '../store/progress.js';
import { Bar, Chip, Icon, PageHead, Ring } from '../components/ui.jsx';

export default function Progress() {
  const { t, c, nf } = useI18n();
  const p = useProgress();
  const [confirmingReset, setConfirmingReset] = React.useState(false);
  const lv = levelOf(p.xp);
  const crits = [...new Set(LESSONS.flatMap((l) => l.criteria))].sort();
  const covered = (x) => LESSONS.filter((l) => l.criteria.includes(x)).some((l) => p.lessons[l.id]);
  const answered = Object.values(p.answers); const acc = answered.length ? answered.filter((a) => a.best).length / QUIZ_BANK.length : 0;
  const rows = [
    { k: 'pairs', label: t('games.pairs'), v: p.scores.pairs || 0, icon: 'cube' }, { k: 'sprint', label: t('games.sprint'), v: p.scores.sprint || 0, icon: 'bolt' }, { k: 'sort', label: t('games.sort'), v: p.scores.sort || 0, icon: 'tag' },
    { k: 'asm', label: t('nav.assembly'), v: p.assembly.best || 0, icon: 'chip' },
  ].sort((a, b) => b.v - a.v);
  const done = ACHIEVEMENTS.filter((a) => a.ok(p)).length;
  return (
    <div className="content">
      <PageHead eyebrow={t('prog.eyebrow')} title={t('prog.title')}>{t('prog.lead')}</PageHead>
      <div className="grid c3">
        <div className="card center"><Ring pct={lv.pct} size={110} stroke={9} label={String(lv.level)} /><h3 style={{ marginTop: 12 }}>{t('side.level', { n: lv.level })}</h3><p className="muted small" style={{ margin: 0 }}>{nf(p.xp)} XP · {t('prog.next', { n: nf(lv.span - lv.into) })}</p></div>
        <div className="card"><h3>{t('prog.streak')}</h3><div className="row" style={{ gap: 12 }}><Icon name="bolt" size={34} style={{ color: 'var(--warn)' }} /><div><b style={{ fontSize: 30 }}>{nf(p.streak.count)}</b> <span className="muted">{t('prog.days')}</span></div></div><p className="small muted" style={{ marginBottom: 0 }}>{t('prog.streak.d')}</p></div>
        <div className="card"><h3>{t('prog.acc')}</h3><div className="row between"><b style={{ fontSize: 30 }}>{Math.round(acc * 100)}%</b><span className="muted small">{answered.filter((a) => a.best).length}/{QUIZ_BANK.length}</span></div><Bar pct={acc} label={t('prog.acc')} /><p className="small muted" style={{ marginBottom: 0 }}>{t('prog.acc.d')}</p></div>
      </div>
      <div className="card" style={{ marginTop: 18 }}>
        <h3>{t('prog.criteria')}</h3><p className="small muted">{t('prog.criteria.d')}</p>
        <div className="row wrap" style={{ gap: 8 }}>{crits.map((x) => <Chip key={x} tone={covered(x) ? 'ok' : ''} className="mono">{covered(x) && <Icon name="check" size={12} />}{x}</Chip>)}</div>
      </div>
      <div className="grid c2" style={{ marginTop: 18 }}>
        <div className="card"><h3>{t('prog.board')}</h3>
          <ol className="board">{rows.map((r, i) => (<li key={r.k} className={i === 0 && r.v ? 'top' : ''}><span className="rank">{i + 1}</span><Icon name={r.icon} size={18} /><span className="grow">{r.label}</span><b>{nf(r.v)}</b></li>))}</ol>
          <p className="tiny muted" style={{ marginBottom: 0 }}>{t('prog.board.d')}</p></div>
        <div className="card"><h3>{t('prog.recent')}</h3>
          {p.log.length === 0 ? <p className="muted small">{t('prog.recent.empty')}</p> : <ul className="xplog">{p.log.slice(0, 8).map((e, i) => (<li key={i}><span className="chip ok">+{e.n}</span><span className="grow">{t(`xp.${e.why}`)}</span><time className="tiny muted">{new Date(e.t).toLocaleDateString()}</time></li>))}</ul>}</div>
      </div>
      <div className="card" style={{ marginTop: 18 }}>
        <div className="row between"><h3 style={{ margin: 0 }}>{t('prog.ach')}</h3><Chip tone="accent">{done}/{ACHIEVEMENTS.length}</Chip></div>
        <div className="grid c3" style={{ marginTop: 14 }}>
          {ACHIEVEMENTS.map((a) => { const on = a.ok(p); return (<div key={a.id} className={`ach ${on ? 'on' : ''}`}><span className="ach-ic"><Icon name={a.icon} size={22} /></span><div><b>{c({ en: a.en, ar: a.ar })}</b><div className="small muted">{c({ en: a.dEn, ar: a.dAr })}</div></div></div>); })}
        </div>
      </div>
      <div style={{ marginTop: 18 }}>{!confirmingReset ? <button className="btn sm ghost danger" onClick={() => setConfirmingReset(true)}><Icon name="trash" size={15} />{t('prog.reset')}</button> : <div className="row wrap" style={{ gap: 8 }}><span className="small danger">{t('prog.reset.q')}</span><button className="btn sm danger" onClick={() => { actions.reset(); setConfirmingReset(false); }}><Icon name="trash" size={15} />{t('prog.reset')}</button><button className="btn sm ghost" onClick={() => setConfirmingReset(false)}>{t('common.cancel')}</button></div>}</div>
    </div>
  );
}
