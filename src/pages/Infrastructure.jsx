import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import { useI18n } from '../i18n/index.jsx';
import { actions } from '../store/progress.js';
import { Chip, Icon, PageHead, toast } from '../components/ui.jsx';
import { disposeTree } from '../three/engine.js';

const O = (en, ar) => ({ en, ar });

const OVERVIEW = {
  id: 'overview',
  ar: 'البنية التحتية للحاسوب',
  en: 'Computer Infrastructure',
  layerName: O('Overview', 'نظرة عامة'),
  rgb: '34,211,238',
  idea: O(
    'A computer system is an integrated architecture of four layers working together.',
    'الحاسوب نظام متكامل من أربع طبقات تعمل معاً.'
  ),
  text: O(
    'Peripherals connect to hardware, hardware executes software instructions, and networks/the Internet link the system to the outside world. Drag the 3D scene to rotate, scroll to zoom, and click any layer or component to inspect its role.',
    'تتصل الأجهزة الطرفية بالعتاد، ويشغّل العتاد البرمجيات، وتربط الشبكة والإنترنت النظام بالعالم الخارجي. اسحب المجسم لتدويره، واضغط على أي طبقة أو قطعة لتعرف فكرتها ووظيفتها.'
  ),
  points: [
    O('Peripherals: Inputting data and outputting results', 'الطرفيات: إدخال البيانات وإخراجها'),
    O('Hardware: Processing instructions and storing data', 'العتاد: المعالجة والتخزين'),
    O('Software: System control, maintenance, and user applications', 'السوفتوير: التحكم والتطبيقات'),
    O('Network & Internet: Connecting devices to cloud and global services', 'الشبكة: الاتصال بالإنترنت والخدمات'),
  ],
  lesson: 'purpose',
};

const LAYERS = [
  {
    id: 'net',
    i: 0,
    rgb: '34,211,238',
    ar: 'الإنترنت والشبكة',
    en: 'Network & Internet',
    idea: O('Links the computer system to the outside world.', 'تربط الحاسوب بالعالم الخارجي.'),
    text: O(
      'Networks move data between devices over cables or wireless links. The modem and router connect the local network to the ISP so users can reach websites, cloud servers, and remote storage.',
      'تنقل الشبكات البيانات بين الأجهزة عبر الأسلاك أو لاسلكياً، ويربطها المودم والراوتر بمزوّد الإنترنت فتصل إلى المواقع والخوادم والتخزين السحابي.'
    ),
    points: [
      O('Wired: Ethernet copper and fibre-optic cables', 'سلكي: إيثرنت وألياف ضوئية'),
      O('Wireless: Wi-Fi, Bluetooth, and cellular networks (4G/5G)', 'لاسلكي: Wi-Fi وبلوتوث وشبكات خلوية'),
      O('Performance is governed by bandwidth and latency', 'السرعة تتحدد بالنطاق الترددي وزمن الاستجابة'),
    ],
    lesson: 'networks',
  },
  {
    id: 'sw',
    i: 1,
    rgb: '139,92,246',
    ar: 'السوفتوير',
    en: 'Software',
    idea: O('The intelligence that directs the physical hardware.', 'العقل الذي يوجّه العتاد.'),
    text: O(
      'Software starts with the Operating System (OS) that manages hardware resources, alongside Utility Software for maintenance, Application Software for user tasks, and Device Drivers that link peripherals to the OS.',
      'مجموعة برامج تبدأ بنظام التشغيل الذي يدير الجهاز، وتضم البرامج المساعدة للصيانة، وبرامج التطبيقات التي ننجز بها أعمالنا، وبرامج التعريف التي تربط العتاد بالنظام.'
    ),
    points: [
      O('Operating System: The core platform every program runs on', 'نظام التشغيل أساس كل البرامج'),
      O('Applications: Direct productivity and business tools for users', 'التطبيقات للمستخدم المباشر'),
      O('Utilities & Drivers: System maintenance and hardware translation', 'المساعدة والتعريفات للصيانة والربط'),
    ],
    lesson: 'software',
  },
  {
    id: 'hw',
    i: 2,
    rgb: '244,63,142',
    ar: 'العتاد (الهاردوير)',
    en: 'Hardware',
    idea: O('The physical components that execute instructions and store data.', 'الأجزاء المادية التي تنفّذ التعليمات.'),
    text: O(
      'Internal components mount on the motherboard: the CPU executes instructions, RAM holds active programs temporarily, SSD/HDD drives store files permanently, and the NIC connects to the network.',
      'تُثبَّت المكوّنات على اللوحة الأم: المعالج ينفّذ الأوامر، والذاكرة تحفظ ما يعمل حالياً، والتخزين يحفظ الملفات، وبطاقة الشبكة تصل الجهاز بالاتصال.'
    ),
    points: [
      O('CPU: The processor brain executing instructions', 'المعالج: العقل المنفّذ'),
      O('RAM: Fast volatile workspace for running tasks', 'الذاكرة: عمل مؤقت سريع'),
      O('Storage (SSD/HDD): Permanent retention of OS and files', 'التخزين: حفظ دائم'),
    ],
    lesson: 'devices',
  },
  {
    id: 'io',
    i: 3,
    rgb: '251,191,36',
    ar: 'الأجهزة الطرفية',
    en: 'Peripherals',
    idea: O('The interaction bridge between the human user and the computer.', 'وسائل التفاعل بين المستخدم والحاسوب.'),
    text: O(
      'Input devices feed data into the computer, while output devices present processed results. They connect via ports such as USB/HDMI or wirelessly, and are operated by the OS using device drivers.',
      'أجهزة إدخال تعطي الحاسوب بيانات، وأجهزة إخراج تعرض النتائج. تتصل بالعتاد عبر منافذ مثل USB أو لاسلكياً، ويديرها نظام التشغيل بواسطة برامج التعريف.'
    ),
    points: [
      O('Input: Keyboard, mouse, and barcode scanner', 'إدخال: لوحة مفاتيح وماوس وماسح باركود'),
      O('Output: Monitor display and printer', 'إخراج: شاشة وطابعة'),
      O('Require Device Drivers to communicate with the OS', 'تحتاج Drivers لتعمل'),
    ],
    lesson: 'peripherals',
  },
];

