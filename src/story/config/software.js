// Simulated software preparation for the teacher PC. Names are configurable.
// Nothing here installs anything on a real computer or contacts any real system.
const O = (en, ar) => ({ en, ar });

export const SOFTWARE_STEPS = [
  { id: 'firmware', requires: [], restart: false, mins: 2,
    title: O('Check firmware (UEFI) settings', 'فحص إعدادات البرنامج الثابت (UEFI)'),
    detail: O('Boot order: USB installer first, then the M.2 SSD. Secure Boot and TPM enabled.', 'ترتيب الإقلاع: فلاشة التنصيب أولاً ثم قرص M.2. تفعيل Secure Boot و TPM.'),
    why: O('The installer must boot first, and Windows 11 requires TPM 2.0 and Secure Boot support.', 'لازم فلاشة التنصيب تقلع أولاً، وويندوز 11 يتطلب دعم TPM 2.0 و Secure Boot.') },
  { id: 'os', requires: ['firmware'], restart: true, mins: 18,
    title: O('Install Windows 11 Education', 'تنصيب Windows 11 Education'), product: 'Windows 11 Education',
    detail: O('Clean install on the SSD, local school account, region and keyboard set to Arabic (Jordan) + English.', 'تنصيب نظيف على القرص، حساب المدرسة، المنطقة ولغة الكيبورد عربي (الأردن) + إنجليزي.'),
    why: O('Everything else runs on the operating system.', 'كل البرامج الثانية بتشتغل فوق نظام التشغيل.') },
  { id: 'drivers', requires: ['os'], restart: true, mins: 6,
    title: O('Install drivers', 'تنصيب التعريفات'),
    detail: O('Chipset, integrated graphics, Ethernet and audio drivers from the manufacturer’s package.', 'تعريفات الشيبست وكرت الشاشة المدمج والإيثرنت والصوت من حزمة الشركة المصنعة.'),
    why: O('Without the Ethernet driver the PC cannot join the lab network; without the graphics driver the resolution is wrong.', 'بدون تعريف الإيثرنت ما بيقدر الجهاز يدخل الشبكة، وبدون تعريف الشاشة الدقة بتكون غلط.') },
  { id: 'updates', requires: ['drivers'], restart: true, mins: 10,
    title: O('Apply updates (offline package)', 'تثبيت التحديثات (حزمة غير متصلة)'),
    detail: O('Cumulative and security updates from the prepared offline package.', 'التحديثات التراكمية والأمنية من حزمة التحديثات المجهزة مسبقاً.'),
    why: O('Patches close known security holes before the PC goes on the network.', 'التحديثات بتسكّر الثغرات المعروفة قبل ما الجهاز يدخل الشبكة.') },
  { id: 'security', requires: ['updates'], restart: false, mins: 3,
    title: O('Configure security protection', 'إعداد الحماية الأمنية'), product: 'Microsoft Defender',
    detail: O('Antivirus on, firewall on, standard (non-admin) student accounts, USB autorun off.', 'تفعيل مكافحة الفيروسات والجدار الناري، حسابات طلاب بصلاحيات عادية، إيقاف التشغيل التلقائي لـ USB.'),
    why: O('Students should not be able to change system settings or install software.', 'ما لازم الطلاب يقدروا يغيروا إعدادات النظام أو ينصّبوا برامج.') },
  { id: 'office', requires: ['os'], restart: false, mins: 7,
    title: O('Install Microsoft Office', 'تنصيب Microsoft Office'), product: 'Microsoft Office',
    detail: O('Word, Excel, PowerPoint for coursework (edition as licensed by the school).', 'Word و Excel و PowerPoint للواجبات (النسخة حسب ترخيص المدرسة).'),
    why: O('Most BTEC evidence is produced in these applications.', 'معظم أدلة الـ BTEC بتنعمل بهالبرامج.') },
  { id: 'exam', requires: ['security', 'drivers'], restart: false, mins: 4,
    title: O('Install the electronic Tawjihi exam system', 'تنصيب نظام امتحان التوجيهي الإلكتروني'),
    product: O('Exam client — name/version as specified by the Ministry', 'برنامج الامتحان — الاسم والإصدار حسب تعليمات الوزارة'),
    detail: O('Placeholder in this simulation. The real package, version and settings come only from the Ministry’s official instructions.', 'هذا عنصر توضيحي في المحاكاة. البرنامج الحقيقي وإصداره وإعداداته تؤخذ فقط من تعليمات الوزارة الرسمية.'),
    why: O('Exam software needs a secured, up-to-date PC with working network drivers, so it is installed after them.', 'برنامج الامتحان يحتاج جهازاً محمياً ومحدثاً وتعريف شبكة يعمل، لذلك يُنصّب بعدها.') },
];

export const SOFTWARE_CHECKS = [
  { id: 'osActive', needs: ['os'], text: O('Windows installed and running', 'ويندوز منصّب ويعمل') },
  { id: 'drv', needs: ['drivers'], text: O('Device Manager: no missing drivers', 'إدارة الأجهزة: لا تعريفات ناقصة') },
  { id: 'upd', needs: ['updates'], text: O('Security updates applied', 'التحديثات الأمنية مثبتة') },
  { id: 'sec', needs: ['security'], text: O('Antivirus and firewall on; student accounts standard', 'الحماية والجدار الناري مفعلان؛ حسابات الطلاب عادية') },
  { id: 'off', needs: ['office'], text: O('Office opens and saves a test file', 'Office يفتح ويحفظ ملف تجربة') },
  { id: 'exm', needs: ['exam'], text: O('Exam client installed (simulation placeholder)', 'برنامج الامتحان منصّب (عنصر توضيحي)') },
];
