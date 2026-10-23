import { SHORTCUTS } from './shortcuts.js';
import { LESSONS } from './lessons.js';

// Original practice questions (not copied from the book or the assessment).
// All 4 options in every question are engineered to have balanced character/word length
// and parallel technical phrasing in both English and Arabic so answer length is never a giveaway.
const Q = (lesson, qEn, qAr, opts, ans, eEn, eAr) => ({
  id: `${lesson}-${Math.abs([...(qEn)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7)).toString(36)}`,
  lesson,
  q: { en: qEn, ar: qAr },
  options: opts.map(([en, ar]) => ({ en, ar })),
  ans,
  exp: { en: eEn, ar: eAr },
});

const normalise = (value) => value.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ').trim();
const containsTerm = (text, term) => ` ${text} `.includes(` ${normalise(term)} `);
const CATEGORY_LESSONS = {
  networks: ['connectivity', 'networks', 'transmission', 'online'],
  hardware: ['devices', 'peripherals'],
  software: ['software', 'files', 'data-info', 'processing', 'emerging', 'online', 'communities'],
  security: ['threats', 'protection', 'ethics-legal', 'codes'],
};
const LESSON_KEYWORDS = {
  purpose: ['outsourcing', 'overheads', 'stakeholder', 'cash flow', 'infrastructure'],
  devices: ['server', 'standalone', 'mfd', 'multifunction', 'mobile', 'camera', 'gps', 'edc'],
  peripherals: ['hardware', 'firmware', 'storage', 'ssd', 'hdd', 'ram', 'rom', 'alt text', 'sd card', 'printer', 'keyboard', 'monitor'],
  software: ['operating system', 'driver', 'gui', 'cli', 'open source', 'utility', 'application', 'interface', 'wimp', 'ux'],
  files: ['file', 'format', 'compression', 'csv', 'xml', 'json', 'pdf', 'jpeg', 'png', 'mp3', 'mp4', 'zip'],
  connectivity: ['lan', 'wlan', 'wan', 'pan', 'wpan', 'man', 'broadband', 'bandwidth', 'ethernet', 'wifi', 'bluetooth', 'nfc', '5g', 'connectivity'],
  networks: ['router', 'switch', 'vlan', 'vpn', 'dhcp', 'dns', 'ip address', 'intranet', 'extranet', 'nas', 'san'],
  transmission: ['tcp', 'udp', 'http', 'ftp', 'smtp', 'pop3', 'imap', 'voip', 'latency', 'protocol', 'icmp', 'snmp', 'ntp'],
  online: ['cloud', 'url', 'internet', 'vpn', 'api', 'remote', 'saas', 'web'],
  emerging: ['virtualisation', 'container', 'iot', 'artificial intelligence', 'machine learning', 'ar', 'vr', '5g', 'robot', 'wearable'],
  'data-info': ['data', 'information', 'database', 'dbms', 'crm', 'erp', 'cash flow', 'business intelligence'],
  communities: ['community', 'social', 'netiquette', 'crowdsourcing', 'forum', 'wiki'],
  processing: ['sql', 'validation', 'verification', 'cleansing', 'input mask', 'data', 'csv', 'depreciation', 'spreadsheet', 'database'],
  threats: ['malware', 'virus', 'phishing', 'ransomware', 'attack', 'threat', 'dos', 'ddos', 'spyware', 'hacker'],
  protection: ['firewall', 'encryption', 'backup', 'mfa', 'authentication', 'security', 'vpn', 'antivirus', 'patch', 'access control'],
  'ethics-legal': ['ethic', 'privacy', 'law', 'gdpr', 'dpa', 'cma', 'misuse', 'legal', 'copyright', 'intellectual property'],
  codes: ['aup', 'sla', 'ola', 'nda', 'bcp', 'drp', 'rto', 'rpo', 'bia', 'code of practice', 'asset management'],
};

function lessonIdsForShortcut(shortcut) {
  const text = normalise([shortcut.code, shortcut.full, shortcut.ar, shortcut.desc.en, shortcut.desc.ar].join(' '));
  const matched = LESSONS.filter((lesson) => {
    const terms = lesson.terms.flatMap(([en, ar]) => [en, ar]).map(normalise);
    if (terms.some((term) => term.length > 3 && containsTerm(text, term))) return true;
    return (LESSON_KEYWORDS[lesson.id] || []).some((keyword) => containsTerm(text, keyword));
  }).map((lesson) => lesson.id);
  return matched.length ? matched : CATEGORY_LESSONS[shortcut.cat] || [];
}

