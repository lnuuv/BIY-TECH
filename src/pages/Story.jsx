import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/index.jsx';
import { Icon } from '../components/ui.jsx';
import '../styles/story.css';
import { S } from '../story/ui/strings.js';
import { DIALOGUES } from '../story/config/dialogues.js';
import { startDialogue, advance, view } from '../story/dialogue.js';
import { playVoice, playChoiceVoice, stopVoice } from '../story/voice.js';
import { isSfxMuted, setSfxMuted, playUiClick, playCableClick, disposeSfx } from '../story/sfx.js';
import { STAGES, stageIndex, newState, loadState, saveState, clearState, goStage, STATIONS } from '../story/storyState.js';
import DialoguePanel from '../story/ui/DialoguePanel.jsx';
import AssemblyPanel from '../story/ui/AssemblyPanel.jsx';
import { TitleScreen, ApprovalPanel, EnterPanel, FurniturePanel, SoftwarePanel, DeployPanel, RackPanel, CablingPanel, PeriphPanel, VerifyPanel, CreditsScreen } from '../story/ui/StagePanels.jsx';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const HELP = {
  request: { en: 'Choose Teacher Yasser’s replies (keys 1–4). Every path leads to the principal’s decision.', ar: 'اختر ردود الأستاذ ياسر (المفاتيح 1–4). كل المسارات توصل لقرار المدير.' },
  furniture: { en: 'Walk with Alaa (WASD / Arrows) or click Auto-distribute to place 25 student desks.', ar: 'تحرّك بالأستاذ علاء (WASD / الأسهم) لتوزيع الطاولات بنفسك أو اضغط زر التوزيع التلقائي لوضع 25 طاولة طالب.' },
  assembly: { en: 'Drag each part onto its place in the 3D view (or tap the part, then the place). Wrong places and wrong order are explained.', ar: 'اسحب كل قطعة لمكانها في المشهد (أو اضغط القطعة ثم المكان). سيتم شرح أي خطأ في المكان أو الترتيب.' },
  software: { en: 'Install in a sensible order: firmware → OS → drivers → updates → security → Office / exam client. Then verify.', ar: 'نصّب بترتيب منطقي: البرنامج الثابت ← النظام ← التعريفات ← التحديثات ← الحماية ← Office / برنامج الامتحان. ثم تحقق.' },
  deploy: { en: 'Walk with Alaa (WASD / Arrows) to each desk or click Auto-deploy to install the 25 student PCs.', ar: 'تحرّك بالأستاذ علاء (WASD / الأسهم) نحو الطاولات لتوزيع الأجهزة أو اضغط زر التوزيع التلقائي لتركيب 25 جهاز طالب.' },
  rack: { en: 'Select a component, then the rack unit. Patch panels sit around the switch; power goes at the bottom.', ar: 'اختر القطعة ثم الوحدة. لوحات التوصيل حول السويتش، والكهرباء بالأسفل.' },
  cabling: { en: 'Link device → outlet → patch panel → switch. Do 3 devices by hand, then use the bulk actions and verify.', ar: 'اربط الجهاز ← المخرج ← لوحة التوصيل ← السويتش. وصّل 3 أجهزة يدوياً، ثم استخدم الأدوات الجماعية وتحقق.' },
  verify: { en: 'Run the inspection. Use “Go and fix” on any failed item, then come back here.', ar: 'شغّل الفحص. استخدم «اذهب للتصحيح» لأي بند فاشل ثم ارجع هنا.' },
};

