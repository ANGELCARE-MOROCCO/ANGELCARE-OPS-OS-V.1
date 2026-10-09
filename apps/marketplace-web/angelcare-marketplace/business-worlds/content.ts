import type { CatalogLocale, StorefrontKey } from "../catalog-discovery/types";
export { w, tr, photo } from "../storefront-immersive/content";
import { w, type Words } from "../storefront-immersive/content";
export type BusinessKey =
  | "corporates"
  | "establishments"
  | "health-partners"
  | "hospitality"
  | "partner-os"
  | "professionals"
  | "quality-check";
export const BUSINESS_KEYS: readonly string[] = [
  "corporates",
  "establishments",
  "health-partners",
  "hospitality",
  "partner-os",
  "professionals",
  "quality-check",
];
export const isBusinessKey = (key: StorefrontKey): key is BusinessKey =>
  BUSINESS_KEYS.includes(key);
export interface Dossier {
  title: Words;
  body: Words;
  detail: Words;
  photo: string;
  href?: string;
}
export interface BusinessProfile {
  label: Words;
  eyebrow: Words;
  title: Words;
  lead: Words;
  action: Words;
  photo: string;
  request: string;
  audience: string;
  vertical?: "corporate" | "establishment" | "health_partner" | "hospitality";
  priorities: Words[];
  dossiers: Dossier[];
}
export const WORLDS: Record<BusinessKey, BusinessProfile> = {
  corporates: {
    label: w("Entreprises", "Corporates", "الشركات"),
    eyebrow: w(
      "LA FAMILLE ENTRE DANS VOTRE EXPÉRIENCE COLLABORATEUR",
      "FAMILY BELONGS IN YOUR EMPLOYEE EXPERIENCE",
      "الأسرة جزء من تجربة الموظف",
    ),
    title: w(
      "Derrière chaque talent, toute une vie.",
      "Behind every talent, an entire life.",
      "وراء كل موهبة، حياة كاملة.",
    ),
    lead: w(
      "Construisez un soutien aux familles qui prend sa place dans la vie réelle : au quotidien, dans les transitions et dans les moments imprévus.",
      "Build family support that fits real life: everyday needs, transitions and unexpected moments.",
      "ابنوا دعماً للأسر يناسب الحياة اليومية والتحولات والظروف غير المتوقعة.",
    ),
    action: w(
      "Concevoir mon programme employeur",
      "Design my employer programme",
      "تصميم برنامج مؤسستنا",
    ),
    photo: "corporate",
    request: "corporates/request",
    audience: "corporate",
    vertical: "corporate",
    priorities: [
      w("Soutien au quotidien", "Everyday support", "الدعم اليومي"),
      w("Situations imprévues", "Unexpected situations", "الظروف غير المتوقعة"),
      w("Transitions parentales", "Parenthood transitions", "تحولات الوالدية"),
      w("Moments familles", "Family moments", "لحظات أسرية"),
    ],
    dossiers: [
      {
        title: w("Family Benefits", "Family Benefits", "مزايا الأسرة"),
        body: w(
          "Organiser un accès aux services selon votre population et votre programme.",
          "Organise service access around your people and programme.",
          "تنظيم الوصول إلى الخدمات حسب الفئات وبرنامج المؤسسة.",
        ),
        detail: w(
          "À définir ensemble : éligibilité, allocation, contribution et parcours d’utilisation.",
          "Define eligibility, allocations, contributions and the use journey together.",
          "نحدد معاً الأهلية والمخصصات والمساهمات ومسار الاستفادة.",
        ),
        photo: "family",
        href: "corporates/family-benefits",
      },
      {
        title: w(
          "Emergency Support",
          "Emergency Support",
          "الدعم في الظروف الطارئة",
        ),
        body: w(
          "Préparer une réponse lorsque l’organisation familiale est perturbée.",
          "Prepare a response when family arrangements are disrupted.",
          "إعداد استجابة عند تعطل التنظيم الأسري.",
        ),
        detail: w(
          "Le périmètre, les conditions d’accès et la disponibilité se définissent dans le programme.",
          "Scope, access conditions and availability are defined within the programme.",
          "يُحدد النطاق وشروط الوصول والتوفر ضمن البرنامج.",
        ),
        photo: "urgent",
        href: "corporates/emergency-support",
      },
      {
        title: w("Family Days", "Family Days", "أيام الأسرة"),
        body: w(
          "Donner une place aux enfants et aux familles dans la culture de votre entreprise.",
          "Make room for children and families in your company culture.",
          "منح الأطفال والأسر مكاناً في ثقافة المؤسسة.",
        ),
        detail: w(
          "Objectifs, âges, activités, lieu et coordination composent votre projet.",
          "Objectives, ages, activities, venue and coordination shape your project.",
          "تُبنى المبادرة على الأهداف والأعمار والأنشطة والمكان والتنسيق.",
        ),
        photo: "holidays",
        href: "corporates/family-days",
      },
    ],
  },
  establishments: {
    label: w("Établissements", "Establishments", "المؤسسات التعليمية"),
    eyebrow: w(
      "UN ÉTABLISSEMENT. PLUSIEURS LEVIERS. UNE DIRECTION.",
      "ONE ESTABLISHMENT. MANY LEVERS. ONE DIRECTION.",
      "مؤسسة واحدة، محاور متعددة، اتجاه واضح",
    ),
    title: w(
      "Faites grandir tout votre établissement.",
      "Help your entire establishment grow.",
      "طوّروا مؤسستكم بكل أبعادها.",
    ),
    lead: w(
      "Reliez les pratiques pédagogiques, les compétences des équipes, la confiance des parents et votre organisation. Commencez par comprendre où agir.",
      "Connect educational practice, team competencies, parent trust and organisation. Start by understanding where to act.",
      "اربطوا الممارسات التربوية وكفاءات الفرق وثقة الآباء والتنظيم، وابدؤوا بتحديد الأولويات.",
    ),
    action: w(
      "Préparer mon diagnostic",
      "Prepare my assessment",
      "إعداد طلب التقييم",
    ),
    photo: "school",
    request: "establishments/diagnostic",
    audience: "school",
    vertical: "establishment",
    priorities: [
      w("Pédagogie & espaces", "Learning & spaces", "التربية والفضاءات"),
      w("Équipe & compétences", "Team & competencies", "الفريق والكفاءات"),
      w("Confiance des parents", "Parent trust", "ثقة الآباء"),
      w("Organisation & qualité", "Organisation & quality", "التنظيم والجودة"),
    ],
    dossiers: [
      {
        title: w(
          "Comprendre votre point de départ",
          "Understand your starting point",
          "فهم نقطة الانطلاق",
        ),
        body: w(
          "Le diagnostic rassemble votre contexte et vos priorités avant de définir une intervention.",
          "An assessment brings together your context and priorities before defining an intervention.",
          "يجمع التقييم السياق والأولويات قبل تحديد التدخل.",
        ),
        detail: w(
          "Type d’établissement, publics, espaces, pratiques et organisation servent à préparer l’échange.",
          "Establishment type, audiences, spaces, practices and organisation prepare the discussion.",
          "يساعد نوع المؤسسة والفئات والفضاءات والممارسات والتنظيم في إعداد اللقاء.",
        ),
        photo: "preschool",
        href: "establishments/diagnostic",
      },
      {
        title: w(
          "Faire progresser les compétences",
          "Develop competencies",
          "تطوير الكفاءات",
        ),
        body: w(
          "Academy relie besoins d’apprentissage et parcours de formation publiés.",
          "Academy connects learning needs with published training pathways.",
          "تربط الأكاديمية الاحتياجات التعليمية بمسارات التكوين المنشورة.",
        ),
        detail: w(
          "Les modalités, prérequis et évaluations sont précisés dans le programme concerné.",
          "Delivery, prerequisites and assessments are specified in each programme.",
          "تُوضح الصيغ والمتطلبات والتقييمات في البرنامج المعني.",
        ),
        photo: "academy",
        href: "establishments/academy",
      },
      {
        title: w(
          "Structurer votre progression",
          "Structure your progress",
          "تنظيم التقدم",
        ),
        body: w(
          "Quality Check et Partner OS abordent l’évaluation et l’organisation selon votre périmètre.",
          "Quality Check and Partner OS address evaluation and organisation within your scope.",
          "يعالج فحص الجودة ونظام الشركاء التقييم والتنظيم حسب نطاقكم.",
        ),
        detail: w(
          "Chaque composante possède ses propres conditions, livrables et parcours.",
          "Each component has its own terms, deliverables and journey.",
          "لكل محور شروطه ومخرجاته ومساره.",
        ),
        photo: "desk",
        href: "quality-check",
      },
    ],
  },
  "health-partners": {
    label: w("Partenaires santé", "Health Partners", "شركاء الصحة"),
    eyebrow: w(
      "À VOS CÔTÉS. AUTOUR DES FAMILLES.",
      "ALONGSIDE YOU. AROUND FAMILIES.",
      "إلى جانبكم، لدعم الأسر",
    ),
    title: w(
      "Un accompagnement qui continue autour de la famille.",
      "Support that continues around the family.",
      "دعم يرافق الأسرة في مختلف مراحلها.",
    ),
    lead: w(
      "Maternité, retour à domicile, soutien parental et ateliers : construisez un parcours familial chaleureux, coordonné et strictement non médical.",
      "Maternity, returning home, parent support and workshops: build a warm, coordinated and strictly non-medical family pathway.",
      "الأمومة والعودة إلى المنزل ودعم الوالدين والورشات: مسار أسري إنساني ومنظم وغير طبي.",
    ),
    action: w(
      "Étudier notre partenariat",
      "Explore our partnership",
      "دراسة الشراكة",
    ),
    photo: "health",
    request: "health-partners/request",
    audience: "clinic",
    vertical: "health_partner",
    priorities: [
      w("Autour de la maternité", "Around maternity", "حول الأمومة"),
      w("Retour à domicile", "Returning home", "العودة إلى المنزل"),
      w("Soutien parental", "Parent support", "دعم الوالدين"),
      w("Ateliers familles", "Family workshops", "ورشات الأسر"),
    ],
    dossiers: [
      {
        title: w(
          "Maternité & préparation",
          "Maternity & preparation",
          "الأمومة والاستعداد",
        ),
        body: w(
          "Donner aux familles des repères pour organiser le soutien au quotidien.",
          "Give families orientation for organising everyday support.",
          "تقديم إرشادات للأسر لتنظيم الدعم اليومي.",
        ),
        detail: w(
          "Le partenaire et ANGELCARE définissent les rôles, le périmètre et la coordination.",
          "The partner and ANGELCARE define roles, scope and coordination.",
          "يحدد الشريك وأنجل كير الأدوار والنطاق والتنسيق.",
        ),
        photo: "newborn",
        href: "health-partners/maternity",
      },
      {
        title: w("Mother & Baby Care", "Mother & Baby Care", "دعم الأم والطفل"),
        body: w(
          "Explorer un soutien non médical adapté au contexte familial.",
          "Explore non-medical support adapted to the family context.",
          "استكشاف دعم غير طبي يناسب السياق الأسري.",
        ),
        detail: w(
          "Les activités autorisées, limites et modalités de relais sont explicites.",
          "Allowed activities, boundaries and handover arrangements are explicit.",
          "الأنشطة المسموح بها والحدود وصيغ الإحالة واضحة.",
        ),
        photo: "care",
        href: "health-partners/mother-baby-care",
      },
      {
        title: w(
          "Ateliers & repères",
          "Workshops & orientation",
          "ورشات وإرشادات",
        ),
        body: w(
          "Créer des temps d’échange et de découverte pour les parents.",
          "Create opportunities for parents to learn and share.",
          "إتاحة فرص للتعلم والتبادل بين الوالدين.",
        ),
        detail: w(
          "Les contenus et intervenants sont précisés pour chaque atelier publié.",
          "Content and facilitators are specified for each published workshop.",
          "تُوضح المضامين والمتدخلون لكل ورشة منشورة.",
        ),
        photo: "support",
        href: "health-partners/workshops",
      },
    ],
  },
  hospitality: {
    label: w("Hospitality", "Hospitality", "الضيافة"),
    eyebrow: w(
      "LE SÉJOUR FAMILLE DEVIENT VOTRE SIGNATURE",
      "THE FAMILY STAY BECOMES YOUR SIGNATURE",
      "الإقامة الأسرية تصبح بصمتكم",
    ),
    title: w(
      "Des enfants émerveillés. Des parents qui savourent.",
      "Wonder for children. Time for parents.",
      "دهشة للأطفال ووقت يستمتع به الوالدان.",
    ),
    lead: w(
      "Imaginez l’expérience famille dans votre propriété : découverte, activités, garde des enfants des clients et conciergerie. Chaque moment trouve sa place.",
      "Imagine the family experience at your property: discovery, activities, guest childcare and concierge. Every moment finds its place.",
      "تصوروا تجربة الأسر في منشأتكم: الاكتشاف والأنشطة ورعاية أطفال الضيوف والكونسيرج، لكل لحظة مكانها.",
    ),
    action: w(
      "Imaginer notre programme Hospitality",
      "Imagine our Hospitality programme",
      "تصميم برنامج الضيافة",
    ),
    photo: "hospitality",
    request: "hospitality/request",
    audience: "hotel",
    vertical: "hospitality",
    priorities: [
      w("Kids Club", "Kids Club", "نادي الأطفال"),
      w("Guest Childcare", "Guest Childcare", "رعاية أطفال الضيوف"),
      w("Family Concierge", "Family Concierge", "كونسيرج الأسرة"),
      w("Programmes saisonniers", "Seasonal programmes", "برامج موسمية"),
    ],
    dossiers: [
      {
        title: w("Kids Club", "Kids Club", "نادي الأطفال"),
        body: w(
          "Un univers d’activités pensé autour des âges, des espaces et de votre identité.",
          "An activity universe shaped around ages, spaces and your identity.",
          "عالم من الأنشطة مبني على الأعمار والفضاءات وهوية منشأتكم.",
        ),
        detail: w(
          "Définir ensemble : publics, capacité, rythme, encadrement, matériel et langues.",
          "Define audiences, capacity, rhythm, supervision, equipment and languages together.",
          "نحدد معاً الفئات والسعة والإيقاع والتأطير والمواد واللغات.",
        ),
        photo: "games",
        href: "hospitality/kids-club",
      },
      {
        title: w("Guest Childcare", "Guest Childcare", "رعاية أطفال الضيوف"),
        body: w(
          "Organiser la garde des enfants des clients dans le périmètre convenu.",
          "Organise guest childcare within an agreed scope.",
          "تنظيم رعاية أطفال الضيوف في النطاق المتفق عليه.",
        ),
        detail: w(
          "Réservation, consentement, langues et remise de l’enfant structurent l’expérience.",
          "Booking, consent, languages and child handover structure the experience.",
          "ينظم الحجز والموافقة واللغات وتسليم الطفل التجربة.",
        ),
        photo: "care",
        href: "hospitality/guest-childcare",
      },
      {
        title: w("Family Concierge", "Family Concierge", "كونسيرج الأسرة"),
        body: w(
          "Aider les familles à découvrir les possibilités de leur séjour.",
          "Help families discover the possibilities of their stay.",
          "مساعدة الأسر على اكتشاف إمكانات إقامتهم.",
        ),
        detail: w(
          "Repères, orientation et coordination selon les services convenus.",
          "Orientation and coordination follow the agreed services.",
          "إرشاد وتنسيق حسب الخدمات المتفق عليها.",
        ),
        photo: "family",
        href: "hospitality/family-concierge",
      },
      {
        title: w(
          "Programmes saisonniers",
          "Seasonal programmes",
          "برامج موسمية",
        ),
        body: w(
          "Donner un rythme aux vacances et aux temps forts de votre propriété.",
          "Give holidays and key property moments their own rhythm.",
          "منح العطلات والمناسبات البارزة إيقاعاً خاصاً.",
        ),
        detail: w(
          "Contenu, calendrier, espaces et préparation composent votre programme.",
          "Content, timing, spaces and preparation shape your programme.",
          "تشكل المضامين والمواعيد والفضاءات والاستعداد البرنامج.",
        ),
        photo: "holidays",
        href: "hospitality/seasonal-programs",
      },
    ],
  },
  "partner-os": {
    label: w("Partner OS", "Partner OS", "نظام الشركاء"),
    eyebrow: w(
      "VOTRE ORGANISATION, AVEC UNE DIRECTION LISIBLE",
      "YOUR ORGANISATION, WITH A CLEAR DIRECTION",
      "مؤسستكم في اتجاه واضح",
    ),
    title: w(
      "Donnez une structure à votre quotidien.",
      "Give your daily work a structure.",
      "امنحوا عملكم اليومي تنظيماً واضحاً.",
    ),
    lead: w(
      "Comprenez les espaces, les rôles, les modules et les étapes d’activation. Explorez le fonctionnement avant de choisir un plan ou une démonstration.",
      "Understand workspaces, roles, modules and activation stages. Explore how it works before choosing a plan or demonstration.",
      "افهموا فضاءات العمل والأدوار والوحدات ومراحل التفعيل قبل اختيار خطة أو عرض توضيحي.",
    ),
    action: w(
      "Préparer ma démonstration",
      "Prepare my demonstration",
      "إعداد العرض التوضيحي",
    ),
    photo: "desk",
    request: "partner-os/contact",
    audience: "partner_os",
    priorities: [
      w("Espace organisation", "Organisation workspace", "فضاء المؤسسة"),
      w("Équipe & accès", "Team & access", "الفريق والصلاحيات"),
      w("Modules & abonnement", "Modules & subscription", "الوحدات والاشتراك"),
      w(
        "Préparation & activation",
        "Readiness & activation",
        "الاستعداد والتفعيل",
      ),
    ],
    dossiers: [
      {
        title: w(
          "Un espace par organisation",
          "An organisation workspace",
          "فضاء خاص بالمؤسسة",
        ),
        body: w(
          "Identité de l’organisation, territoire, langue et état du workspace.",
          "Organisation identity, territory, language and workspace state.",
          "هوية المؤسسة والمنطقة واللغة وحالة فضاء العمل.",
        ),
        detail: w(
          "Le contexte de l’organisation détermine le périmètre des accès.",
          "Organisation context determines the access scope.",
          "يحدد سياق المؤسسة نطاق الوصول.",
        ),
        photo: "desk",
      },
      {
        title: w(
          "Des accès selon les rôles",
          "Role-based access",
          "صلاحيات حسب الأدوار",
        ),
        body: w(
          "Des membres et des droits pour organiser la participation de votre équipe.",
          "Members and permissions organise team participation.",
          "أعضاء وصلاحيات لتنظيم مشاركة الفريق.",
        ),
        detail: w(
          "Les droits disponibles suivent les autorités et les règles du portail.",
          "Available rights follow portal authorities and rules.",
          "تتبع الصلاحيات المتاحة سلطات وقواعد البوابة.",
        ),
        photo: "professional",
      },
      {
        title: w(
          "Une activation préparée",
          "Prepared activation",
          "تفعيل بعد الاستعداد",
        ),
        body: w(
          "Le plan, les modules et les contrôles de préparation composent l’activation.",
          "Plan, modules and readiness checks shape activation.",
          "تُبنى عملية التفعيل على الخطة والوحدات وفحوصات الاستعداد.",
        ),
        detail: w(
          "Les modules et limites du plan retenu sont précisés pendant la qualification.",
          "Modules and limits of the selected plan are specified during qualification.",
          "تُوضح وحدات وحدود الخطة المختارة أثناء التأهيل.",
        ),
        photo: "academy",
      },
    ],
  },
  professionals: {
    label: w("Professionnels", "Professionals", "المهنيون"),
    eyebrow: w(
      "VOTRE SAVOIR-FAIRE A UN PROCHAIN CHAPITRE",
      "YOUR EXPERTISE HAS A NEXT CHAPTER",
      "لكفاءاتكم فصل جديد",
    ),
    title: w(
      "Vos compétences. Votre direction. Votre prochain parcours.",
      "Your skills. Your direction. Your next pathway.",
      "كفاءاتكم، اتجاهكم، ومساركم القادم.",
    ),
    lead: w(
      "Découvrez les univers professionnels ANGELCARE, identifiez vos priorités de progression et préparez votre entrée dans le parcours qui vous correspond.",
      "Discover ANGELCARE professional contexts, identify development priorities and prepare the pathway that fits you.",
      "اكتشفوا المجالات المهنية لأنجل كير وحددوا أولويات تطويركم وأعدوا المسار المناسب لكم.",
    ),
    action: w(
      "Préparer mon parcours professionnel",
      "Prepare my professional pathway",
      "إعداد مساري المهني",
    ),
    photo: "professional",
    request: "professionals/join",
    audience: "provider",
    priorities: [
      w("Petite enfance", "Early childhood", "الطفولة المبكرة"),
      w("Accompagnement familial", "Family support", "دعم الأسرة"),
      w(
        "Animation & activités",
        "Activities & facilitation",
        "الأنشطة والتنشيط",
      ),
      w("Formation & progression", "Learning & progression", "التكوين والتطور"),
    ],
    dossiers: [
      {
        title: w(
          "Pratiques éducatives",
          "Educational practice",
          "الممارسات التربوية",
        ),
        body: w(
          "Observation, préparation d’activités, communication et coopération.",
          "Observation, activity preparation, communication and cooperation.",
          "الملاحظة وإعداد الأنشطة والتواصل والتعاون.",
        ),
        detail: w(
          "Les compétences et exigences dépendent du rôle et du parcours concerné.",
          "Competencies and requirements depend on the role and pathway.",
          "تختلف الكفاءات والمتطلبات حسب الدور والمسار.",
        ),
        photo: "preschool",
        href: "academy",
      },
      {
        title: w(
          "Accompagnement des familles",
          "Supporting families",
          "مرافقة الأسر",
        ),
        body: w(
          "Comprendre le contexte, organiser les temps et travailler dans un périmètre clair.",
          "Understand context, organise time and work within a clear scope.",
          "فهم السياق وتنظيم الأوقات والعمل ضمن نطاق واضح.",
        ),
        detail: w(
          "Le soutien non médical, les transmissions et les limites font partie du cadre.",
          "Non-medical support, handovers and boundaries form part of the framework.",
          "يشمل الإطار الدعم غير الطبي وتسليم المعلومات والحدود.",
        ),
        photo: "care",
        href: "home-services",
      },
      {
        title: w(
          "Apprendre & se préparer",
          "Learn & prepare",
          "التعلم والاستعداد",
        ),
        body: w(
          "Explorer les programmes publiés et clarifier votre prochain besoin d’apprentissage.",
          "Explore published programmes and clarify your next learning need.",
          "استكشاف البرامج المنشورة وتحديد الحاجة التعليمية القادمة.",
        ),
        detail: w(
          "Les prérequis, modalités et évaluations sont décrits sur le programme choisi.",
          "Prerequisites, delivery and assessments are described in the selected programme.",
          "تُعرض المتطلبات والصيغ والتقييمات في البرنامج المختار.",
        ),
        photo: "academy",
        href: "academy",
      },
    ],
  },
  "quality-check": {
    label: w("Quality Check", "Quality Check", "فحص الجودة"),
    eyebrow: w(
      "DE LA VISIBILITÉ À LA PROGRESSION",
      "FROM VISIBILITY TO PROGRESS",
      "من الرؤية الواضحة إلى التقدم",
    ),
    title: w(
      "Voir plus clair. Agir avec une direction.",
      "See clearly. Act with direction.",
      "رؤية أوضح وعمل في اتجاه محدد.",
    ),
    lead: w(
      "Comprenez le périmètre d’une évaluation, les éléments à préparer et la manière dont les constats peuvent devenir un plan de progression.",
      "Understand an evaluation scope, what to prepare and how findings can become an improvement plan.",
      "افهموا نطاق التقييم وعناصر الاستعداد وكيف تتحول الملاحظات إلى خطة تحسين.",
    ),
    action: w(
      "Préparer mon évaluation",
      "Prepare my evaluation",
      "إعداد طلب التقييم",
    ),
    photo: "school",
    request: "establishments/quality-check-360",
    audience: "school",
    vertical: "establishment",
    priorities: [
      w(
        "Pratiques & organisation",
        "Practice & organisation",
        "الممارسات والتنظيم",
      ),
      w("Équipe & compétences", "Team & competencies", "الفريق والكفاءات"),
      w("Cadre & expérience", "Environment & experience", "الإطار والتجربة"),
      w("Actions & suivi", "Actions & follow-up", "الإجراءات والمتابعة"),
    ],
    dossiers: [
      {
        title: w("Définir le périmètre", "Define the scope", "تحديد النطاق"),
        body: w(
          "Identifier les objectifs, les lieux concernés et les dimensions à examiner.",
          "Identify objectives, relevant locations and dimensions to examine.",
          "تحديد الأهداف والمواقع المعنية وأبعاد الفحص.",
        ),
        detail: w(
          "Le périmètre et la méthode applicables sont convenus avant l’intervention.",
          "Applicable scope and method are agreed before the intervention.",
          "يُتفق على النطاق والمنهج قبل التدخل.",
        ),
        photo: "school",
      },
      {
        title: w(
          "Rassembler les éléments",
          "Gather the evidence",
          "جمع العناصر",
        ),
        body: w(
          "Préparer les documents et les observations adaptés à l’évaluation convenue.",
          "Prepare documents and observations suited to the agreed evaluation.",
          "إعداد الوثائق والملاحظات المناسبة للتقييم المتفق عليه.",
        ),
        detail: w(
          "Les éléments attendus sont définis selon le contexte et le service retenu.",
          "Expected evidence is defined by context and the selected service.",
          "تُحدد العناصر المطلوبة حسب السياق والخدمة المختارة.",
        ),
        photo: "desk",
      },
      {
        title: w(
          "Organiser la progression",
          "Organise improvement",
          "تنظيم التحسين",
        ),
        body: w(
          "Relier les constats, les priorités et les actions au suivi convenu.",
          "Connect findings, priorities and actions to agreed follow-up.",
          "ربط الملاحظات والأولويات والإجراءات بالمتابعة المتفق عليها.",
        ),
        detail: w(
          "Les livrables et modalités du suivi sont précisés pendant la qualification.",
          "Deliverables and follow-up terms are specified during qualification.",
          "تُوضح المخرجات وصيغ المتابعة أثناء التأهيل.",
        ),
        photo: "professional",
      },
    ],
  },
};
export const B = {
  discover: w("Explorer", "Explore", "استكشاف"),
  prepare: w("Préparer mon projet", "Prepare my project", "إعداد المشروع"),
  offers: w(
    "Les offres de cet univers",
    "Offers in this world",
    "عروض هذا العالم",
  ),
  offersLead: w(
    "Découvrez les offres publiées, leur périmètre et leur parcours.",
    "Explore published offers, their scope and journey.",
    "استكشفوا العروض المنشورة ونطاقها ومسارها.",
  ),
  emptyOffers: w(
    "Votre projet peut commencer ici. Préparez votre demande pour préciser le périmètre adapté à votre contexte.",
    "Your project can start here. Prepare your enquiry to define a scope suited to your context.",
    "يمكن أن يبدأ مشروعكم هنا. أعدوا الطلب لتحديد النطاق المناسب لسياقكم.",
  ),
  published: w("Offres publiées", "Published offers", "عروض منشورة"),
  all: w("Tout", "All", "الكل"),
  search: w("Chercher dans les offres", "Search offers", "البحث في العروض"),
  more: w("Afficher plus d’offres", "Show more offers", "عرض المزيد"),
  reset: w("Réinitialiser", "Reset", "إعادة ضبط"),
  sort: w("Trier", "Sort", "ترتيب"),
  kind: w("Type d’offre", "Offer type", "نوع العرض"),
  name: w("Nom", "Name", "الاسم"),
  price: w("Prix croissant", "Price low to high", "السعر تصاعدياً"),
  noMatch: w(
    "Aucune offre ne correspond à ces filtres.",
    "No offers match these filters.",
    "لا توجد عروض تناسب المرشحات.",
  ),
  summary: w("Votre préparation", "Your preparation", "تحضيركم"),
  selected: w("Vos priorités", "Your priorities", "أولوياتكم"),
  explain: w(
    "Comprendre le fonctionnement",
    "Understand how it works",
    "فهم طريقة العمل",
  ),
  journey: w("Les prochaines étapes", "Next steps", "المراحل التالية"),
  question: w(
    "Vos questions, avant de vous lancer",
    "Your questions before getting started",
    "أسئلتكم قبل الانطلاق",
  ),
  resources: w(
    "Ressources & programmes publiés",
    "Published resources & programmes",
    "موارد وبرامج منشورة",
  ),
  details: w("Approfondir", "Explore further", "التعمق"),
  contact: w(
    "Parlons de votre projet",
    "Let’s discuss your project",
    "لنتحدث عن مشروعكم",
  ),
  contactLead: w(
    "Partagez votre contexte et vos priorités. Votre demande sera enregistrée pour son traitement.",
    "Share your context and priorities. Your enquiry will be recorded for processing.",
    "شاركوا السياق والأولويات ليُسجل طلبكم من أجل معالجته.",
  ),
  fullName: w("Nom complet", "Full name", "الاسم الكامل"),
  organization: w("Organisation", "Organisation", "المؤسسة"),
  city: w("Ville", "City", "المدينة"),
  email: w("Email", "Email", "البريد الإلكتروني"),
  phone: w("Téléphone", "Phone", "الهاتف"),
  message: w(
    "Votre contexte et vos besoins",
    "Your context and needs",
    "السياق والاحتياجات",
  ),
  capacity: w(
    "Taille / capacité concernée",
    "Relevant size / capacity",
    "الحجم أو السعة المعنية",
  ),
  urgency: w("Votre horizon", "Your timeframe", "الأفق الزمني"),
  exploration: w("Je me renseigne", "I’m exploring", "أستكشف الخيارات"),
  quarter: w(
    "Projet envisagé sous trois mois",
    "Considering a project within three months",
    "مشروع خلال ثلاثة أشهر",
  ),
  urgent: w(
    "Besoin à étudier rapidement",
    "Need to discuss promptly",
    "حاجة للمناقشة قريباً",
  ),
  consent: w(
    "J’accepte d’être contacté au sujet de cette demande et le traitement de mes informations pour y répondre.",
    "I agree to be contacted about this enquiry and to my information being processed to respond.",
    "أوافق على التواصل بشأن هذا الطلب ومعالجة معلوماتي للرد عليه.",
  ),
  submit: w("Transmettre ma demande", "Send my enquiry", "إرسال الطلب"),
  sending: w("Enregistrement…", "Recording…", "جارٍ التسجيل…"),
  success: w(
    "Votre demande est enregistrée.",
    "Your enquiry has been recorded.",
    "تم تسجيل طلبكم.",
  ),
  reference: w("Référence", "Reference", "المرجع"),
  failure: w(
    "La demande n’a pas pu être confirmée. Vos informations restent ici : vérifiez et réessayez.",
    "Your enquiry could not be confirmed. Your information remains here: check and retry.",
    "تعذر تأكيد الطلب. تبقى معلوماتكم هنا للتحقق وإعادة المحاولة.",
  ),
  invalid: w(
    "Renseignez les champs requis, un moyen de contact et votre accord.",
    "Complete required fields, a contact method and your consent.",
    "أكملوا الحقول المطلوبة ووسيلة تواصل والموافقة.",
  ),
  useBrief: w(
    "Ajouter ma préparation au message",
    "Add my preparation to the message",
    "إضافة التحضير إلى الرسالة",
  ),
  next: w("Continuer", "Continue", "متابعة"),
  back: w("Retour à l’univers", "Back to this world", "العودة إلى العالم"),
  proof: w(
    "Un périmètre clair avant l’engagement",
    "A clear scope before commitment",
    "نطاق واضح قبل الالتزام",
  ),
  faqScope: w(
    "Comment le périmètre est-il défini ?",
    "How is the scope defined?",
    "كيف يُحدد النطاق؟",
  ),
  faqScopeBody: w(
    "Votre contexte, les objectifs et les conditions du programme ou de l’offre précisent le périmètre applicable.",
    "Your context, objectives and programme or offer terms define the applicable scope.",
    "يحدد السياق والأهداف وشروط البرنامج أو العرض النطاق المطبق.",
  ),
  faqPrice: w(
    "Où trouver les tarifs et les modalités ?",
    "Where are prices and terms available?",
    "أين أجد الأسعار والشروط؟",
  ),
  faqPriceBody: w(
    "Les offres et plans publiés présentent les informations renseignées. Une demande permet de préciser les projets qui nécessitent une qualification.",
    "Published offers and plans show their provided information. An enquiry helps clarify projects requiring qualification.",
    "تعرض العروض والخطط المنشورة المعلومات المتوفرة، ويساعد الطلب في توضيح المشاريع التي تحتاج إلى تأهيل.",
  ),
  faqStart: w(
    "Que préparer pour le premier échange ?",
    "What should I prepare for the first discussion?",
    "ماذا أعد للمناقشة الأولى؟",
  ),
  faqStartBody: w(
    "Votre contexte, les publics concernés, vos priorités et votre horizon. Les explorateurs de cette page vous aident à préparer ces éléments.",
    "Your context, relevant audiences, priorities and timeframe. This page’s explorers help you prepare them.",
    "السياق والفئات المعنية والأولويات والأفق الزمني. تساعدكم أدوات الصفحة على إعدادها.",
  ),
  nonMedical: w(
    "Accompagnement strictement non médical : ANGELCARE ne diagnostique pas, ne prescrit pas et ne remplace pas les professionnels de santé autorisés.",
    "Strictly non-medical support: ANGELCARE does not diagnose, prescribe or replace licensed health professionals.",
    "دعم غير طبي: أنجل كير لا يشخص ولا يصف علاجات ولا يحل محل المهنيين الصحيين المرخصين.",
  ),
  guide: w("Guide du fonctionnement", "How it works guide", "دليل طريقة العمل"),
  labelExample: w(
    "Structure explicative",
    "Explanatory structure",
    "بنية توضيحية",
  ),
  member: w(
    "Accès professionnel existant",
    "Existing professional access",
    "ولوج المهنيين المسجلين",
  ),
  training: w("Découvrir Academy", "Explore Academy", "اكتشاف الأكاديمية"),
  saved: w(
    "Retrouver ma sélection",
    "Return to my selection",
    "العودة إلى اختياراتي",
  ),
  compare: w("Comparer mes offres", "Compare my offers", "مقارنة العروض"),
  copied: w("Préparation copiée", "Preparation copied", "تم نسخ التحضير"),
  copy: w("Copier", "Copy", "نسخ"),
  copyError: w(
    "Copie indisponible ; sélectionnez le texte.",
    "Copy unavailable; select the text.",
    "النسخ غير متاح، حددوا النص.",
  ),
};