export const SHORTCUT_QUESTIONS = SHORTCUTS.map((shortcut, idx) => {
  const lessonIds = lessonIdsForShortcut(shortcut);
  const candidates = SHORTCUTS
    .filter((item) => item.cat === shortcut.cat && item.id !== shortcut.id && item.full !== shortcut.full)
    .sort((a, b) => {
      const da = Math.abs(a.full.length - shortcut.full.length) + Math.abs(a.ar.length - shortcut.ar.length);
      const db = Math.abs(b.full.length - shortcut.full.length) + Math.abs(b.ar.length - shortcut.ar.length);
      return da - db;
    });
  // Select 3 length-matched distractors from the closest 6 candidates in the same category
  const topPool = candidates.slice(0, Math.min(6, candidates.length));
  const distractors = [
    topPool[idx % topPool.length],
    topPool[(idx + 1) % topPool.length],
    topPool[(idx + 2) % topPool.length],
  ].filter(Boolean);
  const choices = [
    { en: shortcut.full, ar: shortcut.ar },
    ...distractors.map((item) => ({ en: item.full, ar: item.ar })),
  ];
  return {
    id: `shortcut-${shortcut.id}`,
    code: shortcut.code,
    shortcutId: shortcut.id,
    lesson: lessonIds[0] || null,
    lessonIds,
    q: {
      en: `What does ${shortcut.code} mean?`,
      ar: `ما معنى ${shortcut.code}؟`,
    },
    options: choices,
    ans: 0,
    exp: shortcut.desc,
  };
});

