// Teacher workstation = a Tiny (1-litre class) PC with integrated graphics, mounted behind the monitor.
// This is a generic small-form-factor layout used for teaching; it is not the exact spec sheet of any unit.
import { makeRules } from '../lab/assemblyRules.js';

const O = (en, ar) => ({ en, ar });

/** 3D drop targets inside the open chassis / on the desk. Each slot accepts exactly one part. */
export const SLOTS = {
  chassis: { name: O('Chassis top cover', 'الغطاء العلوي للهيكل'), holds: O('the removable top cover', 'الغطاء العلوي القابل للفك') },
  socket: { name: O('CPU socket (LGA)', 'مقبس المعالج (LGA)'), holds: O('the processor only', 'المعالج فقط') },
  cpuTop: { name: O('Top of the installed CPU', 'سطح المعالج المركّب'), holds: O('the heatsink-fan with thermal paste', 'المشتت والمروحة مع المعجون الحراري') },
  sodimm: { name: O('SO-DIMM memory slots', 'فتحات الذاكرة SO-DIMM'), holds: O('laptop-size RAM modules', 'وحدات ذاكرة بحجم اللابتوب') },
  m2slot: { name: O('M.2 slot (2280)', 'فتحة M.2 (2280)'), holds: O('an M.2 NVMe SSD', 'قرص M.2 NVMe SSD') },
  vesa: { name: O('VESA bracket behind the monitor', 'حامل VESA خلف الشاشة'), holds: O('the closed Tiny PC', 'جهاز Tiny بعد إغلاقه') },
  rearDp: { name: O('Rear DisplayPort / HDMI', 'منفذ DisplayPort / HDMI الخلفي'), holds: O('the video cable to the monitor', 'كابل الصورة إلى الشاشة') },
  rearUsb: { name: O('Rear USB ports', 'منافذ USB الخلفية'), holds: O('keyboard and mouse', 'الكيبورد والماوس') },
  rearLan: { name: O('Rear Ethernet (RJ45)', 'منفذ الإيثرنت (RJ45) الخلفي'), holds: O('the network patch cable', 'كابل الشبكة') },
  dcIn: { name: O('DC power input', 'مدخل الطاقة DC'), holds: O('the external power adapter plug', 'فيشة محوّل الطاقة الخارجي') },
};

const S = (id, slot, requires, title, how, why, safety, ok, extra = {}) => ({ id, slot, requires, title, how, why, safety, ok, ...extra });

