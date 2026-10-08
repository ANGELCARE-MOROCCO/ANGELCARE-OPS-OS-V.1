import type {CatalogLocale} from '@/angelcare-marketplace/catalog-discovery/types'

export const FAMILY_ATOMIC_SCHEMA_KEYS = [
  'home-childcare-one-time',
  'home-childcare-recurring',
  'school-pickup-care',
  'overnight-extended-care',
  'emergency-last-minute-care',
  'hotel-travel-childcare',
  'holiday-excursion-programme',
  'montessori-home-service',
  'learning-homework-support',
  'non-medical-support-service',
  'flashcards-learning-product',
  'montessori-development-kit',
  'development-game',
  'activity-subscription-box',
  'digital-learning-resource',
  'preschool-admission',
] as const

export type FamilyAtomicSchemaKey = typeof FAMILY_ATOMIC_SCHEMA_KEYS[number]

export type FamilyTone = 'pink'|'rose'|'peach'|'blue'|'violet'|'mint'|'amber'|'urgent'

type Copy = Record<CatalogLocale,{eyebrow:string;title:string;hook:string;body:string;cta:string}>

export interface FamilyAtomicStory {
  schemaKey: FamilyAtomicSchemaKey
  anchor: string
  tone: FamilyTone
  fallbackMedia: string
  copy: Copy
}

