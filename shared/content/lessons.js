// Bilingual lesson content for Unit 1. `pages` are PDF page numbers of L3_Information_Technology_Volume_1.pdf (Arabic edition).
// Each lesson is original, simplified study material that follows the structure of the book's headings.
const L = (id, outcome, pages, criteria, title, summary, points, terms, tip, model = null) =>
  ({ id, outcome, pages, criteria, title, summary, points, terms, tip, model });

export const OUTCOMES = {
  A: { en: 'Learning aim A — How IT infrastructure meets the needs of organisations', ar: 'نتاج التعلم (أ) — كيف تلبي البنية الأساسية لتكنولوجيا المعلومات احتياجات المؤسسات' },
  B: { en: 'Learning aim B — How organisations use data and information', ar: 'نتاج التعلم (ب) — كيف تستفيد المؤسسات من البيانات والمعلومات' },
  C: { en: 'Learning aim C — Policies for the use of IT in an organisation', ar: 'نتاج التعلم (ج) — سياسات استخدام تكنولوجيا المعلومات داخل المؤسسة' },
};

import { bookSummary } from "./indexHtmlStudy.js";

export const LEGACY_LESSONS = [
  L('purpose', 'A', [14, 16], ['A.P1', 'A.P2'],
    { en: 'Purpose of organisations & their infrastructure', ar: 'غرض المؤسسات ووظائفها والبنية الأساسية' },
    { en: 'Every organisation has a purpose and priorities. Those decide which IT infrastructure it needs.', ar: 'لكل مؤسسة غرض وأولويات، وهذه تحدد البنية الأساسية لتكنولوجيا المعلومات التي تحتاجها.' },
    [
      { en: 'Organisations can be grouped by ownership (private, public, not-for-profit) and by what they do (make products, sell products, provide services, or both).', ar: 'تُصنَّف المؤسسات بحسب الملكية (خاصة، عامة، غير هادفة للربح) وبحسب نشاطها (تصنيع منتجات، بيعها، تقديم خدمات، أو كلاهما).' },
      { en: '"Infrastructure" means the services and facilities needed to operate. For IT systems this includes electricity, IT equipment (hardware and software) and trained staff.', ar: '"البنية الأساسية" هي الخدمات والمرافق اللازمة للتشغيل. وفي أنظمة IT تشمل الكهرباء ومعدات تكنولوجيا المعلومات (أجهزة وبرامج) والموظفين المدربين.' },
      { en: 'Each organisation has its own infrastructure requirements driven by its goals and priorities. A start-up like Leshev Outfitters needs a plan because its new premises have no infrastructure at all.', ar: 'لكل مؤسسة متطلباتها الخاصة بحسب أهدافها وأولوياتها. وشركة ناشئة مثل Leshev Outfitters تحتاج خطة لأن مقرها الجديد خالٍ من أي بنية تحتية.' },
      { en: 'Outsourcing (using outside specialists, e.g. for IT management) and overheads (running costs) influence how much a business spends on IT.', ar: 'الاستعانة بمصادر خارجية (متخصصون من خارج المؤسسة، مثل إدارة IT) والنفقات العامة (تكاليف التشغيل) تؤثر في ميزانية IT.' },
    ],
    [['Outsourcing', 'الاستعانة بمصادر خارجية'], ['Overheads', 'النفقات العامة'], ['Stakeholder', 'صاحب المصلحة']],
    { en: 'Exam tip: always link a recommendation to the organisation\'s purpose — "because the company needs X, it should use Y".', ar: 'نصيحة للامتحان: اربط أي توصية بغرض المؤسسة — "لأن الشركة تحتاج X، يجب أن تستخدم Y".' }),

  L('devices', 'A', [16, 22], ['A.P2'],
    { en: 'Digital devices and their uses', ar: 'الأجهزة الرقمية ووظائفها واستخداماتها' },
    { en: 'Know the main digital devices, what each is for and how they connect to form an IT system.', ar: 'تعرّف على الأجهزة الرقمية الرئيسة واستخداماتها وكيف ترتبط لتشكل نظام IT.' },
    [
      { en: 'Computers: standalone computers, desktops, laptops, tablets, servers and all-in-one / multifunction devices (MFD) that print, scan and copy.', ar: 'الحواسيب: الحاسوب المستقل، المكتبي، المحمول، اللوحي، الخوادم، والأجهزة متعددة الوظائف (MFD) التي تطبع وتمسح وتنسخ.' },
      { en: 'Servers store shared files, run applications and manage network users, so many people can use the same resources.', ar: 'الخوادم تخزّن الملفات المشتركة وتشغّل التطبيقات وتدير مستخدمي الشبكة، فيستخدم الجميع نفس الموارد.' },
      { en: 'Mobile devices (smartphones, tablets) give flexibility; embedded and IoT devices (smart meters, ATMs, RFID systems) are computers built into other equipment.', ar: 'الأجهزة المحمولة (هواتف، لوحية) تمنح مرونة؛ والأجهزة المضمنة وإنترنت الأشياء (العدادات الذكية، أجهزة الصراف، RFID) حواسيب مدمجة في معدات أخرى.' },
      { en: 'Choosing a device means balancing portability, performance, cost and the task. A workshop technician on the road needs a different device than an office administrator.', ar: 'اختيار الجهاز يوازن بين سهولة الحمل والأداء والتكلفة والمهمة. فني الورشة المتنقل يحتاج جهازاً مختلفاً عن موظف المكتب.' },
    ],
    [['Standalone computer', 'حاسوب مستقل'], ['MFD', 'جهاز متعدد الوظائف'], ['Broadband', 'النطاق العريض']],
    { en: 'Exam tip: for each device give purpose + one advantage + one limitation.', ar: 'نصيحة للامتحان: لكل جهاز اذكر الغرض + ميزة واحدة + قيد واحد.' }, 'pc'),

  L('peripherals', 'A', [23, 28], ['A.P2'],
    { en: 'Peripherals, media and storage', ar: 'الأجهزة الطرفية والوسائط والتخزين' },
    { en: 'Hardware is the physical part. Peripherals are connected to a computer for input, output or storage.', ar: 'العتاد هو الجزء المادي. والأجهزة الطرفية توصَّل بالحاسوب للإدخال أو الإخراج أو التخزين.' },
    [
      { en: 'Hardware = parts you can touch (computer, keyboard, screen, mouse). Software = programs installed on a device. Firmware = low-level built-in controls that let a device run instructions (e.g. a remote control).', ar: 'العتاد = ما تلمسه (حاسوب، لوحة مفاتيح، شاشة، ماوس). البرامج = تطبيقات مثبتة على الجهاز. البرامج الثابتة = عناصر تحكم منخفضة المستوى مدمجة في الجهاز.' },
      { en: 'Input devices send data in (keyboard, scanner, microphone). Output devices present results (monitor, printer, speakers). Accessibility features such as alt text help users with disabilities.', ar: 'أجهزة الإدخال ترسل البيانات (لوحة مفاتيح، ماسح، ميكروفون). أجهزة الإخراج تعرض النتائج (شاشة، طابعة، سماعات). وميزات الوصول مثل النص البديل تساعد ذوي الإعاقة.' },
      { en: 'Storage media: magnetic (HDD), solid-state (SSD, USB flash, SD cards), optical (CD/DVD) and cloud. They differ in speed, capacity, durability, portability and cost.', ar: 'وسائط التخزين: مغناطيسية (HDD)، حالة صلبة (SSD، فلاش، بطاقات SD)، ضوئية (CD/DVD) وسحابية. وتختلف في السرعة والسعة والمتانة وسهولة النقل والتكلفة.' },
      { en: 'Data processing can be manual or automated; automation is faster and more consistent but depends on correct set-up.', ar: 'معالجة البيانات قد تكون يدوية أو آلية؛ الآلية أسرع وأكثر اتساقاً لكنها تعتمد على الإعداد الصحيح.' },
    ],
    [['Hardware', 'العتاد'], ['Firmware', 'البرامج الثابتة'], ['Alt text', 'النص البديل'], ['SD card', 'بطاقة SD']],
    { en: 'Exam tip: compare media with a table — speed, capacity, cost, portability.', ar: 'نصيحة للامتحان: قارن الوسائط بجدول — السرعة، السعة، التكلفة، سهولة النقل.' }, 'motherboard'),

  L('software', 'A', [29, 35], ['A.P1'],
    { en: 'Operating systems & software', ar: 'نظام التشغيل والبرامج' },
    { en: 'Software tells hardware what to do. The operating system (OS) is the platform every other program runs on.', ar: 'البرامج تخبر العتاد بما يفعل. ونظام التشغيل هو المنصة التي تعمل عليها بقية البرامج.' },
    [
      { en: 'OS roles: manage hardware and memory, run applications, provide a user interface (UI), manage files and security. Device drivers are small programs that operate peripherals.', ar: 'أدوار نظام التشغيل: إدارة العتاد والذاكرة، تشغيل التطبيقات، توفير واجهة المستخدم، إدارة الملفات والأمان. وبرامج التشغيل (drivers) تشغّل الأجهزة الطرفية.' },
      { en: 'Interface types: graphical (GUI), command line / terminal, touch and voice. The best choice depends on the user\'s skills and the task.', ar: 'أنواع الواجهات: رسومية (GUI)، سطر أوامر/نافذة طرفية، لمس، وصوت. والأفضل يعتمد على مهارة المستخدم والمهمة.' },
      { en: 'Utility software maintains the system (antivirus, backup, disk tools). Application software does user tasks (word processing, spreadsheets, databases, scheduling).', ar: 'برامج الأدوات المساعدة تصون النظام (مضاد فيروسات، نسخ احتياطي). وبرامج التطبيقات تنفذ مهام المستخدم (معالجة نصوص، جداول، قواعد بيانات، جدولة).' },
      { en: 'Open-source code is written collaboratively and can be inspected and changed; proprietary software is owned by a company and licensed. Each has cost, support and flexibility implications.', ar: 'الكود مفتوح المصدر يُكتب بجهد تعاوني ويمكن فحصه وتعديله؛ أما البرامج الملكية فتملكها شركة وتُرخَّص. ولكل منهما آثار على التكلفة والدعم والمرونة.' },
    ],
    [['Platform', 'النظام الأساسي'], ['Interface', 'الواجهة'], ['Driver', 'برنامج التشغيل'], ['Open source', 'مفتوح المصدر']],
    { en: 'Exam tip (A.P1): link each software type to a Leshev need — e.g. scheduling software → daily job lists.', ar: 'نصيحة (A.P1): اربط كل نوع برنامج بحاجة لدى Leshev — مثل برنامج الجدولة ← قوائم المهام اليومية.' }),

  L('files', 'A', [36, 38], ['A.P1'],
    { en: 'File types and formats', ar: 'أنواع الملفات وتنسيقاتها' },
    { en: 'The file format you choose affects quality, size, compatibility and what stakeholders can do with the file.', ar: 'تنسيق الملف الذي تختاره يؤثر في الجودة والحجم والتوافق وما يستطيع أصحاب المصلحة فعله به.' },
    [
      { en: 'Common types: text/documents (DOCX, PDF, TXT), images (JPG, PNG, GIF), audio/video (MP3, MP4), spreadsheets (XLSX), data (CSV).', ar: 'أنواع شائعة: نصوص ومستندات (DOCX, PDF, TXT)، صور (JPG, PNG, GIF)، صوت/فيديو (MP3, MP4)، جداول (XLSX)، بيانات (CSV).' },
      { en: 'Compression reduces size: lossy (smaller, some quality lost, e.g. JPG/MP3) vs lossless (exact, e.g. PNG/ZIP).', ar: 'الضغط يقلل الحجم: مع فقد (أصغر وبعض الجودة تضيع، مثل JPG/MP3) أو بدون فقد (مطابق، مثل PNG/ZIP).' },
      { en: 'CSV stores records as plain text with fields separated by commas, so many systems can exchange it.', ar: 'ملف CSV يخزن السجلات كنص عادي تفصل بين حقوله فواصل، لذلك تتبادله أنظمة كثيرة.' },
      { en: 'Pick a format that the receiver can open, that keeps required quality and that is small enough to send or store.', ar: 'اختر تنسيقاً يستطيع المستلم فتحه ويحافظ على الجودة المطلوبة ويكون صغيراً بما يكفي للإرسال أو التخزين.' },
    ],
    [['CSV', 'قيم مفصولة بفواصل'], ['Lossy', 'ضغط مع فقد'], ['Lossless', 'ضغط بدون فقد']],
    { en: 'Exam tip: always name the implication (size, quality, compatibility) not just the format.', ar: 'نصيحة للامتحان: اذكر الأثر (الحجم، الجودة، التوافق) وليس التنسيق فقط.' }),

  L('connectivity', 'A', [39, 42], ['A.P3'],
    { en: 'Connectivity: wired and wireless', ar: 'إمكانية الاتصال: السلكي واللاسلكي' },
    { en: 'Connectivity is the ability to link devices to move and process digital data.', ar: 'إمكانية الاتصال هي القدرة على توصيل الأجهزة لنقل البيانات الرقمية ومعالجتها.' },
    [
      { en: 'Wired: a permanent connection using cables (Ethernet copper, fibre optic). Usually faster, more stable and more secure; less flexible. Modern buildings often have cabling built in.', ar: 'السلكي: اتصال دائم بكابلات (إيثرنت نحاسي، ألياف ضوئية). غالباً أسرع وأكثر استقراراً وأماناً؛ لكنه أقل مرونة. والمباني الحديثة غالباً بها كابلات مدمجة.' },
      { en: 'Wireless: Wi-Fi, Bluetooth, NFC (near-field communication, short range), infrared (IR) and mobile data (3G/4G/5G). Flexible, but can have interference, limited range and weaker security.', ar: 'اللاسلكي: Wi-Fi، بلوتوث، NFC (اتصال قريب المدى)، الأشعة تحت الحمراء (IR)، وبيانات الجوال (3G/4G/5G). مرن لكنه عرضة للتداخل ومحدود المدى وأضعف أمناً.' },
      { en: 'Bandwidth is the amount of data a connection can carry. Connection type affects performance, cost, and who can use the system and where.', ar: 'النطاق الترددي هو كمية البيانات التي يحملها الاتصال. ونوع الاتصال يؤثر في الأداء والتكلفة ومن يستخدم النظام وأين.' },
    ],
    [['Bandwidth', 'النطاق الترددي'], ['NFC', 'الاتصال قريب المدى'], ['Wired', 'سلكي']],
    { en: 'Exam tip (A.P3): give one wired and one wireless option and justify for Leshev (office = wired, vans = mobile data).', ar: 'نصيحة (A.P3): اذكر خياراً سلكياً وآخر لاسلكياً وبرر لـ Leshev (المكتب = سلكي، الفانات = بيانات الجوال).' }),

  L('networks', 'A', [42, 46], ['A.P3'],
    { en: 'Networks and network components', ar: 'الشبكات ومكوناتها' },
    { en: 'A network lets devices share data and resources. Different network types and components suit different needs.', ar: 'الشبكة تتيح للأجهزة مشاركة البيانات والموارد. وتناسب أنواع ومكونات مختلفة احتياجات مختلفة.' },
    [
      { en: 'Types: LAN (local, one site), WAN (wide area, e.g. the Internet), WLAN (wireless LAN), VPN (secure tunnel over the Internet). Intranet = internal-only website; extranet = intranet open to authorised outsiders.', ar: 'الأنواع: LAN (محلية)، WAN (واسعة مثل الإنترنت)، WLAN (لاسلكية)، VPN (نفق آمن عبر الإنترنت). الإنترانت = موقع داخلي فقط؛ الإكسترانت = إنترانت متاح لخارجيين مصرح لهم.' },
      { en: 'Topologies: star (devices connect to a central switch — the most common), bus, ring, mesh. Star is easy to manage and one cable failure affects only one device.', ar: 'التوبولوجيا: نجمية (أجهزة متصلة بمحوّل مركزي — الأشهر)، ناقل، حلقية، شبكية. النجمية سهلة الإدارة وعطل كابل يؤثر على جهاز واحد فقط.' },
      { en: 'Components: switch (connects devices inside a LAN), router (moves data between networks, connects the LAN to the Internet), wireless access point (adds Wi-Fi), network interface card (NIC), cables, modem, firewall.', ar: 'المكونات: المحوّل Switch (يربط الأجهزة داخل LAN)، الموجّه Router (ينقل البيانات بين الشبكات ويربط LAN بالإنترنت)، نقطة وصول لاسلكية، بطاقة الشبكة NIC، كابلات، مودم، جدار حماية.' },
      { en: 'Factors in choosing a network: number of users, budget, security, speed, expected growth, and whether staff work remotely.', ar: 'عوامل اختيار الشبكة: عدد المستخدمين، الميزانية، الأمان، السرعة، النمو المتوقع، وهل يعمل الموظفون عن بُعد.' },
    ],
    [['Intranet', 'الشبكة الداخلية'], ['Extranet', 'الشبكة الخارجية'], ['Router', 'جهاز التوجيه'], ['Encryption', 'التشفير']],
    { en: 'Try it: build a star network in the Networking Lab and test the connection.', ar: 'جرّب: ابنِ شبكة نجمية في Networking Lab ثم اختبر الاتصال.' }, 'network'),

  L('transmission', 'A', [47, 51], ['A.P3', 'A.M1'],
    { en: 'Data transmission, protocols and performance', ar: 'نقل البيانات والبروتوكولات والأداء' },
    { en: 'Protocols are agreed rules that control how data is sent. Bandwidth and latency decide how good a connection feels.', ar: 'البروتوكولات قواعد متفق عليها تتحكم في نقل البيانات. والنطاق الترددي وزمن الاستجابة يحددان جودة الاتصال.' },
    [
      { en: 'Protocols: TCP/IP (core of the Internet), HTTP/HTTPS (web, HTTPS encrypted), FTP (file transfer), SMTP/POP3/IMAP (email), DNS (names to IP addresses), DHCP (automatic IP addresses), VoIP/RTP (voice over IP).', ar: 'البروتوكولات: TCP/IP (أساس الإنترنت)، HTTP/HTTPS (الويب، والثاني مشفّر)، FTP (نقل الملفات)، SMTP/POP3/IMAP (البريد)، DNS (تحويل الأسماء لعناوين IP)، DHCP (عناوين IP تلقائية)، VoIP/RTP (الصوت عبر IP).' },
      { en: 'Bandwidth = how much data per second the link can carry. Latency = delay before data arrives (high latency = lag in online games). A ping test measures round-trip time between hosts.', ar: 'النطاق الترددي = كمية البيانات في الثانية. زمن الاستجابة = التأخير قبل وصول البيانات (الزمن العالي = تقطيع في الألعاب). واختبار Ping يقيس زمن الذهاب والعودة بين مضيفين.' },
      { en: 'Factors that reduce performance: too many users, interference, distance, old equipment, large files, poor compression. A codec compresses data so it moves faster.', ar: 'عوامل تقلل الأداء: كثرة المستخدمين، التداخل، المسافة، معدات قديمة، ملفات كبيرة، ضغط ضعيف. والـ codec يضغط البيانات لنقل أسرع.' },
      { en: 'Security when transmitting: encryption, firewalls and VPNs help protect data in transit; data compatibility and failed connections are common transmission issues.', ar: 'الأمان أثناء النقل: التشفير وجدران الحماية وVPN تحمي البيانات؛ ومشكلات التوافق وفشل الاتصال شائعة.' },
    ],
    [['Protocol', 'بروتوكول'], ['Latency', 'زمن الاستجابة'], ['Ping', 'اختبار البينغ'], ['Bit', 'بِت'], ['Codec', 'برنامج الترميز']],
    { en: 'Exam tip (A.M1): analyse = explain how each factor causes its effect, not just list it.', ar: 'نصيحة (A.M1): حلّل = اشرح كيف يسبب كل عامل أثره، ولا تكتفِ بالقائمة.' }, 'network'),

  L('online', 'A', [52, 57], ['A.P3', 'A.M1'],
    { en: 'Online systems, cloud and remote working', ar: 'الأنظمة عبر الإنترنت والسحابة والعمل عن بُعد' },
    { en: 'Cloud storage and computing let organisations use storage and software hosted by others over the Internet.', ar: 'التخزين والحوسبة السحابية يتيحان استخدام تخزين وبرامج مستضافة لدى طرف آخر عبر الإنترنت.' },
    [
      { en: 'Cloud storage: files kept on remote servers (access anywhere, automatic backup, easy sharing). Cloud computing: using remote servers to run software and processing (SaaS, IaaS, PaaS).', ar: 'التخزين السحابي: ملفات على خوادم بعيدة (وصول من أي مكان، نسخ احتياطي، مشاركة سهلة). الحوسبة السحابية: استخدام خوادم بعيدة لتشغيل البرامج والمعالجة (SaaS, IaaS, PaaS).' },
      { en: 'Benefits: lower upfront cost, scalability, collaboration. Drawbacks: depends on Internet, ongoing subscription, data-security and location concerns.', ar: 'الفوائد: تكلفة أولية أقل، قابلية التوسع، تعاون. العيوب: الاعتماد على الإنترنت، اشتراك مستمر، مخاوف الأمان وموقع البيانات.' },
      { en: 'Remote working is supported by video conferencing, VPN, shared calendars, cloud documents and messaging tools.', ar: 'العمل عن بُعد تدعمه مؤتمرات الفيديو وVPN والتقاويم المشتركة والمستندات السحابية وأدوات المراسلة.' },
      { en: 'A URL (uniform resource locator) is the address of a resource on the web.', ar: 'عنوان URL (محدد الموارد الموحد) هو عنوان مورد على الويب.' },
    ],
    [['Cloud computing', 'الحوسبة السحابية'], ['URL', 'عنوان URL'], ['VPN', 'شبكة افتراضية خاصة']],
    { en: 'Exam tip: discuss impact on individuals AND organisations — they are different.', ar: 'نصيحة للامتحان: ناقش الأثر على الأفراد وعلى المؤسسات — فهما مختلفان.' }),

  L('emerging', 'A', [58, 61], ['A.P1', 'A.D1'],
    { en: 'Emerging technologies', ar: 'التقنيات الناشئة' },
    { en: 'New technologies change what organisations can do and what stakeholders expect.', ar: 'التقنيات الجديدة تغيّر ما تستطيع المؤسسات فعله وما يتوقعه أصحاب المصلحة.' },
    [
      { en: 'Developments in digital devices (wearables, smart home, robotics), in networks (5G, faster Wi-Fi) and in data modelling (analysis of large data sets).', ar: 'تطورات في الأجهزة (القابلة للارتداء، المنزل الذكي، الروبوتات)، والشبكات (5G وWi-Fi أسرع)، والنمذجة واستجواب البيانات (تحليل البيانات الكبيرة).' },
      { en: 'Virtualisation creates a virtual version of a device or resource; containerisation separates applications while sharing the host OS.', ar: 'المحاكاة الافتراضية تنشئ نسخة افتراضية من جهاز أو مورد؛ والنقل بالحاويات يفصل التطبيقات مع مشاركة نظام تشغيل المضيف.' },
      { en: 'An early adopter buys the newest technology as soon as it is available — risk: higher cost and teething problems.', ar: 'المتبني المبكر يشتري أحدث التقنيات فور توفرها — والمخاطرة: تكلفة أعلى ومشكلات البداية.' },
    ],
    [['Virtualisation', 'المحاكاة الافتراضية'], ['Containerisation', 'النقل بالحاويات'], ['Early adopter', 'المتبني المبكر']],
    { en: 'Exam tip (A.D1): evaluate = weigh benefits vs drawbacks and reach a judgement.', ar: 'نصيحة (A.D1): قيّم = وازن بين الفوائد والعيوب وانتهِ بحكم.' }),

  L('data-info', 'B', [62, 66], ['B.P4', 'B.P5'],
    { en: 'Data and information in organisations', ar: 'البيانات والمعلومات في المؤسسة' },
    { en: 'Data are raw facts; information is data given meaning. Different levels of an organisation need different information.', ar: 'البيانات حقائق خام؛ والمعلومات هي بيانات أُعطيت معنى. وتحتاج مستويات المؤسسة معلومات مختلفة.' },
    [
      { en: 'Operational level: day-to-day work (stock levels, job lists). Tactical level: medium-term planning. Strategic level: long-term direction (e.g. cash flow, growth).', ar: 'المستوى التشغيلي: العمل اليومي (المخزون، قوائم المهام). التكتيكي: تخطيط متوسط المدى. الاستراتيجي: التوجه بعيد المدى (مثل التدفق النقدي والنمو).' },
      { en: 'Data and information are used to identify requirements and create bespoke (made-to-measure) IT solutions, or to choose ready-made systems.', ar: 'تُستخدم البيانات والمعلومات لتحديد المتطلبات وابتكار حلول مخصصة، أو لاختيار أنظمة جاهزة.' },
      { en: 'Internal use = inside the organisation (payroll, schedules). External use = shared with customers, suppliers, regulators (invoices, order tracking).', ar: 'الاستخدام الداخلي = داخل المؤسسة (الرواتب، الجداول). الخارجي = مع العملاء والموردين والجهات الرقابية (الفواتير، تتبع الطلبات).' },
      { en: 'Data sources and data sets must be suitable for the task — relevant, accurate and up to date.', ar: 'يجب أن تكون مصادر البيانات ومجموعاتها مناسبة للمهمة — ذات صلة ودقيقة ومحدّثة.' },
    ],
    [['Cash flow', 'التدفق النقدي'], ['Operational', 'تشغيلي'], ['Bespoke', 'مخصَّص']],
    { en: 'Exam tip (B.P5): split your answer into internal and external uses.', ar: 'نصيحة (B.P5): قسّم إجابتك إلى استخدام داخلي وخارجي.' }),

  L('communities', 'B', [67, 74], ['B.P5', 'B.M2'],
    { en: 'Online communities', ar: 'المجتمعات عبر الإنترنت' },
    { en: 'Online communities (forums, social media, review sites, customer portals) help organisations share and gain data and information.', ar: 'المجتمعات عبر الإنترنت (منتديات، وسائل تواصل، مواقع مراجعات، بوابات عملاء) تساعد المؤسسات على مشاركة المعلومات والحصول عليها.' },
    [
      { en: 'Ways to communicate: forums, social media, messaging, video calls, wikis, crowdsourcing and customer feedback.', ar: 'طرق التواصل: منتديات، وسائل تواصل، مراسلة، مكالمات فيديو، ويكي، استعانة بالجمهور وملاحظات العملاء.' },
      { en: 'Implications for individuals: access to support and knowledge, but privacy, misinformation and netiquette (correct online behaviour) matter.', ar: 'الآثار على الأفراد: وصول للدعم والمعرفة، لكن الخصوصية والمعلومات المضللة وآداب التعامل عبر الإنترنت أمور مهمة.' },
      { en: 'Implications for organisations: marketing reach and feedback, but reputation risk and the need to moderate and integrate or replace existing systems.', ar: 'الآثار على المؤسسات: انتشار تسويقي وملاحظات، لكن مخاطر السمعة والحاجة للإشراف والتكامل مع الأنظمة الحالية أو استبدالها.' },
    ],
    [['Netiquette', 'آداب التعامل عبر الإنترنت'], ['Crowdsourcing', 'الاستعانة بالجمهور']],
    { en: 'Exam tip (B.M2): analyse with "this means… which leads to…" chains.', ar: 'نصيحة (B.M2): حلّل بسلاسل "هذا يعني… مما يؤدي إلى…".' }),

  L('processing', 'B', [75, 84], ['B.P4', 'B.M2'],
    { en: 'Using and processing data', ar: 'استخدام البيانات ومعالجتها' },
    { en: 'Good decisions need reliable data that has been collected, checked, processed and presented well.', ar: 'القرارات الجيدة تحتاج بيانات موثوقة جُمعت وفُحصت وعولجت وعُرضت جيداً.' },
    [
      { en: 'Sources: primary (collected yourself — surveys, interviews, observation) and secondary (collected by others). Judge reliability by source, date and method.', ar: 'المصادر: أولية (تجمعها بنفسك — استبيانات، مقابلات، ملاحظة) وثانوية (جمعها آخرون). احكم على الموثوقية بالمصدر والتاريخ والطريقة.' },
      { en: 'Accuracy methods: validation (is it sensible?), verification (is it what was intended?), input masks, data cleansing. Databases store organised data.', ar: 'طرق الدقة: التحقق من المعقولية (validation)، التحقق من المطابقة (verification)، أقنعة الإدخال، تطهير البيانات. وقواعد البيانات تنظم البيانات.' },
      { en: 'Processing: extracting, sorting and filtering data; numerical and graphical modelling (spreadsheets, charts, depreciation calculations).', ar: 'المعالجة: استخراج البيانات وفرزها وتصفيتها؛ نمذجة عددية وبيانية (جداول، مخططات، حساب الاستهلاك).' },
      { en: 'Presenting results: choose a user interface and format (tables, charts, reports, dashboards) that suits the audience.', ar: 'عرض النتائج: اختر واجهة وتنسيقاً (جداول، مخططات، تقارير، لوحات) يناسب الجمهور.' },
    ],
    [['Data cleansing', 'تطهير البيانات'], ['Input mask', 'قناع الإدخال'], ['Database', 'قاعدة البيانات'], ['Depreciation', 'الاستهلاك']],
    { en: 'Exam tip: remember validation checks the data is reasonable, not that it is correct.', ar: 'نصيحة للامتحان: الـ validation يتحقق أن البيانات معقولة، لا أنها صحيحة.' }),

  L('threats', 'C', [85, 87], ['C.P6', 'C.M3'],
    { en: 'Threats to data, information and systems', ar: 'التهديدات للبيانات والمعلومات والأنظمة' },
    { en: 'Threats can be internal (from inside the organisation) or external, accidental or deliberate.', ar: 'قد تكون التهديدات داخلية (من داخل المؤسسة) أو خارجية، عرضية أو متعمدة.' },
    [
      { en: 'External: malware (viruses, ransomware, spyware), hacking, phishing, denial-of-service, theft. Internal: human error, careless sharing, weak passwords, disgruntled staff.', ar: 'خارجية: برامج ضارة (فيروسات، فدية، تجسس)، اختراق، تصيد، حجب الخدمة، سرقة. داخلية: خطأ بشري، مشاركة مهملة، كلمات مرور ضعيفة، موظف ساخط.' },
      { en: 'Impact on individuals: identity theft, financial loss, privacy loss, stress.', ar: 'الأثر على الأفراد: سرقة هوية، خسارة مالية، فقدان خصوصية، توتر.' },
      { en: 'Impact on organisations: downtime, lost data, fines, reputation damage, lost customers.', ar: 'الأثر على المؤسسات: توقف العمل، فقد البيانات، غرامات، ضرر للسمعة، فقد العملاء.' },
    ],
    [['Malware', 'البرامج الضارة'], ['Phishing', 'التصيد'], ['Ransomware', 'برنامج الفدية']],
    { en: 'Exam tip (C.P6): describe both internal and external threats.', ar: 'نصيحة (C.P6): صِف التهديدات الداخلية والخارجية معاً.' }, 'rack'),

  L('protection', 'C', [88, 90], ['C.P7'],
    { en: 'Protecting data and systems', ar: 'حماية البيانات والأنظمة' },
    { en: 'Protection uses layers: technical measures, procedures and trained people.', ar: 'تعتمد الحماية على طبقات: إجراءات تقنية وإجرائية وأشخاص مدربين.' },
    [
      { en: 'Technical: firewalls (filter traffic between networks), encryption (scramble data), antivirus, access control and strong passwords, backups and updates.', ar: 'تقنية: جدران الحماية (تصفية الحركة بين الشبكات)، التشفير، مضاد الفيروسات، التحكم في الوصول وكلمات المرور القوية، النسخ الاحتياطي والتحديثات.' },
      { en: 'Procedures: access rights by role, backup schedules, incident response, staff training and clear policies.', ar: 'إجرائية: صلاحيات بحسب الدور، جداول نسخ احتياطي، الاستجابة للحوادث، تدريب الموظفين وسياسات واضحة.' },
      { en: 'A router moves data between networks; a firewall decides what traffic is allowed.', ar: 'الراوتر ينقل البيانات بين الشبكات؛ وجدار الحماية يقرر أي حركة مسموحة.' },
    ],
    [['Firewall', 'جدار الحماية'], ['Router', 'جهاز التوجيه'], ['Encryption', 'التشفير']],
    { en: 'Exam tip (C.P7): for every control say what threat it reduces.', ar: 'نصيحة (C.P7): لكل إجراء حماية اذكر التهديد الذي يخففه.' }, 'network'),

  L('ethics-legal', 'C', [91, 99], ['C.P8', 'C.M4'],
    { en: 'Ethical, legal and behavioural issues', ar: 'المسائل الأخلاقية والقانونية والسلوكية' },
    { en: 'Organisations must use IT legally, ethically and responsibly.', ar: 'يجب على المؤسسات استخدام IT بصورة قانونية وأخلاقية ومسؤولة.' },
    [
      { en: 'Ethics = principles of right and wrong behaviour. Netiquette applies to forums and emails. Acceptable-use policies tell staff what they may do.', ar: 'الأخلاق = مبادئ السلوك الصحيح والخاطئ. وآداب الإنترنت تنطبق على المنتديات والبريد. وسياسات الاستخدام المقبول تحدد ما يسمح للموظفين بفعله.' },
      { en: 'Legal: data protection and privacy law, computer misuse law, copyright, health and safety, equality. Laws differ by country — organisations must follow the ones that apply to them.', ar: 'قانونية: حماية البيانات والخصوصية، إساءة استخدام الحاسوب، حقوق النشر، الصحة والسلامة، المساواة. وتختلف القوانين بين الدول.' },
      { en: 'Health and safety: ergonomics, safe cabling, screen breaks, safe handling of equipment.', ar: 'الصحة والسلامة: بيئة العمل المريحة، كابلات آمنة، فواصل الشاشة، التعامل الآمن مع المعدات.' },
    ],
    [['Ethics', 'الأخلاق'], ['Netiquette', 'آداب التعامل عبر الإنترنت']],
    { en: 'Exam tip (C.P8): legal = must by law; ethical = should as a matter of right and wrong.', ar: 'نصيحة (C.P8): قانوني = إلزام بالقانون؛ أخلاقي = ما ينبغي بحكم الصواب والخطأ.' }),

  L('codes', 'C', [97, 104], ['C.P8', 'C.M4', 'BC.D3'],
    { en: 'Codes of practice, IP and managing IT', ar: 'قواعد الممارسة والملكية الفكرية وإدارة IT' },
    { en: 'Professional codes, intellectual property and good management keep IT use safe and fair.', ar: 'القواعد المهنية والملكية الفكرية والإدارة الجيدة تُبقي استخدام IT آمناً وعادلاً.' },
    [
      { en: 'Codes of practice are rules agreed by a professional body about how people in a profession should behave (e.g. the Hippocratic oath in medicine).', ar: 'قواعد الممارسة مجموعات قواعد وافقت عليها هيئة مهنية حول كيفية تصرف العاملين في مهنة ما (مثل قسم أبقراط في الطب).' },
      { en: 'Intellectual property (IP) means creations of the mind — inventions, writing, designs, logos, names and images used in business — protected by copyright, patents and trademarks.', ar: 'الملكية الفكرية: إبداعات العقل من اختراعات ومصنفات وتصاميم وشعارات وأسماء وصور تُستخدم في التجارة — وتحميها حقوق النشر وبراءات الاختراع والعلامات التجارية.' },
      { en: 'Management of infrastructure, data and users: asset management (recording every asset the organisation is responsible for), user accounts and permissions, monitoring, updates and disposal.', ar: 'إدارة البنية والبيانات والمستخدمين: إدارة الأصول (تسجيل كل أصل تتحمل المؤسسة مسؤوليته)، حسابات وصلاحيات، مراقبة، تحديثات والتخلص الآمن.' },
      { en: 'To justify policy decisions (BC.D3) explain WHY you chose each rule, what alternatives existed and the impact on the business and its stakeholders.', ar: 'لتبرير قرارات السياسة (BC.D3) اشرح لماذا اخترت كل قاعدة وما البدائل وأثرها على الشركة وأصحاب المصلحة.' },
    ],
    [['Code of practice', 'قواعد الممارسة'], ['Intellectual property', 'الملكية الفكرية'], ['Asset management', 'إدارة الأصول']],
    { en: 'Exam tip: a policy needs purpose, scope, rules, responsibilities and consequences.', ar: 'نصيحة للامتحان: السياسة تحتاج غرضاً ونطاقاً وقواعد ومسؤوليات وعواقب.' }),
];

