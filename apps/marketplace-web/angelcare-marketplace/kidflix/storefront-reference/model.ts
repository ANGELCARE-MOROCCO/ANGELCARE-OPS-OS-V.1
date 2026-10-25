import {referenceFactoryGallery} from "./factory";
import { path, tr, type Tri, type Locale } from "../catalogue";
import type { Item, StorefrontData } from "../storefronts/model";
import { publisherGallery } from "../storefronts/publisher-assets";
import { defaultGallery } from "../editorial";
import { SUBTYPES } from "../../digital-customer-experience/reference-model";
import {
  FOCUS,
  NEEDS,
  THEMES,
  QUICK,
  focusChoices,
  needChoices,
  quickChoices,
} from "./taxonomy";
export { NEEDS, THEMES, QUICK, focusChoices, needChoices, quickChoices };
export const ART = "/kidflix/categories-reference-r1/";
export const PAGE_SIZE = 12;
export const FAMILIES = [
  "printables",
  "stories",
  "learning",
  "video",
  "audio",
  "visual-cards",
  "presentations",
  "assessments",
  "activities",
  "tools",
  "planners",
  "forms",
  "community",
  "commerce",
  "bundles",
];
export interface ReferenceMetadata {
  subtype: string;
  paper: string;
  orientation: string;
  colourMode: string;
  focus: string[];
  themes: string[];
  needs: string[];
  quick: string[];
  printAllowed: boolean;
  contentLocale: Locale;
}
export type ReferenceItem = Item;
export const subtypes = (family: string) => SUBTYPES[family]?.authored || [];
export interface Profile {
  kind: string;
  tagline: Tri;
  body: Tri;
  workflow: Tri;
  action: Tri;
  steps: Tri[];
}
export const PROFILES: Record<string, Profile> = {
  printables: {
    kind: "paper",
    tagline: [
      "Little Pages. Big Possibilities!",
      "Petites pages. Grandes possibilités !",
      "صفحات صغيرة. إمكانات كبيرة!",
    ],
    body: [
      "Thoughtful practice for curious learners. Literacy, maths, science, creativity and everyday skills. For teachers, families and learning together.",
      "Des activités pour les esprits curieux : lecture, maths, sciences, créativité et vie quotidienne. Pour les familles et les enseignants.",
      "ممارسة هادفة للمتعلمين الفضوليين. القراءة والرياضيات والعلوم والإبداع والمهارات اليومية. للمعلمين والأسر والتعلم معاً.",
    ],
    workflow: [
      "From Preview to Paper",
      "De l’aperçu au papier",
      "من المعاينة إلى الورق",
    ],
    action: [
      "Open Print Workspace",
      "Ouvrir l’atelier d’impression",
      "افتح مساحة الطباعة",
    ],
    steps: [
      ["Preview Pages", "Prévisualiser", "معاينة الصفحات"],
      ["Choose Pages", "Choisir les pages", "اختيار الصفحات"],
      ["Paper & Colour", "Papier & couleur", "الورق والألوان"],
      ["Print or Download", "Imprimer ou télécharger", "الطباعة أو التنزيل"],
    ],
  },
  stories: {
    kind: "book",
    tagline: [
      "Every Story Opens a World!",
      "Chaque histoire ouvre un monde !",
      "كل قصة تفتح عالماً!",
    ],
    body: [
      "Picture books, early readers, multilingual narratives and illustrated adventures. Read, listen, pause and talk together.",
      "Albums, premières lectures et récits multilingues. Lire, écouter et échanger ensemble.",
      "كتب مصورة وقراءات أولى وقصص متعددة اللغات. اقرأ واستمع وتوقف وتحاور معاً.",
    ],
    workflow: [
      "From First Page to Shared Story",
      "De la première page au récit partagé",
      "من الصفحة الأولى إلى القصة المشتركة",
    ],
    action: [
      "Open Reading Room",
      "Ouvrir le salon de lecture",
      "افتح غرفة القراءة",
    ],
    steps: [
      ["Choose a Story", "Choisir une histoire", "اختيار قصة"],
      ["Explore the Pages", "Explorer les pages", "استكشاف الصفحات"],
      ["Read or Listen", "Lire ou écouter", "القراءة أو الاستماع"],
      ["Reflect Together", "Échanger ensemble", "التأمل معاً"],
    ],
  },
  learning: {
    kind: "course",
    tagline: [
      "Build Knowledge. Grow Your Practice!",
      "Apprendre. Faire évoluer sa pratique !",
      "ابن المعرفة وطور ممارستك!",
    ],
    body: [
      "Structured learning for educators, families and curious learners. Explore pedagogy, communication, inquiry and practical application.",
      "Des parcours pour éducateurs, familles et apprenants : pédagogie, communication, exploration et mise en pratique.",
      "تعلم منظم للمعلمين والأسر والمتعلمين. استكشف التربية والتواصل والاستقصاء والتطبيق العملي.",
    ],
    workflow: [
      "From Learning Plan to Practice",
      "Du programme à la pratique",
      "من خطة التعلم إلى الممارسة",
    ],
    action: [
      "Open Learning Workspace",
      "Ouvrir l’espace de formation",
      "افتح مساحة التعلم",
    ],
    steps: [
      ["Explore the Programme", "Explorer le programme", "استكشاف البرنامج"],
      ["Choose a Lesson", "Choisir une leçon", "اختيار درس"],
      ["Practise & Reflect", "Pratiquer & réfléchir", "الممارسة والتأمل"],
      ["Review Your Progress", "Revoir ses progrès", "مراجعة التقدم"],
    ],
  },
  video: {
    kind: "screen",
    tagline: [
      "Watch Closely. Discover More!",
      "Observer. Comprendre. Découvrir !",
      "شاهد بتمعن واكتشف المزيد!",
    ],
    body: [
      "Practical demonstrations, creative techniques, scientific inquiry and everyday explanations. Pause, revisit and discuss what you notice.",
      "Démonstrations, création et exploration scientifique. Faire pause, revoir et discuter ses observations.",
      "عروض عملية وتقنيات إبداعية واستقصاء علمي وشروحات يومية. توقف وراجع وناقش ملاحظاتك.",
    ],
    workflow: [
      "From Watching to Understanding",
      "Du visionnage à la compréhension",
      "من المشاهدة إلى الفهم",
    ],
    action: [
      "Open Viewing Room",
      "Ouvrir la salle de visionnage",
      "افتح غرفة المشاهدة",
    ],
    steps: [
      ["Choose a Video", "Choisir une vidéo", "اختيار فيديو"],
      ["Watch in Chapters", "Voir par chapitres", "المشاهدة حسب الفصول"],
      ["Pause & Discuss", "Faire pause & discuter", "التوقف والنقاش"],
      ["Apply a Discovery", "Mettre en pratique", "تطبيق اكتشاف"],
    ],
  },
  audio: {
    kind: "sound",
    tagline: [
      "Listen. Imagine. Connect!",
      "Écouter. Imaginer. Partager !",
      "استمع وتخيل وتواصل!",
    ],
    body: [
      "Narration, language listening, thoughtful conversations, sound and music. Find listening experiences for learning, reflection and calm.",
      "Récits, langues, conversations, sons et musique. Des écoutes pour apprendre, réfléchir et se poser.",
      "سرد واستماع لغوي وحوارات وصوت وموسيقى. تجارب استماع للتعلم والتأمل والهدوء.",
    ],
    workflow: [
      "From Sound to Shared Meaning",
      "Du son au sens partagé",
      "من الصوت إلى المعنى المشترك",
    ],
    action: [
      "Open Listening Studio",
      "Ouvrir le studio d’écoute",
      "افتح استوديو الاستماع",
    ],
    steps: [
      ["Choose Your Audio", "Choisir son audio", "اختيار الصوت"],
      ["Explore Episodes", "Explorer les épisodes", "استكشاف الحلقات"],
      ["Listen & Revisit", "Écouter & réécouter", "الاستماع والمراجعة"],
      ["Respond & Reflect", "Réagir & réfléchir", "الاستجابة والتأمل"],
    ],
  },
  "visual-cards": {
    kind: "cards",
    tagline: [
      "Look Closer. Think Bigger!",
      "Observer de près. Penser plus loin !",
      "انظر عن قرب وفكر بعمق!",
    ],
    body: [
      "Photographs, concept cards, infographics, art and study sets. Compare, describe, classify and build meaning through images.",
      "Photos, cartes de concepts, infographies et art. Comparer, décrire, classer et comprendre par l’image.",
      "صور وبطاقات مفاهيم ورسوم معلوماتية وفنون. قارن وصف وصنف وابن المعنى عبر الصور.",
    ],
    workflow: [
      "From Image to Insight",
      "De l’image à la compréhension",
      "من الصورة إلى الفهم",
    ],
    action: [
      "Open Visual Collection",
      "Ouvrir la collection visuelle",
      "افتح المجموعة البصرية",
    ],
    steps: [
      ["Choose a Collection", "Choisir une collection", "اختيار مجموعة"],
      ["Inspect the Images", "Observer les images", "فحص الصور"],
      ["Compare & Recall", "Comparer & se rappeler", "المقارنة والتذكر"],
      ["Talk About Connections", "Discuter des liens", "مناقشة الروابط"],
    ],
  },
  presentations: {
    kind: "slides",
    tagline: [
      "Make Every Idea Visible!",
      "Donner vie à chaque idée !",
      "اجعل كل فكرة مرئية!",
    ],
    body: [
      "Project decks, educational slides, frame stories and professional workshops. Prepare a clear sequence and invite meaningful participation.",
      "Diaporamas de projets, récits en images et ateliers. Préparer un déroulé clair et favoriser la participation.",
      "عروض مشاريع وشرائح تعليمية وقصص مصورة وورش مهنية. أعد تسلسلاً واضحاً وشجع المشاركة الهادفة.",
    ],
    workflow: [
      "From Preparation to Presentation",
      "De la préparation à la présentation",
      "من الإعداد إلى العرض",
    ],
    action: [
      "Open Presentation Space",
      "Ouvrir l’espace de présentation",
      "افتح مساحة العرض",
    ],
    steps: [
      ["Choose a Deck", "Choisir un diaporama", "اختيار عرض"],
      ["Inspect the Sequence", "Examiner le déroulé", "فحص التسلسل"],
      ["Present & Navigate", "Présenter & naviguer", "العرض والتنقل"],
      ["Discuss & Follow Up", "Échanger & prolonger", "النقاش والمتابعة"],
    ],
  },
  assessments: {
    kind: "quiz",
    tagline: [
      "Discover Strengths. Guide Next Steps!",
      "Repérer les acquis. Guider la suite !",
      "اكتشف نقاط القوة ووجه الخطوات التالية!",
    ],
    body: [
      "Learning checks, practice quizzes, interests and skill exploration. Explore published questions and feedback with care and purpose.",
      "Repères d’apprentissage, quiz et exploration des compétences. Des questions et retours pour avancer avec discernement.",
      "فحوص تعلم واختبارات تدريب واستكشاف اهتمامات ومهارات. أسئلة وملاحظات منشورة للتقدم بهدف وعناية.",
    ],
    workflow: [
      "From Questions to Next Steps",
      "Des questions aux prochaines étapes",
      "من الأسئلة إلى الخطوات التالية",
    ],
    action: [
      "Open Assessment Space",
      "Ouvrir l’espace d’évaluation",
      "افتح مساحة التقييم",
    ],
    steps: [
      ["Choose an Assessment", "Choisir une évaluation", "اختيار تقييم"],
      ["Review the Instructions", "Lire les consignes", "مراجعة التعليمات"],
      ["Answer & Check", "Répondre & vérifier", "الإجابة والتحقق"],
      ["Reflect on Feedback", "Examiner les retours", "التأمل في الملاحظات"],
    ],
  },
  activities: {
    kind: "activity",
    tagline: [
      "Hands On. Minds Wide Open!",
      "Des mains actives. Des idées ouvertes !",
      "أيد تعمل وعقول تستكشف!",
    ],
    body: [
      "Educational games, STEM, creative making, discovery and role play. Prepare materials, try ideas and learn through purposeful activity.",
      "Jeux, STEM, création, découverte et jeu de rôle. Préparer, essayer et apprendre par l’action.",
      "ألعاب تعليمية وعلوم وإبداع واكتشاف ولعب أدوار. أعد المواد وجرب الأفكار وتعلم بالنشاط الهادف.",
    ],
    workflow: [
      "From Idea to Active Discovery",
      "De l’idée à la découverte active",
      "من الفكرة إلى الاكتشاف النشط",
    ],
    action: [
      "Open Activity Workshop",
      "Ouvrir l’atelier d’activités",
      "افتح ورشة الأنشطة",
    ],
    steps: [
      ["Choose an Activity", "Choisir une activité", "اختيار نشاط"],
      ["Prepare Materials", "Préparer le matériel", "إعداد المواد"],
      ["Try & Explore", "Essayer & explorer", "التجريب والاستكشاف"],
      ["Observe & Discuss", "Observer & discuter", "الملاحظة والنقاش"],
    ],
  },
  tools: {
    kind: "lab",
    tagline: [
      "Change a Variable. Explore a Possibility!",
      "Changer un paramètre. Explorer une possibilité !",
      "غير متغيراً واستكشف إمكانية!",
    ],
    body: [
      "Educational calculators, models and simulations. Compare quantities, test assumptions and interpret outcomes within each tool’s published method.",
      "Calculs, modèles et simulations éducatives. Comparer, tester et interpréter selon la méthode publiée de chaque outil.",
      "حاسبات ونماذج ومحاكاة تعليمية. قارن الكميات واختبر الافتراضات وفسر النتائج وفق منهج كل أداة المنشور.",
    ],
    workflow: [
      "From Inputs to Investigation",
      "Des paramètres à l’investigation",
      "من المدخلات إلى الاستقصاء",
    ],
    action: [
      "Open Investigation Lab",
      "Ouvrir le laboratoire",
      "افتح مختبر الاستقصاء",
    ],
    steps: [
      ["Choose a Tool", "Choisir un outil", "اختيار أداة"],
      ["Read Its Method", "Lire sa méthode", "قراءة المنهج"],
      ["Adjust & Test", "Ajuster & tester", "التعديل والاختبار"],
      ["Compare Outcomes", "Comparer les résultats", "مقارنة النتائج"],
    ],
  },
  planners: {
    kind: "plan",
    tagline: [
      "Small Plans. Meaningful Progress!",
      "De petits plans. De vrais progrès !",
      "خطط صغيرة وتقدم هادف!",
    ],
    body: [
      "Daily routines, learning goals, family meals, projects and trips. Organise practical next steps in the native personal workspace.",
      "Routines, objectifs, repas, projets et voyages. Organiser des étapes utiles dans son espace personnel.",
      "روتين وأهداف تعلم ووجبات ومشاريع ورحلات. نظم الخطوات العملية في المساحة الشخصية الأصلية.",
    ],
    workflow: [
      "From Intention to Routine",
      "De l’intention à la routine",
      "من النية إلى الروتين",
    ],
    action: [
      "Open Planning Desk",
      "Ouvrir le bureau de planification",
      "افتح مكتب التخطيط",
    ],
    steps: [
      ["Choose a Planner", "Choisir un planning", "اختيار مخطط"],
      ["Inspect Its Items", "Examiner les éléments", "فحص العناصر"],
      ["Personalise Your Plan", "Personnaliser son plan", "تخصيص الخطة"],
      ["Review & Continue", "Faire le point & continuer", "المراجعة والمتابعة"],
    ],
  },
  forms: {
    kind: "form",
    tagline: [
      "Clear Questions. Easier Next Steps!",
      "Des questions claires. Une suite plus simple !",
      "أسئلة واضحة وخطوات أسهل!",
    ],
    body: [
      "Contact, registration, applications, feedback and service requests. Choose the right published form and review its purpose before submitting.",
      "Contact, inscriptions, candidatures, retours et demandes. Choisir le bon formulaire et examiner son objet avant l’envoi.",
      "تواصل وتسجيل وطلبات وملاحظات وخدمات. اختر النموذج المنشور المناسب وراجع غرضه قبل الإرسال.",
    ],
    workflow: [
      "From Preparation to Submission",
      "De la préparation à l’envoi",
      "من الإعداد إلى الإرسال",
    ],
    action: [
      "Open Form Workspace",
      "Ouvrir l’espace formulaires",
      "افتح مساحة النماذج",
    ],
    steps: [
      [
        "Choose the Right Form",
        "Choisir le bon formulaire",
        "اختيار النموذج المناسب",
      ],
      ["Review Requirements", "Lire les exigences", "مراجعة المتطلبات"],
      ["Complete & Review", "Compléter & vérifier", "الإكمال والمراجعة"],
      [
        "Submit & Keep Receipt",
        "Envoyer & garder le reçu",
        "الإرسال والاحتفاظ بالإيصال",
      ],
    ],
  },
  community: {
    kind: "community",
    tagline: [
      "Good Questions. Stronger Connections!",
      "De bonnes questions. Des liens plus forts !",
      "أسئلة جيدة وروابط أقوى!",
    ],
    body: [
      "Moderated discussions, experiences, relevant questions and governed contributions. Find thoughtful exchanges for families and educators.",
      "Discussions modérées, expériences, questions et contributions encadrées. Des échanges utiles entre familles et éducateurs.",
      "نقاشات بإشراف وتجارب وأسئلة ومساهمات محكومة. تبادل هادف للأسر والمعلمين.",
    ],
    workflow: [
      "From Curiosity to Conversation",
      "De la curiosité à la conversation",
      "من الفضول إلى الحوار",
    ],
    action: [
      "Open Community Space",
      "Ouvrir l’espace communauté",
      "افتح مساحة المجتمع",
    ],
    steps: [
      ["Choose a Discussion", "Choisir une discussion", "اختيار نقاش"],
      ["Read Its Context", "Lire le contexte", "قراءة السياق"],
      [
        "Review Participation Rules",
        "Lire les règles",
        "مراجعة قواعد المشاركة",
      ],
      [
        "Contribute Thoughtfully",
        "Contribuer avec attention",
        "المساهمة بعناية",
      ],
    ],
  },
  commerce: {
    kind: "kit",
    tagline: [
      "Useful Resources. Thoughtful Choices!",
      "Des ressources utiles. Des choix éclairés !",
      "موارد مفيدة وخيارات مدروسة!",
    ],
    body: [
      "Educational toolkits, native digital delivery, relevant memberships and resource combinations. Inspect the published offer and its native destination.",
      "Kits éducatifs, livraisons numériques, adhésions et ressources associées. Examiner l’offre et sa destination native.",
      "حزم تعليمية وتسليم رقمي وعضويات وموارد مترابطة. افحص العرض المنشور ووجهته الأصلية.",
    ],
    workflow: [
      "From Discovery to the Right Resource",
      "De la découverte au bon choix",
      "من الاكتشاف إلى المورد المناسب",
    ],
    action: [
      "Open Resource Toolkit",
      "Ouvrir l’espace ressources",
      "افتح حزمة الموارد",
    ],
    steps: [
      ["Explore a Resource", "Explorer une ressource", "استكشاف مورد"],
      ["Review What Is Included", "Vérifier le contenu", "مراجعة المحتويات"],
      [
        "Inspect Access & Terms",
        "Examiner l’accès & les conditions",
        "فحص الوصول والشروط",
      ],
      [
        "Continue to Native Offer",
        "Ouvrir l’offre native",
        "المتابعة للعرض الأصلي",
      ],
    ],
  },
  bundles: {
    kind: "journey",
    tagline: [
      "Connected Resources. Bigger Possibilities!",
      "Des ressources liées. Plus de possibilités !",
      "موارد مترابطة وإمكانات أوسع!",
    ],
    body: [
      "Welcome journeys, topic collections, skill starters and classroom pathways. Follow published resource connections and keep your native progress together.",
      "Accueil, collections thématiques et parcours de classe. Suivre les liens publiés et conserver une progression cohérente.",
      "مسارات ترحيب ومجموعات موضوعية وحزم مهارات وصفوف. اتبع روابط الموارد المنشورة واحتفظ بالتقدم الأصلي.",
    ],
    workflow: [
      "From First Step to Connected Journey",
      "De la première étape au parcours relié",
      "من الخطوة الأولى إلى مسار مترابط",
    ],
    action: [
      "Open Journey Workspace",
      "Ouvrir l’espace parcours",
      "افتح مساحة المسار",
    ],
    steps: [
      ["Choose a Journey", "Choisir un parcours", "اختيار مسار"],
      [
        "Inspect Connected Steps",
        "Examiner les étapes liées",
        "فحص الخطوات المترابطة",
      ],
      [
        "Follow Native Resources",
        "Suivre les ressources natives",
        "اتباع الموارد الأصلية",
      ],
      [
        "Review Journey Progress",
        "Revoir la progression",
        "مراجعة تقدم المسار",
      ],
    ],
  },
};
export const profile = (family: string) =>
  PROFILES[family] || PROFILES.printables;
