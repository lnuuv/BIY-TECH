// Network design for the lab. Teaching layout, configurable. The real cabinet's interior was not
// visible in the reference photo, so this is NOT a record of the physical cabinet's contents.
const O = (en, ar) => ({ en, ar });

/** rack units, U1 = top. `accepts` is the component id that belongs in that unit. */
export const RACK_UNITS = [
  { u: 1, accepts: 'ppA' },
  { u: 2, accepts: 'cmA' },
  { u: 3, accepts: 'ppB' },
  { u: 4, accepts: 'switch' },
  { u: 5, accepts: 'cmB' },
  { u: 6, accepts: 'pdu' },
];

export const RACK_PARTS = {
  ppA: { kind: 'patch', name: O('Patch panel A (ports 1–24)', 'لوحة التوصيل A (منافذ 1–24)'), purpose: O('Terminates the permanent cables from the wall outlets. Ports are numbered to match the outlet labels.', 'تنتهي عندها الكوابل الثابتة القادمة من مخارج الجدار. المنافذ مرقّمة لتطابق أرقام المخارج.') },
  ppB: { kind: 'patch', name: O('Patch panel B (ports 25–48)', 'لوحة التوصيل B (منافذ 25–48)'), purpose: O('The second panel for outlets 25 onwards — this lab needs 28 ports.', 'اللوحة الثانية للمخارج من 25 فما فوق — هذا المختبر يحتاج 28 منفذاً.') },
  switch: { kind: 'switch', name: O('48-port gigabit switch', 'سويتش جيجابت 48 منفذ'), purpose: O('Forwards traffic between all lab devices and up to the school network. Placed between the two patch panels so the patch leads stay short.', 'يوجّه البيانات بين أجهزة المختبر وإلى شبكة المدرسة. يوضع بين لوحتي التوصيل لتبقى كوابل التوصيل قصيرة.') },
  cmA: { kind: 'cm', name: O('Cable manager', 'منظّم كوابل'), purpose: O('Guides patch leads from panel A to the switch, keeping them tidy and labelled.', 'يوجّه كوابل التوصيل من اللوحة A إلى السويتش ويبقيها مرتبة ومرقّمة.') },
  cmB: { kind: 'cm', name: O('Cable manager', 'منظّم كوابل'), purpose: O('Separates the data cables from the power section below.', 'يفصل كوابل البيانات عن قسم الكهرباء في الأسفل.') },
  pdu: { kind: 'pdu', name: O('Rack power strip (PDU)', 'مشترك كهرباء للكبينة (PDU)'), purpose: O('Powers the switch. It is fed from the UPS so the network survives short power cuts. Heaviest/power items go at the bottom, away from data cables.', 'يغذّي السويتش بالكهرباء، ويتغذى من الـ UPS لتبقى الشبكة شغالة عند الانقطاع القصير. قطع الكهرباء تكون بالأسفل بعيداً عن كوابل البيانات.') },
};
// cmA and cmB are interchangeable (identical parts)
export const INTERCHANGEABLE = { cmA: 'cm', cmB: 'cm' };

/** devices on the network, in patch-port order */
export const NET_DEVICES = (stations) => [
  { id: 'T', kind: 'teacher', name: O('Teacher PC', 'جهاز المعلم') },
  ...stations.map((s) => ({ id: s.id, kind: 'student', name: O(`Student PC ${s.id}`, `جهاز طالب ${s.id}`) })),
  { id: 'PRN', kind: 'printer', name: O('Network printer', 'طابعة الشبكة') },
  { id: 'DSP', kind: 'display', name: O('Interactive display', 'الشاشة التفاعلية') },
];

/** the cabling plan: device → port number (outlet label = port number) */
export function makePlan(devices) {
  const plan = {}; devices.forEach((d, i) => { plan[d.id] = i + 1; }); return plan;
}
export const UPLINK_PORT = 48;
export const label = (n) => (n <= 24 ? `A-${String(n).padStart(2, '0')}` : `B-${String(n - 24).padStart(2, '0')}`);

/** link endpoints: dev:X, out:X (outlet at device X's desk), pp:N, sw:N, up */
export function linkKind(a, b) {
  const t = (x) => x.split(':')[0];
  const k = [t(a), t(b)].sort().join('-');
  return { 'dev-out': 'drop', 'out-pp': 'perm', 'pp-sw': 'patch', 'sw-up': 'uplink' }[k] || null;
}