export const LESSONS = bookSummary.map((item, idx) => {
  const id = `lesson-${idx + 1}`;
  const pParts = String(item.pages || '21').split('-').map((x) => parseInt(x, 10) || 21);
  const pages = pParts.length === 2 ? pParts : [pParts[0], pParts[0]];
  const outcome = idx < 11 ? 'A' : idx === 11 ? 'C' : 'B';
  const criteria = outcome === 'A' ? ['A.P1', 'A.M1', 'A.D1'] : outcome === 'B' ? ['B.P3', 'B.M2'] : ['C.P5', 'C.M3'];
  const points = (item.items || []).map((arr) => ({
    ar: Array.isArray(arr) ? arr[0] : String(arr),
    en: Array.isArray(arr) ? arr[0] : String(arr),
  }));
  return {
    id,
    outcome,
    pages,
    criteria,
    title: { ar: item.title, en: `${item.topic} — ${item.title}` },
    summary: { ar: `${item.idea} — ${item.text}`, en: `${item.idea} — ${item.text}` },
    idea: item.idea,
    text: item.text,
    topic: item.topic,
    topicAr: item.topicAr,
    points,
    terms: [[item.topic || 'IT Concept', item.topicAr || item.title]],
    tip: {
      ar: `الفكرة الرئيسة (${item.topicAr} - ص ${item.pages}): ${item.idea}`,
      en: `Core takeaway (${item.topic} - p. ${item.pages}): ${item.idea}`,
    },
    model: null,
  };
});

export const LESSON_BY_ID = Object.fromEntries([
  ...LEGACY_LESSONS.map((l) => [l.id, l]),
  ...LESSONS.map((l) => [l.id, l]),
]);
