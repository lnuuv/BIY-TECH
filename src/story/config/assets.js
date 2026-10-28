// Reference-image map. The original files are kept unchanged in /public/story/refs.
// `use` says honestly how each reference is used in the build.
const O = (en, ar) => ({ en, ar });
const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
const ref = (f) => `${base}story/refs/${f}`;

/** the school where the story takes place (shown on the building sign, title screen and request letter) */
export const SCHOOL = {
  ar: 'مدرسة الشهيد منصور كريشان الثانوية للبنين',
  en: 'Al-Shaheed Mansour Kraishan Secondary School for Boys',
};

export const ASSETS = {
  yasser: { file: ref('yasser.png'), kind: 'character', name: O('Teacher Yasser', 'الأستاذ ياسر'),
    use: O('Portrait in dialogue. The 3D figure is a stylised model built from this photo: fully bald, short, white shirt with small dark dots.', 'صورة في الحوار. والشخصية ثلاثية الأبعاد نموذج مبسّط مبني على الصورة: أصلع تماماً، قصير، قميص أبيض بنقاط داكنة صغيرة.') },
  alaa: { file: ref('alaa.png'), kind: 'character', name: O('Teacher Alaa', 'الأستاذ علاء'),
    use: O('Portrait in dialogue. 3D figure: short dark hair, light beard, blue hooded jacket.', 'صورة في الحوار. الشخصية ثلاثية الأبعاد: شعر داكن قصير، لحية خفيفة، جاكيت أزرق بقبعة.') },
  abuAnis: { file: ref('abu-anis.png'), kind: 'character', name: O('Principal Abu Anis', 'المدير أبو أنيس'),
    use: O('Portrait in dialogue. 3D figure: bald, thin, glasses, very light grey beard, dark suit with striped tie.', 'صورة في الحوار. الشخصية ثلاثية الأبعاد: أصلع، نحيف، نظارة، لحية رمادية خفيفة جداً، بدلة داكنة وربطة عنق مخططة.') },
  abdullah: { file: ref('abdullah.png'), kind: 'character', name: O('Abdullah Al-Dajjah', 'عبد الله الدعجة'),
    use: O('3D character entering the classroom holding two floor squeegees to mop the lab floor.', 'شخصية ثلاثية الأبعاد تدخل الصف وبيدها قشاطتان لشطف أرضية المختبر.') },
  classroom: { file: ref('classroom.png'), kind: 'environment', name: O('Computer lab classroom', 'صف مختبر الحاسوب'),
    use: O('Reference for walls, beige wall band, glossy cream tiles, windows with striped blinds, display, posters, door and bunting.', 'مرجع للجدران والشريط البيج والبلاط الكريمي اللامع والشبابيك مع الستائر والشاشة والملصقات والباب والزينة.') },
  cabinet: { file: ref('cabinet.jpg'), kind: 'equipment', name: O('Wall-mount network cabinet', 'كبينة شبكة جدارية'),
    use: O('Exterior reference: black wall-mount cabinet, glass door with lock, top fan, side cable entry.', 'مرجع للشكل الخارجي: كبينة جدارية سوداء، باب زجاجي بقفل، مروحة علوية، فتحة كابلات جانبية.') },
  computer: { file: ref('computer-tiny.webp'), kind: 'equipment', name: O('Tiny PC (ThinkStation P3 Tiny style)', 'جهاز Tiny (بنمط ThinkStation P3 Tiny)'),
    use: O('Exterior reference for the small black chassis with honeycomb front.', 'مرجع للشكل الخارجي للجهاز الأسود الصغير بالواجهة السداسية.') },
  workstation: { file: ref('workstation-setup.jpg'), kind: 'equipment', name: O('Workstation set-up', 'تجهيز محطة العمل'),
    use: O('Reference for how each desk looks: the Tiny PC mounted behind the monitor, black keyboard and mouse.', 'مرجع لشكل كل طاولة: جهاز Tiny مثبت خلف الشاشة، كيبورد وماوس أسود.') },
};

export const CHARACTERS = {
  yasser: { asset: 'yasser', height: 1.6, build: 'short', skin: 0xd9a888, shirt: 0xf3f3f1, shirtDots: 0x222631, trousers: 0x30343c, shoes: 0x1a1a1a, hair: null, beard: 0x6b5a50, beardAmount: 0.25, glasses: false },
  alaa: { asset: 'alaa', height: 1.74, build: 'medium', skin: 0xc79673, shirt: 0x1d4fa8, hood: true, trousers: 0x23262d, shoes: 0x2b2b2b, hair: 0x2a2018, hairThin: true, beard: 0x2a2018, beardAmount: 0.45, glasses: false },
  abuAnis: { asset: 'abuAnis', height: 1.72, build: 'thin', skin: 0xcf9f80, shirt: 0xf2f2f2, jacket: 0x1c2230, tie: 0x2c3a66, trousers: 0x1c2230, shoes: 0x111111, hair: null, beard: 0xb9b4ad, beardAmount: 0.2, glasses: true },
  abdullah: { asset: 'abdullah', height: 1.75, build: 'medium', skin: 0x6e472b, shirt: 0xf8fafc, jacket: 0x3b4932, noTie: true, trousers: 0x1b2a47, shoes: 0x141619, hair: 0x141416, beard: null, glasses: false, squeegees: true },
};
