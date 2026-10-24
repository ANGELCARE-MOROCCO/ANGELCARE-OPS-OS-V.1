import { path, tr, type Locale, type Tri, type Resource } from "./catalogue";
import { art, publisherProfile } from "./storefronts/publisher-content";

export const REFERENCE_ART = "/kidflix/reference-public-r1";
export const referenceCover = (family: string, index = 0) =>
  art(family, `hero-0${(index % 6) + 1}`);
export const discoveryHref = (
  locale: Locale,
  filters: Record<string, string> = {},
  family?: string,
) =>
  path(locale, "/explore" + (family ? "/" + family : "")) +
  (Object.values(filters).some(Boolean)
    ? "?" +
      new URLSearchParams(
        Object.entries(filters).filter(([, v]) => v),
      ).toString()
    : "");
export interface DiscoveryTopic {
  id: string;
  title: Tri;
  family: string;
  query: Tri;
  image: string;
}
export function familyTopics(family: string, offset = 0): DiscoveryTopic[] {
  return publisherProfile(family).topics.map((title, i) => ({
    id: family + "-" + i,
    title,
    family,
    query: title,
    image: referenceCover(family, i + offset),
  }));
}
export const SUBJECTS: {
  name: Tri;
  icon: string;
  query: Tri;
  family: string;
}[] = [
  {
    name: ["Mathematics", "Mathématiques", "الرياضيات"],
    icon: "Calculator",
    query: ["math", "mathématiques", "رياضيات"],
    family: "tools",
  },
  {
    name: ["Reading", "Lecture", "القراءة"],
    icon: "BookOpen",
    query: ["reading", "lecture", "قراءة"],
    family: "stories",
  },
  {
    name: ["Science", "Sciences", "العلوم"],
    icon: "FlaskConical",
    query: ["science", "sciences", "علوم"],
    family: "learning",
  },
  {
    name: ["Language", "Langage", "اللغة"],
    icon: "MessagesSquare",
    query: ["language", "langage", "لغة"],
    family: "audio",
  },
  {
    name: ["Arts & creativity", "Arts & créativité", "الفنون والإبداع"],
    icon: "Palette",
    query: ["creative", "créativité", "إبداع"],
    family: "activities",
  },
  {
    name: ["Writing", "Écriture", "الكتابة"],
    icon: "Pencil",
    query: ["writing", "écriture", "كتابة"],
    family: "printables",
  },
  {
    name: ["Reasoning", "Raisonnement", "الاستدلال"],
    icon: "Puzzle",
    query: ["reasoning", "raisonnement", "استدلال"],
    family: "assessments",
  },
  {
    name: ["Life skills", "Vie quotidienne", "مهارات الحياة"],
    icon: "Leaf",
    query: ["daily", "quotidien", "يومي"],
    family: "planners",
  },
  {
    name: ["Emotions", "Émotions", "المشاعر"],
    icon: "Heart",
    query: ["emotions", "émotions", "مشاعر"],
    family: "visual-cards",
  },
  {
    name: [
      "Professional practice",
      "Pratiques professionnelles",
      "الممارسة المهنية",
    ],
    icon: "GraduationCap",
    query: ["practice", "pratique", "ممارسة"],
    family: "documents",
  },
];
export const AGE_GROUPS: {
  title: Tri;
  caption: Tri;
  age: string;
  image: number;
}[] = [
  {
    title: ["Toddlers", "Tout-petits", "الصغار"],
    caption: ["Early discoveries", "Premières découvertes", "اكتشافات أولى"],
    age: "2",
    image: 3,
  },
  {
    title: ["Preschool", "Maternelle", "التمهيدي"],
    caption: ["Explore & play", "Explorer et jouer", "اكتشف والعب"],
    age: "4",
    image: 4,
  },
  {
    title: ["Early primary", "Début primaire", "بداية الابتدائي"],
    caption: ["Build foundations", "Construire les bases", "بناء الأسس"],
    age: "6",
    image: 5,
  },
  {
    title: ["Primary", "Primaire", "الابتدائي"],
    caption: ["Grow a skill", "Développer ses acquis", "تنمية المهارات"],
    age: "8",
    image: 6,
  },
  {
    title: ["Older learners", "Grands apprenants", "المتعلمون الأكبر"],
    caption: ["Go a little further", "Aller plus loin", "آفاق أوسع"],
    age: "10",
    image: 8,
  },
  {
    title: ["Teens", "Adolescents", "المراهقون"],
    caption: [
      "Independent discovery",
      "Découvrir en autonomie",
      "اكتشاف مستقل",
    ],
    age: "12",
    image: 10,
  },
];
export const SEASONAL: {
  name: Tri;
  query: Tri;
  family: string;
  index: number;
}[] = [
  {
    name: ["Back to school", "Rentrée scolaire", "العودة إلى المدرسة"],
    query: ["school", "école", "مدرسة"],
    family: "planners",
    index: 0,
  },
  {
    name: ["Autumn discoveries", "Découvertes d’automne", "اكتشافات الخريف"],
    query: ["autumn", "automne", "خريف"],
    family: "activities",
    index: 1,
  },
  {
    name: ["Winter wonders", "Merveilles d’hiver", "عجائب الشتاء"],
    query: ["winter", "hiver", "شتاء"],
    family: "stories",
    index: 2,
  },
  {
    name: ["Kindness & connection", "Bienveillance et liens", "اللطف والتواصل"],
    query: ["kindness", "bienveillance", "لطف"],
    family: "visual-cards",
    index: 3,
  },
  {
    name: [
      "Spring investigations",
      "Enquêtes de printemps",
      "استقصاءات الربيع",
    ],
    query: ["spring", "printemps", "ربيع"],
    family: "learning",
    index: 4,
  },
  {
    name: ["Summer exploration", "Explorations d’été", "استكشافات الصيف"],
    query: ["summer", "été", "صيف"],
    family: "tools",
    index: 5,
  },
];
export const categoryShort: Record<string, Tri> = {
  documents: [
    "Guides, reading & professional practice",
    "Guides, lectures et pratiques professionnelles",
    "أدلة وقراءة وممارسة مهنية",
  ],
  printables: [
    "Worksheets, practice pages & print-ready ideas",
    "Fiches, exercices et idées à imprimer",
    "أوراق عمل وتدريب وأفكار للطباعة",
  ],
  stories: [
    "Picture books, narrative & reading discovery",
    "Albums, récits et découvertes de lecture",
    "كتب مصورة وحكايات واكتشاف القراءة",
  ],
  learning: [
    "Lessons, practice & connected learning",
    "Leçons, pratique et apprentissages reliés",
    "دروس وتدريب وتعلّم مترابط",
  ],
  video: [
    "Demonstrations, explanations & tutorials",
    "Démonstrations, explications et tutoriels",
    "عروض وشروحات ودروس مرئية",
  ],
  audio: [
    "Listening, language & spoken stories",
    "Écoute, langage et histoires racontées",
    "استماع ولغة وحكايات مسموعة",
  ],
  "visual-cards": [
    "Vocabulary, images & visual reasoning",
    "Vocabulaire, images et raisonnement visuel",
    "مفردات وصور واستدلال بصري",
  ],
  presentations: [
    "Slides, visual lessons & facilitation",
    "Diaporamas, leçons visuelles et animation",
    "عروض ودروس بصرية وتيسير",
  ],
  assessments: [
    "Knowledge checks, reasoning & practice",
    "Vérification des acquis et entraînement",
    "تحقق من المعارف واستدلال وتدريب",
  ],
  activities: [
    "Hands-on challenges & playful investigations",
    "Défis pratiques et explorations ludiques",
    "تحديات عملية واستقصاء مرح",
  ],
  tools: [
    "Explore, manipulate & test an idea",
    "Explorer, manipuler et tester une idée",
    "استكشف وحرّك واختبر فكرة",
  ],
  planners: [
    "Plans, checklists & everyday organisation",
    "Plannings, listes et organisation du quotidien",
    "خطط وقوائم وتنظيم يومي",
  ],
  forms: [
    "Private reflection & personal questionnaires",
    "Réflexion privée et questionnaires personnels",
    "تأمل خاص واستبيانات شخصية",
  ],
  community: [
    "Published questions, reading & shared insights",
    "Questions publiées et regards partagés",
    "أسئلة منشورة وقراءة وخبرات مشتركة",
  ],
  commerce: [
    "Resource formats, contents & useful toolkits",
    "Formats, contenus et kits utiles",
    "تنسيقات ومحتويات وحقائب مفيدة",
  ],
  bundles: [
    "Connected resources & guided journeys",
    "Ressources complémentaires et parcours guidés",
    "موارد متكاملة ورحلات موجهة",
  ],
};
export const familyLayout: Record<string, string> = {
  documents: "library",
  printables: "paper",
  stories: "books",
  learning: "pathways",
  video: "screens",
  audio: "playlist",
  "visual-cards": "decks",
  presentations: "slides",
  assessments: "practice",
  activities: "workshop",
  tools: "laboratory",
  planners: "folios",
  forms: "reflection",
  community: "archive",
  commerce: "toolkits",
  bundles: "journeys",
};
export function visibleResources(rows: Resource[], hidden: string[]) {
  return rows.filter((r) => !hidden.includes(r.family));
}
export const topicHref = (topic: DiscoveryTopic, locale: Locale) =>
  discoveryHref(locale, { q: tr(topic.query, locale) }, topic.family);