const PARTS = [
  {
    id: 'modem', layer: 'net', ar: 'المودم', en: 'Modem', x: -120, z: 55,
    boxes: [[0, 0, 62, 22, 46, 0]],
    idea: O('Converts signals between the ISP line and digital computer data.', 'يحوّل الإشارة بين خط الإنترنت والحاسوب.'),
    text: O(
      'The modem receives signals from the Internet Service Provider (fibre, cable, or telephone line) and converts them into digital packets for the router/PC, and vice versa when transmitting.',
      'يستقبل المودم الإشارة القادمة من مزوّد الخدمة (خط هاتف أو ألياف أو كبل) ويحوّلها إلى بيانات رقمية يفهمها الجهاز، ويفعل العكس عند الإرسال.'
    ),
    points: [
      O('Links the home/office premises to the ISP', 'يربط المنزل بمزوّد الإنترنت'),
      O('Name comes from Modulator-Demodulator', 'اسمه من Modulator-Demodulator'),
      O('Often integrated inside modern home router gateways', 'يأتي اليوم غالباً مدمجاً مع الراوتر'),
    ],
    lesson: 'networks',
  },
  {
    id: 'router', layer: 'net', ar: 'الراوتر', en: 'Router', x: -25, z: 55,
    boxes: [[0, 0, 76, 16, 52, 0], [-30, -18, 5, 46, 5, 16], [30, -18, 5, 46, 5, 16]],
    idea: O('Routes data packets between the local network and the Internet.', 'يوزّع الإنترنت على أجهزة الشبكة.'),
    text: O(
      'The router directs data packets between local devices and the Internet, broadcasts Wi-Fi, provides Ethernet LAN ports, assigns local IP addresses (DHCP), and includes a built-in firewall.',
      'يوجّه الراوتر حزم البيانات بين الأجهزة وبين الإنترنت، وغالباً يبث Wi-Fi ويحتوي منافذ إيثرنت، ويضيف طبقة حماية بسيطة للشبكة.'
    ),
    points: [
      O('Assigns local IP addresses to devices via DHCP', 'يعطي كل جهاز عنواناً داخل الشبكة'),
      O('Supports both wireless Wi-Fi and wired Ethernet', 'يبث Wi-Fi ويدعم الكبل'),
      O('Provides NAT translation and firewall protection', 'يمكن ضبط كلمة سر وجدار ناري'),
    ],
    lesson: 'networks',
  },
  {
    id: 'server', layer: 'net', ar: 'الخادم السحابي', en: 'Cloud Server', x: 125, z: -40,
    boxes: [[0, 0, 48, 84, 48, 0]],
    idea: O('A high-powered computer that delivers shared services over a network.', 'حاسوب قوي يقدّم خدمات عبر الشبكة.'),
    text: O(
      'Stores shared files, hosts web applications, and processes requests for remote users. It underpins cloud storage, SaaS/IaaS/PaaS cloud computing, and client-server networks.',
      'يخزّن الملفات ويشغّل التطبيقات للمستخدمين عن بُعد. عليه يقوم التخزين السحابي والحوسبة السحابية ونموذج العميل والخادم.'
    ),
    points: [
      O('Serves many concurrent users simultaneously', 'يخدم عدة مستخدمين معاً'),
      O('Provides centralised storage and automated backups', 'يوفر نسخاً احتياطية وتخزيناً'),
      O('Managed by a Network Operating System (NOS)', 'يُدار عادة بنظام تشغيل شبكات NOS'),
    ],
    lesson: 'online',
  },
  {
    id: 'internet', layer: 'net', ar: 'الإنترنت', en: 'Internet WAN', x: -10, z: -75, globe: true,
    boxes: [],
    idea: O('A global Wide Area Network (WAN) of interconnected networks.', 'شبكة عالمية من الشبكات المترابطة.'),
    text: O(
      'The Internet links millions of private, public, academic, and business networks worldwide via submarine fibre cables, terrestrial links, and satellites.',
      'يربط الإنترنت ملايين الشبكات حول العالم عبر كوابل بحرية وأقمار صناعية وأبراج، وتصل إليه من خلال مزوّد الخدمة.'
    ),
    points: [
      O('Largest global Wide Area Network (WAN)', 'شبكة واسعة WAN'),
      O('Relies on standard protocols like TCP/IP, HTTPS, and DNS', 'تعتمد على بروتوكولات مثل HTTP وTCP/IP'),
      O('Submarine fibre-optic cables carry most intercontinental traffic', 'الألياف الضوئية تنقل أغلب البيانات'),
    ],
    lesson: 'transmission',
  },
  {
    id: 'os', layer: 'sw', ar: 'نظام التشغيل', en: 'Operating System', x: 0, z: 45,
    boxes: [[0, 0, 240, 14, 150, 0]],
    idea: O('The core manager that organises hardware resources and runs software.', 'المدير الذي ينظّم موارد الجهاز.'),
    text: O(
      'Manages the CPU, RAM, storage, and security, provides a user interface (GUI/CLI), and serves as the platform for applications. Examples include Windows, macOS, Linux, Android, and iOS.',
      'يدير المعالج والذاكرة والتخزين، ويوفر واجهة للمستخدم، ويشغّل التطبيقات. أمثلته Windows وAndroid وiOS وLinux.'
    ),
    points: [
      O('Provides Graphical (GUI/WIMP) or Command-Line (CLI) interfaces', 'واجهة رسومية GUI أو سطر أوامر'),
      O('Handles memory management and CPU time-sliced multitasking', 'إدارة الذاكرة وتعدد المهام'),
      O('Enforces security, user accounts, and access permissions', 'الأمان والتحكم بالصلاحيات'),
    ],
    lesson: 'software',
  },
  {
    id: 'apps', layer: 'sw', ar: 'برامج التطبيقات', en: 'Application Software', x: -100, z: -70,
    boxes: [[0, 0, 50, 20, 50, 0], [58, 0, 50, 20, 50, 0], [116, 0, 50, 20, 50, 0]],
    idea: O('Programs that users run directly to accomplish everyday and business tasks.', 'برامج ننجز بها أعمالنا.'),
    text: O(
      'Includes Word, Excel, web browsers, CAD, DBMS, and ERP suites. They run on top of the OS to help organisations lower costs, increase output, and maintain quality.',
      'مثل Word وExcel والمتصفحات وبرامج التصميم والبرمجة وقواعد البيانات؛ تعمل فوق نظام التشغيل وتستخدم موارده.'
    ),
    points: [
      O('Examples: Microsoft Office, CAD, DBMS, ERP, communication apps', 'Office وCAD وERP'),
      O('Reduces business overheads and boosts productivity', 'تخفّض التكاليف وترفع الإنتاج'),
      O('Must be compatible with the underlying OS platform', 'لا تعمل بالضرورة على كل الأنظمة'),
    ],
    lesson: 'software',
  },
  {
    id: 'utility', layer: 'sw', ar: 'البرامج المساعدة', en: 'Utility Software', x: 95, z: -70,
    boxes: [[0, 0, 60, 16, 60, 0]],
    idea: O('The system maintenance and protection crew.', 'فريق الصيانة والحماية.'),
    text: O(
      'System software that runs alongside the OS to perform routine housekeeping: antivirus scanning, automated backups, disk cleanup, defragmentation, compression, and encryption.',
      'برامج نظام تنفّذ مهاماً روتينية: مكافحة الفيروسات، النسخ الاحتياطي، تنظيف الأقراص، الضغط والتشفير.'
    ),
    points: [
      O('Antivirus and anti-malware scanning', 'مكافحة الفيروسات'),
      O('Scheduled data backups and disk defragmentation', 'نسخ احتياطي وتجزئة الأقراص'),
      O('File compression (ZIP) and encryption tools', 'ضغط وتشفير الملفات'),
    ],
    lesson: 'software',
  },
  {
    id: 'drivers', layer: 'sw', ar: 'برامج التعريف', en: 'Device Drivers', x: 150, z: 60,
    boxes: [[0, 0, 44, 12, 70, 0]],
    idea: O('A software translator between the OS and a hardware device.', 'مترجم بين نظام التشغيل وقطعة العتاد.'),
    text: O(
      'A small routine program that tells the operating system how to communicate with and control a specific peripheral or component such as a printer, monitor, or NIC.',
      'برنامج صغير يخبر نظام التشغيل كيف يتعامل مع جهاز طرفي مثل الطابعة أو لوحة المفاتيح أو بطاقة الشبكة.'
    ),
    points: [
      O('Each hardware model requires a matching driver', 'لكل جهاز تعريفه الخاص'),
      O('Driver updates improve stability, speed, and compatibility', 'تحديثها يحسّن الأداء والتوافق'),
      O('Without a driver, a connected peripheral cannot function properly', 'غيابها يعني أن الجهاز قد لا يعمل'),
    ],
    lesson: 'software',
  },
  {
    id: 'cpu', layer: 'hw', ar: 'المعالج', en: 'CPU', x: 0, z: 0,
    boxes: [[0, 0, 64, 18, 64, 0]],
    idea: O('The brain of the computer that executes program instructions.', 'عقل الحاسوب.'),
    text: O(
      'Carries out arithmetic, logic, and control instructions. The OS allocates slices of CPU time across running tasks to achieve smooth multitasking.',
      'ينفّذ تعليمات البرامج ويجري العمليات الحسابية، ويوزّع نظام التشغيل وقته بين المهام لتحقيق تعدد المهام.'
    ),
    points: [
      O('Measured by clock speed (GHz) and core count', 'يُقاس بالسرعة وعدد الأنوية'),
      O('Heavy concurrent workloads increase CPU utilisation', 'كلما زاد الحمل بطؤ الجهاز'),
      O('Reads instructions and data directly from fast RAM', 'يتصل مباشرة بالذاكرة'),
    ],
    lesson: 'devices',
  },
  {
    id: 'ram', layer: 'hw', ar: 'الذاكرة العشوائية', en: 'RAM', x: -125, z: -30,
    boxes: [[0, 0, 12, 36, 88, 0], [18, 0, 12, 36, 88, 0]],
    idea: O('Fast temporary workspace for the OS and active applications.', 'مساحة العمل السريعة المؤقتة.'),
    text: O(
      'Holds currently running programs and open data so the CPU can access them with minimal delay. Because RAM is volatile, its contents clear when power is turned off.',
      'تحتفظ بالبرامج والبيانات العاملة حالياً ليصل إليها المعالج بسرعة، وتفرغ عند إطفاء الجهاز.'
    ),
    points: [
      O('Much faster than permanent SSD/HDD storage', 'أسرع من التخزين'),
      O('Volatile: loses data when power is lost', 'تفرغ عند إيقاف التشغيل'),
      O('More RAM allows smoother multitasking with large datasets', 'زيادتها تحسّن تعدد المهام'),
    ],
    lesson: 'peripherals',
  },
  {
    id: 'storage', layer: 'hw', ar: 'التخزين', en: 'SSD / HDD', x: 110, z: 70,
    boxes: [[0, 0, 100, 14, 64, 0]],
    idea: O('Non-volatile permanent storage for the OS, applications, and user files.', 'الحفظ الدائم للملفات والنظام.'),
    text: O(
      'Solid-State Drives (SSD) have no moving parts, making them fast and shock-resistant. Magnetic Hard Disk Drives (HDD) offer high capacity at lower cost per GB but are slower and more fragile.',
      'قرص الحالة الصلبة SSD سريع ومقاوم للصدمات، والقرص المغناطيسي HDD أرخص وأكبر سعة لكنه أبطأ وأكثر حساسية.'
    ),
    points: [
      O('SSD: Fast, silent, durable, higher cost per GB', 'SSD: سرعة وتكلفة أعلى'),
      O('HDD: High capacity, lower cost, moving magnetic platters', 'HDD: سعة كبيرة وسعر أقل'),
      O('Enterprise servers use RAID arrays for redundancy', 'RAID لحماية البيانات في الخوادم'),
    ],
    lesson: 'peripherals',
  },
  {
    id: 'nic', layer: 'hw', ar: 'بطاقة الشبكة', en: 'Network Card (NIC)', x: -110, z: 85,
    boxes: [[0, 0, 56, 10, 36, 0]],
    idea: O('The hardware interface that connects a computer to a network.', 'بوابة الجهاز إلى الشبكة.'),
    text: O(
      'Converts internal computer data into electrical, optical, or radio signals for transmission over Ethernet or Wi-Fi. Every NIC has a unique hardware MAC address.',
      'تحوّل بيانات الجهاز إلى إشارات تُرسل عبر الكبل أو لاسلكياً، ولكل بطاقة عنوان فريد يسمى MAC.'
    ),
    points: [
      O('Supports wired RJ45 Ethernet or wireless Wi-Fi', 'سلكية (إيثرنت) أو Wi-Fi'),
      O('Links the workstation to the switch or router', 'تتصل بالراوتر'),
      O('Requires a network device driver managed by the OS', 'تحتاج Driver لتعمل'),
    ],
    lesson: 'networks',
  },
  {
    id: 'monitor', layer: 'io', ar: 'الشاشة', en: 'Computer Monitor', x: 0, z: -80,
    boxes: [[0, 0, 130, 76, 8, 30], [0, 0, 18, 30, 18, 0], [0, 0, 60, 4, 36, 0]],
    idea: O('Primary visual output device displaying the UI and results.', 'تعرض ما يفعله الحاسوب.'),
    text: O(
      'An output peripheral that renders graphical interfaces, documents, and media visually. Connects via HDMI or DisplayPort.',
      'جهاز إخراج مرئي يُظهر النتائج والواجهات الرسومية، وتتنوع الشاشات بالحجم والدقة.'
    ),
    points: [
      O('Visual output peripheral', 'جهاز إخراج'),
      O('Connects via HDMI, DisplayPort, or USB-C', 'يتصل عبر HDMI أو DVI'),
      O('Driven by the integrated or discrete GPU', 'جودة الرسوم تعتمد على بطاقة الرسوم'),
    ],
    lesson: 'peripherals',
  },
  {
    id: 'keyboard', layer: 'io', ar: 'لوحة المفاتيح', en: 'Computer Keyboard', x: 0, z: 60,
    boxes: [[0, 0, 150, 8, 48, 0]],
    idea: O('Primary input device for typing text, numbers, and commands.', 'أداة إدخال النصوص والأوامر.'),
    text: O(
      'Converts physical keystrokes into digital character codes understood by the OS. Connects via wired USB or wireless Bluetooth.',
      'تحوّل ضغطات الأزرار إلى بيانات يفهمها الحاسوب، وتتصل عبر USB أو بلوتوث.'
    ),
    points: [
      O('Text and command input peripheral', 'جهاز إدخال'),
      O('Wired USB or wireless Bluetooth connectivity', 'سلكية أو لاسلكية'),
      O('Essential for Command-Line Interfaces (CLI)', 'أساس واجهة سطر الأوامر'),
    ],
    lesson: 'peripherals',
  },
  {
    id: 'mouse', layer: 'io', ar: 'الماوس', en: 'Computer Mouse', x: 115, z: 70,
    boxes: [[0, 0, 24, 10, 36, 0]],
    idea: O('Pointing input device used to navigate graphical interfaces.', 'جهاز تأشير يحدّد على الشاشة.'),
    text: O(
      'Moves the on-screen pointer to select windows, icons, and menus—forming the P (Pointer) in WIMP graphical computing.',
      'يحرك المؤشر ويختار العناصر في الواجهة الرسومية GUI، وهو أشهر أجهزة التأشير.'
    ),
    points: [
      O('Pointing and selection input device', 'جهاز تأشير'),
      O('Core element of WIMP graphical interfaces', 'أساس حوسبة WIMP'),
      O('Alternatives include touchpads, touchscreens, and trackballs', 'بدائله لوحة اللمس والشاشة اللمسية'),
    ],
    lesson: 'peripherals',
  },
  {
    id: 'printer', layer: 'io', ar: 'الطابعة', en: 'Printer', x: -140, z: -30,
    boxes: [[0, 0, 96, 38, 76, 0]],
    idea: O('Output peripheral that produces physical hard copies of digital files.', 'تحوّل المستند الرقمي إلى ورق.'),
    text: O(
      'Prints documents and images onto paper. In organisations, Multifunction Devices (MFDs) combine printing, scanning, and copying and are shared across the LAN via the NOS.',
      'جهاز إخراج يطبع النصوص والصور، ويحتاج Driver، ويمكن مشاركته عبر الشبكة بإدارة نظام التشغيل.'
    ),
    points: [
      O('Hard-copy output device (often an MFD in offices)', 'جهاز إخراج'),
      O('Shared across office networks to reduce hardware costs', 'تُشارك عبر الشبكة'),
      O('Managed via OS print queues and device drivers', 'تُدار بطابور طباعة'),
    ],
    lesson: 'peripherals',
  },
  {
    id: 'scanner', layer: 'io', ar: 'ماسح الباركود', en: 'Barcode Scanner', x: 150, z: -45,
    boxes: [[0, 0, 28, 34, 28, 0]],
    idea: O('Fast automated input device for retail, warehousing, and logistics.', 'إدخال سريع للبيانات في المتاجر.'),
    text: O(
      'Reads optical barcodes so product IDs enter the database instantaneously without manual typing errors, supporting EPOS, stock control, and supply chains.',
      'يقرأ الرمز الشريطي فتدخل بيانات المنتج للنظام فوراً، ويُستخدم في الدفع والمخازن والبريد السريع.'
    ),
    points: [
      O('Automated data capture input peripheral', 'جهاز إدخال'),
      O('Speeds up checkout and real-time stock control', 'يسرّع المحاسبة والمخزون'),
      O('Integrates directly with ERP and inventory databases', 'يرتبط بأنظمة ERP وSCM'),
    ],
    lesson: 'peripherals',
  },
];

const EXTRA_PARTS = [
  {
    id: 'case', layer: 'hw', ar: 'صندوق الحاسوب', en: 'Computer Case',
    idea: O('The protective enclosure housing the internal PC components.', 'الهيكل الذي يحتضن مكوّنات الحاسوب.'),
    text: O(
      'Protects internal components (motherboard, CPU, RAM, storage, PSU) from dust and impact while directing cooling airflow and providing front/rear ports.',
      'يحمي المكوّنات الداخلية (اللوحة الأم، المعالج، الذاكرة، التخزين) من الغبار والصدمات، ويوفر التهوية ومنافذ التوصيل.'
    ),
    points: [
      O('Houses motherboard, CPU, RAM, and storage drives', 'يضم اللوحة الأم والمعالج والذاكرة'),
      O('Channels cooling airflow across heatsinks', 'يوفر تبريداً وتهوية'),
      O('Provides USB, audio, Ethernet, and display port access', 'فيه منافذ USB وإيثرنت وشاشة'),
    ],
    lesson: 'devices',
  },
  {
    id: 'ethernet', layer: 'net', ar: 'كبل إيثرنت', en: 'Ethernet Cable',
    idea: O('Wired network patch cable providing fast, stable LAN connectivity.', 'سلك يصل الحاسوب بالشبكة بسرعة وثبات.'),
    text: O(
      'Carries data frames between the PC’s NIC and the router/switch using RJ45 connectors. Wired Ethernet is generally faster, lower-latency, and more secure than Wi-Fi.',
      'ينقل البيانات بين بطاقة الشبكة في الحاسوب والراوتر عبر موصل RJ-45، وهو في أغلب الحالات أسرع وأكثر استقراراً من Wi-Fi.'
    ),
    points: [
      O('Reliable, low-interference wired connection', 'اتصال سلكي موثوق'),
      O('Links the computer NIC to the wall outlet, switch, or router', 'يصل بطاقة الشبكة بالراوتر'),
      O('Uses twisted-pair copper standards such as Cat5e and Cat6', 'تُستخدم أنواع مثل Cat5e وCat6'),
    ],
    lesson: 'connectivity',
  },
];