/** is a link correct according to the plan? returns {ok, kind, reason} */
export function checkLink(a, b, plan) {
  const kind = linkKind(a, b);
  const v = (x) => x.split(':')[1];
  const pick = (p) => [a, b].find((x) => x.startsWith(p + ':'));
  if (!kind) return { ok: false, kind: null, reason: O('These two points cannot be linked directly. The path is: device → wall outlet → patch panel → switch.', 'لا يمكن ربط هاتين النقطتين مباشرة. المسار هو: الجهاز ← مخرج الجدار ← لوحة التوصيل ← السويتش.') };
  if (kind === 'drop') {
    const ok = v(pick('dev')) === v(pick('out'));
    return { ok, kind, reason: ok ? null : O(`The device at ${v(pick('dev'))} must use the outlet at its own desk, not ${v(pick('out'))}.`, `الجهاز ${v(pick('dev'))} لازم يوصل بمخرج طاولته، مش مخرج ${v(pick('out'))}.`) };
  }
  if (kind === 'perm') {
    const dev = v(pick('out')); const port = +v(pick('pp')); const want = plan[dev];
    const ok = port === want;
    return { ok, kind, reason: ok ? null : O(`Outlet ${dev} is labelled ${label(want)}, but its cable lands on ${label(port)}. Labels and terminations must match.`, `مخرج ${dev} مرقّم ${label(want)} لكن الكابل منتهي على ${label(port)}. لازم الترقيم يطابق التوصيل.`) };
  }
  if (kind === 'patch') {
    const pp = +v(pick('pp')); const sw = +v(pick('sw'));
    const ok = pp === sw && sw !== UPLINK_PORT;
    return { ok, kind, reason: ok ? null : O(sw === UPLINK_PORT ? `Switch port ${UPLINK_PORT} is reserved for the uplink to the school network.` : `Lab convention: patch-panel port ${label(pp)} goes to switch port ${pp}, so documentation stays simple.`, sw === UPLINK_PORT ? `منفذ السويتش ${UPLINK_PORT} محجوز للربط مع شبكة المدرسة.` : `اتفاقية المختبر: منفذ اللوحة ${label(pp)} يوصل بمنفذ السويتش ${pp} لتبقى التوثيقات بسيطة.`) };
  }
  // uplink
  const ok = +v(pick('sw')) === UPLINK_PORT;
  return { ok, kind, reason: ok ? null : O(`Use switch port ${UPLINK_PORT} for the uplink.`, `استخدم منفذ السويتش ${UPLINK_PORT} للربط مع شبكة المدرسة.`) };
}

/** full path check for one device; links: [{a,b}] */
export function tracePath(devId, links, plan) {
  const has = (x, y) => links.find((l) => (l.a === x && l.b === y) || (l.a === y && l.b === x));
  const fromNode = (n, prefix) => links.filter((l) => l.a === n || l.b === n).map((l) => (l.a === n ? l.b : l.a)).filter((x) => x.startsWith(prefix + ':'));
  const steps = [];
  const drop = has(`dev:${devId}`, `out:${devId}`);
  steps.push({ seg: 'drop', ok: !!drop, from: `dev:${devId}`, to: `out:${devId}` });
  const pps = fromNode(`out:${devId}`, 'pp');
  const ppOk = pps.length === 1 && +pps[0].split(':')[1] === plan[devId];
  steps.push({ seg: 'perm', ok: ppOk, from: `out:${devId}`, to: pps[0] || null, found: pps });
  const sws = pps[0] ? fromNode(pps[0], 'sw') : [];
  const swOk = ppOk && sws.length === 1 && sws[0] === `sw:${plan[devId]}`;
  steps.push({ seg: 'patch', ok: swOk, from: pps[0] || null, to: sws[0] || null });
  return { ok: steps.every((s) => s.ok), steps };
}

/** "contractor" bulk run of the permanent links, with a realistic labelling fault (two outlets swapped) */
export function contractorPermanentLinks(devices, plan, swap = ['S14', 'S15']) {
  return devices.filter((d) => d.kind === 'student').map((d) => {
    let port = plan[d.id];
    if (d.id === swap[0]) port = plan[swap[1]]; else if (d.id === swap[1]) port = plan[swap[0]];
    return { a: `out:${d.id}`, b: `pp:${port}` };
  });
}
