import {partnerText,type PartnerLocale} from "./partner/Locale";
import type {EquipmentDomain,EquipmentFamilyId} from "./equipment-r8-data";
import type {R9Program} from "./equipment-r9-programs";
/** Source-authoritative 22 domains. Translation changes copy only, never identifiers,
 * native catalogue availability, product prices, category keys or project identity. */
type D={name:string;short:string;pain:string;solution:string;examples:[string,string,string];choices:[string,string,string]};
const EN:Record<string,D>={
"welcome-guide":{name:"Welcome & getting started",short:"Understand references, offers and how to prepare a project.",pain:"School managers lose time deciphering references and comparing incompatible formats.",solution:"A clear guide to categories, variants and preparation before requesting an offer.",examples:["How to read the catalogue","Reference structure","Prepare your requirements"],choices:["Explore the school worlds","Prepare an enquiry","Compare solutions"]},
"photo-booth":{name:"Photo booths & memory corners",short:"Photo backdrops and family-friendly memory spaces.",pain:"School celebrations pass without consistent imagery or memorable identity.",solution:"A recognizable photo corner for meetings, celebrations and keepsakes.",examples:["Welcome backdrop","Seasonal photo corner","Memory station"],choices:["Open day","School celebration","Year-end ceremony"]},
"large-format":{name:"Banners, signage & large formats",short:"Large-format visuals for visibility, events and campaigns.",pain:"Facades and events lack legibility and use inconsistent designs.",solution:"Coordinated visuals sized for the viewing distance and mounting surface.",examples:["Outdoor banners","Event signage","Large panels"],choices:["Exterior facade","Entrance gate","Outdoor event"]},
"event-branding":{name:"Event branding & ceremonies",short:"Decor, invitations and visual identity for school events.",pain:"Each event is prepared in a rush without a consistent school identity.",solution:"Create a recognizable visual experience from the entrance to the takeaway gift.",examples:["Invitations and signage","Stage branding","Ceremony materials"],choices:["School performance","Family day","Annual ceremony"]},
"class-visuals":{name:"Classroom visuals & learning spaces",short:"Educational displays, classroom decoration and learning zones.",pain:"Classroom references are scattered, overloaded or hard for children to understand.",solution:"Organize visual environments by age, language and learning purpose.",examples:["Zone-based displays","Educational wall panels","Learning cues"],choices:["Learning wall","Reading corner","Independent activity area"]},
"printables":{name:"Printables & educational kits",short:"Ready-to-use worksheets, printable tools and learning activities.",pain:"Teams search for new resources every day without continuity between sessions.",solution:"Structured kits organized by learning objective, age, difficulty and pace.",examples:["Pre-writing and tracing","Coloring and creativity","Themed activities"],choices:["Writing and tracing","Mathematics","Creativity and coloring"]},
"flashcards":{name:"Flashcards & learning cards",short:"Themed educational cards for languages, numbers, emotions and routines.",pain:"Learning content varies unnecessarily between classrooms and age groups.",solution:"Coherent card collections for hands-on exploration and conversation.",examples:["Letters and numbers","Emotions and language","Discovering the world"],choices:["Alphabet and languages","Numbers","Emotions and the world"]},
"parent-communication":{name:"Parent communication",short:"Messages, newsletters, displays and trust-building materials.",pain:"Families receive fragmented updates and do not see classroom progress.",solution:"Coherent formats to welcome, inform and showcase children's learning.",examples:["Parent updates","Newsletters","Information notices"],choices:["Before enrolment","During the school year","Progress and reports"]},
"reception":{name:"Reception, signage & school experience",short:"Welcome boards, wayfinding and professional signage.",pain:"Visitors cannot navigate easily and the school misses an opportunity to build trust.",solution:"Connect arrival, circulation and contact points within one identity.",examples:["Welcome board","Classroom signs","Interior directions"],choices:["Gate and exterior","Family reception","Internal wayfinding"]},
"staff-tools":{name:"Staff & team tools",short:"Planners, checklists, follow-up forms and professional tools.",pain:"Instructions are passed on verbally, making staff handovers inconsistent.",solution:"Simple, shareable tools suited to real working practices.",examples:["Team planning","Opening checklists","Follow-up sheets"],choices:["Weekly planner","Shift handover","Learning follow-up"]},
"child-identity":{name:"Child identity & belonging",short:"Badges, labels, locker signs and classroom recognition.",pain:"Children's belongings, spaces and achievements lack personal identification.",solution:"Visual cues that help every child find their place and creations.",examples:["Personal labels","Badges and lockers","Classroom recognition"],choices:["Locker label","Personal badge","Achievement display"]},
"graduation":{name:"Graduation & year-end ceremonies",short:"Certificates, gowns, decor and graduation keepsakes.",pain:"An important ceremony depends on disconnected purchases and last-minute planning.",solution:"A coordinated graduation experience from stage to keepsake.",examples:["Year-end diplomas","Gowns and accessories","Stage and souvenirs"],choices:["Diploma and recognition","Graduation stage","Memory and ceremony"]},
"seasonal":{name:"Seasonal decor & school occasions",short:"Seasonal decorations and thematic school-day materials.",pain:"Seasonal decorating takes too much time and lacks a repeatable approach.",solution:"Reusable or thematic materials adapted to school spaces.",examples:["Season calendar","Themed decor","Celebration displays"],choices:["Autumn and back-to-school","Winter and holidays","Spring and summer"]},
"safety":{name:"Safety, hygiene & visual reminders",short:"Hygiene, safety and daily routine displays.",pain:"Important instructions are hard to see or disconnected from actual movement.",solution:"Place the right reminders at the right points of use according to your procedures.",examples:["Hygiene reminders","Caution zones","Safety routines"],choices:["Hand hygiene","Circulation and exits","Daily routines"]},
"montessori":{name:"Montessori-inspired & hands-on learning",short:"Sensory tools, fine-motor activities and active-learning supports.",pain:"Learning stations lack appropriate tools for independent manipulation.",solution:"Set up spaces that support sorting, exploration, movement and repetition.",examples:["Sensory exploration","Shape sorting","Fine-motor skills"],choices:["Sort and match","Fine-motor movements","Explore textures"]},
"labelling":{name:"Classroom organization & labels",short:"Labels, learning areas and visual storage systems.",pain:"Equipment circulates poorly and the purpose of classroom areas becomes unclear.",solution:"Identified zones support tidiness, navigation and independence.",examples:["Storage labels","Visual zoning","Box identification"],choices:["Lockers and belongings","Learning resource bins","Activity corners"]},
"open-day":{name:"Open days, admissions & enrolment",short:"Welcome and enrolment-day kits and visitor communication.",pain:"Visitors cannot locate the admission route or essential information.",solution:"Plan a complete introduction to the school from arrival to follow-up.",examples:["Open-day kits","Admission documents","Visitor journey displays"],choices:["Before the visit","During reception","After the meeting"]},
"certificates":{name:"Certificates, rewards & recognition",short:"Awards, diplomas, badges and recognition materials.",pain:"Children's efforts and achievements are rarely recognized consistently.",solution:"Celebrate progress with materials suited to everyday classroom life.",examples:["Illustrated certificates","Learning rewards","Customizable diplomas"],choices:["Progress certificate","Effort award","Project recognition"]},
"activity-boxes":{name:"Mini-event activity boxes",short:"Ready-to-prepare activity boxes for themed school days.",pain:"Preparing small events involves too many isolated materials and purchases.",solution:"Bring complementary activities together around one clear event.",examples:["Creative boxes","Themed workshops","Activity kits"],choices:["Creative workshop","Exploration game","Event activity"]},
"partner-branding":{name:"Premium partner branding",short:"Partner identity packs, plaques and professional trust materials.",pain:"The school's identity looks inconsistent across different materials.",solution:"Create a common signature for staff, premises and communication.",examples:["Partner kits","Plaques and signs","Trust-building materials"],choices:["Staff uniforms","Premium signage","Partner kits"]},
"personalization":{name:"Customization, orders & lead times",short:"Customized options, availability and fulfillment questions.",pain:"Conversations with multiple suppliers delay decisions and create errors.",solution:"Centralize requirements and confirm variants and deadlines against real offers.",examples:["Formats and colors","Proof approval","Terms and timelines"],choices:["Format and finishing","Branding and colors","Lead times and delivery"]},
"technical":{name:"Technical references & glossary",short:"Materials, formats, technical variants and preparation notes.",pain:"Technical terminology makes products difficult to compare accurately.",solution:"Share a glossary before requesting production to qualify needs clearly.",examples:["Paper and finishing","Technical formats","Preparation requirements"],choices:["Dimensions and scale","Materials and finishing","Installation and preparation"]}
};
const AR:Record<string,D>={
"welcome-guide":{name:"مرحباً ودليل الاستخدام",short:"فهم المراجع والعروض وكيفية تحضير المشروع.",pain:"يهدر مسؤولو المؤسسات وقتاً في تفسير المراجع ومقارنة صيغ غير متكافئة.",solution:"دليل واضح للفئات والخيارات والخطوات قبل تقديم الطلب.",examples:["طريقة قراءة الكتالوج","بنية المراجع","تحضير الاحتياجات"],choices:["استكشاف المجالات","تحضير طلب","مقارنة الحلول"]},
"photo-booth":{name:"أركان التصوير والذكريات",short:"خلفيات تصوير ومساحات تذكارية للأسر والأطفال.",pain:"تمر المناسبات دون صور منسجمة تعكس هوية المؤسسة.",solution:"ركن تصوير مميز للقاءات والاحتفالات والذكريات.",examples:["خلفية ترحيب","ركن تصوير موسمي","مساحة للذكريات"],choices:["الأبواب المفتوحة","احتفال المدرسة","نهاية السنة"]},
"large-format":{name:"اللافتات والطباعات الكبيرة",short:"مواد بصرية كبيرة للتعريف بالمؤسسة والفعاليات.",pain:"تفتقر الواجهات والفعاليات إلى الوضوح أو إلى تصميم موحد.",solution:"تصاميم متناسقة بأحجام تلائم مسافة الرؤية ومكان التثبيت.",examples:["لافتات خارجية","لافتات الفعاليات","لوحات كبيرة"],choices:["الواجهة الخارجية","المدخل والبوابة","فعالية خارجية"]},
"event-branding":{name:"هوية الفعاليات والحفلات",short:"ديكورات ودعوات وهوية بصرية للمناسبات المدرسية.",pain:"يتم تحضير الفعاليات على عجل دون هوية بصرية ثابتة.",solution:"تجربة متكاملة من المدخل حتى الهدية التذكارية.",examples:["الدعوات واللافتات","تزيين المنصة","مواد الحفل"],choices:["عرض مدرسي","يوم الأسرة","الحفل السنوي"]},
"class-visuals":{name:"التصاميم البصرية للقاعات",short:"لوحات تعليمية وديكور للقاعات وأركان التعلم.",pain:"تكون الإشارات التعليمية مشتتة أو مزدحمة أو صعبة الفهم.",solution:"بيئة بصرية منظمة حسب الأعمار واللغة وأهداف التعلم.",examples:["لوحات حسب الركن","لوحات تربوية","إشارات التعلم"],choices:["جدار التعلم","ركن القراءة","مساحة الاستقلالية"]},
"printables":{name:"المطبوعات والحقائب التعليمية",short:"أوراق وأنشطة تعليمية جاهزة للاستخدام.",pain:"تبحث الفرق يومياً عن موارد دون استمرارية بين الحصص.",solution:"حقائب منظمة حسب الهدف والعمر والصعوبة والإيقاع.",examples:["الكتابة الأولية والتتبع","التلوين والإبداع","أنشطة موضوعاتية"],choices:["الكتابة والتتبع","الرياضيات","الإبداع والتلوين"]},
"flashcards":{name:"البطاقات التعليمية",short:"بطاقات للغات والأرقام والمشاعر والروتين.",pain:"تختلف مواد التعلم كثيراً بين القاعات والفئات العمرية.",solution:"مجموعات بطاقات متناسقة للاستكشاف والحوار.",examples:["الحروف والأرقام","المشاعر واللغة","اكتشاف العالم"],choices:["الأبجدية واللغات","الأرقام","المشاعر والعالم"]},
"parent-communication":{name:"التواصل مع الأسر",short:"رسائل ونشرات ولوحات تعزز الثقة.",pain:"تصل للأسر معلومات متفرقة ولا تظهر إنجازات الفصل بوضوح.",solution:"مواد متناسقة للترحيب والإخبار وإبراز التعلم.",examples:["رسائل للأسر","نشرات إخبارية","إعلانات مهمة"],choices:["قبل التسجيل","خلال السنة","التقدم والتقييم"]},
"reception":{name:"الاستقبال واللافتات وتجربة المؤسسة",short:"لوحات ترحيب وتوجيه ولافتات احترافية.",pain:"يصعب على الزوار التنقل وتفوت المؤسسة فرصة بناء الثقة.",solution:"ربط المدخل ومسارات التنقل ونقاط التواصل بهوية واحدة.",examples:["لوحة ترحيب","لافتات القاعات","التوجيه الداخلي"],choices:["البوابة والواجهة","استقبال الأسر","التوجيه الداخلي"]},
"staff-tools":{name:"أدوات الفريق التربوي",short:"مخططات وقوائم متابعة وأدوات مهنية.",pain:"تنتقل التعليمات شفهياً وتصبح عملية تسليم المهام غير مستقرة.",solution:"أدوات بسيطة قابلة للمشاركة تلائم العمل الحقيقي.",examples:["جدول الفريق","قوائم الافتتاح","بطاقات المتابعة"],choices:["الجدول الأسبوعي","تسليم المهام","المتابعة التربوية"]},
"child-identity":{name:"هوية الطفل والانتماء",short:"شارات وملصقات وخزائن وتقدير الإنجازات.",pain:"تفتقر أغراض الأطفال ومساحاتهم وإنجازاتهم إلى علامات شخصية.",solution:"إشارات بصرية تساعد كل طفل في التعرف على مكانه.",examples:["ملصقات شخصية","شارات وخزائن","تكريم داخل الفصل"],choices:["ملصق الخزانة","شارة شخصية","لوحة الإنجازات"]},
"graduation":{name:"التخرج وحفلات نهاية السنة",short:"شهادات وأزياء وديكورات وتذكارات التخرج.",pain:"تعتمد المناسبة على مشتريات متفرقة وتحضير متأخر.",solution:"تجربة تخرج متناسقة من المنصة إلى الذكرى.",examples:["شهادات نهاية السنة","الأزياء والإكسسوارات","المنصة والذكريات"],choices:["الشهادة والتكريم","منصة التخرج","الذكرى والحفل"]},
"seasonal":{name:"الديكورات الموسمية والمناسبات",short:"ديكورات موسمية ومواد لأيام مدرسية خاصة.",pain:"يستهلك التحضير الموسمي وقتاً دون طريقة قابلة للتكرار.",solution:"مواد قابلة لإعادة الاستخدام أو التكييف مع المساحات.",examples:["تقويم الفصول","ديكورات موضوعاتية","لوحات الاحتفالات"],choices:["الخريف والدخول المدرسي","الشتاء والأعياد","الربيع والصيف"]},
"safety":{name:"السلامة والنظافة والإرشادات البصرية",short:"إشارات للنظافة والسلامة وروتين اليوم.",pain:"التعليمات المهمة غير مرئية أو لا تناسب مسارات التنقل.",solution:"وضع الإرشادات في نقاط استخدامها وفق إجراءات المؤسسة.",examples:["إرشادات النظافة","مناطق الانتباه","روتين السلامة"],choices:["نظافة اليدين","الممرات والمخارج","الروتين اليومي"]},
"montessori":{name:"التعلم المستوحى من مونتيسوري",short:"أدوات حسية وحركية للتعلم النشط.",pain:"تفتقر ورش التعلم إلى مواد للاستكشاف المستقل.",solution:"فضاءات تساعد على الفرز والاستكشاف والحركة والتكرار.",examples:["الاستكشاف الحسي","فرز الأشكال","المهارات الحركية الدقيقة"],choices:["الفرز والمطابقة","الحركة الدقيقة","استكشاف الملمس"]},
"labelling":{name:"تنظيم القاعات والملصقات",short:"ملصقات وأركان تعلم وأنظمة ترتيب بصرية.",pain:"تضيع المواد وتصبح وظائف الأركان غير واضحة.",solution:"أركان محددة تعزز الترتيب والتنقل والاستقلالية.",examples:["ملصقات التخزين","تقسيم بصري","تعريف الصناديق"],choices:["الخزائن والأغراض","صناديق الموارد","أركان الأنشطة"]},
"open-day":{name:"الأبواب المفتوحة والتسجيل",short:"أدوات الاستقبال والتسجيل والتواصل مع الزوار.",pain:"لا يجد الزوار مسار التسجيل أو المعلومات الأساسية.",solution:"تخطيط تجربة كاملة من الاستقبال إلى المتابعة.",examples:["حقائب الأبواب المفتوحة","وثائق التسجيل","لوحات مسار الزيارة"],choices:["قبل الزيارة","أثناء الاستقبال","بعد اللقاء"]},
"certificates":{name:"الشهادات والمكافآت والتقدير",short:"شهادات ودبلومات وشارات التكريم.",pain:"نادراً ما يتم الاعتراف بجهود الأطفال وإنجازاتهم بشكل متناسق.",solution:"الاحتفاء بالتقدم بوسائل تلائم الحياة داخل القاعات.",examples:["شهادات مصورة","مكافآت تربوية","دبلومات قابلة للتخصيص"],choices:["شهادة التقدم","جائزة الجهد","تكريم المشروع"]},
"activity-boxes":{name:"صناديق أنشطة المناسبات",short:"حقائب أنشطة جاهزة لأيام مدرسية موضوعاتية.",pain:"يحتاج تحضير المناسبات الصغيرة إلى مواد ومشتريات متفرقة.",solution:"جمع أنشطة متكاملة حول فعالية واضحة.",examples:["صناديق إبداعية","ورش موضوعاتية","حقائب نشاط"],choices:["ورشة إبداعية","لعبة استكشاف","نشاط فعالية"]},
"partner-branding":{name:"الهوية المميزة للشركاء",short:"حقائب هوية ولوحات ومواد تبني الثقة.",pain:"تبدو هوية المدرسة غير متناسقة عبر المواد المختلفة.",solution:"هوية مشتركة للفريق والمباني والتواصل.",examples:["حقائب الشركاء","اللوحات واللافتات","مواد تعزيز الثقة"],choices:["زي الفريق","لافتات مميزة","حقائب الشركاء"]},
"personalization":{name:"التخصيص والطلبات والمواعيد",short:"خيارات مخصصة وتوافر المنتجات وشروط الإنجاز.",pain:"تؤخر محادثات الموردين المتعددين القرارات وتسبب الأخطاء.",solution:"تجميع الاحتياجات وتأكيد الخيارات والمواعيد وفق العروض الحقيقية.",examples:["الأحجام والألوان","اعتماد التصاميم","الشروط والمواعيد"],choices:["الحجم والتشطيب","الهوية والألوان","المواعيد والتوصيل"]},
"technical":{name:"المراجع التقنية والمصطلحات",short:"المواد والأحجام والخيارات التقنية والتحضير.",pain:"تجعل المصطلحات التقنية مقارنة المنتجات صعبة.",solution:"توحيد المصطلحات قبل طلب الإنتاج لتحديد الحاجة بدقة.",examples:["الورق والتشطيب","الأحجام التقنية","متطلبات التحضير"],choices:["الأبعاد والمقاييس","المواد والتشطيبات","التركيب والتحضير"]}
};
const FAMILY:Record<EquipmentFamilyId,{en:[string,string,string];ar:[string,string,string]}>={
 welcome:{en:["Welcome & signage","Attract, welcome and guide families professionally.","First impressions, visibility and enrolment"],ar:["الاستقبال واللافتات","اجذبوا الأسر ورحبوا بها ووجهوها باحترافية.","الانطباع الأول والوضوح والتسجيل"]},
 learning:{en:["Learning environments","Spaces and tools that encourage discovery.","Educational visuals, hands-on learning and independence"],ar:["فضاءات التعلم","فضاءات وأدوات تشجع على الاستكشاف.","الصور التعليمية والتعلم العملي والاستقلالية"]},
 parents:{en:["Family confidence","Clear, regular communication that builds trust.","Communication, progress and recognition"],ar:["ثقة الأسر","تواصل واضح ومستمر يعزز الثقة.","التواصل والتقدم والتقدير"]},
 operations:{en:["School operations","Organize, plan and support daily work.","Teams, documents, procedures and cues"],ar:["تنظيم المؤسسة","نظموا عملكم اليومي وخططوا له.","الفرق والوثائق والإجراءات"]},
 routines:{en:["Everyday routines","Simpler routines supported by practical tools.","Hygiene, organization and activities"],ar:["الروتين اليومي","روتين أبسط تدعمه أدوات عملية.","النظافة والتنظيم والأنشطة"]},
 identity:{en:["Memorable school identity","Strong identity and meaningful school experiences.","Ceremonies, branding and celebrations"],ar:["هوية مدرسية راسخة","هوية قوية وتجارب مدرسية لا تنسى.","الحفلات والهوية والمناسبات"]}
};
export function localDomain(domain:EquipmentDomain,locale:PartnerLocale):EquipmentDomain{
 if(locale==="fr")return domain;
 const t=(locale==="en"?EN:AR)[domain.id];
 return t?{...domain,name:t.name,short:t.short,pain:t.pain,solution:t.solution,examples:[...t.examples]}:domain;
}
export function localFamilies<T extends {id:EquipmentFamilyId;title:string;subtitle:string;hint:string}>(items:readonly T[],locale:PartnerLocale):T[]{
 if(locale==="fr")return [...items];
 return items.map(item=>{const [title,subtitle,hint]=FAMILY[item.id][locale];return {...item,title,subtitle,hint}});
}
export function localProgram(program:R9Program,locale:PartnerLocale):R9Program{
 if(locale==="fr")return program;
 const d=(locale==="en"?EN:AR)[program.id];
 const group=(locale==="en"?"PROFESSIONAL SCHOOL EXPERIENCE":"تجربة مدرسية مهنية");
 if(!d)return program;
 return {...program,eyebrow:group,headline:d.name,promise:d.short,scenario:d.pain,
  priority:locale==="en"?"Explore the professional options":"استكشفوا الخيارات المهنية",
  choices:d.choices,criteria:d.examples,
  value:d.solution,interaction:locale==="en"?"Interactive professional exploration":"استكشاف مهني تفاعلي",
  cta:locale==="en"?"Explore related solutions":"استكشفوا الحلول المرتبطة"};
}
export function localStory<T extends {id:string;eyebrow:string;title:string;sub:string;badge:string;benefit:string;caption:string}>(story:T,locale:PartnerLocale):T{
 if(locale==="fr")return story;
 const t=STORY[story.id]?.[locale];return t?({...story,eyebrow:t[0],title:t[1],sub:t[2],badge:t[3],benefit:t[4],caption:t[5]} as T):story;
}
const STORY:Record<string,{en:[string,string,string,string,string,string];ar:[string,string,string,string,string,string]}>={
 "school-opening":{en:["REAL USE CASE · OPENING","Opening a new school?","Build trust before the first school day.","A STRONG FIRST IMPRESSION","Clear arrival, organized spaces and professional communication.","From the entrance to meeting families"],ar:["حالة استخدام · افتتاح","هل تفتحون مدرسة جديدة؟","ابنوا الثقة قبل أول يوم دراسي.","انطباع أول قوي","استقبال واضح وفضاءات منظمة وتواصل مهني.","من المدخل حتى لقاء الأسر"]},
 "new-class":{en:["INSPIRATION · NEW CLASSROOM","What if every classroom corner encouraged learning?","Make displays, activities and organization work together.","LEARNING THROUGH DISCOVERY","Coherent cues for hands-on learning.","Spaces designed around use, not isolated purchases"],ar:["إلهام · قاعة جديدة","ماذا لو شجع كل ركن على التعلم؟","اجمعوا اللوحات والأنشطة والتنظيم في بيئة واحدة.","التعلم بالاكتشاف","إشارات متناسقة للتعلم العملي.","قاعات منظمة بحسب الاستخدام"]},
 "team-rhythm":{en:["WORKFLOW · ORGANIZATION","A coordinated team, even on busy days.","Make handovers, planning and storage easy to understand.","SIMPLIFY DAILY WORK","Less searching and clearer shared information.","Useful tools where teams need them"],ar:["حلول عملية · تنظيم","فريق منظم حتى في الأيام المزدحمة.","اجعلوا تسليم المهام والتخطيط والتخزين أكثر وضوحاً.","تبسيط العمل اليومي","بحث أقل ومعلومات مشتركة أوضح.","أدوات مناسبة في مكانها"]},
 "school-moments":{en:["IDEAS · SCHOOL EVENTS","Memorable school occasions that reflect your identity.","Coordinate stage design, certificates and keepsakes.","CREATE MEMORIES","One coherent identity from invitations to keepsakes.","Experiences worth celebrating"],ar:["أفكار · مناسبات مدرسية","مناسبات لا تنسى تعكس هوية مؤسستكم.","نسقوا الديكورات والشهادات والتذكارات.","صناعة الذكريات","هوية واحدة من الدعوات إلى التذكارات.","تجارب تستحق الاحتفال"]}
};
export function localGoal<T extends {id:string;title:string;subtitle:string}>(goal:T,locale:PartnerLocale):T{
 if(locale==="fr")return goal;const item=GOAL[goal.id]?.[locale];return item?({...goal,title:item[0],subtitle:item[1]} as T):goal;
}
const GOAL:Record<string,{en:[string,string];ar:[string,string]}>={
 opening:{en:["I'm opening a school","Welcome, first classrooms and essential tools"],ar:["أفتح مؤسسة جديدة","الاستقبال والقاعات الأولى والأدوات الأساسية"]},
 modernize:{en:["I'm upgrading my spaces","Ambience, learning displays and visual cues"],ar:["أجدد فضاءات المؤسسة","الأجواء واللوحات التعليمية والإشارات"]},
 team:{en:["I want to organize my team","Planning, handovers, routines and storage"],ar:["أريد تنظيم فريقي","التخطيط وتسليم المهام والروتين والتخزين"]},
 enrolment:{en:["I'm preparing enrolment","Clear visits, useful information and follow-up"],ar:["أحضر للتسجيل","زيارات واضحة ومعلومات مفيدة ومتابعة"]},
 event:{en:["I'm planning an event","Stage design, memories and school identity"],ar:["أحضر مناسبة","المنصة والذكريات وهوية المؤسسة"]}
};
export function localTheme<T extends {id:EquipmentFamilyId;label:string;tagline:string;story:string;outcome:string;badge:string}>(theme:T,locale:PartnerLocale):T{
 if(locale==="fr")return theme;
 const d=THEME[theme.id][locale];
 return {...theme,label:d[0],tagline:d[1],story:d[2],outcome:d[3],badge:d[4]} as T;
}
const THEME:Record<EquipmentFamilyId,{en:[string,string,string,string,string];ar:[string,string,string,string,string]}>={
 welcome:{en:["Welcome","Your school tells its story at first sight.","From the gate to the classroom: a welcoming and recognizable journey.","A first impression worth exploring.","VISITS & ADMISSIONS"],ar:["الاستقبال","تروي مؤسستكم قصتها منذ اللقاء الأول.","من البوابة إلى القاعة: تجربة ترحيب واضحة ومميزة.","انطباع أول يدعو للاكتشاف.","الزيارات والتسجيل"]},
 learning:{en:["Learning","An environment designed to learn through discovery.","Spaces, tools and materials serving children's needs and educators' work.","Stimulating and organized learning experiences.","ACTIVE LEARNING"],ar:["التعلم","بيئة تشجع التعلم بالاكتشاف.","فضاءات وأدوات ومواد تلبي حاجات الأطفال والمربيات.","تجارب تعليمية محفزة ومنظمة.","التعلم النشط"]},
 parents:{en:["Families","Trust that grows through everyday communication.","From enrolment to progress, share meaningful moments with families.","Informed, involved and reassured families.","FAMILY CONNECTION"],ar:["الأسر","ثقة تنمو بالتواصل اليومي.","من التسجيل إلى التقدم، شاركوا الأسر اللحظات المهمة.","أسر مطلعة ومشاركة ومطمئنة.","التواصل مع الأسر"]},
 operations:{en:["Teams","Clarity in every professional routine.","Useful tools for classrooms, handovers and preparation.","Organization that everyone can understand and follow.","TEAM OPERATIONS"],ar:["الفريق","وضوح في كل خطوة مهنية.","أدوات مناسبة للقاعات وتسليم المهام والتحضير.","تنظيم واضح ومشترك.","تنظيم الفريق"]},
 routines:{en:["Everyday life","Small routines make a lasting difference.","Make everyday moments calmer and easier to prepare.","Clear cues and practical daily activities.","ROUTINES & ACTIVITIES"],ar:["الحياة اليومية","الروتين البسيط يصنع فرقاً كبيراً.","اجعلوا اللحظات اليومية أهدأ وأسهل تحضيراً.","إشارات واضحة وأنشطة عملية.","الروتين والأنشطة"]},
 identity:{en:["Identity","A school families will remember.","Celebrate achievements, events and the school's distinctive style.","A living identity for important moments.","BRANDING & EVENTS"],ar:["الهوية","مؤسسة تتذكرها الأسر.","احتفوا بالإنجازات والمناسبات والهوية المميزة.","هوية حية للمناسبات المهمة.","الهوية والفعاليات"]}
};
export function localHotspot<T extends {id:string;label:string;summary:string}>(hotspot:T,locale:PartnerLocale):T{
 if(locale==="fr")return hotspot;const d=HOTSPOT[hotspot.id]?.[locale];return d?({...hotspot,label:d[0],summary:d[1]} as T):hotspot;
}
const HOTSPOT:Record<string,{en:[string,string];ar:[string,string]}>={
 reception:{en:["Entrance","Set the tone from the first step."],ar:["المدخل","حددوا الانطباع منذ الوصول."]},
 "class-visuals":{en:["Classroom","A space that encourages discovery."],ar:["القاعة","فضاء يشجع الاستكشاف."]},
 "parent-communication":{en:["Families","Communication that builds trust."],ar:["الأسر","تواصل يعزز الثقة."]},
 "staff-tools":{en:["Team","Organization that works in practice."],ar:["الفريق","تنظيم يعمل على أرض الواقع."]},
 "activity-boxes":{en:["Activities","Prepare the small moments."],ar:["الأنشطة","التحضير للحظات الصغيرة."]},
 graduation:{en:["Milestones","An identity that lasts."],ar:["المناسبات","هوية تدوم."]}
};
export function localDomainLabel<T extends {headline:string;reassurance:string;application:string}>(id:string,fr:T,locale:PartnerLocale):T{
 if(locale==="fr")return fr;
 const d=(locale==="en"?EN:AR)[id];
 if(!d)return fr;
 return {headline:d.name,reassurance:d.short,application:d.examples[0]} as T;
}