const SCENE_ITEMS = [
  { id: 'case', group: 'hw', x: -170, z: -40, boxes: [[0, 0, 70, 150, 140, 0]] },
  { id: 'cpu', group: 'hw', x: -170, z: -40, mini: true, boxes: [[0, -30, 30, 8, 30, 100]] },
  { id: 'ram', group: 'hw', x: -170, z: -40, mini: true, boxes: [[-18, 25, 10, 38, 70, 60], [-4, 25, 10, 38, 70, 60]] },
  { id: 'storage', group: 'hw', x: -170, z: -40, mini: true, boxes: [[0, 25, 50, 12, 60, 20]] },
  { id: 'nic', group: 'hw', x: -170, z: -40, mini: true, boxes: [[18, -45, 26, 6, 20, 130]] },
  { id: 'monitor', group: 'io', x: 60, z: -70, boxes: [[0, 0, 150, 90, 8, 38], [0, 0, 20, 38, 20, 0], [0, 0, 70, 4, 40, 0]] },
  { id: 'os', group: 'sw', x: 60, z: -70, boxes: [[0, 0, 140, 5, 95, 175]] },
  { id: 'apps', group: 'sw', x: 60, z: -70, boxes: [[-44, 0, 38, 5, 60, 205], [0, 0, 38, 5, 60, 205], [44, 0, 38, 5, 60, 205]] },
  { id: 'utility', group: 'sw', x: 60, z: -70, boxes: [[0, 0, 120, 5, 80, 235]] },
  { id: 'drivers', group: 'sw', x: 60, z: -70, boxes: [[0, 0, 100, 5, 70, 265]] },
  { id: 'keyboard', group: 'io', x: 60, z: 55, boxes: [[0, 0, 150, 8, 48, 0]] },
  { id: 'mouse', group: 'io', x: 175, z: 62, boxes: [[0, 0, 24, 10, 36, 0]] },
  { id: 'printer', group: 'io', x: 225, z: -60, boxes: [[0, 0, 96, 38, 76, 0]] },
  { id: 'scanner', group: 'io', x: 232, z: 50, boxes: [[0, 0, 28, 34, 28, 0]] },
  { id: 'router', group: 'net', x: -60, z: 60, boxes: [[0, 0, 76, 16, 52, 0], [-30, -18, 5, 46, 5, 16], [30, -18, 5, 46, 5, 16]] },
  { id: 'modem', group: 'net', x: -60, z: 130, boxes: [[0, 0, 62, 22, 46, 0]] },
  { id: 'ethernet', group: 'net', x: -124, z: 60, boxes: [[-26, -10, 6, 4, 30, 0], [0, 0, 52, 4, 6, 0], [64, 35, 6, 4, 46, 0]] },
  { id: 'internet', group: 'net', x: 40, z: 150, globe: true, boxes: [] },
  { id: 'server', group: 'net', x: 150, z: 140, boxes: [[0, 0, 48, 84, 48, 0]] },
];

const JOURNEY_STEPS = [
  ['keyboard', O('You press "Send": the keyboard (input device) converts the keystroke into an electrical signal.', 'تضغط زر «إرسال»: لوحة المفاتيح (جهاز إدخال) تحوّل الضغطة إلى إشارة كهربائية.')],
  ['apps', O('The messaging application prepares your message as digital data and asks the OS to send it.', 'تطبيق المراسلة يجهّز رسالتك كبيانات ويطلب من نظام التشغيل إرسالها.')],
  ['os', O('The Operating System receives the request, manages memory, and passes it to the NIC device driver.', 'نظام التشغيل يستقبل الطلب، ويدير الذاكرة، ويمرّره عبر برنامج تعريف بطاقة الشبكة.')],
  ['cpu', O('The CPU executes the packet-framing instructions and attaches source and destination addresses.', 'المعالج ينفّذ تعليمات تجهيز الرسالة: تقسيمها إلى حزم وإضافة عناوين الإرسال والاستقبال.')],
  ['ram', O('RAM buffers the packets temporarily during processing for rapid CPU access.', 'الذاكرة العشوائية تحفظ الحزم مؤقتاً أثناء المعالجة ليصل إليها المعالج بسرعة.')],
  ['nic', O('The Network Interface Card (NIC) converts packets into physical frames ready for the cable.', 'بطاقة الشبكة تحوّل الحزم إلى إشارات جاهزة للإرسال عبر الكبل.')],
  ['ethernet', O('The Ethernet cable carries the signal reliably to the local router.', 'كبل الإيثرنت ينقل الإشارات إلى الراوتر بسرعة وثبات.')],
  ['router', O('The router inspects the destination IP address and forwards the packets toward the WAN.', 'الراوتر يقرر الوجهة الصحيحة للحزم ويرسلها نحو الإنترنت.')],
  ['modem', O('The modem modulates the digital signal to travel over the ISP fibre/broadband line.', 'المودم يحوّل الإشارة إلى الشكل الذي يناسب خط مزوّد الإنترنت.')],
  ['internet', O('The packets traverse global routers, IXPs, and submarine cables across the Internet.', 'الحزم تعبر شبكات كثيرة حول العالم عبر كوابل وأقمار صناعية حتى تصل للوجهة.')],
  ['server', O('The cloud server receives and stores the message, delivers it to the recipient, and returns an ACK!', 'الخادم يستقبل الرسالة ويخزّنها ويرسلها لصديقك، ويعود تأكيد الاستلام. وصلت رسالتك ✅')],
];

const SIM_OVERVIEW = {
  id: 'sim-overview',
  ar: 'الإنترنت في العالم الحقيقي',
  en: 'Real-World Internet Infrastructure',
  layerName: O('Simulation', 'محاكاة'),
  rgb: '34,211,238',
  idea: O(
    'Behind every web page or message is a physical journey across cables, exchanges, satellites, and data centers.',
    'خلف كل صفحة تفتحها رحلة مادية: كبلات ومباني وأقمار وخوادم.'
  ),
  text: O(
    'This interactive 3D simulation traces how Internet traffic travels from your home router to a data center on another continent. Drag to orbit, scroll to zoom, click any landmark marker to inspect it, or press "Send Message" to follow a live packet tour.',
    'هذه محاكاة مبسّطة لمسار الإنترنت من منزلك حتى مركز بيانات في قارة أخرى. دوّر العالم بالسحب، وكبّر بالعجلة، واضغط على أي أيقونة لتتعرف على الجزء، أو اضغط «أرسل رسالة» لترى رحلة البيانات كاملة.'
  ),
  points: [
    O('Buildings and distances are scaled for educational clarity', 'الأبنية والمسافات مصغّرة ومبسّطة للتوضيح'),
    O('Over 95% of intercontinental Internet traffic travels through submarine fibre cables', 'الإنترنت يعتمد على الكبلات الأرضية والبحرية أكثر مما يتخيل الناس'),
    O('Satellites complement terrestrial networks for remote regions, ships, and aircraft', 'الأقمار الصناعية تكمّل الشبكة ولا تحل محلها في أغلب الحالات'),
  ],
  lesson: 'transmission',
};

const SIM_SPOTS = [
  { id: 'home', icon: '🏠', label: O('Your Home', 'منزلك'), anchor: [-70, 12, 15], target: [-70, 3, 15], cam: [48, 0.55, 1.1] },
  { id: 'cabinet', icon: '🗄️', label: O('Street Cabinet', 'خزانة الحي'), anchor: [-52, 6, 12], target: [-52, 1, 12], cam: [34, 0.5, 1.1] },
  { id: 'tower', icon: '🗼', label: O('Cell Tower', 'برج خلوي'), anchor: [-80, 30, -25], target: [-80, 12, -25], cam: [62, 0.5, 1.15] },
  { id: 'isp', icon: '🏢', label: O('ISP Office', 'مزوّد الخدمة'), anchor: [-30, 14, 12], target: [-30, 4, 12], cam: [52, 0.45, 1.1] },
  { id: 'ixp', icon: '🔀', label: O('Exchange (IXP)', 'نقطة التبادل'), anchor: [0, 13, 0], target: [0, 4, 0], cam: [50, 0.4, 1.1] },
  { id: 'dc', icon: '🏭', label: O('Data Center', 'مركز البيانات'), anchor: [22, 14, -18], target: [22, 4, -18], cam: [62, 0.4, 1.1] },
  { id: 'landing', icon: '⚓', label: O('Landing Station', 'محطة الإنزال'), anchor: [40, 10, 5], target: [40, 2, 5], cam: [48, 0.8, 1.1] },
  { id: 'cable', icon: '🌊', label: O('Submarine Cable', 'الكابل البحري'), anchor: [90, 2, 0], target: [90, -2, 0], cam: [110, 0.3, 1.2] },
  { id: 'eastdc', icon: '🌍', label: O('Other Continent', 'قارة أخرى'), anchor: [190, 15, -10], target: [190, 4, -10], cam: [70, 0.2, 1.1] },
  { id: 'satellite', icon: '🛰️', label: O('Satellite', 'قمر صناعي'), anchor: [100, 58, -10], target: [100, 50, -10], cam: [120, 0.3, 1.2] },
];

