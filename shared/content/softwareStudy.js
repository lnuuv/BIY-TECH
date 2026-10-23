// Comprehensive Unit 1 Software Educational Content (Authoritative source: Pearson BTEC International Level 3 IT — Unit 1 Textbook, pp. 21–30 / PDF pp. 29–38, plus Unit 1 compression, cloud & software security).
// Educational content only — NO 3D models or simulations are used in this section.

const O = (en, ar) => ({ en, ar });

export const SOFTWARE_OVERVIEW = {
  eyebrow: O('Unit 1 · Learning Aim A (A.P1, A.M1, A.D1) · PDF pp. 29–38', 'الوحدة 1 · نتاج التعلم (أ) (A.P1, A.M1, A.D1) · الكتاب ص 29–38'),
  title: O('Software in Information Technology Systems', 'البرمجيات (Software) في أنظمة تكنولوجيا المعلومات'),
  lead: O(
    'Software provides the instructions that tell physical hardware what to do. In Unit 1, you must understand how operating systems, utility software, application software, licensing models, and file formats work together to meet the operational needs of an organisation and its stakeholders.',
    'البرمجيات هي التعليمات التي تخبر العتاد المادي بما يجب فعله. في الوحدة الأولى، ستدرس كيف تتكامل أنظمة التشغيل، والبرامج المساعدة، وبرامج التطبيقات، ونماذج الترخيص (مفتوحة المصدر والملكية)، وتنسيقات الملفات لتلبية احتياجات المؤسسة وأصحاب المصلحة.'
  ),
  coreSummary: O(
    'Every IT system relies on three software pillars working above the hardware: (1) System Software & Operating Systems (the platform that manages hardware, memory, security, and peripherals via device drivers), (2) Utility Software (routine maintenance, antivirus, backup, disk tools, and compression), and (3) Application Software (the tools users and businesses run to lower costs, increase output, and control quality).',
    'يعتمد كل نظام تكنولوجيا معلومات على ثلاث ركائز برمجية تعمل فوق العتاد: (1) برمجيات النظام وأنظمة التشغيل (المنصة التي تدير العتاد والذاكرة والأمان والأجهزة الطرفية عبر برامج التعريف)، (2) البرامج المساعدة (الصيانة الروتينية، مكافحة الفيروسات، النسخ الاحتياطي، أدوات الأقراص والضغط)، و(3) برامج التطبيقات (الأدوات التي يشغّلها المستخدمون والشركات لخفض التكاليف وزيادة الإنتاج وضبط الجودة).'
  ),
  architectureFlow: [
    {
      step: '01',
      title: O('Hardware & Peripherals', 'العتاد والأجهزة الطرفية'),
      role: O('CPU, RAM, Storage, Input/Output devices', 'المعالج، الذاكرة، التخزين، أجهزة الإدخال والإخراج'),
    },
    {
      step: '02',
      title: O('Firmware & Device Drivers', 'البرامج الثابتة وبرامج التعريف'),
      role: O('Low-level embedded control & hardware translators', 'تحكم مدمج منخفض المستوى ومترجمات للعتاد'),
    },
    {
      step: '03',
      title: O('Operating System (OS)', 'نظام التشغيل (OS)'),
      role: O('Core platform: memory, multitasking, security & NOS', 'المنصة الأساسية: الذاكرة، تعدد المهام، الأمان والشبكة'),
    },
    {
      step: '04',
      title: O('Utility & Application Software', 'البرامج المساعدة والتطبيقات'),
      role: O('System maintenance + user/business productivity tools', 'صيانة النظام + أدوات الإنتاجية والأعمال'),
    },
    {
      step: '05',
      title: O('User Interface (UI) & Stakeholders', 'واجهة المستخدم وأصحاب المصلحة'),
      role: O('GUI (WIMP), CLI, Menu, Touch, Voice & Accessibility', 'واجهة رسومية، سطر أوامر، قوائم، لمس، وتيسير الوصول'),
    },
  ],
};

