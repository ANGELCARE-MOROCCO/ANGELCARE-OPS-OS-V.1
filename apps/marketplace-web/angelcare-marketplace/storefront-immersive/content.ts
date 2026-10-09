import type { CatalogLocale, StorefrontKey } from "../catalog-discovery/types";

export type Words = Record<CatalogLocale, string>;
export const w = (fr: string, en: string, ar: string): Words => ({
  fr,
  en,
  ar,
});
export const tr = (value: Words, locale: CatalogLocale) => value[locale];
export type ImmersiveKey = Exclude<StorefrontKey, "families" | "home-services">;
export interface Topic {
  label: Words;
  body: Words;
  query: string;
  photo: string;
}
export interface Chapter {
  title: Words;
  body: Words;
  photo: string;
}
export interface WorldProfile {
  key: ImmersiveKey;
  label: Words;
  eyebrow: Words;
  title: Words;
  lead: Words;
  photo: string;
  secondaryPhoto: string;
  color: string;
  companion: string;
  signature: Words;
  signatureLead: Words;
  topics: Topic[];
  chapters: Chapter[];
  steps: Words[];
  primary: string;
  primaryLabel: Words;
  related: StorefrontKey[];
}
const topic = (
  label: Words,
  body: Words,
  query: string,
  photo: string,
): Topic => ({ label, body, query, photo });
const chapter = (title: Words, body: Words, photo: string): Chapter => ({
  title,
  body,
  photo,
});

