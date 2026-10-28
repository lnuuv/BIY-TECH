import React from 'react';
import { Icon } from '../ui.jsx';
import * as S from '../../lab/sim.js';

export default function LabInspector({
  t,
  lang,
  model,
  cfgs,
  selDev,
  selLink,
  dev,
  setDev,
  setCfg,
  setPort,
  removeSel,
  rotateSel,
  duplicateSel,
  cableType,
  connectPorts,
  setConn,
  newRoute,
  setNewRoute,
  mut,
  say,
}) {
  const field = (label, value, onChange, kind) => {
    const bad = value && (kind === 'mask' ? S.parseMask(value) === null : S.parseIp(value) === null);
    return (
      <div className="field">
        <label>{label}</label>
        <input
          className={`input mono ${bad ? 'bad' : ''}`}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          inputMode="decimal"
          aria-invalid={!!bad}
        />
      </div>
    );
  };

  return (
    <div className="card tight inspector">
      <div className="row between">
        <h4 style={{ margin: 0 }}>{t('lab.inspector')}</h4>
        {selDev && <span className="chip mono">{selDev.id} · {S.DEVICE_TYPES[selDev.type]?.label[lang]}</span>}
        {selLink && <span className="chip mono">{selLink.id}</span>}
      </div>
      {!selDev && !selLink && <p className="muted small" style={{ marginTop: 8, marginBottom: 0 }}>{t('lab.insp.empty')}</p>}

      {selLink && (
        <div className="stack" style={{ marginTop: 10 }}>
          <p className="small" style={{ margin: 0 }}>
            <b>{dev(selLink.a.d)?.name}</b> ({selLink.a.p}) ↔ <b>{dev(selLink.b.d)?.name}</b> ({selLink.b.p})
          </p>
          <div className="row wrap">
            <span className={`chip ${S.isLinkUp(model, selLink) ? 'ok' : 'bad'}`}>
              {t(S.isLinkUp(model, selLink) ? 'lab.link.up' : 'lab.link.down')}
            </span>
            <span className="chip">
              {S.CABLE_TYPES[selLink.cableType]?.label[lang] || (selLink.kind === 'wifi' ? 'Wi-Fi' : 'Ethernet')}
            </span>
          </div>
          <button className="btn sm danger" onClick={removeSel}>
            <Icon name="trash" size={15} />{t('lab.link.cut')}
          </button>
        </div>
      )}

      {selDev && (
        <div className="stack" style={{ marginTop: 10 }}>
          <div className="field">
            <label>{t('lab.f.name')}</label>
            <input className="input" value={selDev.name} onChange={(e) => setDev({ name: e.target.value.slice(0, 24) })} />
          </div>

          <div className="row between wrap">
            <label className="toggle">
              <input
                type="checkbox"
                checked={selDev.on}
                onChange={(e) => {
                  setDev({ on: e.target.checked });
                  say('info', t(e.target.checked ? 'lab.log.on' : 'lab.log.off', { n: selDev.name }));
                }}
              />
              <i />{t('lab.f.power')}
            </label>
            <div className="row" style={{ gap: 6 }}>
              <button type="button" className="btn sm ghost" onClick={rotateSel} title={t('lab.act.rotate')}>
                <Icon name="rotate" size={14} />
              </button>
              {selDev.type !== 'internet' && (
                <button type="button" className="btn sm ghost" onClick={duplicateSel} title={t('lab.act.dup')}>
                  <Icon name="plus" size={14} />
                </button>
              )}
              <button type="button" className="btn sm ghost danger" onClick={removeSel}>
                <Icon name="trash" size={15} />{t('lab.remove')}
              </button>
            </div>
          </div>

          <div className="row between" style={{ fontSize: 11.5, color: 'var(--muted)' }}>
            <span>{t('lab.f.pos3d')}</span>
            <span className="mono">
              X: {(selDev.pos3d?.x ?? 0).toFixed(1)}m · Z: {(selDev.pos3d?.z ?? 0).toFixed(1)}m
            </span>
          </div>

          {selDev.kind === 'host' && (
            <>
              {selDev.ports.length > 1 && (
                <div className="field">
                  <label>{t('lab.f.iface')}</label>
                  <select
                    className="input mono"
                    value={selDev.cfg.preferredPort || ''}
                    onChange={(e) => setCfg({ preferredPort: e.target.value })}
                  >
                    <option value="">{t('lab.f.iface.auto')}</option>
                    {selDev.ports.map((p) => (
                      <option key={p.id} value={p.id}>{p.id} ({p.kind === 'wifi' ? 'Wi-Fi' : 'Ethernet'})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="field">
                <label>{t('lab.f.mode')}</label>
                <div className="seg">
                  <button type="button" aria-pressed={selDev.cfg.mode === 'static'} onClick={() => setCfg({ mode: 'static' })}>{t('lab.f.static')}</button>
                  <button type="button" aria-pressed={selDev.cfg.mode === 'dhcp'} onClick={() => setCfg({ mode: 'dhcp' })}>DHCP</button>
                </div>
              </div>

              {selDev.cfg.mode === 'static' ? (
                <>
                  {field(t('lab.f.ip'), selDev.cfg.ip, (v) => setCfg({ ip: v }))}
                  {field(t('lab.f.mask'), selDev.cfg.mask, (v) => setCfg({ mask: v }), 'mask')}
                  {field(t('lab.f.gw'), selDev.cfg.gw, (v) => setCfg({ gw: v }))}
                  {field(t('lab.f.dns'), selDev.cfg.dns, (v) => setCfg({ dns: v }))}
                </>
              ) : (
                <div className="callout small">
                  <Icon name="info" size={18} />
                  <div className="mono ltr">
                    {cfgs.get(selDev.id)?.ip || '—'} / {cfgs.get(selDev.id)?.mask || ''} <br />
                    {t('lab.f.gw')}: {cfgs.get(selDev.id)?.gw || '—'} · DNS: {cfgs.get(selDev.id)?.dns || '—'}<br />
                    <span className="muted" style={{ fontFamily: 'var(--font)' }}>
                      {cfgs.get(selDev.id)?.source === 'apipa'
                        ? t('lab.f.apipa')
                        : cfgs.get(selDev.id)?.source === 'dhcp'
                          ? t('lab.f.leased')
                          : t('lab.f.nolink')}
                    </span>
                  </div>
                </div>
              )}

              {selDev.ports.some((p) => p.kind === 'wifi') && (
                <div className="port-cfg">
                  <b className="tiny">Wi-Fi (wifi0)</b>
                  <div className="grid c2" style={{ gap: 6 }}>
                    <div className="field">
                      <label>{t('lab.f.ssid')}</label>
                      <input className="input mono" value={selDev.cfg.ssid ?? S.DEFAULT_SSID} onChange={(e) => setCfg({ ssid: e.target.value })} />
                    </div>
                    <div className="field">
                      <label>{t('lab.f.wifikey')}</label>
                      <input className="input mono" value={selDev.cfg.wifiKey ?? S.DEFAULT_WIFI_KEY} onChange={(e) => setCfg({ wifiKey: e.target.value })} />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {selDev.type === 'switch' && (
            <div className="field">
              <label>{t('lab.f.vlan')} & {t('lab.f.portmode')}</label>
              <div className="sw-port-grid">
                {selDev.ports.map((p) => {
                  const linked = model.links.some((l) => (l.a.d === selDev.id && l.a.p === p.id) || (l.b.d === selDev.id && l.b.p === p.id));
                  return (
                    <div key={p.id} className="sw-port-row">
                      <span className={`chip mono ${linked && p.adminUp !== false ? 'ok' : ''}`}>{p.id}</span>
                      <label className="toggle" title={t('lab.f.admin')}>
                        <input type="checkbox" checked={p.adminUp !== false} onChange={(e) => setPort(p.id, { adminUp: e.target.checked })} />
                        <i />
                      </label>
                      <select className="input" value={p.mode || 'access'} onChange={(e) => setPort(p.id, { mode: e.target.value })}>
                        <option value="access">Access</option>
                        <option value="trunk">Trunk</option>
                      </select>
                      <input
                        className="input mono"
                        type="number"
                        min={1}
                        max={4094}
                        disabled={p.mode === 'trunk'}
                        value={p.vlan || 1}
                        onChange={(e) => setPort(p.id, { vlan: Math.max(1, Math.min(4094, Number(e.target.value) || 1)) })}
                        title="VLAN ID"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {selDev.type === 'ap' && (
            <div className="port-cfg">
              <div className="field">
                <label>{t('lab.f.ssid')}</label>
                <input className="input mono" value={selDev.ssid ?? S.DEFAULT_SSID} onChange={(e) => setDev({ ssid: e.target.value })} />
              </div>
              <div className="grid c2" style={{ gap: 8 }}>
                <div className="field">
                  <label>{t('lab.f.security')}</label>
                  <select className="input" value={selDev.security || 'WPA2-PSK'} onChange={(e) => setDev({ security: e.target.value })}>
                    <option value="WPA2-PSK">WPA2-PSK</option>
                    <option value="WPA3">WPA3</option>
                    <option value="Open">Open</option>
                  </select>
                </div>
                <div className="field">
                  <label>{t('lab.f.channel')}</label>
                  <select className="input mono" value={selDev.channel || 6} onChange={(e) => setDev({ channel: Number(e.target.value) })}>
                    <option value={1}>Ch 1 (2.4 GHz)</option>
                    <option value={6}>Ch 6 (2.4 GHz)</option>
                    <option value={11}>Ch 11 (2.4 GHz)</option>
                    <option value={36}>Ch 36 (5 GHz)</option>
                  </select>
                </div>
              </div>
              {(selDev.security || 'WPA2-PSK') !== 'Open' && (
                <div className="field">
                  <label>{t('lab.f.wifikey')}</label>
                  <input className="input mono" value={selDev.wifiKey ?? S.DEFAULT_WIFI_KEY} onChange={(e) => setDev({ wifiKey: e.target.value })} />
                </div>
              )}
            </div>
          )}

          {selDev.kind === 'router' && (
            <>
              {selDev.ports.map((p) => (
                <div key={p.id} className="port-cfg">
                  <div className="row between">
                    <b className="tiny mono">{p.id}</b>
                    <label className="toggle" style={{ fontSize: 12 }}>
                      <input type="checkbox" checked={p.adminUp !== false} onChange={(e) => setPort(p.id, { adminUp: e.target.checked })} />
                      <i />{t('lab.f.admin')}
                    </label>
                  </div>
                  {field(t('lab.f.ip'), p.ip, (v) => setPort(p.id, { ip: v }))}
                  {field(t('lab.f.mask'), p.mask, (v) => setPort(p.id, { mask: v }), 'mask')}
                  {p.id === 'WAN' && field(t('lab.f.gw'), p.gw, (v) => setPort(p.id, { gw: v }))}
                </div>
              ))}
              <label className="toggle">
                <input type="checkbox" checked={!!selDev.dhcp} onChange={(e) => setDev({ dhcp: e.target.checked })} />
                <i />{t('lab.f.dhcp')}
              </label>
              <label className="toggle">
                <input type="checkbox" checked={!!selDev.defaultRoute} onChange={(e) => setDev({ defaultRoute: e.target.checked })} />
                <i />{t('lab.f.defroute')}
              </label>

              <div className="port-cfg">
                <b className="tiny">{t('lab.f.routes')}</b>
                {(selDev.routes || []).map((rt, idx) => (
                  <div key={idx} className="row between" style={{ fontSize: 12 }}>
                    <span className="mono">{rt.dst}/{rt.mask} → {rt.nextHop}</span>
                    <button
                      type="button"
                      className="btn sm ghost danger"
                      onClick={() => setDev({ routes: (selDev.routes || []).filter((_, i) => i !== idx) })}
                    >
                      <Icon name="x" size={13} />
                    </button>
                  </div>
                ))}
                <div className="route-row">
                  <input className="input mono" placeholder={t('lab.f.route.dst')} value={newRoute.dst} onChange={(e) => setNewRoute({ ...newRoute, dst: e.target.value })} />
                  <input className="input mono" placeholder={t('lab.f.route.mask')} value={newRoute.mask} onChange={(e) => setNewRoute({ ...newRoute, mask: e.target.value })} />
                  <input className="input mono" placeholder={t('lab.f.route.nh')} value={newRoute.nextHop} onChange={(e) => setNewRoute({ ...newRoute, nextHop: e.target.value })} />
                  <button
                    type="button"
                    className="btn sm"
                    aria-label={t('lab.f.route.add')}
                    onClick={() => {
                      if (S.parseIp(newRoute.dst) === null || S.parseMask(newRoute.mask) === null || S.parseIp(newRoute.nextHop) === null) return;
                      setDev({ routes: [...(selDev.routes || []), { ...newRoute }] });
                      setNewRoute({ dst: '', mask: '255.255.255.0', nextHop: '' });
                    }}
                  >
                    <Icon name="plus" size={14} />
                  </button>
                </div>
              </div>
            </>
          )}

          {selDev.kind === 'internet' && (
            <p className="small muted" style={{ margin: 0 }}>
              {t('lab.f.internet', { gw: S.INTERNET_GW, host: S.INTERNET_HOST })}
            </p>
          )}

          <div className="field">
            <label>{t('lab.f.cabling')}</label>
            {selDev.ports.map((p) => {
              const free = S.portFree(model, selDev, p);
              const existingLinks = model.links.filter((l) => (l.a.d === selDev.id && l.a.p === p.id) || (l.b.d === selDev.id && l.b.p === p.id));
              const cands = model.devices
                .filter((o) => o.id !== selDev.id)
                .flatMap((o) => o.ports.filter((q) => S.canConnect(model, { d: selDev.id, p: p.id }, { d: o.id, p: q.id }, cableType).ok).map((q) => ({ o, q })));
              return (
                <div key={p.id} className="stack" style={{ gap: 4, marginBottom: 6 }}>
                  <div className="row cabling">
                    <span className={`chip mono ${existingLinks.length ? 'ok' : ''}`}>{p.id}</span>
                    {p.multi || free ? (
                      <>
                        <select
                          className="input"
                          aria-label={`${t('lab.f.connect')} ${p.id}`}
                          value=""
                          onChange={(e) => {
                            if (!e.target.value) return;
                            const [od, op] = e.target.value.split('|');
                            connectPorts({ d: selDev.id, p: p.id }, { d: od, p: op });
                          }}
                        >
                          <option value="">{t('lab.f.connect')}</option>
                          {cands.map(({ o, q }) => (
                            <option key={`${o.id}|${q.id}`} value={`${o.id}|${q.id}`}>{o.name} · {q.id}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn sm ghost"
                          onClick={() => setConn({ d: selDev.id, p: p.id, x: selDev.x, y: selDev.y, dragged: false })}
                          title={t('lab.f.pick3d')}
                        >
                          <Icon name="link" size={14} />
                        </button>
                      </>
                    ) : (
                      <span className="small muted grow">{t('lab.f.linked')}</span>
                    )}
                  </div>
                  {existingLinks.map((lk) => {
                    const peer = lk.a.d === selDev.id && lk.a.p === p.id ? lk.b : lk.a;
                    const peerDev = dev(peer.d);
                    return (
                      <div key={lk.id} className="row between" style={{ paddingInlineStart: 8, fontSize: 12 }}>
                        <span className="muted">↔ <b>{peerDev?.name}</b> ({peer.p})</span>
                        <button
                          type="button"
                          className="btn sm ghost danger"
                          onClick={() => {
                            mut((m) => S.disconnect(m, lk.id));
                            say('info', t('lab.log.unlink'));
                          }}
                        >
                          {t('lab.f.disconnect')}
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