const SIM_ENTRIES = {
  home: {
    ar: 'المنزل: بداية الرحلة', en: 'Home Network',
    idea: O('Your device, router, and modem are your gateway to the Internet.', 'جهازك والراوتر والمودم هي بوابتك إلى الإنترنت.'),
    text: O(
      'Your computer or phone connects to the home router via Ethernet or Wi-Fi. The router assigns local IP addresses, while the modem (or fibre ONT) converts signals onto the line running out to the street.',
      'يتصل حاسوبك بالراوتر بكبل إيثرنت أو Wi-Fi، والراوتر يوزّع الاتصال على أجهزة المنزل ويعطي كلاً منها عنواناً داخلياً. أما المودم (أو جهاز الألياف ONT) فيحوّل الإشارة القادمة من الشارع إلى بيانات رقمية.'
    ),
    points: [
      O('Router links the home LAN to the WAN and performs NAT', 'الراوتر يربط شبكة المنزل بالإنترنت ويترجم العناوين (NAT)'),
      O('Modem / ONT terminates the physical ISP line', 'المودم أو ONT يتصل بخط المزوّد'),
      O('Built-in firewall protects internal devices from unsolicited traffic', 'الجدار الناري المدمج يحمي الشبكة المنزلية'),
    ],
    lesson: 'networks',
  },
  cabinet: {
    ar: 'خزانة التوزيع', en: 'Street Cabinet',
    idea: O('Local aggregation point linking neighbourhood homes to the ISP core.', 'نقطة تجميع في الحي تصل المنازل بشبكة المزوّد.'),
    text: O(
      'Lines from dozens of nearby homes converge in a roadside cabinet, where high-capacity fibre-optic trunks carry aggregated traffic toward the ISP central office.',
      'تتجمع خطوط عدة منازل في خزانة صغيرة بالشارع، ومنها يخرج كبل ألياف أو نحاس أكبر نحو مبنى المزوّد. في الألياف إلى المنزل (FTTH) تصل الألياف حتى داخل المنزل.'
    ),
    points: [
      O('Consolidates neighbourhood subscriber lines', 'تجمّع خطوط الحي في نقطة واحدة'),
      O('Supports FTTC (Fibre to the Cabinet) or FTTH (Fibre to the Home)', 'قد تكون ألياف حتى الخزانة (FTTC) أو حتى المنزل (FTTH)'),
      O('Shorter copper runs mean higher bandwidth and lower attenuation', 'كلما قصرت المسافة النحاسية زادت السرعة'),
    ],
    lesson: 'connectivity',
  },
  tower: {
    ar: 'برج الاتصالات الخلوية', en: 'Cellular Base Station (Cell Tower)',
    idea: O('Serves mobile devices via radio waves and connects to the core network via fibre backhaul.', 'يخدم الهواتف في منطقته بموجات راديوية ويتصل بالشبكة بكبل.'),
    text: O(
      'Each cell tower covers a geographic cell using sector antennas. Once your smartphone’s 4G/5G radio signal reaches the tower, it travels over high-speed fibre or microwave backhaul into the ISP network.',
      'كل برج يغطي «خلية» ويبث بهوائيات قطاعية. ما إن يصل اتصال هاتفك إلى البرج حتى ينتقل عبر ألياف أو وصلات ميكروويف إلى شبكة المشغّل ومنها إلى الإنترنت.'
    ),
    points: [
      O('Phones hand over seamlessly between adjacent cell towers', 'الهاتف يتصل بأقوى برج قريب ويتنقل بين الأبراج'),
      O('Tower-to-core link is called Backhaul', 'الاتصال بين البرج وشبكة المشغّل يُسمى Backhaul'),
      O('5G uses denser cells for higher bandwidth and lower latency', '5G تستخدم أبراجاً أكثر كثافة وزمن استجابة أقل'),
    ],
    lesson: 'connectivity',
  },
  isp: {
    ar: 'مزوّد خدمة الإنترنت', en: 'ISP Central Office',
    idea: O('The provider that authenticates your connection and routes your packets onto the Internet.', 'الشركة التي توصلك بالإنترنت وتعطيك عنواناً فيه.'),
    text: O(
      'The ISP central office aggregates subscriber lines, authenticates accounts, assigns public IP addresses, operates DNS resolvers, and forwards traffic to upstream networks and exchange points.',
      'يستقبل المزوّد خطوط المشتركين في مبنى رئيسي، ويصادق على اتصالك ويمنحك عنوان IP، ويشغّل خوادم DNS، ثم يمرّر حركتك إلى شبكات أكبر عبر نقاط التبادل.'
    ),
    points: [
      O('Assigns public IP configuration and routes subscriber traffic', 'يمنحك عنوان IP (غالباً عبر DHCP)'),
      O('Runs DNS servers to translate domain names into IP addresses', 'يشغّل خوادم DNS لترجمة الأسماء'),
      O('Connects to other networks via peering and transit links', 'يعقد اتفاقيات اتصال مع شبكات أخرى'),
    ],
    lesson: 'transmission',
  },
  ixp: {
    ar: 'نقطة تبادل الإنترنت', en: 'Internet Exchange Point (IXP)',
    idea: O('A facility where multiple ISPs and content networks interconnect directly.', 'مكان تلتقي فيه شبكات كثيرة لتتبادل الحركة مباشرة.'),
    text: O(
      'Instead of routing local traffic through distant intermediaries, ISPs and cloud providers connect to high-speed switches inside an IXP to exchange traffic directly (Peering), cutting latency and transit costs.',
      'بدل أن تمر البيانات عبر وسطاء بعيدين، تتصل الشبكات (مزوّدون ومنصات محتوى) بسويتش ضخم داخل المبنى فتتبادل الحركة محلياً، مما يخفض التأخير والتكلفة.'
    ),
    points: [
      O('Direct traffic exchange between networks is called Peering', 'تبادل الحركة يسمى Peering'),
      O('Reduces latency (round-trip delay) and bandwidth costs', 'يقلل زمن الاستجابة ويخفض تكلفة العبور'),
      O('Core backbone junction of regional Internet infrastructure', 'من أهم نقاط ربط الإنترنت جغرافياً'),
    ],
    lesson: 'networks',
  },
  dc: {
    ar: 'مركز البيانات', en: 'Data Center',
    idea: O('A secure facility housing thousands of servers for cloud storage, websites, and apps.', 'مبنى مليء بالخوادم يستضيف المواقع والتطبيقات والتخزين السحابي.'),
    text: O(
      'Servers are mounted in racks inside climate-controlled halls backed by redundant power feeds, UPS banks, backup generators, and multiple fibre-optic uplinks.',
      'تصطف الخوادم في خزائن (Racks) داخل قاعات مبرّدة، وتغذّيها مصادر كهرباء متعددة ومولّدات احتياطية. وتتصل بالإنترنت عبر ألياف متعددة لتفادي الانقطاع.'
    ),
    points: [
      O('24/7 precision cooling and redundant uninterruptible power', 'تبريد وكهرباء احتياطية على مدار الساعة'),
      O('Replicates data across multiple sites for disaster recovery', 'نسخ متعددة من البيانات في مراكز مختلفة'),
      O('Powers cloud storage and SaaS/IaaS/PaaS platforms', 'هنا يعمل التخزين السحابي وخوادم المواقع'),
    ],
    lesson: 'online',
  },
  landing: {
    ar: 'محطة إنزال الكابل البحري', en: 'Cable Landing Station',
    idea: O('The coastal facility where undersea fibre cables come ashore and join terrestrial networks.', 'حيث يخرج الكابل من البحر ويتصل بشبكة اليابسة.'),
    text: O(
      'Built near the coastline, the landing station terminates submarine fibre cables, connects them to terrestrial backbone fibres, and supplies high-voltage DC power to optical repeaters along the ocean floor.',
      'تُقام المحطة قرب الشاطئ، ويصل إليها الكابل البحري ثم تتصل بكابلات أرضية نحو مراكز البيانات. وتحوي معدات تغذّي الكابل بالطاقة اللازمة للمكبّرات الضوئية على مساره.'
    ),
    points: [
      O('Bridges submarine cables with terrestrial fibre networks', 'نقطة الوصل بين البحر واليابسة'),
      O('Powers and monitors undersea optical repeaters', 'تغذّي مكبّرات الكابل وتراقبه'),
      O('Protected as critical national communications infrastructure', 'تُحاط بحماية أمنية لأنها حساسة'),
    ],
    lesson: 'connectivity',
  },
  cable: {
    ar: 'الكابل البحري', en: 'Submarine Communications Cable',
    idea: O('Armoured undersea fibre-optic cables carrying global Internet traffic between continents.', 'ألياف ضوئية تحت البحر تنقل معظم الإنترنت بين القارات.'),
    text: O(
      'Contains hair-thin glass optical fibres encased in steel wire, copper, and polyethylene armour. Laid across thousands of kilometres of seabed with optical amplifiers boosting laser pulses along the route.',
      'يحوي الكابل أزواجاً من الألياف الضوئية بطبقات حماية، ويمتد آلاف الكيلومترات على قاع المحيط، وتُركَّب عليه مكبّرات ضوئية على مسافات منتظمة لتقوية الإشارة. تنقل هذه الكوابل الغالبية العظمى من حركة البيانات الدولية.'
    ),
    points: [
      O('Transmits data as laser light pulses at near light speed in glass', 'الضوء ينقل البيانات عبر الألياف بسرعة هائلة'),
      O('Uses optical repeaters every 60–100 km to regenerate signals', 'مكبّرات ضوئية على مسافات منتظمة'),
      O('Multiple redundant cable routes protect against anchor or seismic damage', 'قد يتضرر بالمراسي أو الزلازل، فتوجد مسارات بديلة'),
    ],
    lesson: 'connectivity',
  },
  eastdc: {
    ar: 'مركز بيانات في قارة أخرى', en: 'Remote Continent Data Center',
    idea: O('The destination server hosting the global website or cloud service you requested.', 'هنا يوجد الخادم الذي يستضيف الموقع أو التطبيق الذي تطلبه.'),
    text: O(
      'Your request arrives at a remote data center on another continent, where the server processes it and sends the response packets back. Global services also use Content Delivery Networks (CDNs) to cache content closer to users.',
      'يصل طلبك إلى خادم في مركز بيانات بعيد، فيجهّز الاستجابة ويعيدها بالمسار نفسه. وتضع الخدمات الكبيرة نسخاً من محتواها في مراكز عدة (CDN) لتقريبه من المستخدمين.'
    ),
    points: [
      O('Response packets return and reassemble on your device (TCP/IP)', 'الرد يعود بحزم تُجمَّع على جهازك'),
      O('CDNs replicate content globally to reduce latency', 'شبكات CDN تقرّب المحتوى منك'),
      O('Physical geographic distance adds propagation latency', 'المسافة الجغرافية تزيد زمن الاستجابة'),
    ],
    lesson: 'online',
  },
  satellite: {
    ar: 'القمر الصناعي', en: 'Communications Satellite',
    idea: O('Provides wireless coverage for remote areas, ships, and aircraft where fibre cannot reach.', 'يكمّل الشبكة في المناطق التي يصعب مدّ الكبلات إليها.'),
    text: O(
      'Receives uplink signals from an earth station dish and relays them back down. Geostationary (GEO) satellites cover vast areas but have high latency (~600 ms), whereas Low Earth Orbit (LEO) constellations reduce latency significantly.',
      'يستقبل القمر الإشارة من محطة أرضية ويعيد بثها إلى أخرى. الأقمار في المدار العالي (GEO) تغطي مساحات واسعة بزمن استجابة كبير، أما المدار المنخفض (LEO) فيقلّل التأخير.'
    ),
    points: [
      O('Essential for rural/remote areas, aviation, and maritime links', 'مفيد للمناطق النائية والسفن والطائرات'),
      O('GEO orbit: Wide coverage but higher latency due to 35,786 km altitude', 'GEO: تغطية واسعة وتأخير أكبر'),
      O('LEO orbit: Much closer to Earth, offering lower latency', 'LEO: تأخير أقل وحاجة لأقمار أكثر'),
    ],
    lesson: 'connectivity',
  },
};

const SIM_JOURNEY = [
  ['home', 0.0, O('You tap "Send" in a chat app: your device splits the message into IP packets and sends them to your home router.', 'تضغط «إرسال» في تطبيق الدردشة: يحوّل جهازك الرسالة إلى حزم ويرسلها إلى الراوتر.')],
  ['cabinet', 0.1, O('The router forwards the packets through the modem out to the neighbourhood street cabinet.', 'الراوتر يرسلها عبر المودم إلى خزانة الحي حيث تتجمع خطوط الجيران.')],
  ['isp', 0.22, O('Packets reach the ISP central office, which verifies your link and consults its routing table.', 'تصل إلى مبنى المزوّد، فيتحقق من اشتراكك ويقرر الطريق التالي.')],
  ['ixp', 0.34, O('Traffic crosses the Internet Exchange Point (IXP) to peer directly with an international backbone carrier.', 'تعبر نقطة التبادل لتنتقل إلى شبكة أخرى مباشرة وبسرعة.')],
  ['landing', 0.46, O('Packets reach the coastal Cable Landing Station where terrestrial fibre meets the undersea cable.', 'تصل محطة الإنزال على الشاطئ، حيث يبدأ الكابل البحري.')],
  ['cable', 0.68, O('Your data crosses the ocean floor as rapid pulses of laser light inside the submarine fibre-optic cable.', 'تعبر المحيط كنبضات ضوئية داخل الألياف تحت البحر.')],
  ['eastdc', 1.0, O('The packets arrive at the remote data center on the other continent; the server processes the message and sends an acknowledgement!', 'تصل إلى مركز البيانات البعيد، فيستلمها الخادم ويعيد تأكيد الاستلام.')],
];

const SLAB = { w: 420, h: 12, d: 280 };
const DESK = { w: 620, h: 14, d: 340 };
const MODE_VIEWS = {
  stack: { rx: -28, ry: -35, zoom: 1, gap: 100, exploded: true },
  scene: { rx: -30, ry: -28, zoom: 0.9, gap: 0, exploded: false },
};

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function findEntry(id) {
  if (!id || id === 'overview') return OVERVIEW;
  if (id === 'sim-overview') return SIM_OVERVIEW;
  if (SIM_ENTRIES[id]) {
    const e = SIM_ENTRIES[id];
    return { ...e, id, layerName: O('Simulation', 'محاكاة'), rgb: '34,211,238' };
  }
  const layer = LAYERS.find((l) => l.id === id);
  if (layer) return { ...layer, layerName: O('Infrastructure Layer', 'طبقة البنية التحتية') };
  const part = PARTS.find((p) => p.id === id) || EXTRA_PARTS.find((p) => p.id === id);
  if (part) {
    const parent = LAYERS.find((l) => l.id === part.layer);
    return { ...part, layerName: parent ? O(parent.en, parent.ar) : O('Component', 'قطعة'), rgb: parent?.rgb || '34,211,238' };
  }
  return OVERVIEW;
}

