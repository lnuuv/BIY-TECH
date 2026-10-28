import React, { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/index.jsx';
import FullscreenButton from '../components/FullscreenButton.jsx';

function webglOk() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export default function NetLabCanvas({
  model,
  cfgs,
  conflicts,
  sel,
  conn,
  toolMode,
  cableType,
  showLabels,
  showGrid,
  snapGrid,
  liveTraffic = true,
  followPacket = false,
  autoOrbit = false,
  animSpeed = 1.0,
  failDevId,
  anim,
  onReady,
  onSelect,
  onMoveDevice,
  onPortClick,
  onDeviceConnectClick,
  onDropDevice,
  children,
}) {
  const { t } = useI18n();
  const hostRef = useRef(null);
  const stageRef = useRef(null);
  const sceneRef = useRef(null);
  const cbsRef = useRef({});
  cbsRef.current = { onSelect, onMoveDevice, onPortClick, onDeviceConnectClick };
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!webglOk()) {
      setStatus('nogl');
      return undefined;
    }
    let dead = false;
    (async () => {
      try {
        const { NetLabScene } = await import('./netLab3d.js');
        if (dead || !hostRef.current) return;
        const scene = new NetLabScene(hostRef.current, {
          onSelect: (s) => cbsRef.current.onSelect?.(s),
          onMoveDevice: (id, pos3d) => cbsRef.current.onMoveDevice?.(id, pos3d),
          onPortClick: (devId, portId) => cbsRef.current.onPortClick?.(devId, portId),
          onDeviceConnectClick: (devId) => cbsRef.current.onDeviceConnectClick?.(devId),
        });
        sceneRef.current = scene;
        scene.sync({
          model,
          cfgs,
          conflicts,
          sel,
          conn,
          toolMode,
          cableType,
          showLabels,
          showGrid,
          snapGrid,
          liveTraffic,
          followPacket,
          autoOrbit,
          animSpeed,
          failDevId,
        });
        setStatus('ready');
        onReady?.(scene);
      } catch (err) {
        console.error('3D Network Lab init failed:', err);
        if (!dead) setStatus('error');
      }
    })();
    return () => {
      dead = true;
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sceneRef.current?.sync({
      model,
      cfgs,
      conflicts,
      sel,
      conn,
      toolMode,
      cableType,
      showLabels,
      showGrid,
      snapGrid,
      liveTraffic,
      followPacket,
      autoOrbit,
      animSpeed,
      failDevId,
    });
  }, [model, cfgs, conflicts, sel, conn, toolMode, cableType, showLabels, showGrid, snapGrid, liveTraffic, followPacket, autoOrbit, animSpeed, failDevId]);

  useEffect(() => {
    if (anim) sceneRef.current?.playPacketAnimation(anim);
  }, [anim]);

  const handleDrop = (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('text/x-device');
    if (!type) return;
    const pos3d = sceneRef.current ? sceneRef.current.screenToFloor(e.clientX, e.clientY) : { x: 0, y: 0, z: 0 };
    onDropDevice?.(type, pos3d);
  };

  return (
    <div
      ref={stageRef}
      className="stage netlab-stage"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      role="region"
      aria-label={t('lab.canvas')}
    >
      <div ref={hostRef} className="stage-host" />
      {status === 'loading' && (
        <div className="stage-overlay">
          <div className="spinner" />
          <span>{t('3d.loading')}</span>
        </div>
      )}
      {(status === 'nogl' || status === 'error') && (
        <div className="stage-overlay">
          <span>{t(status === 'nogl' ? '3d.nogl' : '3d.error')}</span>
        </div>
      )}
      <div className="stage-tools stage-fullscreen-tool"><FullscreenButton targetRef={stageRef} /></div>
      {children}
    </div>
  );
}
