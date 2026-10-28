// Data-driven dialogue. Edit text here; the engine (../dialogue.js) does not need changes.
// Node:   { speaker, text, gesture?, react?: {who, gesture}, choices?: [{ text, next, gesture? }], next?, end? }
// Choice text is spoken by the player-controlled character (`player`).
// Branches are allowed to differ, but every path must reach a node with `end` (the story checkpoint).
const O = (en, ar) => ({ en, ar });

export const DIALOGUES = {
  request: {
    title: O('Scene 1 — A request in the principal’s office', 'المشهد 1 — طلب في مكتب المدير'),
    player: 'yasser',
    cast: ['abuAnis', 'yasser'],
    start: 'n1',
    nodes: {
      n1: { speaker: 'abuAnis', gesture: 'wave', text: O('Come in, Mr Yasser. What brings you here?', 'تفضّل أستاذ ياسر، خير إن شاء الله؟'),
        choices: [
          { text: O('The students need a new computer lab because it has newer systems.', 'الطلاب بحاجة لمختبر حاسوب جديد لأنه فيه أنظمة أحدث.'), next: 'n2a', gesture: 'talk' },
          { text: O('There are too few computers, and the students need higher-spec machines.', 'الأجهزة قليلة والطلاب بيحتاجوا مواصفات أقوى.'), next: 'n2b', gesture: 'shrug' },
          { text: O('I have a proposal that could improve the students’ results and help them accomplish and apply more.', 'عندي اقتراح بيرفع نتائج الطلاب وممكن يخليهم ينجزوا ويطبقوا معنا أكثر.'), next: 'n2c', gesture: 'point' },
        ] },
      n2a: { speaker: 'abuAnis', gesture: 'think', text: O('That matters. But a lab needs a budget and approval from the Ministry first. What exactly do you need?', 'كلامك مهم. بس المختبر بدّه ميزانية وموافقة من الوزارة بالأول. شو بالضبط محتاجين؟'),
        choices: [
          { text: O('25 computers, including one for the teacher, plus a network, a printer, a UPS and an interactive display.', '25 جهاز للطلاب بالإضافة لجهاز للمعلم، وشبكة، وطابعة، وUPS وشاشة تفاعلية.'), next: 'n3' },
          { text: O('Just new computers; we can manage the rest.', 'بس أجهزة جديدة، والباقي بندبّره.'), next: 'n2a_x' },
        ] },
      n2a_x: { speaker: 'abuAnis', gesture: 'talk', text: O('Half a solution won’t pass. Computers without a network or power protection aren’t a lab. Let’s request it properly: 25 student PCs, one for the teacher, plus the network and peripherals.', 'نص الحل ما بيمشي. أجهزة بدون شبكة وحماية كهرباء مش مختبر. خلينا نطلبه صح: 25 جهاز للطلاب وجهاز للمعلم مع الشبكة والملحقات.'), next: 'n3' },
      n2b: { speaker: 'abuAnis', gesture: 'nod', text: O('Yes, I noticed that too. How many machines do you need?', 'آه فعلاً لاحظت هالشي، كم جهاز محتاجين؟'),
        choices: [
          { text: O('25 for the students and one for the teacher.', '25 جهاز للطلاب، وجهاز للمعلم.'), next: 'n3' },
          { text: O('At least half the class.', 'على الأقل لنص الصف.'), next: 'n2b_x' },
        ] },
      n2b_x: { speaker: 'abuAnis', gesture: 'talk', text: O('The practical assessments are individual — every student needs their own machine. We’ll ask for 25, plus one for you.', 'التقييم العملي فردي، كل طالب لازم يكون إله جهاز. رح نطلب 25، وجهاز إلك.'), next: 'n3' },
      n2c: { speaker: 'abuAnis', gesture: 'nod', text: O('Proposals about results always interest me. Go on.', 'الاقتراحات اللي بتخص النتائج دايماً بتهمني. تفضّل.'),
        choices: [
          { text: O('A fully equipped BTEC lab for teaching students, online ministry exams and practical training.', 'مختبر BTEC مجهّز بالكامل لتدريس الطلاب والامتحانات الوزارية الإلكترونية والتدريب العملي.'), next: 'n3' },
          { text: O('Students could bring their own laptops.', 'نخلّي الطلاب يجيبوا لابتوباتهم.'), next: 'n2c_x' },
        ] },
      n2c_x: { speaker: 'abuAnis', gesture: 'think', text: O('Not every student has one, and we couldn’t guarantee the same software for assessments. A school lab is the right answer.', 'مش كل الطلاب عندهم، وما بنقدر نضمن نفس البرامج للتقييمات. الحل الصحيح مختبر للمدرسة.'), next: 'n3' },
      n3: { speaker: 'abuAnis', gesture: 'talk', react: { who: 'yasser', gesture: 'nod' }, text: O('Agreed. I’ll raise an official request through the Ministry of Education’s procedures.', 'تمام. رح أرفع كتاب رسمي حسب إجراءات وزارة التربية والتعليم.'),
        choices: [
          { text: O('Thank you. I’ll prepare the list of requirements.', 'شكراً أستاذ، رح أجهّز لك قائمة الاحتياجات.'), next: 'n4' },
          { text: O('How long do you expect the approval to take?', 'قديش بتتوقع تاخد الموافقة؟'), next: 'n3_x' },
        ] },
      n3_x: { speaker: 'abuAnis', gesture: 'nod', text: O('Procedures take their time, but I’ll follow it up myself.', 'الإجراءات بتاخد وقتها، بس رح أتابعها بنفسي.'), next: 'n4' },
      n4: { speaker: 'abuAnis', gesture: 'wave', text: O('Leave it with me.', 'خلّيها عليّ.'), end: 'approval' },
    },
  },

  assign: {
    title: O('Scene 3 — The principal briefs Teacher Alaa', 'المشهد 3 — المدير يكلّف الأستاذ علاء'),
    player: 'alaa',
    cast: ['abuAnis', 'alaa'],
    start: 'm1',
    nodes: {
      m1: { speaker: 'abuAnis', gesture: 'talk', text: O('Mr Alaa, the BTEC lab request has been approved. I want you to take charge of preparing it, start to finish.', 'أستاذ علاء، إجت الموافقة على مختبر الـ BTEC. بدّي إياك تستلم تجهيزه من الألف للياء.'),
        choices: [
          { text: O('Of course. What exactly is required?', 'أبشر أستاذ، شو المطلوب بالضبط؟'), next: 'm2', gesture: 'nod' },
          { text: O('Happy to. Who will help with the installation work?', 'من عيوني. بس مين رح يساعدني بالتمديدات؟'), next: 'm1_x', gesture: 'think' },
          { text: O('I’m busy maintaining the other labs—and that’s not even counting my morning cup of tea…', 'الوقت ضيق مع صيانة المختبرات الثانية، هاض غير كاسة الشاي على الصبح يا باي…'), next: 'm1_y', gesture: 'shrug' },
        ] },
      m1_x: { speaker: 'abuAnis', gesture: 'talk', text: O('An electrical engineer will handle the electrical work. The computers and the network are yours.', 'أي شغل كهرباء بيعمله مهندس الكهرباء. الأجهزة والشبكة عليك.'), next: 'm2' },
      m1_y: { speaker: 'abuAnis', gesture: 'nod', text: O('I’ll give you four days off. The lab is a priority.', 'رح أعطيك إجازة أربعة أيام. المختبر أولوية.'), next: 'm2' },
      m2: { speaker: 'abuAnis', gesture: 'point', text: O('25 student workstations, a teacher workstation, the network cabinet, a printer, a UPS and the interactive display. The empty classroom is ready for you.', '25 جهاز للطلاب، جهاز للمعلم، كبينة الشبكة، طابعة، UPS وشاشة تفاعلية. والصف الفاضي جاهز إلك.'),
        choices: [
          { text: O('I’ll arrange the desks first, then build the teacher PC.', 'رح أبلّش بترتيب الطاولات، بعدين بجمّع جهاز المعلم.'), next: 'm3' },
          { text: O('Are these the Tiny PCs that mount behind the monitors?', 'الأجهزة من نوع Tiny اللي بتتركب بظهر الشاشات؟'), next: 'm2_x' },
        ] },
      m2_x: { speaker: 'abuAnis', gesture: 'nod', text: O('Ah, I recognize this little thing—it’s tiny.', 'آه، عرفته هاض الفصعون الصغير.'), next: 'm3' },
      m3: { speaker: 'abuAnis', gesture: 'wave', react: { who: 'alaa', gesture: 'nod' }, text: O('Good luck. I’d like a report when you’re done.', 'توكّل على الله، وبدّي تقرير لما تخلص.'),
        choices: [{ text: O('I’m heading to the classroom now.', 'أبشر ولو، رايح هلّأ على الصف.'), next: 'm4' }] },
      m4: { speaker: 'alaa', gesture: 'wave', text: O('I’ll see you when you’re done.', 'بشوفك بس تخلص.'), end: 'classroom' },
    },
  },

  finale: {
    title: O('Final scene — The lab is ready', 'المشهد الأخير — المختبر جاهز'),
    player: 'alaa',
    cast: ['alaa', 'abuAnis', 'yasser'],
    start: 'e1',
    nodes: {
      e1: { speaker: 'alaa', gesture: 'point', text: O('Mr Abu Anis, Mr Yasser — the lab is ready, and every check has passed.', 'أستاذ أبو أنيس، أستاذ ياسر، المختبر جاهز وكل الفحوصات ناجحة.'), next: 'e2' },
      e2: { speaker: 'abuAnis', gesture: 'nod', react: { who: 'yasser', gesture: 'nod' }, text: O('Excellent. Let’s see it.', 'ما شاء الله! خلّينا نشوف.'), next: 'e3' },
      e3: { speaker: 'yasser', gesture: 'point', text: O('Twenty-five computers, and they’re all on the network? Just checking that nothing has been missed.', '25 جهاز، وكلهم على الشبكة؟ انتبه أنا ما بيخفى عليّ إشي!'),
        choices: [
          { text: O('Yes. Every desk has a numbered outlet that matches a port in the cabinet.', 'آه، كل طاولة إلها منفذ مرقّم بيطابق منفذ بالكبينة.'), next: 'e4' },
          { text: O('Try it yourself — print from any machine.', 'جرّب بنفسك، اطبع ورقة من أي جهاز.'), next: 'e3_x' },
        ] },
      e3_x: { speaker: 'yasser', gesture: 'wave', text: O('…and the page is out. Well done!', 'والله طبعت وطلعت الورقة. يعطيك العافية!'), next: 'e4' },
      e4: { speaker: 'abuAnis', gesture: 'think', text: O('And if the power goes off?', 'وإذا قطعت الكهرباء؟'),
        choices: [
          { text: O('The UPS behind the door keeps the network up long enough for a safe shutdown.', 'الـ UPS اللي ورا الباب بيبقي الشبكة شغالة وقت كافي للإطفاء الآمن.'), next: 'e5' },
          { text: O('Come on, sir, of course I haven’t forgotten the UPS—it’s right behind the door.', 'أفا عليك يا مديرنا، أكيد ما نسيت الـ UPS، هيو ورا الباب.'), next: 'e5' },
        ] },
      e5: { speaker: 'yasser', gesture: 'wave', text: O('Let me call Abdullah Al-Dajjah to mop the classroom so I can start teaching.', 'خليني أنادي عبد الله الدعجة يشطف الصف عشان أبلّش شرح.'), next: 'e6' },
      e6: { speaker: 'abuAnis', gesture: 'talk', react: { who: 'alaa', gesture: 'nod' }, text: O('Your work is excellent. I’ll give you two days off.', 'والله شغلك مرتّب، خلص خليتلك إياهم يومين عطلة.'), end: 'credits' },
    },
  },
};