function stationPoint(id) {
  const item = SCENE_ITEMS.find((s) => s.id === id);
  if (!item) return { x: 0, y: -30, z: 0 };
  if (item.globe) return { x: item.x, y: -DESK.h / 2 - 46, z: item.z };
  const n = item.boxes.length || 1;
  const avg = (pick) => item.boxes.reduce((sum, b) => sum + pick(b), 0) / n;
  return {
    x: item.x + avg((b) => b[0]),
    y: -DESK.h / 2 - avg((b) => b[5] + b[3] / 2),
    z: item.z + avg((b) => b[1]),
  };
}

class OrbitRig {
  constructor(camera, dom, { target, radius, theta, phi, minR = 15, maxR = 520 }) {
    Object.assign(this, { camera, dom, minR, maxR, theta, phi, r: radius, t: { ...target }, anim: null, drag: null, enabled: true });
    this.onDown = (e) => { if (this.enabled) this.drag = { x: e.clientX, y: e.clientY }; };
    this.onMove = (e) => {
      if (!this.drag) return;
      this.theta -= (e.clientX - this.drag.x) * 0.006;
      this.phi = Math.max(0.12, Math.min(1.5, this.phi - (e.clientY - this.drag.y) * 0.005));
      this.drag = { x: e.clientX, y: e.clientY };
      this.anim = null;
    };
    this.onUp = () => { this.drag = null; };
    this.onWheel = (e) => {
      e.preventDefault();
      this.r = Math.max(this.minR, Math.min(this.maxR, this.r * (1 + e.deltaY * 0.001)));
    };
    dom.addEventListener('pointerdown', this.onDown);
    window.addEventListener('pointermove', this.onMove);
    window.addEventListener('pointerup', this.onUp);
    dom.addEventListener('wheel', this.onWheel, { passive: false });
    this.apply();
  }
  dispose() {
    this.dom.removeEventListener('pointerdown', this.onDown);
    this.dom.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp);
  }
  apply() {
    const sp = Math.sin(this.phi);
    this.camera.position.set(
      this.t.x + this.r * sp * Math.sin(this.theta),
      this.t.y + this.r * Math.cos(this.phi),
      this.t.z + this.r * sp * Math.cos(this.theta)
    );
    this.camera.lookAt(this.t.x, this.t.y, this.t.z);
  }
  flyTo(target, radius, theta, phi, ms = 1200) {
    let dTheta = theta - this.theta;
    dTheta = Math.atan2(Math.sin(dTheta), Math.cos(dTheta));
    this.anim = {
      from: { t: { ...this.t }, r: this.r, theta: this.theta, phi: this.phi },
      to: { t: { ...target }, r: radius, dTheta, phi },
      start: performance.now(),
      ms,
    };
  }
  step(now = performance.now()) {
    if (this.anim) {
      const a = this.anim;
      const k = Math.min(1, (now - a.start) / a.ms);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      ['x', 'y', 'z'].forEach((c) => { this.t[c] = a.from.t[c] + (a.to.t[c] - a.from.t[c]) * e; });
      this.r = a.from.r + (a.to.r - a.from.r) * e;
      this.theta = a.from.theta + a.to.dTheta * e;
      this.phi = a.from.phi + (a.to.phi - a.from.phi) * e;
      if (k >= 1) this.anim = null;
    }
    this.apply();
  }
}

function buildSimWorld(scene) {
  const world = { windows: [], packets: [], waves: [], curves: {} };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...extra });
  const place = (mesh) => { mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh); return mesh; };
  const box = (w, h, d, color, x, z, base = 0, extra) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), std(color, extra));
    mesh.position.set(x, base + h / 2, z);
    return place(mesh);
  };
  const windowAt = (x, y, z, w = 1.4, h = 1.6) => {
    const material = std(0x1b2a3d, { emissive: 0xffd27a, emissiveIntensity: 0, roughness: 0.4 });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    world.windows.push(material);
  };
  let seed = 7;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

  const landMaterial = std(0x4a9a58, { roughness: 0.95 });
  const west = new THREE.Mesh(new THREE.BoxGeometry(155, 2, 140), landMaterial);
  west.position.set(-32.5, -1, 0); west.receiveShadow = true; scene.add(west);
  const east = new THREE.Mesh(new THREE.BoxGeometry(100, 2, 120), landMaterial);
  east.position.set(185, -1, 0); east.receiveShadow = true; scene.add(east);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(900, 500), std(0x0f6bb0, { transparent: true, opacity: 0.78, roughness: 0.25, metalness: 0.3 }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(90, -0.35, 0); scene.add(sea);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(900, 500), std(0x0a2d4a));
  floor.rotation.x = -Math.PI / 2; floor.position.set(90, -9, 0); scene.add(floor);
  box(95, 0.1, 4, 0x3b3f4a, -28, 14, 0);

  for (let i = 0; i < 34; i++) {
    const onWest = rand() < 0.6;
    const x = onWest ? -105 + rand() * 145 : 140 + rand() * 90;
    const z = -62 + rand() * 124;
    if (onWest && z > 6 && z < 22) continue;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2, 6), std(0x6b4a2b));
    trunk.position.set(x, 1, z); place(trunk);
    const leaves = new THREE.Mesh(new THREE.ConeGeometry(1.8, 4.2, 7), std(0x2f7d3f));
    leaves.position.set(x, 4, z); place(leaves);
  }

  // Home
  box(10, 6, 9, 0xe9dcc3, -70, 15);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(8.2, 4, 4), std(0xb4543d));
  roof.position.set(-70, 8, 15); roof.rotation.y = Math.PI / 4; place(roof);
  [-73, -67].forEach((x) => windowAt(x, 3.4, 19.55));
  box(1.6, 0.8, 1, 0x222733, -64, 12.2, 0);
  box(0.12, 1.4, 0.12, 0x222733, -64.6, 12.2, 0.8);
  box(0.12, 1.4, 0.12, 0x222733, -63.4, 12.2, 0.8);
  // Street Cabinet
  box(2.4, 3.2, 1.6, 0x4f7a63, -52, 12);
  // Cell Tower
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.9, 26, 8), std(0xc8ccd6, { metalness: 0.4 }));
  pole.position.set(-80, 13, -25); place(pole);
  for (let i = 0; i < 3; i++) {
    const sector = new THREE.Mesh(new THREE.BoxGeometry(1, 4, 0.5), std(0xeeeeee));
    const a = (i * 2 * Math.PI) / 3;
    sector.position.set(-80 + Math.cos(a) * 1.3, 24, -25 + Math.sin(a) * 1.3);
    sector.rotation.y = -a;
    place(sector);
  }
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3, 0.12, 8, 40), new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.8 }));
    ring.position.set(-80, 24, -25);
    ring.rotation.x = Math.PI / 2;
    ring.userData.phase = i / 3;
    scene.add(ring);
    world.waves.push(ring);
  }
  // ISP
  box(14, 9, 12, 0x6f7c9c, -30, 12);
  [-34, -30, -26].forEach((x) => { windowAt(x, 3, 18.05); windowAt(x, 6.4, 18.05); });
  box(0.5, 6, 0.5, 0xc8ccd6, -27, 12, 9);
  const dish = new THREE.Mesh(new THREE.SphereGeometry(2, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), std(0xf0f0f0, { side: THREE.DoubleSide }));
  dish.position.set(-33, 11, 12); dish.rotation.x = -0.9; place(dish);
  // IXP
  box(12, 8, 12, 0x7b6aa9, 0, 0);
  box(12.4, 0.7, 12.4, 0xa78bfa, 0, 0, 8, { emissive: 0xa78bfa, emissiveIntensity: 0.9 });
  [-3, 3].forEach((x) => windowAt(x, 4, 6.05));
  // West Data Center
  box(26, 9, 14, 0x505c75, 22, -18);
  for (let i = 0; i < 8; i++) {
    const vent = new THREE.Mesh(new THREE.BoxGeometry(2, 1.2, 0.2), std(0x0e2a3a, { emissive: 0x22d3ee, emissiveIntensity: 0.55 }));
    vent.position.set(12 + i * 3, 4, -10.9);
    scene.add(vent);
  }
  for (let i = 0; i < 4; i++) {
    const fan = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.5, 16), std(0x222733));
    fan.position.set(14 + i * 5, 9.3, -18);
    place(fan);
  }
  // Cable Landing Station
  box(7, 5, 7, 0x8d8268, 40, 5);
  box(7.6, 0.6, 7.6, 0x5c5444, 40, 5, 5);
  windowAt(40, 2.4, 8.55);
  // East Continent Data Center & City
  box(24, 9, 14, 0x505c75, 190, -10);
  for (let i = 0; i < 8; i++) {
    const vent = new THREE.Mesh(new THREE.BoxGeometry(2, 1.2, 0.2), std(0x0e2a3a, { emissive: 0x22d3ee, emissiveIntensity: 0.55 }));
    vent.position.set(181 + i * 2.6, 4, -2.9);
    scene.add(vent);
  }
  const cityPalette = [0x8b5cf6, 0x38bdf8, 0x7c3aed, 0x8d6e63, 0x64748b, 0x0ea5e9];
  for (let i = 0; i < 10; i++) {
    const w = 4 + rand() * 4;
    const h = 8 + rand() * 20;
    const x = 160 + rand() * 62;
    const z = 18 + rand() * 30;
    box(w, h, w, cityPalette[i % cityPalette.length], x, z);
    for (let k = 0; k < 3; k++) windowAt(x + (k - 1) * (w / 3), 3 + rand() * (h - 5), z + w / 2 + 0.05, 1, 1.2);
  }
  const eastDish = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.6, 18), std(0xf0f0f0));
  eastDish.position.set(205, 2.5, 3); eastDish.rotation.z = 2.4; place(eastDish);
  box(0.4, 2, 0.4, 0x999999, 205, 3, 0);

  const pts = [
    [-70, 0.4, 13], [-52, 0.4, 13], [-30, 0.4, 13], [-12, 0.4, 7], [0, 0.4, 2], [20, 0.4, 6], [40, 0.4, 5],
    [60, -2, 8], [90, -3, 0], [120, -2, -6], [140, 0.4, -10], [165, 0.4, -10], [190, 0.4, -8],
  ];
  const curveOf = (list) => new THREE.CatmullRomCurve3(list.map((p) => V(p[0], p[1], p[2])));
  const tube = (curve, color, radius = 0.3, segments = 80) => {
    const mesh = new THREE.Mesh(
      new THREE.TubeGeometry(curve, segments, radius, 6, false),
      std(color, { emissive: color, emissiveIntensity: 0.9, roughness: 0.4 })
    );
    scene.add(mesh);
    return mesh;
  };
  const landA = curveOf(pts.slice(0, 7));
  const seaCurve = curveOf(pts.slice(6, 11));
  const landB = curveOf(pts.slice(10));
  const ixpDc = curveOf([[0, 0.4, 0], [10, 0.4, -10], [22, 0.4, -16]]);
  const towerIsp = curveOf([[-80, 0.4, -24], [-55, 0.4, -5], [-32, 0.4, 10]]);
  tube(landA, 0x22d3ee);
  tube(seaCurve, 0xf59e0b, 0.4, 100);
  tube(landB, 0x22d3ee);
  tube(ixpDc, 0xa78bfa);
  tube(towerIsp, 0x34d399);
  world.journeyCurve = curveOf(pts);
  world.journeyPoints = pts;

  const addPackets = (curve, count, color, speed) => {
    const length = curve.getLength();
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.7, 10, 8), new THREE.MeshBasicMaterial({ color }));
      scene.add(mesh);
      world.packets.push({ mesh, curve, length, t: i / count, speed });
    }
  };
  addPackets(landA, 6, 0xffffff, 14);
  addPackets(seaCurve, 5, 0xfff1c2, 22);
  addPackets(landB, 3, 0xffffff, 14);
  addPackets(ixpDc, 3, 0xe9d5ff, 10);
  addPackets(towerIsp, 3, 0xbbf7d0, 10);

  // Satellite
  const satellite = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 6), std(0xd9b44a, { metalness: 0.6, roughness: 0.4 }));
  const panelMaterial = std(0x2a5db0, { emissive: 0x16356b, emissiveIntensity: 0.4 });
  const panelA = new THREE.Mesh(new THREE.BoxGeometry(10, 0.2, 4), panelMaterial); panelA.position.x = 7;
  const panelB = new THREE.Mesh(new THREE.BoxGeometry(10, 0.2, 4), panelMaterial); panelB.position.x = -7;
  satellite.add(body, panelA, panelB);
  scene.add(satellite);
  world.satellite = satellite;

  const beamGeometry = new THREE.BufferGeometry().setFromPoints([V(0, 0, 0), V(0, 1, 0)]);
  world.beam = new THREE.Line(beamGeometry, new THREE.LineBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.8 }));
  scene.add(world.beam);
  world.dishPoint = V(205, 3, 3);

  const starPositions = [];
  for (let i = 0; i < 400; i++) {
    const a = rand() * Math.PI * 2;
    const e = rand() * 1.2 + 0.1;
    const r = 700;
    starPositions.push(Math.cos(a) * Math.cos(e) * r + 90, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r);
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  world.stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xffffff, size: 2 }));
  world.stars.visible = false;
  scene.add(world.stars);

  world.hemi = new THREE.HemisphereLight(0xcfe3ff, 0x3a5a3a, 0.75);
  scene.add(world.hemi);
  world.sun = new THREE.DirectionalLight(0xffffff, 0.95);
  world.sun.position.set(110, 140, 80);
  world.sun.target.position.set(80, 0, 0);
  world.sun.castShadow = true;
  world.sun.shadow.mapSize.set(2048, 2048);
  Object.assign(world.sun.shadow.camera, { left: -180, right: 180, top: 130, bottom: -130, near: 10, far: 450 });
  scene.add(world.sun, world.sun.target);

  world.setNight = (on) => {
    const sky = on ? 0x050816 : 0x3a82c4;
    scene.background.set(sky);
    scene.fog.color.set(sky);
    world.hemi.intensity = on ? 0.28 : 0.8;
    world.sun.intensity = on ? 0.18 : 0.95;
    world.sun.color.set(on ? 0x8fa8ff : 0xffffff);
    world.windows.forEach((m) => { m.emissiveIntensity = on ? 1 : 0; });
    world.stars.visible = on;
  };
  return world;
}

