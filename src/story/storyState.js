// Story progression, save/load and the final verification. Pure functions + localStorage helpers.
import { computeStations, STUDENT_COUNT, DESK_RUNS } from './config/labLayout.js';
import { NET_DEVICES, makePlan, tracePath, RACK_UNITS, INTERCHANGEABLE, UPLINK_PORT } from './config/network.js';
import { TINY_STEPS } from './tinyAssembly.js';
import { SOFTWARE_STEPS } from './config/software.js';

const O = (en, ar) => ({ en, ar });

export const STAGES = [
  { id: 'title', title: O('Start', 'البداية') },
  { id: 'request', title: O('The request', 'الطلب'), dialogue: 'request' },
  { id: 'approval', title: O('Approval', 'الموافقة') },
  { id: 'assign', title: O('The assignment', 'التكليف'), dialogue: 'assign' },
  { id: 'enter', title: O('The empty classroom', 'الصف الفاضي') },
  { id: 'furniture', title: O('Arrange 25 workstations', 'ترتيب 25 طاولة') },
  { id: 'assembly', title: O('Build the teacher PC', 'تجميع جهاز المعلم') },
  { id: 'software', title: O('Install the software', 'تنصيب البرامج') },
  { id: 'deploy', title: O('Deploy student PCs', 'توزيع أجهزة الطلاب') },
  { id: 'rack', title: O('Network cabinet', 'كبينة الشبكة') },
  { id: 'cabling', title: O('Structured cabling', 'التمديدات المنظمة') },
  { id: 'periph', title: O('Printer, UPS, display', 'الطابعة و UPS والشاشة') },
  { id: 'verify', title: O('Final inspection', 'الفحص النهائي') },
  { id: 'finale', title: O('Handover', 'التسليم'), dialogue: 'finale' },
  { id: 'credits', title: O('The end', 'النهاية') },
];
export const STAGE_IDS = STAGES.map((s) => s.id);
export const stageIndex = (id) => STAGE_IDS.indexOf(id);

export const STATIONS = computeStations(DESK_RUNS);
export const DEVICES = NET_DEVICES(STATIONS);
export const PLAN = makePlan(DEVICES);

export function newState() {
  return {
    v: 2,
    stage: 'title',
    reached: 'title',
    dialogues: {},
    furniture: { confirmed: false, placed: false },
    asm: { installed: [], mistakes: 0, postOk: false },
    sw: { done: [], verified: false, imaged: false },
    deploy: { deployed: [] },
    rack: { placed: {}, doorOpen: true },
    links: [], // {a, b, state: 'pending'|'ok'|'bad', reason?}
    netVerified: false,
    periph: { printer: { placed: false, ok: false }, ups: { placed: false, ok: false }, display: { placed: false, ok: false } },
    final: { ran: false, passed: false },
  };
}

const KEY = 'u1.story.v2';
export function loadState() {
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && s.v === 2 && STAGE_IDS.includes(s.stage)) return { ...newState(), ...s }; } catch { /* ignore */ }
  return null;
}
export function saveState(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ } }
export function clearState() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } }

export function goStage(s, id) {
  const reached = stageIndex(id) > stageIndex(s.reached) ? id : s.reached;
  return { ...s, stage: id, reached };
}

/** rack: a component may sit in a unit when ids match (identical cable managers are interchangeable) */
export function rackFits(unit, partId) {
  const want = RACK_UNITS.find((r) => r.u === unit)?.accepts;
  if (!want) return false;
  return want === partId || Boolean(INTERCHANGEABLE[want] && INTERCHANGEABLE[want] === INTERCHANGEABLE[partId]);
}
export const rackComplete = (placed) => RACK_UNITS.every((r) => placed[r.u] && rackFits(r.u, placed[r.u]));

export function uplinkOk(links) { return links.some((l) => [l.a, l.b].includes('up') && [l.a, l.b].includes(`sw:${UPLINK_PORT}`)); }
export function networkReport(links) {
  const per = DEVICES.map((d) => ({ id: d.id, ...tracePath(d.id, links, PLAN) }));
  return { per, ok: per.every((p) => p.ok) && uplinkOk(links), uplink: uplinkOk(links) };
}

/** the final checklist, computed from the real state — not from what is visible */
export function finalChecklist(s) {
  const stations = STATIONS.length;
  const net = networkReport(s.links);
  const sw = new Set(s.sw.done);
  const asm = new Set(s.asm.installed);
  const items = [
    { id: 'stations', stage: 'furniture', ok: s.furniture.placed && stations === STUDENT_COUNT,
      text: O(`${stations} student workstations placed (required ${STUDENT_COUNT})`, `تم وضع ${stations} طاولة طالب (المطلوب ${STUDENT_COUNT})`) },
    { id: 'teacherHw', stage: 'assembly', ok: TINY_STEPS.every((st) => st.id === 'coverOff' || asm.has(st.id)),
      text: O('Teacher workstation fully assembled and mounted', 'جهاز المعلم مجمّع بالكامل ومثبّت') },
    { id: 'post', stage: 'assembly', ok: !!s.asm.postOk, text: O('Teacher PC passed the power-on self test (POST)', 'جهاز المعلم اجتاز اختبار التشغيل الذاتي (POST)') },
    { id: 'software', stage: 'software', ok: SOFTWARE_STEPS.every((x) => sw.has(x.id)) && s.sw.verified,
      text: O('Operating system and software installed and verified', 'نظام التشغيل والبرامج منصّبة ومتحقق منها') },
    { id: 'deploy', stage: 'deploy', ok: new Set(s.deploy.deployed).size === stations && stations === STUDENT_COUNT,
      text: O(`${new Set(s.deploy.deployed).size} of ${STUDENT_COUNT} student PCs deployed`, `تم توزيع ${new Set(s.deploy.deployed).size} من ${STUDENT_COUNT} جهاز طالب`) },
    { id: 'rack', stage: 'rack', ok: rackComplete(s.rack.placed), text: O('Network cabinet components in the correct units', 'مكونات الكبينة في أماكنها الصحيحة') },
    { id: 'network', stage: 'cabling', ok: net.ok && s.netVerified,
      text: O(`Network: ${net.per.filter((p) => p.ok).length}/${net.per.length} devices with a correct path${net.uplink ? '' : ', uplink missing'}`, `الشبكة: ${net.per.filter((p) => p.ok).length}/${net.per.length} جهاز بمسار صحيح${net.uplink ? '' : '، ورابط شبكة المدرسة ناقص'}`) },
    { id: 'printer', stage: 'periph', ok: s.periph.printer.placed && s.periph.printer.ok, text: O('Printer installed and test page printed', 'الطابعة مركّبة وتمت طباعة صفحة تجربة') },
    { id: 'ups', stage: 'periph', ok: s.periph.ups.placed && s.periph.ups.ok, text: O('UPS behind the door, self-test passed', 'الـ UPS خلف الباب واجتاز الفحص الذاتي') },
    { id: 'display', stage: 'periph', ok: s.periph.display.placed && s.periph.display.ok, text: O('Interactive display installed and receiving a signal', 'الشاشة التفاعلية مركّبة وتستقبل الإشارة') },
  ];
  return { items, ok: items.every((i) => i.ok) };
}