export const QUESTIONS = [
  Q('purpose', 'Which of these is part of the infrastructure an IT system needs to run?', 'أي مما يلي جزء من البنية الأساسية اللازمة لتشغيل نظام IT؟',
    [
      ['Electricity, equipment and trained staff', 'الكهرباء والمعدات والموظفون المدربون'],
      ['Marketing campaigns and brand logos', 'الحملات التسويقية وشعارات العلامة'],
      ['Office desks, curtains and carpets', 'المكاتب والستائر والسجاد المكتبي'],
      ['Annual sales targets and bonuses', 'أهداف المبيعات السنوية والمكافآت'],
    ], 0,
    'IT infrastructure covers power, hardware, software and people who can operate them.', 'تشمل البنية الأساسية الطاقة والعتاد والبرامج والأشخاص القادرين على تشغيلها.'),
  Q('purpose', 'A company hires an outside firm to manage its IT. This is called…', 'شركة تستأجر شركة خارجية لإدارة IT لديها. هذا يسمى…',
    [
      ['Overheads', 'النفقات العامة'],
      ['Outsourcing', 'الاستعانة بمصادر خارجية'],
      ['Virtualisation', 'المحاكاة الافتراضية'],
      ['Crowdsourcing', 'التعهيد الجماعي'],
    ], 1,
    'Outsourcing = using external specialists to do a function.', 'الاستعانة بمصادر خارجية = استخدام متخصصين من خارج المؤسسة لتنفيذ وظيفة.'),
  Q('devices', 'Which device can print, scan and copy?', 'أي جهاز يمكنه الطباعة والمسح والنسخ؟',
    [
      ['Network attached storage (NAS)', 'وحدة تخزين شبكية مرفقة (NAS)'],
      ['Uninterruptible power supply (UPS)', 'مزود طاقة غير منقطع (UPS)'],
      ['Multifunction device (MFD)', 'جهاز متعدد الوظائف (MFD)'],
      ['Dedicated network switch (LAN)', 'محول شبكة محلية مخصص (LAN)'],
    ], 2,
    'An MFD / all-in-one combines several office functions.', 'الجهاز متعدد الوظائف يجمع عدة وظائف مكتبية.'),
  Q('devices', 'Why would a company use a server?', 'لماذا تستخدم الشركة خادماً (server)؟',
    [
      ['To replace all desktop monitors and keyboards', 'لاستبدال جميع الشاشات ولوحات المفاتيح المكتبية'],
      ['To design printed brochures without software', 'لتصميم المطبوعات الورقية بدون أي برامج'],
      ['To cool the office building during summer', 'لتبريد مبنى المكتب خلال فصل الصيف'],
      ['To share files and applications between users', 'لمشاركة الملفات والتطبيقات بين المستخدمين'],
    ], 3,
    'Servers provide shared resources and management on a network.', 'الخوادم توفر موارد مشتركة وإدارة على الشبكة.'),
  Q('peripherals', 'Which is an OUTPUT device?', 'أي مما يلي جهاز إخراج؟',
    [
      ['Laser printer', 'طابعة ليزر'],
      ['Flatbed scanner', 'ماسح ضوئي مسطح'],
      ['USB microphone', 'ميكروفون USB'],
      ['Mechanical keyboard', 'لوحة مفاتيح ميكانيكية'],
    ], 0,
    'Printers present results from the computer; the others send data in.', 'الطابعة تعرض نتائج الحاسوب؛ والباقي يدخل البيانات.'),
  Q('peripherals', 'Compared with an HDD, an SSD is usually…', 'مقارنةً بالقرص HDD، يكون القرص SSD عادةً…',
    [
      ['Slower at booting and heavier to carry', 'أبطأ في الإقلاع وأثقل وزناً عند الحمل'],
      ['Faster and more shock-resistant', 'أسرع وأكثر تحملاً للصدمات'],
      ['Built with spinning magnetic platters', 'مبني من أقراص مغناطيسية دوارة'],
      ['Limited to read-only optical media', 'مقتصر على الوسائط الضوئية للقراءة فقط'],
    ], 1,
    'SSDs have no moving parts, so they are faster and tougher, but cost more per GB.', 'لا تحتوي SSD على أجزاء متحركة فهي أسرع وأمتن لكنها أغلى لكل جيجابايت.'),
  Q('peripherals', 'What is firmware?', 'ما هي البرامج الثابتة (firmware)؟',
    [
      ['A cloud spreadsheet shared across offices', 'جدول بيانات سحابي مشترك بين المكاتب'],
      ['A copper cable linking switches and routers', 'كابل نحاسي يربط المحولات والموجهات'],
      ['Low-level control software built into a device', 'برمجيات تحكم منخفضة المستوى مدمجة في الجهاز'],
      ['An external drive used for weekly backups', 'قرص خارجي يُستخدم للنسخ الاحتياطي الأسبوعي'],
    ], 2,
    'Firmware lets hardware carry out instructions, e.g. in a remote control.', 'تمكّن البرامج الثابتة العتاد من تنفيذ التعليمات، مثل جهاز التحكم عن بعد.'),
  Q('software', 'What does an operating system do?', 'ماذا يفعل نظام التشغيل؟',
    [
      ['Edits marketing photos and exports vector logos', 'يحرر الصور التسويقية ويصدر الشعارات المتجهة'],
      ['Stores company backups on removable optical discs', 'يخزن النسخ الاحتياطية للشركة على أقراص ضوئية'],
      ['Translates domain names into public IP addresses', 'يترجم أسماء النطاقات إلى عناوين IP عامة'],
      ['Manages hardware and provides a platform for apps', 'يدير العتاد ويوفر منصة لتشغيل التطبيقات'],
    ], 3,
    'The OS is the platform that lets applications run on the device.', 'نظام التشغيل هو المنصة التي تتيح للتطبيقات العمل على الجهاز.'),
  Q('software', 'Antivirus and backup tools are examples of…', 'مضاد الفيروسات وأدوات النسخ الاحتياطي أمثلة على…',
    [
      ['Utility software for maintenance', 'برامج الأدوات المساعدة للصيانة'],
      ['Application software for design', 'برامج تطبيقات مخصصة للتصميم'],
      ['Embedded firmware in peripherals', 'برامج ثابتة مدمجة في الملحقات'],
      ['Relational database management', 'إدارة قواعد البيانات العلائقية'],
    ], 0,
    'Utilities maintain and protect the system.', 'الأدوات المساعدة تصون النظام وتحميه.'),
  Q('software', 'Open-source code is…', 'الكود مفتوح المصدر هو…',
    [
      ['Restricted so only the vendor can inspect or patch it', 'مقيد بحيث لا يفحصه أو يعدله إلا المورّد الأصلي'],
      ['Developed collaboratively and can be inspected and changed', 'يُطوَّر بالتعاون ويمكن فحصه وتعديله بحرية'],
      ['Distributed only as compiled trialware for thirty days', 'يُوزَّع فقط كنسخة تجريبية مغلقة لمدة ثلاثين يوماً'],
      ['Stored exclusively inside read-only motherboard chips', 'مخزن حصرياً داخل شرائح اللوحة الأم للقراءة فقط'],
    ], 1,
    'Peer review helps find and fix issues in open-source projects.', 'مراجعة الأقران تساعد في إيجاد المشكلات وإصلاحها في المشاريع المفتوحة.'),
  Q('software', 'How does a Command Line Interface (CLI) compare to a GUI for an experienced administrator?', 'كيف تقارن واجهة سطر الأوامر (CLI) بالواجهة الرسومية (GUI) لمدير نظام خبير؟',
    [
      ['CLI uses more memory and relies on WIMP icons', 'تستهلك CLI ذاكرة أكبر وتعتمد على أيقونات WIMP'],
      ['CLI requires no command syntax and suits beginners', 'لا تتطلب CLI حفظ أوامر وتناسب المبتدئين تماماً'],
      ['CLI is faster to script and uses fewer system resources', 'تعد CLI أسرع للأتمتة وتستهلك موارد نظام أقل'],
      ['CLI runs only on mobile phones and tablet devices', 'تعمل CLI فقط على الهواتف الذكية والأجهزة اللوحية'],
    ], 2,
    'CLI is lightweight and ideal for scripting repetitive tasks, though users must learn exact commands.', 'واجهة سطر الأوامر خفيفة ومثالية لأتمتة المهام، لكنها تتطلب حفظ الأوامر بدقة.'),
  Q('software', 'What is the specific role of a device driver in an IT system?', 'ما الدور المحدد لبرنامج التعريف (Device Driver) في نظام تكنولوجيا المعلومات؟',
    [
      ['It compresses user documents before cloud upload', 'يضغط مستندات المستخدم قبل رفعها إلى السحابة'],
      ['It blocks unauthorised traffic at the network edge', 'يمنع حركة المرور غير المصرح بها على حدود الشبكة'],
      ['It schedules staff shifts and tracks project budgets', 'يجدول مناوبات الموظفين ويتتبع ميزانيات المشاريع'],
      ['It translates OS instructions for a hardware device', 'يترجم تعليمات نظام التشغيل لجهاز عتاد محدد'],
    ], 3,
    'Device drivers act as the translator between the operating system and attached hardware.', 'يعمل برنامج التعريف كمترجم بين نظام التشغيل وقطعة العتاد المتصلة.'),
  Q('files', 'Which format uses lossy compression?', 'أي تنسيق يستخدم ضغطاً مع فقد؟',
    [
      ['JPG image', 'صورة JPG'],
      ['PNG image', 'صورة PNG'],
      ['ZIP archive', 'أرشيف ZIP'],
      ['CSV table', 'جدول CSV'],
    ], 0,
    'JPG discards some detail to get smaller files.', 'يتخلص JPG من بعض التفاصيل للحصول على ملفات أصغر.'),
  Q('files', 'A CSV file is best described as…', 'يوصف ملف CSV بأنه…',
    [
      ['A compressed video stream for online broadcasts', 'تدفق فيديو مضغوط للبث المباشر عبر الإنترنت'],
      ['Plain text with comma-separated data fields', 'نص عادي بحقول بيانات مفصولة بفواصل'],
      ['An encrypted archive requiring a private key', 'أرشيف مشفر يتطلب مفتاحاً خاصاً لفتحه'],
      ['A proprietary vector format for print layouts', 'تنسيق متجهي احتكاري لتصميم المطبوعات'],
    ], 1,
    'CSV is simple and many systems can import and export it.', 'CSV بسيط وتستطيع أنظمة كثيرة استيراده وتصديره.'),
  Q('connectivity', 'Which is a short-range wireless method often used for contactless payment?', 'أي طريقة لاسلكية قصيرة المدى تُستخدم غالباً في الدفع بدون تلامس؟',
    [
      ['Fibre optic link', 'وصلة ألياف ضوئية'],
      ['Wide area network', 'شبكة واسعة النطاق'],
      ['Near-field communication (NFC)', 'الاتصال قريب المدى (NFC)'],
      ['High-definition multimedia (HDMI)', 'وسائط متعددة عالية الوضوح (HDMI)'],
    ], 2,
    'NFC = near-field communication.', 'NFC = الاتصال قريب المدى.'),
  Q('connectivity', 'Main advantage of wired over wireless connections:', 'الميزة الرئيسة للاتصال السلكي مقارنة باللاسلكي:',
    [
      ['Allows users to roam freely across the city', 'يتيح للمستخدمين التجول بحرية في أنحاء المدينة'],
      ['Requires no physical ports or network switches', 'لا يتطلب منافذ مادية أو محولات شبكة محلية'],
      ['Eliminates all installation and hardware costs', 'يلغي جميع تكاليف التركيب والعتاد تماماً'],
      ['Usually more stable, faster and harder to intercept', 'غالباً أكثر استقراراً وأسرع وأصعب في الاعتراض'],
    ], 3,
    'Cables avoid interference and are harder to intercept, but reduce mobility.', 'الكابلات تتجنب التداخل ويصعب اعتراضها لكنها تقلل الحركة.'),
  Q('networks', 'Which device connects a LAN to the Internet and moves data between networks?', 'أي جهاز يربط الشبكة المحلية بالإنترنت وينقل البيانات بين الشبكات؟',
    [
      ['Network router', 'الراوتر (الموجه)'],
      ['Layer-2 switch', 'السويتش (المحول)'],
      ['Passive network hub', 'المجمع الشبكي (Hub)'],
      ['Patch panel frame', 'لوحة التوصيل (Patch)'],
    ], 0,
    'Switches work inside a network, routers connect different networks.', 'السويتش يعمل داخل الشبكة، والراوتر يربط شبكات مختلفة.'),
  Q('networks', 'An intranet is…', 'الإنترانت هو…',
    [
      ['A public search engine open to any web visitor', 'محرك بحث عام متاح لأي زائر عبر الويب'],
      ['An internal website for an organisation\'s users', 'موقع داخلي مخصص لمستخدمي المؤسسة فقط'],
      ['A high-speed fibre cable linking two cities', 'كابل ألياف ضوئية عالي السرعة يربط مدينتين'],
      ['A cellular network used for mobile voice calls', 'شبكة خلوية تُستخدم للمكالمات الصوتية المتنقلة'],
    ], 1,
    'Access is limited to internal users; an extranet extends it to authorised outsiders.', 'الوصول مقصور على المستخدمين الداخليين؛ والإكسترانت يمدده لخارجيين مصرح لهم.'),
  Q('networks', 'In a star topology, what happens if one cable fails?', 'في التوبولوجيا النجمية، ماذا يحدث إذا تعطل كابل واحد؟',
    [
      ['Every workstation in the building loses network access', 'يفقد كل جهاز في المبنى الاتصال بالشبكة فوراً'],
      ['All data traffic reroutes through the printer cable', 'تتحول حركة البيانات كلها عبر كابل الطابعة'],
      ['Only the device on that cable loses connection', 'يفقد الاتصال الجهاز الموصول بذلك الكابل فقط'],
      ['The central switch automatically wipes its memory', 'يمسح المحول المركزي ذاكرته تلقائياً بالكامل'],
    ], 2,
    'Each device has its own link to the central switch.', 'لكل جهاز وصلته الخاصة بالسويتش المركزي.'),
  Q('transmission', 'DNS is used to…', 'يُستخدم DNS من أجل…',
    [
      ['Encrypt confidential email attachments in transit', 'تشفير مرفقات البريد الإلكتروني السرية أثناء النقل'],
      ['Compress high-definition video streams for web use', 'ضغط تدفقات الفيديو عالية الدقة للاستخدام عبر الويب'],
      ['Block unauthorised incoming packets at the router', 'حجب الحزم الواردة غير المصرح بها عند الموجه'],
      ['Translate domain names into numerical IP addresses', 'تحويل أسماء النطاقات إلى عناوين IP رقمية'],
    ], 3,
    'DNS lets you type a name instead of remembering numbers.', 'يتيح DNS كتابة اسم بدلاً من حفظ أرقام.'),
  Q('transmission', 'High latency causes…', 'زمن الاستجابة العالي يسبب…',
    [
      ['Delay or lag in online games and video calls', 'تأخراً أو تقطعاً في الألعاب ومكالمات الفيديو'],
      ['Higher screen resolution on desktop monitors', 'دقة عرض أعلى على شاشات الحواسيب المكتبية'],
      ['Greater permanent storage capacity on SSDs', 'سعة تخزين دائمة أكبر على أقراص SSD'],
      ['Stronger encryption keys for wireless routers', 'مفاتيح تشفير أقوى لموجهات الشبكة اللاسلكية'],
    ], 0,
    'Latency is the delay before data arrives; bandwidth is how much can flow.', 'زمن الاستجابة هو تأخير وصول البيانات؛ والنطاق هو الكمية التي تتدفق.'),
  Q('transmission', 'Which protocol is used to send email?', 'أي بروتوكول يُستخدم لإرسال البريد؟',
    [
      ['DHCP', 'DHCP'],
      ['SMTP', 'SMTP'],
      ['FTP', 'FTP'],
      ['SNMP', 'SNMP'],
    ], 1,
    'SMTP sends; POP3/IMAP receive.', 'SMTP للإرسال؛ وPOP3/IMAP للاستقبال.'),
  Q('transmission', 'DHCP automatically provides…', 'يوفر DHCP تلقائياً…',
    [
      ['Daily virus signature updates to endpoints', 'تحديثات يومية لتعريفات الفيروسات للأجهزة'],
      ['Encrypted backups of user document folders', 'نسخاً احتياطية مشفرة لمجلدات مستندات المستخدم'],
      ['IP addresses and network settings to devices', 'عناوين IP وإعدادات الشبكة للأجهزة المتصلة'],
      ['Physical surge protection during power cuts', 'حماية مادية من ارتفاع التيار أثناء الانقطاع'],
    ], 2,
    'Without DHCP each device needs a static address.', 'بدون DHCP يحتاج كل جهاز إلى عنوان ثابت.'),
  Q('online', 'A key advantage of cloud storage for a team that works in vans and offices is…', 'ميزة رئيسة للتخزين السحابي لفريق يعمل في الفانات والمكاتب هي…',
    [
      ['It operates at full speed without any Internet link', 'يعمل بكامل سرعته بدون الحاجة لأي اتصال إنترنت'],
      ['It removes the need for user authentication or MFA', 'يلغي الحاجة لمصادقة المستخدم أو التحقق متعدد العوامل'],
      ['It guarantees zero ongoing subscription overheads', 'يضمن عدم وجود أي تكاليف اشتراك دورية إطلاقاً'],
      ['Access to the same files from anywhere with Internet', 'الوصول لنفس الملفات من أي مكان يتوفر فيه إنترنت'],
    ], 3,
    'Cloud storage is accessible anywhere, but depends on connectivity.', 'التخزين السحابي متاح في أي مكان لكنه يعتمد على الاتصال.'),
  Q('online', 'Which is a drawback of cloud services?', 'ما أحد عيوب الخدمات السحابية؟',
    [
      ['Dependence on a reliable Internet connection', 'الاعتماد المستمر على اتصال إنترنت موثوق'],
      ['Inability to share documents with remote colleagues', 'عدم القدرة على مشاركة المستندات مع الزملاء عن بعد'],
      ['Requirement to build an on-site server data centre', 'ضرورة بناء مركز بيانات وخوادم محلية داخل المكتب'],
      ['Incompatibility with portable laptops and tablets', 'عدم التوافق مع الحواسيب المحمولة والأجهزة اللوحية'],
    ], 0,
    'No connection = no access. Also consider subscription costs and data location.', 'لا اتصال = لا وصول. وانتبه لتكلفة الاشتراك وموقع البيانات.'),
  Q('emerging', 'Virtualisation means…', 'تعني المحاكاة الافتراضية…',
    [
      ['Replacing all wireless links with copper Ethernet cables', 'استبدال جميع الوصلات اللاسلكية بكابلات إيثرنت نحاسية'],
      ['Creating a virtual version of a device or resource', 'إنشاء نسخة افتراضية برمجية من جهاز أو مورد'],
      ['Using only wearable headsets instead of monitors', 'استخدام النظارات القابلة للارتداء فقط بدلاً من الشاشات'],
      ['Permanently deleting legacy databases from storage', 'حذف قواعد البيانات القديمة نهائياً من وسائط التخزين'],
    ], 1,
    'One physical machine can host several virtual machines.', 'يمكن لجهاز مادي واحد استضافة عدة أجهزة افتراضية.'),
  Q('emerging', 'An "early adopter" is someone who…', 'ما المقصود بـ"المتبني المبكر"؟',
    [
      ['Refuses to upgrade systems until support ends', 'يرفض ترقية الأنظمة حتى ينتهي الدعم الفني تماماً'],
      ['Maintains legacy mainframe hardware for banks', 'يصون أجهزة الحواسيب المركزية القديمة للبنوك'],
      ['Buys new technology as soon as it is available', 'يشتري التقنية الجديدة فور توفرها في السوق'],
      ['Writes low-level device drivers for printers', 'يكتب برامج تشغيل منخفضة المستوى للطابعات'],
    ], 2,
    'Early adopters accept higher cost/risk to get the newest products.', 'يقبل المتبنون المبكرون تكلفة ومخاطر أعلى للحصول على الأحدث.'),
  Q('data-info', 'Which level of an organisation focuses on day-to-day management?', 'أي مستوى في المؤسسة يركز على الإدارة اليومية؟',
    [
      ['Strategic board level', 'المستوى الاستراتيجي'],
      ['External regulatory level', 'المستوى الرقابي الخارجي'],
      ['Shareholder advisory level', 'المستوى الاستشاري للمساهمين'],
      ['Operational management level', 'المستوى التشغيلي اليومي'],
    ], 3,
    'Operational managers need data like stock levels and job lists.', 'يحتاج المديرون التشغيليون بيانات مثل المخزون وقوائم المهام.'),
  Q('data-info', 'Which is an EXTERNAL use of information for a fitting company?', 'أي مما يلي استخدام خارجي للمعلومات لشركة تجهيز متاجر؟',
    [
      ['Sending an invoice to a customer', 'إرسال فاتورة مبيعات إلى عميل'],
      ['Updating the weekly staff rota', 'تحديث جدول مناوبات الموظفين'],
      ['Checking the internal stock list', 'مراجعة قائمة المخزون الداخلية'],
      ['Running the monthly staff payroll', 'تشغيل مسير الرواتب الشهري'],
    ], 0,
    'External use involves customers, suppliers or authorities.', 'الاستخدام الخارجي يشمل العملاء أو الموردين أو الجهات الرسمية.'),
  Q('communities', 'What is netiquette?', 'ما هي آداب التعامل عبر الإنترنت (netiquette)؟',
    [
      ['A hardware protocol for routing packets across LANs', 'بروتوكول عتاد لتوجيه الحزم عبر الشبكات المحلية'],
      ['Correct, polite behaviour in online interactions', 'السلوك الصحيح والمهذب في التعاملات عبر الإنترنت'],
      ['A malicious script that steals browser cookies', 'برمجية خبيثة تسرق ملفات تعريف الارتباط بالمتصفح'],
      ['A firewall rule that blocks external video streams', 'قاعدة جدار حماية تمنع تدفقات الفيديو الخارجية'],
    ], 1,
    'It applies to forums, social media and email.', 'تنطبق على المنتديات ووسائل التواصل والبريد.'),
  Q('communities', 'A risk for an organisation using an online community is…', 'أحد المخاطر على مؤسسة تستخدم مجتمعاً عبر الإنترنت هو…',
    [
      ['Guaranteed elimination of all marketing expenses', 'إلغاء جميع نفقات التسويق والإعلان بشكل مضمون'],
      ['Automatic doubling of server processor clock speed', 'مضاعفة سرعة معالجات الخوادم تلقائياً دون تكلفة'],
      ['Damage to reputation from negative public posts', 'تضرر سمعة المؤسسة بسبب المنشورات السلبية العلنية'],
      ['Complete removal of electricity and cooling costs', 'إلغاء تكاليف الكهرباء والتبريد في الشركة بالكامل'],
    ], 2,
    'Public feedback is powerful but hard to control.', 'الملاحظات العلنية مؤثرة لكن يصعب التحكم بها.'),
  Q('processing', 'A survey you design and run yourself gives you…', 'استبيان تصممه وتجريه بنفسك يعطيك…',
    [
      ['Secondary research data', 'بيانات بحثية ثانوية'],
      ['Embedded device firmware', 'برامج ثابتة للأجهزة'],
      ['Open-source kernel code', 'كود نواة مفتوح المصدر'],
      ['Primary first-hand data', 'بيانات أولية مباشرة'],
    ], 3,
    'Primary = collected first-hand; secondary = collected by others.', 'الأولية = تجمعها بنفسك؛ والثانوية = جمعها آخرون.'),
  Q('processing', 'An input mask in a database…', 'قناع الإدخال في قاعدة البيانات…',
    [
      ['Restricts the format or type of data that can be entered', 'يقيد تنسيق أو نوع البيانات التي يمكن إدخالها'],
      ['Hides the entire database from authorised administrators', 'يخفي قاعدة البيانات بالكامل عن المديرين المصرح لهم'],
      ['Deletes historical customer records after thirty days', 'يحذف سجلات العملاء التاريخية بعد مرور ثلاثين يوماً'],
      ['Encrypts all outgoing network traffic to the Internet', 'يشفر جميع حركة المرور الصادرة عبر شبكة الإنترنت'],
    ], 0,
    'Masks help keep data accurate and consistent.', 'تساعد الأقنعة في إبقاء البيانات دقيقة ومتسقة.'),
  Q('processing', 'Data cleansing is…', 'تطهير البيانات هو…',
    [
      ['Physically cleaning dust from server racks and fans', 'تنظيف الغبار مادياً من خزائن الخوادم والمراوح'],
      ['Regularly checking data is accurate, current and complete', 'فحص البيانات باستمرار للتأكد أنها دقيقة وحديثة وكاملة'],
      ['Erasing every table in a relational database system', 'مسح جميع الجداول في نظام قواعد البيانات العلائقية'],
      ['Copying unverified spreadsheets onto removable drives', 'نسخ جداول البيانات غير المدققة إلى أقراص خارجية'],
    ], 1,
    'Cleansing removes errors and duplicates.', 'التطهير يزيل الأخطاء والتكرار.'),
  Q('threats', 'Which is an INTERNAL threat?', 'أي مما يلي تهديد داخلي؟',
    [
      ['An external hacker scanning public firewall ports', 'مخترق خارجي يفحص منافذ جدار الحماية العامة'],
      ['A phishing email sent by an overseas cyber gang', 'رسالة تصيد مرسلة من عصابة سيبرانية خارجية'],
      ['An employee accidentally sharing a confidential file', 'موظف يشارك ملفاً سرياً خاصاً بالمؤسسة بالخطأ'],
      ['A distributed denial-of-service attack on a website', 'هجوم حجب خدمة موزع يستهدف الموقع الإلكتروني'],
    ], 2,
    'Internal threats come from people inside the organisation, accidental or deliberate.', 'التهديدات الداخلية من أشخاص داخل المؤسسة، عرضية أو متعمدة.'),
  Q('threats', 'Ransomware…', 'برنامج الفدية (ransomware)…',
    [
      ['Optimises processor clock speeds for gaming', 'يحسّن سرعة المعالج لتشغيل الألعاب الثقيلة'],
      ['Automatically backs up user folders to the cloud', 'ينسخ مجلدات المستخدم احتياطياً إلى السحابة'],
      ['Installs signed hardware drivers from the vendor', 'يثبت تعريفات العتاد الموثقة من الشركة المصنعة'],
      ['Locks or encrypts data until a ransom is paid', 'يقفل البيانات أو يشفرها حتى تُدفع فدية مالية'],
    ], 3,
    'Backups are the best recovery defence.', 'النسخ الاحتياطي أفضل دفاع للتعافي.'),
  Q('protection', 'What does a firewall do?', 'ماذا يفعل جدار الحماية؟',
    [
      ['Filters network traffic according to security rules', 'يصفّي حركة الشبكة وفق قواعد أمنية محددة'],
      ['Lowers the operating temperature of the processor', 'يخفض درجة حرارة التشغيل الخاصة بالمعالج'],
      ['Provides battery power during mains electricity cuts', 'يوفر طاقة بطارية احتياطية أثناء انقطاع الكهرباء'],
      ['Prints physical audit logs on office laser printers', 'يطبع سجلات التدقيق الورقية على طابعات الليزر'],
    ], 0,
    'It allows or blocks traffic between networks.', 'يسمح بحركة بين الشبكات أو يمنعها.'),
  Q('protection', 'Encryption protects data by…', 'يحمي التشفير البيانات عن طريق…',
    [
      ['Deleting confidential files after a single viewing', 'حذف الملفات السرية نهائياً بعد عرضها لمرة واحدة'],
      ['Converting it into code unreadable without the key', 'تحويلها إلى رموز غير مقروءة بدون مفتاح فك التشفير'],
      ['Publishing copies on a public community web forum', 'نشر نسخ منها على منتدى مجتمعي عام عبر الويب'],
      ['Reducing image resolution to save disk bandwidth', 'تقليل دقة الصور لتوفير سعة القرص وعرض النطاق'],
    ], 1,
    'Only users with the key can read it.', 'لا يقرؤها إلا من يملك المفتاح.'),
  Q('ethics-legal', 'Which statement is correct?', 'أي عبارة صحيحة؟',
    [
      ['Ethics and statutory laws are always identical in scope', 'الأخلاق والقوانين التشريعية متطابقة دائماً في النطاق'],
      ['Ethical guidelines are enforced by criminal courts', 'الإرشادات الأخلاقية تُفرض دائماً عبر المحاكم الجنائية'],
      ['Laws must be followed; ethics guide right behaviour', 'القوانين ملزمة واجبة الاتباع؛ والأخلاق توجه السلوك القويم'],
      ['Data protection laws are optional for small firms', 'قوانين حماية البيانات اختيارية للشركات الصغيرة'],
    ], 2,
    'Something can be legal but still unethical.', 'قد يكون الأمر قانونياً لكنه غير أخلاقي.'),
  Q('ethics-legal', 'An acceptable-use policy tells staff…', 'تخبر سياسة الاستخدام المقبول الموظفين…',
    [
      ['How to assemble motherboard components in a lab', 'كيفية تجميع مكونات اللوحة الأم داخل المختبر'],
      ['Their annual salary scale and holiday entitlement', 'سلم رواتبهم السنوي واستحقاقات الإجازات الرسمية'],
      ['The technical circuit diagram of the power supply', 'المخطط الكهربائي التفصيلي لمزود الطاقة في الجهاز'],
      ['What they may and may not do with company IT', 'ما يجوز وما لا يجوز فعله بأنظمة IT في الشركة'],
    ], 3,
    'It sets expectations and consequences.', 'تضع التوقعات والعواقب.'),
  Q('codes', 'Intellectual property includes…', 'تشمل الملكية الفكرية…',
    [
      ['Logos, designs, original writing and inventions', 'الشعارات والتصاميم والكتابات الأصلية والاختراعات'],
      ['Unshielded twisted-pair copper network cables', 'كابلات الشبكة النحاسية المجدولة غير المحمية'],
      ['Three-phase mains electricity distribution boards', 'لوحات توزيع الكهرباء الرئيسية ثلاثية الأطوار'],
      ['Standard laminated wooden desks and office chairs', 'المكاتب الخشبية القياسية والكراسي المكتبية'],
    ], 0,
    'They are creations of the mind used in business.', 'إبداعات العقل المستخدمة في التجارة.'),
  Q('codes', 'Asset management is…', 'إدارة الأصول هي…',
    [
      ['Hiding outdated equipment in unlabelled storage rooms', 'إخفاء المعدات القديمة في غرف تخزين غير مرقمة'],
      ['Recording every asset the organisation is responsible for', 'تسجيل وتتبع كل أصل تتحمل المؤسسة مسؤوليته'],
      ['Purchasing new laptops without checking current stock', 'شراء حواسيب محمولة جديدة دون فحص المخزون الحالي'],
      ['Writing custom source code for employee web portals', 'كتابة كود برمجي مخصص لبوابات الموظفين الإلكترونية'],
    ], 1,
    'Knowing what you own is the first step to protecting it.', 'معرفة ما تملكه أولى خطوات حمايته.'),
];

export const QUESTIONS_BY_LESSON = QUESTIONS.reduce((m, q) => ((m[q.lesson] ||= []).push(q), m), {});
export const QUIZ_BANK = [...QUESTIONS, ...SHORTCUT_QUESTIONS];