export const WORDS = {
  search: ["Search", "Rechercher", "بحث"],
  searchHelp: [
    "Search worksheets, skills, themes or learning goals…",
    "Rechercher des ressources, compétences, thèmes…",
    "ابحث عن موارد أو مهارات أو موضوعات…",
  ],
  filters: [
    "Find Their Next Great Learning Moment",
    "Trouver leur prochaine découverte",
    "اعثر على لحظة التعلم التالية",
  ],
  all: ["All options", "Toutes les options", "كل الخيارات"],
  type: ["Resource Type", "Type de ressource", "نوع المورد"],
  age: ["Age / Grade", "Âge / Niveau", "العمر والمستوى"],
  stage: ["Age / Stage", "Âge / Étape", "العمر والمرحلة"],
  subject: ["Subject", "Matière", "المادة"],
  focus: ["Learning Skill", "Compétence", "مهارة التعلم"],
  theme: ["Theme / Season", "Thème / Saison", "الموضوع والموسم"],
  language: ["Language", "Langue", "اللغة"],
  paper: ["Paper Size", "Format papier", "حجم الورق"],
  orientation: ["Orientation", "Orientation", "الاتجاه"],
  colourMode: ["Colour Mode", "Mode couleur", "نمط الألوان"],
  format: ["Format", "Format", "التنسيق"],
  audience: ["Audience", "Public", "الجمهور"],
  difficulty: ["Experience Level", "Niveau", "المستوى"],
  duration: ["Maximum Minutes", "Durée maximale", "الدقائق القصوى"],
  quick: ["Quick Filters", "Filtres rapides", "مرشحات سريعة"],
  reset: ["Reset Filters", "Réinitialiser", "إعادة ضبط المرشحات"],
  grid: ["Grid", "Grille", "شبكة"],
  list: ["List", "Liste", "قائمة"],
  results: ["resources", "ressources", "موارد"],
  categories: [
    "Explore Our Categories",
    "Explorer nos catégories",
    "استكشف فئاتنا",
  ],
  focusTitle: [
    "Browse by Learning Focus",
    "Explorer par objectif",
    "تصفح حسب مجال التعلم",
  ],
  catalogue: [
    "Resources to Explore",
    "Ressources à explorer",
    "موارد للاستكشاف",
  ],
  printables: [
    "Printables to Explore",
    "Fiches à explorer",
    "أوراق للطباعة والاستكشاف",
  ],
  viewAll: ["View All", "Tout voir", "عرض الكل"],
  sort: ["Sort", "Trier", "ترتيب"],
  new: ["Newest", "Plus récents", "الأحدث"],
  title: ["A–Z", "A–Z", "أبجدي"],
  needTitle: ["Browse by Need", "Explorer par besoin", "تصفح حسب الحاجة"],
  packs: [
    "Recommended Printable Packs",
    "Pistes de packs imprimables",
    "حزم مطبوعة مقترحة",
  ],
  collections: [
    "Collections to Explore",
    "Collections à explorer",
    "مجموعات للاستكشاف",
  ],
  packNote: [
    "Explore coordinated learning themes.",
    "Explorer des thèmes d’apprentissage coordonnés.",
    "استكشف موضوعات تعلم مترابطة.",
  ],
  ageTitle: [
    "Browse by Age / Stage",
    "Explorer par âge / étape",
    "تصفح حسب العمر والمرحلة",
  ],
  subjects: ["Browse by Subject", "Explorer par matière", "تصفح حسب المادة"],
  seasons: [
    "Seasonal Collections",
    "Collections saisonnières",
    "مجموعات موسمية",
  ],
  tools: ["Quick Tools", "Outils rapides", "أدوات سريعة"],
  progressions: [
    "Learning Progressions",
    "Progressions d’apprentissage",
    "تدرجات التعلم",
  ],
  recent: [
    "New Resources to Explore",
    "Nouvelles ressources",
    "موارد جديدة للاستكشاف",
  ],
  selection: ["In This Selection", "Dans cette sélection", "ضمن هذا الاختيار"],
  related: ["Keep Exploring", "Continuer à explorer", "تابع الاستكشاف"],
  preview: ["Preview", "Aperçu", "معاينة"],
  open: ["Open Resource", "Ouvrir la ressource", "افتح المورد"],
  download: ["Download Options", "Options de téléchargement", "خيارات التنزيل"],
  save: ["Save", "Enregistrer", "حفظ"],
  saved: ["Saved", "Enregistré", "محفوظ"],
  share: ["Share", "Partager", "مشاركة"],
  unrated: [
    "No published star rating",
    "Aucune note publiée",
    "لا يوجد تقييم نجوم منشور",
  ],
  noPreview: [
    "Preview not published",
    "Aperçu non publié",
    "المعاينة غير منشورة",
  ],
  loading: [
    "Loading resources…",
    "Chargement des ressources…",
    "جار تحميل الموارد…",
  ],
  error: [
    "Resources could not be loaded.",
    "Impossible de charger les ressources.",
    "تعذر تحميل الموارد.",
  ],
  setup: [
    "Catalogue setup is required before this category can load.",
    "La configuration du catalogue est requise pour cette catégorie.",
    "يلزم إعداد الفهرس قبل تحميل هذه الفئة.",
  ],
  retry: ["Retry", "Réessayer", "إعادة المحاولة"],
  empty: [
    "No matching published resources yet",
    "Aucune ressource publiée correspondante",
    "لا توجد موارد منشورة مطابقة بعد",
  ],
  emptyHelp: [
    "Try another selection or reset the filters.",
    "Essayez une autre sélection ou réinitialisez les filtres.",
    "جرب اختياراً آخر أو أعد ضبط المرشحات.",
  ],
  previous: ["Previous", "Précédent", "السابق"],
  next: ["Next", "Suivant", "التالي"],
  directory: [
    "Explore the Directory",
    "Explorer le répertoire",
    "استكشف الدليل",
  ],
  editorial: [
    "Choose a discovery topic. Results depend on published resource classifications.",
    "Choisir un thème. Les résultats suivent les classements des ressources publiées.",
    "اختر موضوع استكشاف. تعتمد النتائج على تصنيفات الموارد المنشورة.",
  ],
  downloadsNote: [
    "Choose a published resource. Available pages, paper settings and downloads depend on its published permissions and files.",
    "Choisissez une ressource publiée. Pages, réglages et téléchargements dépendent de ses fichiers et autorisations publiés.",
    "اختر مورداً منشوراً. تعتمد الصفحات والإعدادات والتنزيلات على ملفاته وصلاحياته المنشورة.",
  ],
  choose: ["Choose a Resource", "Choisir une ressource", "اختر مورداً"],
  noPublished: [
    "No resource is available in this selection yet.",
    "Aucune ressource disponible dans cette sélection.",
    "لا يوجد مورد متاح ضمن هذا الاختيار بعد.",
  ],
  copied: ["Link copied", "Lien copié", "تم نسخ الرابط"],
  copyError: [
    "Select and copy this link.",
    "Sélectionnez et copiez ce lien.",
    "حدد هذا الرابط وانسخه.",
  ],
} as const;
export const text = (key: keyof typeof WORDS, locale: Locale) =>
  tr(WORDS[key], locale);