export const PROFILES: Record<ImmersiveKey, WorldProfile> = {
  development: {
    key: "development",
    label: w("Développement", "Development", "تنمية الطفل"),
    eyebrow: w(
      "LE MONDE GRANDIT AVEC EUX",
      "A WORLD THAT GROWS WITH THEM",
      "عالم يكبر معهم",
    ),
    title: w(
      "Petites mains. Grandes découvertes.",
      "Little hands. Extraordinary discoveries.",
      "أيدٍ صغيرة واكتشافات كبيرة.",
    ),
    lead: w(
      "Transformez la curiosité en moments de découverte. Activités, jeux et ressources : trouvez l’expérience qui fait briller leur prochaine étape.",
      "Turn curiosity into moments of discovery. Activities, games and resources for their next bright step.",
      "حوّلوا الفضول إلى لحظات اكتشاف مع أنشطة وألعاب وموارد تناسب الخطوة القادمة.",
    ),
    photo: "development",
    secondaryPhoto: "flashcards",
    color: "#9b36df",
    companion: "#f42d78",
    signature: w(
      "Le studio des petites découvertes",
      "The little-discoveries studio",
      "استوديو الاكتشافات الصغيرة",
    ),
    signatureLead: w(
      "Un âge, une envie, une activité. Composez votre point de départ à partir des données de chaque offre.",
      "An age, an interest, an activity. Build a starting point from the details of each offer.",
      "عمر واهتمام ونشاط: اختاروا نقطة البداية من تفاصيل كل عرض.",
    ),
    topics: [
      topic(
        w("Langage & expression", "Language & expression", "اللغة والتعبير"),
        w(
          "Des mots aux histoires, ouvrir la conversation.",
          "From words to stories, open a conversation.",
          "من الكلمات إلى القصص، افتحوا باب الحوار.",
        ),
        "langage",
        "flashcards",
      ),
      topic(
        w(
          "Autonomie & Montessori",
          "Independence & Montessori",
          "الاستقلالية ومونتيسوري",
        ),
        w(
          "Faire soi-même, essayer, recommencer.",
          "Do, try and try again.",
          "الإنجاز والمحاولة والتكرار.",
        ),
        "montessori",
        "montessori",
      ),
      topic(
        w("Créativité & jeux", "Creativity & play", "الإبداع واللعب"),
        w(
          "Matières, couleurs et imagination en action.",
          "Materials, colours and imagination in action.",
          "مواد وألوان وخيال يتحرك.",
        ),
        "jeu",
        "games",
      ),
      topic(
        w("Attention & apprentissage", "Focus & learning", "التركيز والتعلم"),
        w(
          "Des découvertes qui respectent le rythme de l’enfant.",
          "Discovery at a child’s own pace.",
          "اكتشافات تحترم إيقاع الطفل.",
        ),
        "apprentissage",
        "homework",
      ),
    ],
    chapters: [
      chapter(
        w(
          "Apprendre commence par jouer",
          "Learning starts with play",
          "التعلم يبدأ باللعب",
        ),
        w(
          "Une activité adaptée vaut mieux qu’un programme surchargé. Consultez l’âge, la durée et les matériaux publiés avant de choisir.",
          "Check the published age, duration and materials before choosing an activity.",
          "راجعوا العمر والمدة والمواد المنشورة قبل اختيار النشاط.",
        ),
        "games",
      ),
      chapter(
        w(
          "De la découverte à la maison",
          "Bring discovery home",
          "الاكتشاف يصل إلى البيت",
        ),
        w(
          "Associez votre prochaine activité à un kit ou une ressource, sans perdre le fil de votre objectif.",
          "Pair your next activity with a kit or resource that shares your goal.",
          "اربطوا النشاط القادم بمجموعة أو مورد يناسب هدفكم.",
        ),
        "montessori",
      ),
      chapter(
        w(
          "Le plaisir de recommencer",
          "The joy of trying again",
          "متعة المحاولة من جديد",
        ),
        w(
          "Un espace, quelques minutes, un support adapté : composez des moments qui donnent envie de revenir.",
          "A space, a few minutes and a suitable resource create moments worth returning to.",
          "مساحة ودقائق ومورد مناسب تصنع لحظات تستحق العودة.",
        ),
        "development",
      ),
    ],
    steps: [
      w("Choisir un objectif", "Choose a goal", "اختيار هدف"),
      w("Vérifier l’âge", "Check the age", "التحقق من العمر"),
      w("Explorer le contenu", "Explore the content", "استكشاف المحتوى"),
      w(
        "Suivre le parcours de l’offre",
        "Follow the offer journey",
        "متابعة مسار العرض",
      ),
    ],
    primary: "family/request",
    primaryLabel: w(
      "Être guidé pour mon enfant",
      "Get guidance for my child",
      "طلب توجيه لطفلي",
    ),
    related: ["kits", "home-services", "families"],
  },
  kits: {
    key: "kits",
    label: w("Kits & produits", "Kits & products", "المجموعات والمنتجات"),
    eyebrow: w(
      "OUVREZ UNE BOÎTE DE POSSIBILITÉS",
      "OPEN A WORLD OF POSSIBILITIES",
      "افتحوا عالماً من الإمكانات",
    ),
    title: w(
      "Le prochain « wow » tient dans leurs mains.",
      "Their next “wow” is in their hands.",
      "الاكتشاف القادم بين أيديهم.",
    ),
    lead: w(
      "Kits Montessori, jeux, flashcartes et ressources digitales. Regardez chaque détail, comparez les contenus et choisissez ce qui fait envie d’apprendre.",
      "Montessori kits, games, flashcards and digital resources. Explore every detail and compare contents before choosing.",
      "مجموعات مونتيسوري وألعاب وبطاقات وموارد رقمية: اكتشفوا التفاصيل وقارنوا المحتويات.",
    ),
    photo: "kits",
    secondaryPhoto: "flashcards",
    color: "#0873d9",
    companion: "#f42d78",
    signature: w(
      "Ouvrez le kit. Découvrez ce qu’il contient.",
      "Open the kit. Discover what is inside.",
      "افتحوا المجموعة واكتشفوا محتوياتها.",
    ),
    signatureLead: w(
      "Un explorateur de produits réels : contenus, formats et âges restent ceux de chaque fiche.",
      "A real-product explorer: contents, formats and ages come from each product record.",
      "مستكشف لمنتجات فعلية: المحتويات والأشكال والأعمار من بيانات كل منتج.",
    ),
    topics: [
      topic(
        w("Kits Montessori", "Montessori kits", "مجموعات مونتيسوري"),
        w(
          "Découvrir, manipuler, gagner en autonomie.",
          "Discover, handle, grow in independence.",
          "اكتشاف وتجريب واكتساب الاستقلالية.",
        ),
        "montessori",
        "montessori",
      ),
      topic(
        w("Flashcartes", "Flashcards", "البطاقات التعليمية"),
        w(
          "Des images qui ouvrent la conversation.",
          "Images that start conversations.",
          "صور تفتح باب الحوار.",
        ),
        "flash",
        "flashcards",
      ),
      topic(
        w("Jeux de développement", "Development games", "ألعاب تنمية المهارات"),
        w(
          "L’envie de jouer, le plaisir de progresser.",
          "The desire to play, the joy of progress.",
          "الرغبة في اللعب ومتعة التقدم.",
        ),
        "jeu",
        "games",
      ),
      topic(
        w("Ressources digitales", "Digital resources", "موارد رقمية"),
        w(
          "Découvrez le format indiqué sur chaque offre.",
          "Discover the format listed on each offer.",
          "اكتشفوا الشكل المذكور في كل عرض.",
        ),
        "digital",
        "digital",
      ),
    ],
    chapters: [
      chapter(
        w(
          "Le détail fait la différence",
          "Details make the difference",
          "التفاصيل تصنع الفرق",
        ),
        w(
          "Visualisez les images sans recadrage. Consultez les éléments inclus, le format et les conditions de chaque produit.",
          "See uncropped images and check included components, format and conditions.",
          "شاهدوا الصور كاملة وراجعوا المحتويات والشكل والشروط.",
        ),
        "kits",
      ),
      chapter(
        w(
          "Une sélection qui a du sens",
          "Build a meaningful selection",
          "اختيارات لها معنى",
        ),
        w(
          "Gardez vos favoris et comparez les offres avant d’ouvrir la fiche qui vous correspond.",
          "Save favourites and compare offers before opening the right product page.",
          "احفظوا المفضلة وقارنوا العروض قبل فتح الصفحة المناسبة.",
        ),
        "flashcards",
      ),
      chapter(
        w("Le jeu continue", "Keep the discovery going", "الاكتشاف يستمر"),
        w(
          "Passez du produit aux idées d’activités dans l’univers Développement.",
          "Move from products to activity ideas in Development.",
          "انتقلوا من المنتج إلى أفكار الأنشطة في فضاء التنمية.",
        ),
        "games",
      ),
    ],
    steps: [
      w("Explorer les formats", "Explore formats", "استكشاف الأشكال"),
      w("Comparer les contenus", "Compare contents", "مقارنة المحتويات"),
      w("Ouvrir la fiche", "Open the product page", "فتح صفحة المنتج"),
      w(
        "Commander selon les conditions",
        "Order under the listed terms",
        "الطلب حسب الشروط",
      ),
    ],
    primary: "basket",
    primaryLabel: w("Retrouver mon panier", "Open my basket", "فتح سلتي"),
    related: ["development", "families", "academy"],
  },
  academy: {
    key: "academy",
    label: w("Academy", "Academy", "الأكاديمية"),
    eyebrow: w(
      "VOTRE AMBITION MÉRITE UN PARCOURS",
      "YOUR AMBITION DESERVES A PATHWAY",
      "طموحكم يستحق مساراً",
    ),
    title: w(
      "Faites de vos compétences votre prochaine force.",
      "Make your skills your next advantage.",
      "اجعلوا مهاراتكم قوتكم القادمة.",
    ),
    lead: w(
      "Cours, programmes et parcours professionnels. Explorez les contenus publiés, comparez les modalités et construisez une prochaine étape qui vous ressemble.",
      "Explore published courses, programmes and professional pathways. Compare delivery options and build your next step.",
      "استكشفوا الدورات والبرامج والمسارات المنشورة وقارنوا أنماط التعلم لبناء خطوتكم القادمة.",
    ),
    photo: "academy",
    secondaryPhoto: "professional",
    color: "#7539d9",
    companion: "#f42d78",
    signature: w(
      "Le campus de votre prochaine étape",
      "The campus for your next step",
      "حرم خطوتكم القادمة",
    ),
    signatureLead: w(
      "Sélectionnez un programme publié ou explorez les cours du catalogue. Chaque inscription garde son propre parcours.",
      "Select a published programme or explore catalogue courses. Each enrollment keeps its own journey.",
      "اختاروا برنامجاً منشوراً أو استكشفوا الدورات، مع مسار تسجيل خاص بكل عرض.",
    ),
    topics: [
      topic(
        w("Petite enfance", "Early childhood", "الطفولة المبكرة"),
        w(
          "Les gestes et connaissances du quotidien.",
          "Everyday knowledge and practical skills.",
          "المعارف والمهارات اليومية.",
        ),
        "enfance",
        "care",
      ),
      topic(
        w(
          "Pédagogie & Montessori",
          "Teaching & Montessori",
          "التربية ومونتيسوري",
        ),
        w(
          "Donner une intention à chaque activité.",
          "Bring purpose to every activity.",
          "منح هدف لكل نشاط.",
        ),
        "montessori",
        "montessori",
      ),
      topic(
        w("Parcours professionnels", "Professional pathways", "مسارات مهنية"),
        w(
          "Choisir une progression adaptée à votre projet.",
          "Choose progress that fits your project.",
          "اختيار تقدم يناسب مشروعكم.",
        ),
        "profession",
        "professional",
      ),
      topic(
        w("Formation des équipes", "Team training", "تدريب الفرق"),
        w(
          "Des besoins partagés, un parcours à étudier.",
          "Shared needs, a pathway to discuss.",
          "احتياجات مشتركة ومسار للدراسة.",
        ),
        "formation",
        "school",
      ),
    ],
    chapters: [
      chapter(
        w(
          "Passez de l’envie à l’action",
          "Turn ambition into action",
          "من الطموح إلى العمل",
        ),
        w(
          "Objectif, public visé, contenu, modalité : prenez le temps de comparer avant l’inscription.",
          "Compare goals, audience, content and delivery before enrolling.",
          "قارنوا الأهداف والجمهور والمحتوى والنمط قبل التسجيل.",
        ),
        "academy",
      ),
      chapter(
        w(
          "Apprendre au plus près du terrain",
          "Learn close to real practice",
          "تعلم قريب من الممارسة",
        ),
        w(
          "Consultez les objectifs et compétences déclarés dans chaque programme publié.",
          "Check the objectives and skills declared in each published programme.",
          "راجعوا الأهداف والمهارات المعلنة في كل برنامج منشور.",
        ),
        "professional",
      ),
      chapter(
        w(
          "Une équipe, un projet de progression",
          "One team, a shared learning project",
          "فريق واحد ومشروع تعلم مشترك",
        ),
        w(
          "Pour une organisation, démarrez une demande Academy afin d’étudier les besoins de votre équipe.",
          "Start an Academy request to discuss your organisation’s training needs.",
          "ابدؤوا طلباً للأكاديمية لدراسة احتياجات تدريب فريقكم.",
        ),
        "school",
      ),
    ],
    steps: [
      w("Définir son objectif", "Set a goal", "تحديد الهدف"),
      w("Comparer les parcours", "Compare pathways", "مقارنة المسارات"),
      w("Vérifier les conditions", "Check conditions", "مراجعة الشروط"),
      w("Démarrer son inscription", "Start enrollment", "بدء التسجيل"),
    ],
    primary: "academy/request",
    primaryLabel: w(
      "Construire mon parcours",
      "Build my pathway",
      "بناء مساري",
    ),
    related: ["professionals", "establishments", "development"],
  },
  establishments: {
    key: "establishments",
    label: w("Établissements", "Establishments", "المؤسسات"),
    eyebrow: w(
      "VOTRE ÉTABLISSEMENT, UN NOUVEL HORIZON",
      "A NEW HORIZON FOR YOUR ESTABLISHMENT",
      "آفاق جديدة لمؤسستكم",
    ),
    title: w(
      "Faites grandir votre établissement. À tous les niveaux.",
      "Help your establishment grow. At every level.",
      "ارتقوا بمؤسستكم على جميع المستويات.",
    ),
    lead: w(
      "Crèches, écoles et structures d’accueil : reliez vos priorités à des programmes, des compétences et des outils pour préparer une transformation cohérente.",
      "Connect your nursery or school priorities to programmes, skills and tools for a coherent transformation.",
      "اربطوا أولويات حضانتكم أو مدرستكم بالبرامج والمهارات والأدوات لإعداد تحول متكامل.",
    ),
    photo: "preschool",
    secondaryPhoto: "school",
    color: "#008ba4",
    companion: "#7539d9",
    signature: w(
      "Votre carte de transformation",
      "Your transformation map",
      "خريطة تحول مؤسستكم",
    ),
    signatureLead: w(
      "Choisissez vos priorités. Préparez un résumé à partager au démarrage du diagnostic.",
      "Choose priorities and prepare a summary to share when starting your assessment.",
      "اختاروا الأولويات وأعدوا ملخصاً لمشاركته عند بدء التشخيص.",
    ),
    topics: [
      topic(
        w("Programmes éducatifs", "Educational programmes", "برامج تربوية"),
        w(
          "Une expérience enfant avec une intention claire.",
          "Child experiences with a clear purpose.",
          "تجارب للأطفال ذات هدف واضح.",
        ),
        "programme",
        "preschool",
      ),
      topic(
        w("Renfort & compétences", "Staffing & skills", "دعم الفرق والمهارات"),
        w(
          "Aligner les besoins de l’équipe et les parcours.",
          "Align team needs and learning pathways.",
          "مواءمة احتياجات الفرق والمسارات.",
        ),
        "équipe",
        "professional",
      ),
      topic(
        w("Qualité & diagnostic", "Quality & assessment", "الجودة والتشخيص"),
        w(
          "Identifier les priorités avant d’agir.",
          "Identify priorities before taking action.",
          "تحديد الأولويات قبل العمل.",
        ),
        "diagnostic",
        "support",
      ),
      topic(
        w("Organisation & outils", "Operations & tools", "التنظيم والأدوات"),
        w(
          "Explorer un système au service de votre quotidien.",
          "Explore a system for everyday operations.",
          "استكشاف نظام يخدم العمل اليومي.",
        ),
        "organisation",
        "desk",
      ),
    ],
    chapters: [
      chapter(
        w(
          "Un projet à votre échelle",
          "A project at your scale",
          "مشروع يناسب حجمكم",
        ),
        w(
          "Commencez par votre contexte : type de structure, territoire, équipe et priorités.",
          "Start with your context: organisation, territory, team and priorities.",
          "ابدؤوا بالسياق: نوع المؤسسة والنطاق والفريق والأولويات.",
        ),
        "preschool",
      ),
      chapter(
        w(
          "Connecter les bonnes expertises",
          "Connect the right expertise",
          "ربط الخبرات المناسبة",
        ),
        w(
          "Academy, Quality Check et Partner OS ouvrent des parcours complémentaires.",
          "Academy, Quality Check and Partner OS offer complementary pathways.",
          "الأكاديمية وفحص الجودة ونظام الشركاء توفر مسارات متكاملة.",
        ),
        "school",
      ),
      chapter(
        w(
          "Préparer la mise en œuvre",
          "Prepare implementation",
          "إعداد التنفيذ",
        ),
        w(
          "Le diagnostic est le point de départ pour préciser le périmètre et les conditions du projet.",
          "Assessment is the starting point for clarifying project scope and terms.",
          "التشخيص بداية لتحديد نطاق المشروع وشروطه.",
        ),
        "desk",
      ),
    ],
    steps: [
      w("Vos priorités", "Your priorities", "أولوياتكم"),
      w("Le diagnostic", "The assessment", "التشخيص"),
      w("Le périmètre convenu", "The agreed scope", "النطاق المتفق عليه"),
      w("La mise en œuvre", "Implementation", "التنفيذ"),
    ],
    primary: "establishments/diagnostic",
    primaryLabel: w(
      "Démarrer mon diagnostic",
      "Start my assessment",
      "بدء تشخيص مؤسستي",
    ),
    related: ["academy", "quality-check", "partner-os"],
  },
  hospitality: {
    key: "hospitality",
    label: w("Hospitality", "Hospitality", "الضيافة"),
    eyebrow: w(
      "L’EXPÉRIENCE FAMILLE, VOTRE SIGNATURE",
      "FAMILY EXPERIENCE, YOUR SIGNATURE",
      "تجربة العائلة بصمتكم",
    ),
    title: w(
      "Les enfants s’émerveillent. Les familles se souviennent.",
      "Children discover. Families remember.",
      "الأطفال يكتشفون والعائلات تتذكر.",
    ),
    lead: w(
      "Kids clubs, garde des enfants des clients et conciergerie famille. Imaginez une expérience qui prolonge le plaisir du séjour, puis étudiez sa mise en place.",
      "Kids clubs, guest childcare and family concierge. Shape an experience that enriches the stay, then discuss implementation.",
      "نوادي الأطفال ورعاية أطفال الضيوف والكونسيرج العائلي: صمموا تجربة تثري الإقامة ثم ادرسوا تنفيذها.",
    ),
    photo: "hospitality",
    secondaryPhoto: "holidays",
    color: "#d06b06",
    companion: "#f42d78",
    signature: w(
      "Votre séjour famille, scène par scène",
      "Your family stay, scene by scene",
      "إقامة العائلة مشهداً بمشهد",
    ),
    signatureLead: w(
      "Explorez les moments d’un séjour et les parcours correspondants de votre établissement.",
      "Explore moments in a stay and your property’s corresponding pathways.",
      "استكشفوا لحظات الإقامة والمسارات المناسبة لمنشأتكم.",
    ),
    topics: [
      topic(
        w("Kids club", "Kids club", "نادي الأطفال"),
        w(
          "Un espace pour explorer et créer.",
          "A space to explore and create.",
          "مساحة للاستكشاف والإبداع.",
        ),
        "kids",
        "games",
      ),
      topic(
        w("Guest childcare", "Guest childcare", "رعاية أطفال الضيوف"),
        w(
          "Étudier une garde adaptée aux clients.",
          "Discuss childcare tailored to guests.",
          "دراسة رعاية تناسب الضيوف.",
        ),
        "garde",
        "care",
      ),
      topic(
        w("Conciergerie famille", "Family concierge", "كونسيرج العائلات"),
        w(
          "Accompagner la découverte du séjour.",
          "Guide the family’s stay.",
          "توجيه تجربة إقامة العائلة.",
        ),
        "famille",
        "family",
      ),
      topic(
        w("Programmes saisonniers", "Seasonal programmes", "برامج موسمية"),
        w(
          "Préparer la prochaine saison ensemble.",
          "Prepare the next season together.",
          "إعداد الموسم القادم معاً.",
        ),
        "saison",
        "holidays",
      ),
    ],
    chapters: [
      chapter(
        w(
          "Du check-in aux souvenirs",
          "From check-in to memories",
          "من الوصول إلى الذكريات",
        ),
        w(
          "Dessinez le parcours famille selon votre propriété, vos espaces et vos publics.",
          "Shape the family journey around your property, spaces and guests.",
          "صمموا مسار العائلة حسب منشأتكم ومساحاتها وضيوفها.",
        ),
        "hospitality",
      ),
      chapter(
        w(
          "Une saison qui se prépare",
          "Prepare for the next season",
          "الاستعداد للموسم القادم",
        ),
        w(
          "Activités, capacité, horaires et langues se précisent dans l’étude de votre programme.",
          "Activities, capacity, hours and languages are defined in your programme study.",
          "تحدد الأنشطة والسعة والمواعيد واللغات خلال دراسة البرنامج.",
        ),
        "holidays",
      ),
      chapter(
        w(
          "Le temps de profiter",
          "Time to enjoy the stay",
          "وقت للاستمتاع بالإقامة",
        ),
        w(
          "Découvrez les parcours garde clients, kids club et conciergerie sans mélanger leurs conditions.",
          "Explore guest childcare, kids club and concierge with their distinct conditions.",
          "استكشفوا الرعاية والنادي والكونسيرج مع شروط كل مسار.",
        ),
        "family",
      ),
    ],
    steps: [
      w("Votre propriété", "Your property", "منشأتكم"),
      w("Les moments famille", "Family moments", "لحظات العائلة"),
      w("L’étude de programme", "Programme study", "دراسة البرنامج"),
      w("Le déploiement convenu", "Agreed deployment", "التنفيذ المتفق عليه"),
    ],
    primary: "hospitality/request",
    primaryLabel: w(
      "Imaginer mon programme",
      "Shape my programme",
      "تصميم برنامجي",
    ),
    related: ["home-services", "academy", "quality-check"],
  },
  "health-partners": {
    key: "health-partners",
    label: w("Partenaires santé", "Health Partners", "شركاء الصحة"),
    eyebrow: w(
      "PLUS DE PRÉSENCE POUR LES FAMILLES",
      "MORE SUPPORT FOR FAMILIES",
      "دعم أكبر للعائلات",
    ),
    title: w(
      "Entourer les familles. Avec attention et clarté.",
      "Support families. With care and clarity.",
      "دعم العائلات باهتمام ووضوح.",
    ),
    lead: w(
      "Maternités et partenaires : explorez des programmes de soutien familial non médical, des ateliers et un accompagnement du quotidien avec un cadre explicite.",
      "Explore non-medical family support programmes, workshops and everyday assistance with clear service boundaries.",
      "استكشفوا برامج دعم أسري غير طبي وورشات ومساعدة يومية ضمن إطار خدمة واضح.",
    ),
    photo: "health",
    secondaryPhoto: "newborn",
    color: "#00886d",
    companion: "#f42d78",
    signature: w(
      "Le parcours d’accompagnement familial",
      "The family-support pathway",
      "مسار دعم العائلة",
    ),
    signatureLead: w(
      "Préparer, accueillir, accompagner : explorez les besoins puis le périmètre du programme.",
      "Prepare, welcome and support: explore needs and the programme scope.",
      "إعداد واستقبال ودعم: استكشفوا الاحتياجات ونطاق البرنامج.",
    ),
    topics: [
      topic(
        w("Mother & Baby Care", "Mother & Baby Care", "دعم الأم والطفل"),
        w(
          "Présence et soutien quotidien non médical.",
          "Everyday presence and non-medical support.",
          "حضور ودعم يومي غير طبي.",
        ),
        "baby",
        "newborn",
      ),
      topic(
        w("Soutien parental", "Parent support", "دعم الوالدين"),
        w(
          "Écouter et orienter avec clarté.",
          "Listen and guide with clarity.",
          "الاستماع والتوجيه بوضوح.",
        ),
        "parent",
        "family",
      ),
      topic(
        w("Ateliers familles", "Family workshops", "ورشات للعائلات"),
        w(
          "Des moments d’information et de découverte.",
          "Moments of information and discovery.",
          "لحظات للمعلومات والاكتشاف.",
        ),
        "atelier",
        "academy",
      ),
      topic(
        w("Programmes partenaires", "Partner programmes", "برامج الشركاء"),
        w(
          "Un cadre à étudier avec votre structure.",
          "A scope to discuss with your organisation.",
          "نطاق للدراسة مع مؤسستكم.",
        ),
        "programme",
        "support",
      ),
    ],
    chapters: [
      chapter(
        w("Une présence qui compte", "Support that matters", "دعم له قيمة"),
        w(
          "L’accompagnement proposé concerne le quotidien familial et reste strictement non médical.",
          "Support concerns family life and remains strictly non-medical.",
          "الدعم يخص الحياة الأسرية ويبقى غير طبي.",
        ),
        "health",
      ),
      chapter(
        w(
          "Des limites expliquées",
          "Clear service boundaries",
          "حدود خدمة واضحة",
        ),
        w(
          "Consentement, confidentialité et périmètre de service se vérifient avant l’engagement.",
          "Consent, privacy and scope are checked before engagement.",
          "تراجع الموافقة والخصوصية والنطاق قبل الالتزام.",
        ),
        "newborn",
      ),
      chapter(
        w(
          "Relier les besoins aux bons parcours",
          "Connect needs to the right pathways",
          "ربط الاحتياجات بالمسارات المناسبة",
        ),
        w(
          "Les familles et les structures ont des demandes différentes : choisissez le parcours qui vous correspond.",
          "Families and organisations have different needs: choose your appropriate pathway.",
          "للعائلات والمؤسسات احتياجات مختلفة: اختاروا المسار المناسب.",
        ),
        "family",
      ),
    ],
    steps: [
      w("Le besoin familial", "Family need", "احتياج العائلة"),
      w("Le consentement", "Consent", "الموافقة"),
      w("Le périmètre non médical", "Non-medical scope", "النطاق غير الطبي"),
      w("Le programme convenu", "Agreed programme", "البرنامج المتفق عليه"),
    ],
    primary: "health-partners/request",
    primaryLabel: w(
      "Étudier mon programme",
      "Discuss my programme",
      "دراسة برنامجي",
    ),
    related: ["home-services", "families", "academy"],
  },
  corporates: {
    key: "corporates",
    label: w("Entreprises", "Corporate", "الشركات"),
    eyebrow: w(
      "PRENDRE SOIN DES FAMILLES, SOUTENIR LES ÉQUIPES",
      "SUPPORT FAMILIES, SUPPORT YOUR PEOPLE",
      "دعم العائلات ودعم الفرق",
    ),
    title: w(
      "Un avantage employeur qui entre dans la vraie vie.",
      "An employee benefit that fits real life.",
      "ميزة للموظفين تلائم حياتهم الفعلية.",
    ),
    lead: w(
      "Soutien parental, garde de secours, family days et programmes collaborateurs. Préparez une expérience famille à la hauteur de votre culture d’entreprise.",
      "Parent support, backup childcare, family days and employee programmes. Prepare a family experience that reflects your company culture.",
      "دعم الوالدين ورعاية بديلة وأيام عائلية وبرامج للموظفين تناسب ثقافة شركتكم.",
    ),
    photo: "corporate",
    secondaryPhoto: "family",
    color: "#0873d9",
    companion: "#f42d78",
    signature: w(
      "Le designer d’avantages familles",
      "The family-benefits designer",
      "مصمم المزايا الأسرية",
    ),
    signatureLead: w(
      "Composez vos priorités RH. Votre sélection prépare la discussion ; aucun budget ni quota n’est créé ici.",
      "Choose HR priorities to prepare a discussion. This does not create a budget or entitlement.",
      "اختاروا أولويات الموارد البشرية لإعداد النقاش دون إنشاء ميزانية أو استحقاق.",
    ),
    topics: [
      topic(
        w("Garde de secours", "Backup childcare", "رعاية بديلة"),
        w(
          "Étudier les imprévus de la vie familiale.",
          "Plan for unexpected family needs.",
          "دراسة احتياجات العائلة المفاجئة.",
        ),
        "garde",
        "care",
      ),
      topic(
        w("Parentalité", "Parent support", "دعم الوالدين"),
        w(
          "Accompagner les moments qui comptent.",
          "Support the moments that matter.",
          "دعم اللحظات المهمة.",
        ),
        "parent",
        "newborn",
      ),
      topic(
        w("Family days", "Family days", "أيام عائلية"),
        w(
          "Partager un autre moment avec les équipes.",
          "Share a different moment with your teams.",
          "مشاركة لحظات مختلفة مع الفرق.",
        ),
        "famille",
        "family",
      ),
      topic(
        w("Programme collaborateurs", "Employee programme", "برنامج الموظفين"),
        w(
          "Éligibilité et contribution à préciser ensemble.",
          "Define eligibility and contributions together.",
          "تحديد الأهلية والمساهمة معاً.",
        ),
        "programme",
        "corporate",
      ),
    ],
    chapters: [
      chapter(
        w(
          "Une politique RH plus proche du quotidien",
          "HR policy closer to everyday life",
          "سياسة موارد بشرية أقرب للحياة اليومية",
        ),
        w(
          "Commencez par vos populations et leurs besoins, puis définissez le cadre du programme.",
          "Start with your people and their needs, then define the programme scope.",
          "ابدؤوا بالموظفين واحتياجاتهم ثم حددوا إطار البرنامج.",
        ),
        "corporate",
      ),
      chapter(
        w(
          "Un cadre lisible pour les collaborateurs",
          "Clear terms for employees",
          "شروط واضحة للموظفين",
        ),
        w(
          "Éligibilité, contribution et modalités d’accès doivent être convenues avant l’activation.",
          "Eligibility, contributions and access terms are agreed before activation.",
          "تتفق الأهلية والمساهمات وشروط الوصول قبل التفعيل.",
        ),
        "family",
      ),
      chapter(
        w(
          "Connecter les bonnes solutions",
          "Connect the right solutions",
          "ربط الحلول المناسبة",
        ),
        w(
          "Découvrez les offres de ce catalogue et préparez une demande adaptée à votre entreprise.",
          "Explore this catalogue and prepare a request for your company.",
          "استكشفوا العروض وأعدوا طلباً يناسب شركتكم.",
        ),
        "desk",
      ),
    ],
    steps: [
      w("Les populations concernées", "Eligible populations", "الفئات المعنية"),
      w(
        "Les besoins prioritaires",
        "Priority needs",
        "الاحتياجات ذات الأولوية",
      ),
      w("Les règles convenues", "Agreed rules", "القواعد المتفق عليها"),
      w("L’activation du programme", "Programme activation", "تفعيل البرنامج"),
    ],
    primary: "corporates/request",
    primaryLabel: w(
      "Créer mon projet familles",
      "Start my family-benefits project",
      "بدء مشروع المزايا الأسرية",
    ),
    related: ["home-services", "partner-os", "hospitality"],
  },
  "partner-os": {
    key: "partner-os",
    label: w("Partner OS", "Partner OS", "Partner OS"),
    eyebrow: w(
      "VOTRE ORGANISATION, MIEUX CONNECTÉE",
      "YOUR ORGANISATION, BETTER CONNECTED",
      "مؤسستكم أكثر ترابطاً",
    ),
    title: w(
      "Une nouvelle perspective sur votre quotidien.",
      "A new perspective on everyday operations.",
      "منظور جديد للعمل اليومي.",
    ),
    lead: w(
      "Explorez les plans publiés, les modules déclarés et les parcours d’activation. Trouvez le cadre qui correspond à votre organisation, sans perdre la maîtrise des conditions.",
      "Explore published plans, declared modules and activation pathways. Find the right fit while keeping terms clear.",
      "استكشفوا الخطط المنشورة والوحدات المعلنة ومسارات التفعيل لاختيار الإطار المناسب.",
    ),
    photo: "desk",
    secondaryPhoto: "school",
    color: "#087da7",
    companion: "#7539d9",
    signature: w(
      "L’explorateur de plans Partner OS",
      "The Partner OS plan explorer",
      "مستكشف خطط Partner OS",
    ),
    signatureLead: w(
      "Comparez les prix et périodes réellement publiés. Une démonstration prépare votre configuration.",
      "Compare actual published prices and billing periods. A demonstration helps prepare your configuration.",
      "قارنوا الأسعار وفترات الفوترة المنشورة. العرض التوضيحي يساعد في إعداد التهيئة.",
    ),
    topics: [
      topic(
        w("Organisation", "Organisation", "التنظيم"),
        w(
          "Explorer la structure des plans.",
          "Explore how plans are structured.",
          "استكشاف بنية الخطط.",
        ),
        "organisation",
        "desk",
      ),
      topic(
        w("Équipes", "Teams", "الفرق"),
        w(
          "Étudier les besoins de vos collaborateurs.",
          "Discuss your team’s needs.",
          "دراسة احتياجات فريقكم.",
        ),
        "équipe",
        "professional",
      ),
      topic(
        w("Modules", "Modules", "الوحدات"),
        w(
          "Vérifier ce qui est inclus dans l’offre.",
          "Check what an offer includes.",
          "مراجعة ما يتضمنه العرض.",
        ),
        "module",
        "digital",
      ),
      topic(
        w("Activation", "Activation", "التفعيل"),
        w(
          "Préparer votre parcours avec l’équipe.",
          "Prepare your journey with the team.",
          "إعداد المسار مع الفريق.",
        ),
        "plan",
        "school",
      ),
    ],
    chapters: [
      chapter(
        w(
          "Voir clair avant d’activer",
          "Get clarity before activation",
          "وضوح قبل التفعيل",
        ),
        w(
          "Consultez les modules, les limites et les conditions propres au plan publié.",
          "Check the modules, limits and terms of the published plan.",
          "راجعوا الوحدات والحدود والشروط الخاصة بالخطة المنشورة.",
        ),
        "desk",
      ),
      chapter(
        w(
          "Comparer sans extrapoler",
          "Compare actual terms",
          "مقارنة الشروط الفعلية",
        ),
        w(
          "Un prix mensuel et un prix annuel restent deux conditions distinctes. Aucun tarif annuel n’est calculé ici.",
          "Monthly and annual prices are separate terms. No annual price is calculated here.",
          "السعر الشهري والسنوي شرطان مختلفان ولا يحسب سعر سنوي هنا.",
        ),
        "digital",
      ),
      chapter(
        w(
          "Une démonstration à votre contexte",
          "A demonstration for your context",
          "عرض توضيحي يناسب سياقكم",
        ),
        w(
          "Préparez vos questions puis démarrez la demande de démonstration existante.",
          "Prepare your questions and start the demonstration request.",
          "أعدوا أسئلتكم وابدؤوا طلب العرض التوضيحي.",
        ),
        "school",
      ),
    ],
    steps: [
      w("Votre organisation", "Your organisation", "مؤسستكم"),
      w("Le plan adapté", "The suitable plan", "الخطة المناسبة"),
      w("La démonstration", "The demonstration", "العرض التوضيحي"),
      w("L’activation convenue", "Agreed activation", "التفعيل المتفق عليه"),
    ],
    primary: "partner-os/contact",
    primaryLabel: w(
      "Demander une démonstration",
      "Request a demonstration",
      "طلب عرض توضيحي",
    ),
    related: ["establishments", "quality-check", "corporates"],
  },
  "quality-check": {
    key: "quality-check",
    label: w("Quality Check 360", "Quality Check 360", "Quality Check 360"),
    eyebrow: w(
      "FAIRE DE LA QUALITÉ UNE DIRECTION",
      "MAKE QUALITY YOUR DIRECTION",
      "اجعلوا الجودة وجهتكم",
    ),
    title: w(
      "Voir plus clair. Décider mieux. Avancer.",
      "See clearly. Decide better. Move forward.",
      "رؤية أوضح وقرارات أفضل وتقدم.",
    ),
    lead: w(
      "Évaluations, référentiels et accompagnement de la qualité. Explorez le périmètre d’une évaluation et préparez les questions qui comptent pour votre organisation.",
      "Explore assessments, frameworks and quality support. Define an assessment scope and prepare the questions that matter.",
      "استكشفوا التقييمات والأطر ودعم الجودة وحددوا نطاق التقييم والأسئلة المهمة.",
    ),
    photo: "support",
    secondaryPhoto: "school",
    color: "#00876b",
    companion: "#0873d9",
    signature: w(
      "La boussole de votre évaluation",
      "Your assessment compass",
      "بوصلة تقييم مؤسستكم",
    ),
    signatureLead: w(
      "Choisissez les dimensions à discuter. Ce repérage ne délivre aucun score ni certificat.",
      "Choose dimensions to discuss. This preparation does not issue a score or certificate.",
      "اختاروا الأبعاد للمناقشة. هذا الإعداد لا يمنح نتيجة أو شهادة.",
    ),
    topics: [
      topic(
        w("Cadre & organisation", "Framework & operations", "الإطار والتنظيم"),
        w(
          "Rendre le périmètre lisible.",
          "Make the scope clear.",
          "توضيح النطاق.",
        ),
        "organisation",
        "desk",
      ),
      topic(
        w("Sécurité & pratiques", "Safety & practice", "السلامة والممارسة"),
        w(
          "Explorer les critères de l’évaluation.",
          "Explore assessment criteria.",
          "استكشاف معايير التقييم.",
        ),
        "sécurité",
        "support",
      ),
      topic(
        w("Équipes & compétences", "Teams & skills", "الفرق والمهارات"),
        w(
          "Identifier les sujets à approfondir.",
          "Identify topics to explore further.",
          "تحديد المواضيع للتعمق.",
        ),
        "équipe",
        "professional",
      ),
      topic(
        w("Amélioration", "Improvement", "التحسين"),
        w(
          "Préparer des prochaines étapes discutées.",
          "Prepare the next steps to discuss.",
          "إعداد الخطوات القادمة للمناقشة.",
        ),
        "qualité",
        "school",
      ),
    ],
    chapters: [
      chapter(
        w(
          "Commencer par les bonnes questions",
          "Start with the right questions",
          "البدء بالأسئلة الصحيحة",
        ),
        w(
          "Identifiez le contexte, les documents et les domaines utiles à votre demande.",
          "Identify the context, documents and areas relevant to your request.",
          "حددوا السياق والوثائق والمجالات المناسبة لطلبكم.",
        ),
        "support",
      ),
      chapter(
        w(
          "Des preuves avant les conclusions",
          "Evidence before conclusions",
          "الأدلة قبل الاستنتاجات",
        ),
        w(
          "Les résultats et scores appartiennent à une évaluation réelle ; ce storefront présente les parcours disponibles.",
          "Results and scores come from real assessments; this page presents available pathways.",
          "النتائج من تقييمات فعلية وهذه الصفحة تعرض المسارات المتاحة.",
        ),
        "school",
      ),
      chapter(
        w(
          "Lier qualité et progression",
          "Connect quality and progress",
          "ربط الجودة والتقدم",
        ),
        w(
          "Explorez Academy et Partner OS pour compléter votre projet d’amélioration.",
          "Explore Academy and Partner OS to complement your improvement project.",
          "استكشفوا الأكاديمية ونظام الشركاء لتكملة مشروع التحسين.",
        ),
        "desk",
      ),
    ],
    steps: [
      w("Définir le périmètre", "Define scope", "تحديد النطاق"),
      w("Préparer les preuves", "Prepare evidence", "إعداد الأدلة"),
      w("Réaliser l’évaluation", "Conduct assessment", "إجراء التقييم"),
      w(
        "Étudier les prochaines actions",
        "Discuss next actions",
        "دراسة الإجراءات القادمة",
      ),
    ],
    primary: "establishments/quality-check-360",
    primaryLabel: w(
      "Explorer l’évaluation 360",
      "Explore the 360 assessment",
      "استكشاف تقييم 360",
    ),
    related: ["establishments", "academy", "partner-os"],
  },
  professionals: {
    key: "professionals",
    label: w("Professionnels", "Professionals", "المهنيون"),
    eyebrow: w(
      "VOTRE TALENT, UN NOUVEL HORIZON",
      "YOUR TALENT, A NEW HORIZON",
      "موهبتكم وآفاق جديدة",
    ),
    title: w(
      "Faites de votre prochaine étape une vraie ambition.",
      "Make your next step a real ambition.",
      "اجعلوا خطوتكم القادمة طموحاً حقيقياً.",
    ),
    lead: w(
      "Formation, compétences et parcours professionnels : explorez les offres publiées et préparez un projet qui valorise votre engagement auprès des enfants et des familles.",
      "Explore published training and professional pathways and prepare a project that values your commitment to children and families.",
      "استكشفوا التدريب والمسارات المهنية المنشورة وأعدوا مشروعاً يثمن التزامكم تجاه الأطفال والعائلات.",
    ),
    photo: "professional",
    secondaryPhoto: "academy",
    color: "#7539d9",
    companion: "#f42d78",
    signature: w(
      "La carte de votre prochaine étape",
      "Your next-step map",
      "خريطة خطوتكم القادمة",
    ),
    signatureLead: w(
      "Choisissez votre axe de progression. Les opportunités et conditions restent celles des offres publiées.",
      "Choose a direction for growth. Opportunities and terms come from published offers.",
      "اختاروا اتجاه التقدم، مع فرص وشروط حسب العروض المنشورة.",
    ),
    topics: [
      topic(
        w("Accompagnement enfance", "Childcare practice", "دعم الطفولة"),
        w(
          "Explorer les compétences du terrain.",
          "Explore hands-on skills.",
          "استكشاف المهارات العملية.",
        ),
        "enfance",
        "care",
      ),
      topic(
        w("Pédagogie", "Education", "التربية"),
        w(
          "Donner du sens aux activités.",
          "Bring purpose to activities.",
          "منح هدف للأنشطة.",
        ),
        "montessori",
        "montessori",
      ),
      topic(
        w("Formation & parcours", "Training & pathways", "التدريب والمسارات"),
        w(
          "Préparer votre prochaine compétence.",
          "Prepare your next skill.",
          "إعداد مهارتكم القادمة.",
        ),
        "formation",
        "academy",
      ),
      topic(
        w("Projet professionnel", "Professional project", "المشروع المهني"),
        w(
          "Identifier le parcours qui vous correspond.",
          "Find the pathway that fits.",
          "اختيار المسار المناسب.",
        ),
        "profession",
        "professional",
      ),
    ],
    chapters: [
      chapter(
        w(
          "Votre engagement a de la valeur",
          "Your commitment has value",
          "لالتزامكم قيمة",
        ),
        w(
          "Explorez les parcours adaptés à vos objectifs et au contexte dans lequel vous souhaitez exercer.",
          "Explore pathways for your goals and intended work context.",
          "استكشفوا مسارات تناسب أهدافكم وسياق العمل المطلوب.",
        ),
        "professional",
      ),
      chapter(
        w(
          "Renforcer sa pratique",
          "Strengthen your practice",
          "تعزيز الممارسة",
        ),
        w(
          "Les contenus, prérequis et conditions d’évaluation se consultent dans chaque offre.",
          "Check content, prerequisites and assessment conditions in each offer.",
          "راجعوا المحتوى والشروط والتقييم في كل عرض.",
        ),
        "academy",
      ),
      chapter(
        w(
          "Choisir la bonne prochaine étape",
          "Choose the right next step",
          "اختيار الخطوة القادمة المناسبة",
        ),
        w(
          "Une demande Academy permet d’étudier un parcours. Elle ne constitue pas une promesse d’emploi.",
          "An Academy request helps discuss a pathway and does not promise employment.",
          "طلب الأكاديمية لدراسة المسار ولا يمثل وعداً بالتوظيف.",
        ),
        "care",
      ),
    ],
    steps: [
      w("Votre projet", "Your project", "مشروعكم"),
      w("Les compétences visées", "Target skills", "المهارات المستهدفة"),
      w("Le parcours adapté", "The suitable pathway", "المسار المناسب"),
      w("Les conditions de l’offre", "Offer conditions", "شروط العرض"),
    ],
    primary: "academy/request",
    primaryLabel: w(
      "Préparer mon parcours professionnel",
      "Prepare my professional pathway",
      "إعداد مساري المهني",
    ),
    related: ["academy", "development", "home-services"],
  },
};

