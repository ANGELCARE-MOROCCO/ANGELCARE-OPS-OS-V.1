import type { HomepageLocale } from "../../homepage-flagship/types";
export type Words = readonly [string, string, string];
export const words = (fr: string, en: string, ar: string): Words => [
  fr,
  en,
  ar,
];
export const translate = (value: Words, locale: HomepageLocale) =>
  value[locale === "fr" ? 0 : locale === "en" ? 1 : 2];
export const C = {
  signature: words(
    "Des enfants épanouis. Des parents sereins. Un monde à découvrir.",
    "Happy children. Supported parents. A world to discover.",
    "أطفال سعداء. آباء مطمئنون. عالم للاكتشاف.",
  ),
  heroLead: words(
    "Un relais à la maison. Le jeu qui fait grandir. Le kit qu’ils auront envie d’ouvrir. Explorez tout AngelCare, selon votre vie.",
    "Support at home. Play that helps them grow. A kit they’ll want to open. Discover AngelCare, your way.",
    "دعم في البيت. لعب يساعدهم على النمو. وصندوق يتشوقون لفتحه. اكتشفوا عالم AngelCare بما يناسب حياتكم.",
  ),
  explore: words("Trouver mon univers", "Find my world", "اكتشفوا عالمكم"),
  discover: words("Découvrir les offres", "Explore offers", "استكشفوا العروض"),
  view: words("Voir les détails", "View details", "عرض التفاصيل"),
  all: words("Tout explorer", "Explore everything", "استكشفوا الكل"),
  reset: words("Tout réinitialiser", "Reset everything", "إعادة ضبط الكل"),
  search: words(
    "Un besoin, un produit, une envie…",
    "A need, a product, an idea…",
    "حاجة أو منتج أو فكرة…",
  ),
  empty: words(
    "Aucune offre ne correspond à cette sélection. Modifiez un critère ou explorez cet univers.",
    "No offer matches this selection. Change a filter or explore this world.",
    "لا يوجد عرض مطابق لهذه الخيارات. غيّروا أحد المعايير أو استكشفوا هذا العالم.",
  ),
  configured: words(
    "Des possibilités à découvrir dans les univers dédiés.",
    "More possibilities to explore in the dedicated worlds.",
    "خيارات يمكن استكشافها في العوالم المخصصة.",
  ),
  results: words(
    "offres dans votre sélection",
    "offers in your selection",
    "عروض ضمن اختياركم",
  ),
  noPrice: words("Consulter les conditions", "View conditions", "عرض الشروط"),
  quote: words("Sur devis", "On quotation", "حسب عرض السعر"),
  from: words("À partir de", "From", "ابتداءً من"),
  available: words("Disponible", "Available", "متاح"),
  limited: words("Disponibilité limitée", "Limited availability", "توفر محدود"),
  unavailable: words(
    "Indisponible actuellement",
    "Currently unavailable",
    "غير متاح حاليًا",
  ),
  conditions: words(
    "Conditions à vérifier",
    "Check conditions",
    "تحققوا من الشروط",
  ),
  save: words("Enregistrer", "Save", "حفظ"),
  unsave: words(
    "Retirer des favoris",
    "Remove from saved",
    "إزالة من المحفوظات",
  ),
  compare: words("Comparer", "Compare", "مقارنة"),
  uncompare: words(
    "Retirer de la comparaison",
    "Remove from comparison",
    "إزالة من المقارنة",
  ),
  failed: words(
    "Votre sélection n’a pas pu être enregistrée. Réessayez.",
    "Your selection could not be saved. Try again.",
    "تعذر حفظ اختياركم. حاولوا مرة أخرى.",
  ),
  compareLimit: words(
    "Comparez jusqu’à quatre offres. Retirez une offre pour en ajouter une autre.",
    "Compare up to four offers. Remove one to add another.",
    "قارنوا حتى أربعة عروض. أزيلوا عرضًا لإضافة آخر.",
  ),
  previous: words("Précédent", "Previous", "السابق"),
  next: words("Suivant", "Next", "التالي"),
  pause: words(
    "Mettre les scènes en pause",
    "Pause scenes",
    "إيقاف المشاهد مؤقتًا",
  ),
  play: words("Faire défiler les scènes", "Play scenes", "تشغيل المشاهد"),
  editorial: words("Inspiration", "Inspiration", "إلهام"),
  care: words(
    "Du temps pour vous. Un relais pour eux.",
    "Time for you. Support for them.",
    "وقت لكم ودعم لهم.",
  ),
  growth: words(
    "Leur curiosité n’a pas de limites.",
    "Their curiosity has no limits.",
    "لا حدود لفضولهم.",
  ),
  ambition: words(
    "Vos projets méritent de prendre de l’ampleur.",
    "Your plans deserve room to grow.",
    "مشاريعكم تستحق آفاقًا أوسع.",
  ),
  worldsTitle: words(
    "Douze univers. Mille façons d’avancer.",
    "Twelve worlds. Your next possibility.",
    "اثنا عشر عالمًا وخيارات جديدة.",
  ),
  worldsLead: words(
    "Pour votre famille, votre métier ou votre organisation : entrez par ce qui compte pour vous.",
    "For your family, your work or your organisation: start with what matters to you.",
    "لأسرتكم أو مهنتكم أو مؤسستكم: ابدؤوا بما يهمكم.",
  ),
  discoveryTitle: words(
    "Votre prochaine bonne idée commence ici.",
    "Your next good idea starts here.",
    "فكرتكم الجميلة التالية تبدأ هنا.",
  ),
  discoveryLead: words(
    "Choisissez votre besoin. Affinez votre rythme et l’âge. Découvrez les offres qui partagent ces caractéristiques.",
    "Choose your need. Refine the rhythm and age. Explore offers with those characteristics.",
    "حددوا احتياجكم ثم الوتيرة والعمر. اكتشفوا العروض التي توافق هذه الخصائص.",
  ),
  familyTitle: words(
    "Une vie de famille. Toutes ses facettes.",
    "Family life. Every side of it.",
    "الحياة العائلية بكل تفاصيلها.",
  ),
  familyLead: words(
    "Des matins qui démarrent mieux aux moments qu’on garde longtemps. Votre famille a son propre chemin.",
    "From smoother mornings to moments worth remembering. Your family has its own path.",
    "من صباح أكثر هدوءًا إلى لحظات تبقى في الذاكرة. لأسرتكم طريقها الخاص.",
  ),
  serviceTitle: words(
    "Un quotidien plus léger commence à la maison.",
    "A lighter day starts at home.",
    "يوم أخف يبدأ من البيت.",
  ),
  serviceLead: words(
    "Garde, accompagnement, éveil : explorez les services, leurs formats et leurs conditions avant de choisir votre relais.",
    "Care, support and discovery: explore the services, formats and conditions before choosing your support.",
    "رعاية ومرافقة وأنشطة: اكتشفوا الخدمات وصيغها وشروطها قبل اختيار الدعم المناسب.",
  ),
  rhythmTitle: words(
    "Votre rythme. Votre façon d’être accompagné.",
    "Your rhythm. Your kind of support.",
    "وتيرتكم وطريقتكم في تلقي الدعم.",
  ),
  rhythmLead: words(
    "Un besoin ponctuel, un rendez-vous régulier, une soirée ou une sortie d’école : explorez chaque format séparément.",
    "A one-time need, a regular arrangement, an evening or school pickup: explore each format separately.",
    "حاجة مؤقتة أو موعد منتظم أو مساء أو استلام من المدرسة: استكشفوا كل صيغة على حدة.",
  ),
  developmentTitle: words(
    "Le petit déclic qui ouvre un grand monde.",
    "A little spark. A bigger world.",
    "شرارة صغيرة تفتح عالمًا كبيرًا.",
  ),
  developmentLead: words(
    "Langage, autonomie, créativité, concentration. Explorez les objectifs déclarés de chaque expérience.",
    "Language, independence, creativity, focus. Explore the stated goals of each experience.",
    "لغة واستقلالية وإبداع وتركيز. اكتشفوا الأهداف المحددة لكل تجربة.",
  ),
  kitsTitle: words(
    "Ouvrez une boîte. Ouvrez des possibilités.",
    "Open a box. Open possibilities.",
    "افتحوا صندوقًا واكتشفوا آفاقًا.",
  ),
  kitsLead: words(
    "Prenez le temps de regarder. Découvrez un kit, ses composants renseignés et les conditions de son offre.",
    "Take a closer look. Explore a kit, its listed components and the conditions of its offer.",
    "تأملوا التفاصيل. اكتشفوا المجموعة ومكوناتها المذكورة وشروط عرضها.",
  ),
  kitFallback: words(
    "Des idées à manipuler, à partager, à réinventer.",
    "Ideas to touch, share and reinvent.",
    "أفكار للمس والمشاركة وإعادة الاكتشاف.",
  ),
  contents: words("Dans ce kit", "Inside this kit", "محتويات المجموعة"),
  contentsMissing: words(
    "Consultez la fiche pour le contenu et les conditions.",
    "See the offer page for contents and conditions.",
    "راجعوا صفحة العرض لمعرفة المحتويات والشروط.",
  ),
  galleryTitle: words(
    "Le plaisir de choisir, jusque dans les détails.",
    "The joy of choosing. Down to the details.",
    "متعة الاختيار حتى أدق التفاصيل.",
  ),
  galleryLead: words(
    "Des images complètes, des repères lisibles, des fiches à explorer. Regardez avant de vous décider.",
    "Complete images, clear details and offer pages to explore. Take a look before deciding.",
    "صور كاملة ومعلومات واضحة وصفحات للاستكشاف. شاهدوا التفاصيل قبل القرار.",
  ),
  agesTitle: words(
    "À chaque âge, une nouvelle aventure.",
    "A new adventure at every age.",
    "مغامرة جديدة في كل عمر.",
  ),
  agesLead: words(
    "Ces sélections utilisent uniquement les âges indiqués dans les offres.",
    "These selections use only the ages specified in the offers.",
    "تعتمد هذه الاختيارات على الأعمار المذكورة في العروض فقط.",
  ),
  selectionTitle: words(
    "À découvrir maintenant. À choisir à votre rythme.",
    "Discover now. Choose in your own time.",
    "اكتشفوا الآن واختاروا على وتيرتكم.",
  ),
  selectionLead: words(
    "Explorez les sélections éditoriales et les arrivées du catalogue.",
    "Explore editorial selections and catalogue arrivals.",
    "استكشفوا الاختيارات التحريرية والإضافات إلى الكتالوج.",
  ),
  pairTitle: words(
    "Et si votre besoin avait plusieurs portes d’entrée ?",
    "What if your need had more than one starting point?",
    "ماذا لو كان لاحتياجكم أكثر من نقطة بداية؟",
  ),
  pairLead: words(
    "Un service pour accompagner. Une ressource pour prolonger. Explorez chaque offre séparément, avec ses propres conditions.",
    "A service for support. A resource to continue. Explore each offer separately, with its own conditions.",
    "خدمة للمرافقة ومورد للاستمرار. اكتشفوا كل عرض على حدة وبشروطه الخاصة.",
  ),
  taxonomyTitle: words(
    "Votre raccourci vers la bonne catégorie.",
    "Your shortcut to the right category.",
    "طريقكم المباشر إلى الفئة المناسبة.",
  ),
  taxonomyLead: words(
    "Retrouvez les catégories du catalogue. Chaque page ouvre son propre univers de produits, services et sous-catégories.",
    "Explore catalogue categories. Each page opens its own world of products, services and subcategories.",
    "استكشفوا فئات الكتالوج. تفتح كل صفحة عالمها من المنتجات والخدمات والفئات الفرعية.",
  ),
  collectionsTitle: words(
    "Des collections à parcourir comme des histoires.",
    "Collections to explore like stories.",
    "مجموعات تستكشفونها مثل القصص.",
  ),
  collectionsLead: words(
    "Une nouvelle perspective sur les offres. Un fil conducteur pour votre prochaine découverte.",
    "A fresh perspective on offers. A thread to follow to your next discovery.",
    "نظرة جديدة إلى العروض وخيط يقودكم إلى اكتشافكم التالي.",
  ),
  compareTitle: words(
    "Un choix plus clair. Une décision plus sereine.",
    "A clearer choice. A calmer decision.",
    "اختيار أوضح وقرار أكثر هدوءًا.",
  ),
  compareLead: words(
    "Gardez jusqu’à quatre offres côte à côte pour lire leurs différences. Le comparateur détaille ensuite votre sélection.",
    "Keep up to four offers side by side to read their differences. Continue to the comparator for details.",
    "احتفظوا بما يصل إلى أربعة عروض جنبًا إلى جنب لفهم الاختلافات. ثم تابعوا إلى المقارنة التفصيلية.",
  ),
  compareEmpty: words(
    "Ajoutez des offres à comparer depuis les cartes.",
    "Add offers to compare from the cards.",
    "أضيفوا عروضًا للمقارنة من البطاقات.",
  ),
  academyTitle: words(
    "Apprendre change la suite.",
    "Learning changes what comes next.",
    "التعلم يغيّر ما يأتي بعده.",
  ),
  academyLead: words(
    "Pour développer votre pratique ou ouvrir une nouvelle voie : découvrez les formations et les sessions publiées.",
    "Develop your practice or open a new path: explore training and published sessions.",
    "طوروا ممارستكم أو افتحوا طريقًا جديدًا: اكتشفوا التكوينات والدورات المنشورة.",
  ),
  professionalTitle: words(
    "De belles expériences. À l’échelle de votre organisation.",
    "Beautiful experiences. At your organisation’s scale.",
    "تجارب جميلة على مستوى مؤسستكم.",
  ),
  professionalLead: words(
    "Établissements, hôtels, partenaires santé et entreprises : un point d’entrée dédié à chaque contexte.",
    "Schools, hotels, health partners and companies: a dedicated starting point for each context.",
    "مؤسسات وفنادق وشركاء صحة وشركات: نقطة بداية مخصصة لكل سياق.",
  ),
  continueTitle: words(
    "Vos découvertes restent à portée de main.",
    "Your discoveries stay close at hand.",
    "اكتشافاتكم تبقى في متناولكم.",
  ),
  saved: words("Mes favoris", "Saved offers", "العروض المحفوظة"),
  recent: words("Vus récemment", "Recently viewed", "شوهدت مؤخرًا"),
  clearRecent: words(
    "Effacer cet historique",
    "Clear this history",
    "مسح هذا السجل",
  ),
  noRecent: words(
    "Vos offres consultées apparaîtront ici, sur cet appareil.",
    "Offers you view will appear here, on this device.",
    "ستظهر هنا العروض التي شاهدتموها على هذا الجهاز.",
  ),
  noSaved: words(
    "Enregistrez une offre depuis son cœur pour la retrouver ici.",
    "Save an offer with its heart to find it here.",
    "احفظوا عرضًا عبر رمز القلب لتجدوه هنا.",
  ),
  guidanceTitle: words(
    "Parfois, une conversation fait toute la différence.",
    "Sometimes a conversation makes the difference.",
    "أحيانًا تصنع محادثة كل الفرق.",
  ),
  guidanceLead: words(
    "Vous hésitez entre deux chemins ? Préparez votre besoin et prenez contact pour préciser votre prochaine étape.",
    "Unsure which path to take? Prepare your needs and get in touch to clarify your next step.",
    "هل تترددون بين مسارين؟ جهزوا احتياجكم وتواصلوا لتحديد الخطوة التالية.",
  ),
  contact: words(
    "Parlons de votre besoin",
    "Let’s talk about your needs",
    "لنتحدث عن احتياجكم",
  ),
  trustTitle: words(
    "Choisir avec les bonnes informations.",
    "Choose with the right information.",
    "اختاروا بالمعلومات المناسبة.",
  ),
  trustLead: words(
    "Les conditions, la disponibilité et les informations de confiance vous accompagnent jusqu’à la confirmation.",
    "Conditions, availability and trust information stay with you through confirmation.",
    "الشروط والتوفر ومعلومات الثقة ترافقكم حتى التأكيد.",
  ),
  faqTitle: words(
    "Les réponses avant le prochain pas.",
    "Answers before your next step.",
    "إجابات قبل الخطوة التالية.",
  ),
  finaleTitle: words(
    "Il y a une belle suite à découvrir.",
    "There is a beautiful next chapter to discover.",
    "هناك فصل جميل آخر لاكتشافه.",
  ),
  finaleLead: words(
    "Commencez par une envie. Trouvez votre univers. Et donnez une nouvelle place aux belles possibilités.",
    "Start with an idea. Find your world. Make room for beautiful possibilities.",
    "ابدؤوا بفكرة واعثروا على عالمكم وافتحوا مساحة لخيارات جميلة.",
  ),
  years: words("ans", "years", "سنوات"),
  rhythm: words("Rythme", "Rhythm", "الوتيرة"),
  age: words("Âge", "Age", "العمر"),
  goal: words("Objectif", "Goal", "الهدف"),
  category: words("Catégorie", "Category", "الفئة"),
  sort: words("Trier", "Sort", "الترتيب"),
  curated: words("Sélection éditoriale", "Editorial order", "ترتيب تحريري"),
  low: words("Prix croissant", "Price: low to high", "السعر تصاعديًا"),
  high: words("Prix décroissant", "Price: high to low", "السعر تنازليًا"),
  featured: words("À la une", "Featured", "في الواجهة"),
  picks: words("Nos sélections", "Our selections", "اختياراتنا"),
  arrivals: words("Nouvelles découvertes", "New discoveries", "اكتشافات جديدة"),
  product: words("Produit", "Product", "منتج"),
  service: words("Service", "Service", "خدمة"),
  training: words("Formation", "Training", "تكوين"),
  kit: words("Kit", "Kit", "مجموعة"),
  audit: words("Évaluation", "Assessment", "تقييم"),
  saas_module: words("Solution partenaire", "Partner solution", "حل للشركاء"),
} as const;
export const NEEDS = [
  {
    key: "all",
    label: words("Toutes les possibilités", "Every possibility", "كل الخيارات"),
    text: words(
      "Laissez-vous inspirer.",
      "Let yourself be inspired.",
      "استلهموا أفكارًا جديدة.",
    ),
  },
  {
    key: "care",
    label: words("Trouver un relais", "Find support", "العثور على دعم"),
    text: words(
      "Du temps, autrement.",
      "Time, differently.",
      "وقت بطريقة مختلفة.",
    ),
  },
  {
    key: "baby",
    label: words("Accueillir bébé", "Welcome baby", "استقبال الرضيع"),
    text: words(
      "Entourer les premiers jours.",
      "Support the early days.",
      "دعم الأيام الأولى.",
    ),
  },
  {
    key: "learn",
    label: words("Nourrir la curiosité", "Nurture curiosity", "تنمية الفضول"),
    text: words(
      "Un petit déclic à la fois.",
      "One little spark at a time.",
      "شرارة صغيرة كل مرة.",
    ),
  },
  {
    key: "play",
    label: words("Jouer & partager", "Play & share", "اللعب والمشاركة"),
    text: words(
      "Faire place aux découvertes.",
      "Make room for discovery.",
      "مساحة للاكتشاف.",
    ),
  },
  {
    key: "professional",
    label: words("Développer mon projet", "Grow my project", "تطوير مشروعي"),
    text: words("Changer d’échelle.", "Think bigger.", "آفاق أوسع."),
  },
] as const;
export const RHYTHMS = [
  { key: "all", label: words("Tous les formats", "Every format", "كل الصيغ") },
  { key: "once", label: words("Ponctuel", "One-time", "مؤقت") },
  { key: "recurring", label: words("Régulier", "Recurring", "منتظم") },
  {
    key: "night",
    label: words("Soirée & nuit", "Evening & night", "المساء والليل"),
  },
  {
    key: "pickup",
    label: words("Sortie d’école", "School pickup", "الاستلام من المدرسة"),
  },
] as const;
export const AGES = ["all", "0-2", "3-5", "6-8", "9-12"] as const;
export const GOALS = [
  {
    key: "all",
    label: words("Tous les objectifs", "Every goal", "كل الأهداف"),
  },
  { key: "language", label: words("Langage", "Language", "اللغة") },
  { key: "autonomy", label: words("Autonomie", "Independence", "الاستقلالية") },
  { key: "creativity", label: words("Créativité", "Creativity", "الإبداع") },
  { key: "concentration", label: words("Concentration", "Focus", "التركيز") },
] as const;
export const FAQ = [
  [
    words("Par où commencer ?", "Where should I start?", "من أين أبدأ؟"),
    words(
      "Choisissez un univers ou utilisez la découverte par besoin. Chaque carte ouvre la fiche de l’offre avec ses caractéristiques et ses conditions.",
      "Choose a world or discover by need. Each card opens the offer page with its characteristics and conditions.",
      "اختاروا عالمًا أو استخدموا الاكتشاف حسب الاحتياج. تفتح كل بطاقة صفحة العرض بخصائصه وشروطه.",
    ),
  ],
  [
    words(
      "Les services sont-ils uniquement ponctuels ?",
      "Are services only one-time?",
      "هل الخدمات مؤقتة فقط؟",
    ),
    words(
      "Les formats ponctuels, réguliers, de soirée et de sortie d’école sont distincts. Chaque sélection montre les offres dont le format est explicitement renseigné.",
      "One-time, recurring, evening and school pickup are distinct formats. Each selection shows offers with an explicitly specified format.",
      "الخدمات المؤقتة والمنتظمة والمسائية والاستلام من المدرسة صيغ مختلفة. يعرض كل اختيار الخدمات ذات الصيغة المحددة صراحة.",
    ),
  ],
  [
    words(
      "Que signifie un prix sur devis ?",
      "What does on quotation mean?",
      "ماذا يعني حسب عرض السعر؟",
    ),
    words(
      "L’offre demande de préciser votre besoin. Le prix et les conditions sont confirmés dans le parcours dédié, avant votre confirmation.",
      "The offer requires more details about your needs. Price and conditions are confirmed in the dedicated journey before your confirmation.",
      "يتطلب العرض تفاصيل أكثر عن احتياجكم. يُحدد السعر والشروط في المسار المخصص قبل تأكيدكم.",
    ),
  ],
  [
    words(
      "Peut-on combiner un service et un produit ?",
      "Can I choose a service and a product?",
      "هل يمكن اختيار خدمة ومنتج؟",
    ),
    words(
      "Vous pouvez explorer les deux. Chaque offre conserve son propre prix, sa disponibilité et son parcours ; une présentation commune ne crée pas un pack.",
      "You can explore both. Each offer retains its own price, availability and journey; a shared presentation does not create a bundle.",
      "يمكنكم استكشافهما معًا. يحتفظ كل عرض بسعره وتوفره ومساره الخاص؛ العرض المشترك لا ينشئ حزمة.",
    ),
  ],
  [
    words(
      "Et pour mon organisation ?",
      "What about my organisation?",
      "وماذا عن مؤسستي؟",
    ),
    words(
      "Utilisez les univers Établissements, Hospitality, Partenaires santé ou Entreprises pour découvrir les solutions dans votre contexte.",
      "Use Establishments, Hospitality, Health Partners or Corporate to explore solutions in your context.",
      "استخدموا عوالم المؤسسات أو الضيافة أو شركاء الصحة أو الشركات لاكتشاف الحلول في سياقكم.",
    ),
  ],
] as const;
