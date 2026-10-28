// Software topic (Unit 1, learning aim A — A.P1 "Explain the ways in which software can meet the needs of an
// organisation and its stakeholders").
// Source: the Unit 1 chapter of the Arabic Pearson BTEC International Level 3 IT book, section
// "برامج الحاسوب في نظام تكنولوجيا المعلومات" (Computer software in an IT system), PDF pages 29–38
// (the same page numbering used by the lessons). Every `core` and `more` statement restates that section.
// The `org` notes apply those ideas to Leshev Outfitters using only the needs listed in the supplied assignment brief
// (W84396A, Table 1); they are clearly presented in the UI as "applying it", not as statements from the book.
const O = (en, ar) => ({ en, ar });

export const SOFTWARE_TOPIC = {
  id: 'software',
  criteria: ['A.P1', 'A.M1', 'A.D1'],
  pages: [29, 38],
  title: O('Software in an IT system', 'البرمجيات في نظام تكنولوجيا المعلومات'),
  lead: O(
    'How operating systems, user interfaces, utility software, application software, open-source and proprietary code, and file types help an organisation and its stakeholders — following the Unit 1 section "Computer software in an IT system".',
    'كيف تساعد أنظمة التشغيل وواجهات المستخدم والبرامج المساعدة وبرامج التطبيقات والكود مفتوح المصدر ومسجل الملكية وأنواع الملفات المؤسسةَ وأصحاب المصلحة فيها — وفق قسم الوحدة 1 «برامج الحاسوب في نظام تكنولوجيا المعلومات».',
  ),
  aim: O(
    'Assessment focus — A.P1: explain the ways in which software can meet the needs of an organisation and its stakeholders. For A.M1 / A.D1 go further: analyse and evaluate the impact of these choices on the organisation and its stakeholders.',
    'تركيز التقييم — A.P1: شرح الطرق التي يمكن للبرامج من خلالها تلبية احتياجات المؤسسة وأصحاب المصلحة فيها. ولـ A.M1 / A.D1 تعمّق أكثر: حلّل وقيّم أثر هذه الاختيارات على المؤسسة وأصحاب المصلحة.',
  ),
};

