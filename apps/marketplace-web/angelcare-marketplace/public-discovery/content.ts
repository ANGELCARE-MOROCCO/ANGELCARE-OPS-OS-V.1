import type { CatalogLocale, StorefrontKey } from '../catalog-discovery/types'
export type Locale=CatalogLocale
export type Audience='all'|'family'|'professional'|'organization'
export type Trio=readonly [string,string,string]
export const tr=(text:Trio,locale:Locale)=>text[locale==='fr'?0:locale==='en'?1:2]
export const WORLDS=[
 {
  "key": "families",
  "audience": "family",
  "color": "pink",
  "image": "/angelcare-marketplace/discovery-r1/families.webp",
  "title": [
   "La vie de famille, avec plus de possibilités.",
   "More possibilities for family life.",
   "إمكانات أكثر لحياة الأسرة."
  ],
  "description": [
   "Du quotidien aux nouveaux moments de vie, trouvez votre point de départ.",
   "From everyday needs to new chapters, find your starting point.",
   "من الاحتياجات اليومية إلى المراحل الجديدة، اعثروا على نقطة البداية."
  ],
  "tags": [
   [
    "Être accompagné",
    "Feel supported",
    "المواكبة"
   ],
   [
    "Grandir ensemble",
    "Grow together",
    "النمو معاً"
   ],
   [
    "Trouver son rythme",
    "Find your rhythm",
    "إيجاد الإيقاع المناسب"
   ]
  ]
 },
 {
  "key": "home-services",
  "audience": "family",
  "color": "blue",
  "image": "/angelcare-marketplace/discovery-r1/home-services.webp",
  "title": [
   "Le bon accompagnement, au bon moment.",
   "The right support, at the right time.",
   "المواكبة المناسبة في الوقت المناسب."
  ],
  "description": [
   "Garde, relais parental et accompagnements : explorez les formats selon votre besoin.",
   "Explore childcare, parental support and care formats around your needs.",
   "استكشفوا صيغ رعاية الأطفال ودعم الوالدين والمواكبة حسب احتياجكم."
  ],
  "tags": [
   [
    "Ponctuel",
    "One-time",
    "عند الحاجة"
   ],
   [
    "Récurrent",
    "Recurring",
    "منتظم"
   ],
   [
    "Besoins spécifiques",
    "Specific needs",
    "احتياجات خاصة"
   ]
  ]
 },
 {
  "key": "development",
  "audience": "family",
  "color": "violet",
  "image": "/angelcare-marketplace/discovery-r1/development.webp",
  "title": [
   "Faire de la curiosité une belle habitude.",
   "Make curiosity an everyday delight.",
   "اجعلوا الفضول عادة جميلة."
  ],
  "description": [
   "Des pistes pour jouer, explorer et accompagner les découvertes de chaque enfant.",
   "Ways to play, explore and support each child’s discoveries.",
   "أفكار للعب والاستكشاف ومواكبة اكتشافات كل طفل."
  ],
  "tags": [
   [
    "Éveil",
    "Early discovery",
    "الاكتشاف المبكر"
   ],
   [
    "Montessori",
    "Montessori",
    "مونتيسوري"
   ],
   [
    "Activités",
    "Activities",
    "أنشطة"
   ]
  ]
 },
 {
  "key": "kits",
  "audience": "family",
  "color": "amber",
  "image": "/angelcare-marketplace/discovery-r1/kits.webp",
  "title": [
   "De petites idées. De grandes découvertes.",
   "Small ideas. Big discoveries.",
   "أفكار صغيرة واكتشافات كبيرة."
  ],
  "description": [
   "Comprenez les usages et explorez les ressources qui donnent envie d’apprendre.",
   "Discover how learning resources can support meaningful activities.",
   "اكتشفوا استخدامات الموارد التي تشجع على أنشطة تعليمية مفيدة."
  ],
  "tags": [
   [
    "Ressources",
    "Resources",
    "موارد"
   ],
   [
    "Supports",
    "Learning materials",
    "وسائل تعليمية"
   ],
   [
    "À explorer",
    "To explore",
    "للاستكشاف"
   ]
  ]
 },
 {
  "key": "academy",
  "audience": "professional",
  "color": "violet",
  "image": "/angelcare-marketplace/discovery-r1/academy.webp",
  "title": [
   "Apprendre aujourd’hui. Ouvrir la suite.",
   "Learn today. Open what comes next.",
   "تعلموا اليوم وافتحوا آفاق الغد."
  ],
  "description": [
   "Repérez les programmes, formats et objectifs qui correspondent à votre parcours.",
   "Find programmes, formats and learning goals that fit your path.",
   "حددوا البرامج والصيغ والأهداف التعليمية المناسبة لمساركم."
  ],
  "tags": [
   [
    "Programmes",
    "Programmes",
    "برامج"
   ],
   [
    "Parcours",
    "Pathways",
    "مسارات"
   ],
   [
    "Objectifs",
    "Learning goals",
    "أهداف تعليمية"
   ]
  ]
 },
 {
  "key": "establishments",
  "audience": "organization",
  "color": "blue",
  "image": "/angelcare-marketplace/discovery-r1/establishments.webp",
  "title": [
   "Donner corps à votre projet éducatif.",
   "Bring your education project to life.",
   "امنحوا مشروعكم التربوي آفاقاً جديدة."
  ],
  "description": [
   "Écoles, crèches et structures : explorez les accompagnements et cadres de collaboration.",
   "Schools and early-years settings: explore support and collaboration models.",
   "للمدارس والحضانات والمؤسسات: استكشفوا صيغ الدعم والتعاون."
  ],
  "tags": [
   [
    "Écoles",
    "Schools",
    "مدارس"
   ],
   [
    "Crèches",
    "Early-years settings",
    "حضانات"
   ],
   [
    "Accompagnement",
    "Support",
    "مواكبة"
   ]
  ]
 },
 {
  "key": "hospitality",
  "audience": "organization",
  "color": "amber",
  "image": "/angelcare-marketplace/discovery-r1/hospitality.webp",
  "title": [
   "Une place particulière pour vos hôtes en famille.",
   "A thoughtful place for family guests.",
   "اهتمام خاص بضيوفكم من الأسر."
  ],
  "description": [
   "Hospitality, accueil des enfants et expériences familiales : dessinez le bon projet.",
   "Explore family hospitality, childcare and guest-experience projects.",
   "استكشفوا مشاريع الضيافة العائلية ورعاية الأطفال وتجربة الضيوف."
  ],
  "tags": [
   [
    "Hospitality",
    "Hospitality",
    "ضيافة"
   ],
   [
    "Accueil famille",
    "Family welcome",
    "استقبال الأسر"
   ],
   [
    "Programmes",
    "Programmes",
    "برامج"
   ]
  ]
 },
 {
  "key": "health-partners",
  "audience": "organization",
  "color": "pink",
  "image": "/angelcare-marketplace/discovery-r1/health-partners.webp",
  "title": [
   "Mieux accompagner les transitions familiales.",
   "Support families through important transitions.",
   "مواكبة أفضل للمراحل المهمة في حياة الأسر."
  ],
  "description": [
   "Découvrez les complémentarités non médicales autour des parents, du bébé et du retour à domicile.",
   "Explore non-medical support around parents, babies and the return home.",
   "اكتشفوا الدعم غير الطبي للوالدين والرضيع والعودة إلى المنزل."
  ],
  "tags": [
   [
    "Parents & bébé",
    "Parents & baby",
    "الوالدان والرضيع"
   ],
   [
    "Non médical",
    "Non-medical",
    "غير طبي"
   ],
   [
    "Partenariats",
    "Partnerships",
    "شراكات"
   ]
  ]
 },
 {
  "key": "corporates",
  "audience": "organization",
  "color": "blue",
  "image": "/angelcare-marketplace/discovery-r1/corporates.webp",
  "title": [
   "Les enjeux de vos équipes ont aussi une vie de famille.",
   "Your people’s lives include family life.",
   "حياة فرقكم تشمل أيضاً حياة أسرهم."
  ],
  "description": [
   "RH et directions : explorez les programmes et projets de soutien à la parentalité.",
   "HR and leadership: explore family-support programmes and projects.",
   "للموارد البشرية والإدارة: استكشفوا برامج ومشاريع دعم الوالدين."
  ],
  "tags": [
   [
    "RH",
    "HR",
    "الموارد البشرية"
   ],
   [
    "Parentalité",
    "Parenthood",
    "الوالدية"
   ],
   [
    "Projets",
    "Projects",
    "مشاريع"
   ]
  ]
 },
 {
  "key": "partner-os",
  "audience": "professional",
  "color": "emerald",
  "image": "/angelcare-marketplace/discovery-r1/partner-os.webp",
  "title": [
   "Construire une collaboration qui a du sens.",
   "Build a collaboration with purpose.",
   "ابنوا تعاوناً ذا معنى."
  ],
  "description": [
   "Comprenez les parcours partenaires et les conditions d’une collaboration avec AngelCare.",
   "Understand partner pathways and how collaboration with AngelCare works.",
   "تعرفوا على مسارات الشراكة وكيفية التعاون مع أنجل كير."
  ],
  "tags": [
   [
    "Partenaires",
    "Partners",
    "شركاء"
   ],
   [
    "Organisation",
    "Organisation",
    "تنظيم"
   ],
   [
    "Collaboration",
    "Collaboration",
    "تعاون"
   ]
  ]
 },
 {
  "key": "quality-check",
  "audience": "organization",
  "color": "emerald",
  "image": "/angelcare-marketplace/discovery-r1/quality-check.webp",
  "title": [
   "Faire progresser la qualité avec méthode.",
   "Move quality forward with a clear method.",
   "ارتقوا بالجودة بمنهج واضح."
  ],
  "description": [
   "Explorez les démarches d’observation, d’évaluation et d’amélioration selon leur périmètre publié.",
   "Explore published observation, assessment and improvement approaches.",
   "استكشفوا مناهج الملاحظة والتقييم والتحسين وفق نطاقها المنشور."
  ],
  "tags": [
   [
    "Évaluer",
    "Assess",
    "تقييم"
   ],
   [
    "Comprendre",
    "Understand",
    "فهم"
   ],
   [
    "Progresser",
    "Improve",
    "تحسين"
   ]
  ]
 },
 {
  "key": "professionals",
  "audience": "professional",
  "color": "violet",
  "image": "/angelcare-marketplace/discovery-r1/professionals.webp",
  "title": [
   "Votre expertise peut ouvrir de nouveaux chemins.",
   "Your expertise can open new paths.",
   "خبرتكم قد تفتح مسارات جديدة."
  ],
  "description": [
   "Formation, participation et collaboration : découvrez comment préparer votre prochain pas.",
   "Learning, participation and collaboration: prepare your next step.",
   "التكوين والمشاركة والتعاون: جهزوا خطوتكم المقبلة."
  ],
  "tags": [
   [
    "Expertise",
    "Expertise",
    "خبرة"
   ],
   [
    "Participation",
    "Participation",
    "مشاركة"
   ],
   [
    "Parcours",
    "Pathways",
    "مسارات"
   ]
  ]
 }
] as const
export const TOPICS=[
 {
  "key": "account",
  "audience": "other",
  "label": [
   "Mon compte & connexion",
   "Account & sign-in",
   "الحساب وتسجيل الدخول"
  ],
  "description": [
   "Retrouver un accès ou comprendre une étape.",
   "Get help accessing your account.",
   "المساعدة في الوصول إلى حسابكم."
  ],
  "extra": "account"
 },
 {
  "key": "order",
  "audience": "family",
  "label": [
   "Commande, réservation & suivi",
   "Orders, bookings & follow-up",
   "الطلبات والحجوزات والمتابعة"
  ],
  "description": [
   "Faire le point sur une demande existante.",
   "Ask about an existing request.",
   "الاستفسار عن طلب قائم."
  ],
  "extra": "reference"
 },
 {
  "key": "care",
  "audience": "family",
  "label": [
   "Un accompagnement pour ma famille",
   "Support for my family",
   "مواكبة لأسرتي"
  ],
  "description": [
   "Expliquer un besoin et préparer la suite.",
   "Describe a need and prepare your next step.",
   "اشرحوا احتياجكم وجهزوا الخطوة المقبلة."
  ],
  "extra": "location"
 },
 {
  "key": "resources",
  "audience": "family",
  "label": [
   "Produits, kits & ressources",
   "Products, kits & resources",
   "المنتجات والمجموعات والموارد"
  ],
  "description": [
   "Être orienté vers un usage ou une ressource.",
   "Get guidance on resources and their uses.",
   "التوجيه نحو الموارد واستخداماتها."
  ],
  "extra": "none"
 },
 {
  "key": "learning",
  "audience": "academy",
  "label": [
   "Academy & formation",
   "Academy & learning",
   "الأكاديمية والتكوين"
  ],
  "description": [
   "Préciser un objectif de formation.",
   "Discuss a learning goal.",
   "وضحوا هدفاً تكوينياً."
  ],
  "extra": "none"
 },
 {
  "key": "school",
  "audience": "school",
  "label": [
   "École, crèche & établissement",
   "Schools & early-years settings",
   "المدارس والحضانات والمؤسسات"
  ],
  "description": [
   "Préparer un projet pour votre structure.",
   "Prepare a project for your setting.",
   "جهزوا مشروعاً لمؤسستكم."
  ],
  "extra": "organization"
 },
 {
  "key": "hospitality",
  "audience": "hotel",
  "label": [
   "Hospitality & accueil famille",
   "Hospitality & family guests",
   "الضيافة واستقبال الأسر"
  ],
  "description": [
   "Échanger sur un projet d’accueil des familles.",
   "Discuss a family-hospitality project.",
   "ناقشوا مشروعاً لاستقبال الأسر."
  ],
  "extra": "organization"
 },
 {
  "key": "health",
  "audience": "clinic",
  "label": [
   "Partenariat santé",
   "Health partnership",
   "شراكة صحية"
  ],
  "description": [
   "Explorer un accompagnement non médical.",
   "Explore non-medical support.",
   "استكشفوا مواكبة غير طبية."
  ],
  "extra": "organization"
 },
 {
  "key": "corporate",
  "audience": "corporate",
  "label": [
   "Entreprise & parentalité",
   "Corporate & parenthood",
   "المقاولات والوالدية"
  ],
  "description": [
   "Qualifier les besoins de votre organisation.",
   "Discuss your organisation’s needs.",
   "وضحوا احتياجات مؤسستكم."
  ],
  "extra": "organization"
 },
 {
  "key": "professional",
  "audience": "provider",
  "label": [
   "Professionnels & participation",
   "Professionals & participation",
   "المهنيون والمشاركة"
  ],
  "description": [
   "Comprendre un parcours de collaboration.",
   "Understand a participation pathway.",
   "تعرفوا على مسار للتعاون."
  ],
  "extra": "organization"
 },
 {
  "key": "partner",
  "audience": "partner_os",
  "label": [
   "Partenaires & Partner OS",
   "Partners & Partner OS",
   "الشركاء وPartner OS"
  ],
  "description": [
   "Préparer une collaboration ou une question partenaire.",
   "Discuss a partnership or partner question.",
   "جهزوا تعاوناً أو سؤالاً متعلقاً بالشراكة."
  ],
  "extra": "organization"
 },
 {
  "key": "other",
  "audience": "other",
  "label": [
   "Une autre question",
   "Something else",
   "سؤال آخر"
  ],
  "description": [
   "Vous ne savez pas encore où commencer ?",
   "Not sure where to start?",
   "لا تعرفون بعد من أين تبدؤون؟"
  ],
  "extra": "none"
 }
] as const
export const topicByKey=(key:string)=>TOPICS.find(t=>t.key===key)||TOPICS[TOPICS.length-1]
export const WORLD_KEYS=new Set<string>(WORLDS.map(w=>w.key))
export function suggestedWorlds(audience:Audience,intent:string):StorefrontKey[]{const map:Record<string,StorefrontKey[]>={care:['home-services','families'],play:['development','kits'],learn:['academy','professionals'],partner:['partner-os','professionals'],education:['establishments','academy'],guests:['hospitality','health-partners'],teams:['corporates','quality-check']};const ordered=map[intent]||WORLDS.filter(w=>audience==='all'||w.audience===audience).slice(0,3).map(w=>w.key);return ordered}