export const FAMILY_ATOMIC_STORIES: readonly FamilyAtomicStory[] = [
  {schemaKey:'home-childcare-one-time',anchor:'garde-ponctuelle',tone:'pink',fallbackMedia:'/angelcare-marketplace/homepage/item-home-care.svg',copy:{
    fr:{eyebrow:'GARDE PONCTUELLE',title:'Besoin de souffler quelques heures ?',hook:'Une sortie, un rendez-vous, un imprévu organisé.',body:'Découvrez les offres de garde ponctuelle réellement publiées pour votre territoire et poursuivez vers leur parcours de réservation.',cta:'Voir la garde ponctuelle'},
    en:{eyebrow:'ONE-TIME CHILDCARE',title:'Need a few hours to breathe?',hook:'An evening out, an appointment, a planned one-off need.',body:'Discover genuinely published one-time childcare offers for your territory and continue into their booking journey.',cta:'Explore one-time care'},
    ar:{eyebrow:'رعاية لمرة واحدة',title:'هل تحتاجون إلى بضع ساعات من الراحة؟',hook:'خروج، موعد أو حاجة عائلية عابرة.',body:'اكتشفوا عروض الرعاية المنزلية المنشورة فعلياً والمتاحة لنطاقكم ثم تابعوا إلى مسار الحجز.',cta:'استكشف الرعاية المؤقتة'},
  }},
  {schemaKey:'home-childcare-recurring',anchor:'garde-reguliere',tone:'blue',fallbackMedia:'/angelcare-marketplace/homepage/item-recurring-care.svg',copy:{
    fr:{eyebrow:'GARDE RÉGULIÈRE',title:'Construisez un rythme qui tient vraiment dans la durée.',hook:'Même besoin, semaine après semaine, sans repartir de zéro.',body:'Les offres récurrentes publiées exposent leur cadence, disponibilité et configuration réelle avant engagement.',cta:'Créer mon rythme'},
    en:{eyebrow:'RECURRING CHILDCARE',title:'Build a rhythm that actually lasts.',hook:'The same family need, week after week, without starting over.',body:'Published recurring offers expose their cadence, availability and real configuration before commitment.',cta:'Build my routine'},
    ar:{eyebrow:'رعاية منتظمة',title:'ابنوا إيقاعاً عائلياً قابلاً للاستمرار.',hook:'الحاجة نفسها أسبوعاً بعد أسبوع من دون البدء من جديد.',body:'تعرض العروض الدورية المنشورة إيقاعها وتوفرها وإعدادها الحقيقي قبل الالتزام.',cta:'أنشئوا روتينكم'},
  }},
  {schemaKey:'school-pickup-care',anchor:'sortie-ecole',tone:'peach',fallbackMedia:'/angelcare-marketplace/homepage/item-after-school.svg',copy:{
    fr:{eyebrow:'SORTIE D’ÉCOLE',title:'La sortie d’école ne devrait jamais devenir une course contre la montre.',hook:'Relais, remise sécurisée et continuité jusqu’à la maison.',body:'Les offres publiées conservent leurs règles de trajet, fenêtres de prise en charge et protocoles réels.',cta:'Organiser la sortie d’école'},
    en:{eyebrow:'SCHOOL PICKUP',title:'School pickup should never become a race against the clock.',hook:'Pickup, safe handover and continuity through the after-school window.',body:'Published offers retain their real route rules, pickup windows and handover protocols.',cta:'Organise school pickup'},
    ar:{eyebrow:'الاستلام من المدرسة',title:'لا ينبغي أن تتحول نهاية اليوم الدراسي إلى سباق مع الوقت.',hook:'استلام آمن وتسليم منظم واستمرارية بعد المدرسة.',body:'تحافظ العروض المنشورة على قواعد المسار ونوافذ الاستلام وبروتوكولات التسليم الحقيقية.',cta:'نظّموا الاستلام'},
  }},
  {schemaKey:'overnight-extended-care',anchor:'soiree-nuit',tone:'violet',fallbackMedia:'/angelcare-marketplace/homepage/hero-family-marketplace.svg',copy:{
    fr:{eyebrow:'SOIRÉE & NUIT',title:'Vos soirées restent vos soirées.',hook:'Horaires étendus, routine du coucher et continuité familiale.',body:'Explorez uniquement les formats de soirée ou de nuit réellement publiés et leurs conditions de prise en charge.',cta:'Découvrir soirée & nuit'},
    en:{eyebrow:'EVENING & OVERNIGHT',title:'Your evenings can still be yours.',hook:'Extended hours, bedtime routines and family continuity.',body:'Explore only genuinely published evening or overnight formats and their actual service conditions.',cta:'Explore evening care'},
    ar:{eyebrow:'المساء والليل',title:'يمكن أن يبقى المساء وقتكم.',hook:'ساعات ممتدة وروتين النوم واستمرارية الأسرة.',body:'استكشفوا فقط صيغ المساء أو الليل المنشورة فعلياً وشروط تقديمها الحقيقية.',cta:'استكشفوا رعاية المساء'},
  }},
  {schemaKey:'emergency-last-minute-care',anchor:'urgence',tone:'urgent',fallbackMedia:'/angelcare-marketplace/homepage/family-showcase.svg',copy:{
    fr:{eyebrow:'BESOIN URGENT',title:'Un imprévu ? Commencez ici.',hook:'Vérifier les options disponibles, sans fausse promesse de capacité.',body:'La vitrine affiche les offres urgentes publiées. La disponibilité immédiate n’est affirmée que si l’autorité de capacité la confirme.',cta:'Vérifier les options'},
    en:{eyebrow:'URGENT NEED',title:'Something unexpected? Start here.',hook:'Check possible options without pretending capacity exists.',body:'The storefront shows published urgent-care offers. Immediate availability is only stated when the capacity authority confirms it.',cta:'Check options'},
    ar:{eyebrow:'حاجة عاجلة',title:'طارئ غير متوقع؟ ابدأوا من هنا.',hook:'تحققوا من الخيارات من دون ادعاء توفر غير مؤكد.',body:'تعرض الواجهة عروض الرعاية العاجلة المنشورة ولا تؤكد التوفر الفوري إلا عندما تؤكده سلطة السعة.',cta:'تحققوا من الخيارات'},
  }},
  {schemaKey:'montessori-home-service',anchor:'montessori-domicile',tone:'mint',fallbackMedia:'/angelcare-marketplace/homepage/item-montessori.svg',copy:{
    fr:{eyebrow:'MONTESSORI À DOMICILE',title:'Transformer la maison en espace de découverte.',hook:'Des séances guidées autour d’objectifs de développement concrets.',body:'Les offres publiées exposent âge, objectifs, durée, disponibilité et cadre d’intervention réellement configurés.',cta:'Découvrir Montessori'},
    en:{eyebrow:'MONTESSORI AT HOME',title:'Turn home into a place of discovery.',hook:'Guided sessions built around concrete development objectives.',body:'Published offers expose their configured age range, goals, duration, availability and service framework.',cta:'Explore Montessori'},
    ar:{eyebrow:'مونتيسوري في المنزل',title:'حوّلوا المنزل إلى مساحة للاكتشاف.',hook:'جلسات موجهة حول أهداف نمو واضحة.',body:'تعرض العروض المنشورة العمر والأهداف والمدة والتوفر وإطار الخدمة كما هو مهيأ فعلياً.',cta:'استكشفوا مونتيسوري'},
  }},
  {schemaKey:'learning-homework-support',anchor:'devoirs-apprentissage',tone:'blue',fallbackMedia:'/angelcare-marketplace/homepage/item-after-school.svg',copy:{
    fr:{eyebrow:'DEVOIRS & APPRENTISSAGE',title:'Moins de tension autour des devoirs. Plus de progression.',hook:'Un accompagnement qui part du niveau, du sujet et du rythme réel.',body:'Les offres publiées conservent leur niveau scolaire, matières, durée et modalités de suivi canoniques.',cta:'Voir l’accompagnement'},
    en:{eyebrow:'HOMEWORK & LEARNING',title:'Less tension around homework. More progress.',hook:'Support built around actual level, subject and rhythm.',body:'Published offers retain their canonical school level, subjects, duration and follow-up formats.',cta:'Explore learning support'},
    ar:{eyebrow:'الواجبات والتعلم',title:'توتر أقل حول الواجبات وتقدم أكبر.',hook:'دعم ينطلق من المستوى والمادة والإيقاع الحقيقي.',body:'تحافظ العروض المنشورة على المستوى والمواد والمدة وأشكال المتابعة المعتمدة.',cta:'استكشفوا الدعم التعليمي'},
  }},
  {schemaKey:'non-medical-support-service',anchor:'accompagnement-personnalise',tone:'rose',fallbackMedia:'/angelcare-marketplace/homepage/item-mother-baby.svg',copy:{
    fr:{eyebrow:'ACCOMPAGNEMENT PERSONNALISÉ',title:'Chaque enfant avance différemment.',hook:'Un accompagnement strictement non médical, avec adéquation vérifiée.',body:'Cette zone reste explicitement non médicale. Les parcours publiés orientent vers une vérification d’adéquation avant conversion.',cta:'Vérifier l’adéquation'},
    en:{eyebrow:'PERSONALISED SUPPORT',title:'Every child progresses differently.',hook:'Strictly non-medical support with suitability checked first.',body:'This area remains explicitly non-medical. Published journeys lead to suitability verification before conversion.',cta:'Check suitability'},
    ar:{eyebrow:'دعم شخصي',title:'كل طفل يتقدم بطريقته.',hook:'دعم غير طبي بشكل صريح مع التحقق من الملاءمة أولاً.',body:'تبقى هذه المنطقة غير طبية بوضوح وتقود المسارات المنشورة إلى التحقق من الملاءمة قبل التحويل.',cta:'تحققوا من الملاءمة'},
  }},
  {schemaKey:'flashcards-learning-product',anchor:'flashcards',tone:'peach',fallbackMedia:'/angelcare-marketplace/homepage/item-autonomy-kit.svg',copy:{
    fr:{eyebrow:'FLASHCARDS',title:'Apprendre avec des cartes qu’on a envie de ressortir.',hook:'Âge, langue, thème et format deviennent des vrais leviers de choix.',body:'Chaque carte produit conserve son image, prix, disponibilité et caractéristiques publiées.',cta:'Explorer les flashcards'},
    en:{eyebrow:'FLASHCARDS',title:'Learning cards children actually want to use again.',hook:'Age, language, theme and format become real decision signals.',body:'Every product card keeps its published image, price, availability and attributes.',cta:'Explore flashcards'},
    ar:{eyebrow:'بطاقات تعليمية',title:'بطاقات تعلم يرغب الأطفال في استخدامها مجدداً.',hook:'العمر واللغة والموضوع والصيغة تصبح عناصر اختيار حقيقية.',body:'تحافظ كل بطاقة منتج على صورتها وسعرها وتوفرها وخصائصها المنشورة.',cta:'استكشفوا البطاقات'},
  }},
  {schemaKey:'montessori-development-kit',anchor:'kits-montessori',tone:'amber',fallbackMedia:'/angelcare-marketplace/homepage/item-autonomy-kit.svg',copy:{
    fr:{eyebrow:'KITS MONTESSORI & DÉVELOPPEMENT',title:'Une boîte. Plusieurs façons de jouer, apprendre et progresser.',hook:'Des kits comparables par âge, contenu, activités et disponibilité réelle.',body:'Les produits publiés restent reliés à leur stock, variantes, composants et parcours commerce canoniques.',cta:'Voir les kits'},
    en:{eyebrow:'MONTESSORI & DEVELOPMENT KITS',title:'One box. Many ways to play, learn and progress.',hook:'Compare kits by age, contents, activities and real availability.',body:'Published products remain connected to canonical stock, variants, components and commerce journeys.',cta:'Explore kits'},
    ar:{eyebrow:'حقائب مونتيسوري والتطوير',title:'علبة واحدة وطرق عديدة للعب والتعلم والتقدم.',hook:'قارنوا الحقائب حسب العمر والمحتوى والأنشطة والتوفر الحقيقي.',body:'تبقى المنتجات المنشورة مرتبطة بالمخزون والخيارات والمكونات ومسارات التجارة المعتمدة.',cta:'استكشفوا الحقائب'},
  }},
  {schemaKey:'development-game',anchor:'jeux-developpement',tone:'violet',fallbackMedia:'/angelcare-marketplace/homepage/category-development.svg',copy:{
    fr:{eyebrow:'JEUX DE DÉVELOPPEMENT',title:'Jouer avec une intention, sans perdre le plaisir.',hook:'Motricité, logique, langage, concentration ou jeu social selon les attributs réels.',body:'La vitrine n’invente aucun bénéfice : elle expose uniquement les objectifs et caractéristiques publiés.',cta:'Découvrir les jeux'},
    en:{eyebrow:'DEVELOPMENT GAMES',title:'Play with intention without losing the fun.',hook:'Motor skills, logic, language, focus or social play when the real attributes support it.',body:'The storefront invents no benefit; it exposes only published objectives and attributes.',cta:'Explore games'},
    ar:{eyebrow:'ألعاب التطوير',title:'لعب هادف من دون فقدان المتعة.',hook:'الحركة والمنطق واللغة والتركيز أو اللعب الاجتماعي عندما تدعمها الخصائص الحقيقية.',body:'لا تخترع الواجهة أي فائدة بل تعرض فقط الأهداف والخصائص المنشورة.',cta:'استكشفوا الألعاب'},
  }},
  {schemaKey:'activity-subscription-box',anchor:'box-activites',tone:'pink',fallbackMedia:'/angelcare-marketplace/homepage/category-kits.svg',copy:{
    fr:{eyebrow:'BOX D’ACTIVITÉS',title:'De nouvelles idées qui arrivent avec un vrai rythme familial.',hook:'Une souscription produit famille, jamais présentée comme un SaaS.',body:'Cadence, contenu, prix et renouvellement sont affichés uniquement lorsqu’ils sont publiés par l’offre.',cta:'Découvrir les box'},
    en:{eyebrow:'ACTIVITY BOXES',title:'New ideas arriving on a family-friendly rhythm.',hook:'A family product subscription, never presented as SaaS.',body:'Cadence, contents, price and renewal are shown only when published by the offer.',cta:'Explore activity boxes'},
    ar:{eyebrow:'صناديق الأنشطة',title:'أفكار جديدة تصل بإيقاع مناسب للعائلة.',hook:'اشتراك منتج عائلي وليس برمجيات خدمة.',body:'لا تظهر الوتيرة والمحتوى والسعر والتجديد إلا عندما تنشرها فعلياً سلطة العرض.',cta:'استكشفوا الصناديق'},
  }},
  {schemaKey:'digital-learning-resource',anchor:'ressources-digitales',tone:'blue',fallbackMedia:'/angelcare-marketplace/homepage/category-development.svg',copy:{
    fr:{eyebrow:'RESSOURCES DIGITALES',title:'Apprendre aussi quand le support tient dans un écran.',hook:'Aperçu, format, objectif et accès digital clairement différenciés du produit physique.',body:'Les ressources publiées gardent leur propre parcours de checkout digital et leurs vrais attributs.',cta:'Voir les ressources'},
    en:{eyebrow:'DIGITAL LEARNING RESOURCES',title:'Learning can also live on a screen.',hook:'Preview, format, objective and digital access are clearly separated from physical products.',body:'Published resources keep their own digital checkout journey and real attributes.',cta:'Explore digital resources'},
    ar:{eyebrow:'موارد تعلم رقمية',title:'يمكن للتعلم أن يكون رقمياً أيضاً.',hook:'المعاينة والصيغة والهدف والوصول الرقمي منفصلة بوضوح عن المنتج المادي.',body:'تحافظ الموارد المنشورة على مسار الدفع الرقمي وخصائصها الحقيقية.',cta:'استكشفوا الموارد'},
  }},
  {schemaKey:'hotel-travel-childcare',anchor:'voyage',tone:'peach',fallbackMedia:'/angelcare-marketplace/homepage/item-hospitality.svg',copy:{
    fr:{eyebrow:'VOYAGE AVEC ENFANTS',title:'Voyager sans casser les habitudes des enfants.',hook:'Une garde pensée pour la famille en déplacement, pas une offre B2B hôtelière.',body:'Destination, lieu de prise en charge, langues et horaires restent ceux de l’offre famille réellement publiée.',cta:'Organiser ma garde en voyage'},
    en:{eyebrow:'TRAVEL WITH CHILDREN',title:'Travel without breaking children’s routines.',hook:'Childcare for the travelling family, not a hotel B2B programme.',body:'Destination, service location, languages and hours remain those of the genuinely published family offer.',cta:'Arrange travel childcare'},
    ar:{eyebrow:'السفر مع الأطفال',title:'سافروا من دون كسر عادات الأطفال.',hook:'رعاية للعائلة المسافرة وليست برنامجاً فندقياً للشركات.',body:'تبقى الوجهة ومكان الخدمة واللغات والأوقات كما تنشرها فعلياً عروض العائلة.',cta:'نظّموا رعاية السفر'},
  }},
  {schemaKey:'holiday-excursion-programme',anchor:'vacances',tone:'mint',fallbackMedia:'/angelcare-marketplace/homepage/category-family.svg',copy:{
    fr:{eyebrow:'VACANCES & EXCURSIONS',title:'Les vacances peuvent devenir une vraie aventure.',hook:'Programmes, sorties, dates, capacité et règles réelles dans une lecture familiale claire.',body:'Aucune fausse rareté : les places restantes ne sont affichées que si la capacité canonique les fournit.',cta:'Explorer les programmes'},
    en:{eyebrow:'HOLIDAYS & EXCURSIONS',title:'Holidays can become a real adventure.',hook:'Programmes, outings, dates, capacity and real rules in a clear family view.',body:'No fake scarcity: remaining capacity is shown only when the canonical capacity authority provides it.',cta:'Explore programmes'},
    ar:{eyebrow:'العطل والرحلات',title:'يمكن للعطلة أن تصبح مغامرة حقيقية.',hook:'برامج ورحلات وتواريخ وسعة وقواعد فعلية في عرض عائلي واضح.',body:'لا ندعي ندرة زائفة ولا تظهر المقاعد المتبقية إلا عندما توفرها سلطة السعة المعتمدة.',cta:'استكشفوا البرامج'},
  }},
  {schemaKey:'preschool-admission',anchor:'prescolaire',tone:'rose',fallbackMedia:'/angelcare-marketplace/homepage/item-school-diagnostic.svg',copy:{
    fr:{eyebrow:'PRÉSCOLAIRE & ADMISSION',title:'Préparer les premières années avec plus de visibilité.',hook:'Découvrir un programme puis poursuivre vers son parcours d’admission réel.',body:'L’éligibilité, la période d’admission et la capacité ne sont montrées que lorsqu’elles sont publiées.',cta:'Découvrir le préscolaire'},
    en:{eyebrow:'PRESCHOOL & ADMISSION',title:'Plan the early years with more visibility.',hook:'Discover a programme and continue into its real admission journey.',body:'Eligibility, admission period and capacity are shown only when published.',cta:'Explore preschool'},
    ar:{eyebrow:'مرحلة ما قبل المدرسة والقبول',title:'خططوا للسنوات الأولى بوضوح أكبر.',hook:'اكتشفوا البرنامج ثم تابعوا إلى مسار القبول الحقيقي.',body:'لا تظهر الأهلية وفترة القبول والسعة إلا عندما تكون منشورة.',cta:'استكشفوا ما قبل المدرسة'},
  }},
] as const

