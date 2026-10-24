import { worldTile, legacyWorldImages } from "./editorial";
import { defaultHomeGallery, isFactoryHomeGallery } from "./home-imagery";
import { normalizeGallery, galleryBindings, type Scene } from "./gallery-contract";
/** Public KidFlix vocabulary. Keys remain the native DCE family keys. */
export type Locale = "en" | "fr" | "ar";
export type Tri = readonly [string, string, string];
export const locales: Locale[] = ["en", "fr", "ar"];
export const tr = (v: Tri, l: Locale) => v[l === "fr" ? 1 : l === "ar" ? 2 : 0];
export const isLocale = (v: string): v is Locale =>
  locales.includes(v as Locale);
export interface World {
  key: string;
  title: Tri;
  short: Tri;
  description: Tri;
  invitation: Tri;
  icon: string;
  color: string;
  tint: string;
  image: string;
  intent: string[];
}
export const WORLDS: World[] = [
  {
    key: "documents",
    title: ["Guides & Articles", "Guides & articles", "الأدلة والمقالات"],
    short: ["Read", "Lire", "اقرأ"],
    description: [
      "Little insights. A world of understanding.",
      "De petites lectures pour mieux comprendre.",
      "قراءات صغيرة تفتح آفاق الفهم.",
    ],
    invitation: [
      "Make room for a fresh perspective.",
      "Faites place à un nouveau regard.",
      "افتح نافذة لفكرة جديدة.",
    ],
    icon: "BookOpen",
    color: "#1766d7",
    tint: "#edf5ff",
    image: "/kidflix/documents.jpg",
    intent: ["read", "grownups"],
  },
  {
    key: "printables",
    title: [
      "Printables & Worksheets",
      "Fiches à imprimer",
      "أوراق وأنشطة للطباعة",
    ],
    short: ["Print", "Imprimer", "اطبع"],
    description: [
      "From a little screen to a big imagination.",
      "Du petit écran aux grandes idées.",
      "من الشاشة إلى خيال واسع.",
    ],
    invitation: [
      "A little paper. A lot of possibility.",
      "Un peu de papier. Beaucoup de possibles.",
      "قليل من الورق وكثير من الإمكانات.",
    ],
    icon: "Printer",
    color: "#ef4785",
    tint: "#fff0f6",
    image: "/kidflix/printables.jpg",
    intent: ["print", "create"],
  },
  {
    key: "stories",
    title: ["Stories & Reading", "Histoires & lecture", "الحكايات والقراءة"],
    short: ["Stories", "Histoires", "حكايات"],
    description: [
      "Open a story. Go somewhere wonderful.",
      "Ouvrez une histoire. Partez loin.",
      "افتح حكاية وانطلق إلى عالم جميل.",
    ],
    invitation: [
      "One more page. One more adventure.",
      "Encore une page. Encore une aventure.",
      "صفحة أخرى ومغامرة جديدة.",
    ],
    icon: "Sparkles",
    color: "#8554d8",
    tint: "#f5f0ff",
    image: "/kidflix/stories.jpg",
    intent: ["read", "listen"],
  },
  {
    key: "learning",
    title: [
      "Courses & Learning Paths",
      "Cours & parcours",
      "الدروس ومسارات التعلّم",
    ],
    short: ["Learn", "Apprendre", "تعلّم"],
    description: [
      "Small steps that lead to real discoveries.",
      "De petits pas vers de vraies découvertes.",
      "خطوات صغيرة نحو اكتشافات حقيقية.",
    ],
    invitation: [
      "Follow curiosity, one lesson at a time.",
      "Suivez la curiosité, une leçon à la fois.",
      "اتبع فضولك، درساً بعد درس.",
    ],
    icon: "GraduationCap",
    color: "#088c82",
    tint: "#eafbf6",
    image: "/kidflix/learning.webp",
    intent: ["learn", "grownups"],
  },
  {
    key: "video",
    title: ["Learning Videos", "Vidéos pour apprendre", "فيديوهات تعليمية"],
    short: ["Watch", "Regarder", "شاهد"],
    description: [
      "See an idea come to life.",
      "Voyez les idées prendre vie.",
      "شاهد الأفكار تنبض بالحياة.",
    ],
    invitation: [
      "A front-row seat for curious minds.",
      "Au premier rang pour découvrir.",
      "مكان في الصف الأول للعقول الفضولية.",
    ],
    icon: "Play",
    color: "#ee7f16",
    tint: "#fff5e7",
    image: "/kidflix/video.jpg",
    intent: ["watch", "learn"],
  },
  {
    key: "audio",
    title: ["Audio & Listening", "Audio & écoute", "الصوتيات والاستماع"],
    short: ["Listen", "Écouter", "استمع"],
    description: [
      "Close your eyes. Open your imagination.",
      "Fermez les yeux. Ouvrez l’imaginaire.",
      "أغمض عينيك وافتح خيالك.",
    ],
    invitation: [
      "Turn a quiet moment into a little journey.",
      "Un moment calme, un joli voyage.",
      "حوّل لحظة هادئة إلى رحلة صغيرة.",
    ],
    icon: "Headphones",
    color: "#cd489d",
    tint: "#fff0fa",
    image: "/kidflix/audio.webp",
    intent: ["listen"],
  },
  {
    key: "visual-cards",
    title: [
      "Flashcards & Visual Collections",
      "Flashcards & collections visuelles",
      "البطاقات والمجموعات البصرية",
    ],
    short: ["Discover", "Découvrir", "اكتشف"],
    description: [
      "Big ideas, beautifully broken into little cards.",
      "De grandes idées dans de petites cartes.",
      "أفكار كبيرة في بطاقات صغيرة.",
    ],
    invitation: [
      "Look. Wonder. Make a connection.",
      "Observez. Imaginez. Faites le lien.",
      "شاهد، تساءل، واربط الأفكار.",
    ],
    icon: "Layers",
    color: "#197ac9",
    tint: "#edf8ff",
    image: "/kidflix/visual-cards.webp",
    intent: ["learn", "print"],
  },
  {
    key: "presentations",
    title: [
      "Slides & Visual Lessons",
      "Diaporamas & leçons visuelles",
      "العروض والدروس البصرية",
    ],
    short: ["See", "Observer", "شاهد"],
    description: [
      "Make a new idea wonderfully clear.",
      "Rendez les idées nouvelles limpides.",
      "اجعل الفكرة الجديدة واضحة وجميلة.",
    ],
    invitation: [
      "Explore the bigger picture, together.",
      "Découvrez la vue d’ensemble, ensemble.",
      "اكتشف الصورة الكاملة معاً.",
    ],
    icon: "Presentation",
    color: "#635bdd",
    tint: "#f0f0ff",
    image: "/kidflix/presentations.webp",
    intent: ["watch", "learn", "grownups"],
  },
  {
    key: "assessments",
    title: ["Quizzes & Practice", "Quiz & entraînement", "الاختبارات والتدريب"],
    short: ["Challenge", "Se défier", "تحدَّ نفسك"],
    description: [
      "Try an idea. Discover what you know.",
      "Essayez. Découvrez ce que vous savez.",
      "جرّب واكتشف ما تعرفه.",
    ],
    invitation: [
      "A little challenge. A proud little moment.",
      "Un petit défi. Une belle fierté.",
      "تحدٍّ صغير ولحظة فخر جميلة.",
    ],
    icon: "Zap",
    color: "#de8c0a",
    tint: "#fff8df",
    image: "/kidflix/assessments.webp",
    intent: ["play", "learn"],
  },
  {
    key: "activities",
    title: ["Games & Activities", "Jeux & activités", "الألعاب والأنشطة"],
    short: ["Play", "Jouer", "العب"],
    description: [
      "More play. More wonder. More discovery.",
      "Plus de jeu. Plus d’émerveillement.",
      "لعب أكثر ودهشة واكتشاف.",
    ],
    invitation: [
      "Let the good ideas get a little messy.",
      "Laissez les bonnes idées s’amuser.",
      "دع الأفكار الجميلة تنطلق بحرية.",
    ],
    icon: "Puzzle",
    color: "#ec5e36",
    tint: "#fff2e9",
    image: "/kidflix/activities.webp",
    intent: ["play", "create"],
  },
  {
    key: "tools",
    title: [
      "Learning Tools & Simulators",
      "Outils & simulateurs éducatifs",
      "أدوات ومحاكيات التعلّم",
    ],
    short: ["Explore", "Explorer", "استكشف"],
    description: [
      "Move it. Try it. See what happens.",
      "Manipulez. Essayez. Voyez ce qui change.",
      "حرّك وجرّب وشاهد ما يحدث.",
    ],
    invitation: [
      "What happens if…? Let’s find out.",
      "Et si… ? À vous de découvrir.",
      "ماذا يحدث لو…؟ لنكتشف معاً.",
    ],
    icon: "WandSparkles",
    color: "#159b8b",
    tint: "#eafbf7",
    image: "/kidflix/tools.webp",
    intent: ["learn", "play"],
  },
  {
    key: "planners",
    title: [
      "Planners & Checklists",
      "Plannings & checklists",
      "المخططات وقوائم المهام",
    ],
    short: ["Organise", "Organiser", "نظّم"],
    description: [
      "A little structure for happier everyday moments.",
      "Quelques repères pour un quotidien plus doux.",
      "تنظيم بسيط للحظات يومية أجمل.",
    ],
    invitation: [
      "Make a little space for what matters.",
      "Faites de la place à l’essentiel.",
      "افسح مساحة صغيرة لما يهم.",
    ],
    icon: "CalendarCheck",
    color: "#dc508d",
    tint: "#fff0f7",
    image: "/kidflix/planners.jpg",
    intent: ["organise", "print", "grownups"],
  },
  {
    key: "forms",
    title: [
      "Personal Questionnaires",
      "Questionnaires personnels",
      "الاستبيانات الشخصية",
    ],
    short: ["Reflect", "Faire le point", "تأمّل"],
    description: [
      "A moment to think, just for you.",
      "Un instant pour réfléchir, rien que pour vous.",
      "لحظة للتفكير، لك وحدك.",
    ],
    invitation: [
      "Your answers. Your own perspective.",
      "Vos réponses. Votre propre regard.",
      "إجاباتك ورؤيتك الخاصة.",
    ],
    icon: "ListChecks",
    color: "#6488c1",
    tint: "#eff5fe",
    image: "/kidflix/forms.jpg",
    intent: ["grownups", "organise"],
  },
  {
    key: "community",
    title: [
      "Questions & Shared Insights",
      "Questions & regards partagés",
      "أسئلة وخبرات مشتركة",
    ],
    short: ["Understand", "Comprendre", "افهم"],
    description: [
      "Thoughtful answers to everyday questions.",
      "Des réponses éclairantes aux questions du quotidien.",
      "إجابات مدروسة عن أسئلة الحياة اليومية.",
    ],
    invitation: [
      "Find a helpful thought for your next step.",
      "Un éclairage utile pour avancer.",
      "فكرة مفيدة لخطوتك القادمة.",
    ],
    icon: "MessagesSquare",
    color: "#b255ad",
    tint: "#fdf0fc",
    image: "/kidflix/community.jpg",
    intent: ["read", "grownups"],
  },
  {
    key: "commerce",
    title: [
      "Resources & Toolkit Discoveries",
      "Ressources & découvertes de kits",
      "الموارد واكتشاف الحقائب",
    ],
    short: ["Find", "Trouver", "اعثر"],
    description: [
      "Explore what could support the next discovery.",
      "Découvrez de quoi accompagner la suite.",
      "اكتشف ما يدعم مغامرتك القادمة.",
    ],
    invitation: [
      "Thoughtful ideas for growing possibilities.",
      "Des idées choisies pour aller plus loin.",
      "أفكار ملهمة لإمكانات أكبر.",
    ],
    icon: "Gift",
    color: "#d68c19",
    tint: "#fff7e8",
    image: "/kidflix/commerce.webp",
    intent: ["grownups", "create"],
  },
  {
    key: "bundles",
    title: [
      "Bundles & Guided Journeys",
      "Collections & parcours guidés",
      "المجموعات والرحلات الموجّهة",
    ],
    short: ["Journey", "Parcourir", "انطلق"],
    description: [
      "Good things, thoughtfully brought together.",
      "De belles découvertes réunies avec soin.",
      "اكتشافات جميلة جُمعت بعناية.",
    ],
    invitation: [
      "Let one discovery lead to the next.",
      "Une découverte en appelle une autre.",
      "دع اكتشافاً يقودك إلى التالي.",
    ],
    icon: "Route",
    color: "#448c3d",
    tint: "#f0f9e9",
    image: "/kidflix/bundles.webp",
    intent: ["learn", "create", "grownups"],
  },
];
for (const w of WORLDS) w.image = worldTile(w.key);
export const world = (key: string) => WORLDS.find((w) => w.key === key);
export const INTENTS = [
  ["read", "BookOpen", ["Read", "Lire", "اقرأ"]],
  ["listen", "Headphones", ["Listen", "Écouter", "استمع"]],
  ["watch", "Play", ["Watch", "Regarder", "شاهد"]],
  ["play", "Puzzle", ["Play", "Jouer", "العب"]],
  ["learn", "Sparkles", ["Learn", "Apprendre", "تعلّم"]],
  ["print", "Printer", ["Print", "Imprimer", "اطبع"]],
  ["organise", "CalendarCheck", ["Organise", "Organiser", "نظّم"]],
] as const;
export interface Resource {
  loveCount?: number;
  recentStarts?: number;
  id: string;
  releaseId: string;
  key: string;
  family: string;
  title: string;
  summary: string;
  image: string;
  imageAlt: string;
  audience: string;
  ageMin: number | null;
  ageMax: number | null;
  duration: number | null;
  difficulty: string;
  subject: string;
  skills: string[];
  formats: string[];
  publishedAt: string;
  intent: string[];
  collection: string[];
}
export interface Catalogue {
  rows: Resource[];
  total: number;
  page: number;
  pageSize: number;
  counts: Record<string, number>;
  subjects: string[];
  skills: string[];
  error?: boolean;
  configured?: boolean;
}
export const emptyCatalogue: Catalogue = {
  rows: [],
  total: 0,
  page: 1,
  pageSize: 24,
  counts: {},
  subjects: [],
  skills: [],
};
export interface HomeEdition {
  gallery: Scene[];
  familyTools?: Record<string, Record<string, boolean>>;
  eyebrow: string;
  headline: string;
  description: string;
  hero: string;
  heroMobile: string;
  heroAlt: string;
  featured: string[];
  hidden: string[];
  familyOrder: string[];
  familyImages: Record<string, string>;
  mediaBindings: Record<string, string>;
  sections: string[];
  adSlots: string[];
  startsAt: string;
  endsAt: string;
}
export const SECTIONS = [
  "worlds",
  "today",
  "ages",
  "skills",
  "printables",
  "storytime",
  "challenge",
  "activities",
  "learning",
  "visual-cards",
  "tools",
  "video",
  "grownups",
  "bundles",
  "new",
  "continuity",
  "closing",
] as const;
export interface HomeConfig {
  locale: Locale;
  edition: HomeEdition;
  published: boolean;
  revision: number;
}
export const defaultHome = (locale: Locale): HomeConfig => ({
  locale,
  published: false,
  revision: 0,
  edition: {
    gallery: defaultHomeGallery(),
    eyebrow: tr(
      [
        "A little curiosity. Endless possibilities.",
        "Un peu de curiosité. Mille possibilités.",
        "فضول صغير. آفاق بلا حدود.",
      ],
      locale,
    ),
    headline: tr(
      [
        "Big discoveries. Happy little minds.",
        "Grandes découvertes. Petits esprits heureux.",
        "اكتشافات كبيرة. عقول صغيرة سعيدة.",
      ],
      locale,
    ),
    description: tr(
      [
        "Stories, printables, playful challenges and practical resources—for curious children and the adults who help them grow.",
        "Histoires, fiches à imprimer, défis ludiques et ressources utiles : pour les enfants curieux et les adultes qui les aident à grandir.",
        "حكايات ومطبوعات وتحديات مرحة وموارد مفيدة للأطفال الفضوليين ولكل من يساعدهم على النمو.",
      ],
      locale,
    ),
    hero: defaultHomeGallery()[0].desktop,
    heroMobile: defaultHomeGallery()[0].mobile,
    heroAlt: defaultHomeGallery()[0].descriptions[locale],
    featured: [],
    hidden: [],
    familyOrder: WORLDS.map((w) => w.key),
    familyImages: {},
    mediaBindings: {},
    sections: [...SECTIONS],
    adSlots: [],
    startsAt: "",
    endsAt: "",
  },
});
export function safeImage(v: unknown): v is string {
  if (typeof v !== "string" || v.length > 2048 || /[\x00-\x20\\]/.test(v))
    return false;
  if (v.startsWith("/"))
    return !v.startsWith("//") && !v.includes("..") && !v.startsWith("/api/");
  try {
    const u = new URL(v);
    return u.protocol === "https:" && !u.username && !u.password && !u.hash;
  } catch {
    return false;
  }
}
export function normalizeEdition(v: unknown, l: Locale): HomeEdition {
  const x =
      v && typeof v === "object" && !Array.isArray(v)
        ? (v as Record<string, unknown>)
        : {},
    d = defaultHome(l).edition,
    s = (k: string, max: number) =>
      typeof x[k] === "string"
        ? (x[k] as string).trim().slice(0, max)
        : (d[k as keyof HomeEdition] as string);
  const list = (k: string, allowed?: readonly string[]) =>
    Array.isArray(x[k])
      ? [
          ...new Set(
            (x[k] as unknown[]).filter(
              (i): i is string =>
                typeof i === "string" && (!allowed || allowed.includes(i)),
            ),
          ),
        ].slice(0, 100)
      : (d[k as keyof HomeEdition] as string[]);
  const images: Record<string, string> = {};
  if (x.familyImages && typeof x.familyImages === "object")
    for (const [k, u] of Object.entries(x.familyImages)) {
      if (world(k) && safeImage(u)) images[k] = u;
    }
  const customMobile = typeof x.heroMobile === "string" && Boolean(x.heroMobile) && x.heroMobile !== d.heroMobile && x.heroMobile !== "/kidflix/international-20261020/home-1-mobile.webp";
  const boundHero = Boolean((x.mediaBindings as Record<string, unknown> | undefined)?.hero || (x.mediaBindings as Record<string, unknown> | undefined)?.heroMobile || customMobile);
  const factoryLegacyHero = !boundHero && (!x.heroMobile || x.heroMobile === d.heroMobile || x.heroMobile === "/kidflix/international-20261020/home-1-mobile.webp") && (x.hero === undefined || x.hero === d.hero || x.hero === "/kidflix/hero.jpg" || x.hero === "/kidflix/international-20261020/home-1.webp");
  const homeGallery = isFactoryHomeGallery(x.gallery, x.mediaBindings) || (x.gallery === undefined && factoryLegacyHero) ? d.gallery : x.gallery;
  const gallery = normalizeGallery(homeGallery, "home", {hero: typeof x.hero === "string" ? x.hero : d.hero, mobile: typeof x.heroMobile === "string" ? x.heroMobile : "", alt: typeof x.heroAlt === "string" ? x.heroAlt : "", bound: boundHero});
  const e = {
    ...d,
    gallery,
    familyTools: Object.fromEntries(
      Object.entries(
        x.familyTools && typeof x.familyTools === "object" ? x.familyTools : {},
      )
        .filter(([family]) => Boolean(world(family)))
        .map(([family, value]) => [
          family,
          Object.fromEntries(
            Object.entries(
              value && typeof value === "object" ? value : {},
            ).filter(
              ([key, v]) =>
                [
                  "kidflixSession",
                  "kidflixClassroom",
                  "kidflixComfort",
                  "kidflixPractice",
                  "kidflixQueue",
                  "kidflixOffline",
                  "kidflixPrintPack",
                ].includes(key) && typeof v === "boolean",
            ),
          ),
        ]),
    ) as Record<string, Record<string, boolean>>,
    eyebrow: s("eyebrow", 100),
    headline: s("headline", 160),
    description: s("description", 500),
    hero: s("hero", 2048),
    heroMobile: s("heroMobile", 2048),
    heroAlt: s("heroAlt", 300),
    featured: list("featured").filter((i) => /^[a-z0-9-]{2,120}$/i.test(i)),
    hidden: list(
      "hidden",
      WORLDS.map((w) => w.key),
    ),
    familyOrder: list(
      "familyOrder",
      WORLDS.map((w) => w.key),
    ),
    familyImages: images,
    mediaBindings: Object.fromEntries(
      Object.entries(
        x.mediaBindings && typeof x.mediaBindings === "object"
          ? x.mediaBindings
          : {},
      ).filter(
        ([slot, id]) =>
          (slot.startsWith("scene:") ||
            slot === "hero" ||
            slot === "heroMobile" ||
            (slot.startsWith("family:") && world(slot.slice(7)))) &&
          typeof id === "string" &&
          /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id),
      ),
    ) as Record<string, string>,
    sections: list("sections", SECTIONS),
    adSlots: list("adSlots", [
      "after-worlds",
      "after-printables",
      "after-bundles",
    ]),
    startsAt: s("startsAt", 40),
    endsAt: s("endsAt", 40),
  };
  e.mediaBindings = galleryBindings(e.mediaBindings, gallery, x.gallery === undefined);
  e.hero = gallery[0].desktop;
  e.heroMobile = gallery[0].mobile;
  e.heroAlt = gallery[0].descriptions[l];
  for (const [key,url] of Object.entries(e.familyImages)) if (!e.mediaBindings["family:"+key] && url === legacyWorldImages[key]) e.familyImages[key] = worldTile(key);
  if (
    !e.headline ||
    !e.description ||
    !e.heroAlt ||
    !safeImage(e.hero) ||
    (e.heroMobile && !safeImage(e.heroMobile))
  )
    throw Error(
      "Complete the headline, description, accessible hero image and its alternative text.",
    );
  if (
    e.familyOrder.length !== WORLDS.length ||
    !e.familyOrder.every((k) => world(k))
  )
    throw Error(
      "The family order must contain all sixteen native families exactly once.",
    );
  if (
    (e.startsAt && !Number.isFinite(Date.parse(e.startsAt))) ||
    (e.endsAt && !Number.isFinite(Date.parse(e.endsAt))) ||
    (e.startsAt && e.endsAt && Date.parse(e.startsAt) >= Date.parse(e.endsAt))
  )
    throw Error("Choose a valid publication window.");
  return e;
}
export const path = (l: Locale, suffix = "") => `/kidflix/${l}${suffix}`;
