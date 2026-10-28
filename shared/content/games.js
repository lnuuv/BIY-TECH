import { SHORTCUT_CATEGORIES, SHORTCUTS } from './shortcuts.js';

const CORE_PAIRS = [
  ['RAM', 'Temporary fast memory for running programs', 'ذاكرة سريعة مؤقتة لتشغيل البرامج'],
  ['SSD', 'Storage with no moving parts', 'تخزين بلا أجزاء متحركة'],
  ['Router', 'Connects different networks together', 'يربط شبكات مختلفة معاً'],
  ['Switch', 'Connects devices inside a LAN', 'يربط الأجهزة داخل شبكة محلية'],
  ['DNS', 'Turns names into IP addresses', 'يحوّل الأسماء إلى عناوين IP'],
  ['DHCP', 'Gives IP addresses automatically', 'يمنح عناوين IP تلقائياً'],
  ['Firewall', 'Filters traffic by rules', 'يصفّي الحركة وفق قواعد'],
  ['Encryption', 'Scrambles data so only key-holders can read it', 'يشوّش البيانات فلا يقرؤها إلا حامل المفتاح'],
  ['Latency', 'Delay before data arrives', 'التأخير قبل وصول البيانات'],
  ['Bandwidth', 'How much data a link can carry', 'كمية البيانات التي يحملها الاتصال'],
  ['Phishing', 'Fake message that tricks you into giving details', 'رسالة مزيفة لخداعك لتعطي بياناتك'],
  ['Intranet', 'Internal-only website', 'موقع داخلي فقط'],
].map(([term, en, ar], i) => ({ id: `core-${i}`, term, en, ar }));

export const PAIRS = [...CORE_PAIRS, ...SHORTCUTS.map((shortcut) => ({
  id: `shortcut-${shortcut.id}`,
  term: shortcut.code,
  en: shortcut.full,
  ar: shortcut.ar,
}))];

const CORE_SPRINT = [
  ['Which component is the “brain” of the computer?', 'ما مكون الحاسوب الذي يُعد "العقل"؟', 'CPU', ['CPU', 'PSU', 'RAM', 'GPU']],
  ['Which part supplies power to all components?', 'أي قطعة تغذي كل المكونات بالطاقة؟', 'PSU', ['GPU', 'PSU', 'SSD', 'NIC']],
  ['Which handles graphics and 3D?', 'أي قطعة تعالج الرسوميات وثلاثي الأبعاد؟', 'GPU', ['GPU', 'DNS', 'RAM', 'SSD']],
  ['Which is volatile (loses data without power)?', 'أي منها متطاير (يفقد بياناته بلا طاقة)؟', 'RAM', ['SSD', 'HDD', 'RAM', 'ROM']],
  ['Which card lets a PC join a network?', 'أي بطاقة تتيح للحاسوب الانضمام لشبكة؟', 'NIC', ['NIC', 'GPU', 'CPU', 'PSU']],
  ['RJ45 is the connector for…', 'موصل RJ45 مخصص لـ…', 'Ethernet', ['DisplayPort', 'Ethernet', 'FireWire', 'Bluetooth']],
  ['Which keeps the PC cool by moving air over fins?', 'أي قطعة تبرد الجهاز بتحريك الهواء فوق الزعانف؟', 'CPU cooler', ['CPU cooler', 'CMOS battery', 'I/O shield', 'SATA cable']],
  ['Which standard moves web pages securely?', 'أي معيار ينقل صفحات الويب بأمان؟', 'HTTPS', ['IMAP4', 'HTTPS', 'SMTPS', 'DHCPv6']],
  ['Which protocol sends email?', 'أي بروتوكول يرسل البريد؟', 'SMTP', ['SMTP', 'SNMP', 'ICMP', 'POP3']],
  ['Which unit measures rack height?', 'أي وحدة تقيس ارتفاع الرف؟', 'Rack U', ['Rack U', 'Hertz', 'Decibel', 'Octet']],
  ['Which protects against sudden power loss?', 'أي جهاز يحمي من فقدان الطاقة المفاجئ؟', 'UPS', ['UPS', 'NAS', 'MFD', 'VPN']],
  ['Which creates a secure tunnel over the Internet?', 'أي تقنية تنشئ نفقاً آمناً عبر الإنترنت؟', 'VPN', ['VPN', 'LAN', 'NFC', 'CSV']],
].map(([en, ar, answer, options], i) => ({ id: `core-${i}`, q: { en, ar }, answer, options }));