export const STAGES = [
  {
    key: "toddler",
    range: [2, 3],
    title: ["Toddlers (2–3)", "Tout-petits (2–3)", "الصغار (2–3)"],
  },
  {
    key: "preschool",
    range: [3, 5],
    title: ["Preschool (3–5)", "Maternelle (3–5)", "ما قبل المدرسة (3–5)"],
  },
  {
    key: "early-primary",
    range: [5, 7],
    title: [
      "Early Primary (5–7)",
      "Début primaire (5–7)",
      "بداية الابتدائي (5–7)",
    ],
  },
  {
    key: "primary",
    range: [7, 9],
    title: ["Primary (7–9)", "Primaire (7–9)", "الابتدائي (7–9)"],
  },
  {
    key: "upper-primary",
    range: [9, 11],
    title: [
      "Upper Primary (9–11)",
      "Fin primaire (9–11)",
      "أواخر الابتدائي (9–11)",
    ],
  },
  {
    key: "middle-school",
    range: [11, 14],
    title: ["Middle School (11–14)", "Collège (11–14)", "الإعدادي (11–14)"],
  },
  {
    key: "high-school",
    range: [14, 18],
    title: ["High School (14–18)", "Lycée (14–18)", "الثانوي (14–18)"],
  },
] satisfies { key: string; range: number[]; title: Tri }[];
const enums: Record<string, string[]> = {
  sort: ["new", "title"],
  paper: ["A4", "A5", "Letter"],
  orientation: ["portrait", "landscape"],
  colourMode: ["colour", "grayscale"],
  format: ["PDF", "PNG"],
  audience: ["child", "parent", "educator", "professional", "school"],
  difficulty: ["introductory", "developing", "confident", "advanced"],
  stage: STAGES.map((s) => s.key),
};
const allowed = [
  "q",
  "subtype",
  "subject",
  "skill",
  "age",
  "stage",
  "format",
  "audience",
  "difficulty",
  "duration",
  "paper",
  "orientation",
  "colourMode",
  "focus",
  "theme",
  "need",
  "quick",
  "collection",
  "sort",
  "page",
];
export function cleanFilters(
  input: Record<string, unknown>,
  family: string,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of allowed) {
    const value = input[key];
    if (value == null || value === "") continue;
    if (
      typeof value !== "string" ||
      value.length > (key === "q" ? 100 : 200) ||
      /[\u0000-\u001f\u007f]/.test(value)
    )
      throw Error("INVALID_FILTER");
    const v = value.trim();
    if (!v) continue;
    if (["page", "age", "duration"].includes(key)) {
      const max = key === "page" ? 10000 : key === "age" ? 120 : 1440;
      if (
        !/^\d+$/.test(v) ||
        Number(v) < (key === "age" ? 0 : 1) ||
        Number(v) > max
      )
        throw Error("INVALID_FILTER");
    }
    if (enums[key] && !enums[key].includes(v)) throw Error("INVALID_FILTER");
    const options =
      key === "subtype"
        ? subtypes(family).map((x) => x.id)
        : key === "focus"
          ? focusChoices(family).map((x) => x.key)
          : key === "theme"
            ? THEMES.map((x) => x.key)
            : key === "need"
              ? needChoices(family).map((x) => x.key)
              : key === "quick"
                ? quickChoices(family).map((x) => x.key)
                : null;
    if (options && !options.includes(v)) throw Error("INVALID_FILTER");
    out[key] = v;
  }
  return out;
}
export function discoveryHref(
  locale: Locale,
  family: string,
  filters: Record<string, string> = {},
) {
  const q = new URLSearchParams(cleanFilters(filters, family));
  return (
    path(locale, "/explore/" + encodeURIComponent(family)) +
    (q.size ? "?" + q.toString() : "")
  );
}
export const detailHref = (item: Pick<Item, "key">, locale: Locale) =>
  path(locale, "/experience/" + encodeURIComponent(item.key));
