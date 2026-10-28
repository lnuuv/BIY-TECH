import React, { Suspense, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { useI18n } from '../i18n/index.jsx';
import { useProgress, levelOf } from '../store/progress.js';
import { Icon, ToastHost } from './ui.jsx';

const NAV = [
  { to: '/', icon: 'home', k: 'nav.home', end: true },
  { to: '/learn', icon: 'book', k: 'nav.learn', end: true },
  { to: '/shortcuts', icon: 'tag', k: 'nav.shortcuts' },
  { to: '/story', icon: 'play', k: 'nav.story', group: 'build' },
  { to: '/infrastructure', icon: 'layers', k: 'nav.infrastructure', group: 'build' },
  { to: '/models', icon: 'cube', k: 'nav.models', group: 'build' },
  { to: '/lab', icon: 'network', k: 'nav.lab', group: 'build' },
  { to: '/practice', icon: 'trophy', k: 'nav.practice', group: 'test' },
  { to: '/games', icon: 'gamepad', k: 'nav.games', group: 'test' },
  { to: '/assignment', icon: 'doc', k: 'nav.assignment', group: 'test' },
  { to: '/assistant', icon: 'bot', k: 'nav.assistant', group: 'help' },
  { to: '/progress', icon: 'star', k: 'nav.progress', group: 'help' },
];
const MOBILE = ['/', '/learn', '/story', '/lab'];
const GROUPS = { build: 'nav.g.build', test: 'nav.g.test', help: 'nav.g.help' };
const SIDEBAR_KEY = 'u1.sidebar.collapsed';

function PageFallback() {
  return (
    <div className="content">
      <div className="skeleton" style={{ height: 38, width: '40%', marginBottom: 18 }} />
      <div className="skeleton" style={{ height: 360 }} />
    </div>
  );
}

export default function Layout() {
  const { t, lang, setLang, theme, setTheme, nf } = useI18n();
  const p = useProgress();
  const lv = levelOf(p.xp);
  const [open, setOpen] = useState(false); // mobile drawer state
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(SIDEBAR_KEY) === '1'; } catch { return false; }
  });
  const loc = useLocation();

  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [loc.pathname, loc.search]);
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);

  useEffect(() => {
    try { localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0'); } catch { /* ignore */ }
    const t1 = setTimeout(() => window.dispatchEvent(new Event('resize')), 60);
    const t2 = setTimeout(() => window.dispatchEvent(new Event('resize')), 300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [collapsed]);

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 960px)').matches) {
      setOpen((v) => !v);
    } else {
      setCollapsed((v) => !v);
    }
  };

  const cur = NAV.find((n) => (n.end ? loc.pathname === n.to : loc.pathname.startsWith(n.to)));
  let lastGroup;
  const isSidebarExpanded = typeof window !== 'undefined' && window.matchMedia?.('(max-width: 960px)').matches ? open : !collapsed;

  return (
    <div className={`app ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <a className="skip-link" href="#main">{t('a11y.skip')}</a>
      <aside
        id="app-sidebar"
        className={`sidebar ${open ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}
        aria-label={t('a11y.nav')}
        aria-hidden={collapsed && !open ? 'true' : undefined}
      >
        <div className="sidebar-head">
          <Link className="brand" to="/">
            <span className="brand-mark"><img src="/biy-tech-logo.svg" alt="" /></span>
            <span><b>{t('brand.name')}</b><small>{t('brand.sub')}</small></span>
          </Link>
          <button
            type="button"
            className="btn icon sm sidebar-collapse-btn"
            onClick={handleToggleSidebar}
            aria-label={t('a11y.sidebar.collapse')}
            title={t('a11y.sidebar.collapse')}
          >
            <Icon name="menu" size={18} />
          </button>
        </div>
        <nav className="nav">
          {NAV.map((n) => {
            const head = n.group && n.group !== lastGroup ? <div className="nav-label" key={`g-${n.group}`}>{t(GROUPS[n.group])}</div> : null;
            lastGroup = n.group;
            return (
              <React.Fragment key={n.to}>
                {head}
                <NavLink
                  to={n.to}
                  end={n.end}
                  className={({ isActive }) => (isActive ? 'active' : '')}
                  title={t(n.k)}
                >
                  <Icon name={n.icon} />
                  <span>{t(n.k)}</span>
                </NavLink>
              </React.Fragment>
            );
          })}
        </nav>
        <div className="side-foot">
          <Link to="/progress" className="card tight flat" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="row between small"><span className="muted">{t('side.level', { n: lv.level })}</span><b><bdi>{nf(p.xp)} XP</bdi></b></div>
            <div className="bar" style={{ marginTop: 8 }}><i style={{ width: `${lv.pct * 100}%` }} /></div>
          </Link>
        </div>
      </aside>
      <div className={`scrim ${open ? 'open' : ''}`} onClick={() => setOpen(false)} aria-hidden="true" />
      <div className="main">
        <header className="topbar">
          <button
            type="button"
            className="btn icon menu-btn sidebar-toggle-btn"
            onClick={handleToggleSidebar}
            aria-label={isSidebarExpanded ? t('a11y.sidebar.collapse') : t('a11y.sidebar.expand')}
            aria-expanded={isSidebarExpanded}
            aria-controls="app-sidebar"
            title={isSidebarExpanded ? t('a11y.sidebar.collapse') : t('a11y.sidebar.expand')}
          >
            <Icon name="menu" size={20} />
          </button>
          <div className="title">{cur && <Icon name={cur.icon} size={18} />}<span>{cur ? t(cur.k) : t('brand.name')}</span></div>
          {p.streak.count > 1 && <span className="chip warn hide-sm" title={t('streak.title')}><Icon name="bolt" size={14} />{nf(p.streak.count)}</span>}
          <Link to="/progress" className="xp-chip hide-sm"><span className="lv">{lv.level}</span><bdi>{nf(p.xp)} XP</bdi></Link>
          <button className="btn sm ghost" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} aria-label={t('a11y.lang')}><Icon name="globe" size={18} /><span lang={lang === 'en' ? 'ar' : 'en'}>{lang === 'en' ? 'العربية' : 'English'}</span></button>
          <button className="btn sm icon ghost" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={t('a11y.theme')}><Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} /></button>
        </header>
        <main id="main" tabIndex={-1}>
          <Suspense fallback={<PageFallback />}><Outlet key={loc.pathname.split('/')[1]} /></Suspense>
        </main>
      </div>
      <nav className="bottom-nav" aria-label={t('a11y.nav')}>
        {NAV.filter((n) => MOBILE.includes(n.to)).map((n) => (<NavLink key={n.to} to={n.to} end={n.end}><Icon name={n.icon} size={22} />{t(n.k)}</NavLink>))}
      </nav>
      <ToastHost />
    </div>
  );
}