export const SPRINT = [...CORE_SPRINT, ...SHORTCUTS.map((shortcut, idx) => {
  const candidates = SHORTCUTS
    .filter((item) => item.cat === shortcut.cat && item.id !== shortcut.id && item.code !== shortcut.code)
    .sort((a, b) => Math.abs(a.code.length - shortcut.code.length) - Math.abs(b.code.length - shortcut.code.length));
  const topPool = candidates.slice(0, Math.min(6, candidates.length));
  const distractors = [
    topPool[idx % topPool.length]?.code,
    topPool[(idx + 1) % topPool.length]?.code,
    topPool[(idx + 2) % topPool.length]?.code,
  ].filter(Boolean);
  const options = [shortcut.code, ...distractors];
  return {
    id: `shortcut-${shortcut.id}`,
    q: {
      en: `Which abbreviation or term means “${shortcut.full}”?`,
      ar: `أي اختصار أو مصطلح يعني «${shortcut.ar}»؟`,
    },
    answer: shortcut.code,
    options,
  };
})];

export const SORTS = {
  threats: {
    title: { en: 'Internal or external threat?', ar: 'تهديد داخلي أم خارجي؟' },
    buckets: [{ id: 'internal', en: 'Internal', ar: 'داخلي' }, { id: 'external', en: 'External', ar: 'خارجي' }],
    items: [
      ['Employee uses a weak password', 'موظف يستخدم كلمة مرور ضعيفة', 'internal'],
      ['Phishing email from a stranger', 'رسالة تصيد من شخص غريب', 'external'],
      ['Staff member loses an unencrypted USB', 'موظف يفقد فلاش غير مشفر', 'internal'],
      ['Ransomware downloaded from a website', 'برنامج فدية محمّل من موقع', 'external'],
      ['Angry ex-employee deletes files', 'موظف سابق غاضب يحذف ملفات', 'internal'],
      ['Hacker scans open ports', 'مخترق يفحص المنافذ المفتوحة', 'external'],
      ['Accidentally sharing a private folder', 'مشاركة مجلد خاص بالخطأ', 'internal'],
      ['DDoS attack on the website', 'هجوم حجب خدمة على الموقع', 'external'],
    ],
  },
  connection: {
    title: { en: 'Wired or wireless?', ar: 'سلكي أم لاسلكي؟' },
    buckets: [{ id: 'wired', en: 'Wired', ar: 'سلكي' }, { id: 'wireless', en: 'Wireless', ar: 'لاسلكي' }],
    items: [
      ['Ethernet (RJ45)', 'إيثرنت (RJ45)', 'wired'], ['Wi-Fi', 'Wi-Fi', 'wireless'], ['Fibre optic', 'ألياف ضوئية', 'wired'],
      ['Bluetooth', 'بلوتوث', 'wireless'], ['NFC', 'NFC', 'wireless'], ['USB cable', 'كابل USB', 'wired'], ['5G mobile data', 'بيانات 5G', 'wireless'], ['HDMI cable', 'كابل HDMI', 'wired'],
    ],
  },
  io: {
    title: { en: 'Input or output?', ar: 'إدخال أم إخراج؟' },
    buckets: [{ id: 'input', en: 'Input', ar: 'إدخال' }, { id: 'output', en: 'Output', ar: 'إخراج' }],
    items: [
      ['Keyboard', 'لوحة مفاتيح', 'input'], ['Printer', 'طابعة', 'output'], ['Scanner', 'ماسح ضوئي', 'input'], ['Speakers', 'سماعات', 'output'],
      ['Microphone', 'ميكروفون', 'input'], ['Monitor', 'شاشة', 'output'], ['Webcam', 'كاميرا ويب', 'input'], ['Projector', 'جهاز عرض', 'output'],
    ],
  },
  acronyms: {
    title: { en: 'Sort the term', ar: 'صنّف المصطلح' },
    buckets: SHORTCUT_CATEGORIES.map((category) => ({
      id: category.id,
      en: ['Networks', 'Hardware', 'Software', 'Security'][category.no - 1],
      ar: ['الشبكات', 'العتاد', 'البرمجيات', 'الأمن'][category.no - 1],
    })),
    items: SHORTCUTS.map((shortcut) => [shortcut.code, shortcut.ar, shortcut.cat]),
  },
};