export const FAMILY_STOREFRONT_COPY = {
  fr:{eyebrow:'ANGELCARE · FAMILLES',title:'Tout ce qui simplifie la vie de famille, dans un seul univers vivant.',lead:'Garde, école, développement, jeux, ressources, voyages, vacances et premières années : explorez uniquement des offres famille réelles, organisées autour de vos besoins.',primary:'Explorer les besoins',secondary:'Aidez-moi à choisir',atomic:'16 univers famille',published:'offres publiées',collections:'collections famille',needRail:'De quoi avez-vous besoin aujourd’hui ?',familyCollections:'Collections famille',familyCollectionsLead:'Des sélections réellement assignées à la vitrine Familles.',conciergeTitle:'Je ne sais pas exactement quoi choisir.',conciergeBody:'Décrivez votre besoin familial. Le parcours de demande AngelCare vous aide à cadrer la situation sans inventer une offre qui n’existe pas.',conciergeCta:'Démarrer une demande famille',trustTitle:'Une vitrine dense, une vérité commerciale intacte.',trustBody:'Prix, disponibilité, médias, capacité, stock, preuves et actions viennent de leurs autorités canoniques. Le design ne fabrique aucune promesse.',comingTitle:'Sélection en cours de mise à jour',comingBody:'Les offres publiées pour cet univers apparaissent ici automatiquement. Nous gardons le bloc visible pour que la vitrine reste vivante et complète.',refreshLabel:'Prochaine fenêtre de rafraîchissement de la vitrine',refreshNote:'Ce compteur représente un cycle d’actualisation de 24 h, pas une promesse de publication ou de disponibilité.',soon:'Les prochaines offres publiées apparaîtront ici.',live:'LIVE FAMILY COMMERCE'},
  en:{eyebrow:'ANGELCARE · FAMILIES',title:'Everything that simplifies family life, inside one living universe.',lead:'Childcare, school rhythm, development, games, resources, travel, holidays and early years: explore real family offers organised around actual needs.',primary:'Explore needs',secondary:'Help me choose',atomic:'16 family universes',published:'published offers',collections:'family collections',needRail:'What do you need today?',familyCollections:'Family collections',familyCollectionsLead:'Selections genuinely assigned to the Families storefront.',conciergeTitle:'I am not exactly sure what to choose.',conciergeBody:'Describe your family need. AngelCare’s family request journey helps frame the situation without inventing an offer that does not exist.',conciergeCta:'Start a family request',trustTitle:'A dense storefront with commercial truth intact.',trustBody:'Prices, availability, media, capacity, stock, evidence and actions come from canonical authorities. The design fabricates no promise.',comingTitle:'Selection currently being updated',comingBody:'Published offers for this universe appear here automatically. We keep the block visible so the storefront remains complete and alive.',refreshLabel:'Next storefront refresh window',refreshNote:'This countdown represents a repeating 24-hour storefront refresh cycle, not a promise of publication or availability.',soon:'The next published offers will appear here.',live:'LIVE FAMILY COMMERCE'},
  ar:{eyebrow:'ANGELCARE · العائلات',title:'كل ما يبسط حياة الأسرة داخل عالم واحد حي.',lead:'الرعاية وإيقاع المدرسة والتطوير والألعاب والموارد والسفر والعطل والسنوات الأولى: استكشفوا عروضاً عائلية حقيقية منظمة حول الاحتياجات الفعلية.',primary:'استكشفوا الاحتياجات',secondary:'ساعدوني على الاختيار',atomic:'16 عالماً عائلياً',published:'عروض منشورة',collections:'مجموعات عائلية',needRail:'ماذا تحتاجون اليوم؟',familyCollections:'مجموعات العائلة',familyCollectionsLead:'اختيارات مخصصة فعلياً لواجهة العائلات.',conciergeTitle:'لست متأكداً تماماً مما أحتاجه.',conciergeBody:'صفوا احتياج الأسرة. يساعدكم مسار طلب العائلة لدى AngelCare على تحديد الحاجة من دون اختراع عرض غير موجود.',conciergeCta:'ابدؤوا طلباً عائلياً',trustTitle:'واجهة غنية مع الحفاظ على الحقيقة التجارية.',trustBody:'الأسعار والتوفر والوسائط والسعة والمخزون والأدلة والإجراءات تأتي من السلطات المعتمدة ولا يصنع التصميم أي وعد.',comingTitle:'يجري تحديث الاختيارات',comingBody:'تظهر العروض المنشورة لهذا العالم هنا تلقائياً ونبقي الكتلة ظاهرة حتى تبقى الواجهة كاملة وحية.',refreshLabel:'نافذة التحديث التالية للواجهة',refreshNote:'يمثل العداد دورة تحديث متكررة لمدة 24 ساعة وليس وعداً بالنشر أو التوفر.',soon:'ستظهر العروض المنشورة التالية هنا.',live:'تجارة عائلية مباشرة'},
} as const

export function isFamilyAtomicSchemaKey(value:unknown):value is FamilyAtomicSchemaKey {
  return typeof value==='string'&&(FAMILY_ATOMIC_SCHEMA_KEYS as readonly string[]).includes(value)
}