export const TINY_STEPS = [
  S('coverOff', 'chassis', [], O('Open the chassis', 'فتح الهيكل'),
    O('With the PC unplugged, remove the rear screw and slide the top cover towards the back.', 'والجهاز مفصول عن الكهرباء، فك المسمار الخلفي واسحب الغطاء العلوي للخلف.'),
    O('Every internal part is reached from the top in a Tiny PC; the board is already fixed in the chassis.', 'كل القطع الداخلية في جهاز Tiny تُركّب من الأعلى، واللوحة الأم مثبتة مسبقاً في الهيكل.'),
    O('Touch bare metal first to discharge static (ESD).', 'المس معدناً عارياً أولاً لتفريغ الكهرباء الساكنة (ESD).'),
    O('Cover removed. The motherboard, socket and slots are now accessible.', 'تم فك الغطاء. اللوحة الأم والمقبس والفتحات صارت ظاهرة.'), { part: O('Screwdriver / top cover', 'مفك / الغطاء العلوي') }),
  S('cpu', 'socket', ['coverOff'], O('Install the CPU', 'تركيب المعالج'),
    O('Open the socket lever, align the triangle on the CPU with the socket mark, lower it straight down and close the lever.', 'افتح ذراع المقبس، طابق المثلث على المعالج مع علامة المقبس، أنزله عمودياً وأغلق الذراع.'),
    O('The CPU runs the instructions. In this machine it also contains the graphics (iGPU), so no separate graphics card is needed.', 'المعالج ينفذ التعليمات، وفي هذا الجهاز يحتوي أيضاً على كرت الشاشة المدمج (iGPU)، فلا حاجة لكرت منفصل.'),
    O('Hold it by the edges; never touch the contacts or the socket pins.', 'امسكه من الحواف، ولا تلمس الأطراف ولا دبابيس المقبس.'),
    O('Excellent! The CPU is seated in the socket. The cooler can now go on top.', 'ممتاز! المعالج مركّب في المقبس. الآن يمكن تركيب المبرّد فوقه.'), { part: O('CPU (with integrated graphics)', 'المعالج (بكرت شاشة مدمج)') }),
  S('cooler', 'cpuTop', ['cpu'], O('Fit the heatsink-fan', 'تركيب المشتت والمروحة'),
    O('Apply a small dot of thermal paste, place the blower heatsink on the CPU and tighten its screws diagonally. Plug the fan into the fan header.', 'ضع نقطة صغيرة من المعجون الحراري، ضع المشتت فوق المعالج وأحكم البراغي بشكل قطري، ووصّل المروحة بمنفذها.'),
    O('A small case has little airflow, so the blower pushes heat straight out of the rear vents.', 'الهيكل الصغير فيه تدفق هواء قليل، لذلك المروحة تدفع الحرارة مباشرة لفتحات التهوية الخلفية.'),
    O('Too much paste can spill onto the socket.', 'كثرة المعجون قد تسيل على المقبس.'),
    O('Cooling installed. The CPU will stay within safe temperatures.', 'تم تركيب التبريد. سيبقى المعالج ضمن الحرارة الآمنة.'), { part: O('Heatsink-fan + thermal paste', 'المشتت والمروحة + المعجون') }),
  S('ram', 'sodimm', ['coverOff'], O('Install RAM (2 × SO-DIMM)', 'تركيب الذاكرة (وحدتان SO-DIMM)'),
    O('Insert each module at about 30°, notch aligned, then press down until the side clips lock.', 'أدخل كل وحدة بزاوية 30° تقريباً مع مطابقة الشق، ثم اضغط للأسفل حتى تقفل المشابك الجانبية.'),
    O('Small PCs use SO-DIMM (laptop-size) memory, not desktop DIMMs. Two matched modules run in dual-channel, which also speeds up the integrated graphics.', 'الأجهزة الصغيرة تستخدم ذاكرة SO-DIMM بحجم اللابتوب وليس DIMM المكتبية. وحدتان متطابقتان تعملان بقناة مزدوجة، وهذا يسرّع كرت الشاشة المدمج أيضاً.'),
    O('Never force a module that does not line up with the notch.', 'لا تُجبر وحدة لا تطابق الشق.'),
    O('Memory installed in dual-channel.', 'تم تركيب الذاكرة بقناة مزدوجة.'), { part: O('RAM 2 × SO-DIMM', 'ذاكرة 2 × SO-DIMM') }),
  S('m2', 'm2slot', ['coverOff'], O('Install the M.2 SSD', 'تركيب قرص M.2 SSD'),
    O('Insert the SSD into the M.2 slot at an angle, press it flat and secure it with the small screw.', 'أدخل القرص بزاوية في فتحة M.2، اضغطه ليستوي ثم ثبّته بالمسمار الصغير.'),
    O('The SSD stores Windows, the applications and files permanently.', 'القرص يخزن ويندوز والبرامج والملفات بشكل دائم.'),
    O('Do not over-tighten the tiny screw.', 'لا تشد المسمار الصغير زيادة.'),
    O('Storage installed — there is now a boot device.', 'تم تركيب التخزين — صار في وسيط إقلاع.'), { part: O('M.2 NVMe SSD', 'قرص M.2 NVMe') }),
  S('coverOn', 'chassis', ['cpu', 'cooler', 'ram', 'm2'], O('Close the chassis', 'إغلاق الهيكل'),
    O('Slide the top cover forward until it clicks and refit the rear screw.', 'اسحب الغطاء للأمام حتى يثبت وأرجع المسمار الخلفي.'),
    O('The cover directs airflow through the heatsink and protects the parts.', 'الغطاء يوجّه الهواء عبر المشتت ويحمي القطع.'),
    O('Check that no cable or screw is left loose inside.', 'تأكد ما في كابل أو مسمار سايب جوّا.'),
    O('Chassis closed.', 'تم إغلاق الهيكل.'), { part: O('Top cover', 'الغطاء العلوي'), reuseOf: 'coverOff' }),
  S('vesa', 'vesa', ['coverOn'], O('Mount behind the monitor (VESA)', 'التثبيت خلف الشاشة (VESA)'),
    O('Fix the VESA bracket to the back of the monitor and slide the Tiny PC into it, ports facing down.', 'ثبّت حامل VESA خلف الشاشة وأدخل جهاز Tiny فيه، والمنافذ للأسفل.'),
    O('This keeps the desk clear, exactly like the workstations in the lab.', 'هيك بتضل الطاولة فاضية، تماماً مثل أجهزة المختبر.'),
    O('Leave space around the vents for airflow.', 'اترك مسافة حول فتحات التهوية.'),
    O('Mounted behind the monitor.', 'تم التثبيت خلف الشاشة.'), { part: O('Tiny PC (closed)', 'جهاز Tiny (مغلق)') }),
  S('display', 'rearDp', ['vesa'], O('Connect the monitor cable', 'توصيل كابل الشاشة'),
    O('Connect a DisplayPort (or HDMI) cable from the rear of the Tiny PC to the monitor.', 'وصّل كابل DisplayPort (أو HDMI) من خلف جهاز Tiny إلى الشاشة.'),
    O('With integrated graphics the picture comes out of the motherboard’s own video ports.', 'مع كرت الشاشة المدمج، الصورة تطلع من منافذ الفيديو الخاصة باللوحة الأم.'),
    O('Push the connector straight; don’t bend it.', 'أدخل الموصل باستقامة ولا تثنيه.'),
    O('Display connected to the integrated graphics output.', 'تم توصيل الشاشة بمخرج كرت الشاشة المدمج.'), { part: O('DisplayPort cable', 'كابل DisplayPort') }),
  S('usb', 'rearUsb', ['vesa'], O('Connect keyboard and mouse', 'توصيل الكيبورد والماوس'),
    O('Plug the keyboard and mouse into the USB ports.', 'وصّل الكيبورد والماوس بمنافذ USB.'),
    O('Input devices let the user control the computer.', 'أجهزة الإدخال تتيح للمستخدم التحكم بالجهاز.'),
    O('—', '—'),
    O('Keyboard and mouse connected.', 'تم توصيل الكيبورد والماوس.'), { part: O('Keyboard + mouse (USB)', 'كيبورد + ماوس (USB)') }),
  S('lan', 'rearLan', ['vesa'], O('Connect the Ethernet cable', 'توصيل كابل الإيثرنت'),
    O('Plug a patch cable from the RJ45 port to the network outlet under the desk.', 'وصّل كابل شبكة من منفذ RJ45 إلى مخرج الشبكة تحت الطاولة.'),
    O('A wired connection is needed for the lab network, the printer and exam software.', 'الاتصال السلكي مطلوب لشبكة المختبر والطابعة وبرامج الامتحانات.'),
    O('Listen for the click of the RJ45 latch.', 'انتبه لصوت نقرة مشبك RJ45.'),
    O('Network cable connected. The outlet will be wired to the cabinet later.', 'تم توصيل كابل الشبكة. سيتم ربط المخرج بالكبينة لاحقاً.'), { part: O('Ethernet patch cable', 'كابل شبكة') }),
  S('power', 'dcIn', ['vesa', 'display', 'usb'], O('Connect the power adapter', 'توصيل محوّل الطاقة'),
    O('Connect the external power adapter to the DC input, then to the protected power strip.', 'وصّل محوّل الطاقة الخارجي بمدخل DC، ثم بمشترك الكهرباء المحمي.'),
    O('Tiny PCs have no internal PSU: the external adapter converts mains AC to DC. Power is connected last.', 'أجهزة Tiny ما فيها مزود طاقة داخلي؛ المحوّل الخارجي يحوّل التيار المتردد إلى مستمر. والكهرباء آخر شي بتنوصل.'),
    O('Use the adapter rated for this model only.', 'استخدم المحوّل المخصص لهذا الموديل فقط.'),
    O('Power connected. Ready for the first power-on test.', 'تم توصيل الطاقة. جاهز لأول اختبار تشغيل.'), { part: O('External power adapter', 'محوّل الطاقة الخارجي') }),
];

