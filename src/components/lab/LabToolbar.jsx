import React from 'react';
import { Icon } from '../ui.jsx';
import * as S from '../../lab/sim.js';

export const ICON = {
  pc: 'pc',
  laptop: 'laptop',
  phone: 'phone',
  server: 'server',
  printer: 'printer',
  switch: 'switch',
  ap: 'ap',
  router: 'router',
  internet: 'cloud',
};
export const INVENTORY = ['pc', 'laptop', 'phone', 'server', 'printer', 'switch', 'ap', 'router', 'internet'];
export const CABLE_KEYS = ['auto', 'straight', 'crossover', 'fiber', 'wifi'];

export default function LabToolbar({
  t,
  lang,
  viewMode,
  setViewMode,
  toolMode,
  setToolMode,
  conn,
  setConn,
  cableType,
  setCableType,
  addDevice,
  loadStarterLab,
  exportTopology,
  importTopology,
  fileInputRef,
  clearCanvas,
}) {
  return (
    <>
      <div className="inv-bar" role="toolbar" aria-label={t('lab.devices')}>
        {INVENTORY.map((ty) => (
          <button
            key={ty}
            className="inv-chip"
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/x-device', ty)}
            onClick={() => addDevice(ty)}
            title={t('lab.inv.hint')}
          >
            <Icon name={ICON[ty]} size={18} />
            <span>{S.DEVICE_TYPES[ty].label[lang]}</span>
            <Icon name="plus" size={13} className="plus" />
          </button>
        ))}
      </div>

      <div className="lab-subbar">
        <div className="row wrap" style={{ gap: 8 }}>
          <div className="seg" role="group" aria-label="View mode">
            <button type="button" aria-pressed={viewMode === '3d'} onClick={() => setViewMode('3d')}>
              <Icon name="cube" size={14} /> {t('lab.view.3d')}
            </button>
            <button type="button" aria-pressed={viewMode === '2d'} onClick={() => setViewMode('2d')}>
              <Icon name="network" size={14} /> {t('lab.view.2d')}
            </button>
          </div>

          <div className="seg" role="group" aria-label="Workspace tool">
            <button
              type="button"
              aria-pressed={toolMode === 'select' && !conn}
              onClick={() => { setToolMode('select'); setConn(null); }}
            >
              {t('lab.tool.select')}
            </button>
            <button
              type="button"
              aria-pressed={toolMode === 'connect' || !!conn}
              onClick={() => setToolMode(toolMode === 'connect' ? 'select' : 'connect')}
            >
              <Icon name="link" size={14} /> {t('lab.tool.cable')}
            </button>
          </div>

          <select
            className="input"
            style={{ width: 'auto', height: 34, fontSize: 13 }}
            aria-label={t('lab.f.cabletype')}
            value={cableType}
            onChange={(e) => setCableType(e.target.value)}
          >
            {CABLE_KEYS.map((ck) => (
              <option key={ck} value={ck}>{t(`lab.cable.${ck}`)}</option>
            ))}
          </select>
        </div>

        <div className="row wrap" style={{ gap: 6 }}>
          <button type="button" className="btn sm" onClick={loadStarterLab}>
            <Icon name="cube" size={14} /> {t('lab.preset.starter')}
          </button>
          <button type="button" className="btn sm" onClick={exportTopology}>
            <Icon name="download" size={14} /> {t('lab.export')}
          </button>
          <button type="button" className="btn sm" onClick={() => fileInputRef.current?.click()}>
            <Icon name="doc" size={14} /> {t('lab.import')}
          </button>
          <input ref={fileInputRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={importTopology} />
          <button type="button" className="btn sm ghost danger" onClick={clearCanvas}>
            <Icon name="trash" size={15} /> {t('lab.clear')}
          </button>
        </div>
      </div>
    </>
  );
}
