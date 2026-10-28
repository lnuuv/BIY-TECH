// PC assembly rules, shared by the UI and tests. Order constraints are real dependencies, not decoration.
import { makeRules } from './assemblyRules.js';
const S = (id, phase, requires, title, how, why, safety, undo, undoHow, ask) => ({ id, phase, requires, title, how, why, safety, undo, undoHow, ask });
const O = (en, ar) => ({ en, ar });

export const STEPS = [
  S('cpu', 'bench', [], O('Install the CPU', 'تركيب المعالج (CPU)'),
    O('Lift the socket lever, align the gold triangle on the CPU with the triangle on the socket, lower the CPU straight down (no force) and close the lever.', 'ارفع ذراع المقبس، طابق المثلث الذهبي على المعالج مع مثلث المقبس، أنزل المعالج عمودياً (بدون قوة) ثم أغلق الذراع.'),
    O('The CPU runs every instruction. The socket pins/contacts are delicate, so a wrong angle bends them.', 'المعالج ينفذ كل التعليمات. وأطراف المقبس حساسة وأي زاوية خاطئة تثنيها.'),
    O('Touch only the edges and use an anti-static wrist strap or touch bare metal first (ESD).', 'امسك الحواف فقط واستخدم سوار مضاد للكهرباء الساكنة أو المس معدناً عارياً أولاً (ESD).'),
    O('Remove the CPU', 'فك المعالج'), O('Remove the cooler first, lift the lever, then lift the CPU straight up.', 'فك المبرّد أولاً، ارفع الذراع ثم ارفع المعالج عمودياً.'),
    { q: O('Why do you align the triangle markers?', 'لماذا نطابق علامات المثلث؟'), options: [O('So the CPU fits one way without bending pins', 'لكي يركب المعالج باتجاه واحد دون ثني الأطراف'), O('So the CPU clock speed doubles automatically', 'لكي تتضاعف سرعة المعالج تلقائياً عند التشغيل')], ans: 0, exp: O('The notches/triangle make the CPU “keyed”.', 'العلامات تجعل المعالج "مفتاحي الشكل".') }),
  S('ram', 'bench', ['cpu'], O('Install the RAM (2 modules)', 'تركيب الذاكرة RAM (وحدتان)'),
    O('Open the slot clips, match the notch, and press each module down until both clips click. Use slots 2 and 4 for dual-channel.', 'افتح مشابك الفتحة، طابق الشق، واضغط كل وحدة حتى يُسمع نقر المشبكين. استخدم الفتحتين 2 و4 للقناة المزدوجة.'),
    O('RAM holds the programs and data in use. Two matched modules in the right slots work faster (dual-channel).', 'الذاكرة تحمل البرامج والبيانات قيد الاستخدام. وحدتان متطابقتان في الفتحات الصحيحة أسرع (قناة مزدوجة).'),
    O('Press evenly on both ends; do not force a module that will not go in.', 'اضغط بالتساوي على الطرفين ولا تُجبر وحدة لا تدخل.'),
    O('Remove the RAM', 'فك الذاكرة'), O('Push the clips outward — the modules pop up.', 'ادفع المشابك للخارج فترتفع الوحدات.'),
    { q: O('RAM is…', 'الذاكرة RAM هي…'), options: [O('Permanent: keeps files when power is off', 'دائمة: تحتفظ بالملفات عند فصل الطاقة'), O('Volatile: contents vanish without power', 'متطايرة: تضيع محتوياتها بدون طاقة')], ans: 1, exp: O('Permanent storage is the SSD/HDD.', 'التخزين الدائم هو SSD/HDD.') }),
  S('m2', 'bench', ['cpu'], O('Install the M.2 SSD', 'تركيب قرص M.2 SSD'),
    O('Insert the SSD into the M.2 slot at about 30°, press it flat and secure it with the small screw.', 'أدخل القرص في فتحة M.2 بزاوية نحو 30°، اضغطه ليستوي ثم ثبّته بالمسمار الصغير.'),
    O('The SSD stores the operating system and your files permanently, with no moving parts.', 'القرص SSD يخزن نظام التشغيل والملفات بشكل دائم وبدون أجزاء متحركة.'),
    O('Do not over-tighten the tiny screw.', 'لا تُفرط في شد المسمار الصغير.'),
    O('Remove the M.2 SSD', 'فك قرص M.2'), O('Remove the screw — the SSD springs up — then slide it out.', 'فك المسمار فيرتفع القرص ثم اسحبه للخارج.'),
    { q: O('Which stores the operating system permanently?', 'أيهما يخزن نظام التشغيل بشكل دائم؟'), options: [O('M.2 NVMe SSD', 'قرص M.2 SSD'), O('DDR4 DIMM RAM', 'ذاكرة DDR4 RAM')], ans: 0, exp: O('Storage keeps data when the PC is off.', 'التخزين يحفظ البيانات عند إطفاء الجهاز.') }),
  S('cooler', 'bench', ['cpu', 'ram', 'm2'], O('Mount the CPU cooler', 'تركيب مبرّد المعالج'),
    O('Add a pea-sized dot of thermal paste, set the cooler on the CPU and tighten the screws in a cross pattern.', 'ضع نقطة معجون حراري بحجم حبة البازلاء، ضع المبرّد على المعالج وأحكم البراغي بنمط متقاطع.'),
    O('The CPU creates heat. Paste fills microscopic gaps so heat flows into the heatsink; the fan removes it. We fit it last so it does not block the RAM and M.2 screw.', 'المعالج يولد حرارة. المعجون يملأ الفجوات الدقيقة لتنتقل الحرارة للمشتت وتزيلها المروحة. نركّبه أخيراً كي لا يعيق الذاكرة ومسمار M.2.'),
    O('Peel the plastic film from the cooler base. Connect the fan to the CPU_FAN header.', 'انزع الغلاف البلاستيكي عن قاعدة المبرّد. وصّل المروحة بمنفذ CPU_FAN.'),
    O('Remove the cooler', 'فك المبرّد'), O('Loosen screws diagonally, twist gently and lift. Clean old paste.', 'أرخِ البراغي قطرياً، لفّ بلطف ثم ارفع. نظّف المعجون القديم.'),
    { q: O('What is thermal paste for?', 'ما فائدة المعجون الحراري؟'), options: [O('Gluing the processor permanently into the socket', 'لصق المعالج بشكل دائم داخل مقبس اللوحة الأم'), O('Improving heat transfer from CPU to heatsink', 'تحسين انتقال الحرارة من المعالج إلى المبرّد')], ans: 1, exp: O('It replaces tiny air gaps (bad conductors) with a better conductor.', 'يستبدل الفجوات الهوائية (موصل سيئ) بموصل أفضل.') }),
  S('board', 'case', ['cpu', 'ram', 'm2', 'cooler'], O('Mount the motherboard in the case', 'تثبيت اللوحة الأم في الصندوق'),
    O('Fit the I/O shield in the rear opening, lower the board onto the brass standoffs and fasten the screws.', 'ركّب درع I/O في الفتحة الخلفية، أنزل اللوحة على الركائز النحاسية وثبّتها بالمسامير.'),
    O('Standoffs lift the board off the metal so nothing short-circuits.', 'الركائز ترفع اللوحة عن المعدن فلا يحدث قصر كهربائي.'),
    O('Check there are no spare standoffs under the board where there is no hole.', 'تأكد ألا توجد ركائز زائدة تحت اللوحة حيث لا ثقوب.'),
    O('Unscrew the motherboard', 'فك اللوحة الأم'), O('Remove all screws and lift the board out with the I/O shield.', 'فك كل المسامير وارفع اللوحة مع درع I/O.'),
    { q: O('Why use standoffs?', 'لماذا نستخدم الركائز؟'), options: [O('Keep the board off the metal tray to avoid shorts', 'إبقاء اللوحة بعيدة عن المعدن لتفادي القصر'), O('Ground the processor heatsink to the side panel', 'تأريض مشتت حرارة المعالج باللوحة الجانبية')], ans: 0, exp: O('A short circuit can destroy components.', 'القصر الكهربائي قد يتلف القطع.') }),
  S('psu', 'case', ['board'], O('Install the power supply (PSU)', 'تركيب مصدر الطاقة (PSU)'),
    O('Slide the PSU into the basement bay with its fan facing the vent, and fasten it with four screws.', 'أدخل مصدر الطاقة في الحيز السفلي ومروحته نحو الفتحة وثبّته بأربعة مسامير.'),
    O('The PSU converts mains AC into the low DC voltages the parts use. Pick enough watts for all parts plus headroom.', 'يحوّل مصدر الطاقة التيار المتردد إلى جهود مستمرة منخفضة. اختر واطاً كافياً مع هامش.'),
    O('Keep the PSU switch OFF and the mains cable unplugged while building.', 'أبقِ مفتاح PSU مطفأً وكابل الكهرباء مفصولاً أثناء التجميع.'),
    O('Remove the PSU', 'فك مصدر الطاقة'), O('Unplug all cables first, then unscrew and slide it out.', 'افصل كل الكابلات أولاً ثم فك المسامير واسحبه.'),
    { q: O('A PSU is rated in…', 'يُقاس مصدر الطاقة بـ…'), options: [O('Gigabytes (GB)', 'الجيجابايت (GB)'), O('Watts (W)', 'الواط (W)')], ans: 1, exp: O('It must supply enough power for every component.', 'يجب أن يوفر طاقة كافية لكل المكونات.') }),
  S('gpu', 'case', ['board'], O('Install the graphics card (GPU)', 'تركيب كرت الرسوميات (GPU)'),
    O('Remove the slot cover, align the card with the PCIe x16 slot, press down until the latch clicks and screw the bracket to the case.', 'انزع غطاء الفتحة، طابق الكرت مع فتحة PCIe x16، اضغط حتى يُسمع نقر المزلاج ثم ثبّت الحامل بالصندوق.'),
    O('The GPU draws graphics and 3D far faster than the CPU alone. It needs its own power cable.', 'كرت الرسوميات يرسم الصور وثلاثي الأبعاد أسرع بكثير من المعالج وحده، ويحتاج كابل طاقة خاصاً.'),
    O('Never insert or remove a card while the PC is plugged in.', 'لا تُدخل ولا تُخرج كرتاً والجهاز موصول بالكهرباء.'),
    O('Remove the graphics card', 'فك كرت الرسوميات'), O('Unplug its power cable, unscrew the bracket, release the latch and lift.', 'افصل كابل طاقته، فك الحامل، حرّر المزلاج وارفعه.'),
    { q: O('Which slot normally holds a graphics card?', 'أي فتحة تحمل كرت الرسوميات عادة؟'), options: [O('PCIe x16 slot', 'فتحة PCIe x16'), O('DDR4 DIMM slot', 'فتحة DDR4 DIMM')], ans: 0, exp: O('DIMM slots are for RAM.', 'فتحات DIMM للذاكرة.') }),
  S('cable24', 'case', ['board', 'psu'], O('Connect the 24-pin ATX cable', 'توصيل كابل ATX ذي 24 دبوساً'),
    O('Route the cable from the PSU to the right edge of the board and press the connector until the latch clicks.', 'مرّر الكابل من PSU إلى الحافة اليمنى للوحة واضغط الموصل حتى يُسمع نقر المشبك.'),
    O('This is the main power feed to the whole motherboard.', 'هذا مصدر الطاقة الرئيسي للوحة الأم كلها.'),
    O('The connector is keyed — never force it.', 'الموصل مفتاحي الشكل — لا تُجبره.'),
    O('Unplug the 24-pin cable', 'فصل كابل ATX'), O('Squeeze the latch and pull straight out.', 'اضغط المشبك واسحب للخارج باستقامة.'),
    { q: O('What does the 24-pin cable power?', 'ماذا يغذي كابل 24 دبوساً؟'), options: [O('Only the rear exhaust fan', 'مروحة الصندوق الخلفية فقط'), O('The entire motherboard', 'اللوحة الأم بالكامل')], ans: 1, exp: O('Most boards will not start without it.', 'معظم اللوحات لا تعمل بدونه.') }),
  S('cableEps', 'case', ['board', 'psu'], O('Connect the 8-pin CPU power (EPS)', 'توصيل طاقة المعالج EPS (8 دبابيس)'),
    O('Route the cable behind the tray to the top-left of the board and plug it into the CPU power socket.', 'مرّر الكابل خلف الحامل إلى أعلى يسار اللوحة ووصله بمقبس طاقة المعالج.'),
    O('It feeds the voltage regulators next to the CPU. Without it the PC will not boot.', 'يغذي منظمات الجهد بجوار المعالج. بدونه لا يقلع الجهاز.'),
    O('Use the CPU/EPS cable — not a PCIe cable (similar shape!).', 'استخدم كابل CPU/EPS وليس PCIe (شكلهما متشابه!).'),
    O('Unplug the 8-pin CPU cable', 'فصل كابل طاقة المعالج'), O('Squeeze the latch and pull out.', 'اضغط المشبك واسحب.'),
    { q: O('If you forget the EPS cable the PC…', 'إذا نسيت كابل EPS فإن الجهاز…'), options: [O('Fails to boot at all', 'يفشل في الإقلاع تماماً'), O('Boots at half speed', 'يقلع بنصف سرعته المعتادة')], ans: 0, exp: O('The CPU cannot get its power.', 'المعالج لا يحصل على طاقته.') }),
  S('cablePcie', 'case', ['gpu', 'psu'], O('Connect the GPU PCIe power', 'توصيل طاقة PCIe لكرت الرسوميات'),
    O('Plug the PCIe power cable from the PSU into the socket on the top edge of the graphics card.', 'وصّل كابل PCIe من PSU بالمقبس على الحافة العلوية للكرت.'),
    O('The slot gives only a limited amount of power; powerful GPUs need an extra cable.', 'الفتحة تعطي طاقة محدودة؛ والكروت القوية تحتاج كابلاً إضافياً.'),
    O('Match the pin count (6+2) and push until it clicks.', 'طابق عدد الدبابيس (6+2) واضغط حتى النقر.'),
    O('Unplug the GPU power cable', 'فصل كابل طاقة الكرت'), O('Squeeze the latch and pull out.', 'اضغط المشبك واسحب.'),
    { q: O('Why does a GPU need an extra power cable?', 'لماذا يحتاج الكرت كابل طاقة إضافياً؟'), options: [O('It carries the video signal to the monitor', 'ينقل إشارة الفيديو الرقمية إلى الشاشة'), O('It draws more power than the slot supplies', 'يستهلك طاقة أكثر مما توفره الفتحة')], ans: 1, exp: O('Video goes out via HDMI/DisplayPort.', 'الفيديو يخرج عبر HDMI/DisplayPort.') }),
  S('sidepanel', 'case', ['cable24', 'cableEps', 'cablePcie', 'gpu'], O('Close the side panel', 'إغلاق اللوحة الجانبية'),
    O('Hang the panel on the tabs, swing it closed and fasten the thumbscrews.', 'علّق اللوحة على الألسنة وأغلقها وأحكم براغي اليد.'),
    O('A closed case directs airflow over the parts and keeps dust and fingers out.', 'الصندوق المغلق يوجه الهواء فوق القطع ويمنع الغبار والأصابع.'),
    O('Tip: professionals test the PC before closing the panel.', 'نصيحة: المحترفون يختبرون الجهاز قبل إغلاق اللوحة.'),
    O('Remove the side panel', 'فك اللوحة الجانبية'), O('Switch off, unplug the mains lead, then remove the thumbscrews.', 'أطفئ الجهاز وافصل كابل الكهرباء ثم فك براغي اليد.'),
    { q: O('Before opening a PC you should…', 'قبل فتح الحاسوب يجب أن…'), options: [O('Shut down and unplug mains power', 'إغلاق الجهاز وفصل كابل الكهرباء'), O('Leave the power supply switched on', 'ترك مزود الطاقة متصلاً ومشغلاً')], ans: 0, exp: O('Safety first: mains voltage and ESD.', 'السلامة أولاً: جهد الكهرباء والكهرباء الساكنة.') }),
];
export const STEP = Object.fromEntries(STEPS.map((s) => [s.id, s]));
export const PARTS_BY_PHASE = { bench: STEPS.filter((s) => s.phase === 'bench').map((s) => s.id), case: STEPS.filter((s) => s.phase === 'case').map((s) => s.id) };