export const TINY = makeRules(TINY_STEPS);
export const TINY_STEP = TINY.STEP;

/** dropping part `id` on `slotId`: validates the place AND the order, with a specific explanation */
export function tryPlace(id, slotId, installed) {
  const s = TINY_STEP[id];
  if (!s) return { ok: false, reason: O('Unknown part.', 'قطعة غير معروفة.') };
  if (slotId && slotId !== s.slot) {
    const wrong = SLOTS[slotId]; const right = SLOTS[s.slot];
    return {
      ok: false, kind: 'place', wrongSlot: slotId,
      reason: O(`That is the ${wrong.name.en}, which holds ${wrong.holds.en}. ${s.part.en} goes in the ${right.name.en}.`,
        `هذا ${wrong.name.ar}، وهو مخصص لـ ${wrong.holds.ar}. أما ${s.part.ar} فمكانه ${right.name.ar}.`),
    };
  }
  const r = TINY.canInstall(id, installed);
  if (!r.ok) return { ...r, kind: 'order' };
  return { ok: true, msg: s.ok };
}

/** simulated POST for the Tiny PC */
export function tinyPost(installed) {
  const has = (i) => installed.has(i);
  const L = []; const chk = (ok, good, bad) => L.push({ ok, msg: ok ? good : bad });
  chk(has('power'), O('Power adapter connected — power LED on', 'محوّل الطاقة موصول — ضوء التشغيل يعمل'), O('No power: connect the external adapter to the DC input.', 'لا توجد طاقة: وصّل المحوّل الخارجي بمدخل DC.'));
  chk(has('cpu'), O('CPU detected', 'تم اكتشاف المعالج'), O('No CPU — the board cannot start.', 'لا يوجد معالج — اللوحة لا تعمل.'));
  chk(has('cooler'), O('CPU fan detected, temperature normal', 'تم اكتشاف مروحة المعالج، الحرارة طبيعية'), O('CPU fan error — the system halts to protect the CPU.', 'خطأ مروحة المعالج — النظام يتوقف لحماية المعالج.'));
  chk(has('ram'), O('Memory test passed (dual-channel)', 'اختبار الذاكرة ناجح (قناة مزدوجة)'), O('No memory detected — beep code, no picture.', 'لم تُكتشف ذاكرة — صافرات خطأ ولا صورة.'));
  chk(has('cpu') && has('display'), O('Integrated graphics: picture on the monitor', 'كرت الشاشة المدمج: الصورة ظاهرة على الشاشة'), O(has('cpu') ? 'Black screen: connect the DisplayPort cable to the monitor.' : 'No graphics without a CPU (the GPU is inside it).', has('cpu') ? 'شاشة سوداء: وصّل كابل DisplayPort بالشاشة.' : 'لا صورة بدون معالج (كرت الشاشة داخله).'));
  chk(has('usb'), O('Keyboard and mouse detected', 'تم اكتشاف الكيبورد والماوس'), O('Keyboard not detected.', 'لم يتم اكتشاف الكيبورد.'));
  chk(has('m2'), O('Boot device found (M.2 NVMe)', 'تم العثور على وسيط إقلاع (M.2 NVMe)'), O('No boot device: install the SSD.', 'لا يوجد وسيط إقلاع: ركّب القرص.'));
  const warn = has('lan') ? null : O('Note: no network cable yet — fine for POST, required later.', 'ملاحظة: لا يوجد كابل شبكة بعد — لا يؤثر على الإقلاع لكنه مطلوب لاحقاً.');
  return { ok: L.every((l) => l.ok), lines: L, warn };
}
