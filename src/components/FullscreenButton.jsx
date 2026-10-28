import React, { useEffect, useState } from 'react';
import { useI18n } from '../i18n/index.jsx';
import { Icon } from './ui.jsx';

export default function FullscreenButton({ targetRef, className = 'btn sm' }) {
  const { t } = useI18n();
  const [active, setActive] = useState(false);

  useEffect(() => {
    const update = () => setActive(document.fullscreenElement === targetRef.current);
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, [targetRef]);

  const toggle = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await targetRef.current?.requestFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen toggle failed:', error);
    }
  };

  return (
    <button type="button" className={className} onClick={toggle} aria-label={t(active ? '3d.fullscreen.exit' : '3d.fullscreen.open')} title={t(active ? '3d.fullscreen.exit' : '3d.fullscreen.open')}>
      <Icon name={active ? 'minimize' : 'maximize'} size={16} />
      {t(active ? '3d.fullscreen.exit' : '3d.fullscreen.open')}
    </button>
  );
}