export const SOFTWARE_SECTIONS = [
  {
    id: 'os',
    icon: 'cube',
    pages: [29, 29],
    title: O('The operating system: the platform', 'نظام التشغيل: النظام الأساسي'),
    core: {
      summary: O(
        'The operating system (OS) is the platform that lets the programs installed on a digital device work. It contains the essential functions that act as an interface between the hardware and the software.',
        'نظام التشغيل هو النظام الأساسي الذي يمكّن البرامج المثبتة على جهاز رقمي من العمل، ويتضمن الوظائف الضرورية التي تعمل كواجهة بين الأجهزة والبرامج.',
      ),
      points: [
        O('Familiar examples: Windows (Microsoft), iOS (Apple), Android and ChromeOS — all work with graphical user interfaces (GUIs).', 'أمثلة مألوفة: Windows (مايكروسوفت) وiOS (أبل) وأندرويد وChromeOS — وكلها تعمل بواجهات المستخدم الرسومية (GUI).'),
        O('DOS (Disk Operating System) was the first and most common operating system on early computers.', 'كان DOS (نظام التشغيل على القرص) أول نظام تشغيل وأكثرها شيوعاً على أجهزة الحاسوب.'),
        O('Without an OS, application software has nothing to run on — every other software choice depends on it.', 'بدون نظام تشغيل لا تجد برامج التطبيقات ما تعمل عليه — فكل اختيار برمجي آخر يعتمد عليه.'),
      ],
    },
    more: {
      paras: [
        O('A "platform" is the operating system that enables applications or programs to run on a digital device. An "interface" is a point where two (or more) systems meet and interact; in computing it is a device or program that lets the user communicate with a computer.', '«النظام الأساسي» هو نظام التشغيل الذي يمكّن التطبيقات أو البرامج من العمل على جهاز رقمي. و«الواجهة» نقطة يلتقي فيها نظامان (أو أكثر) ويتفاعلان؛ وفي الحوسبة هي جهاز أو برنامج يمكّن المستخدم من الاتصال بالحاسوب.'),
        O('This part of the unit looks at the concepts and implications of the hardware and software that make up large and small IT systems, the relationships between them, and the impact of IT systems on individuals and organisations.', 'يتناول هذا الجزء من الوحدة مفاهيم وآثار استخدام الأجهزة والبرامج التي تشكّل أنظمة تكنولوجيا المعلومات الكبيرة والصغيرة والعلاقات بينها، وتأثير هذه الأنظمة في الأفراد والمؤسسات.'),
      ],
      org: O('Every member of staff at Leshev Outfitters needs access to IT to carry out their tasks, so each office PC, laptop or mobile device must run an operating system that supports the applications the company chooses.', 'يحتاج كل موظف في Leshev Outfitters إلى الوصول لتكنولوجيا المعلومات لتنفيذ مهامه، لذا يجب أن يعمل على كل حاسوب أو جهاز محمول نظام تشغيل يدعم التطبيقات التي تختارها الشركة.'),
      exam: O('Define the OS as the platform/interface first, then link it to the organisation: "Because staff need X, the OS must support Y".', 'عرّف نظام التشغيل أولاً كنظام أساسي وواجهة، ثم اربطه بالمؤسسة: «لأن الموظفين يحتاجون X، يجب أن يدعم نظام التشغيل Y».'),
    },
    terms: [['Platform', 'النظام الأساسي'], ['Interface', 'الواجهة'], ['GUI', 'واجهة المستخدم الرسومية']],
  },
  {
    id: 'os-types',
    icon: 'chip',
    pages: [29, 29],
    title: O('Types of operating system', 'أنواع أنظمة التشغيل'),
    core: {
      summary: O('Operating systems are designed for different jobs. The book describes five types.', 'تُصمَّم أنظمة التشغيل لمهام مختلفة، ويصف الكتاب خمسة أنواع.'),
      points: [
        O('Real-time (RTOS): processes data in real time — e.g. RTLinux, Windows CE.', 'في الوقت الفعلي (RTOS): يعالج البيانات في الوقت الحقيقي — مثل RTLinux وWindows CE.'),
        O('Embedded: built into the hardware to control a machine or device, working in the background.', 'المضمّن: مدمج في العتاد للتحكم في آلة أو جهاز، ويعمل في الخلفية.'),
        O('Single-user, single-task: runs one application at a time (e.g. a basic mobile phone).', 'مهمة فردية لمستخدم واحد: يشغّل تطبيقاً واحداً في المرة (مثل الهاتف المحمول الأساسي).'),
        O('Single-user, multitasking: several applications at once (smartphones, PCs).', 'تعدد المهام لمستخدم واحد: عدة تطبيقات في الوقت نفسه (الهواتف الذكية والحواسيب).'),
        O('Multi-user: many users run the same or different applications at the same time, e.g. Unix on a server.', 'متعدد المستخدمين: يشغّل عدة مستخدمين التطبيقات نفسها أو مختلفة في الوقت نفسه، مثل Unix على خادم.'),
      ],
    },
    more: {
      paras: [
        O('Embedded software is easy to overlook because it works in the background. Examples include bathroom mirrors with sensors that detect temperature and humidity changes and stop fogging (also available with Bluetooth); medical equipment such as pacemakers and cochlear implants; and everyday items such as cars, phones and televisions.', 'من السهل أن نغفل عن البرامج المضمّنة لأنها تؤدي مهامها في الخلفية. ومن أمثلتها مرايا الحمّام التي تحتوي على أجهزة استشعار لاكتشاف تغيّر الحرارة والرطوبة ومنع التغشية (ومتوافرة بتقنية البلوتوث)، والمعدات الطبية مثل أجهزة تنظيم ضربات القلب وزراعة القوقعة، والأدوات اليومية مثل السيارات والهواتف وأجهزة التلفزيون.'),
        O('When you use a spreadsheet, a word processor, the web and the radio on your computer at the same time, you are showing that your OS is single-user multitasking.', 'عندما تستخدم جداول البيانات ومعالجة النصوص وتصفح الإنترنت والاستماع إلى الراديو على حاسوبك في الوقت نفسه، فأنت تثبت أن نظام التشغيل لديك متعدد المهام لمستخدم واحد.'),
        O('Cloud servers let several users contribute to the same document — such as a spreadsheet — at the same time. This is multi-user operation.', 'تمكّن الخوادم السحابية عدة مستخدمين من المساهمة في المستند نفسه — مثل جدول بيانات — في الوقت نفسه، وهذا تشغيل متعدد المستخدمين.'),
      ],
      org: O('Office staff at Leshev Outfitters need single-user multitasking devices (email, records and scheduling open together). Keeping central records that the manager, the two administrators and seven fitters can all use points to a multi-user system on a server or in the cloud.', 'يحتاج موظفو المكتب في Leshev Outfitters إلى أجهزة متعددة المهام لمستخدم واحد (البريد والسجلات والجدولة مفتوحة معاً). أما الاحتفاظ بسجلات مركزية يستخدمها المدير والإداريان والفنيون السبعة معاً فيشير إلى نظام متعدد المستخدمين على خادم أو في السحابة.'),
      exam: O('Name the type, give the book example, then say which user or task in the scenario it fits.', 'سمِّ النوع، واذكر مثال الكتاب، ثم بيّن أي مستخدم أو مهمة في الحالة يناسبها.'),
    },
    terms: [['Real-time operating system (RTOS)', 'نظام التشغيل في الوقت الفعلي'], ['Embedded', 'مضمّن'], ['Multitasking', 'تعدد المهام'], ['Multi-user', 'متعدد المستخدمين']],
  },
  {
    id: 'os-role',
    icon: 'server',
    pages: [29, 30],
    title: O('The role of the operating system', 'دور نظام التشغيل'),
    core: {
      summary: O('Besides running applications, the OS manages several functions. The unit focuses on five.', 'إلى جانب تشغيل التطبيقات، يدير نظام التشغيل وظائف عدة، وتركّز الوحدة على خمس منها.'),
      points: [
        O('Networking: a network operating system (NOS) controls access to resources and devices on a network — remote print management, user management, file backup.', 'الشبكات: يتحكم نظام تشغيل الشبكات (NOS) في الوصول إلى الموارد والأجهزة على الشبكة — إدارة الطباعة عن بُعد، وإدارة المستخدمين، والنسخ الاحتياطي للملفات.'),
        O('Security: continuous checks for attacks on the system and its programs.', 'الأمان: فحوصات مستمرة للهجمات على النظام وبرامجه.'),
        O('Memory management: there must be enough memory for the OS and the applications\' work.', 'إدارة الذاكرة: يجب أن تكون هناك ذاكرة كافية لنظام التشغيل ولعمل التطبيقات.'),
        O('Multitasking: each process gets a small share of processor time in turn.', 'تعدد المهام: تحصل كل عملية على حصة صغيرة من وقت المعالج بالتناوب.'),
        O('Device drivers: the OS manages peripherals (e.g. printers) through drivers.', 'برامج تشغيل الأجهزة: يدير نظام التشغيل الأجهزة الطرفية (مثل الطابعات) عبر برامج التشغيل.'),
      ],
    },
    more: {
      paras: [
        O('Security: the OS collects data that is analysed and combined into large amounts of information about the health of the IT system. Software manufacturers combine this data to help fight cyber-attacks, and to develop new software or adapt existing software to make it more secure.', 'الأمان: يجمع نظام التشغيل بيانات تُحلَّل وتُجمَّع لتشكيل كميات كبيرة من المعلومات عن صحة نظام تكنولوجيا المعلومات. ويجمع مصنعو البرامج هذه البيانات للمساعدة على مكافحة الهجمات الإلكترونية، ولتطوير برامج جديدة أو تكييف البرامج الحالية لتكون أكثر أماناً.'),
        O('Memory: the larger the IT system, the more memory is needed to run all its functions. That is why multi-user operating systems run from a server (or a group of servers); otherwise the computers would not work efficiently.', 'الذاكرة: كلما زاد حجم نظام تكنولوجيا المعلومات زادت الذاكرة اللازمة لتشغيل جميع وظائفه، ولهذا تعمل أنظمة التشغيل متعددة المستخدمين من خادم (أو مجموعة خوادم)، وإلا فشلت الحواسيب في العمل بكفاءة.'),
        O('Multitasking: a personal computer can really only do one thing at a time. The OS gives each process a small amount of processor time in turn, so quickly that it appears to do everything at once. The downside: processing power and memory are limited, so things slow down when many applications run together. The OS also reports system information such as remaining storage or battery life.', 'تعدد المهام: يستطيع الحاسوب الشخصي في الواقع فعل شيء واحد فقط في كل مرة، فيمنح نظام التشغيل كل عملية كمية صغيرة من وقت المعالج بالتناوب وبسرعة كبيرة تجعله يبدو كأنه يفعل كل شيء معاً. والجانب السلبي أن قوة المعالجة والذاكرة محدودتان فتبدأ الأمور بالتباطؤ عند تشغيل تطبيقات كثيرة معاً. كما يوفّر نظام التشغيل معلومات عن النظام مثل مساحة التخزين المتبقية أو عمر البطارية.'),
        O('A driver is a routine program used to operate peripherals such as screens and keyboards.', 'برنامج التشغيل (Driver) برنامج روتيني يُستخدم لتشغيل الأجهزة الطرفية مثل الشاشات ولوحات المفاتيح.'),
      ],
      org: O('A NOS with user management and file backup lets Leshev Outfitters control who can open staff and customer records and protect them; shared printing can be managed remotely for the office and reception.', 'يتيح نظام تشغيل شبكات بإدارة المستخدمين والنسخ الاحتياطي لـ Leshev Outfitters التحكم في من يفتح سجلات الموظفين والعملاء وحمايتها، ويمكن إدارة الطباعة المشتركة عن بُعد للمكتب والاستقبال.'),
      exam: O('For each role, give one benefit to a stakeholder and one limitation (e.g. multitasking → slows down with too many apps).', 'لكل دور اذكر فائدة لصاحب مصلحة وقيداً واحداً (مثل: تعدد المهام ← يتباطأ مع كثرة التطبيقات).'),
    },
    terms: [['Network operating system (NOS)', 'نظام تشغيل الشبكات'], ['Memory management', 'إدارة الذاكرة'], ['Device driver', 'برنامج تشغيل الجهاز']],
  },
  {
    id: 'ui',
    icon: 'eye',
    pages: [30, 32],
    title: O('User interfaces and what affects the choice', 'واجهات المستخدم والعوامل المؤثرة في اختيارها'),
    core: {
      summary: O('A user interface (UI) is the communication link between the computer\'s OS and the user. The right UI depends on the intended use.', 'واجهة المستخدم (UI) هي رابط الاتصال بين نظام تشغيل الحاسوب والمستخدم، والواجهة المناسبة تعتمد على الاستخدام المقصود.'),
      points: [
        O('Graphical (GUI): users choose graphical symbols — effective with limited computing skills, but needs more memory and power.', 'الرسومية (GUI): يختار المستخدم رموزاً رسومية — فعّالة بمهارات حاسوب محدودة، لكنها تحتاج ذاكرة وطاقة أكبر.'),
        O('Command line: the user types commands — more flexible and can run lower-specification computers, but needs knowledge of the OS commands.', 'سطر الأوامر: يكتب المستخدم الأوامر — أكثر مرونة ويمكن تشغيله على حواسيب بمواصفات أقل، لكنه يتطلب معرفة أوامر نظام التشغيل.'),
        O('Menu-based: functions chosen from menus — needs less memory than a GUI, but the user must know which menu offers each function.', 'المعتمدة على القائمة: تُختار الوظائف من قوائم — تحتاج ذاكرة أقل من الرسومية، لكن يجب أن يعرف المستخدم أي قائمة توفّر كل وظيفة.'),
        O('Adaptability: colour, font size and position can be adjusted — important for users with specialised needs such as impaired vision.', 'التكييف: يمكن تعديل اللون وحجم الخط والموضع — وهذا مهم للمستخدمين ذوي الاحتياجات الخاصة مثل ضعف البصر.'),
      ],
    },
    more: {
      paras: [
        O('Apple describes GUI functions as "WIMP" computing (windows, icons, menus, pointer). WIMP made computers usable by billions of people of all ages, because users can carry out many actions with little or no prior knowledge or training.', 'تصف أبل وظائف الواجهة الرسومية بأنها حوسبة WIMP (النوافذ والأيقونات والقوائم والمؤشر)، وقد جعلت استخدام الحاسوب في متناول مليارات الأشخاص من جميع الأعمار لأن المستخدم يستطيع تنفيذ إجراءات متعددة بقليل من المعرفة أو التدريب المسبق أو دونها.'),
        O('Software developers, data engineers and IT technicians who solve network and security problems often interact directly with the OS using its tools and sometimes the command line. A network device such as a Cisco router is programmed only through the command line in a terminal window. Users who want easy, time-saving or leisure use are best served by a WIMP-style GUI.', 'مطورو البرامج ومهندسو البيانات وفنيو تكنولوجيا المعلومات الذين يحلّون مشكلات الشبكة والأمان يتعاملون غالباً مع نظام التشغيل مباشرة بأدواته وأحياناً بسطر الأوامر. ويُبرمج جهاز شبكة مثل موجّه سيسكو فقط بسطر الأوامر من خلال نافذة طرفية. أما المستخدم الذي يريد سهولة الاستخدام أو توفير الوقت أو الترفيه فالأنسب له واجهة رسومية على غرار WIMP.'),
        O('Impact of GUIs: universal accessibility — raising technology skills even without formal training, and giving users with mental, physical or certain sensory impairments effective ways to interact with computers. Intuitive interfaces are essential, but their demands on storage and performance are large compared with earlier interface options.', 'أثر الواجهات الرسومية: إمكانية الوصول العالمية — رفع مستوى المهارات التكنولوجية حتى دون تدريب رسمي، وتوفير طرق فعّالة لذوي الإعاقة العقلية أو الجسدية أو الحسية للتفاعل مع الحواسيب. والواجهات البديهية ضرورية، لكن متطلباتها على التخزين والأداء كبيرة مقارنة بخيارات الواجهات السابقة.'),
        O('Users who are less familiar with a program, or who avoid risk, are likely to prefer GUIs over menu-based interfaces.', 'المستخدمون الأقل دراية بالبرنامج أو الذين يتجنبون المخاطرة يفضّلون على الأرجح الواجهات الرسومية على الواجهات المعتمدة على القوائم.'),
      ],
      org: O('Leshev\'s administrators and fitters need a familiar, easy GUI on office PCs and mobile devices; whoever configures the network equipment may need the command line; adaptable settings support any member of staff with specific needs.', 'يحتاج إداريو Leshev وفنيوها واجهة رسومية مألوفة وسهلة على حواسيب المكتب والأجهزة المحمولة، وقد يحتاج من يضبط معدات الشبكة إلى سطر الأوامر، وتدعم إعدادات التكييف أي موظف لديه احتياجات خاصة.'),
      exam: O('Compare two interfaces for one named user: skills needed, memory/power needed, flexibility.', 'قارن بين واجهتين لمستخدم محدد: المهارات المطلوبة، والذاكرة والطاقة المطلوبتان، والمرونة.'),
    },
    terms: [['User interface (UI)', 'واجهة المستخدم'], ['Command line interface (CLI)', 'واجهة سطر الأوامر'], ['WIMP', 'النوافذ والأيقونات والقوائم والمؤشر'], ['Terminal window', 'النافذة الطرفية']],
  },
  {
    id: 'os-choice',
    icon: 'wrench',
    pages: [31, 33],
    title: O('Factors affecting the choice and performance of an OS', 'العوامل المؤثرة في اختيار نظام التشغيل وأدائه'),
    core: {
      summary: O('The best OS is the one most suited to the user\'s needs — and its performance depends on how it is used.', 'أفضل نظام تشغيل هو الأنسب لاحتياجات المستخدم — وأداؤه يعتمد على طريقة استخدامه.'),
      points: [
        O('Most people want single-user multitasking so they can do more than one job at once; some businesses also need multi-user access for collaborative work via a server or the cloud.', 'يريد معظم الناس تعدد المهام لمستخدم واحد لينفّذوا أكثر من وظيفة في الوقت نفسه، وقد تحتاج بعض الشركات أيضاً وصولاً متعدد المستخدمين للعمل التعاوني عبر خادم أو السحابة.'),
        O('The amount of data processed and the number of applications running at once affect memory and processing use — fewer apps and less memory demand mean faster performance.', 'كمية البيانات المعالَجة وعدد التطبيقات العاملة معاً تؤثران في استهلاك الذاكرة والمعالجة — فكلما قلّت التطبيقات والذاكرة المطلوبة كان الأداء أسرع.'),
        O('Hardware specification must match the demand (memory for input/output and processing speed).', 'يجب أن تناسب مواصفات العتاد الطلب (الذاكرة لاحتياجات الإدخال والإخراج وسرعة المعالجة).'),
        O('Compatibility: some software will not work on different operating systems (e.g. Apple iPhone vs Android).', 'التوافق: بعض البرامج لا تعمل على أنظمة تشغيل مختلفة (مثل Apple iPhone مقابل Android).'),
      ],
    },
    more: {
      paras: [
        O('A device streaming music and video while editing a presentation uses large amounts of memory and processing power; a device used only for administration (spreadsheets and word processing) uses far less. In both cases the OS is single-user multitasking.', 'الجهاز الذي يبث الموسيقى والفيديو بينما يحرّر عرضاً تقديمياً يستهلك كميات كبيرة من الذاكرة وقوة المعالجة، أما الجهاز المستخدم للأغراض الإدارية فقط (جداول بيانات ومعالجة نصوص) فيستهلك أقل بكثير. وفي الحالتين يكون نظام التشغيل متعدد المهام لمستخدم واحد.'),
        O('More data analytics means more memory use: a doctoral student running complex mathematical analysis on large data needs much better OS performance than a small-business accountant with relatively small amounts of new data.', 'زيادة تحليلات البيانات تعني زيادة استخدام الذاكرة: طالب الدكتوراه الذي يُجري تحليلات رياضية معقدة على بيانات كثيرة يحتاج أداءً أفضل بكثير لنظام التشغيل من محاسب شركة صغيرة لديه كميات صغيرة نسبياً من البيانات الجديدة.'),
        O('Performance can drop on a laptop because many programs are open at once, or programs such as antivirus run in the background. The OS must interact with other systems, so it has to be compatible — otherwise they "do not speak the same language".', 'قد ينخفض أداء الحاسوب المحمول لأن برامج كثيرة مفتوحة معاً، أو لأن برامج مثل مكافحة الفيروسات تعمل في الخلفية. ويجب أن يتفاعل نظام التشغيل مع الأنظمة الأخرى فيكون متوافقاً، وإلا فإنها «لا تتحدث اللغة نفسها».'),
      ],
      org: O('Leshev\'s office tasks (budgets, payroll, invoices, records) are mostly administrative, so modest specifications are enough; shared records and schedules need the staff\'s devices and the central system to be compatible with each other.', 'معظم مهام مكتب Leshev (الميزانية والرواتب والفواتير والسجلات) إدارية، فتكفيها مواصفات معتدلة، بينما تحتاج السجلات والجداول المشتركة إلى توافق أجهزة الموظفين مع النظام المركزي.'),
      exam: O('Use "because" chains: task → data/apps used → memory & processing → suitable OS and hardware.', 'استخدم سلسلة «لأن»: المهمة ← البيانات والتطبيقات المستخدمة ← الذاكرة والمعالجة ← نظام التشغيل والعتاد المناسبان.'),
    },
    terms: [['Compatibility', 'التوافق'], ['Hardware specification', 'مواصفات الأجهزة'], ['Performance', 'الأداء']],
  },
  {
    id: 'utility',
    icon: 'shield',
    pages: [33, 34],
    title: O('Utility software', 'البرامج المساعدة'),
    core: {
      summary: O('Utility software is system software that works alongside the OS to carry out routine tasks that keep the system running and improve it.', 'البرنامج المساعد برنامج نظام يعمل جنباً إلى جنب مع نظام التشغيل لتنفيذ المهام الروتينية التي تحافظ على تشغيل النظام وتحسّنه.'),
      points: [
        O('Security: security checks; finding and removing viruses with antivirus and anti-malware; encryption.', 'الأمان: الفحوصات الأمنية، وتحديد الفيروسات وإزالتها ببرامج مكافحة الفيروسات والبرامج الضارة، والتشفير.'),
        O('Housekeeping: file cleanup, file compression, disk analysis, disk defragmenters, file manager.', 'التنظيم: تنظيف الملفات، وضغطها، وتحليل الأقراص، وأدوات إلغاء تجزئة القرص، ومدير الملفات.'),
        O('Keeping current and safe: software updates, data backup, and alerts that updates or backups are needed.', 'التحديث والحماية: تحديثات البرامج، والنسخ الاحتياطي للبيانات، والتنبيه إلى الحاجة لتحديث أو نسخ احتياطي.'),
        O('Network utilities and managing peripherals (cameras, printers, webcams).', 'أدوات الشبكة المساعدة وإدارة الأجهزة الطرفية (الكاميرات والطابعات وكاميرات الويب).'),
      ],
    },
    more: {
      paras: [
        O('Utilities can also collect data to clean the system and speed it up by finding and purging unwanted data to free storage space. Utilities differ in how much memory they use according to their features.', 'تُستخدم البرامج المساعدة أيضاً لجمع البيانات لتنظيف النظام وتسريع أدائه بالبحث عن البيانات غير المرغوب فيها وإزالتها لتحرير مساحة التخزين، وتختلف البرامج المساعدة في مقدار الذاكرة التي تستهلكها بحسب ميزاتها.'),
        O('Choice depends on what the user expects from the device. A device used mainly for browsing or talking to friends using voice over IP (VoIP) may not need utilities such as a printer driver. Most devices come with integrated update processes, but users must decide whether to add security and virus protection or set up backup utilities.', 'يعتمد الاختيار على ما يتوقعه المستخدم من جهازه؛ فالجهاز المخصص أساساً لتصفح الإنترنت أو التحدث مع الأصدقاء بالصوت عبر بروتوكول الإنترنت (VoIP) قد لا يحتاج إلى برامج مساعدة مثل برنامج تشغيل الطابعة. وتأتي معظم الأجهزة مع عمليات تحديث متكاملة، لكن على المستخدم أن يقرر إضافة الأمان والحماية من الفيروسات أو إعداد برامج النسخ الاحتياطي.'),
        O('Factors affecting utility performance: the memory available on the device, bandwidth, conflicts with other utilities (e.g. several antivirus applications on one device) and memory faults.', 'العوامل المؤثرة في أداء البرامج المساعدة: مقدار الذاكرة المتوافرة على الجهاز، والنطاق الترددي، والتعارض مع برامج مساعدة أخرى (مثل عدة تطبيقات لمكافحة الفيروسات على جهاز واحد)، وأعطال الذاكرة.'),
      ],
      org: O('Leshev stores data on staff and customers, so backup, antivirus/anti-malware and encryption utilities protect those records; update alerts keep every device patched; only one antivirus product should run on each device to avoid conflicts.', 'تخزّن Leshev بيانات الموظفين والعملاء، لذا تحمي برامج النسخ الاحتياطي ومكافحة الفيروسات والبرامج الضارة والتشفير هذه السجلات، وتُبقي تنبيهات التحديث كل الأجهزة محدّثة، ويجب تشغيل برنامج مكافحة فيروسات واحد فقط على كل جهاز لتجنب التعارض.'),
      exam: O('Link each utility to the threat or problem it reduces and the stakeholder it protects.', 'اربط كل برنامج مساعد بالتهديد أو المشكلة التي يخففها وصاحب المصلحة الذي يحميه.'),
    },
    terms: [['Utility software', 'البرامج المساعدة'], ['Defragmenter', 'أداة إلغاء التجزئة'], ['Backup', 'النسخ الاحتياطي'], ['VoIP', 'الصوت عبر بروتوكول الإنترنت']],
  },
  {
    id: 'apps',
    icon: 'doc',
    pages: [34, 35],
    title: O('Application software', 'برامج التطبيقات'),
    core: {
      summary: O('Application software is the software needed to run your applications (programs), including apps on smartphones and other digital devices.', 'برامج التطبيقات هي البرامج المطلوبة لتشغيل تطبيقاتك (برامجك) والتطبيقات التي يسهل الوصول إليها على الهواتف الذكية والأجهزة الرقمية الأخرى.'),
      points: [
        O('Communication (e.g. Skype, FaceTime, WhatsApp); computer-aided design (CAD) for technical drawing and architectural design.', 'برامج الاتصالات (مثل سكايب وفيس تايم وواتساب)، والتصميم بمساعدة الحاسوب (CAD) للرسم الفني والتصميم المعماري.'),
        O('Database management systems (DBMS) retrieve, manage and process data from a database.', 'أنظمة إدارة قواعد البيانات (DBMS) تسترد البيانات من قاعدة البيانات وتديرها وتعالجها.'),
        O('Enterprise resource planning (ERP) packages manage all of an organisation\'s operations in an integrated way — purchasing, sales, stock control, accounting.', 'حزم تخطيط موارد المؤسسات (ERP) تمكّن المؤسسات من إدارة جميع عملياتها بطريقة متكاملة — الشراء والمبيعات ومراقبة المخزون والمحاسبة.'),
        O('Digital graphics & animation, entertainment software, Office software, and programming software (e.g. Visual Basic, Python, Java).', 'الرسوم الرقمية والرسوم المتحركة، وبرامج الترفيه، وبرامج Office، وبرامج البرمجة (مثل Visual Basic وPython وJava).'),
      ],
    },
    more: {
      paras: [
        O('Purpose: application software enables businesses to reduce costs, increase production and control quality through automated digital processes and greater data-processing power. Less obvious examples: agriculture (managing harvesting, sorting, cleaning and packing produce) and textiles (design and manufacturing processes).', 'الغرض: تمكّن برامج التطبيقات الشركات من خفض التكاليف وزيادة الإنتاج والتحكم في الجودة من خلال العمليات الرقمية الآلية وزيادة قوة معالجة البيانات. ومن الأمثلة الأقل وضوحاً: الزراعة (إدارة الحصاد والفرز والتنظيف وتعبئة المنتجات) والمنسوجات (عمليات التصميم والتصنيع).'),
        O('Choice factors: Microsoft products are popular for their versatility and ease of use. Businesses that need general office applications usually prefer those most people already know, and those with interoperability; when hiring administrative staff it is easier to ask for skills they already have, such as Microsoft Office.', 'عوامل الاختيار: منتجات مايكروسوفت مشهورة بتعدد استخداماتها وسهولة استخدامها. والشركات التي تحتاج تطبيقات مكتبية عامة تفضّل غالباً ما يعرفه معظم الناس وما يتمتع بإمكانية التشغيل البيني، وعند تعيين الموظفين الإداريين يكون من الأسهل طلب مهارات مكتسبة مسبقاً مثل استخدام Microsoft Office.'),
        O('Apple products are more likely to be preferred in creative industries such as advertising and graphic design, because Apple\'s early software had strong processing and excellent graphics capability suited to creative work; much graphics, video and music software is designed specifically for Macs.', 'من المرجح أن تُفضَّل منتجات أبل في الصناعات الإبداعية مثل الإعلان والتصميم الجرافيكي، لأن برامج أبل الأولى تمتعت بقوة معالجة وقدرة رسوم ممتازة تناسب العمليات الإبداعية، ويُصمَّم قدر كبير من برامج الرسوم والفيديو والموسيقى خصيصاً لأجهزة ماك.'),
      ],
      org: O('From the brief: a DBMS can hold staff, customer and stock records; office software supports the budget, payroll and invoices; scheduling/ERP-style software can create the daily job list and track stock; communication software lets fitters send progress updates and needs-analysis results; CAD fits the design of unique shop furniture.', 'من موجز الواجب: يمكن لنظام إدارة قواعد البيانات حفظ سجلات الموظفين والعملاء والمخزون، وتدعم البرامج المكتبية الميزانية والرواتب والفواتير، ويمكن لبرامج الجدولة/تخطيط الموارد إنشاء جدول المهام اليومي وتتبع المخزون، وتتيح برامج الاتصال للفنيين إرسال تحديثات التقدم ونتائج تحليل الاحتياجات، ويناسب CAD تصميم أثاث المتاجر الفريد.'),
      exam: O('For each package: what need it meets → which stakeholder benefits → one limitation (cost, training, compatibility).', 'لكل حزمة: أي حاجة تلبيها ← أي صاحب مصلحة يستفيد ← قيد واحد (التكلفة، التدريب، التوافق).'),
    },
    terms: [['Application software', 'برامج التطبيقات'], ['CAD', 'التصميم بمساعدة الحاسوب'], ['DBMS', 'نظام إدارة قواعد البيانات'], ['ERP', 'تخطيط موارد المؤسسات'], ['Interoperability', 'إمكانية التشغيل البيني']],
  },
  {
    id: 'open-proprietary',
    icon: 'lock',
    pages: [35, 36],
    title: O('Open-source and proprietary software', 'البرامج مفتوحة المصدر ومسجلة الملكية'),
    core: {
      summary: O('Behind every OS and program is programming code. There are two general kinds: open-source and proprietary.', 'وراء كل نظام تشغيل وبرنامج كود برمجي يُعرف بالتعليمات البرمجية، وهناك نوعان عامّان: مفتوح المصدر ومسجل الملكية.'),
      points: [
        O('Open source: a collaborative effort by many programmers, tested and fixed through peer review; the code is open for anyone to use, copy and adapt — and it is free.', 'مفتوح المصدر: جهد تعاوني يسهم فيه أكثر من مبرمج ويعتمد على مراجعة الأقران للاختبار والإصلاح؛ الكود مفتوح لأي شخص لاستخدامه ونسخه وتكييفه — وهو مجاني.'),
        O('Proprietary: privately owned (e.g. Sage, Microsoft, Apple, Pegasus); the code is kept secret; users buy it and can use it but not change the source code.', 'مسجل الملكية: مملوك بشكل خاص (مثل سيج ومايكروسوفت وأبل وبيغاسوس)؛ يُحفظ الكود سراً، ويشتريه المستخدم ويستخدمه دون تغيير الشفرة المصدرية.'),
        O('Both can be updated: proprietary developers send "patches" to registered users; open-source developers improve the code and users update.', 'يمكن تحديث النوعين: يرسل مطورو البرامج الخاصة «تصحيحات» للمستخدمين المسجلين، ويطوّر مطورو المصدر المفتوح الكود ويحدّث المستخدمون برامجهم.'),
      ],
    },
    more: {
      paras: [
        O('Open-source drawbacks: it can be copied and modified by individuals with malicious intent, by expert programmers who do not share the creators\' philosophy or responsibility for the program\'s safety, and by inexperienced programmers. These risks can be reduced by checking the source of any open-source code you download.', 'عيوب المصدر المفتوح: يمكن نسخه وتعديله من قبل أفراد لديهم نية خبيثة، أو مبرمجين خبراء لا يشاركون منشئيه الفلسفة أو المسؤولية نفسها بشأن سلامة البرنامج، أو مبرمجين عديمي الخبرة. ويمكن تخفيف هذه المخاطر بالتحقق من مصدر الكود المفتوح الذي تنزّله.'),
        O('Open-source benefits: opportunities to create and share knowledge and experience freely worldwide; access to advanced software for people who could not afford proprietary software; bug fixes and new features usually arrive quickly.', 'مزايا المصدر المفتوح: فرص للإبداع وتبادل المعرفة والخبرة عالمياً وبحرية، وإتاحة البرامج المتطورة لمن لا يستطيع تحمّل تكلفة البرامج الاحتكارية، وعادةً ما تتم إصلاحات الأخطاء وتطوير الميزات بسرعة.'),
        O('Proprietary implications: it can be expensive, and development is limited to certain employed or contracted programmers. But because developers control the code, they can collect data on problems and use it to correct programming issues.', 'آثار البرامج مسجلة الملكية: قد تكون مكلفة، ويقتصر تطويرها على مبرمجين معيّنين أو متعاقدين. لكن لأن المطورين يتحكمون في الكود فإنهم يستطيعون جمع بيانات عن المشكلات واستخدامها لتصحيح مشكلات البرمجة.'),
      ],
      org: O('A growing small business such as Leshev must weigh licence cost against support: proprietary packages cost money but come with vendor patches; free open-source tools cut costs but should only be downloaded from verified sources.', 'على شركة صغيرة متنامية مثل Leshev الموازنة بين تكلفة الترخيص والدعم: الحزم مسجلة الملكية مكلفة لكنها تأتي بتصحيحات من الشركة المطوّرة، والأدوات المجانية مفتوحة المصدر تخفّض التكلفة لكن يجب تنزيلها من مصادر موثوقة فقط.'),
      exam: O('Compare on cost, ability to change the code, security and support/updates — then recommend for the scenario.', 'قارن من حيث التكلفة وإمكانية تعديل الكود والأمان والدعم والتحديثات — ثم أوصِ بما يناسب الحالة.'),
    },
    terms: [['Open source', 'مفتوح المصدر'], ['Proprietary', 'مسجل الملكية'], ['Patch', 'تصحيح'], ['Source code', 'الشفرة المصدرية']],
  },
  {
    id: 'files',
    icon: 'download',
    pages: [36, 38],
    title: O('Common file types and formats', 'أنواع الملفات وتنسيقاتها الشائعة'),
    core: {
      summary: O('Data is divided into different file types. The file type tells the computer which program to open it with and how or where to store it; it is shown by the extension after the dot (e.g. .docx, .dotx).', 'تُقسَّم البيانات إلى أنواع ملفات مختلفة؛ ويساعد نوع الملف الحاسوب على تحديد البرنامج الذي يفتحه وكيفية تخزينه أو مكانه، ويُعرف باللاحقة بعد النقطة (مثل .docx و.dotx).'),
      points: [
        O('Images: GIF, PNG, JPEG, RAW, SVG (and TIFF). Video: MPEG, AVI. Audio: MP3, WAV.', 'الصور: GIF وPNG وJPEG وRAW وSVG (وTIFF). الفيديو: MPEG وAVI. الصوت: MP3 وWAV.'),
        O('Application files: DOC, RTF, XLS, XML, PDF.', 'ملفات التطبيقات: DOC وRTF وXLS وXML وPDF.'),
        O('JPEG is compressed when saved (some data lost) — small files, good for email; TIFF keeps quality but is not compatible with some software.', 'يُضغط JPEG عند الحفظ (يُفقد بعض البيانات) — ملفات صغيرة مناسبة للبريد الإلكتروني؛ ويحتفظ TIFF بالجودة لكنه غير متوافق مع بعض البرامج.'),
        O('Compatibility: a spreadsheet will not open in a word processor, and a file saved in a newer version may not open in an older one.', 'التوافق: لا يُفتح جدول البيانات في تطبيق معالجة النصوص، وقد لا يُفتح ملف محفوظ بإصدار أحدث في إصدار سابق.'),
      ],
    },
    more: {
      paras: [
        O('RAW files are uncompressed; they suit images that need editing but require advanced software to open and process (free options exist). They are mostly produced by cameras, especially DSLR cameras, and each manufacturer has its own RAW type.', 'ملفات RAW غير مضغوطة، وتناسب الصور التي تحتاج تعديلاً لكنها تتطلب برامج متطورة لفتحها ومعالجتها (وتوجد خيارات مجانية). وتنتجها غالباً الكاميرات، وتحديداً كاميرات DSLR، ولكل شركة مصنّعة نوع RAW خاص بها.'),
        O('PNG (portable network graphics) supports lossless compression. GIF (graphics interchange format) is lossless and used for still and animated images, but does not support complex animation and has patent restrictions; PNG does not, so it is more common and can also replace TIFF.', 'PNG (رسوم الشبكة المحمولة) يدعم الضغط دون فقدان للبيانات. وGIF (تنسيق تبادل الرسوم) دون فقدان ويُستخدم للصور الثابتة والمتحركة، لكنه لا يدعم الرسوم المتحركة المعقدة ويخضع لقيود براءة الاختراع، بينما لا يخضع PNG لها فهو أكثر شيوعاً ويمكن استخدامه بديلاً لـ TIFF.'),
        O('MP3 stores audio only; MP4 holds audio and video at fairly high quality, so MP4 video files are much larger. Neither is a protected file type, which has led to piracy.', 'يخزّن MP3 الصوت فقط، بينما يحتفظ MP4 بالصوت والفيديو بجودة عالية إلى حد ما، فتكون ملفات MP4 أكبر بكثير. ولا يُعد أيٌّ منهما من أنواع الملفات المحمية، وهذا أدى إلى قرصنتها.'),
        O('DOC or RTF: saving long, complex documents as RTF uses much less storage and helps when sharing with users who have newer versions or different software — but heavily formatted material (tables, graphics) needs the program\'s own file type.', 'DOC أو RTF: حفظ المستندات الطويلة والمعقدة بصيغة RTF يستهلك مساحة أقل بكثير ويفيد عند مشاركتها مع مستخدمين لديهم إصدارات أحدث أو برامج مختلفة — لكن المواد المنسقة بكثافة (الجداول والرسوم) تحتاج نوع ملف البرنامج نفسه.'),
        O('Implications for organisations and stakeholders: system updates can delay daily operations, affecting timing and possibly losing business; customers, suppliers and staff may struggle if functions become less familiar or more complex; changes can cause problems interacting with other software and hardware; technical knowledge is needed so information is not lost or made inaccessible; and moving from manual to automated systems is not simple — staff may need significant extra training.', 'الآثار على المؤسسات وأصحاب المصلحة: يمكن أن تؤخر تحديثات الأنظمة العمليات اليومية فتؤثر في التوقيت وربما تُفقد أعمالاً، وقد يعاني العملاء والموردون والموظفون إذا أصبحت الوظائف أقل شيوعاً أو أكثر تعقيداً، وقد تظهر مشكلات في التفاعل مع البرامج والأجهزة الأخرى، وتلزم المعرفة التقنية لضمان عدم فقدان المعلومات أو تعذّر الوصول إليها، والانتقال من الأنظمة اليدوية إلى الآلية ليس بسيطاً وقد تحتاج المؤسسة إلى الاستثمار في تدريب إضافي للموظفين.'),
      ],
      org: O('Leshev shares quotes, schedules and invoices with customers who use different software, so widely compatible formats matter; photos sent from job sites by email suit compressed JPEG, while design images that will be edited suit lossless formats.', 'تشارك Leshev عروض الأسعار والجداول والفواتير مع عملاء يستخدمون برامج مختلفة، لذا تهم التنسيقات واسعة التوافق؛ والصور المرسلة من مواقع العمل بالبريد يناسبها JPEG المضغوط، أما صور التصميم التي ستُعدَّل فتناسبها التنسيقات دون فقدان.'),
      exam: O('Justify a file format by purpose: quality vs file size vs compatibility with the people who will open it.', 'برّر اختيار تنسيق الملف بحسب الغرض: الجودة مقابل حجم الملف مقابل التوافق مع من سيفتحه.'),
    },
    terms: [['File extension', 'لاحقة الملف'], ['Lossy compression', 'ضغط مع فقدان البيانات'], ['Lossless compression', 'ضغط دون فقدان البيانات'], ['Compatibility', 'التوافق']],
  },
];

