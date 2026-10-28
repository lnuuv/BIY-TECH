import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon, PageHead, Chip } from '../components/ui.jsx';
import { useI18n } from '../i18n/index.jsx';

const WORK = [
  { icon: 'doc', key: 'assignment' },
  { icon: 'flask', key: 'lab' },
  { icon: 'trophy', key: 'practice' },
];

export default function Platform() {
  const { t } = useI18n();
  const [signedIn, setSignedIn] = useState(false);
  const [name, setName] = useState('');
  const [notice, setNotice] = useState('');

  const signIn = (event) => {
    event.preventDefault();
    if (!name.trim()) {
      setNotice(t('platform.login.required'));
      return;
    }
    setSignedIn(true);
    setNotice('');
  };

  if (!signedIn) {
    return (
      <div className="content platform-page">
        <PageHead eyebrow={t('platform.eyebrow')} title={t('platform.title')}>
          {t('platform.lead')}
        </PageHead>
        <div className="platform-gate card">
          <div className="platform-emblem"><Icon name="cloud" size={34} /></div>
          <div>
            <div className="eyebrow">{t('platform.login.eyebrow')}</div>
            <h2>{t('platform.login.title')}</h2>
            <p className="muted">{t('platform.login.lead')}</p>
          </div>
          <form onSubmit={signIn} className="platform-form">
            <label>
              <span>{t('platform.login.name')}</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('platform.login.placeholder')} autoComplete="name" />
            </label>
            <label>
              <span>{t('platform.login.code')}</span>
              <input type="password" placeholder="••••••" autoComplete="current-password" />
            </label>
            {notice && <div className="callout warn" role="alert"><Icon name="info" size={18} /><span>{notice}</span></div>}
            <button className="btn primary lg" type="submit"><Icon name="arrow" size={18} />{t('platform.login.submit')}</button>
          </form>
          <p className="tiny muted">{t('platform.login.demo')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content wide platform-page">
      <PageHead eyebrow={t('platform.eyebrow')} title={t('platform.dashboard', { name })}>
        {t('platform.dashboard.lead')}
      </PageHead>
      <section className="platform-banner card">
        <div>
          <Chip tone="accent">{t('platform.status.active')}</Chip>
          <h2>{t('platform.banner.title')}</h2>
          <p className="muted">{t('platform.banner.lead')}</p>
        </div>
        <div className="platform-progress"><b>42%</b><span>{t('platform.progress')}</span><div className="bar"><i style={{ width: '42%' }} /></div></div>
      </section>
      <section className="grid c3 platform-work" aria-label={t('platform.work.title')}>
        {WORK.map((item) => (
          <Link className="card interactive platform-work-card" to={`/${item.key}`} key={item.key}>
            <span className="feature-ic"><Icon name={item.icon} size={22} /></span>
            <h3>{t(`platform.work.${item.key}.title`)}</h3>
            <p className="muted small">{t(`platform.work.${item.key}.lead`)}</p>
            <span className="platform-link">{t('platform.open')} <Icon name="chevron" size={15} /></span>
          </Link>
        ))}
      </section>
      <section className="grid c2 platform-lower">
        <div className="card">
          <div className="row between"><h3>{t('platform.updates.title')}</h3><Chip>{t('platform.updates.count')}</Chip></div>
          <ul className="platform-list">
            <li><Icon name="check" size={17} /><span>{t('platform.updates.one')}</span></li>
            <li><Icon name="info" size={17} /><span>{t('platform.updates.two')}</span></li>
            <li><Icon name="star" size={17} /><span>{t('platform.updates.three')}</span></li>
          </ul>
        </div>
        <div className="card platform-account">
          <div className="row between"><div><div className="eyebrow">{t('platform.account.eyebrow')}</div><h3>{name}</h3></div><span className="platform-avatar">{name.trim().charAt(0).toUpperCase()}</span></div>
          <p className="muted small">{t('platform.account.lead')}</p>
          <button className="btn sm" onClick={() => setSignedIn(false)}><Icon name="undo" size={15} />{t('platform.logout')}</button>
        </div>
      </section>
    </div>
  );
}
