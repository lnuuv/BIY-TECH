// Data for the Infrastructure section (Layers · Computer · Simulation).
// Interaction model and content follow the supplied reference site ("3D" page: world-data.js, world-sim-data.js,
// world-extras.js). Arabic text is the reference's own; English comes from the reference site's own EN dictionary.
// Geometry units are the reference's CSS pixels (layers / computer) and scene units (simulation); the 3D module scales them.
// `lesson` links each item to the matching Unit 1 lesson in this platform.
const DATA = {
 "overview": {
  "title": {
   "en": "Computer Infrastructure",
   "ar": "البنية التحتية للحاسوب"
  },
  "idea": {
   "en": "The computer is an integrated system of four layers working together.",
   "ar": "الحاسوب نظام متكامل من أربع طبقات تعمل معاً."
  },
  "text": {
   "en": "Peripherals connect to the hardware, the hardware runs the software, and the network and internet connect the system to the outside world. Drag the model to rotate it, and click any layer or part to learn its idea and function.",
   "ar": "تتصل الأجهزة الطرفية بالعتاد، ويشغّل العتاد البرمجيات، وتربط الشبكة والإنترنت النظام بالعالم الخارجي. اسحب المجسم لتدويره، واضغط على أي طبقة أو قطعة لتعرف فكرتها ووظيفتها."
  },
  "points": [
   {
    "en": "Peripherals: inputting and outputting data",
    "ar": "الطرفيات: إدخال البيانات وإخراجها"
   },
   {
    "en": "Hardware: processing and storage",
    "ar": "العتاد: المعالجة والتخزين"
   },
   {
    "en": "Software: control and applications",
    "ar": "السوفتوير: التحكم والتطبيقات"
   },
   {
    "en": "Network: connecting to the internet and services",
    "ar": "الشبكة: الاتصال بالإنترنت والخدمات"
   }
  ]
 },
 "layers": [
  {
   "id": "net",
   "order": 0,
   "rgb": "34,211,238",
   "title": {
    "en": "Network & Internet",
    "ar": "الإنترنت والشبكة"
   },
   "idea": {
    "en": "Connects the computer to the outside world.",
    "ar": "تربط الحاسوب بالعالم الخارجي."
   },
   "text": {
    "en": "Networks carry data between devices by wire or wirelessly, and the modem and router connect them to the internet provider so they reach websites, servers and cloud storage.",
    "ar": "تنقل الشبكات البيانات بين الأجهزة عبر الأسلاك أو لاسلكياً، ويربطها المودم والراوتر بمزوّد الإنترنت فتصل إلى المواقع والخوادم والتخزين السحابي."
   },
   "points": [
    {
     "en": "Wired: Ethernet and optical fiber",
     "ar": "سلكي: إيثرنت وألياف ضوئية"
    },
    {
     "en": "Wireless: Wi-Fi, Bluetooth and cellular networks",
     "ar": "لاسلكي: Wi-Fi وبلوتوث وشبكات خلوية"
    },
    {
     "en": "Speed is determined by bandwidth and latency",
     "ar": "السرعة تتحدد بالنطاق الترددي وزمن الاستجابة"
    }
   ],
   "lesson": "networks"
  },
  {
   "id": "sw",
   "order": 1,
   "rgb": "139,92,246",
   "title": {
    "en": "Software",
    "ar": "السوفتوير"
   },
   "idea": {
    "en": "The brain that directs the hardware.",
    "ar": "العقل الذي يوجّه العتاد."
   },
   "text": {
    "en": "A set of programs starting with the operating system that manages the device, including utility software for maintenance, application software we get our work done with, and driver software that links hardware to the system.",
    "ar": "مجموعة برامج تبدأ بنظام التشغيل الذي يدير الجهاز، وتضم البرامج المساعدة للصيانة، وبرامج التطبيقات التي ننجز بها أعمالنا، وبرامج التعريف التي تربط العتاد بالنظام."
   },
   "points": [
    {
     "en": "The operating system is the base of all software",
     "ar": "نظام التشغيل أساس كل البرامج"
    },
    {
     "en": "Applications are for the end user",
     "ar": "التطبيقات للمستخدم المباشر"
    },
    {
     "en": "Utilities and drivers for maintenance and linking",
     "ar": "المساعدة والتعريفات للصيانة والربط"
    }
   ],
   "lesson": "software"
  },
  {
   "id": "hw",
   "order": 2,
   "rgb": "244,63,142",
   "title": {
    "en": "Hardware",
    "ar": "العتاد (الهاردوير)"
   },
   "idea": {
    "en": "The physical parts that execute instructions.",
    "ar": "الأجزاء المادية التي تنفّذ التعليمات."
   },
   "text": {
    "en": "Components are mounted on the motherboard: the processor executes commands, memory holds what is currently running, storage keeps files, and the network card connects the device for communication.",
    "ar": "تُثبَّت المكوّنات على اللوحة الأم: المعالج ينفّذ الأوامر، والذاكرة تحفظ ما يعمل حالياً، والتخزين يحفظ الملفات، وبطاقة الشبكة تصل الجهاز بالاتصال."
   },
   "points": [
    {
     "en": "Processor: the executing brain",
     "ar": "المعالج: العقل المنفّذ"
    },
    {
     "en": "Memory: fast temporary work",
     "ar": "الذاكرة: عمل مؤقت سريع"
    },
    {
     "en": "Storage: permanent saving",
     "ar": "التخزين: حفظ دائم"
    }
   ],
   "lesson": "devices"
  },
  {
   "id": "io",
   "order": 3,
   "rgb": "251,191,36",
   "title": {
    "en": "Peripherals",
    "ar": "الأجهزة الطرفية"
   },
   "idea": {
    "en": "The means of interaction between the user and the computer.",
    "ar": "وسائل التفاعل بين المستخدم والحاسوب."
   },
   "text": {
    "en": "Input devices give the computer data, and output devices display results. They connect to the hardware through ports such as USB or wirelessly, and the operating system manages them using driver software.",
    "ar": "أجهزة إدخال تعطي الحاسوب بيانات، وأجهزة إخراج تعرض النتائج. تتصل بالعتاد عبر منافذ مثل USB أو لاسلكياً، ويديرها نظام التشغيل بواسطة برامج التعريف."
   },
   "points": [
    {
     "en": "Input: keyboard, mouse and barcode scanner",
     "ar": "إدخال: لوحة مفاتيح وماوس وماسح باركود"
    },
    {
     "en": "Output: monitor and printer",
     "ar": "إخراج: شاشة وطابعة"
    },
    {
     "en": "Need drivers to work",
     "ar": "تحتاج Drivers لتعمل"
    }
   ],
   "lesson": "peripherals"
  }
 ],
 "parts": [
  {
   "id": "modem",
   "layer": "net",
   "x": -120,
   "z": 55,
   "boxes": [
    [
     0,
     0,
     62,
     22,
     46,
     0
    ]
   ],
   "title": {
    "en": "Modem",
    "ar": "المودم"
   },
   "idea": {
    "en": "Converts the signal between the internet line and the computer.",
    "ar": "يحوّل الإشارة بين خط الإنترنت والحاسوب."
   },
   "text": {
    "en": "The modem receives the signal coming from the service provider (phone line, fiber or cable) and converts it into digital data the device understands, and does the reverse when sending.",
    "ar": "يستقبل المودم الإشارة القادمة من مزوّد الخدمة (خط هاتف أو ألياف أو كبل) ويحوّلها إلى بيانات رقمية يفهمها الجهاز، ويفعل العكس عند الإرسال."
   },
   "points": [
    {
     "en": "Connects the home to the internet provider",
     "ar": "يربط المنزل بمزوّد الإنترنت"
    },
    {
     "en": "Its name comes from Modulator-Demodulator",
     "ar": "اسمه من Modulator-Demodulator"
    },
    {
     "en": "Today it often comes built into the router",
     "ar": "يأتي اليوم غالباً مدمجاً مع الراوتر"
    }
   ],
   "extra": false,
   "lesson": "connectivity"
  },
  {
   "id": "router",
   "layer": "net",
   "x": -25,
   "z": 55,
   "boxes": [
    [
     0,
     0,
     76,
     16,
     52,
     0
    ],
    [
     -30,
     -18,
     5,
     46,
     5,
     16
    ],
    [
     30,
     -18,
     5,
     46,
     5,
     16
    ]
   ],
   "title": {
    "en": "Router",
    "ar": "الراوتر"
   },
   "idea": {
    "en": "Distributes the internet to the network's devices.",
    "ar": "يوزّع الإنترنت على أجهزة الشبكة."
   },
   "text": {
    "en": "The router directs data packets between devices and the internet, often broadcasts Wi-Fi and has Ethernet ports, and adds a simple layer of protection to the network.",
    "ar": "يوجّه الراوتر حزم البيانات بين الأجهزة وبين الإنترنت، وغالباً يبث Wi-Fi ويحتوي منافذ إيثرنت، ويضيف طبقة حماية بسيطة للشبكة."
   },
   "points": [
    {
     "en": "Gives each device an address inside the network",
     "ar": "يعطي كل جهاز عنواناً داخل الشبكة"
    },
    {
     "en": "Broadcasts Wi-Fi and supports cable",
     "ar": "يبث Wi-Fi ويدعم الكبل"
    },
    {
     "en": "A password and firewall can be configured",
     "ar": "يمكن ضبط كلمة سر وجدار ناري"
    }
   ],
   "extra": false,
   "lesson": "networks"
  },
  {
   "id": "server",
   "layer": "net",
   "x": 125,
   "z": -40,
   "boxes": [
    [
     0,
     0,
     48,
     84,
     48,
     0
    ]
   ],
   "title": {
    "en": "Cloud Server",
    "ar": "الخادم السحابي"
   },
   "idea": {
    "en": "A powerful computer that provides services over the network.",
    "ar": "حاسوب قوي يقدّم خدمات عبر الشبكة."
   },
   "text": {
    "en": "It stores files and runs applications for users remotely. Cloud storage, cloud computing and the client-server model are built on it.",
    "ar": "يخزّن الملفات ويشغّل التطبيقات للمستخدمين عن بُعد. عليه يقوم التخزين السحابي والحوسبة السحابية ونموذج العميل والخادم."
   },
   "points": [
    {
     "en": "Serves several users at once",
     "ar": "يخدم عدة مستخدمين معاً"
    },
    {
     "en": "Provides backups and storage",
     "ar": "يوفر نسخاً احتياطية وتخزيناً"
    },
    {
     "en": "Usually managed by a network operating system (NOS)",
     "ar": "يُدار عادة بنظام تشغيل شبكات NOS"
    }
   ],
   "extra": false,
   "lesson": "devices"
  },
  {
   "id": "internet",
   "layer": "net",
   "x": -10,
   "z": -75,
   "boxes": [],
   "globe": true,
   "title": {
    "en": "Internet (WAN)",
    "ar": "الإنترنت"
   },
   "idea": {
    "en": "A global network of interconnected networks.",
    "ar": "شبكة عالمية من الشبكات المترابطة."
   },
   "text": {
    "en": "The internet connects millions of networks around the world through undersea cables, satellites and towers, and you reach it through a service provider.",
    "ar": "يربط الإنترنت ملايين الشبكات حول العالم عبر كوابل بحرية وأقمار صناعية وأبراج، وتصل إليه من خلال مزوّد الخدمة."
   },
   "points": [
    {
     "en": "Wide area network (WAN)",
     "ar": "شبكة واسعة WAN"
    },
    {
     "en": "Relies on protocols such as HTTP and TCP/IP",
     "ar": "تعتمد على بروتوكولات مثل HTTP وTCP/IP"
    },
    {
     "en": "Optical fiber carries most of the data",
     "ar": "الألياف الضوئية تنقل أغلب البيانات"
    }
   ],
   "extra": false,
   "lesson": "online"
  },
  {
   "id": "os",
   "layer": "sw",
   "x": 0,
   "z": 45,
   "boxes": [
    [
     0,
     0,
     240,
     14,
     150,
     0
    ]
   ],
   "title": {
    "en": "Operating System",
    "ar": "نظام التشغيل"
   },
   "idea": {
    "en": "The manager that organizes the device's resources.",
    "ar": "المدير الذي ينظّم موارد الجهاز."
   },
   "text": {
    "en": "It manages the processor, memory and storage, provides a user interface, and runs applications. Examples: Windows, Android, iOS and Linux.",
    "ar": "يدير المعالج والذاكرة والتخزين، ويوفر واجهة للمستخدم، ويشغّل التطبيقات. أمثلته Windows وAndroid وiOS وLinux."
   },
   "points": [
    {
     "en": "Graphical interface (GUI) or command line",
     "ar": "واجهة رسومية GUI أو سطر أوامر"
    },
    {
     "en": "Memory management and multitasking",
     "ar": "إدارة الذاكرة وتعدد المهام"
    },
    {
     "en": "Security and permission control",
     "ar": "الأمان والتحكم بالصلاحيات"
    }
   ],
   "extra": false,
   "lesson": "software"
  },
  {
   "id": "apps",
   "layer": "sw",
   "x": -100,
   "z": -70,
   "boxes": [
    [
     0,
     0,
     50,
     20,
     50,
     0
    ],
    [
     58,
     0,
     50,
     20,
     50,
     0
    ],
    [
     116,
     0,
     50,
     20,
     50,
     0
    ]
   ],
   "title": {
    "en": "Application Software",
    "ar": "برامج التطبيقات"
   },
   "idea": {
    "en": "Programs we get our work done with.",
    "ar": "برامج ننجز بها أعمالنا."
   },
   "text": {
    "en": "Such as Word, Excel, browsers, design and programming tools and databases; they run on top of the operating system and use its resources.",
    "ar": "مثل Word وExcel والمتصفحات وبرامج التصميم والبرمجة وقواعد البيانات؛ تعمل فوق نظام التشغيل وتستخدم موارده."
   },
   "points": [
    {
     "en": "Office, CAD and ERP",
     "ar": "Office وCAD وERP"
    },
    {
     "en": "Lower costs and raise output",
     "ar": "تخفّض التكاليف وترفع الإنتاج"
    },
    {
     "en": "Don't necessarily work on every system",
     "ar": "لا تعمل بالضرورة على كل الأنظمة"
    }
   ],
   "extra": false,
   "lesson": "software"
  },
  {
   "id": "utility",
   "layer": "sw",
   "x": 95,
   "z": -70,
   "boxes": [
    [
     0,
     0,
     60,
     16,
     60,
     0
    ]
   ],
   "title": {
    "en": "Utility Software",
    "ar": "البرامج المساعدة"
   },
   "idea": {
    "en": "The maintenance and protection crew.",
    "ar": "فريق الصيانة والحماية."
   },
   "text": {
    "en": "System programs that perform routine tasks: antivirus, backup, disk cleanup, compression and encryption.",
    "ar": "برامج نظام تنفّذ مهاماً روتينية: مكافحة الفيروسات، النسخ الاحتياطي، تنظيف الأقراص، الضغط والتشفير."
   },
   "points": [
    {
     "en": "Antivirus",
     "ar": "مكافحة الفيروسات"
    },
    {
     "en": "Backup and disk defragmentation",
     "ar": "نسخ احتياطي وتجزئة الأقراص"
    },
    {
     "en": "File compression and encryption",
     "ar": "ضغط وتشفير الملفات"
    }
   ],
   "extra": false,
   "lesson": "software"
  },
  {
   "id": "drivers",
   "layer": "sw",
   "x": 150,
   "z": 60,
   "boxes": [
    [
     0,
     0,
     44,
     12,
     70,
     0
    ]
   ],
   "title": {
    "en": "Device Drivers",
    "ar": "برامج التعريف"
   },
   "idea": {
    "en": "A translator between the operating system and a piece of hardware.",
    "ar": "مترجم بين نظام التشغيل وقطعة العتاد."
   },
   "text": {
    "en": "A small program that tells the operating system how to handle a peripheral such as a printer, keyboard or network card.",
    "ar": "برنامج صغير يخبر نظام التشغيل كيف يتعامل مع جهاز طرفي مثل الطابعة أو لوحة المفاتيح أو بطاقة الشبكة."
   },
   "points": [
    {
     "en": "Each device has its own driver",
     "ar": "لكل جهاز تعريفه الخاص"
    },
    {
     "en": "Updating them improves performance and compatibility",
     "ar": "تحديثها يحسّن الأداء والتوافق"
    },
    {
     "en": "Without them the device may not work",
     "ar": "غيابها يعني أن الجهاز قد لا يعمل"
    }
   ],
   "extra": false,
   "lesson": "software"
  },
  {
   "id": "cpu",
   "layer": "hw",
   "x": 0,
   "z": 0,
   "boxes": [
    [
     0,
     0,
     64,
     18,
     64,
     0
    ]
   ],
   "title": {
    "en": "CPU",
    "ar": "المعالج"
   },
   "idea": {
    "en": "The computer's brain.",
    "ar": "عقل الحاسوب."
   },
   "text": {
    "en": "Executes program instructions and performs calculations, and the operating system divides its time among tasks to achieve multitasking.",
    "ar": "ينفّذ تعليمات البرامج ويجري العمليات الحسابية، ويوزّع نظام التشغيل وقته بين المهام لتحقيق تعدد المهام."
   },
   "points": [
    {
     "en": "Measured by speed and number of cores",
     "ar": "يُقاس بالسرعة وعدد الأنوية"
    },
    {
     "en": "The heavier the load, the slower the device",
     "ar": "كلما زاد الحمل بطؤ الجهاز"
    },
    {
     "en": "Connects directly to memory",
     "ar": "يتصل مباشرة بالذاكرة"
    }
   ],
   "extra": false,
   "lesson": "devices"
  },
  {
   "id": "ram",
   "layer": "hw",
   "x": -125,
   "z": -30,
   "boxes": [
    [
     0,
     0,
     12,
     36,
     88,
     0
    ],
    [
     18,
     0,
     12,
     36,
     88,
     0
    ]
   ],
   "title": {
    "en": "RAM",
    "ar": "الذاكرة العشوائية"
   },
   "idea": {
    "en": "The fast temporary workspace.",
    "ar": "مساحة العمل السريعة المؤقتة."
   },
   "text": {
    "en": "Holds the programs and data currently running so the processor reaches them quickly, and is emptied when the device is switched off.",
    "ar": "تحتفظ بالبرامج والبيانات العاملة حالياً ليصل إليها المعالج بسرعة، وتفرغ عند إطفاء الجهاز."
   },
   "points": [
    {
     "en": "Faster than storage",
     "ar": "أسرع من التخزين"
    },
    {
     "en": "Emptied at shutdown",
     "ar": "تفرغ عند إيقاف التشغيل"
    },
    {
     "en": "Adding more improves multitasking",
     "ar": "زيادتها تحسّن تعدد المهام"
    }
   ],
   "extra": false,
   "lesson": "devices"
  },
  {
   "id": "storage",
   "layer": "hw",
   "x": 110,
   "z": 70,
   "boxes": [
    [
     0,
     0,
     100,
     14,
     64,
     0
    ]
   ],
   "title": {
    "en": "Storage (SSD / HDD)",
    "ar": "التخزين"
   },
   "idea": {
    "en": "Permanent saving of files and the system.",
    "ar": "الحفظ الدائم للملفات والنظام."
   },
   "text": {
    "en": "The solid-state drive (SSD) is fast and shock-resistant, while the magnetic hard drive (HDD) is cheaper with larger capacity but slower and more sensitive.",
    "ar": "قرص الحالة الصلبة SSD سريع ومقاوم للصدمات، والقرص المغناطيسي HDD أرخص وأكبر سعة لكنه أبطأ وأكثر حساسية."
   },
   "points": [
    {
     "en": "SSD: higher speed and cost",
     "ar": "SSD: سرعة وتكلفة أعلى"
    },
    {
     "en": "HDD: large capacity and lower price",
     "ar": "HDD: سعة كبيرة وسعر أقل"
    },
    {
     "en": "RAID for protecting data on servers",
     "ar": "RAID لحماية البيانات في الخوادم"
    }
   ],
   "extra": false,
   "lesson": "peripherals"
  },
  {
   "id": "nic",
   "layer": "hw",
   "x": -110,
   "z": 85,
   "boxes": [
    [
     0,
     0,
     56,
     10,
     36,
     0
    ]
   ],
   "title": {
    "en": "Network card (NIC)",
    "ar": "بطاقة الشبكة"
   },
   "idea": {
    "en": "The device's gateway to the network.",
    "ar": "بوابة الجهاز إلى الشبكة."
   },
   "text": {
    "en": "Turns the device's data into signals sent over the cable or wirelessly, and each card has a unique address called a MAC.",
    "ar": "تحوّل بيانات الجهاز إلى إشارات تُرسل عبر الكبل أو لاسلكياً، ولكل بطاقة عنوان فريد يسمى MAC."
   },
   "points": [
    {
     "en": "Wired (Ethernet) or Wi-Fi",
     "ar": "سلكية (إيثرنت) أو Wi-Fi"
    },
    {
     "en": "Connects to the router",
     "ar": "تتصل بالراوتر"
    },
    {
     "en": "Needs a driver to work",
     "ar": "تحتاج Driver لتعمل"
    }
   ],
   "extra": false,
   "lesson": "connectivity"
  },
  {
   "id": "monitor",
   "layer": "io",
   "x": 0,
   "z": -80,
   "boxes": [
    [
     0,
     0,
     130,
     76,
     8,
     30
    ],
    [
     0,
     0,
     18,
     30,
     18,
     0
    ],
    [
     0,
     0,
     60,
     4,
     36,
     0
    ]
   ],
   "title": {
    "en": "Monitor",
    "ar": "الشاشة"
   },
   "idea": {
    "en": "Shows what the computer is doing.",
    "ar": "تعرض ما يفعله الحاسوب."
   },
   "text": {
    "en": "A visual output device that displays results and graphical interfaces, and monitors vary in size and resolution.",
    "ar": "جهاز إخراج مرئي يُظهر النتائج والواجهات الرسومية، وتتنوع الشاشات بالحجم والدقة."
   },
   "points": [
    {
     "en": "Output device",
     "ar": "جهاز إخراج"
    },
    {
     "en": "Connects via HDMI or DVI",
     "ar": "يتصل عبر HDMI أو DVI"
    },
    {
     "en": "Graphics quality depends on the graphics card",
     "ar": "جودة الرسوم تعتمد على بطاقة الرسوم"
    }
   ],
   "extra": false,
   "lesson": "peripherals"
  },
  {
   "id": "keyboard",
   "layer": "io",
   "x": 0,
   "z": 60,
   "boxes": [
    [
     0,
     0,
     150,
     8,
     48,
     0
    ]
   ],
   "title": {
    "en": "Keyboard",
    "ar": "لوحة المفاتيح"
   },
   "idea": {
    "en": "A tool for entering text and commands.",
    "ar": "أداة إدخال النصوص والأوامر."
   },
   "text": {
    "en": "Turns key presses into data the computer understands, and connects via USB or Bluetooth.",
    "ar": "تحوّل ضغطات الأزرار إلى بيانات يفهمها الحاسوب، وتتصل عبر USB أو بلوتوث."
   },
   "points": [
    {
     "en": "Input device",
     "ar": "جهاز إدخال"
    },
    {
     "en": "Wired or wireless",
     "ar": "سلكية أو لاسلكية"
    },
    {
     "en": "The basis of the command-line interface",
     "ar": "أساس واجهة سطر الأوامر"
    }
   ],
   "extra": false,
   "lesson": "peripherals"
  },
  {
   "id": "mouse",
   "layer": "io",
   "x": 115,
   "z": 70,
   "boxes": [
    [
     0,
     0,
     24,
     10,
     36,
     0
    ]
   ],
   "title": {
    "en": "Mouse",
    "ar": "الماوس"
   },
   "idea": {
    "en": "A pointing device for selecting on screen.",
    "ar": "جهاز تأشير يحدّد على الشاشة."
   },
   "text": {
    "en": "Moves the cursor and selects items in the graphical interface (GUI), and is the best-known pointing device.",
    "ar": "يحرك المؤشر ويختار العناصر في الواجهة الرسومية GUI، وهو أشهر أجهزة التأشير."
   },
   "points": [
    {
     "en": "Pointing device",
     "ar": "جهاز تأشير"
    },
    {
     "en": "The basis of WIMP computing",
     "ar": "أساس حوسبة WIMP"
    },
    {
     "en": "Its alternatives are the touchpad and touchscreen",
     "ar": "بدائله لوحة اللمس والشاشة اللمسية"
    }
   ],
   "extra": false,
   "lesson": "peripherals"
  },
  {
   "id": "printer",
   "layer": "io",
   "x": -140,
   "z": -30,
   "boxes": [
    [
     0,
     0,
     96,
     38,
     76,
     0
    ]
   ],
   "title": {
    "en": "Printer",
    "ar": "الطابعة"
   },
   "idea": {
    "en": "Turns the digital document into paper.",
    "ar": "تحوّل المستند الرقمي إلى ورق."
   },
   "text": {
    "en": "An output device that prints text and images, needs a driver, and can be shared over the network under the operating system's management.",
    "ar": "جهاز إخراج يطبع النصوص والصور، ويحتاج Driver، ويمكن مشاركته عبر الشبكة بإدارة نظام التشغيل."
   },
   "points": [
    {
     "en": "Output device",
     "ar": "جهاز إخراج"
    },
    {
     "en": "Shared over the network",
     "ar": "تُشارك عبر الشبكة"
    },
    {
     "en": "Managed by a print queue",
     "ar": "تُدار بطابور طباعة"
    }
   ],
   "extra": false,
   "lesson": "peripherals"
  },
  {
   "id": "scanner",
   "layer": "io",
   "x": 150,
   "z": -45,
   "boxes": [
    [
     0,
     0,
     28,
     34,
     28,
     0
    ]
   ],
   "title": {
    "en": "Barcode Scanner",
    "ar": "ماسح الباركود"
   },
   "idea": {
    "en": "Fast data entry in stores.",
    "ar": "إدخال سريع للبيانات في المتاجر."
   },
   "text": {
    "en": "Reads the barcode so product data enters the system instantly, and is used in checkout, warehouses and express mail.",
    "ar": "يقرأ الرمز الشريطي فتدخل بيانات المنتج للنظام فوراً، ويُستخدم في الدفع والمخازن والبريد السريع."
   },
   "points": [
    {
     "en": "Input device",
     "ar": "جهاز إدخال"
    },
    {
     "en": "Speeds up accounting and inventory",
     "ar": "يسرّع المحاسبة والمخزون"
    },
    {
     "en": "Linked to ERP and SCM systems",
     "ar": "يرتبط بأنظمة ERP وSCM"
    }
   ],
   "extra": false,
   "lesson": "peripherals"
  },
  {
   "id": "case",
   "layer": "hw",
   "title": {
    "en": "Computer case",
    "ar": "صندوق الحاسوب"
   },
   "idea": {
    "en": "The frame that houses the computer's components.",
    "ar": "الهيكل الذي يحتضن مكوّنات الحاسوب."
   },
   "text": {
    "en": "Protects the internal components (motherboard, processor, memory, storage) from dust and shocks, and provides ventilation and connection ports.",
    "ar": "يحمي المكوّنات الداخلية (اللوحة الأم، المعالج، الذاكرة، التخزين) من الغبار والصدمات، ويوفر التهوية ومنافذ التوصيل."
   },
   "points": [
    {
     "en": "Holds the motherboard, processor and memory",
     "ar": "يضم اللوحة الأم والمعالج والذاكرة"
    },
    {
     "en": "Provides cooling and ventilation",
     "ar": "يوفر تبريداً وتهوية"
    },
    {
     "en": "Has USB, Ethernet and display ports",
     "ar": "فيه منافذ USB وإيثرنت وشاشة"
    }
   ],
   "extra": true,
   "lesson": "devices"
  },
  {
   "id": "ethernet",
   "layer": "net",
   "title": {
    "en": "Ethernet cable",
    "ar": "كبل إيثرنت"
   },
   "idea": {
    "en": "A wire that connects the computer to the network quickly and steadily.",
    "ar": "سلك يصل الحاسوب بالشبكة بسرعة وثبات."
   },
   "text": {
    "en": "Carries data between the computer's network card and the router through an RJ-45 connector, and is in most cases faster and more stable than Wi-Fi.",
    "ar": "ينقل البيانات بين بطاقة الشبكة في الحاسوب والراوتر عبر موصل RJ-45، وهو في أغلب الحالات أسرع وأكثر استقراراً من Wi-Fi."
   },
   "points": [
    {
     "en": "Reliable wired connection",
     "ar": "اتصال سلكي موثوق"
    },
    {
     "en": "Connects the network card to the router",
     "ar": "يصل بطاقة الشبكة بالراوتر"
    },
    {
     "en": "Types such as Cat5e and Cat6 are used",
     "ar": "تُستخدم أنواع مثل Cat5e وCat6"
    }
   ],
   "extra": true,
   "lesson": "connectivity"
  }
 ],
 "scene": [
  {
   "id": "case",
   "group": "hw",
   "x": -170,
   "z": -40,
   "boxes": [
    [
     0,
     0,
     70,
     150,
     140,
     0
    ]
   ]
  },
  {
   "id": "cpu",
   "group": "hw",
   "x": -170,
   "z": -40,
   "mini": true,
   "boxes": [
    [
     0,
     -30,
     30,
     8,
     30,
     100
    ]
   ]
  },
  {
   "id": "ram",
   "group": "hw",
   "x": -170,
   "z": -40,
   "mini": true,
   "boxes": [
    [
     -18,
     25,
     10,
     38,
     70,
     60
    ],
    [
     -4,
     25,
     10,
     38,
     70,
     60
    ]
   ]
  },
  {
   "id": "storage",
   "group": "hw",
   "x": -170,
   "z": -40,
   "mini": true,
   "boxes": [
    [
     0,
     25,
     50,
     12,
     60,
     20
    ]
   ]
  },
  {
   "id": "nic",
   "group": "hw",
   "x": -170,
   "z": -40,
   "mini": true,
   "boxes": [
    [
     18,
     -45,
     26,
     6,
     20,
     130
    ]
   ]
  },
  {
   "id": "monitor",
   "group": "io",
   "x": 60,
   "z": -70,
   "boxes": [
    [
     0,
     0,
     150,
     90,
     8,
     38
    ],
    [
     0,
     0,
     20,
     38,
     20,
     0
    ],
    [
     0,
     0,
     70,
     4,
     40,
     0
    ]
   ]
  },
  {
   "id": "os",
   "group": "sw",
   "x": 60,
   "z": -70,
   "boxes": [
    [
     0,
     0,
     140,
     5,
     95,
     175
    ]
   ]
  },
  {
   "id": "apps",
   "group": "sw",
   "x": 60,
   "z": -70,
   "boxes": [
    [
     -44,
     0,
     38,
     5,
     60,
     205
    ],
    [
     0,
     0,
     38,
     5,
     60,
     205
    ],
    [
     44,
     0,
     38,
     5,
     60,
     205
    ]
   ]
  },
  {
   "id": "utility",
   "group": "sw",
   "x": 60,
   "z": -70,
   "boxes": [
    [
     0,
     0,
     120,
     5,
     80,
     235
    ]
   ]
  },
  {
   "id": "drivers",
   "group": "sw",
   "x": 60,
   "z": -70,
   "boxes": [
    [
     0,
     0,
     100,
     5,
     70,
     265
    ]
   ]
  },
  {
   "id": "keyboard",
   "group": "io",
   "x": 60,
   "z": 55,
   "boxes": [
    [
     0,
     0,
     150,
     8,
     48,
     0
    ]
   ]
  },
  {
   "id": "mouse",
   "group": "io",
   "x": 175,
   "z": 62,
   "boxes": [
    [
     0,
     0,
     24,
     10,
     36,
     0
    ]
   ]
  },
  {
   "id": "printer",
   "group": "io",
   "x": 225,
   "z": -60,
   "boxes": [
    [
     0,
     0,
     96,
     38,
     76,
     0
    ]
   ]
  },
  {
   "id": "scanner",
   "group": "io",
   "x": 232,
   "z": 50,
   "boxes": [
    [
     0,
     0,
     28,
     34,
     28,
     0
    ]
   ]
  },
  {
   "id": "router",
   "group": "net",
   "x": -60,
   "z": 60,
   "boxes": [
    [
     0,
     0,
     76,
     16,
     52,
     0
    ],
    [
     -30,
     -18,
     5,
     46,
     5,
     16
    ],
    [
     30,
     -18,
     5,
     46,
     5,
     16
    ]
   ]
  },
  {
   "id": "modem",
   "group": "net",
   "x": -60,
   "z": 130,
   "boxes": [
    [
     0,
     0,
     62,
     22,
     46,
     0
    ]
   ]
  },
  {
   "id": "ethernet",
   "group": "net",
   "x": -124,
   "z": 60,
   "boxes": [
    [
     -26,
     -10,
     6,
     4,
     30,
     0
    ],
    [
     0,
     0,
     52,
     4,
     6,
     0
    ],
    [
     64,
     35,
     6,
     4,
     46,
     0
    ]
   ]
  },
  {
   "id": "internet",
   "group": "net",
   "x": 40,
   "z": 150,
   "globe": true,
   "boxes": []
  },
  {
   "id": "server",
   "group": "net",
   "x": 150,
   "z": 140,
   "boxes": [
    [
     0,
     0,
     48,
     84,
     48,
     0
    ]
   ]
  }
 ],
 "simOverview": {
  "title": {
   "en": "The Internet infrastructure",
   "ar": "الإنترنت في العالم الحقيقي"
  },
  "idea": {
   "en": "Behind every page you open is a physical journey: cables, buildings, satellites and servers.",
   "ar": "خلف كل صفحة تفتحها رحلة مادية: كبلات ومباني وأقمار وخوادم."
  },
  "text": {
   "en": "This is a simplified simulation of the internet's path from your home to a data center on another continent. Rotate the world by dragging, zoom with the wheel, and click any icon to learn about that part, or press \"Send message\" to see the whole data journey.",
   "ar": "هذه محاكاة مبسّطة لمسار الإنترنت من منزلك حتى مركز بيانات في قارة أخرى. دوّر العالم بالسحب، وكبّر بالعجلة، واضغط على أي أيقونة لتتعرف على الجزء، أو اضغط «أرسل رسالة» لترى رحلة البيانات كاملة."
  },
  "points": [
   {
    "en": "Buildings and distances are shrunk and simplified for illustration",
    "ar": "الأبنية والمسافات مصغّرة ومبسّطة للتوضيح"
   },
   {
    "en": "The internet relies on land and undersea cables more than people imagine",
    "ar": "الإنترنت يعتمد على الكبلات الأرضية والبحرية أكثر مما يتخيل الناس"
   },
   {
    "en": "Satellites complement the network and in most cases do not replace it",
    "ar": "الأقمار الصناعية تكمّل الشبكة ولا تحل محلها في أغلب الحالات"
   }
  ]
 },
 "spots": [
  {
   "id": "home",
   "icon": "🏠",
   "label": {
    "en": "Your home",
    "ar": "منزلك"
   },
   "anchor": [
    -70,
    12,
    15
   ],
   "target": [
    -70,
    3,
    15
   ],
   "cam": [
    48,
    0.55,
    1.1
   ]
  },
  {
   "id": "cabinet",
   "icon": "🗄️",
   "label": {
    "en": "Street cabinet",
    "ar": "خزانة الحي"
   },
   "anchor": [
    -52,
    6,
    12
   ],
   "target": [
    -52,
    1,
    12
   ],
   "cam": [
    34,
    0.5,
    1.1
   ]
  },
  {
   "id": "tower",
   "icon": "🗼",
   "label": {
    "en": "Cell tower",
    "ar": "برج خلوي"
   },
   "anchor": [
    -80,
    30,
    -25
   ],
   "target": [
    -80,
    12,
    -25
   ],
   "cam": [
    62,
    0.5,
    1.15
   ]
  },
  {
   "id": "isp",
   "icon": "🏢",
   "label": {
    "en": "Service provider",
    "ar": "مزوّد الخدمة"
   },
   "anchor": [
    -30,
    14,
    12
   ],
   "target": [
    -30,
    4,
    12
   ],
   "cam": [
    52,
    0.45,
    1.1
   ]
  },
  {
   "id": "ixp",
   "icon": "🔀",
   "label": {
    "en": "Exchange point",
    "ar": "نقطة التبادل"
   },
   "anchor": [
    0,
    13,
    0
   ],
   "target": [
    0,
    4,
    0
   ],
   "cam": [
    50,
    0.4,
    1.1
   ]
  },
  {
   "id": "dc",
   "icon": "🏭",
   "label": {
    "en": "Data center",
    "ar": "مركز البيانات"
   },
   "anchor": [
    22,
    14,
    -18
   ],
   "target": [
    22,
    4,
    -18
   ],
   "cam": [
    62,
    0.4,
    1.1
   ]
  },
  {
   "id": "landing",
   "icon": "⚓",
   "label": {
    "en": "Landing station",
    "ar": "محطة الإنزال"
   },
   "anchor": [
    40,
    10,
    5
   ],
   "target": [
    40,
    2,
    5
   ],
   "cam": [
    48,
    0.8,
    1.1
   ]
  },
  {
   "id": "cable",
   "icon": "🌊",
   "label": {
    "en": "Undersea cable",
    "ar": "الكابل البحري"
   },
   "anchor": [
    90,
    2,
    0
   ],
   "target": [
    90,
    -2,
    0
   ],
   "cam": [
    110,
    0.3,
    1.2
   ]
  },
  {
   "id": "eastdc",
   "icon": "🌍",
   "label": {
    "en": "Another continent",
    "ar": "قارة أخرى"
   },
   "anchor": [
    190,
    15,
    -10
   ],
   "target": [
    190,
    4,
    -10
   ],
   "cam": [
    70,
    0.2,
    1.1
   ]
  },
  {
   "id": "satellite",
   "icon": "🛰️",
   "label": {
    "en": "Satellite",
    "ar": "قمر صناعي"
   },
   "anchor": [
    100,
    58,
    -10
   ],
   "target": [
    100,
    50,
    -10
   ],
   "cam": [
    120,
    0.3,
    1.2
   ]
  }
 ],
 "simEntries": {
  "home": {
   "title": {
    "en": "Home network",
    "ar": "المنزل: بداية الرحلة"
   },
   "idea": {
    "en": "Your device, the router and the modem are your gateway to the internet.",
    "ar": "جهازك والراوتر والمودم هي بوابتك إلى الإنترنت."
   },
   "text": {
    "en": "Your computer connects to the router by Ethernet cable or Wi-Fi, and the router shares the connection with the home's devices and gives each one an internal address. The modem (or the fiber device, ONT) converts the signal coming from the street into digital data.",
    "ar": "يتصل حاسوبك بالراوتر بكبل إيثرنت أو Wi-Fi، والراوتر يوزّع الاتصال على أجهزة المنزل ويعطي كلاً منها عنواناً داخلياً. أما المودم (أو جهاز الألياف ONT) فيحوّل الإشارة القادمة من الشارع إلى بيانات رقمية."
   },
   "points": [
    {
     "en": "The router connects the home network to the internet and translates addresses (NAT)",
     "ar": "الراوتر يربط شبكة المنزل بالإنترنت ويترجم العناوين (NAT)"
    },
    {
     "en": "The modem or ONT connects to the provider's line",
     "ar": "المودم أو ONT يتصل بخط المزوّد"
    },
    {
     "en": "The built-in firewall protects the home network",
     "ar": "الجدار الناري المدمج يحمي الشبكة المنزلية"
    }
   ]
  },
  "cabinet": {
   "title": {
    "en": "Street cabinet",
    "ar": "خزانة التوزيع"
   },
   "idea": {
    "en": "A neighborhood collection point that links homes to the provider's network.",
    "ar": "نقطة تجميع في الحي تصل المنازل بشبكة المزوّد."
   },
   "text": {
    "en": "The lines of several homes gather in a small street cabinet, and from there a larger fiber or copper cable runs to the provider's building. In fiber to the home (FTTH), the fiber reaches inside the home.",
    "ar": "تتجمع خطوط عدة منازل في خزانة صغيرة بالشارع، ومنها يخرج كبل ألياف أو نحاس أكبر نحو مبنى المزوّد. في الألياف إلى المنزل (FTTH) تصل الألياف حتى داخل المنزل."
   },
   "points": [
    {
     "en": "Gathers the neighborhood's lines at a single point",
     "ar": "تجمّع خطوط الحي في نقطة واحدة"
    },
    {
     "en": "May be fiber to the cabinet (FTTC) or to the home (FTTH)",
     "ar": "قد تكون ألياف حتى الخزانة (FTTC) أو حتى المنزل (FTTH)"
    },
    {
     "en": "The shorter the copper distance, the higher the speed",
     "ar": "كلما قصرت المسافة النحاسية زادت السرعة"
    }
   ]
  },
  "tower": {
   "title": {
    "en": "Cell tower",
    "ar": "برج الاتصالات الخلوية"
   },
   "idea": {
    "en": "Serves phones in its area with radio waves and connects to the network by cable.",
    "ar": "يخدم الهواتف في منطقته بموجات راديوية ويتصل بالشبكة بكبل."
   },
   "text": {
    "en": "Each tower covers a \"cell\" and broadcasts with sector antennas. Once your phone's connection reaches the tower, it travels over fiber or microwave links to the operator's network and from there to the internet.",
    "ar": "كل برج يغطي «خلية» ويبث بهوائيات قطاعية. ما إن يصل اتصال هاتفك إلى البرج حتى ينتقل عبر ألياف أو وصلات ميكروويف إلى شبكة المشغّل ومنها إلى الإنترنت."
   },
   "points": [
    {
     "en": "The phone connects to the strongest nearby tower and moves between towers",
     "ar": "الهاتف يتصل بأقوى برج قريب ويتنقل بين الأبراج"
    },
    {
     "en": "The link between the tower and the operator's network is called backhaul",
     "ar": "الاتصال بين البرج وشبكة المشغّل يُسمى Backhaul"
    },
    {
     "en": "5G uses denser towers and lower latency",
     "ar": "5G تستخدم أبراجاً أكثر كثافة وزمن استجابة أقل"
    }
   ]
  },
  "isp": {
   "title": {
    "en": "ISP central office",
    "ar": "مزوّد خدمة الإنترنت"
   },
   "idea": {
    "en": "The company that connects you to the internet and gives you an address on it.",
    "ar": "الشركة التي توصلك بالإنترنت وتعطيك عنواناً فيه."
   },
   "text": {
    "en": "The provider receives subscriber lines in a main building, authenticates your connection and gives you an IP address, runs DNS servers, then passes your traffic on to larger networks through exchange points.",
    "ar": "يستقبل المزوّد خطوط المشتركين في مبنى رئيسي، ويصادق على اتصالك ويمنحك عنوان IP، ويشغّل خوادم DNS، ثم يمرّر حركتك إلى شبكات أكبر عبر نقاط التبادل."
   },
   "points": [
    {
     "en": "Gives you an IP address (often via DHCP)",
     "ar": "يمنحك عنوان IP (غالباً عبر DHCP)"
    },
    {
     "en": "Runs DNS servers to translate names",
     "ar": "يشغّل خوادم DNS لترجمة الأسماء"
    },
    {
     "en": "Makes interconnection agreements with other networks",
     "ar": "يعقد اتفاقيات اتصال مع شبكات أخرى"
    }
   ]
  },
  "ixp": {
   "title": {
    "en": "Internet Exchange Point (IXP)",
    "ar": "نقطة تبادل الإنترنت"
   },
   "idea": {
    "en": "A place where many networks meet to exchange traffic directly.",
    "ar": "مكان تلتقي فيه شبكات كثيرة لتتبادل الحركة مباشرة."
   },
   "text": {
    "en": "Instead of data passing through distant intermediaries, networks (providers and content platforms) connect to a huge switch inside the building and exchange traffic locally, which reduces delay and cost.",
    "ar": "بدل أن تمر البيانات عبر وسطاء بعيدين، تتصل الشبكات (مزوّدون ومنصات محتوى) بسويتش ضخم داخل المبنى فتتبادل الحركة محلياً، مما يخفض التأخير والتكلفة."
   },
   "points": [
    {
     "en": "Exchanging traffic is called peering",
     "ar": "تبادل الحركة يسمى Peering"
    },
    {
     "en": "Reduces latency and lowers transit cost",
     "ar": "يقلل زمن الاستجابة ويخفض تكلفة العبور"
    },
    {
     "en": "Among the most important internet interconnection points geographically",
     "ar": "من أهم نقاط ربط الإنترنت جغرافياً"
    }
   ]
  },
  "dc": {
   "title": {
    "en": "Data center",
    "ar": "مركز البيانات"
   },
   "idea": {
    "en": "A building full of servers hosting websites, applications and cloud storage.",
    "ar": "مبنى مليء بالخوادم يستضيف المواقع والتطبيقات والتخزين السحابي."
   },
   "text": {
    "en": "Servers line up in racks inside cooled halls, powered by multiple electricity sources and backup generators. They connect to the internet through multiple fibers to avoid outages.",
    "ar": "تصطف الخوادم في خزائن (Racks) داخل قاعات مبرّدة، وتغذّيها مصادر كهرباء متعددة ومولّدات احتياطية. وتتصل بالإنترنت عبر ألياف متعددة لتفادي الانقطاع."
   },
   "points": [
    {
     "en": "Round-the-clock cooling and backup power",
     "ar": "تبريد وكهرباء احتياطية على مدار الساعة"
    },
    {
     "en": "Multiple copies of data in different centers",
     "ar": "نسخ متعددة من البيانات في مراكز مختلفة"
    },
    {
     "en": "This is where cloud storage and website servers run",
     "ar": "هنا يعمل التخزين السحابي وخوادم المواقع"
    }
   ]
  },
  "landing": {
   "title": {
    "en": "Cable landing station",
    "ar": "محطة إنزال الكابل البحري"
   },
   "idea": {
    "en": "Where the cable comes out of the sea and connects to the land network.",
    "ar": "حيث يخرج الكابل من البحر ويتصل بشبكة اليابسة."
   },
   "text": {
    "en": "The station is built near the shore, the undersea cable reaches it, and then it connects to land cables toward data centers. It holds equipment that powers the optical amplifiers along the cable's path.",
    "ar": "تُقام المحطة قرب الشاطئ، ويصل إليها الكابل البحري ثم تتصل بكابلات أرضية نحو مراكز البيانات. وتحوي معدات تغذّي الكابل بالطاقة اللازمة للمكبّرات الضوئية على مساره."
   },
   "points": [
    {
     "en": "The connection point between sea and land",
     "ar": "نقطة الوصل بين البحر واليابسة"
    },
    {
     "en": "Powers and monitors the cable's amplifiers",
     "ar": "تغذّي مكبّرات الكابل وتراقبه"
    },
    {
     "en": "Surrounded by security protection because it is sensitive",
     "ar": "تُحاط بحماية أمنية لأنها حساسة"
    }
   ]
  },
  "cable": {
   "title": {
    "en": "Submarine communications cable",
    "ar": "الكابل البحري"
   },
   "idea": {
    "en": "Optical fibers under the sea carry most of the internet between continents.",
    "ar": "ألياف ضوئية تحت البحر تنقل معظم الإنترنت بين القارات."
   },
   "text": {
    "en": "The cable contains pairs of optical fibers with layers of protection, stretches thousands of kilometers across the ocean floor, and has optical amplifiers fitted at regular intervals to strengthen the signal. These cables carry the vast majority of international data traffic.",
    "ar": "يحوي الكابل أزواجاً من الألياف الضوئية بطبقات حماية، ويمتد آلاف الكيلومترات على قاع المحيط، وتُركَّب عليه مكبّرات ضوئية على مسافات منتظمة لتقوية الإشارة. تنقل هذه الكوابل الغالبية العظمى من حركة البيانات الدولية."
   },
   "points": [
    {
     "en": "Light carries data through the fibers at tremendous speed",
     "ar": "الضوء ينقل البيانات عبر الألياف بسرعة هائلة"
    },
    {
     "en": "Optical amplifiers at regular intervals",
     "ar": "مكبّرات ضوئية على مسافات منتظمة"
    },
    {
     "en": "It may be damaged by anchors or earthquakes, so alternative routes exist",
     "ar": "قد يتضرر بالمراسي أو الزلازل، فتوجد مسارات بديلة"
    }
   ]
  },
  "eastdc": {
   "title": {
    "en": "Remote data center",
    "ar": "مركز بيانات في قارة أخرى"
   },
   "idea": {
    "en": "This is where the server hosting the site or application you requested is located.",
    "ar": "هنا يوجد الخادم الذي يستضيف الموقع أو التطبيق الذي تطلبه."
   },
   "text": {
    "en": "Your request reaches a server in a distant data center, which prepares the response and returns it by the same path. Large services place copies of their content in several centers (CDN) to bring it closer to users.",
    "ar": "يصل طلبك إلى خادم في مركز بيانات بعيد، فيجهّز الاستجابة ويعيدها بالمسار نفسه. وتضع الخدمات الكبيرة نسخاً من محتواها في مراكز عدة (CDN) لتقريبه من المستخدمين."
   },
   "points": [
    {
     "en": "The reply returns as packets that are reassembled on your device",
     "ar": "الرد يعود بحزم تُجمَّع على جهازك"
    },
    {
     "en": "CDNs bring content closer to you",
     "ar": "شبكات CDN تقرّب المحتوى منك"
    },
    {
     "en": "Geographic distance increases latency",
     "ar": "المسافة الجغرافية تزيد زمن الاستجابة"
    }
   ]
  },
  "satellite": {
   "title": {
    "en": "Communications satellite",
    "ar": "القمر الصناعي"
   },
   "idea": {
    "en": "Complements the network in areas where cables are hard to lay.",
    "ar": "يكمّل الشبكة في المناطق التي يصعب مدّ الكبلات إليها."
   },
   "text": {
    "en": "The satellite receives the signal from a ground station and rebroadcasts it to another. Satellites in high orbit (GEO) cover wide areas with high latency, while low orbit (LEO) reduces the delay.",
    "ar": "يستقبل القمر الإشارة من محطة أرضية ويعيد بثها إلى أخرى. الأقمار في المدار العالي (GEO) تغطي مساحات واسعة بزمن استجابة كبير، أما المدار المنخفض (LEO) فيقلّل التأخير."
   },
   "points": [
    {
     "en": "Useful for remote areas, ships and aircraft",
     "ar": "مفيد للمناطق النائية والسفن والطائرات"
    },
    {
     "en": "GEO: wide coverage and greater delay",
     "ar": "GEO: تغطية واسعة وتأخير أكبر"
    },
    {
     "en": "LEO: less delay and more satellites needed",
     "ar": "LEO: تأخير أقل وحاجة لأقمار أكثر"
    }
   ]
  }
 },
 "simJourney": [
  {
   "id": "home",
   "at": 0,
   "text": {
    "en": "You press \"Send\" in the chat app: your device turns the message into packets and sends them to the router.",
    "ar": "تضغط «إرسال» في تطبيق الدردشة: يحوّل جهازك الرسالة إلى حزم ويرسلها إلى الراوتر."
   }
  },
  {
   "id": "cabinet",
   "at": 0.1,
   "text": {
    "en": "The router sends them through the modem to the street cabinet where the neighbors' lines gather.",
    "ar": "الراوتر يرسلها عبر المودم إلى خزانة الحي حيث تتجمع خطوط الجيران."
   }
  },
  {
   "id": "isp",
   "at": 0.22,
   "text": {
    "en": "They reach the provider's building, which checks your subscription and decides the next route.",
    "ar": "تصل إلى مبنى المزوّد، فيتحقق من اشتراكك ويقرر الطريق التالي."
   }
  },
  {
   "id": "ixp",
   "at": 0.34,
   "text": {
    "en": "They cross the exchange point to move to another network directly and quickly.",
    "ar": "تعبر نقطة التبادل لتنتقل إلى شبكة أخرى مباشرة وبسرعة."
   }
  },
  {
   "id": "landing",
   "at": 0.46,
   "text": {
    "en": "They reach the landing station on the shore, where the undersea cable begins.",
    "ar": "تصل محطة الإنزال على الشاطئ، حيث يبدأ الكابل البحري."
   }
  },
  {
   "id": "cable",
   "at": 0.68,
   "text": {
    "en": "They cross the ocean as pulses of light inside the undersea fibers.",
    "ar": "تعبر المحيط كنبضات ضوئية داخل الألياف تحت البحر."
   }
  },
  {
   "id": "eastdc",
   "at": 1,
   "text": {
    "en": "They reach the remote data center, where the server receives them and sends back an acknowledgment.",
    "ar": "تصل إلى مركز البيانات البعيد، فيستلمها الخادم ويعيد تأكيد الاستلام."
   }
  }
 ],
 "journey": [
  {
   "id": "keyboard",
   "text": {
    "en": "You press the \"Send\" button: the keyboard (an input device) turns the press into an electrical signal.",
    "ar": "تضغط زر «إرسال»: لوحة المفاتيح (جهاز إدخال) تحوّل الضغطة إلى إشارة كهربائية."
   }
  },
  {
   "id": "apps",
   "text": {
    "en": "The messaging app prepares your message as data and asks the operating system to send it.",
    "ar": "تطبيق المراسلة يجهّز رسالتك كبيانات ويطلب من نظام التشغيل إرسالها."
   }
  },
  {
   "id": "os",
   "text": {
    "en": "The operating system receives the request, manages memory, and passes it through the network card driver.",
    "ar": "نظام التشغيل يستقبل الطلب، ويدير الذاكرة، ويمرّره عبر برنامج تعريف بطاقة الشبكة."
   }
  },
  {
   "id": "cpu",
   "text": {
    "en": "The processor executes the message-preparation instructions: splitting it into packets and adding sender and receiver addresses.",
    "ar": "المعالج ينفّذ تعليمات تجهيز الرسالة: تقسيمها إلى حزم وإضافة عناوين الإرسال والاستقبال."
   }
  },
  {
   "id": "ram",
   "text": {
    "en": "RAM holds the packets temporarily during processing so the processor reaches them quickly.",
    "ar": "الذاكرة العشوائية تحفظ الحزم مؤقتاً أثناء المعالجة ليصل إليها المعالج بسرعة."
   }
  },
  {
   "id": "nic",
   "text": {
    "en": "The network card converts the packets into signals ready to be sent over the cable.",
    "ar": "بطاقة الشبكة تحوّل الحزم إلى إشارات جاهزة للإرسال عبر الكبل."
   }
  },
  {
   "id": "ethernet",
   "text": {
    "en": "The Ethernet cable carries the signals to the router quickly and steadily.",
    "ar": "كبل الإيثرنت ينقل الإشارات إلى الراوتر بسرعة وثبات."
   }
  },
  {
   "id": "router",
   "text": {
    "en": "The router decides the right destination for the packets and sends them toward the internet.",
    "ar": "الراوتر يقرر الوجهة الصحيحة للحزم ويرسلها نحو الإنترنت."
   }
  },
  {
   "id": "modem",
   "text": {
    "en": "The modem converts the signal into the form that suits the internet provider's line.",
    "ar": "المودم يحوّل الإشارة إلى الشكل الذي يناسب خط مزوّد الإنترنت."
   }
  },
  {
   "id": "internet",
   "text": {
    "en": "The packets cross many networks around the world through cables and satellites until they reach the destination.",
    "ar": "الحزم تعبر شبكات كثيرة حول العالم عبر كوابل وأقمار صناعية حتى تصل للوجهة."
   }
  },
  {
   "id": "server",
   "text": {
    "en": "The server receives the message, stores it and sends it to your friend, and the acknowledgment comes back. Your message arrived ✅",
    "ar": "الخادم يستقبل الرسالة ويخزّنها ويرسلها لصديقك، ويعود تأكيد الاستلام. وصلت رسالتك ✅"
   }
  }
 ],
 "simLesson": "transmission"
};

export const INFRA_OVERVIEW = DATA.overview;
export const INFRA_LAYERS = DATA.layers;
export const INFRA_PARTS = DATA.parts;
export const INFRA_SCENE = DATA.scene;
export const SIM_OVERVIEW = DATA.simOverview;
export const SIM_SPOTS = DATA.spots;
export const SIM_ENTRIES = DATA.simEntries;
export const SIM_JOURNEY = DATA.simJourney;
export const SIM_LESSON = DATA.simLesson;
export const DATA_JOURNEY = DATA.journey;
export const LAYER_BY_ID = Object.fromEntries(DATA.layers.map((l) => [l.id, l]));
export const PART_BY_ID = Object.fromEntries(DATA.parts.map((p) => [p.id, p]));

/** explanation entry for any selectable id (a layer or a part) */
export function infraEntry(id) {
  if (LAYER_BY_ID[id]) return { kind: 'layer', layer: LAYER_BY_ID[id], ...LAYER_BY_ID[id] };
  const p = PART_BY_ID[id];
  return p ? { kind: 'part', ...p, layer: LAYER_BY_ID[p.layer] } : null;
}