/** "Applying it" table — Leshev Outfitters needs (from the assignment brief) mapped to the software ideas above */
export const SOFTWARE_NEEDS = [
  { need: O('Store data in staff and customer records; keep central records', 'تخزين البيانات في سجلات الموظفين والعملاء والاحتفاظ بسجلات مركزية'), who: O('Manager, administrators', 'المدير، الإداريون'), sw: O('DBMS on a multi-user server/cloud OS; backup and encryption utilities', 'نظام إدارة قواعد بيانات على نظام تشغيل متعدد المستخدمين (خادم/سحابة)؛ برامج النسخ الاحتياطي والتشفير'), sec: 'apps' },
  { need: O('Create and distribute a daily job schedule', 'إنشاء جدول يومي للمهام وتوزيعه على الموظفين'), who: O('Administrators, fitters', 'الإداريون، الفنيون'), sw: O('Scheduling / ERP-style application; mobile apps for fitters', 'تطبيق جدولة / تخطيط موارد؛ تطبيقات محمولة للفنيين'), sec: 'apps' },
  { need: O('Budget, payroll, invoices and payments', 'الميزانية وكشوف الرواتب والفواتير والمدفوعات'), who: O('Manager, administrators', 'المدير، الإداريون'), sw: O('Office software (spreadsheets) or an ERP accounting package', 'برامج مكتبية (جداول بيانات) أو حزمة محاسبة ضمن تخطيط الموارد'), sec: 'apps' },
  { need: O('Update stock levels and digital records of materials and tools', 'تحديث مستويات المخزون والسجلات الرقمية للمواد والأدوات'), who: O('Fitters, administrators', 'الفنيون، الإداريون'), sw: O('DBMS / ERP stock control', 'نظام إدارة قواعد بيانات / مراقبة المخزون ضمن تخطيط الموارد'), sec: 'apps' },
  { need: O('Communicate throughout the day (progress updates, needs-analysis results)', 'التواصل على مدار اليوم (تحديثات التقدم، نتائج تحليل الاحتياجات)'), who: O('All staff, customers', 'جميع الموظفين، العملاء'), sw: O('Communication software (messaging, VoIP); compatible file formats', 'برامج الاتصالات (المراسلة، الصوت عبر الإنترنت)؛ تنسيقات ملفات متوافقة'), sec: 'apps' },
  { need: O('Customers manage accounts, order online, book or change appointments', 'إدارة العملاء لحساباتهم والطلب عبر الإنترنت وحجز المواعيد أو تعديلها'), who: O('Customers, administrators', 'العملاء، الإداريون'), sw: O('Web/online applications linked to the database; security utilities', 'تطبيقات ويب مرتبطة بقاعدة البيانات؛ برامج الأمان المساعدة'), sec: 'utility' },
  { need: O('Design and make unique shop furniture', 'تصميم وتصنيع أثاث متاجر فريد'), who: O('Fitters', 'الفنيون'), sw: O('CAD application; a device whose specification can run it', 'تطبيق CAD؛ جهاز بمواصفات قادرة على تشغيله'), sec: 'os-choice' },
];