function Box3D({ w, h, d, x, y, z }) {
  const faces = [
    { cls: 'front', style: { width: w, height: h, transform: `translateZ(${d / 2}px)` } },
    { cls: 'back', style: { width: w, height: h, transform: `rotateY(180deg) translateZ(${d / 2}px)` } },
    { cls: 'right', style: { width: d, height: h, left: (w - d) / 2, transform: `rotateY(90deg) translateZ(${w / 2}px)` } },
    { cls: 'left', style: { width: d, height: h, left: (w - d) / 2, transform: `rotateY(-90deg) translateZ(${w / 2}px)` } },
    { cls: 'top', style: { width: w, height: d, top: (h - d) / 2, transform: `rotateX(90deg) translateZ(${h / 2}px)` } },
    { cls: 'bottom', style: { width: w, height: d, top: (h - d) / 2, transform: `rotateX(-90deg) translateZ(${h / 2}px)` } },
  ];
  return (
    <div
      className="inf-box"
      style={{
        width: w,
        height: h,
        left: -w / 2,
        top: -h / 2,
        transform: `translate3d(${x}px, ${y}px, ${z}px)`,
      }}
    >
      {faces.map((f) => (
        <i key={f.cls} className={`inf-face ${f.cls}`} style={f.style} />
      ))}
    </div>
  );
}

function Part3D({ def, geometry, groupRgb, baseY, lang, selectedId, flashMap, onPick }) {
  let top = 0;
  geometry.boxes.forEach(([, , , h, , lift]) => {
    top = Math.max(top, lift + h);
  });
  if (geometry.globe) top = 92;
  const flashCls = flashMap[def.id] || '';
  const isSel = selectedId === def.id;

  return (
    <div
      className={`inf-part ${geometry.mini ? 'mini' : ''} ${isSel ? 'sel' : ''} ${flashCls}`}
      data-id={def.id}
      style={{
        '--c': groupRgb,
        transform: `translate3d(${geometry.x}px, ${baseY}px, ${geometry.z}px)`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onPick(def.id);
      }}
    >
      {geometry.boxes.map(([bx, bz, w, h, d, lift], idx) => (
        <Box3D key={idx} w={w} h={h} d={d} x={bx} y={-(lift + h / 2)} z={bz} />
      ))}
      {geometry.globe && (
        <div className="inf-globe" style={{ transform: 'translateY(-46px)' }}>
          <div className="inf-globe-spin">
            {[0, 60, 120].map((a) => (
              <i key={a} style={{ transform: `rotateY(${a}deg)` }} />
            ))}
          </div>
        </div>
      )}
      <span className="inf-tag3d" style={{ '--lift': `${top + 14}px` }}>
        {lang === 'ar' ? def.ar : def.en}
      </span>
    </div>
  );
}

