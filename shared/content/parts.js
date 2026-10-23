// Info shown in the 3D info panel. Keys match part ids created in src/three/models.js
const P = (en, ar, roleEn, roleAr, factsEn, factsAr, lesson = 'peripherals', extra = {}) =>
  ({ name: { en, ar }, role: { en: roleEn, ar: roleAr }, facts: { en: factsEn, ar: factsAr }, lesson, ...extra });

export const PARTS = {
  // ---- Motherboard ----
  pcb: P('Motherboard (PCB)', 'اللوحة الأم (PCB)', 'The main circuit board that connects every component and lets them communicate.', 'اللوحة الرئيسة التي تربط كل المكونات وتتيح لها التواصل.',
    ['Layers of copper traces carry data and power', 'Form factor (ATX, micro-ATX, mini-ITX) decides the case it fits', 'The chipset and BIOS/UEFI firmware live here'],
    ['طبقات من مسارات النحاس تنقل البيانات والطاقة', 'الحجم (ATX, micro-ATX, mini-ITX) يحدد الصندوق المناسب', 'تحتوي على الشيبست وبرنامج BIOS/UEFI الثابت'], 'peripherals'),
  socket: P('CPU socket', 'مقبس المعالج', 'Holds the processor and connects its pins/contacts to the board.', 'يثبّت المعالج ويوصل أطرافه باللوحة.',
    ['Socket type must match the CPU (e.g. LGA or PGA)', 'A retention lever locks the CPU in place', 'Handle CPUs by the edges — pins are fragile'],
    ['يجب أن يطابق نوع المقبس نوع المعالج (LGA أو PGA)', 'ذراع تثبيت يقفل المعالج', 'امسك المعالج من الحواف — الأطراف هشة'], 'peripherals'),
  cpu: P('CPU (processor)', 'المعالج (CPU)', 'The "brain": runs program instructions and does calculations.', 'عقل الحاسوب: ينفذ تعليمات البرامج والحسابات.',
    ['Speed measured in GHz; more cores = more tasks at once', 'Produces heat so it needs a cooler and thermal paste', 'Must be compatible with the motherboard socket'],
    ['السرعة بالجيجاهرتز؛ المزيد من الأنوية = مهام أكثر في وقت واحد', 'يولد حرارة لذا يحتاج مبرّداً ومعجون حراري', 'يجب أن يتوافق مع مقبس اللوحة'], 'devices'),
  cooler: P('CPU cooler & fan', 'مبرّد المعالج والمروحة', 'Removes heat from the CPU so it can run at full speed.', 'يسحب الحرارة من المعالج ليعمل بسرعته الكاملة.',
    ['Heatsink fins spread heat; fan moves air', 'A thin layer of thermal paste fills tiny gaps', 'Overheating makes the CPU slow down (throttle)'],
    ['زعانف المشتت تنشر الحرارة؛ والمروحة تحرك الهواء', 'طبقة رقيقة من المعجون الحراري تملأ الفجوات الدقيقة', 'السخونة الزائدة تبطئ المعالج (throttling)'], 'devices'),
  ram: P('RAM (memory) modules', 'وحدات الذاكرة RAM', 'Fast, temporary memory for the programs and data currently in use.', 'ذاكرة سريعة مؤقتة للبرامج والبيانات قيد الاستخدام.',
    ['Volatile — contents are lost when power is off', 'Dual-channel: fit modules in matching slots', 'More RAM lets you run more applications smoothly'],
    ['متطايرة — تضيع محتوياتها عند انقطاع الطاقة', 'القناة المزدوجة: ركّب الوحدات في الفتحات المتطابقة', 'ذاكرة أكبر تعني تشغيل تطبيقات أكثر بسلاسة'], 'peripherals'),
  ramslot: P('RAM slots (DIMM)', 'فتحات الذاكرة (DIMM)', 'Slots where memory modules click in.', 'فتحات تُثبَّت فيها وحدات الذاكرة.',
    ['Notch ensures the module only fits one way', 'Clips on the ends lock the module'], ['الفتحة تضمن أن الوحدة تدخل باتجاه واحد فقط', 'مشابك على الطرفين تقفل الوحدة'], 'peripherals'),
  gpuslot: P('PCIe x16 slot', 'فتحة PCIe x16', 'High-speed expansion slot, mainly for the graphics card.', 'فتحة توسعة عالية السرعة، للكرت الرسومي غالباً.',
    ['Also used by fast network or capture cards', 'A latch holds the card in place'], ['تُستخدم أيضاً لبطاقات الشبكة أو الالتقاط السريعة', 'مزلاج يثبّت البطاقة'], 'peripherals'),
  pciex1: P('PCIe x1 slot', 'فتحة PCIe x1', 'Smaller expansion slot for sound, Wi-Fi or extra network cards.', 'فتحة توسعة أصغر لبطاقات الصوت أو Wi-Fi أو شبكة إضافية.',
    ['Lower bandwidth than x16', 'A good example of adding connectivity later'], ['نطاق أقل من x16', 'مثال جيد على إضافة الاتصال لاحقاً'], 'connectivity'),
  m2: P('M.2 SSD', 'قرص M.2 SSD', 'Compact solid-state storage that plugs straight into the board.', 'تخزين حالة صلبة مدمج يتصل مباشرة باللوحة.',
    ['No moving parts, very fast boot and load times', 'Held by a single screw at the end', 'Stores the OS, applications and files permanently'],
    ['بدون أجزاء متحركة، إقلاع وتحميل سريعان جداً', 'يُثبَّت بمسمار واحد في الطرف', 'يخزن نظام التشغيل والتطبيقات والملفات بشكل دائم'], 'peripherals'),
  chipset: P('Chipset', 'الشيبست (Chipset)', 'Manages data flow between the CPU, storage, USB and expansion slots.', 'يدير تدفق البيانات بين المعالج والتخزين وUSB وفتحات التوسعة.',
    ['Often covered by a heatsink', 'Decides how many USB / SATA / PCIe lanes you get'], ['غالباً مغطى بمشتت حراري', 'يحدد عدد منافذ USB/SATA/PCIe'], 'peripherals'),
  vrm: P('VRM heatsinks', 'مشتتات VRM', 'Voltage regulators turn 12 V power into the exact low voltage the CPU needs.', 'منظمات الجهد تحول 12 فولت إلى الجهد المنخفض الدقيق للمعالج.',
    ['Get warm under load so they have heatsinks', 'Quality VRMs = stable power for the CPU'], ['تسخن تحت الحمل لذا لها مشتتات', 'جودة VRM = طاقة مستقرة للمعالج'], 'peripherals'),
  sata: P('SATA ports', 'منافذ SATA', 'Connect 2.5" SSDs, 3.5" hard drives and optical drives.', 'توصّل أقراص SSD مقاس 2.5 وأقراص HDD مقاس 3.5 والأقراص الضوئية.',
    ['Need a data cable AND a power cable', 'Slower than M.2 NVMe but good for bulk storage'], ['تحتاج كابل بيانات وكابل طاقة', 'أبطأ من M.2 لكنها مناسبة للتخزين الكبير'], 'peripherals'),
  atx: P('24-pin ATX power connector', 'موصل طاقة ATX ذو 24 دبوساً', 'Main power from the PSU to the motherboard.', 'الطاقة الرئيسة من مصدر الطاقة إلى اللوحة.',
    ['Keyed so it only fits one way', 'Always connect before first power-on'], ['مفتاحي الشكل فيدخل باتجاه واحد', 'صله دائماً قبل أول تشغيل'], 'devices'),
  cpupower: P('8-pin CPU power (EPS)', 'موصل طاقة المعالج 8 دبابيس (EPS)', 'Extra power cable that feeds the CPU voltage regulators.', 'كابل طاقة إضافي يغذي منظمات جهد المعالج.',
    ['Often forgotten — the PC will not boot without it', 'Located near the top edge of the board'], ['كثيراً ما يُنسى — لا يقلع الجهاز بدونه', 'يقع قرب الحافة العلوية للوحة'], 'devices'),
  io: P('Rear I/O ports', 'منافذ الإدخال/الإخراج الخلفية', 'Connect the PC to peripherals and networks: USB, Ethernet (RJ45), HDMI/DisplayPort and audio.', 'توصل الحاسوب بالأجهزة الطرفية والشبكات: USB وإيثرنت (RJ45) وHDMI/DisplayPort وصوت.',
    ['RJ45 Ethernet port = wired network connection', 'The I/O shield protects and labels the ports'], ['منفذ RJ45 = اتصال شبكي سلكي', 'درع I/O يحمي المنافذ ويعنونها'], 'connectivity'),
  battery: P('CMOS battery', 'بطارية CMOS', 'Keeps the clock and BIOS settings when the PC is unplugged.', 'تحفظ الساعة وإعدادات BIOS عند فصل الجهاز.',
    ['A CR2032 coin cell', 'If it dies the date/time may reset'], ['بطارية CR2032 صغيرة', 'عند نفادها قد تُعاد الساعة للصفر'], 'peripherals'),
  // ---- PC build extras ----
  case: P('PC case', 'صندوق الحاسوب', 'Holds, protects and cools all internal components.', 'يحمل المكونات الداخلية ويحميها ويبرّدها.',
    ['Standoffs lift the board off the metal', 'Airflow: air in at the front, out at the back/top'], ['الركائز ترفع اللوحة عن المعدن', 'تدفق الهواء: دخول أمامي وخروج خلفي/علوي'], 'devices'),
  psu: P('Power supply unit (PSU)', 'مصدر الطاقة (PSU)', 'Converts mains AC electricity into the DC voltages components use.', 'يحول كهرباء التيار المتردد إلى جهود مستمرة تستخدمها المكونات.',
    ['Rated in watts — must cover all parts with headroom', 'Modular PSUs only use the cables you need'], ['يُقاس بالواط — ويجب أن يغطي كل القطع مع هامش', 'مصادر الطاقة المعيارية تستخدم الكابلات المطلوبة فقط'], 'devices'),
  gpu: P('Graphics card (GPU)', 'كرت الرسوميات (GPU)', 'Specialised processor for images, video and 3D — needed for gaming and design.', 'معالج متخصص للصور والفيديو وثلاثي الأبعاد.',
    ['Needs a PCIe slot and often extra power cables', 'Heavy: some cases support it with a bracket'], ['يحتاج فتحة PCIe وغالباً كابلات طاقة إضافية', 'ثقيل: بعض الصناديق تدعمه بحامل'], 'devices'),
  // ---- Rack ----
  rackframe: P('Server rack (19-inch)', 'رف الخوادم (19 بوصة)', 'A standard 19-inch frame that holds servers, switches and other equipment in tidy units ("U").', 'إطار قياسي 19 بوصة يحمل الخوادم والسويتشات في وحدات منظمة (U).',
    ['1U = 44.45 mm of height', 'Front = cold aisle, back = cables and hot air', 'Keeps equipment secure, cooled and organised'], ['1U = 44.45 مم ارتفاعاً', 'الأمام ممر بارد، والخلف للكابلات والهواء الساخن', 'يحفظ المعدات آمنة ومبردة ومنظمة'], 'networks'),
  server1u: P('1U web / application server', 'خادم 1U للويب والتطبيقات', 'Runs applications and serves data to many users at once.', 'يشغل التطبيقات ويخدم البيانات لمستخدمين كثيرين.',
    ['Redundant fans and hot-swap drives', 'Managed remotely, usually without a monitor'], ['مراوح احتياطية وأقراص قابلة للتبديل أثناء التشغيل', 'يُدار عن بُعد غالباً بدون شاشة'], 'devices'),
  storage2u: P('2U storage server (NAS)', 'خادم تخزين 2U (NAS)', 'Many drive bays for shared files and backups.', 'عدة حاضنات أقراص للملفات المشتركة والنسخ الاحتياطي.',
    ['RAID spreads data across drives to survive a disk failure', 'Staff access files over the network'], ['RAID يوزع البيانات على الأقراص لتحمل عطل قرص', 'يصل الموظفون للملفات عبر الشبكة'], 'peripherals'),
  rackswitch: P('48-port switch', 'سويتش 48 منفذاً', 'Connects all wired devices in the LAN and forwards data only to the right port.', 'يربط كل الأجهزة السلكية في الـ LAN ويرسل البيانات للمنفذ الصحيح فقط.',
    ['Link LEDs show activity on each port', 'Uplink goes to the router'], ['مؤشرات LED تظهر النشاط على كل منفذ', 'وصلة Uplink تذهب إلى الراوتر'], 'networks'),
  patch: P('Patch panel', 'لوحة التوصيل (Patch panel)', 'Terminates the building\'s fixed cables and gives tidy ports for short patch leads.', 'تنهي كابلات المبنى الثابتة وتعطي منافذ مرتبة لكابلات قصيرة.',
    ['Makes changes easy without re-wiring walls', 'Labelling prevents mistakes'], ['تسهل التغيير بدون إعادة تمديد الجدران', 'الترقيم يمنع الأخطاء'], 'networks'),
  ups: P('UPS (battery backup)', 'مصدر طاقة غير منقطع (UPS)', 'Keeps equipment running briefly during a power cut and allows a safe shutdown.', 'يبقي المعدات تعمل لفترة قصيرة عند انقطاع الكهرباء ويتيح إغلاقاً آمناً.',
    ['Protects against surges and sudden power loss', 'Heavy — mounted at the bottom of the rack'], ['يحمي من التذبذب وفقدان الطاقة المفاجئ', 'ثقيل — يُركَّب أسفل الرف'], 'protection'),
  rackcables: P('Structured cabling', 'الكابلات المنظمة', 'Tidy bundled cables that carry data between devices.', 'كابلات مجمعة ومرتبة تنقل البيانات بين الأجهزة.',
    ['Colour coding & labels help troubleshooting', 'Poor cable management blocks airflow'], ['الألوان والملصقات تسهّل إيجاد الأعطال', 'سوء الترتيب يعيق تدفق الهواء'], 'networks'),
  // ---- Network devices ----
  router: P('Router', 'الراوتر (Router)', 'Connects different networks (your LAN and the Internet) and chooses the path for data.', 'يربط شبكات مختلفة (الشبكة المحلية والإنترنت) ويختار مسار البيانات.',
    ['Has a WAN port (to the ISP) and LAN ports', 'Often includes a firewall, DHCP and Wi-Fi', 'Works with IP addresses'], ['لديه منفذ WAN (للمزود) ومنافذ LAN', 'غالباً يتضمن جدار حماية وDHCP وWi-Fi', 'يعمل بعناوين IP'], 'networks'),
  lanswitch: P('Switch', 'السويتش (Switch)', 'Connects devices inside one LAN and sends data only to the intended device.', 'يربط الأجهزة داخل شبكة محلية واحدة ويرسل البيانات للجهاز المقصود فقط.',
    ['Learns the MAC address of each port', 'More efficient than an old hub'], ['يتعلم عنوان MAC لكل منفذ', 'أكفأ من الهَب القديم'], 'networks'),
  ap: P('Wireless access point', 'نقطة الوصول اللاسلكية', 'Provides Wi-Fi so laptops and phones can join the wired network.', 'توفر Wi-Fi لتنضم الحواسيب المحمولة والهواتف إلى الشبكة السلكية.',
    ['Connects to a switch with one Ethernet cable', 'Channel and placement affect speed and range'], ['تتصل بسويتش بكابل إيثرنت واحد', 'القناة والموضع يؤثران في السرعة والمدى'], 'connectivity'),
  firewall: P('Firewall appliance', 'جهاز جدار الحماية', 'Filters traffic between the Internet and the internal network by rules.', 'يصفّي الحركة بين الإنترنت والشبكة الداخلية وفق قواعد.',
    ['Blocks unauthorised connections', 'Can log suspicious activity'], ['يمنع الاتصالات غير المصرح بها', 'يمكنه تسجيل النشاط المشبوه'], 'protection'),
};