export const C = {
  explore: w("Explorer les offres", "Explore offers", "استكشاف العروض"),
  all: w("Tout explorer", "Explore all", "استكشاف الكل"),
  catalogue: w(
    "La sélection à explorer",
    "Your discovery selection",
    "اختيارات للاستكشاف",
  ),
  search: w(
    "Une envie, un mot, un objectif…",
    "An interest, a word, a goal…",
    "اهتمام أو كلمة أو هدف…",
  ),
  discover: w("Découvrir", "Discover", "اكتشف"),
  featured: w(
    "À la une de cet univers",
    "In the spotlight",
    "في واجهة هذا العالم",
  ),
  topics: w(
    "Entrez par ce qui vous inspire",
    "Start with what inspires you",
    "ابدؤوا بما يلهمكم",
  ),
  editorial: w("De nouvelles perspectives", "New perspectives", "آفاق جديدة"),
  collections: w(
    "Des collections pour vous guider",
    "Collections to guide you",
    "مجموعات لتوجيهكم",
  ),
  published: w("offres publiées", "published offers", "عروض منشورة"),
  resources: w(
    "Ressources & programmes publiés",
    "Published resources & programmes",
    "موارد وبرامج منشورة",
  ),
  empty: w(
    "Ce catalogue se prépare. Les offres apparaissent ici dès leur publication.",
    "This catalogue is being prepared. Offers appear here when published.",
    "هذا الكتالوج قيد الإعداد، وتظهر العروض عند نشرها.",
  ),
  noMatch: w(
    "Aucune offre ne correspond à ces critères. Essayez une sélection plus large.",
    "No offers match these criteria. Try a broader selection.",
    "لا عروض تطابق هذه المعايير. جربوا اختياراً أوسع.",
  ),
  emptyResources: w(
    "Les ressources publiées seront présentées ici.",
    "Published resources will appear here.",
    "ستظهر الموارد المنشورة هنا.",
  ),
  reset: w("Tout réinitialiser", "Reset all", "إعادة ضبط الكل"),
  more: w("Afficher plus d’offres", "Show more offers", "عرض المزيد"),
  save: w("Enregistrer", "Save", "حفظ"),
  saved: w("Enregistré", "Saved", "محفوظ"),
  compare: w("Comparer", "Compare", "مقارنة"),
  compareTitle: w(
    "Le bon choix se voit dans les détails",
    "The right choice is in the details",
    "الاختيار المناسب في التفاصيل",
  ),
  remove: w("Retirer", "Remove", "إزالة"),
  compareEmpty: w(
    "Ajoutez jusqu’à quatre offres avec le bouton Comparer.",
    "Add up to four offers using Compare.",
    "أضيفوا حتى أربعة عروض باستخدام المقارنة.",
  ),
  continue: w(
    "Retrouvez le fil de votre découverte",
    "Pick up where you left off",
    "تابعوا من حيث توقفتم",
  ),
  recent: w("Vus récemment", "Recently viewed", "شوهدت مؤخراً"),
  savedEmpty: w(
    "Gardez vos coups de cœur avec le bouton Enregistrer.",
    "Keep your favourites using Save.",
    "احتفظوا بالمفضلة باستخدام الحفظ.",
  ),
  recentEmpty: w(
    "Les fiches que vous ouvrez apparaîtront ici.",
    "Offer pages you open will appear here.",
    "صفحات العروض التي تفتحونها ستظهر هنا.",
  ),
  selectionError: w(
    "La sélection n’a pas pu être enregistrée. Réessayez.",
    "The selection could not be saved. Try again.",
    "تعذر حفظ الاختيار. حاولوا مجدداً.",
  ),
  compareLimit: w(
    "Quatre offres maximum. Retirez une offre avant d’en ajouter une autre.",
    "Four offers maximum. Remove one before adding another.",
    "أربعة عروض كحد أقصى. أزيلوا عرضاً قبل إضافة آخر.",
  ),
  trust: w(
    "Les détails qui vous aident à décider",
    "Details that help you decide",
    "تفاصيل تساعد على القرار",
  ),
  trustLead: w(
    "Consultez le contenu, le prix, le périmètre et les conditions de l’offre avant de poursuivre.",
    "Check content, price, scope and offer conditions before continuing.",
    "راجعوا المحتوى والسعر والنطاق والشروط قبل المتابعة.",
  ),
  journey: w(
    "Votre prochaine étape, en toute clarté",
    "A clear next step",
    "خطوة قادمة واضحة",
  ),
  related: w(
    "Votre découverte ne s’arrête pas ici",
    "There is more to discover",
    "المزيد ينتظر الاكتشاف",
  ),
  faq: w(
    "Les réponses avant de choisir",
    "Answers before you choose",
    "إجابات قبل الاختيار",
  ),
  final: w(
    "Votre prochaine étape commence ici.",
    "Your next step starts here.",
    "خطوتكم القادمة تبدأ هنا.",
  ),
  price: w("Prix", "Price", "السعر"),
  format: w("Format", "Format", "الشكل"),
  age: w("Âge", "Age", "العمر"),
  contents: w("Contenu publié", "Published contents", "المحتوى المنشور"),
  conditions: w("Consulter les conditions", "See conditions", "مراجعة الشروط"),
  available: w("Disponible", "Available", "متاح"),
  limited: w("Disponibilité limitée", "Limited availability", "توفر محدود"),
  unavailable: w(
    "Indisponible actuellement",
    "Currently unavailable",
    "غير متاح حالياً",
  ),
  quote: w("Proposition à étudier", "Discuss a proposal", "دراسة عرض"),
  noPrice: w("Prix à confirmer", "Price to confirm", "السعر للتأكيد"),
  from: w("Dès", "From", "ابتداء من"),
  type: w("Type d’offre", "Offer type", "نوع العرض"),
  availability: w("Disponibilité", "Availability", "التوفر"),
  sort: w("Trier", "Sort", "الترتيب"),
  recommended: w("Ordre du catalogue", "Catalogue order", "ترتيب الكتالوج"),
  priceAsc: w("Prix croissant", "Price: low to high", "السعر تصاعدياً"),
  priceDesc: w("Prix décroissant", "Price: high to low", "السعر تنازلياً"),
  name: w("Nom", "Name", "الاسم"),
  configuration: w("Détails de l’offre", "Offer details", "تفاصيل العرض"),
  prepare: w("Préparer mon projet", "Prepare my project", "إعداد مشروعي"),
  summary: w(
    "Votre sélection de priorités",
    "Your selected priorities",
    "أولوياتكم المختارة",
  ),
  copy: w("Copier mon résumé", "Copy my summary", "نسخ ملخصي"),
  copied: w("Résumé copié", "Summary copied", "تم نسخ الملخص"),
  copyFailed: w(
    "Copie impossible. Sélectionnez le texte du résumé.",
    "Copy failed. Select the summary text.",
    "تعذر النسخ. حددوا نص الملخص.",
  ),
  note: w(
    "Ce repérage prépare votre demande. Les conditions seront précisées dans le parcours dédié.",
    "This preparation supports your request. Terms are clarified in the dedicated journey.",
    "هذا الإعداد يدعم طلبكم وتحدد الشروط في المسار المخصص.",
  ),
  pause: w("Mettre en pause", "Pause", "إيقاف مؤقت"),
  play: w("Activer les transitions", "Enable transitions", "تفعيل الانتقالات"),
  previous: w("Précédent", "Previous", "السابق"),
  next: w("Suivant", "Next", "التالي"),
  unknown: w(
    "Non indiqué sur l’offre",
    "Not listed on the offer",
    "غير مذكور في العرض",
  ),
  noMedia: w("Visuel non renseigné", "Image not provided", "الصورة غير متوفرة"),
  planner: w("Préparation de projet", "Project preparation", "إعداد المشروع"),
  nativeLead: w(
    "Découvrez également les contenus publiés dans cet univers.",
    "Also explore the content published in this universe.",
    "استكشفوا أيضاً المحتوى المنشور في هذا العالم.",
  ),
  nonMedical: w(
    "Accompagnement non médical : aucun diagnostic, prescription ou administration de médicaments.",
    "Non-medical support: no diagnosis, prescriptions or medication administration.",
    "دعم غير طبي: دون تشخيص أو وصفات أو إعطاء أدوية.",
  ),
  months: w("mois", "months", "أشهر"),
  minutes: w("min", "min", "دقيقة"),
  years: w("ans", "years", "سنوات"),
  service: w("Service", "Service", "خدمة"),
  product: w("Produit", "Product", "منتج"),
  training: w("Formation", "Training", "تدريب"),
  audit: w("Évaluation", "Assessment", "تقييم"),
  kit: w("Kit", "Kit", "مجموعة"),
  saas_module: w("Partner OS", "Partner OS", "Partner OS"),
  monthly: w("Mensuel", "Monthly", "شهري"),
  quarterly: w("Trimestriel", "Quarterly", "ربع سنوي"),
  annual: w("Annuel", "Annual", "سنوي"),
  custom: w("Conditions spécifiques", "Custom terms", "شروط خاصة"),
  plan: w("Plan publié", "Published plan", "خطة منشورة"),
  modules: w("modules déclarés", "declared modules", "وحدات معلنة"),
  faq1: w(
    "Comment choisir la bonne offre ?",
    "How do I choose an offer?",
    "كيف أختار العرض المناسب؟",
  ),
  answer1: w(
    "Explorez les contenus, comparez les détails puis consultez la fiche. Le parcours de l’offre précise les conditions avant votre engagement.",
    "Explore content, compare details and open the offer page. Its journey clarifies terms before commitment.",
    "استكشفوا المحتوى وقارنوا التفاصيل وافتحوا صفحة العرض لتوضيح الشروط قبل الالتزام.",
  ),
  faq2: w(
    "Une offre indisponible reste-t-elle consultable ?",
    "Can I still view an unavailable offer?",
    "هل يمكن الاطلاع على عرض غير متاح؟",
  ),
  answer2: w(
    "Oui, sa fiche reste accessible. Son affichage ne garantit ni stock ni créneau ; les conditions sont vérifiées dans le parcours concerné.",
    "Yes. Its page remains accessible. Display does not guarantee stock or a slot; terms are checked in the relevant journey.",
    "نعم تبقى الصفحة متاحة. العرض لا يضمن مخزوناً أو موعداً وتراجع الشروط في المسار المعني.",
  ),
  faq3: w(
    "Puis-je préparer une sélection avant de décider ?",
    "Can I prepare a selection before deciding?",
    "هل يمكن إعداد اختيارات قبل القرار؟",
  ),
  answer3: w(
    "Enregistrez vos favoris ou comparez jusqu’à quatre offres. Les comparaisons affichent uniquement les informations renseignées.",
    "Save favourites or compare up to four offers. Comparisons show only provided information.",
    "احفظوا المفضلة أو قارنوا حتى أربعة عروض، مع المعلومات المتوفرة فقط.",
  ),
};
export const isImmersiveKey = (key: StorefrontKey): key is ImmersiveKey =>
  Object.prototype.hasOwnProperty.call(PROFILES, key);
export const photo = (key: string) => {
  const assets: Record<string, string> = {
    development: "living-world-02/development-editorial.jpg",
    academy: "living-world-02/academy-editorial.jpg",
    professional: "living-world-02/professional-editorial.jpg",
    corporate: "living-world-02/corporate-editorial-r4.jpg",
    health: "living-world-02/health-editorial-r4.jpg",
    newborn: "living-world-02/newborn-editorial-r4.jpg",
    preschool: "living-world-02/preschool-editorial-r4.jpg",
    school: "living-world-02/school-editorial-r4.jpg",
    desk: "living-world-02/desk-editorial-r4.jpg",
    support: "living-world-02/support-editorial-r4.jpg",
    flashcards: "living-world-02/flashcards-editorial-r4.jpg",
    hospitality: "living-world-02/hospitality-editorial-r4.jpg",
  };
  return `/angelcare-marketplace/${assets[key] || `families-world-r2/${key}.jpg`}`;
};