export default function Story() {
  const { c, lang, setLang } = useI18n();
  const nav = useNavigate();
  const saved = useMemo(() => loadState(), []);
  const [st, setSt] = useState(() => ({ ...newState() }));
  const stRef = useRef(st); stRef.current = st;
  const host = useRef(null); const W = useRef(null);
  const [worldReady, setWorldReady] = useState(false);
  const [fade, setFade] = useState(false);
  const [cine, setCine] = useState(false);
  const [paused, setPaused] = useState(false);
  const [help, setHelp] = useState(false);
  const [muted, setMuted] = useState(() => isSfxMuted());
  const [ui, setUi] = useState(null);
  const [dlg, setDlg] = useState(null);
  const [prog, setProg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [runKey, setRunKey] = useState(0);

  const update = useCallback((fn) => setSt((s) => { const n = typeof fn === 'function' ? fn(s) : { ...s, ...fn }; saveState(n); return n; }), []);

  const toggleMute = useCallback(() => {
    const next = setSfxMuted(!muted);
    setMuted(next);
    if (next) stopVoice();
    else playUiClick('ok');
  }, [muted]);

  // ---------- world ----------
  useEffect(() => {
    let w; let dead = false;
    (async () => {
      try {
        const { StoryWorld } = await import('../three/story/world.js');
        try { await Promise.race([Promise.all([document.fonts.load('700 96px "IBM Plex Sans Arabic"'), document.fonts.load('600 46px Inter')]), new Promise((r) => setTimeout(r, 2500))]); } catch { /* ignore */ }
        if (dead || !host.current) return;
        w = new StoryWorld(host.current, { onEvent: (e) => { if (e.type === 'fade') { setFade(true); setTimeout(() => setFade(false), 650); } } });
        W.current = w; if (typeof window !== 'undefined') window.__story = w; setWorldReady(true);
      } catch (e) { console.error(e); setErr(String(e?.message || e)); }
    })();
    return () => { dead = true; w?.dispose(); W.current = null; disposeSfx(); };
  }, []);

  // ---------- transitions ----------
  const go = useCallback(async (id, opts = {}) => {
    playUiClick('click');
    stopVoice();
    setPaused(false);
    setBusy(false);
    setCine(false);
    setFade(true); await sleep(380);
    setUi(null); setDlg(null); setProg(null);
    update((s) => {
      let next = goStage(s, id);
      if (opts.replay) {
        if (id === 'furniture') next = { ...next, furniture: { confirmed: false, placed: false, placedCount: 0 } };
        if (id === 'deploy') next = { ...next, deploy: { deployed: [] } };
      }
      return next;
    });
    setRunKey((k) => k + 1);
    await sleep(80); setFade(false);
  }, [update]);

  // ---------- per-stage script ----------
  useEffect(() => {
    const w = W.current; if (!w || !worldReady) return;
    const stage = st.stage; const tok = w.newToken();
    w.setPaused(false);
    w.sync(stRef.current); w.drift(false); setUi(null); setDlg(null); setCine(false);
    const alaaIn = (x = 1.2, z = -1.4, face = Math.PI) => { w.show(['alaa']); const a = w.cast.alaa; if (!a.root.visible || a.path == null) a.place(x, z, face); a.root.visible = true; a.setWorking(false); };
    const run = async () => {
      switch (stage) {
        case 'title': w.titleIdle(); setUi('title'); break;
        case 'request': setCine(true); await w.playOpening(tok); if (!w.alive(tok)) return; setCine(false); setDlg({ d: startDialogue('request'), said: null }); break;
        case 'approval': setCine(true); await w.playApproval(tok); if (!w.alive(tok)) return; setCine(false); setUi('approval'); break;
        case 'assign': setCine(true); await w.playAssignEntrance(tok); if (!w.alive(tok)) return; setCine(false); setDlg({ d: startDialogue('assign'), said: null }); break;
        case 'enter': setCine(true); await w.playEnter(tok); if (!w.alive(tok)) return; setCine(false); setUi('enter'); break;
        case 'furniture':
          alaaIn(1.0, -1.6);
          if (!stRef.current.furniture.placed) await w.deliverFurniture(tok);
          if (!w.alive(tok)) return;
          w.move(w.wideTop(), 1.6); setUi('furniture'); break;
        case 'assembly':
          alaaIn(0.5, -3.0);
          if (stRef.current.asm.postOk) { await w.focusTeacherDesk(tok); if (!w.alive(tok)) return; setUi('assemblyDone'); break; }
          await w.focusTeacherDesk(tok); if (!w.alive(tok)) return; await sleep(400); w.setPaused(true); setUi('assembly'); break;
        case 'software': alaaIn(-2.2, -4.8, 0); await w.focusTeacherScreen(); if (!w.alive(tok)) return; setUi('software'); break;
        case 'deploy':
          alaaIn(0.6, 0.6);
          // Sync existing 3D workstation count with state on stage entry
          {
            const existingWsIds = w.stations.filter((k) => !!k.ws).map((k) => k.st.id);
            if (existingWsIds.length > (stRef.current.deploy.deployed || []).length) {
              update((s) => ({ ...s, deploy: { deployed: Array.from(new Set([...(s.deploy.deployed || []), ...existingWsIds])) } }));
            }
          }
          w.move({ pos: w.wideTop().pos, target: w.wideTop().target, fov: 50 }, 1.6);
          setUi('deploy');
          break;
        case 'rack':
          alaaIn(-3.25, 3.75, Math.PI * 0.8);
          if (!stRef.current.rack.mounted) { await w.mountCabinet(tok); if (!w.alive(tok)) return; update((s) => ({ ...s, rack: { ...s.rack, mounted: true } })); }
          else { w.cabinet.userData.setDoor(1); await w.focusCabinet(); }
          if (!w.alive(tok)) return;
          setUi('rack'); break;
        case 'cabling': alaaIn(-1.5, 3.0); w.cabinet.userData.setDoor(0); w.move(w.cablingShot(), 1.6); setUi('cabling'); break;
        case 'periph': alaaIn(1.5, -2.6); w.move(w.wideTop(), 1.4); setUi('periph'); break;
        case 'verify': alaaIn(0.3, 0.2); w.move(w.wideTop(), 1.4); w.drift(true, 0.4); setUi('verify'); break;
        case 'finale': setCine(true); await w.playFinale(tok); if (!w.alive(tok)) return; setCine(false); setDlg({ d: startDialogue('finale'), said: null }); break;
        case 'credits': setUi('credits'); await w.playCredits(tok); break;
        default: break;
      }
    };
    run();
    return () => { w.newToken(); };
  }, [st.stage, worldReady, runKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- dialogue ----------
  const line = useMemo(() => {
    if (!dlg || dlg.acting) return null;
    if (dlg.said) return { speaker: dlg.said.speaker, text: dlg.said.text, isPlayer: true };
    return view(dlg.d);
  }, [dlg]);
  useEffect(() => {
    const w = W.current; if (!w || !line) return;
    const v = dlg.said ? { speaker: dlg.said.speaker, gesture: dlg.said.gesture } : view(dlg.d);
    w.speak(v.speaker, v.gesture);
    if (!dlg.said && v.react) setTimeout(() => w.react(v.react.who, v.react.gesture), 900);
    if (!dlg.said && dlg.d?.id === 'finale' && dlg.d?.node === 'e5') {
      w.playAbdullahEntrance(w.token);
    } else {
      w.dialogueCam(v.speaker, DIALOGUES[dlg.d.id].cast);
    }
  }, [line]); // eslint-disable-line react-hooks/exhaustive-deps
  const onChoose = useCallback((i) => {
    playUiClick('ok');
    setDlg((x) => { const d = advance(x.d, i); const h = d.history[d.history.length - 1]; return { d, said: h?.said ? { speaker: h.speaker, text: h.said, gesture: h.gesture } : null }; });
  }, []);
  const onContinue = useCallback(async () => {
    playUiClick('click');
    const x = dlg; if (!x || x.acting) return;
    if (x.said) {
      if (x.d.id === 'finale' && x.d.node === 'e3_x' && W.current) {
        stopVoice();
        setDlg({ ...x, said: null, acting: true });
        setCine(true);
        await W.current.playYasserPrintTest(W.current.token);
        setCine(false);
        setDlg({ d: x.d, said: null, acting: false });
        return;
      }
      setDlg({ ...x, said: null });
      return;
    }
    const d = advance(x.d);
    if (d.done) {
      W.current?.silence();
      update((s) => ({ ...s, dialogues: { ...s.dialogues, [d.id]: { checkpoint: d.checkpoint, path: d.history.map((h) => h.node) } } }));
      const nextStage = { approval: 'approval', classroom: 'enter', credits: 'credits' }[d.checkpoint];
      setDlg(null); if (nextStage) go(nextStage);
      return;
    }
    setDlg({ d, said: null });
  }, [dlg, go, update]);
  const replayVoice = useCallback(() => {
    if (!dlg || dlg.acting) return;
    if (dlg.said) {
      const h = dlg.d.history[dlg.d.history.length - 1];
      playChoiceVoice(dlg.d.id, h?.node, h?.choice, lang);
      return;
    }
    playVoice(dlg.d.id, dlg.d.node, lang);
  }, [dlg, lang]);

  // ---------- voice ----------
  useEffect(() => {
    if (!dlg || dlg.acting || paused) { stopVoice(); return; }
    if (dlg.said) {
      const h = dlg.d.history[dlg.d.history.length - 1];
      playChoiceVoice(dlg.d.id, h.node, h.choice, lang);
      return;
    }
    playVoice(dlg.d.id, dlg.d.node, lang);
  }, [dlg?.d.id, dlg?.d.node, dlg?.said, dlg?.acting, lang, paused]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => stopVoice(), []);

  // ---------- manual Alaa distribution callback ----------
  const handleManualDistribute = useCallback((kind, payload, done) => {
    playUiClick(done ? 'ok' : 'click');
    if (kind === 'furniture') {
      update((s) => ({
        ...s,
        furniture: {
          ...s.furniture,
          confirmed: true,
          placedCount: payload,
          placed: Boolean(done || s.furniture.placed),
        },
      }));
    } else if (kind === 'deploy') {
      const ids = Array.isArray(payload) ? payload : [payload];
      update((s) => ({
        ...s,
        deploy: {
          deployed: Array.from(new Set([...(s.deploy.deployed || []), ...ids])),
        },
      }));
    }
  }, [update]);

  const stepAlaaManual = useCallback((dx, dz) => {
    if (busy || paused) return;
    const curStage = stRef.current.stage;
    if (curStage !== 'furniture' && curStage !== 'deploy') return;
    W.current?.stepAlaaDistribute(dx, dz, curStage, handleManualDistribute);
  }, [busy, paused, handleManualDistribute]);

  // ---------- pause & movement keys (works in both English WASD and Arabic ص ش س ي + Arrow keys) ----------
  useEffect(() => {
    const k = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); setPaused((p) => !p); return; }
      if (e.target.closest?.('input,textarea,select')) return;
      if (e.code === 'KeyM' || e.key === 'm' || e.key === 'M' || e.key === 'ة') { e.preventDefault(); toggleMute(); return; }
      if (paused || busy || dlg) return;
      const curStage = stRef.current.stage;
      if (curStage !== 'furniture' && curStage !== 'deploy') return;

      const code = e.code || '';
      const key = e.key || '';
      const isUp = code === 'KeyW' || code === 'ArrowUp' || key === 'w' || key === 'W' || key === 'ص' || key === 'ArrowUp';
      const isDown = code === 'KeyS' || code === 'ArrowDown' || key === 's' || key === 'S' || key === 'س' || key === 'ArrowDown';
      const isLeft = code === 'KeyA' || code === 'ArrowLeft' || key === 'a' || key === 'A' || key === 'ش' || key === 'ArrowLeft';
      const isRight = code === 'KeyD' || code === 'ArrowRight' || key === 'd' || key === 'D' || key === 'ي' || key === 'ArrowRight';

      if (isUp || isDown || isLeft || isRight) {
        e.preventDefault();
        if (document.activeElement && document.activeElement.tagName === 'BUTTON') {
          document.activeElement.blur();
        }
        if (isUp) stepAlaaManual(0, -1.05);
        else if (isDown) stepAlaaManual(0, 1.05);
        else if (isLeft) stepAlaaManual(-1.05, 0);
        else if (isRight) stepAlaaManual(1.05, 0);
      }
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [paused, busy, dlg, toggleMute, stepAlaaManual]);
  useEffect(() => { W.current?.setPaused(paused || ui === 'assembly'); }, [paused, ui]);

  // ---------- actions ----------
  const startNew = () => { playUiClick('ok'); clearState(); const n = newState(); setSt(n); saveState(n); go('request'); };
  const continueSaved = () => { playUiClick('ok'); const s = saved || loadState(); if (!s) return startNew(); setSt({ ...s, stage: 'title' }); setTimeout(() => go(s.stage === 'title' ? 'request' : s.stage), 30); };
  const restart = () => { playUiClick('click'); setPaused(false); clearState(); W.current && (W.current.stations.forEach((k) => { if (k.ws) { k.g.remove(k.ws); k.ws = null; } k.g.visible = false; k.g.userData.placed = false; })); const n = newState(); setSt(n); saveState(n); W.current?.sync(n); go('request'); };

  const placeFurniture = async () => {
    const w = W.current; const tok = w.token; setProg(stRef.current.furniture.placedCount || 0); setBusy(true);
    update((s) => ({ ...s, furniture: { ...s.furniture, confirmed: true } }));
    const ok = await w.placeFurniture(tok, (n) => {
      setProg(n);
      update((s) => ({ ...s, furniture: { ...s.furniture, confirmed: true, placedCount: n } }));
    });
    setBusy(false);
    setProg(null);
    if (ok !== false) update((s) => ({ ...s, furniture: { confirmed: true, placedCount: 25, placed: true } }));
  };
  const deployAll = async () => {
    const w = W.current; const tok = w.token; setProg(0); setBusy(true);
    const ids = STATIONS.map((x) => x.id).filter((id) => !stRef.current.deploy.deployed.includes(id));
    await w.deploy(tok, ids, (id) => {
      update((s) => (s.deploy.deployed.includes(id) ? s : { ...s, deploy: { deployed: [...s.deploy.deployed, id] } }));
    });
    const allIds = STATIONS.map((x) => x.id);
    update((s) => ({ ...s, deploy: { deployed: allIds } }));
    setBusy(false);
    setProg(null);
  };
  const placeRack = (u, pid) => { update((s) => ({ ...s, rack: { ...s.rack, placed: { ...s.rack.placed, [u]: pid } } })); setTimeout(() => { W.current?.sync(stRef.current); W.current?.animateRackPart(u); }, 0); };
  const removeRack = (u) => { playUiClick('click'); update((s) => { const p = { ...s.rack.placed }; delete p[u]; return { ...s, rack: { ...s.rack, placed: p } }; }); setTimeout(() => W.current?.sync(stRef.current), 0); };
  const setLinks = (links) => { playCableClick(); update((s) => ({ ...s, links })); setTimeout(() => W.current?.sync(stRef.current), 0); };
  const setNetVerified = (ok, fails = 0) => update((s) => ({ ...s, netVerified: ok, netLastFails: ok ? 0 : Math.max(s.netLastFails || 0, fails), netFixes: ok ? (s.netFixes || 0) + (s.netLastFails || 0) : (s.netFixes || 0) }));
  const placePeriph = async (k) => { setBusy(true); await W.current.bringPeripheral(k); update((s) => ({ ...s, periph: { ...s.periph, [k]: { ...s.periph[k], placed: true } } })); setBusy(false); setTimeout(() => W.current?.sync(stRef.current), 0); W.current.move(W.current.wideTop(), 1.4); };
  const testPeriph = (k, ok) => { if (k === 'printer' && ok) W.current?.printTest(); else playUiClick(ok ? 'ok' : 'click'); update((s) => ({ ...s, periph: { ...s.periph, [k]: { ...s.periph[k], ok } } })); setTimeout(() => W.current?.sync(stRef.current), 0); };

  const idx = stageIndex(st.stage);
  const total = STAGES.length - 2;
  const reachedIdx = stageIndex(st.reached);
  const backToVerify = reachedIdx >= stageIndex('verify') && idx < stageIndex('verify') && idx >= stageIndex('furniture');
  const stageHelp = HELP[st.stage];

  return (
    <div className={`story story-letterbox ${cine ? 'cine' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div ref={host} className="story-canvas" aria-label={c(S.title)} />
      <div className={`story-fade ${fade ? 'on' : ''}`} />
      {err && <div className="st-screen"><div className="st-titlecard"><h1 style={{ fontSize: 28 }}>3D</h1><p>{err}</p></div></div>}

      {st.stage !== 'title' && st.stage !== 'credits' && (
        <div className="st-hud">
          <button className="st-btn sm" onClick={() => setPaused(true)} aria-label={c(S.pause)}><Icon name="pause" size={16} /></button>
          <span className="st-chip"><b>{c(STAGES[idx]?.title)}</b><span className="hide-sm">· {c(S.stageOf).replace('{n}', idx).replace('{t}', total)}</span></span>
          <span className="st-progress hide-sm" aria-hidden="true">{STAGES.slice(1, -1).map((s, i) => (<i key={s.id} className={i + 1 < idx ? 'on' : i + 1 === idx ? 'cur' : ''} />))}</span>
          <span className="st-spacer" />
          <button className="st-btn sm" onClick={toggleMute} aria-label={c(muted ? S.unmute : S.mute)} title={c(muted ? S.unmute : S.mute)}>
            <Icon name={muted ? 'volumeOff' : 'volume'} size={16} />
          </button>
          {backToVerify && <button className="st-btn sm primary" onClick={() => go('verify')}>{c(S.backToVerify)}</button>}
          {stageHelp && <button className="st-btn sm" onClick={() => setHelp(!help)} aria-expanded={help}><Icon name="info" size={16} /><span className="hide-sm">{c(S.help)}</span></button>}
          <button className="st-btn sm" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}><Icon name="globe" size={16} />{c(S.lang)}</button>
        </div>
      )}
      {help && stageHelp && <div className="st-panel" style={{ insetInlineStart: 16, insetInlineEnd: 'auto', width: 'min(360px, calc(100% - 32px))', zIndex: 9 }}><p style={{ margin: 0 }}>{c(stageHelp)}</p><button className="st-btn sm" style={{ marginTop: 10 }} onClick={() => setHelp(false)}>{c(S.close)}</button></div>}

      {ui === 'title' && <TitleScreen hasSave={!!saved && saved.stage !== 'title'} onStart={startNew} onContinue={continueSaved} />}
      {line && <DialoguePanel line={line} onChoose={onChoose} onContinue={onContinue} onPlayVoice={replayVoice} />}
      {ui === 'approval' && <ApprovalPanel onCall={() => W.current?.playPhoneCall(W.current.token)} onDone={() => go('assign')} />}
      {ui === 'enter' && <EnterPanel onGo={() => go('furniture')} />}
      {ui === 'furniture' && (
        <FurniturePanel
          state={st}
          progress={busy ? prog : null}
          manualCount={st.furniture.placedCount || 0}
          onPreview={(on) => W.current?.showGhosts(on)}
          onConfirm={placeFurniture}
          onStepAlaa={stepAlaaManual}
          onManualStep={stepAlaaManual}
          onNext={() => go('assembly')}
        />
      )}
      {ui === 'assembly' && (
        <AssemblyPanel initial={st.asm} onChange={(a) => update((s) => ({ ...s, asm: { ...s.asm, ...a } }))}
          onDone={(a) => { update((s) => ({ ...s, asm: { ...a } })); setTimeout(() => W.current?.sync(stRef.current), 0); go('software'); }} />
      )}
      {ui === 'assemblyDone' && (
        <div className="st-panel"><h2>{c(S.asTitle)}</h2><div className="st-msg ok">{c(S.asDone)}</div>
          <div className="st-row" style={{ marginTop: 10 }}><button className="st-btn" onClick={() => setUi('assembly')}>{c(S.back)}</button><button className="st-btn primary" onClick={() => go('software')}>{c(S.toSoftware)} ›</button></div></div>
      )}
      {ui === 'software' && <SoftwarePanel state={st} onUpdate={(sw) => update((s) => ({ ...s, sw }))} onScreen={(m) => W.current?.drawTeacherScreen(m)} onNext={() => go('deploy')} />}
      {ui === 'deploy' && (
        <DeployPanel
          state={st}
          count={busy ? prog : null}
          onDeploy={deployAll}
          onStepAlaa={stepAlaaManual}
          onManualStep={stepAlaaManual}
          onNext={() => go('rack')}
        />
      )}
      {ui === 'rack' && <RackPanel state={st} onPlace={placeRack} onRemove={removeRack} onNext={() => { update((s) => ({ ...s, rack: { ...s.rack, doorOpen: false } })); go('cabling'); }} />}
      {ui === 'cabling' && <CablingPanel state={st} onLinks={setLinks} onVerified={setNetVerified} onInspect={(id) => W.current?.inspect(id)} onNext={() => { W.current?.inspect(null); go('periph'); }} />}
      {ui === 'periph' && <PeriphPanel state={st} busy={busy} onPlace={placePeriph} onTest={testPeriph} onNext={() => go('verify')} />}
      {ui === 'verify' && <VerifyPanel state={st} onFix={(stage) => go(stage)} onPass={(ok) => update((s) => ({ ...s, final: { ran: true, passed: ok } }))} onNext={() => go('finale')} />}
      {ui === 'credits' && <CreditsScreen state={st} onRestart={restart} onExit={() => nav('/')} />}

      {paused && (
        <div className="st-overlay" role="dialog" aria-modal="true" aria-label={c(S.pause)}>
          <div className="st-menu">
            <h2>{c(S.pause)}</h2>
            <button className="st-btn primary" onClick={() => setPaused(false)}><Icon name="play" size={16} />{c(S.resume)}</button>
            <button className="st-btn" onClick={toggleMute}><Icon name={muted ? 'volumeOff' : 'volume'} size={16} />{c(muted ? S.unmute : S.mute)}</button>
            {stageHelp && <div className="st-msg info">{c(stageHelp)}</div>}
            <h3 style={{ margin: '8px 0 0', fontSize: 14, color: '#cfe2fa' }}>{c(S.chapters)}</h3>
            <div className="st-chapters">
              {STAGES.slice(1).map((s, i) => (<button key={s.id} className={`st-btn sm ${s.id === st.stage ? 'primary' : ''}`} disabled={i + 1 > reachedIdx} onClick={() => go(s.id, { replay: true })}>{i + 1}. {c(s.title)}</button>))}
            </div>
            <button className="st-btn" onClick={restart}><Icon name="reset" size={16} />{c(S.restart)}</button>
            <button className="st-btn ghost" onClick={() => nav('/')}><Icon name="home" size={16} />{c(S.exit)}</button>
          </div>
        </div>
      )}
    </div>
  );
}