export const MODELS = {
  motherboard: { name: { en: 'Motherboard', ar: 'اللوحة الأم' }, hint: { en: 'Explode the board to inspect CPU, RAM, storage and connectors.', ar: 'فكّك اللوحة لفحص المعالج والذاكرة والتخزين والموصلات.' } },
  rack: { name: { en: 'Server rack', ar: 'رف الخوادم' }, hint: { en: 'Pull units out of the rack and read what each does.', ar: 'اسحب الوحدات من الرف واقرأ وظيفة كل منها.' } },
  network: { name: { en: 'Network equipment', ar: 'معدات الشبكة' }, hint: { en: 'Router, switch, access point and firewall — see the ports.', ar: 'راوتر وسويتش ونقطة وصول وجدار حماية — شاهد المنافذ.' } },
  pc: { name: { en: 'Desktop PC', ar: 'حاسوب مكتبي' }, hint: { en: 'A complete PC. Explode it to see how parts fit.', ar: 'حاسوب كامل. فكّكه لترى كيف تتركب القطع.' } },
};

Object.assign(PARTS, {
  board: P('Motherboard (installed)', 'اللوحة الأم (مركّبة)', 'The board fixed to the case tray with standoff screws; everything plugs into it.', 'اللوحة مثبتة على حامل الصندوق بمسامير؛ كل شيء يتصل بها.', ['Match the I/O shield to the rear opening first', 'Screws go into brass standoffs only where holes line up'], ['ثبّت درع I/O في الفتحة الخلفية أولاً', 'تُربط المسامير في الركائز النحاسية عند الثقوب المطابقة'], 'peripherals'),
  sidepanel: P('Side panel (tempered glass)', 'اللوحة الجانبية (زجاج)', 'Closes the case, keeps airflow directed and dust out, and lets you see the components.', 'تغلق الصندوق وتوجّه الهواء وتمنع الغبار وتتيح رؤية المكونات.', ['Always power off and unplug before opening or closing', 'Fit it last — after testing the build'], ['افصل الطاقة دائماً قبل الفتح أو الإغلاق', 'تُركَّب أخيراً — بعد اختبار التجميع'], 'devices'),
  cable24: P('24-pin ATX cable', 'كابل ATX ذو 24 دبوساً', 'Carries main power from the PSU to the motherboard.', 'ينقل الطاقة الرئيسة من PSU إلى اللوحة الأم.', ['Push until the latch clicks', 'Must be connected before the first power-on'], ['اضغط حتى يُسمع صوت المشبك', 'يجب توصيله قبل أول تشغيل'], 'devices'),
  cableEps: P('8-pin CPU power cable (EPS)', 'كابل طاقة المعالج (EPS) 8 دبابيس', 'Feeds the CPU voltage regulators.', 'يغذي منظمات جهد المعالج.', ['Routes behind the tray to the top of the board', 'Do not use a PCIe cable here — shapes look similar!'], ['يمر خلف الحامل إلى أعلى اللوحة', 'لا تستخدم كابل PCIe هنا — الأشكال متشابهة!'], 'devices'),
  cablePcie: P('PCIe power cable', 'كابل طاقة PCIe', 'Gives the graphics card extra power beyond the slot.', 'يمنح كرت الرسوميات طاقة إضافية فوق ما تعطيه الفتحة.', ['Needed by most mid/high-end GPUs', 'Match the connector count on the card (6/8-pin)'], ['تحتاجه معظم الكروت المتوسطة والعالية', 'طابق عدد دبابيس الكرت (6/8)'], 'devices'),
});

PARTS.server1uB = { ...PARTS.server1u, name: { en: '1U database server', ar: 'خادم قواعد بيانات 1U' }, role: { en: 'Stores and serves the company databases (customers, jobs, stock).', ar: 'يخزن ويقدم قواعد بيانات الشركة (عملاء، مهام، مخزون).' } };