export default function Infrastructure() {
  const { t, c, lang, nf } = useI18n();
  const [mode, setModeState] = useState('stack'); // stack | scene | sim
  const [selectedId, setSelectedId] = useState(null);
  const [hiddenGroups, setHiddenGroups] = useState(() => new Set());
  const [autoRotate, setAutoRotate] = useState(true);
  const [exploded, setExploded] = useState(true);
  const [flashMap, setFlashMap] = useState({});

  // Journey state (for Layers / Computer)
  const [journey, setJourney] = useState(null); // { index, playing }
  const [packetPos, setPacketPos] = useState(null);
  const journeyAnimRef = useRef(null);
  const journeyTimerRef = useRef(null);
  const journeyFromRef = useRef(null);

  // 3D Quiz state
  const [quiz, setQuiz] = useState(null); // { list, index, score, locked, done }

  // Simulation state
  const [simNight, setSimNight] = useState(false);
  const [simFlow, setSimFlow] = useState(true);
  const [simLabels, setSimLabels] = useState(true);
  const [simSpot, setSimSpot] = useState('world');
  const [simTour, setSimTour] = useState(null); // { index }
  const simWrapRef = useRef(null);
  const simCanvasRef = useRef(null);
  const markerElsRef = useRef({});
  const simRef = useRef({
    ready: false,
    scene: null,
    camera: null,
    renderer: null,
    world: null,
    rig: null,
    clock: null,
    raf: null,
    ro: null,
    tourPacket: null,
    tourAnim: null,
    tourTimer: null,
    flow: true,
    labels: true,
  });

  // CSS 3D camera state
  const viewRef = useRef({ rx: -28, ry: -35, zoom: 1, gap: 100 });
  const worldDomRef = useRef(null);
  const stageDomRef = useRef(null);
  const dragRef = useRef({ active: false, moved: false, startX: 0, startY: 0 });

  const applyViewToDom = useCallback(() => {
    const el = worldDomRef.current;
    if (!el) return;
    const v = viewRef.current;
    el.style.setProperty('--rx', `${v.rx}deg`);
    el.style.setProperty('--ry', `${v.ry}deg`);
    el.style.setProperty('--gap', `${v.gap}px`);
    el.style.transform = `rotateX(${v.rx}deg) rotateY(${v.ry}deg) scale(${v.zoom})`;
  }, []);

  // Auto-rotation loop for CSS 3D modes (stack & scene)
  useEffect(() => {
    if (mode === 'sim') return undefined;
    let raf;
    const spin = () => {
      if (autoRotate && !dragRef.current.active) {
        viewRef.current.ry += 0.15;
        applyViewToDom();
      }
      raf = requestAnimationFrame(spin);
    };
    raf = requestAnimationFrame(spin);
    return () => cancelAnimationFrame(raf);
  }, [mode, autoRotate, applyViewToDom]);

  // Pointer drag & wheel zoom on CSS 3D stage
  useEffect(() => {
    const stage = stageDomRef.current;
    if (!stage || mode === 'sim') return undefined;
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    const onDown = (e) => {
      if (e.target.closest('.inf-hud, .inf-card-hud, .inf-sim-hud, .inf-top-badge')) return;
      dragRef.current = { active: true, moved: false, startX: e.clientX, startY: e.clientY, lastX: e.clientX, lastY: e.clientY };
    };
    const onMove = (e) => {
      const d = dragRef.current;
      if (!d.active) return;
      const dx = e.clientX - d.lastX;
      const dy = e.clientY - d.lastY;
      d.lastX = e.clientX;
      d.lastY = e.clientY;
      if (Math.abs(e.clientX - d.startX) + Math.abs(e.clientY - d.startY) > 6) d.moved = true;
      viewRef.current.ry += dx * 0.4;
      viewRef.current.rx = clamp(viewRef.current.rx - dy * 0.3, -85, -2);
      applyViewToDom();
    };
    const onUp = () => { dragRef.current.active = false; };
    const onWheel = (e) => {
      e.preventDefault();
      viewRef.current.zoom = clamp(viewRef.current.zoom * (e.deltaY < 0 ? 1.08 : 0.93), 0.5, 1.8);
      applyViewToDom();
    };
    stage.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    stage.addEventListener('wheel', onWheel, { passive: false });
    applyViewToDom();
    return () => {
      stage.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      stage.removeEventListener('wheel', onWheel);
    };
  }, [mode, applyViewToDom]);

  const stopJourney = useCallback(() => {
    clearTimeout(journeyTimerRef.current);
    cancelAnimationFrame(journeyAnimRef.current);
    setJourney(null);
    setPacketPos(null);
    journeyFromRef.current = null;
  }, []);

  const stopQuiz = useCallback(() => {
    setQuiz(null);
    setFlashMap({});
  }, []);

  const stopSimTour = useCallback(() => {
    const s = simRef.current;
    clearTimeout(s.tourTimer);
    if (s.tourPacket && s.scene) {
      s.scene.remove(s.tourPacket);
      s.tourPacket.geometry.dispose();
      s.tourPacket.material.dispose();
      s.tourPacket = null;
    }
    s.tourAnim = null;
    setSimTour(null);
  }, []);

  const switchMode = useCallback((nextMode) => {
    stopJourney();
    stopQuiz();
    stopSimTour();
    setModeState(nextMode);
    if (nextMode === 'sim') {
      setSelectedId('sim-overview');
      setSimSpot('world');
    } else {
      const preset = MODE_VIEWS[nextMode];
      viewRef.current = { rx: preset.rx, ry: preset.ry, zoom: preset.zoom, gap: preset.gap };
      setExploded(preset.exploded);
      setSelectedId(null);
      setTimeout(applyViewToDom, 0);
    }
  }, [applyViewToDom, stopJourney, stopQuiz, stopSimTour]);

  // Three.js Simulation initialization & loop
  useEffect(() => {
    const s = simRef.current;
    s.flow = simFlow;
    s.labels = simLabels;
  }, [simFlow, simLabels]);

  useEffect(() => {
    if (mode !== 'sim') return undefined;
    const wrap = simWrapRef.current;
    const canvas = simCanvasRef.current;
    if (!wrap || !canvas) return undefined;
    const s = simRef.current;

    if (!s.ready) {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x3a82c4);
      scene.fog = new THREE.Fog(0x3a82c4, 260, 760);
      const camera = new THREE.PerspectiveCamera(50, 1.6, 1, 1500);
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      const world = buildSimWorld(scene);
      const rig = new OrbitRig(camera, canvas, { target: { x: 70, y: 0, z: 0 }, radius: 300, theta: 0.25, phi: 1.0, minR: 20, maxR: 520 });
      rig.step();
      s.scene = scene;
      s.camera = camera;
      s.renderer = renderer;
      s.world = world;
      s.rig = rig;
      s.clock = new THREE.Clock();
      s.tmp = new THREE.Vector3();
      s.ready = true;
    }

    const resize = () => {
      if (!s.renderer || !wrap) return;
      const w = wrap.clientWidth || 1;
      const h = wrap.clientHeight || 1;
      s.renderer.setSize(w, h, false);
      s.camera.aspect = w / h;
      s.camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();
    s.clock.start();

    let alive = true;
    const loop = () => {
      if (!alive) return;
      s.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, s.clock.getDelta());
      const time = s.clock.elapsedTime;
      const w = s.world;
      s.rig.step();

      if (s.flow) {
        w.packets.forEach((p) => {
          p.t = (p.t + (p.speed * dt) / p.length) % 1;
          p.mesh.position.copy(p.curve.getPointAt(p.t));
        });
      }
      w.waves.forEach((ring) => {
        const k = (time * 0.6 + ring.userData.phase) % 1;
        ring.scale.setScalar(0.4 + k * 4);
        ring.material.opacity = 0.8 * (1 - k);
      });
      const angle = time * 0.18;
      w.satellite.position.set(100 + Math.cos(angle) * 85, 56, -10 + Math.sin(angle) * 55);
      w.satellite.rotation.y = -angle;
      const pos = w.beam.geometry.attributes.position;
      pos.setXYZ(0, w.satellite.position.x, w.satellite.position.y, w.satellite.position.z);
      pos.setXYZ(1, w.dishPoint.x, w.dishPoint.y, w.dishPoint.z);
      pos.needsUpdate = true;

      if (s.tourPacket && s.tourAnim) {
        const ta = s.tourAnim;
        const k = Math.min(1, (performance.now() - ta.start) / ta.ms);
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        s.tourPacket.position.copy(w.journeyCurve.getPointAt(ta.from + (ta.to - ta.from) * e));
        s.tourPacket.position.y += 1.2;
      }

      // Update projected HTML markers
      const width = wrap.clientWidth || 1;
      const height = wrap.clientHeight || 1;
      SIM_SPOTS.forEach((spot) => {
        const el = markerElsRef.current[spot.id];
        if (!el) return;
        s.tmp.set(spot.anchor[0], spot.anchor[1], spot.anchor[2]).project(s.camera);
        const x = (s.tmp.x * 0.5 + 0.5) * width;
        const y = (-s.tmp.y * 0.5 + 0.5) * height;
        const vis = s.labels && s.tmp.z < 1 && x > -40 && x < width + 40 && y > -40 && y < height + 40;
        el.style.display = vis ? '' : 'none';
        el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
      });

      s.renderer.render(s.scene, s.camera);
    };
    s.raf = requestAnimationFrame(loop);

    return () => {
      alive = false;
      cancelAnimationFrame(s.raf);
      ro.disconnect();
    };
  }, [mode]);

  // Full WebGL disposal when leaving the Infrastructure page
  useEffect(() => () => {
    stopJourney();
    stopQuiz();
    stopSimTour();
    const s = simRef.current;
    if (s.ready) {
      cancelAnimationFrame(s.raf);
      s.rig?.dispose();
      disposeTree(s.scene);
      s.renderer?.dispose();
      s.renderer?.forceContextLoss?.();
      s.ready = false;
    }
  }, [stopJourney, stopQuiz, stopSimTour]);

  const focusSimSpot = useCallback((id) => {
    const s = simRef.current;
    if (!s.ready) return;
    if (id === 'world') {
      s.rig.flyTo({ x: 70, y: 0, z: 0 }, 300, 0.25, 1.0);
      setSimSpot('world');
      setSelectedId('sim-overview');
      return;
    }
    const spot = SIM_SPOTS.find((x) => x.id === id);
    if (!spot) return;
    s.rig.flyTo({ x: spot.target[0], y: spot.target[1], z: spot.target[2] }, spot.cam[0], spot.cam[1], spot.cam[2]);
    setSimSpot(id);
    setSelectedId(id);
    actions.inspect('infrastructure', id);
  }, []);

  const goSimTourStep = useCallback((index, fractions) => {
    const s = simRef.current;
    if (!s.ready || index < 0 || index >= SIM_JOURNEY.length) return;
    clearTimeout(s.tourTimer);
    const prevTo = s.tourAnim ? s.tourAnim.to : 0;
    const nextTo = fractions[index];
    s.tourAnim = { from: prevTo, to: nextTo, start: performance.now(), ms: 1800, fractions };
    const [spotId] = SIM_JOURNEY[index];
    focusSimSpot(spotId);
    setSimTour({ index, fractions });
    if (index < SIM_JOURNEY.length - 1) {
      s.tourTimer = setTimeout(() => goSimTourStep(index + 1, fractions), 5200);
    }
  }, [focusSimSpot]);

  const startSimTour = useCallback(() => {
    stopSimTour();
    const s = simRef.current;
    if (!s.ready) return;
    const pts = s.world.journeyPoints;
    const cumulative = [0];
    for (let i = 1; i < pts.length; i++) {
      cumulative.push(cumulative[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
    }
    const fractionAt = (idx) => cumulative[idx] / cumulative[cumulative.length - 1];
    const fractions = [0, fractionAt(1), fractionAt(2), fractionAt(4), fractionAt(6), fractionAt(8), 1];
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1.7, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    s.scene.add(mesh);
    s.tourPacket = mesh;
    s.tourAnim = { from: 0, to: 0, start: performance.now(), ms: 1800, fractions };
    goSimTourStep(0, fractions);
  }, [goSimTourStep, stopSimTour]);

  // Journey step runner for Layers/Computer modes
  const goJourneyStep = useCallback((index, playing = true) => {
    if (index < 0 || index >= JOURNEY_STEPS.length) return;
    clearTimeout(journeyTimerRef.current);
    cancelAnimationFrame(journeyAnimRef.current);
    const [partId] = JOURNEY_STEPS[index];
    setSelectedId(partId);
    const to = stationPoint(partId);
    const from = journeyFromRef.current || to;
    journeyFromRef.current = to;
    const start = performance.now();
    const duration = 1200;
    const animatePacket = (now) => {
      const k = Math.min(1, (now - start) / duration);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      const arc = Math.sin(k * Math.PI) * 40;
      setPacketPos({
        x: from.x + (to.x - from.x) * e,
        y: from.y + (to.y - from.y) * e - arc,
        z: from.z + (to.z - from.z) * e,
      });
      if (k < 1) journeyAnimRef.current = requestAnimationFrame(animatePacket);
    };
    journeyAnimRef.current = requestAnimationFrame(animatePacket);
    setJourney({ index, playing });
    if (playing && index < JOURNEY_STEPS.length - 1) {
      journeyTimerRef.current = setTimeout(() => goJourneyStep(index + 1, true), 4000);
    }
  }, []);

  const startDataJourney = () => {
    stopQuiz();
    if (mode !== 'scene') {
      setModeState('scene');
      const preset = MODE_VIEWS.scene;
      viewRef.current = { rx: preset.rx, ry: preset.ry, zoom: preset.zoom, gap: preset.gap };
      setExploded(false);
      setTimeout(applyViewToDom, 0);
    }
    setAutoRotate(false);
    journeyFromRef.current = null;
    goJourneyStep(0, true);
  };

  const startWorldQuiz = () => {
    stopJourney();
    const candidates = (mode === 'stack'
      ? [...LAYERS.map((l) => ({ id: l.id, group: l.id })), ...PARTS.map((p) => ({ id: p.id, group: p.layer }))]
      : SCENE_ITEMS.map((s) => ({ id: s.id, group: s.group }))
    ).filter((c) => !hiddenGroups.has(c.group)).map((c) => c.id);

    const list = shuffle(candidates).slice(0, 8).map((id, idx) => ({ id, byIdea: idx % 2 === 1 }));
    setQuiz({ list, index: 0, score: 0, locked: false, done: false });
  };

  const handlePick3D = (id) => {
    if (dragRef.current.moved) return;
    if (quiz && !quiz.done) {
      if (quiz.locked) return;
      const rightId = quiz.list[quiz.index].id;
      const ok = id === rightId;
      const nextScore = quiz.score + (ok ? 1 : 0);
      setQuiz((q) => ({ ...q, score: nextScore, locked: true }));
      setFlashMap(ok ? { [id]: 'good' } : { [id]: 'bad', [rightId]: 'good' });
      setTimeout(() => {
        setFlashMap({});
        setQuiz((q) => {
          if (!q) return null;
          if (q.index + 1 >= q.list.length) {
            actions.score('infraQuiz', nextScore * 15);
            toast(t('games.xp'), 'trophy');
            return { ...q, locked: false, done: true };
          }
          return { ...q, index: q.index + 1, locked: false };
        });
      }, 1250);
      return;
    }
    setSelectedId((prev) => (prev === id ? null : id));
    if (id) actions.inspect('infrastructure', id);
  };

  const toggleGroup = (layerId) => {
    setHiddenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) next.delete(layerId);
      else next.add(layerId);
      return next;
    });
  };

  const resetView = () => {
    stopJourney();
    stopQuiz();
    setHiddenGroups(new Set());
    setAutoRotate(true);
    const preset = MODE_VIEWS[mode] || MODE_VIEWS.stack;
    viewRef.current = { rx: preset.rx, ry: preset.ry, zoom: preset.zoom, gap: preset.gap };
    setExploded(preset.exploded);
    setSelectedId(null);
    applyViewToDom();
  };

  const toggleExplode = () => {
    const next = !exploded;
    setExploded(next);
    viewRef.current.gap = next ? 100 : 22;
    applyViewToDom();
  };

  const zoomBy = (factor) => {
    viewRef.current.zoom = Math.max(0.5, Math.min(1.8, viewRef.current.zoom * factor));
    applyViewToDom();
  };

  const activeEntry = useMemo(
    () => findEntry(selectedId || (mode === 'sim' ? 'sim-overview' : 'overview')),
    [selectedId, mode]
  );

  const quizCurrent = quiz && !quiz.done ? findEntry(quiz.list[quiz.index]?.id) : null;

  return (
    <div className="content wide">
      <PageHead eyebrow={t('inf.eyebrow')} title={t('inf.title')}>{t('inf.lead')}</PageHead>

      <div className="viewer-layout inf-layout">
        <div className="viewer-main">
          <div
            ref={stageDomRef}
            className={`stage inf-stage ${mode === 'sim' ? 'sim-mode' : ''}`}
            onClick={() => { if (!dragRef.current.moved && !quiz && mode !== 'sim') setSelectedId(null); }}
          >
            {/* Top-left 3D title & top-right interaction hint */}
            <div className="inf-top-badge">
              <b>3D</b>
              <span>{t('inf.stage.sub')}</span>
            </div>
            <div className="inf-top-hint">{t('inf.stage.hint')}</div>

            {/* Mode 1 & 2: Layers (stack) and Computer (scene) */}
            {mode !== 'sim' && (
              <div className="inf-world-scene">
                <div
                  ref={worldDomRef}
                  className={`inf-world mode-${mode} ${[...hiddenGroups].map((g) => `hide-${g}`).join(' ')}`}
                >
                  <div className="inf-floor" />

                  {mode === 'stack' ? (
                    <>
                      {[[-210, -140], [210, -140], [-210, 140], [210, 140], [0, 0]].map(([px, pz], idx) => (
                        <div
                          key={idx}
                          className="inf-pillar"
                          style={{
                            transform: `translate3d(${px}px, -50%, ${pz}px)`,
                            '--delay': `${idx * 0.4}s`,
                          }}
                        >
                          <i /><i />
                        </div>
                      ))}
                      {LAYERS.map((layer) => (
                        <div
                          key={layer.id}
                          className={`inf-layer ${selectedId === layer.id ? 'sel' : ''} ${flashMap[layer.id] || ''}`}
                          data-id={layer.id}
                          data-group={layer.id}
                          style={{ '--i': layer.i, '--c': layer.rgb }}
                        >
                          <div
                            className={`inf-slab ${selectedId === layer.id ? 'sel' : ''} ${flashMap[layer.id] || ''}`}
                            data-id={layer.id}
                            onClick={(e) => { e.stopPropagation(); handlePick3D(layer.id); }}
                          >
                            <Box3D w={SLAB.w} h={SLAB.h} d={SLAB.d} x={0} y={0} z={0} />
                          </div>
                          <span
                            className="inf-tag3d layer-tag"
                            style={{ '--lift': '0px' }}
                            onClick={(e) => { e.stopPropagation(); handlePick3D(layer.id); }}
                          >
                            {lang === 'ar' ? layer.ar : layer.en}
                          </span>
                          {PARTS.filter((p) => p.layer === layer.id).map((part) => (
                            <Part3D
                              key={part.id}
                              def={part}
                              geometry={part}
                              groupRgb={layer.rgb}
                              baseY={-SLAB.h / 2}
                              lang={lang}
                              selectedId={selectedId}
                              flashMap={flashMap}
                              onPick={handlePick3D}
                            />
                          ))}
                        </div>
                      ))}
                    </>
                  ) : (
                    <>
                      <div className="inf-slab desk" style={{ '--c': '196,150,100' }}>
                        <Box3D w={DESK.w} h={DESK.h} d={DESK.d} x={0} y={0} z={0} />
                      </div>
                      {SCENE_ITEMS.map((item) => {
                        const def = PARTS.find((p) => p.id === item.id) || EXTRA_PARTS.find((p) => p.id === item.id);
                        const grp = LAYERS.find((l) => l.id === item.group);
                        return (
                          <Part3D
                            key={item.id}
                            def={def}
                            geometry={item}
                            groupRgb={grp?.rgb || '34,211,238'}
                            baseY={-DESK.h / 2}
                            lang={lang}
                            selectedId={selectedId}
                            flashMap={flashMap}
                            onPick={handlePick3D}
                          />
                        );
                      })}
                      {packetPos && (
                        <div
                          className="inf-part packet"
                          style={{
                            '--c': '255,255,255',
                            transform: `translate3d(${packetPos.x}px, ${packetPos.y}px, ${packetPos.z}px)`,
                          }}
                        >
                          <Box3D w={16} h={16} d={16} x={0} y={0} z={0} />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Mode 3: Real Three.js Internet Simulation */}
            <div ref={simWrapRef} className={`inf-sim-wrap ${mode === 'sim' ? 'on' : ''}`}>
              <canvas ref={simCanvasRef} className="inf-sim-canvas" />
              <div className="inf-sim-markers">
                {SIM_SPOTS.map((spot) => (
                  <button
                    key={spot.id}
                    type="button"
                    ref={(el) => { markerElsRef.current[spot.id] = el; }}
                    className={`inf-sim-marker ${simSpot === spot.id ? 'sel' : ''}`}
                    onClick={() => { stopSimTour(); focusSimSpot(spot.id); }}
                  >
                    <span>{spot.icon}</span>
                    <b>{c(spot.label)}</b>
                  </button>
                ))}
              </div>
              {mode === 'sim' && (
                <div className="inf-sim-hud">
                  <div className="inf-sim-chips">
                    <button
                      type="button"
                      className={`inf-chip-btn ${simSpot === 'world' ? 'on' : ''}`}
                      onClick={() => { stopSimTour(); focusSimSpot('world'); }}
                    >
                      🌍 {t('inf.sim.world')}
                    </button>
                    {SIM_SPOTS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className={`inf-chip-btn ${simSpot === s.id ? 'on' : ''}`}
                        onClick={() => { stopSimTour(); focusSimSpot(s.id); }}
                      >
                        {s.icon} {c(s.label)}
                      </button>
                    ))}
                  </div>
                  <div className="inf-sim-tools">
                    <button
                      type="button"
                      className="inf-small-btn"
                      onClick={() => {
                        const next = !simNight;
                        setSimNight(next);
                        simRef.current.world?.setNight(next);
                      }}
                    >
                      {simNight ? `🌙 ${t('inf.sim.night')}` : `☀️ ${t('inf.sim.day')}`}
                    </button>
                    <button
                      type="button"
                      className={`inf-small-btn ${!simFlow ? 'off' : ''}`}
                      onClick={() => setSimFlow((v) => !v)}
                    >
                      〰 {t('inf.sim.flow')}
                    </button>
                    <button
                      type="button"
                      className={`inf-small-btn ${!simLabels ? 'off' : ''}`}
                      onClick={() => setSimLabels((v) => !v)}
                    >
                      🏷 {t('inf.sim.labels')}
                    </button>
                    <button type="button" className="inf-small-btn accent" onClick={startSimTour}>
                      📨 {t('inf.sim.send')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Floating HUD Card for Data Journey, 3D Quiz, or Sim Message Tour */}
            {(journey || quiz || simTour) && (
              <div className="inf-card-hud on">
                {journey && (
                  <>
                    <div className="wc-head">
                      <b>📨 {t('inf.journey.title')}</b>
                      <span>{nf(journey.index + 1)} / {nf(JOURNEY_STEPS.length)}</span>
                    </div>
                    <h4>{lang === 'ar' ? findEntry(JOURNEY_STEPS[journey.index][0]).ar : findEntry(JOURNEY_STEPS[journey.index][0]).en}</h4>
                    <p>{c(JOURNEY_STEPS[journey.index][1])}</p>
                    <div className="wc-buttons">
                      <button type="button" className="inf-small-btn" disabled={journey.index === 0} onClick={() => goJourneyStep(journey.index - 1, false)}>⏮</button>
                      <button
                        type="button"
                        className="inf-small-btn"
                        onClick={() => {
                          if (journey.playing) {
                            clearTimeout(journeyTimerRef.current);
                            setJourney({ ...journey, playing: false });
                          } else {
                            goJourneyStep(journey.index, true);
                          }
                        }}
                      >
                        {journey.playing ? `⏸ ${t('inf.journey.pause')}` : `▶ ${t('inf.journey.play')}`}
                      </button>
                      <button type="button" className="inf-small-btn" disabled={journey.index >= JOURNEY_STEPS.length - 1} onClick={() => goJourneyStep(journey.index + 1, false)}>⏭</button>
                      <button type="button" className="inf-small-btn" onClick={stopJourney}>✕ {t('common.close')}</button>
                    </div>
                  </>
                )}

                {quiz && !quiz.done && quizCurrent && (
                  <>
                    <div className="wc-head">
                      <b>🎯 {t('inf.quiz.title')}</b>
                      <span>{nf(quiz.index + 1)} / {nf(quiz.list.length)} · ⭐ {nf(quiz.score)}</span>
                    </div>
                    <p className="wc-question">
                      {quiz.list[quiz.index].byIdea
                        ? `${t('inf.quiz.byIdea')}: «${c(quizCurrent.idea)}»`
                        : `${t('inf.quiz.byName')}: ${lang === 'ar' ? quizCurrent.ar : quizCurrent.en}`}
                    </p>
                    <div className="wc-buttons">
                      <button
                        type="button"
                        className="inf-small-btn"
                        onClick={() => {
                          if (quiz.index + 1 >= quiz.list.length) setQuiz({ ...quiz, done: true });
                          else setQuiz({ ...quiz, index: quiz.index + 1 });
                        }}
                      >
                        {t('story.skip')}
                      </button>
                      <button type="button" className="inf-small-btn" onClick={stopQuiz}>✕ {t('common.close')}</button>
                    </div>
                  </>
                )}

                {quiz && quiz.done && (
                  <>
                    <div className="wc-head"><b>🏁 {t('inf.quiz.done')}</b></div>
                    <p className="wc-question">
                      {t('games.score', { n: `${quiz.score} / ${quiz.list.length}` })}
                    </p>
                    <div className="wc-buttons">
                      <button type="button" className="inf-small-btn accent" onClick={startWorldQuiz}>↻ {t('games.again')}</button>
                      <button type="button" className="inf-small-btn" onClick={stopQuiz}>✕ {t('common.close')}</button>
                    </div>
                  </>
                )}

                {simTour && (
                  <>
                    <div className="wc-head">
                      <b>📨 {t('inf.sim.tourTitle')}</b>
                      <span>{nf(simTour.index + 1)} / {nf(SIM_JOURNEY.length)}</span>
                    </div>
                    <h4>{lang === 'ar' ? SIM_ENTRIES[SIM_JOURNEY[simTour.index][0]].ar : SIM_ENTRIES[SIM_JOURNEY[simTour.index][0]].en}</h4>
                    <p>{c(SIM_JOURNEY[simTour.index][2])}</p>
                    <div className="wc-buttons">
                      <button type="button" className="inf-small-btn" disabled={simTour.index === 0} onClick={() => goSimTourStep(simTour.index - 1, simTour.fractions)}>⏮</button>
                      <button type="button" className="inf-small-btn" disabled={simTour.index >= SIM_JOURNEY.length - 1} onClick={() => goSimTourStep(simTour.index + 1, simTour.fractions)}>⏭</button>
                      <button type="button" className="inf-small-btn" onClick={stopSimTour}>✕ {t('common.close')}</button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Bottom Mode Switcher & Controls Dock */}
            <div className="inf-hud">
              <div className="inf-mode-switch" role="tablist" aria-label={t('inf.title')}>
                <button type="button" role="tab" aria-selected={mode === 'stack'} className={mode === 'stack' ? 'on' : ''} onClick={() => switchMode('stack')}>
                  🧱 {t('inf.mode.layers')}
                </button>
                <button type="button" role="tab" aria-selected={mode === 'scene'} className={mode === 'scene' ? 'on' : ''} onClick={() => switchMode('scene')}>
                  🖥 {t('inf.mode.computer')}
                </button>
                <button type="button" role="tab" aria-selected={mode === 'sim'} className={mode === 'sim' ? 'on' : ''} onClick={() => switchMode('sim')}>
                  🌍 {t('inf.mode.sim')}
                </button>
              </div>

              {mode !== 'sim' && (
                <>
                  <div className="inf-layer-chips">
                    {LAYERS.map((layer) => (
                      <button
                        key={layer.id}
                        type="button"
                        className={`inf-layer-chip ${!hiddenGroups.has(layer.id) ? 'on' : ''}`}
                        style={{ '--c': layer.rgb }}
                        onClick={() => toggleGroup(layer.id)}
                      >
                        {lang === 'ar' ? layer.ar : layer.en}
                      </button>
                    ))}
                  </div>
                  <div className="inf-hud-buttons">
                    <button type="button" className={`inf-small-btn ${!autoRotate ? 'off' : ''}`} onClick={() => setAutoRotate((v) => !v)}>
                      ⟳ {t('inf.ctrl.rotate')}
                    </button>
                    {mode === 'stack' && (
                      <button type="button" className="inf-small-btn" onClick={toggleExplode}>
                        ⇕ {exploded ? t('models.assemble') : t('models.explode')}
                      </button>
                    )}
                    <button type="button" className="inf-small-btn" onClick={() => zoomBy(1 / 1.15)} aria-label="Zoom out">−</button>
                    <button type="button" className="inf-small-btn" onClick={() => zoomBy(1.15)} aria-label="Zoom in">+</button>
                    <button type="button" className="inf-small-btn" onClick={resetView}>
                      ↺ {t('models.reset')}
                    </button>
                    <button type="button" className="inf-small-btn accent" onClick={startDataJourney}>
                      📨 {t('inf.journey.btn')}
                    </button>
                    <button type="button" className="inf-small-btn accent2" onClick={startWorldQuiz}>
                      🎯 {t('inf.quiz.btn')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Side Inspector Panel */}
        <aside className="viewer-side">
          <div className="card info-panel inf-info-panel" aria-live="polite">
            <div className="info-in" key={activeEntry.id || activeEntry.en}>
              <div className="row between" style={{ marginBottom: 10 }}>
                <span className="inf-layer-pill" style={{ '--c': activeEntry.rgb || '34,211,238' }}>
                  <i />
                  {c(activeEntry.layerName)}
                </span>
                {selectedId && selectedId !== 'overview' && selectedId !== 'sim-overview' && (
                  <button
                    type="button"
                    className="btn sm icon ghost"
                    onClick={() => setSelectedId(mode === 'sim' ? 'sim-overview' : null)}
                    aria-label={t('common.close')}
                  >
                    <Icon name="x" size={16} />
                  </button>
                )}
              </div>

              <h2 style={{ marginBottom: 4 }}>
                {lang === 'ar' ? activeEntry.ar : activeEntry.en}
              </h2>
              <div className="small muted" style={{ marginBottom: 12 }}>
                {lang === 'ar' ? activeEntry.en : activeEntry.ar}
              </div>

              <div className="callout tip" style={{ marginBottom: 14 }}>
                <Icon name="bolt" />
                <div>
                  <b>{t('inf.info.idea')}</b>
                  <div style={{ marginTop: 2 }}>{c(activeEntry.idea)}</div>
                </div>
              </div>

              <h4>{t('inf.info.explain')}</h4>
              <p className="muted" style={{ lineHeight: 1.65 }}>{c(activeEntry.text)}</p>

              <h4>{t('inf.info.points')}</h4>
              <ul className="facts">
                {activeEntry.points.map((pt, idx) => (
                  <li key={idx}>{c(pt)}</li>
                ))}
              </ul>

              {activeEntry.lesson && (
                <Link className="btn sm primary" to={`/learn/${activeEntry.lesson}`}>
                  <Icon name="book" size={16} />
                  {t('models.readlesson')}
                </Link>
              )}
            </div>
          </div>

          {/* Quick Component / Landmark Selector List */}
          <div className="card tight">
            <div className="row between" style={{ marginBottom: 8 }}>
              <h4 style={{ margin: 0 }}>{mode === 'sim' ? t('inf.list.landmarks') : t('models.parts')}</h4>
              <Chip>{nf(mode === 'sim' ? SIM_SPOTS.length : PARTS.length)}</Chip>
            </div>
            <div className="part-list">
              {mode === 'sim'
                ? SIM_SPOTS.map((spot) => (
                  <button
                    key={spot.id}
                    type="button"
                    className={`part-btn ${simSpot === spot.id ? 'on' : ''}`}
                    onClick={() => { stopSimTour(); focusSimSpot(spot.id); }}
                  >
                    <span>{spot.icon}</span>
                    <span>{c(spot.label)}</span>
                  </button>
                ))
                : PARTS.map((part) => {
                  const grp = LAYERS.find((l) => l.id === part.layer);
                  return (
                    <button
                      key={part.id}
                      type="button"
                      className={`part-btn ${selectedId === part.id ? 'on' : ''}`}
                      onClick={() => handlePick3D(part.id)}
                    >
                      <i className="dot" style={{ background: `rgb(${grp?.rgb || '56,189,248'})`, borderColor: 'transparent' }} />
                      <span>{lang === 'ar' ? part.ar : part.en}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
