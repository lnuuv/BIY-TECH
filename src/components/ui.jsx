import React from 'react';

const ICONS = {
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  book: 'M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5zM4 19a2 2 0 012-2h13M9 7h6',
  cube: 'M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM12 12l8-4.5M12 12v9M12 12L4 7.5',
  layers: 'M12 2L2 7l10 5 10-5-10-5zM2 12l10 5 10-5M2 17l10 5 10-5',
  network: 'M12 4v5M5 20v-4a2 2 0 012-2h10a2 2 0 012 2v4M12 9v5M9 4h6v5H9zM2 20h6v-0M3 20h4M17 20h4',
  chip: 'M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4M10 10h4v4h-4z',
  bot: 'M12 4v3M6 8h12a2 2 0 012 2v7a2 2 0 01-2 2H6a2 2 0 01-2-2v-7a2 2 0 012-2zM9 13h.01M15 13h.01M9 17h6M2 12v3M22 12v3',
  trophy: 'M8 4h8v5a4 4 0 01-8 0V4zM8 6H4v1a3 3 0 003 3M16 6h4v1a3 3 0 01-3 3M12 13v4M8 20h8M10 17h4',
  gamepad: 'M7 8h10a4 4 0 014 4v2a3 3 0 01-5.2 2L14 15h-4l-1.8 1A3 3 0 013 14v-2a4 4 0 014-4zM8 11v3M6.5 12.5h3M15.5 11.5h.01M17.5 13.5h.01',
  doc: 'M7 3h7l5 5v13H7a1 1 0 01-1-1V4a1 1 0 011-1zM14 3v5h5M9 13h6M9 17h6M9 9h2',
  globe: 'M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  sun: 'M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5',
  moon: 'M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z',
  menu: 'M4 6h16M4 12h16M4 18h16', check: 'M5 12.5l4.5 4.5L19 7.5', x: 'M6 6l12 12M18 6L6 18', play: 'M7 4l13 8-13 8V4z', reset: 'M4 12a8 8 0 112.5 5.8M4 19v-5h5',
  explode: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6M10 10h4v4h-4z', tag: 'M3 12V4h8l10 10-8 8L3 12zM7.5 8.5h.01',
  send: 'M4 12l16-8-6 16-3-7-7-1z', plus: 'M12 5v14M5 12h14', trash: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13M10 11v6M14 11v6', link: 'M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1',
  power: 'M12 3v9M6.3 6.3a8 8 0 1011.4 0', flask: 'M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3M8 15h8', star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7l1-8z', search: 'M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-5-5', wrench: 'M14.7 6.3a4 4 0 005 5L21 10l-4-4-2.3.3zM14 10L4 20l-1-1 10-10M17 6l-1.5 1.5', cap: 'M2 9l10-5 10 5-10 5L2 9zM6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6z', info: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 11v6M12 7.5h.01', arrow: 'M5 12h14M13 6l6 6-6 6', chevron: 'M9 6l6 6-6 6',
  undo: 'M9 7L4 12l5 5M4 12h11a5 5 0 010 10h-2', zoom: 'M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-5-5M8 11h6M11 8v6', rotate: 'M20 12a8 8 0 11-3-6.3M20 4v5h-5', pause: 'M8 5v14M16 5v14', lock: 'M6 11h12v9H6zM8 11V8a4 4 0 018 0v3', shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z', wifi: 'M2 9a15 15 0 0120 0M5 12.5a10 10 0 0114 0M8.5 16a5 5 0 017 0M12 19.5h.01',
  download: 'M12 4v11M7 11l5 5 5-5M5 20h14', server: 'M4 4h16v6H4zM4 14h16v6H4zM8 7h.01M8 17h.01', pc: 'M3 4h18v12H3zM8 20h8M12 16v4', laptop: 'M5 5h14v10H5zM2 19h20', phone: 'M8 3h8a1 1 0 011 1v16a1 1 0 01-1 1H8a1 1 0 01-1-1V4a1 1 0 011-1zM11 18h2', printer: 'M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z', router: 'M4 14h16v6H4zM8 17h.01M12 17h.01M7 14l-2-6M17 14l2-6', switch: 'M3 9h18v6H3zM6 12h.01M9 12h.01M12 12h.01M15 12h.01M18 12h.01', ap: 'M12 14a2 2 0 100-4 2 2 0 000 4zM7 8a7 7 0 000 8M17 8a7 7 0 010 8M4 5a11 11 0 000 14M20 5a11 11 0 010 14', cloud: 'M7 18a4 4 0 01-.5-8 6 6 0 0111.5 1.5A3.5 3.5 0 0117.5 18H7z',
  volume: 'M11 5L6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 010 7M19 5a10 10 0 010 14',
  mute: 'M11 5L6 9H2v6h4l5 4V5zM22 9l-6 6M16 9l6 6',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
};
export const iconPath = (name) => ICONS[name] || ICONS.info;
export function Icon({ name, size = 20, stroke = 1.8, className, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={className} style={style}>
      <path d={ICONS[name] || ICONS.info} />
    </svg>
  );
}

export function Ring({ pct = 0, size = 64, stroke = 7, label }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <div className="ring" style={{ width: size, height: size }} role="img" aria-label={`${Math.round(pct * 100)}%`}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--accent)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, pct))} style={{ transition: 'stroke-dashoffset var(--t-slow) var(--ease)' }} />
      </svg>
      <b>{label ?? `${Math.round(pct * 100)}%`}</b>
    </div>
  );
}
export const Bar = ({ pct, label }) => (<div className="bar" role="progressbar" aria-valuenow={Math.round(pct * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={label}><i style={{ width: `${Math.min(100, pct * 100)}%` }} /></div>);
export const Chip = ({ tone = '', children, className = '', ...p }) => <span className={`chip ${tone} ${className}`} {...p}>{children}</span>;
export function Toggle({ checked, onChange, children }) { return (<label className="toggle"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /><i />{children}</label>); }
export function PageHead({ eyebrow, title, children }) { return (<header className="page-head">{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{children && <p>{children}</p>}</header>); }

// tiny toast system
let pushToast = () => {};
export const toast = (msg, icon = 'star') => pushToast(msg, icon);
export function ToastHost() {
  const [items, setItems] = React.useState([]);
  React.useEffect(() => { pushToast = (msg, icon) => { const id = Math.random(); setItems((a) => [...a, { id, msg, icon }]); setTimeout(() => setItems((a) => a.filter((x) => x.id !== id)), 2800); }; return () => { pushToast = () => {}; }; }, []);
  return (<div className="toast-host" role="status" aria-live="polite">{items.map((i) => (<div className="toast" key={i.id}><Icon name={i.icon} size={18} style={{ color: 'var(--accent)' }} />{i.msg}</div>))}</div>);
}