export const { canInstall, canRemove } = makeRules(STEPS);

/** Power-on self test (POST) evaluated from the installed parts. */
export function runPost(installed) {
  const has = (i) => installed.has(i);
  const L = [];
  const chk = (ok, good, bad) => L.push({ ok, msg: ok ? good : bad });
  chk(has('psu'), O('PSU: power present', 'PSU: الطاقة متوفرة'), O('No power — the PSU is not installed.', 'لا طاقة — مصدر الطاقة غير مركّب.'));
  chk(has('psu') && has('cable24'), O('24-pin ATX connected', 'كابل ATX موصول'), O('The motherboard gets no power: connect the 24-pin ATX cable.', 'اللوحة لا تحصل على طاقة: وصّل كابل ATX.'));
  chk(has('board'), O('Motherboard mounted', 'اللوحة الأم مثبتة'), O('Motherboard is not mounted in the case.', 'اللوحة الأم غير مثبتة في الصندوق.'));
  chk(has('cpu') && has('cableEps'), O('CPU detected and powered', 'تم اكتشاف المعالج وتغذيته'), O(has('cpu') ? 'CPU is not powered: connect the 8-pin EPS cable.' : 'No CPU installed — the board cannot start.', has('cpu') ? 'المعالج بلا طاقة: وصّل كابل EPS.' : 'لا يوجد معالج — لا تستطيع اللوحة العمل.'));
  chk(has('cooler'), O('CPU temperature OK (cooler fitted)', 'حرارة المعالج مناسبة (المبرّد مركّب)'), O('CPU overheats and shuts down: install the cooler.', 'المعالج يسخن ويُطفأ: ركّب المبرّد.'));
  chk(has('ram'), O('Memory test passed', 'اختبار الذاكرة ناجح'), O('Beep code: no RAM detected.', 'صافرات خطأ: لم تُكتشف ذاكرة.'));
  chk(has('gpu') && has('cablePcie'), O('Graphics card ready — display output', 'كرت الرسوميات جاهز — خرج الشاشة يعمل'), O(has('gpu') ? 'GPU has no power cable: black screen.' : 'No graphics card: no display signal.', has('gpu') ? 'الكرت بلا كابل طاقة: شاشة سوداء.' : 'لا كرت رسوميات: لا إشارة للشاشة.'));
  chk(has('m2'), O('Boot device found (M.2 SSD)', 'تم العثور على وسيط إقلاع (M.2)'), O('No boot device: install an SSD.', 'لا وسيط إقلاع: ركّب قرصاً.'));
  return { ok: L.every((l) => l.ok), lines: L };
}
export const scoreFor = (mistakes) => Math.max(40, 100 - mistakes * 10);