export const SOFTWARE_TOPICS = [
  {
    id: 'os-types',
    badge: O('Pillar 1 · PDF pp. 29–30', 'الركيزة 1 · الكتاب ص 29–30'),
    criteria: ['A.P1', 'A.M1'],
    title: O('1. Types of Operating Systems', '١. أنواع أنظمة التشغيل (Types of Operating Systems)'),
    coreIdea: O(
      'The operating system (OS) is the essential platform that enables all other programs installed on a digital device to run and acts as the interface between hardware and software.',
      'نظام التشغيل هو «النظام الأساسي» (Platform) الذي يمكّن جميع البرامج المثبتة على الجهاز الرقمي من العمل، ويعمل كواجهة تربط بين العتاد المادي والبرمجيات.'
    ),
    corePoints: [
      O(
        'Common desktop and mobile operating systems include Microsoft Windows, Apple iOS/macOS, Google Android, and ChromeOS (which use graphical user interfaces), whereas DOS was an early command-based disk operating system.',
        'من أشهر أنظمة التشغيل: Microsoft Windows، وApple iOS/macOS، وAndroid، وChromeOS (وجميعها تعمل بواجهات رسومية GUI)، بينما كان DOS من أوائل أنظمة التشغيل المعتمدة على الأوامر النصية.'
      ),
      O(
        'Real-Time Operating Systems (RTOS) — such as RTLinux and Windows CE — process data immediately as it arrives without buffering delays, making them critical for time-sensitive industrial and safety systems.',
        'نظام التشغيل في الوقت الفعلي (RTOS) — مثل RTLinux وWindows CE — يعالج البيانات فور وصولها في الوقت الحقيقي دون أي تأخير، وهو ضروري للأنظمة الحساسة للوقت.'
      ),
      O(
        'Embedded Operating Systems are built directly into hardware to control a specific machine silently in the background (e.g., smart bathroom mirrors with humidity/anti-fog sensors and Bluetooth, cardiac pacemakers, cochlear implants, cars, and smart TVs).',
        'النظام المضمّن (Embedded OS) يُدمج داخل العتاد للتحكم في آلة محددة ويعمل بصمت في الخلفية (مثل مرايا الحمام الذكية المزودة بحساسات رطوبة وحرارة وبلوتوث، وأجهزة تنظيم ضربات القلب، وزراعة القوقعة، والسيارات).'
      ),
      O(
        'Operating systems are also classified by task and user capacity: Single-user single-task (runs one app at a time, like a basic feature phone), Single-user multi-tasking (runs spreadsheets, word processing, web browsing, and audio simultaneously on a PC or smartphone), and Multi-user (e.g., Unix or cloud servers allowing many users to share resources and edit the same spreadsheet simultaneously).',
        'تُصنّف الأنظمة حسب المهام والمستخدمين إلى: مهمة فردية لمستخدم واحد (تطبيق واحد في كل مرة كالهاتف البسيط)، وتعدد المهام لمستخدم واحد (تشغيل جداول البيانات ومعالج النصوص والمتصفح والراديو معاً على حاسوب أو هاتف ذكي)، وتعدد المستخدمين (مثل Unix والخوادم السحابية التي تتيح لعدة مستخدمين العمل على نفس المستند في الوقت ذاته).'
      ),
    ],
    expanded: {
      paragraphs: [
        O(
          'In the BTEC Unit 1 textbook, choosing the right operating system type depends directly on the device role and stakeholder requirements. An individual or office worker requires a single-user multi-tasking OS so they can switch seamlessly between email, spreadsheets, and reports. However, when an organisation needs staff across multiple departments to access shared databases or collaborate on live documents, a multi-user OS running on a central server or cloud infrastructure becomes essential.',
          'بحسب كتاب الوحدة الأولى، يعتمد اختيار نوع نظام التشغيل مباشرةً على طبيعة الجهاز واحتياجات أصحاب المصلحة. فالموظف الإداري يحتاج نظاماً متعدد المهام لمستخدم واحد ليتمكن من التبديل بين البريد والجداول والتقارير، بينما تحتاج المؤسسة التي يعمل موظفوها بشكل تعاوني على قواعد بيانات ومستندات مشتركة إلى نظام تشغيل متعدد المستخدمين يعمل عبر خادم مركزي أو سحابة.'
        ),
        O(
          'For automated equipment and Internet of Things (IoT) sensors, general-purpose desktop operating systems would be too heavy and unpredictable. Instead, engineers use Embedded OS firmware for dedicated control or an RTOS when deterministic, millisecond-level response is mandatory (such as antilock braking in vehicles or medical monitoring).',
          'أما في المعدات الآلية وأجهزة المستشعرات، فإن أنظمة سطح المكتب التقليدية تكون ثقيلة وغير مناسبة؛ لذا يُستخدم النظام المضمّن (Embedded) للتحكم المخصص، أو نظام الوقت الفعلي (RTOS) عندما تكون الاستجابة الفورية الحتمية بلا تأخير شرطاً لسلامة الأرواح أو دقة التصنيع.'
        ),
      ],
      table: {
        title: O('Comparison of Operating System Types (Unit 1)', 'مقارنة أنواع أنظمة التشغيل في الوحدة الأولى'),
        headers: [
          O('OS Type', 'نوع نظام التشغيل'),
          O('How It Works', 'آلية العمل'),
          O('Textbook Examples', 'أمثلة الكتاب المنهجي'),
          O('Organisational Use Case', 'الاستخدام المؤسسي'),
        ],
        rows: [
          [
            O('Real-Time (RTOS)', 'الوقت الفعلي (RTOS)'),
            O('Processes inputs instantaneously with zero queuing delay', 'يعالج المدخلات لحظياً فور ورودها دون تأخير'),
            O('RTLinux, Windows CE', 'RTLinux، Windows CE'),
            O('Robotics, assembly lines, medical life-support', 'الروبوتات، خطوط الإنتاج، الأجهزة الطبية الحرجة'),
          ],
          [
            O('Embedded OS', 'النظام المضمّن (Embedded)'),
            O('Dedicated low-level software built into hardware chips', 'برمجيات مدمجة في العتاد لأداء وظيفة محددة في الخلفية'),
            O('Smart mirror, pacemaker, cochlear implant, car ECU', 'مرآة ذكية، منظم ضربات القلب، زراعة القوقعة، السيارة'),
            O('Smart building sensors, barcode terminals, ATMs', 'حساسات المباني الذكية، أجهزة الباركود، الصراف الآلي'),
          ],
          [
            O('Single-User Single-Task', 'مهمة فردية لمستخدم واحد'),
            O('Executes only one application process at any moment', 'يشغّل تطبيقاً واحداً فقط لمستخدم واحد في اللحظة'),
            O('Basic mobile phone OS, MS-DOS', 'الهواتف المحمولة الأساسية القديمة، MS-DOS'),
            O('Simple dedicated handheld scanners', 'أجهزة المسح اليدوية البسيطة المخصصة لمهمة واحدة'),
          ],
          [
            O('Single-User Multi-Tasking', 'تعدد المهام لمستخدم واحد'),
            O('Shares CPU time rapidly across multiple open apps for one user', 'يشغّل عدة تطبيقات معاً لمستخدم واحد بتقسيم وقت المعالج'),
            O('Windows, macOS, Android, iOS', 'Windows، macOS، Android، iOS'),
            O('Office workstations, laptops, staff smartphones', 'حواسيب الموظفين المكتبية والمحمولة والهواتف الذكية'),
          ],
          [
            O('Multi-User OS', 'متعدد المستخدمين (Multi-User)'),
            O('Allows many networked users to run apps and share files concurrently', 'يتيح لعدة مستخدمين تشغيل البرامج ومشاركة الملفات في آن واحد'),
            O('Unix, Linux Server, Cloud Server OS', 'Unix، خوادم Linux، أنظمة الخوادم السحابية'),
            O('Enterprise servers, collaborative cloud spreadsheets', 'خوادم الشركات، العمل التعاوني المتزامن على المستندات'),
          ],
        ],
      },
      examTip: O(
        'Exam Tip (A.P1 / A.M1): Do not confuse "Single-user multi-tasking" with "Multi-user". Watching a video while editing a document on your PC is single-user multi-tasking; ten employees simultaneously editing a shared budget on a server is multi-user.',
        'نصيحة للامتحان (A.P1 / A.M1): لا تخلط بين «تعدد المهام لمستخدم واحد» و«تعدد المستخدمين»؛ فتشغيل عدة برامج على حاسوبك الشخصي هو تعدد مهام لمستخدم واحد، أما دخول عدة موظفين في نفس اللحظة على خادم مشترك فهو تعدد مستخدمين.'
      ),
    },
  },
  {
    id: 'os-functions',
    badge: O('Pillar 2 · PDF p. 30', 'الركيزة 2 · الكتاب ص 30'),
    criteria: ['A.P1', 'A.M1'],
    title: O('2. Core Functions & Role of the Operating System', '٢. الوظائف الخمس الأساسية لنظام التشغيل'),
    coreIdea: O(
      'Beyond launching apps, the OS continuously manages five core background functions: Network communication (NOS), Security, Memory management, Multi-tasking, and Device drivers.',
      'لا يقتصر دور نظام التشغيل على فتح البرامج، بل يدير خمس وظائف حيوية في الخلفية: التواصل الشبكي (NOS)، الأمان، إدارة الذاكرة، تعدد المهام، وبرامج تشغيل الأجهزة (Drivers).'
    ),
    corePoints: [
      O(
        'Networking & Communication (NOS): A Network Operating System controls access to shared network resources, including remote print queues, user accounts/permissions, and centralised file backups.',
        'التواصل وإدارة الشبكة (NOS): يتحكم نظام تشغيل الشبكات في الوصول إلى الموارد والأجهزة المشتركة، مثل إدارة الطباعة عن بُعد، وإدارة حسابات المستخدمين، والنسخ الاحتياطي المركزي للملفات.'
      ),
      O(
        'Security Management: The OS continuously scans for attacks on the system and its software, collecting and analysing telemetry data on system health so manufacturers can patch vulnerabilities.',
        'إدارة الأمان (Security): يجري نظام التشغيل فحوصات مستمرة لرصد الهجمات، ويجمع بيانات عن صحة النظام ويحللها لمساعدة الشركات المصنعة على تحسين الحماية وإصدار التحديثات.'
      ),
      O(
        'Memory Management: Every running OS function and application requires RAM. As an IT system grows larger, it needs more memory; this is why multi-user systems must run on powerful servers rather than standard PCs.',
        'إدارة الذاكرة (Memory Management): يحتاج نظام التشغيل والتطبيقات إلى ذاكرة RAM للعمل؛ وكلما كبر النظام زادت الذاكرة المطلوبة، ولهذا تُشغَّل الأنظمة متعددة المستخدمين على خوادم قوية.'
      ),
      O(
        'Multi-Tasking & Device Drivers: A single CPU core performs one instruction at a time, but the OS gives each process a tiny rotating slice of CPU time so fast that apps appear simultaneous. Meanwhile, Device Drivers act as translator routines linking the OS to peripherals like printers, monitors, and keyboards.',
        'تعدد المهام وبرامج التعريف (Drivers): ينفذ المعالج عملية واحدة في كل لحظة، لكن نظام التشغيل يوزع وقت المعالج بحصص زمنية صغيرة متناوبة بسرعة فائقة. وتعمل برامج التعريف (Drivers) كمترجم روتيني يربط النظام بالأجهزة الطرفية كالطابعات والشاشات.'
      ),
    ],
    expanded: {
      paragraphs: [
        O(
          'How does a classroom PC scan for viruses in the background, play music, let you browse the web, and type an assignment all at once? The textbook explains that a personal computer actually performs one action at a time, but the OS scheduler switches between active processes in rapid alternating turns (time-slicing). The limitation is that both RAM and CPU capacity are finite: opening too many heavy applications exhausts memory and slows the entire system.',
          'كيف يستطيع حاسوب الصف فحص الفيروسات في الخلفية، وتشغيل الموسيقى، والبحث في الإنترنت، وتحرير مستند في الوقت نفسه؟ يوضح الكتاب أن الحاسوب فعلياً ينفذ تعليمة واحدة في اللحظة، لكن نظام التشغيل يمنح كل عملية حصة صغيرة من وقت المعالج في أدوار متناوبة بسرعة هائلة. غير أن السلبية تكمن في محدودية الذاكرة والمعالج؛ فعند فتح تطبيقات كثيرة يبطؤ النظام.'
        ),
        O(
          'In addition, the OS monitors hardware status (such as remaining disk storage and battery life) and relies on specific Device Drivers for every connected peripheral. If a driver is missing, corrupted, or outdated, the OS cannot communicate with the printer, network card, or scanner.',
          'كما يوفر نظام التشغيل معلومات مستمرة للمستخدم مثل المساحة التخزينية المتبقية وعمر البطارية، ويعتمد على برامج التشغيل (Device Drivers) للتخاطب مع كل قطعة طرفية؛ فبدون التعريف المناسب لن يتمكن النظام من إرسال أمر طباعة أو قراءة ماسح ضوئي.'
        ),
      ],
      table: {
        title: O('The 5 Operating System Functions in Practice', 'الوظائف الخمس لنظام التشغيل وتطبيقاتها العملية'),
        headers: [
          O('OS Function', 'الوظيفة'),
          O('Technical Mechanism', 'الآلية التقنية'),
          O('Impact if Poorly Managed', 'الأثر عند ضعف الإدارة'),
        ],
        rows: [
          [
            O('1. Network (NOS)', '١. التواصل الشبكي (NOS)'),
            O('Manages user logins, shared folders, remote printing & server backups', 'يدير دخول المستخدمين والمجلدات المشتركة والطباعة عن بعد والنسخ الاحتياطي'),
            O('Unauthorized access or inability to share office printers/files', 'وصول غير مصرح به أو تعذر مشاركة الطابعات والملفات'),
          ],
          [
            O('2. Security', '٢. الأمان والمراقبة'),
            O('Monitors system health, blocks unauthorized processes & logs attacks', 'يراقب صحة النظام ويصد الهجمات ويجمع بيانات تشخيصية'),
            O('System compromise, malware infection, and data breaches', 'اختراق النظام وتلف البيانات وانتشار البرمجيات الضارة'),
          ],
          [
            O('3. Memory Management', '٣. إدارة الذاكرة'),
            O('Allocates and frees RAM blocks for active apps and OS services', 'يخصص مساحات الذاكرة RAM لكل تطبيق ويحررها عند الإغلاق'),
            O('System freezes, crashes, or severe slowdown under heavy load', 'تجمّد الحاسوب أو تعطل البرامج عند امتلاء الذاكرة'),
          ],
          [
            O('4. Multi-Tasking', '٤. تعدد المهام'),
            O('Rotates small slices of CPU time across active processes', 'يوزع حصصاً صغيرة من وقت المعالج بالتناوب بين العمليات'),
            O('High CPU contention causes lag when too many apps run at once', 'بطء الاستجابة وتأخر المعالجة عند ازدحام التطبيقات'),
          ],
          [
            O('5. Device Drivers', '٥. برامج تشغيل الأجهزة'),
            O('Translates OS commands into hardware-specific peripheral signals', 'يترجم أوامر النظام إلى إشارات تفهمها الطابعة أو الشاشة أو البطاقة'),
            O('Connected peripherals fail to work or lose advanced features', 'توقف الأجهزة الطرفية عن العمل أو فقدان ميزاتها'),
          ],
        ],
      },
      examTip: O(
        'Exam Tip: When asked how an OS supports a business with 25 workstations and one shared printer, mention both NOS (managing shared print queues and user permissions) and Device Drivers (allowing workstations to communicate with the printer).',
        'نصيحة للامتحان: عند شرح كيف يدعم نظام التشغيل مختبراً أو شركة فيها 25 جهازاً وطابعة مشتركة، اذكر دور نظام تشغيل الشبكات (NOS) في إدارة طابور الطباعة وصلاحيات المستخدمين، ودور برامج التعريف (Drivers) في تشغيل الطابعة.'
      ),
    },
  },
  {
    id: 'ui-accessibility',
    badge: O('Pillar 3 · PDF pp. 30–33', 'الركيزة 3 · الكتاب ص 30–33'),
    criteria: ['A.P1', 'A.M1'],
    title: O('3. User Interfaces (UI), Factors Affecting OS Performance & Accessibility', '٣. واجهات المستخدم (UI) وعوامل أداء نظام التشغيل وتيسير الوصول'),
    coreIdea: O(
      'The User Interface (UI) is the front-end link between humans and the OS. Choosing between GUI (WIMP), Command Line (CLI), and Menu-driven interfaces involves balancing ease of use against memory/CPU consumption.',
      'واجهة المستخدم (UI) هي حلقة الوصل الأمامية بين الإنسان ونظام التشغيل. ويوازن اختيار الواجهة (رسومية GUI، أو سطر أوامر CLI، أو قوائم Menu) بين سهولة الاستخدام واستهلاك الذاكرة والطاقة.'
    ),
    corePoints: [
      O(
        'Graphical User Interface (GUI) & WIMP: Apple described GUI functions as "WIMP computing" (Windows, Icons, Menus, Pointer). GUI made computing accessible to billions of people with minimal training and supports accessibility tools, but it requires significantly more memory (RAM), storage, and processing power.',
        'الواجهة الرسومية (GUI) وحوسبة WIMP (النوافذ، الأيقونات، القوائم، المؤشر): جعلت الحاسوب متاحاً لمليارات المستخدمين دون حاجة لخبرة برمجية أو تدريب مسبق، لكنها تستهلك قدراً أكبر بكثير من الذاكرة (RAM) والطاقة والمعالجة.'
      ),
      O(
        'Command Line Interface (CLI) & Terminal: The user types text commands (strings) at a prompt. CLI offers greater flexibility and direct control for software developers, data engineers, and IT network technicians (for example, programming a Cisco router is done via CLI in a Terminal window), and can run on lower-specification hardware.',
        'واجهة سطر الأوامر (CLI) والنافذة الطرفية (Terminal): تُدخل فيها الأوامر نصياً؛ وهي تمنح مرونة وتحكماً مباشراً لمطوري البرامج ومهندسي البيانات وفنيي الشبكات (مثل برمجة راوتر Cisco عبر سطر الأوامر فقط)، وتعمل بكفاءة على الأجهزة ذات المواصفات المنخفضة.'
      ),
      O(
        'Menu-Driven Interfaces & Customisation: Menu interfaces present functions through structured lists and use less memory than full GUIs, though users must know which menu holds each function. OS adaptability — changing desktop colours, font sizes, and layout, or using screen readers (NVDA/JAWS) and voice recognition — is vital for users with visual or physical impairments.',
        'الواجهات المعتمدة على القوائم والتكييف: تستهلك ذاكرة أقل من GUI لكنها تتطلب معرفة بمكان كل وظيفة. ويُعد تكييف الواجهة (تغيير الألوان وحجم الخط وموضع العناصر، أو استخدام قارئات الشاشة للمكفوفين) عاملاً حاسماً لتيسير الوصول (Accessibility).'
      ),
      O(
        'Factors Affecting OS Choice & Performance: (1) Volume of data & concurrent tasks (streaming audio/video while editing a presentation or a PhD student running complex big-data math requires far more RAM and CPU than an accountant updating a small spreadsheet), (2) Hardware specifications (I/O memory and processor speed), and (3) Software compatibility across platforms (e.g., iOS vs. Android).',
        'العوامل المؤثرة في أداء واختيار نظام التشغيل: (1) كمية البيانات وعدد التطبيقات العاملة معاً (بث الفيديو مع تحرير عرض تقديمي، أو تحليل طالب دكتوراه لبيانات ضخمة يستهلك ذاكرة ومعالجة أعلى بكثير من أعمال المحاسبة البسيطة)، (2) مواصفات العتاد، و(3) التوافق بين الأنظمة.'
      ),
    ],
    expanded: {
      paragraphs: [
        O(
          'In the early days of computing, the only way to operate a computer was typing a long command string into the initial prompt. The introduction of GUI and WIMP revolutionised society by raising digital skill levels globally without formal training and providing assistive pathways for people with sensory, physical, or cognitive disabilities.',
          'في بدايات الحواسيب، كانت الطريقة الوحيدة لتشغيل الجهاز هي كتابة سلسلة نصية طويلة في الموجّه الأولي على الشاشة. ثم أحدثت الواجهة الرسومية (GUI) وحوسبة WIMP ثورة عالمية؛ إذ مكنت المبتدئين من استخدام التقنية بلا تدريب رسمي، وفتحت آفاقاً جديدة لذوي الإعاقة البصرية أو الحركية أو السمعية.'
        ),
        O(
          'However, in exam scenarios you must always weigh the trade-offs: while Microsoft Windows and modern Linux desktops provide full GUIs for office staff, network infrastructure devices like enterprise switches and Cisco routers omit heavy graphical interfaces to save memory and maximize reliability, relying instead on CLI through a Terminal emulator.',
          'ومع ذلك، يجب في إجابات الامتحان الموازنة بين الإيجابيات والسلبيات؛ فبينما تناسب واجهة GUI الموظفين الإداريين والمبتدئين، فإن أجهزة البنية التحتية للشبكات (كالموجهات والخوادم المخصصة) تعتمد على سطر الأوامر (CLI) لتوفير الذاكرة وضمان سرعة الأداء ودقة البرمجة.'
        ),
      ],
      table: {
        title: O('Comparison of User Interface (UI) Types', 'مقارنة شاملة لأنواع واجهات المستخدم (UI)'),
        headers: [
          O('Interface Type', 'نوع الواجهة'),
          O('Target User', 'المستخدم المستهدف'),
          O('Key Advantage', 'الميزة الرئيسة'),
          O('Key Limitation', 'القيد الرئيس'),
        ],
        rows: [
          [
            O('GUI (WIMP)', 'الواجهة الرسومية (GUI / WIMP)'),
            O('General users, students, office staff', 'المستخدم العام، الطلاب، موظفو المكاتب'),
            O('Intuitive visual icons/windows; minimal training required', 'بديهية وسهلة الاستخدام بالأيقونات والنوافذ بلا تدريب'),
            O('Consumes high RAM, GPU power, and battery', 'تستهلك قدراً كبيراً من الذاكرة RAM والطاقة'),
          ],
          [
            O('Command Line (CLI)', 'سطر الأوامر (CLI / Terminal)'),
            O('Developers, data engineers, network admins', 'المبرمجون، مهندسو البيانات، فنيو الشبكات'),
            O('High flexibility, scriptable, runs on low-spec hardware', 'مرونة عالية، سريعة، وتعمل على أجهزة بمواصفات منخفضة'),
            O('Steep learning curve; requires exact command syntax', 'تتطلب حفظ الأوامر بدقة ولا تناسب المبتدئين'),
          ],
          [
            O('Menu-Driven UI', 'واجهة القوائم (Menu-Driven)'),
            O('Users of ATMs, kiosks, smart TVs', 'مستخدمو الصراف الآلي، شاشات الخدمة، التلفاز'),
            O('Uses less memory than GUI; structured options', 'تحتاج ذاكرة أقل من GUI وتعرض خيارات منظمة'),
            O('Slow if menus are deep; user must know where options sit', 'تتطلب معرفة القائمة التي تضم كل وظيفة'),
          ],
        ],
      },
      examTip: O(
        'Exam Tip (True/False trap): Remember that GUI consumes MORE memory and power than CLI—never say GUI is lighter because it looks simple!',
        'تنبيه مهم للامتحان: الواجهة الرسومية (GUI) تستهلك ذاكرة وطاقة أعلى بكثير من واجهة سطر الأوامر (CLI)؛ وهذا سؤال كلاسيكي يتكرر في الاختبارات.'
      ),
    },
  },
  {
    id: 'utility-software',
    badge: O('Pillar 4 · PDF pp. 33–34', 'الركيزة 4 · الكتاب ص 33–34'),
    criteria: ['A.P1', 'A.M1'],
    title: O('4. Utility Software: Purpose, Features & Performance Factors', '٤. البرامج المساعدة (Utility Software): الغرض والميزات وعوامل الأداء'),
    coreIdea: O(
      'Utility software is system software that runs alongside the operating system to perform routine housekeeping tasks that maintain, protect, and optimise the computer.',
      'البرنامج المساعد (Utility Software) هو برنامج نظام يعمل جنباً إلى جنب مع نظام التشغيل لتنفيذ المهام الروتينية التي تحافظ على استقرار النظام وتحميه وتحسّن أداءه.'
    ),
    corePoints: [
      O(
        'Security & Protection Utilities: Security scans, antivirus and anti-malware tools (identifying and removing viruses), encryption tools, and automated warning alerts when updates or backups are overdue.',
        'أدوات الأمان والحماية: الفحوصات الأمنية، برامج مكافحة الفيروسات والبرامج الضارة (كشفها وإزالتها)، أدوات التشفير، وإصدار تنبيهات عند الحاجة لتحديثات أو نسخ احتياطي.'
      ),
      O(
        'Disk & File Maintenance Utilities: File cleanup (searching for and removing unwanted temporary data to free space and speed up performance), disk analysis, disk defragmenters, disk partitioners, file managers, backup tools, and file compression.',
        'أدوات صيانة الأقراص والملفات: تنظيف الملفات (البحث عن البيانات غير المرغوبة وحذفها لتحرير المساحة وتسريع الأداء)، تحليل الأقراص، مجزّئات القرص (Defragmenters)، مقسّمات القرص (Partitioners)، مدير الملفات، النسخ الاحتياطي، وضغط الملفات.'
      ),
      O(
        'Connectivity & Peripheral Utilities: Software update managers, network utilities, and peripheral management tools (for cameras, printers, and webcams). Users select utilities based on actual need (e.g., a device used only for web browsing and VoIP calls may not need printer utilities).',
        'أدوات الشبكة والملحقات: إدارة تحديثات البرامج، أدوات الشبكة المساعدة، وإدارة الأجهزة الطرفية (كالطابعات والكاميرات). ويختار المستخدم الأدوات حسب حاجته الفعلية (فجهاز مخصص للتصفح ومكالمات VoIP لا يحتاج أداة إدارة طابعة).'
      ),
      O(
        'Factors Affecting Utility Software Performance: (1) Amount of available RAM, (2) Network bandwidth (for cloud backups/updates), (3) Conflicts with other utilities (such as running two antivirus programs simultaneously on one machine, causing severe lockups), and (4) Memory faults.',
        'العوامل المؤثرة في أداء البرامج المساعدة: (1) مقدار الذاكرة المتاحة (RAM)، (2) النطاق الترددي للشبكة (Bandwidth)، (3) التعارض بين البرامج المساعدة (مثل تشغيل أكثر من برنامج مضاد فيروسات على جهاز واحد)، و(4) أعطال الذاكرة.'
      ),
    ],
    expanded: {
      paragraphs: [
        O(
          'While most digital devices ship with integrated software update utilities, users and IT managers must actively decide which additional utilities to deploy—such as endpoint antivirus protection and scheduled automated backup software. In a business environment, failing to schedule backup utilities or disk cleanup routines leads to storage exhaustion and vulnerability to ransomware.',
          'على الرغم من أن معظم الأجهزة الرقمية تأتي بآليات تحديث مدمجة، فإن على المستخدمين ومديري IT اتخاذ قرار بإضافة أدوات الحماية من الفيروسات وبرامج النسخ الاحتياطي المجدولة. وفي بيئة الأعمال، يؤدي إهمال هذه الأدوات إلى امتلاء الأقراص وارتفاع مخاطر فقدان البيانات عند هجمات الفدية (Ransomware).'
        ),
        O(
          'Crucially, installing too many background utilities degrades system speed. The textbook highlights a classic mistake: running multiple antivirus suites at the same time causes them to compete for file access and RAM, creating software conflicts that slow the computer to a crawl.',
          'ومن النقاط الجوهرية في الكتاب أن المبالغة في تشغيل البرامج المساعدة في الخلفية يبطئ الجهاز؛ وأبرز مثال على ذلك تشغيل برنامجي مكافحة فيروسات في آنٍ واحد، حيث يتعارضان أثناء فحص الملفات ويستنزفان الذاكرة والمعالج.'
        ),
      ],
      table: {
        title: O('Key Utility Software Categories in Unit 1', 'تصنيف البرامج المساعدة ووظائفها في الوحدة الأولى'),
        headers: [
          O('Utility Tool', 'الأداة المساعدة'),
          O('Routine Task Performed', 'المهمة الروتينية التي تنفذها'),
          O('Benefit to the System / Organisation', 'الفائدة للنظام والمؤسسة'),
        ],
        rows: [
          [
            O('Antivirus / Anti-Malware', 'مكافحة الفيروسات والبرامج الضارة'),
            O('Scans files/memory to detect, quarantine, and remove malware', 'فحص الملفات والذاكرة لاكتشاف الفيروسات وإزالتها'),
            O('Prevents downtime, data corruption, and ransomware loss', 'حماية استمرارية العمل ومنع تلف أو سرقة البيانات'),
          ],
          [
            O('File Cleanup & Disk Defragmenter', 'تنظيف الملفات ومجزّئ القرص'),
            O('Deletes temp/junk files and reorganises fragmented HDD sectors', 'حذف الملفات المؤقتة غير المرغوبة وترتيب قطاعات القرص'),
            O('Reclaims storage space and speeds up file read/write access', 'تحرير مساحة التخزين وتسريع استجابة النظام'),
          ],
          [
            O('Backup & Encryption Utilities', 'النسخ الاحتياطي والتشفير'),
            O('Copies critical files on a schedule and scrambles data with keys', 'نسخ دوري للملفات وتحويل البيانات الحساسة إلى رموز مشفرة'),
            O('Ensures disaster recovery and legal data-protection compliance', 'استعادة البيانات عند الأعطال وحمايتها من الوصول غير المصرح'),
          ],
          [
            O('Compression Utilities', 'أدوات ضغط الملفات'),
            O('Reduces file size into archives (e.g., ZIP) for storage/transfer', 'تقليص حجم الملفات لتسهيل أرشفتها أو إرسالها عبر الشبكة'),
            O('Saves disk space and reduces network bandwidth usage', 'توفير مساحة القرص وتقليل استهلاك النطاق الترددي'),
          ],
        ],
      },
      examTip: O(
        'Exam Tip: If a scenario describes a laptop running slowly when no user applications are open, point to background utility software (such as scheduled full-disk antivirus scans, automatic updates, or conflicting security tools) consuming RAM and CPU.',
        'نصيحة للامتحان: إذا ذكر السيناريو أن حاسوباً محمولاً يعمل ببطء شديد رغم عدم فتح برامج كثيرة، فاشرح أثر البرامج المساعدة العاملة في الخلفية (مثل فحص الفيروسات الشامل أو التعارض بين برنامجي حماية).'
      ),
    },
  },
  {
    id: 'application-software',
    badge: O('Pillar 5 · PDF pp. 34–35', 'الركيزة 5 · الكتاب ص 34–35'),
    criteria: ['A.P1', 'A.M1', 'A.D1'],
    title: O('5. Application Software & Sector Case Studies', '٥. برامج التطبيقات (Application Software) وتطبيقاتها القطاعية'),
    coreIdea: O(
      'Application software runs on top of the OS to carry out specific user and business tasks—enabling organisations to cut costs, increase production, and maintain quality control through automated digital processes.',
      'برامج التطبيقات هي البرامج التي يشغّلها المستخدم فوق نظام التشغيل لإنجاز مهام محددة؛ وهي تمكّن المؤسسات من خفض التكاليف وزيادة الإنتاج وضبط الجودة عبر أتمتة العمليات الرقمية.'
    ),
    corePoints: [
      O(
        'Main Categories in the Textbook: Communication software (Skype, Apple FaceTime, WhatsApp), Computer-Aided Design (CAD for technical drawing and architecture), Database Management Systems (DBMS for storing, retrieving, and processing data), Enterprise Resource Planning (ERP), Office productivity suites, Digital graphics & animation, Entertainment apps, and Programming software (Visual Basic, Python, Java).',
        'الفئات الرئيسة في الكتاب: برامج الاتصالات (Skype، FaceTime، WhatsApp)، التصميم بمساعدة الحاسوب (CAD للرسم الهندسي والمعماري)، أنظمة إدارة قواعد البيانات (DBMS)، تخطيط موارد المؤسسة (ERP)، البرامج المكتبية (Office)، الرسوم الرقمية والمتحركة، برامج الترفيه، ولغات البرمجة (Visual Basic، Python، Java).'
      ),
      O(
        'Sector Case Study 1 — Agriculture & Textiles: Even traditional industries rely heavily on application software: Agriculture uses software to manage harvesting, sorting, cleaning, and packaging of produce; Textiles uses software across fabric design and automated CAM manufacturing.',
        'تطبيقات قطاعية من الكتاب — الزراعة والمنسوجات: تستخدم الزراعة برامج التطبيقات لإدارة عمليات الحصاد والفرز والتنظيف وتعبئة المنتجات؛ بينما يوظف قطاع المنسوجات البرمجيات في التصميم الهندسي للأقمشة والتحكم في آلات التصنيع.'
      ),
      O(
        'Sector Case Study 2 — General Office (Microsoft) vs. Creative Industries (Apple): Businesses needing general administrative software favour Microsoft Office because of its versatility, ease of use, interoperability, and the fact that newly hired admin staff already know how to use it.',
        'مقارنة بيئات العمل — المكاتب العامة (Microsoft) مقابل الصناعات الإبداعية (Apple): تفضّل الشركات الإدارية حزمة Microsoft Office لتعدد استخداماتها وسهولتها والتشغيل البيني (Interoperability)، ولأن الموظفين الجدد يمتلكون مهاراتها مسبقاً مما يوفر تكلفة التدريب.'
      ),
      O(
        'Why Creative Industries Prefer Apple: Advertising, graphic design, video, and music studios often prefer Apple Mac systems because Apple originally engineered its platform with strong floating-point processing and superior graphics capabilities tailored for media software.',
        'لماذا تفضّل الصناعات الإبداعية أجهزة Apple: تفضّل شركات الإعلان والتصميم الجرافيكي والمونتاج أنظمة Apple لما تتميز به من قوة معالجة العمليات العائمة (Floating-point processing) وقدرات رسومية ممتازة وبرامج إبداعية مخصصة.'
      ),
    ],
    expanded: {
      paragraphs: [
        O(
          'When evaluating application software for a business (such as Leshev Outfitters or a school), you must connect the software category to the specific organisational function: DBMS and spreadsheets support finance and stock control; CAD supports store layout design; communication and scheduling apps coordinate field technicians and office staff.',
          'عند تقييم برامج التطبيقات لأي مؤسسة في أسئلة الواجب أو الامتحان (مثل شركة Leshev Outfitters)، اربط كل برنامج بوظيفة المؤسسة: فقواعد البيانات (DBMS) والجداول تدعم المخزون والمالية، وبرامج CAD تدعم التصميم الهندسي، وبرامج الاتصالات والجدولة تنسق العمل بين المكتب والميدان.'
        ),
      ],
      table: {
        title: O('Application Software Selection by Sector (Textbook Examples)', 'اختيار برامج التطبيقات حسب القطاع (أمثلة الكتاب المنهجي)'),
        headers: [
          O('Sector / Function', 'القطاع / الوظيفة'),
          O('Software Used', 'البرمجيات المستخدمة'),
          O('How It Meets Organisational Needs', 'كيف تلبي احتياجات المؤسسة'),
        ],
        rows: [
          [
            O('General Administration', 'الإدارة والمكاتب العامة'),
            O('Microsoft Office (Word, Excel), Email, DBMS', 'حزمة Microsoft Office، البريد، قواعد البيانات'),
            O('High interoperability; staff already trained, lowering recruitment/training overheads', 'تشغيل بيني عالٍ؛ الموظفون متدربون مسبقاً عليها مما يقلل نفقات التدريب'),
          ],
          [
            O('Creative & Media Agencies', 'الصناعات الإبداعية والإعلان'),
            O('Apple macOS creative suites, 3D animation & audio tools', 'برامج التصميم والجرافيك والمونتاج على أنظمة Apple'),
            O('High floating-point & graphics processing power for rendering video/design', 'قوة معالجة رسومية وحسابية عالية لإنتاج الفيديو والرسوم المتحركة'),
          ],
          [
            O('Agriculture', 'قطاع الزراعة'),
            O('Automated harvesting, sorting, cleaning & packaging control apps', 'برامج إدارة الحصاد والفرز والتنظيف والتعبئة'),
            O('Increases speed, consistency, and quality control of food production', 'رفع سرعة الإنتاج وضمان تجانس الجودة وتقليل الهدر'),
          ],
          [
            O('Textiles & Engineering', 'المنسوجات والهندسة'),
            O('CAD / CAM design & manufacturing software', 'برامج التصميم والتصنيع بمساعدة الحاسوب CAD/CAM'),
            O('Allows rapid digital prototyping before physical production', 'تصميم دقيق واختبار رقمي سريع قبل بدء التصنيع الفعلي'),
          ],
        ],
      },
      examTip: O(
        'Exam Tip (A.P1 / A.D1): When justifying Microsoft Office for an office scenario, explicitly mention "interoperability" (easy file exchange with clients/suppliers) and "pre-existing staff skills" (reduced training cost).',
        'نصيحة للامتحان (A.P1 / A.D1): عند تبرير اختيار Microsoft Office لشركة، اذكر مصطلحي «قابلية التشغيل البيني» (Interoperability) و«المهارات المكتسبة مسبقاً لدى الموظفين» لتقليل تكاليف التدريب.'
      ),
    },
  },
  {
    id: 'open-vs-proprietary',
    badge: O('Pillar 6 · PDF pp. 35–36', 'الركيزة 6 · الكتاب ص 35–36'),
    criteria: ['A.P1', 'A.M1', 'A.D1'],
    title: O('6. Open-Source vs. Proprietary Software Principles & Implications', '٦. البرمجيات مفتوحة المصدر (Open-Source) مقابل مسجلة الملكية (Proprietary)'),
    coreIdea: O(
      'Behind every OS and application is source code. Whether that code is publicly shared for collaborative modification (open-source) or kept secret by a company (proprietary) has major cost, security, and support implications.',
      'خلف كل نظام تشغيل وبرنامج تكمن «التعليمات البرمجية» (Source Code). ويترتب على كون هذا الكود متاحاً للجميع للتعديل التعاوني (مفتوح المصدر) أو سرياً مملوكاً لشركة (مسجل الملكية) آثار كبيرة على التكلفة والأمان والدعم الفني.'
    ),
    corePoints: [
      O(
        'Open-Source Software (e.g., Linux, Android base, LibreOffice): Written collaboratively by multiple programmers and tested through peer review. Anyone with the technical skill can inspect, copy, and adapt the code to their needs, and it is usually free of licence cost.',
        'البرمجيات مفتوحة المصدر (Open-Source): تُكتب بجهد تعاوني بين المبرمجين وتخضع لمراجعة الأقران (Peer Review) لاكتشاف الأخطاء وإصلاحها، ويمكن لأي شخص نسخ الكود وتكييفه حسب احتياجاته مجاناً.'
      ),
      O(
        'Risks of Open-Source & Mitigation: Because anyone can copy and modify the code, it may be altered by individuals with malicious intent, by experts who do not share the original creators’ safety standards, or by inexperienced programmers. Organisations mitigate this risk by verifying the official source repository before downloading.',
        'مخاطر المفتوح المصدر وكيفية تخفيفها: قد يُنسخ الكود ويُعدَّل من أشخاص ذوي نية خبيثة، أو خبراء لا يلتزمون بمعايير سلامة البرنامج، أو مبرمجين قليلي الخبرة. ويُخفف هذا الخطر بالتحقق من موثوقية مصدر الكود قبل تنزيله.'
      ),
      O(
        'Proprietary Software (e.g., Microsoft Windows/Office, Apple iOS, Sage, Pegasus): Privately owned and developed by company employees. The source code specifications are kept strictly secret to prevent unauthorized copying or modification; buyers purchase a licence to USE the software, not to alter its code.',
        'البرمجيات مسجلة الملكية (Proprietary — مثل Microsoft وApple وSage وPegasus): مملوكة لشركة خاصة يطورها موظفوها، وتُحفظ شفرتها المصدرية سرية لمنع النسخ أو التعديل؛ حيث يشتري المستخدم رخصة استخدام البرنامج فقط دون الحق في تعديل الكود.'
      ),
      O(
        'Support, Updates & Patches: Proprietary software carries high licensing costs, but the vendor collects error reports and distributes official security "Patches" and updates to registered users (though open-source communities also release rapid code upgrades).',
        'الدعم الفني والتصحيحات (Patches): رغم التكلفة العالية للبرمجيات الملكية وحصر تطويرها بمبرمجي الشركة، فإن الشركة تجمع بيانات الأعطال وتنشر «تصحيحات» (Patches) وتحديثات منتظمة للمستخدمين المسجلين.'
      ),
    ],
    expanded: {
      paragraphs: [
        O(
          'In BTEC evaluation questions (A.D1), neither model is universally "better"—it depends on the organisation. A startup with a tight budget and skilled IT staff may adopt open-source software to avoid licence fees and customise features. Conversely, an accounting firm using Sage or Pegasus prefers proprietary software because it guarantees official vendor accountability, compliance updates, and dedicated technical support.',
          'في أسئلة التقييم (A.D1)، لا يوجد خيار واحد هو الأفضل دائماً؛ فالشركة الناشئة ذات الميزانية المحدودة والتي تضم فنيين مهرة قد تختار البرمجيات مفتوحة المصدر لتوفير رسوم التراخيص وتخصيص الكود، بينما تفضّل الشركات المالية برامج ملكية مثل Sage أو Pegasus لضمان الدعم الفني الرسمي والتصحيحات المعتمدة.'
        ),
      ],
      table: {
        title: O('Open-Source vs. Proprietary Software (Unit 1 Comparison)', 'مقارنة شاملة: البرمجيات مفتوحة المصدر مقابل مسجلة الملكية'),
        headers: [
          O('Dimension', 'وجه المقارنة'),
          O('Open-Source Software', 'البرمجيات مفتوحة المصدر (Open-Source)'),
          O('Proprietary Software', 'البرمجيات مسجلة الملكية (Proprietary)'),
        ],
        rows: [
          [
            O('Source Code Access', 'الوصول للكود المصدري'),
            O('Publicly open; anyone can inspect, copy, and modify it', 'متاح للجميع؛ يمكن فحصه ونسخه وتكييفه حسب الحاجة'),
            O('Kept secret inside the company; users cannot view or edit it', 'سري ومغلق داخل الشركة؛ لا يحق للمستخدم تغييره'),
          ],
          [
            O('Cost & Licensing', 'التكلفة والترخيص'),
            O('Free to download and use without per-seat licence fees', 'مجانية الاستخدام والنسخ دون رسوم تراخيص لكل جهاز'),
            O('Requires paid purchase or ongoing subscription licences', 'تتطلب شراء تراخيص مدفوعة أو اشتراكات دورية مكلفة'),
          ],
          [
            O('Development & Quality', 'التطوير والجودة'),
            O('Collaborative community coding & peer review', 'تطوير تعاوني عالمي ومراجعة الأقران (Peer Review)'),
            O('Developed by salaried company programmers/contractors', 'يطورها موظفو الشركة ومتعاقدوها حصرياً'),
          ],
          [
            O('Security & Support Risks', 'المخاطر والدعم الفني'),
            O('Risk of malicious or inexperienced edits if downloaded from unverified sources', 'خطر التعديل الخبيث أو غير المتقن إن لم يُتحقق من المصدر'),
            O('Official vendor support & regular Patches, but vendor lock-in', 'تصحيحات (Patches) ودعم رسمي، لكن ارتباط ببائع واحد وتكلفة عالية'),
          ],
        ],
      },
      examTip: O(
        'Exam Tip: Always mention "peer review" as a strength of open-source software, and "official patches to registered users" as a strength of proprietary software.',
        'نصيحة للامتحان: اذكر دائماً «مراجعة الأقران» (Peer Review) كميزة للمصدر المفتوح، و«إرسال التصحيحات الرسمية (Patches) للمستخدمين المسجلين» كميزة للبرمجيات الملكية.'
      ),
    },
  },
  {
    id: 'files-compression',
    badge: O('Pillar 7 · PDF pp. 36–38 & 50–51', 'الركيزة 7 · الكتاب ص 36–38 و 50–51'),
    criteria: ['A.P1', 'A.M1', 'A.D1'],
    title: O('7. File Types, Formats, Compression & Organisational Impact', '٧. أنواع الملفات وتنسيقاتها وضغط البيانات وأثرها المؤسسي'),
    coreIdea: O(
      'File extensions tell the OS which program opens a file and how data is structured. Choosing file formats and compression methods (Lossy vs. Lossless) directly affects quality, storage size, compatibility, and business operations.',
      'تخبر لاحقة الملف (File Extension) نظام التشغيل بالبرنامج المناسب لفتحه وطريقة تخزينه. ويؤثر اختيار التنسيق ونوع الضغط (مع فقد Lossy أو بدون فقد Lossless) مباشرةً في الجودة والحجم والتوافق وسير العمل في المؤسسة.'
    ),
    corePoints: [
      O(
        'Image Formats: JPEG uses lossy compression (smaller file size ideal for email/web, but loses some image detail); PNG and GIF use lossless compression (GIF is limited by patent history and simple animations; PNG is patent-free and widely replaces TIFF); TIFF preserves high quality for printing but lacks universal app compatibility; RAW stores uncompressed DSLR sensor data for professional editing.',
        'تنسيقات الصور: JPEG يضغط الصورة مع فقدان بعض التفاصيل لتوفير المساحة (ممتاز للبريد والويب)؛ PNG وGIF يستخدمان ضغطاً بدون فقد (PNG حر من قيود براءات الاختراع وأوسع انتشاراً من GIF)؛ TIFF يحفظ جودة عالية للطباعة لكنه أقل توافقاً؛ وRAW غير مضغوط لكاميرات DSLR الاحترافية.'
      ),
      O(
        'Audio, Video & Document Formats: MP3 (lossy audio only) vs. WAV (uncompressed audio) and FLAC (lossless audio); MP4, MPEG, and AVI store audio + video (MP4 offers high quality but much larger files than MP3; both MP3 and MP4 are unprotected formats prone to piracy). For documents: DOC/DOCX (native Word format for heavy formatting/tables) vs. RTF (Rich Text Format — saves significant space on long documents and shares easily across different OS/versions), plus XLS/XLSX, CSV, XML, and PDF.',
        'الصوت والفيديو والمستندات: MP3 (صوت مضغوط مع فقد) مقابل WAV (غير مضغوط) وFLAC (بدون فقد)؛ MP4 وMPEG وAVI للفيديو والصوت. وفي المستندات: حفظ المستندات الطويلة بصيغة RTF يوفر مساحة كبيرة ويسهّل مشاركتها بين الأنظمة مقارنة بـ DOC، بينما يُفضّل DOC/DOCX للمستندات الغنية بالجداول والرسوم، وPDF لتثبيت التنسيق، وCSV/XML لتبادل البيانات.'
      ),
      O(
        'Lossy vs. Lossless Compression & Codecs: Compression reduces storage space and network bandwidth. Lossy removes imperceptible data permanently (MP3, MP4, JPEG); Lossless reorganises bits so 100% of original data is restored (ZIP, PNG, GIF, FLAC). A Codec (Coder-Decoder) encodes and decodes streams—both sender and receiver must have a compatible codec.',
        'الضغط (Lossy مقابل Lossless) والترميز (Codec): الضغط يقلل المساحة والنطاق الترددي؛ فـ Lossy يحذف بيانات غير ملحوظة نهائياً (MP3, JPEG)، وLossless يقلل عدد البتات دون حذف أي معلومة (ZIP, PNG, FLAC). ويتولى الـ Codec ضغط وفك ضغط الوسائط ويشترط توافقه لدى الطرفين.'
      ),
      O(
        'Implications for Organisations & Stakeholders: Format incompatibility (e.g., opening a newer file version in older software, or a spreadsheet in a word processor) blocks workflow. Furthermore, software upgrades and transitioning from manual to automated systems can delay daily operations, frustrate external clients/suppliers, and require significant staff training investment.',
        'الآثار على المؤسسات وأصحاب المصلحة: عدم توافق الإصدارات أو الصيغ يعطل تبادل الملفات. كما أن تحديثات الأنظمة والانتقال من النظام اليدوي إلى الآلي قد يؤخر العمليات اليومية ويؤثر في العملاء والموردين ويتطلب استثماراً في تدريب الموظفين.'
      ),
    ],
    expanded: {
      paragraphs: [
        O(
          'Why does a photographer shoot in RAW, edit in TIFF/PNG, and email previews in JPEG? Because each stage of the workflow has different priorities: RAW captures maximum sensor detail for editing, PNG preserves lossless transparency, and JPEG shrinks the file so it transmits quickly over email or mobile data.',
          'لماذا يلتقط المصور الصور بصيغة RAW، ويحررها بصيغة PNG/TIFF، ويرسلها للعميل عبر البريد بصيغة JPEG؟ لأن لكل مرحلة أولوية مختلفة: فصيغة RAW تحتفظ بكل تفاصيل الحساس للتعديل، وPNG تحفظ الجودة والشفافية بدون فقد، بينما تصغّر JPEG حجم الملف ليسهل إرساله بسرعة.'
        ),
      ],
      table: {
        title: O('Unit 1 File Formats & Compression Reference Matrix', 'مصفوفة تنسيقات الملفات وضغط البيانات في الوحدة الأولى'),
        headers: [
          O('Format', 'الصيغة'),
          O('Category & Compression', 'الفئة ونوع الضغط'),
          O('Strengths', 'نقاط القوة'),
          O('Limitations / Implications', 'القيود والآثار'),
        ],
        rows: [
          [
            O('JPEG (.jpg)', 'JPEG (.jpg)'),
            O('Image · Lossy', 'صورة · ضغط مع فقد (Lossy)'),
            O('Small file size; opens in almost every app and browser', 'حجم صغير جداً؛ يفتحه معظم البرامج والمتصفحات'),
            O('Loses image detail each time it is compressed/saved', 'يفقد جزءاً من الدقة والجودة بسبب الضغط'),
          ],
          [
            O('PNG (.png)', 'PNG (.png)'),
            O('Image · Lossless', 'صورة · ضغط بدون فقد (Lossless)'),
            O('Patent-free, lossless quality, supports transparency', 'جودة كاملة بدون فقد، حر من قيود البراءات، يدعم الشفافية'),
            O('Larger file size than JPEG for photographs', 'حجمه أكبر من JPEG في الصور الفوتوغرافية'),
          ],
          [
            O('RAW / TIFF', 'RAW / TIFF'),
            O('Image · Uncompressed / High-res', 'صورة · غير مضغوطة / عالية الدقة'),
            O('Maximum detail for professional DSLR editing & print', 'أعلى جودة ممكنة للتعديل الاحترافي والطباعة'),
            O('Very large files; RAW needs specialist software per camera brand', 'حجم ضخم؛ وتحتاج برامج خاصة ولا تتوافق مع كل التطبيقات'),
          ],
          [
            O('MP3 vs. MP4', 'MP3 مقابل MP4'),
            O('Audio / Video · Lossy', 'صوت / فيديو · ضغط مع فقد'),
            O('MP3: tiny audio files; MP4: high-quality audio + video container', 'MP3 صغير للصوت؛ وMP4 يجمع الصوت والفيديو بجودة عالية'),
            O('MP4 is much larger than MP3; both lack built-in DRM protection', 'حجم MP4 أكبر بكثير؛ وكلاهما غير محمي مما سهّل قرصنتهما'),
          ],
          [
            O('RTF vs. DOC/DOCX', 'RTF مقابل DOC/DOCX'),
            O('Document · Text / Formatted', 'مستندات نصية ومنسقة'),
            O('RTF saves space on long text & opens across different OS/versions', 'RTF يوفر مساحة كبيرة ويتوافق مع مختلف الأنظمة والإصدارات'),
            O('Complex tables/graphics require native DOC/DOCX format', 'المستندات المعقدة بالجداول والرسوم تتطلب صيغة DOC/DOCX الأصلية'),
          ],
          [
            O('ZIP / FLAC / CSV', 'ZIP / FLAC / CSV'),
            O('Archive / Audio / Data · Lossless', 'أرشيف / صوت / بيانات · بدون فقد'),
            O('ZIP/FLAC keep 100% of bits; CSV exchanges records across databases', 'استعادة البيانات 100% دون نقص؛ وCSV يتبادل السجلات بين الأنظمة'),
            O('Smaller size reduction than lossy formats', 'نسبة تقليص الحجم أقل مقارنة بالضغط مع فقد (Lossy)'),
          ],
        ],
      },
      examTip: O(
        'Exam Tip (A.M1 / A.D1): When discussing software updates or format changes in a business, always evaluate the human and operational impact: temporary downtime during updates, potential loss of business if systems stall, and the cost/time needed to train staff.',
        'نصيحة للامتحان (A.M1 / A.D1): عند مناقشة تحديث البرامج أو تغيير صيغ الملفات في مؤسسة، قيّم دائماً الأثر التشغيلي والبشري: توقف العمل المؤقت أثناء التحديث، احتمال خسارة صفقات، وتكلفة تدريب الموظفين وأثر ذلك على العملاء والموردين.'
      ),
    },
  },
];
