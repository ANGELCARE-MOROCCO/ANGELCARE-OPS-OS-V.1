import {
  path,
  tr,
  type HomeEdition,
  type Locale,
  type Tri,
} from "../catalogue";
import type { Scene } from "../gallery-contract";

export const ART = "/kidflix/home-reference-r2/";
export type Tile = {
  id: string;
  title: Tri;
  family: string;
  query: Tri;
  sheet: string;
  cell: number;
  filters?: Record<string, string>;
};
const t = (en: string, fr: string, ar: string): Tri => [en, fr, ar];
const tile = (
  id: string,
  title: Tri,
  family: string,
  sheet: string,
  cell: number,
  query = title,
  filters?: Record<string, string>,
): Tile => ({ id, title, family, sheet, cell, query, filters });
export const TOPICS: Tile[] = [
  tile(
    "alphabet",
    t("Alphabet tracing", "Tracer l’alphabet", "تتبّع الحروف"),
    "printables",
    "topics-01",
    0,
  ),
  tile(
    "numbers",
    t("Kindergarten maths", "Maths en maternelle", "رياضيات الروضة"),
    "printables",
    "topics-01",
    1,
    t("numbers", "nombres", "الأعداد"),
  ),
  tile(
    "feelings",
    t("Emotion flashcards", "Cartes des émotions", "بطاقات المشاعر"),
    "visual-cards",
    "topics-01",
    2,
    t("emotions", "émotions", "المشاعر"),
  ),
  tile(
    "rules",
    t("Classroom rules", "Règles de classe", "قواعد الصف"),
    "documents",
    "topics-01",
    3,
    t("classroom", "classe", "الصف"),
  ),
  tile(
    "reading",
    t("Reading & comprehension", "Lecture et compréhension", "القراءة والفهم"),
    "stories",
    "topics-01",
    4,
    t("reading", "lecture", "قراءة"),
  ),
  tile(
    "planner",
    t("Daily teacher planners", "Plannings enseignants", "مخططات المعلمين"),
    "planners",
    "topics-01",
    5,
    t("daily", "quotidien", "يومي"),
  ),
  tile(
    "memory",
    t(
      "End-of-year memory books",
      "Souvenirs de fin d’année",
      "ذكريات نهاية السنة",
    ),
    "printables",
    "topics-01",
    6,
    t("memory", "souvenirs", "ذكريات"),
  ),
  tile(
    "newsletter",
    t("Classroom newsletters", "Bulletins de classe", "نشرات الصف"),
    "documents",
    "topics-01",
    7,
    t("newsletter", "bulletin", "نشرة"),
  ),
  tile(
    "routines",
    t("Positive routine charts", "Tableaux de routines", "جداول الروتين"),
    "planners",
    "topics-01",
    8,
    t("routine", "routine", "روتين"),
  ),
  tile(
    "kindness",
    t(
      "Kindness in the classroom",
      "La bienveillance en classe",
      "اللطف في الصف",
    ),
    "activities",
    "topics-01",
    9,
    t("kindness", "bienveillance", "لطف"),
  ),
  tile(
    "shapes",
    t("Shape activities", "Activités sur les formes", "أنشطة الأشكال"),
    "activities",
    "topics-01",
    10,
    t("shapes", "formes", "أشكال"),
  ),
  tile(
    "scissors",
    t("Scissor skills & crafts", "Découpage et créations", "القص والأشغال"),
    "activities",
    "topics-01",
    11,
    t("craft", "création", "أشغال"),
  ),
  tile(
    "home",
    t("Home learning schedules", "Apprendre à la maison", "التعلّم في المنزل"),
    "planners",
    "topics-01",
    12,
    t("home", "maison", "منزل"),
  ),
  tile(
    "story",
    t(
      "Reading stories together",
      "Lire des histoires ensemble",
      "قراءة القصص معاً",
    ),
    "stories",
    "topics-01",
    13,
    t("stories", "histoires", "قصص"),
  ),
  tile(
    "stem",
    t("STEM activities at home", "Sciences à la maison", "العلوم في المنزل"),
    "tools",
    "topics-01",
    14,
    t("science", "science", "علوم"),
  ),
  tile(
    "observe",
    t(
      "Observe, explore, discover",
      "Observer et découvrir",
      "لاحظ واستكشف واكتشف",
    ),
    "learning",
    "topics-01",
    15,
    t("observation", "observation", "ملاحظة"),
  ),
];
export const PACKS: Tile[] = [
  tile(
    "school-pack",
    t(
      "Back-to-school resource pack",
      "Kit de rentrée scolaire",
      "حقيبة العودة للمدرسة",
    ),
    "bundles",
    "collections-01",
    0,
    t("school", "école", "مدرسة"),
  ),
  tile(
    "classroom-pack",
    t(
      "Classroom management toolkit",
      "Outils de gestion de classe",
      "أدوات إدارة الصف",
    ),
    "bundles",
    "collections-01",
    1,
    t("classroom", "classe", "صف"),
  ),
  tile(
    "sel-pack",
    t(
      "Social & emotional learning",
      "Apprendre les émotions",
      "التعلّم الاجتماعي والعاطفي",
    ),
    "bundles",
    "collections-01",
    2,
    t("emotions", "émotions", "مشاعر"),
  ),
  tile(
    "stem-pack",
    t("STEM activity discovery", "Découvertes scientifiques", "اكتشافات علمية"),
    "bundles",
    "collections-01",
    3,
    t("science", "science", "علوم"),
  ),
  tile(
    "read-pack",
    t("Reading comprehension", "Comprendre les histoires", "فهم القصص"),
    "bundles",
    "collections-01",
    4,
    t("reading", "lecture", "قراءة"),
  ),
  tile(
    "holiday-pack",
    t(
      "Holiday & seasonal activities",
      "Activités et fêtes de saison",
      "أنشطة الأعياد والمواسم",
    ),
    "bundles",
    "collections-01",
    5,
    t("seasonal", "saison", "موسم"),
  ),
];
export const SEASONS: Tile[] = [
  tile(
    "school",
    t("Back to school", "Rentrée scolaire", "العودة للمدرسة"),
    "printables",
    "collections-01",
    8,
    t("school", "école", "مدرسة"),
  ),
  tile(
    "halloween",
    t("Halloween", "Halloween", "هالوين"),
    "activities",
    "collections-01",
    9,
  ),
  tile(
    "thanksgiving",
    t("Thanksgiving", "Fête des récoltes", "موسم الحصاد"),
    "activities",
    "collections-01",
    10,
    t("autumn", "automne", "خريف"),
  ),
  tile(
    "christmas",
    t("Christmas", "Noël", "عيد الميلاد"),
    "activities",
    "collections-01",
    11,
    t("Christmas", "Noël", "عيد الميلاد"),
  ),
  tile(
    "winter",
    t("Winter", "Hiver", "الشتاء"),
    "printables",
    "collections-01",
    12,
    t("winter", "hiver", "شتاء"),
  ),
  tile(
    "valentine",
    t("Valentine’s Day", "Saint-Valentin", "يوم المحبة"),
    "activities",
    "collections-01",
    13,
    t("kindness", "bienveillance", "لطف"),
  ),
  tile(
    "spring",
    t("Spring", "Printemps", "الربيع"),
    "activities",
    "collections-01",
    14,
    t("spring", "printemps", "ربيع"),
  ),
  tile(
    "summer",
    t("Summer", "Été", "الصيف"),
    "activities",
    "collections-01",
    15,
    t("summer", "été", "صيف"),
  ),
];
export const PATHWAYS: Tile[] = [
  tile(
    "literacy",
    t(
      "Early literacy journey",
      "Premiers pas en lecture",
      "رحلة القراءة المبكرة",
    ),
    "learning",
    "pathways",
    0,
    t("literacy", "lecture", "قراءة"),
  ),
  tile(
    "maths",
    t(
      "Maths skills journey",
      "Parcours mathématiques",
      "رحلة مهارات الرياضيات",
    ),
    "learning",
    "pathways",
    1,
    t("math", "mathématiques", "رياضيات"),
  ),
  tile(
    "emotions",
    t(
      "Social & emotional learning",
      "Émotions et relations",
      "المشاعر والعلاقات",
    ),
    "learning",
    "pathways",
    2,
    t("emotions", "émotions", "مشاعر"),
  ),
  tile(
    "routine",
    t(
      "Classroom routine toolkit",
      "Les routines de classe",
      "أدوات روتين الصف",
    ),
    "planners",
    "pathways",
    3,
    t("routine", "routine", "روتين"),
  ),
  tile(
    "homeschool",
    t(
      "Homeschool learning journey",
      "Apprendre en famille",
      "رحلة التعلّم العائلي",
    ),
    "learning",
    "pathways",
    4,
    t("home", "maison", "منزل"),
  ),
  tile(
    "science",
    t(
      "STEM exploration journey",
      "Explorer les sciences",
      "رحلة استكشاف العلوم",
    ),
    "tools",
    "pathways",
    5,
    t("science", "science", "علوم"),
  ),
  tile(
    "communication",
    t("Inclusive communication", "Communication inclusive", "التواصل الدامج"),
    "visual-cards",
    "pathways",
    6,
    t("communication", "communication", "تواصل"),
  ),
  tile(
    "nature",
    t("Observe the natural world", "Observer la nature", "ملاحظة عالم الطبيعة"),
    "learning",
    "pathways",
    7,
    t("nature", "nature", "طبيعة"),
  ),
];
export const AGES = [
  {
    title: t("Toddlers", "Tout-petits", "الصغار"),
    caption: t("Ages 2–3", "2–3 ans", "٢–٣ سنوات"),
    age: "2",
  },
  {
    title: t("Preschool", "Préscolaire", "التمهيدي"),
    caption: t("Ages 3–5", "3–5 ans", "٣–٥ سنوات"),
    age: "4",
  },
  {
    title: t("Kindergarten", "Maternelle", "الروضة"),
    caption: t("Ages 5–6", "5–6 ans", "٥–٦ سنوات"),
    age: "5",
  },
  {
    title: t("Early primary", "Début primaire", "الابتدائي المبكر"),
    caption: t("Ages 6–8", "6–8 ans", "٦–٨ سنوات"),
    age: "7",
  },
  {
    title: t("Primary", "Primaire", "الابتدائي"),
    caption: t("Ages 8–11", "8–11 ans", "٨–١١ سنة"),
    age: "9",
  },
  {
    title: t("Middle school", "Collège", "الإعدادي"),
    caption: t("Ages 11–14", "11–14 ans", "١١–١٤ سنة"),
    age: "12",
  },
  {
    title: t("High school", "Lycée", "الثانوي"),
    caption: t("Ages 14–18", "14–18 ans", "١٤–١٨ سنة"),
    age: "15",
  },
  {
    title: t("All ages", "Tous les âges", "كل الأعمار"),
    caption: t("Explore together", "Explorer ensemble", "لنستكشف معاً"),
    age: "",
  },
];
export const SUBJECTS = [
  [
    t("Maths", "Maths", "الرياضيات"),
    "Calculator",
    "math",
    "mathématiques",
    "رياضيات",
  ],
  [
    t("Reading", "Lecture", "القراءة"),
    "BookOpen",
    "reading",
    "lecture",
    "قراءة",
  ],
  [
    t("Science", "Sciences", "العلوم"),
    "FlaskConical",
    "science",
    "sciences",
    "علوم",
  ],
  [
    t("Social studies", "Découvrir le monde", "اكتشاف العالم"),
    "Globe",
    "world",
    "monde",
    "عالم",
  ],
  [
    t("Arts & crafts", "Arts et créations", "الفنون والأشغال"),
    "Palette",
    "creative",
    "créativité",
    "إبداع",
  ],
  [
    t("Writing", "Écriture", "الكتابة"),
    "Pencil",
    "writing",
    "écriture",
    "كتابة",
  ],
  [
    t("Phonics", "Phonologie", "الأصوات"),
    "MessagesSquare",
    "phonics",
    "phonologie",
    "أصوات",
  ],
  [
    t("Life skills", "Vie quotidienne", "مهارات الحياة"),
    "Sprout",
    "daily",
    "quotidien",
    "يومي",
  ],
  [
    t("Emotions", "Émotions", "المشاعر"),
    "Heart",
    "emotions",
    "émotions",
    "مشاعر",
  ],
  [t("STEM", "STEM", "العلوم والتقنية"), "Lightbulb", "STEM", "STEM", "علوم"],
  [
    t("Languages", "Langues", "اللغات"),
    "Languages",
    "language",
    "langage",
    "لغة",
  ],
  [
    t("Reasoning", "Raisonnement", "التفكير"),
    "Puzzle",
    "reasoning",
    "raisonnement",
    "تفكير",
  ],
] as const;
export const href = (
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
export const tileHref = (x: Tile, l: Locale) =>
  href(l, x.filters || { q: tr(x.query, l) }, x.family);
export function homeScenes(e: HomeEdition): Scene[] {
  const factory = (src: string) =>
    /^\/kidflix\/(reference-public-r1|home-publisher-r2|storefront-publisher-|home\/|hero\.)/.test(
      src,
    );
  const custom = e.gallery.filter(
    (x) => !factory(x.desktop) || !!e.mediaBindings[`scene:${x.id}:desktop`],
  );
  const defaults = [1, 2, 3].map((i) => ({
    id: `home-reference-r2-${i}`,
    desktop: ART + `hero-0${i}.png`,
    mobile: ART + `hero-0${i}.png`,
    descriptions: {
      en: "Joyful learning, colourful ideas and creative discoveries",
      fr: "Apprendre avec joie, créer et découvrir",
      ar: "تعلّم بفرح وأفكار ملوّنة واكتشافات إبداعية",
    },
    focal: { x: 50, y: 50 },
    mobileFocal: { x: 62, y: 50 },
  }));
  const urls = new Set(custom.map((scene) => scene.desktop));
  return [
    ...custom,
    ...defaults.filter((scene) => !urls.has(scene.desktop)),
  ].slice(0, Math.max(3, custom.length));
}

/** Replace factory artwork while respecting deliberately published operator media. */
export function customFamilyImage(e: HomeEdition, family: string): string {
  const image = e.familyImages[family] || "";
  if (e.mediaBindings["family:" + family]) return image;
  if (
    !image ||
    /^\/kidflix\/(home-publisher-r2|reference-public-r1|storefront-publisher-|editorial\/)/.test(
      image,
    ) ||
    /^\/kidflix\/[a-z-]+\.jpg$/.test(image)
  )
    return "";
  return image;
}

export const HOME_SECTIONS = [
  "worlds",
  "today",
  "printables",
  "grownups",
  "bundles",
  "ages",
  "skills",
  "new",
  "learning",
  "continuity",
  "closing",
] as const;