export function fold(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f\u064b-\u065f\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/[٠-٩۰-۹]/g, (c) => String((c.charCodeAt(0) - 0x660) % 16))
    .toLowerCase();
}
export function classificationSearch(q: string, family: string) {
  const f = fold(q),
    result: Record<string, string> = {};
  if (!f) return result;
  for (const [key, choices] of [
    ["qFocus", focusChoices(family)],
    ["qTheme", THEMES],
    ["qSubtype", subtypes(family).map((c) => ({ key: c.id, title: c.label }))],
  ] as const) {
    const found = choices.filter((c) =>
      c.title.some((t) => fold(t).includes(f)),
    );
    if (found.length) result[key] = found.map((c) => c.key).join(",");
  }
  return result;
}
export function hasCustomGallery(data: StorefrontData, family: string) {
  const e = data.edition;
  if (!e.gallery?.length) return false;
  if (
    Object.keys(e.mediaBindings || {}).some(
      (k) => k === "hero" || k === "heroMobile" || k.startsWith("scene:"),
    )
  )
    return true;
  const identity = (g: typeof e.gallery) =>
    JSON.stringify(
      g.map((s) => [
        s.id,
        s.desktop,
        s.mobile,
        s.descriptions.en,
        s.descriptions.fr,
        s.descriptions.ar,
        s.focal.x,
        s.focal.y,
        s.mobileFocal.x,
        s.mobileFocal.y,
      ]),
    );
  return ![referenceFactoryGallery(family),publisherGallery(family), defaultGallery(family)].some(
    (g) => identity(e.gallery) === identity(g),
  );
}
export function customImage(
  edition: StorefrontData["edition"],
  family: string,
  slot: "cover" | "guidance" | "reference" | "detail",
) {
  const url = edition[slot];
  return Boolean(
    url &&
      (edition.mediaBindings?.[slot] ||
        !url.startsWith("/kidflix/storefront-publisher-20261023-r1/")),
  );
}
export function primaryCount(item: Item): { value: number; label: Tri } | null {
  const map: Record<string, [string, Tri]> = {
    printables: ["units", ["pages", "pages", "صفحات"]],
    stories: ["units", ["pages", "pages", "صفحات"]],
    learning: ["units", ["lessons", "leçons", "دروس"]],
    video: ["units", ["segments", "séquences", "مقاطع"]],
    audio: ["units", ["episodes", "épisodes", "حلقات"]],
    "visual-cards": ["cards", ["cards", "cartes", "بطاقات"]],
    presentations: ["frames", ["slides", "diapositives", "شرائح"]],
    assessments: ["questions", ["questions", "questions", "أسئلة"]],
    activities: ["steps", ["steps", "étapes", "خطوات"]],
    planners: ["items", ["items", "éléments", "عناصر"]],
    forms: ["fields", ["fields", "champs", "حقول"]],
    commerce: ["items", ["items", "éléments", "عناصر"]],
    bundles: ["steps", ["steps", "étapes", "خطوات"]],
  };
  const spec = map[item.family];
  if (!spec) return null;
  let value = item.facts.counts[spec[0]] || 0;
  if (!value && item.family === "visual-cards")
    value = item.facts.counts.units || 0;
  if (!value && item.family === "learning")
    value = item.facts.counts.modules || 0;
  return value > 0 ? { value, label: spec[1] } : null;
}
export const PRINT_PACKS = [
  {
    title: [
      "School-Ready Starter Kit",
      "Kit prêt pour l’école",
      "حزمة الاستعداد للمدرسة",
    ],
    focus: "classroom",
  },
  {
    title: [
      "Phonics Play Pack",
      "Pack jeux phonologiques",
      "حزمة ألعاب الأصوات",
    ],
    focus: "phonics",
  },
  {
    title: [
      "Maths & STEM Explorers",
      "Explorateurs maths & STEM",
      "مستكشفو الرياضيات والعلوم",
    ],
    focus: "science",
  },
  {
    title: [
      "Fine Motor Workshop",
      "Atelier de motricité fine",
      "ورشة المهارات الدقيقة",
    ],
    focus: "fine-motor",
  },
  {
    title: [
      "Inclusive Classroom Kit",
      "Kit de classe inclusive",
      "حزمة الصف الدامج",
    ],
    focus: "inclusion",
  },
] satisfies { title: Tri; focus: string }[];

export function workspaceHref(item: Item, locale: Locale) {
  return (
    detailHref(item, locale) +
    (item.family === "printables" &&
    item.discovery?.printAllowed &&
    item.facts.formats.length
      ? "#r5-print-workbench"
      : "#kidflix-experience-player")
  );
}