import {equipmentR9Brief,type R9State} from "./equipment-r9-programs";
import {EQUIPMENT_DOMAINS} from "./equipment-r8-data";
const NEEDS:Record<string,readonly [string,string]>={
 "Ouverture d’établissement":["New school opening","افتتاح مؤسسة"],"Rénovation & modernisation":["Renovation & modernization","التجديد والتحديث"],
 "Nouvelle classe":["New classroom","قاعة جديدة"],"Organisation de l’équipe":["Team organization","تنظيم الفريق"],
 "Communication familles":["Family communication","التواصل مع الأسر"],"Événement scolaire":["School event","مناسبة مدرسية"],
 "Entrée & accueil":["Entrance & reception","المدخل والاستقبال"],"Salles d’apprentissage":["Learning classrooms","قاعات التعلم"],
 "Vie quotidienne":["Everyday school life","الحياة اليومية"],"Bureaux & équipe":["Offices & team","المكاتب والفريق"],
 "Espaces événements":["Event spaces","فضاءات الفعاليات"],"Établissement complet":["Whole school","المؤسسة كاملة"],
 "1–2 ans":["1–2 years","سنة إلى سنتين"],"3–4 ans":["3–4 years","٣ إلى ٤ سنوات"],"5–6 ans":["5–6 years","٥ إلى ٦ سنوات"],
 "Mixte / multi-âges":["Mixed ages","أعمار مختلطة"],"Clair & chaleureux":["Bright & welcoming","مضيء ومرحب"]
};
const needsValue=(value:string,locale:PartnerLocale)=>locale==="fr"?value:NEEDS[value]?.[locale==="en"?0:1]||value;
export function equipmentR111Brief(selectedKeys:readonly string[],state:R9State,locale:PartnerLocale):string{
 if(locale==="fr")return equipmentR9Brief(selectedKeys,state);
 const intro=locale==="en"?"Equipment project":"مشروع التجهيزات";
 const n=state.needs;
 const needs=[n.situation,n.space,n.age,n.style].filter(Boolean).map(v=>needsValue(v,locale)).join(" · ");
 const selected=selectedKeys.filter(k=>k.startsWith("intent:equipment-domain:")).map(k=>EQUIPMENT_DOMAINS.find(d=>k.endsWith(":"+d.id))).filter((d):d is EquipmentDomain=>!!d).map(d=>localDomain(d,locale).name);
 const preferences=Object.entries(state.preferences).filter(([id,p])=>!!p&&(p.note||p.format||p.quantity||p.age)).map(([id,p])=>{
  const d=EQUIPMENT_DOMAINS.find(d=>d.id===id);
  const name=d?localDomain(d,locale).name:id;
  return name+": "+[p.age,p.format,p.quantity,p.note].filter(Boolean).join(", ");
 });
 const note=locale==="en"?"Notes / preferences":"ملاحظات وتفضيلات";
 const selectedLabel=locale==="en"?"Areas of interest":"مجالات الاهتمام";
 return [intro,needs,selected.length?selectedLabel+": "+selected.join(" · "):"",preferences.length?note+": "+preferences.join("; "):""].filter(Boolean).join("\n").slice(0,1900);
}
