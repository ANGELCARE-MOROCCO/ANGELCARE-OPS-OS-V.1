import { isLocale, tr, type Locale, type Tri } from "../catalogue";
import type { Item } from "../storefronts/model";
export const ART = "/kidflix/documents-reference-r1/";
export type Choice = { key: string; title: Tri; icon: number; body?: Tri };
export const SUBTYPES: Choice[] = [
  {
    key: "how-to",
    title: [
      "Practical guides & daily skills",
      "Guides pratiques et quotidien",
      "أدلة عملية ومهارات يومية",
    ],
    icon: 0,
  },
  {
    key: "parenting",
    title: ["Parenting & family", "Parentalité et famille", "الوالدية والأسرة"],
    icon: 24,
  },
  {
    key: "care",
    title: ["Care & wellbeing", "Soins et bien-être", "الرعاية والرفاه"],
    icon: 11,
  },
  {
    key: "educator",
    title: [
      "Educator professional guidance",
      "Pratiques professionnelles",
      "إرشادات مهنية للمربين",
    ],
    icon: 3,
  },
  {
    key: "family-travel",
    title: [
      "Family travel & safety",
      "Voyages et sécurité en famille",
      "سفر الأسرة والسلامة",
    ],
    icon: 27,
  },
  {
    key: "school-policy",
    title: [
      "School policies & safeguarding",
      "Politiques et protection de l’enfant",
      "سياسات المدارس وحماية الطفل",
    ],
    icon: 2,
  },
];
export const USES: Choice[] = [
  {
    key: "guides",
    title: ["Worksheets & Guides", "Fiches et guides", "أوراق وأدلة"],
    icon: 0,
  },
  {
    key: "reference",
    title: ["Reference Sheets", "Fiches de référence", "أوراق مرجعية"],
    icon: 1,
  },
  {
    key: "policies",
    title: [
      "Policies & Procedures",
      "Politiques et procédures",
      "السياسات والإجراءات",
    ],
    icon: 2,
  },
  {
    key: "classroom",
    title: ["Classroom Documents", "Documents de classe", "وثائق الفصل"],
    icon: 3,
  },
  {
    key: "parent-communication",
    title: [
      "Parent Communication",
      "Communication parents",
      "التواصل مع الوالدين",
    ],
    icon: 4,
  },
  {
    key: "checklists",
    title: ["Checklists", "Listes de contrôle", "قوائم التحقق"],
    icon: 5,
  },
  {
    key: "certificates",
    title: [
      "Certificates & Forms",
      "Certificats et formulaires",
      "شهادات ونماذج",
    ],
    icon: 6,
  },
  {
    key: "reports",
    title: ["Research & Reports", "Recherches et rapports", "بحوث وتقارير"],
    icon: 7,
  },
  {
    key: "homeschool",
    title: [
      "Homeschool Planning",
      "Organisation à la maison",
      "تخطيط التعلم المنزلي",
    ],
    icon: 8,
  },
  {
    key: "administration",
    title: [
      "School Administration",
      "Administration scolaire",
      "الإدارة المدرسية",
    ],
    icon: 9,
  },
  {
    key: "lesson-plans",
    title: [
      "Lesson Documentation",
      "Documentation pédagogique",
      "توثيق الدروس",
    ],
    icon: 10,
  },
  {
    key: "special-education",
    title: [
      "Special Needs Documents",
      "Documents d’inclusion",
      "وثائق الاحتياجات الخاصة",
    ],
    icon: 11,
  },
];
export const NEEDS: Choice[] = [
  {
    key: "back-to-school",
    title: ["Back to School", "Rentrée scolaire", "العودة إلى المدرسة"],
    icon: 12,
    body: [
      "Class forms, routines and welcome letters",
      "Documents de classe, routines et accueil",
      "نماذج الفصل والروتين ورسائل الترحيب",
    ],
  },
  {
    key: "classroom-management",
    title: ["Classroom Management", "Gestion de classe", "إدارة الفصل"],
    icon: 13,
    body: [
      "Rules, behaviour forms and monitoring",
      "Règles, comportement et suivi",
      "القواعد ونماذج السلوك والمتابعة",
    ],
  },
  {
    key: "parent-communication",
    title: [
      "Parent Communication",
      "Communication parents",
      "التواصل مع الوالدين",
    ],
    icon: 4,
    body: [
      "Letters, newsletters and meeting notes",
      "Lettres, informations et réunions",
      "رسائل ونشرات وملاحظات الاجتماعات",
    ],
  },
  {
    key: "homeschool",
    title: ["Homeschool Planning", "École à la maison", "التعلم المنزلي"],
    icon: 8,
    body: [
      "Schedules, planners and record keeping",
      "Planning, organisation et suivi",
      "جداول ومخططات وحفظ السجلات",
    ],
  },
  {
    key: "special-education",
    title: ["Special Education", "Éducation inclusive", "التربية الخاصة"],
    icon: 11,
    body: [
      "Individual plans and support documents",
      "Plans individuels et accompagnement",
      "خطط فردية ووثائق الدعم",
    ],
  },
  {
    key: "teacher-planning",
    title: ["Teacher Planning", "Préparation pédagogique", "تخطيط المعلم"],
    icon: 10,
    body: [
      "Lesson plans, trackers and curriculum tools",
      "Préparations, suivi et progression",
      "خطط دروس وأدوات متابعة ومناهج",
    ],
  },
];
export const GRADES: Choice[] = [
  {
    key: "toddler",
    title: ["Toddler (2–3)", "Petite enfance (2–3)", "الطفولة المبكرة (٢–٣)"],
    icon: 12,
  },
  {
    key: "prek",
    title: ["PreK (3–4)", "Préscolaire (3–4)", "ما قبل المدرسة (٣–٤)"],
    icon: 12,
  },
  {
    key: "kindergarten",
    title: ["Kindergarten (4–5)", "Maternelle (4–5)", "الروضة (٤–٥)"],
    icon: 12,
  },
  {
    key: "grade-1",
    title: ["1st Grade (5–6)", "1re année (5–6)", "السنة الأولى (٥–٦)"],
    icon: 12,
  },
  {
    key: "grade-2",
    title: ["2nd Grade (6–7)", "2e année (6–7)", "السنة الثانية (٦–٧)"],
    icon: 12,
  },
  {
    key: "grade-3",
    title: ["3rd Grade (7–8)", "3e année (7–8)", "السنة الثالثة (٧–٨)"],
    icon: 12,
  },
  {
    key: "grade-4",
    title: ["4th Grade (8–9)", "4e année (8–9)", "السنة الرابعة (٨–٩)"],
    icon: 12,
  },
  {
    key: "grade-5",
    title: ["5th Grade (9–10)", "5e année (9–10)", "السنة الخامسة (٩–١٠)"],
    icon: 12,
  },
  {
    key: "middle-school",
    title: ["Middle School (11–13)", "Collège (11–13)", "الإعدادي (١١–١٣)"],
    icon: 12,
  },
  {
    key: "high-school",
    title: ["High School (14–18)", "Lycée (14–18)", "الثانوي (١٤–١٨)"],
    icon: 12,
  },
];
export const SUBJECTS: Choice[] = [
  {
    key: "general",
    title: [
      "General / Cross-Curricular",
      "Général / Transversal",
      "عام / متعدد المواد",
    ],
    icon: 14,
  },
  { key: "math", title: ["Math", "Mathématiques", "الرياضيات"], icon: 14 },
  {
    key: "literacy",
    title: ["Reading & Literacy", "Lecture et langage", "القراءة واللغة"],
    icon: 14,
  },
  { key: "science", title: ["Science", "Sciences", "العلوم"], icon: 14 },
  {
    key: "social-studies",
    title: ["Social Studies", "Sciences humaines", "الدراسات الاجتماعية"],
    icon: 14,
  },
  {
    key: "arts",
    title: ["Arts & Crafts", "Arts et création", "الفنون والأشغال"],
    icon: 14,
  },
  {
    key: "health-sel",
    title: ["Health & SEL", "Bien-être et émotions", "الصحة والتعلم العاطفي"],
    icon: 14,
  },
  {
    key: "physical-education",
    title: ["Physical Education", "Éducation physique", "التربية البدنية"],
    icon: 14,
  },
  {
    key: "special-education",
    title: ["Special Education", "Éducation inclusive", "التربية الخاصة"],
    icon: 14,
  },
  {
    key: "other",
    title: ["Other Subjects", "Autres matières", "مواد أخرى"],
    icon: 14,
  },
];
export const THEMES: Choice[] = [
  {
    key: "back-to-school",
    title: ["Back to School", "Rentrée", "العودة للمدرسة"],
    icon: 16,
  },
  { key: "autumn", title: ["Fall (Autumn)", "Automne", "الخريف"], icon: 17 },
  { key: "halloween", title: ["Halloween", "Halloween", "هالوين"], icon: 18 },
  { key: "winter", title: ["Winter", "Hiver", "الشتاء"], icon: 19 },
  { key: "christmas", title: ["Christmas", "Noël", "عيد الميلاد"], icon: 20 },
  { key: "spring", title: ["Spring", "Printemps", "الربيع"], icon: 21 },
  { key: "summer", title: ["Summer", "Été", "الصيف"], icon: 15 },
  {
    key: "end-of-year",
    title: ["End of Year", "Fin d’année", "نهاية السنة"],
    icon: 22,
  },
];
export const QUICK = [
  "checklists",
  "lesson-plans",
  "parent-communication",
  "certificates",
  "reports",
  "routines",
  "policies",
  "homeschool",
  "special-education",
];
export const USE_KEYS = [...USES.map((x) => x.key), "routines"];
export type DocumentItem = Item & {
  contentLocale: Locale;
  subtype: string;
  documentUses: string[];
  grades: string[];
  themes: string[];
  needs: string[];
  documentSubject: string;
  downloadTotal: number;
  todayDownloads: number;
  rating: number | null;
  ratingCount: number;
  outputs: { id: string; label: string; mime: string }[];
};
export type Testimonial = {
  id: string;
  name: string;
  role: string;
  body: string;
  rating: number;
  resourceKey: string;
  sourceUrl: string;
  portrait: string;
};
export type DocumentsData = {
  configured: boolean;
  setupRequired?: boolean;
  error?: boolean;
  rows: DocumentItem[];
  total: number;
  page: number;
  pageSize: number;
  inventoryTotal: number;
  downloadTotal: number;
  todayTotal: number;
  facets: Record<string, string[]>;
  ranked: DocumentItem[];
  today: DocumentItem[];
  collections: {
    id: string;
    title: string;
    description: string;
    rows: DocumentItem[];
  }[];
  testimonials: Testimonial[];
  updatedAt: string;
  edition: Record<string, any>;
};
export const emptyDocuments = (): DocumentsData => ({
  configured: false,
  rows: [],
  total: 0,
  page: 1,
  pageSize: 10,
  inventoryTotal: 0,
  downloadTotal: 0,
  todayTotal: 0,
  facets: {},
  ranked: [],
  today: [],
  collections: [],
  testimonials: [],
  updatedAt: "",
  edition: {},
});
export const FILTER_KEYS = [
  "q",
  "subtype",
  "use",
  "need",
  "grade",
  "subject",
  "theme",
  "format",
  "language",
  "audience",
  "age",
  "sort",
  "collection",
  "page",
  "view",
] as const;
export type DocumentFilters = Record<string, string>;
export function documentFilters(
  input: Record<string, unknown>,
): DocumentFilters {
  const out: DocumentFilters = {};
  for (const key of FILTER_KEYS) {
    const v = input[key];
    if (typeof v === "string" && v.trim())
      out[key] = v.trim().slice(0, key === "q" ? 100 : 120);
  }
  const enums: Record<string, string[]> = {
    subtype: SUBTYPES.map((x) => x.key),
    use: USE_KEYS,
    need: NEEDS.map((x) => x.key),
    grade: GRADES.map((x) => x.key),
    theme: THEMES.map((x) => x.key),
    language: ["all", "en", "fr", "ar"],
    format: ["PDF", "PNG"],
    sort: ["downloads", "new", "title", "rating"],
    view: ["grid", "list"],
  };
  for (const [key, values] of Object.entries(enums))
    if (out[key] && !values.includes(out[key]))
      throw Error("INVALID_" + key.toUpperCase());
  if (out.collection && !/^[a-z0-9][a-z0-9._-]{1,119}$/.test(out.collection))
    throw Error("INVALID_COLLECTION");
  if (out.age && (!/^\d+(\.\d+)?$/.test(out.age) || Number(out.age) > 120))
    throw Error("INVALID_AGE");
  const page = Number(out.page || 1);
  if (!Number.isSafeInteger(page) || page < 1 || page > 10000)
    throw Error("INVALID_PAGE");
  out.page = String(page);
  return out;
}
export function documentHref(locale: Locale, filters: DocumentFilters = {}) {
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS)
    if (filters[key] && !(key === "page" && filters[key] === "1"))
      params.set(key, filters[key]);
  return `/kidflix/${locale}/explore/documents${params.size ? "?" + params : ""}`;
}
export const documentDetailHref = (r: DocumentItem) =>
  `/kidflix/${r.contentLocale}/experience/${encodeURIComponent(r.key)}`;
export const named = (choices: Choice[], key: string, locale: Locale) => {
  const v = choices.find((x) => x.key === key);
  return v ? tr(v.title, locale) : key;
};
export const tokens = (value: unknown) =>
  typeof value === "string"
    ? [
        ...new Set(
          value
            .split(/\r?\n|,/)
            .map((s) => s.trim())
            .filter(Boolean),
        ),
      ]
    : [];
export function normalizeTestimonials(
  value: unknown,
): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  if (value.length > 12)
    throw Error("At most twelve testimonials per edition.");
  const ids = new Set<string>();
  return value.map((v: any) => {
    if (!v || typeof v !== "object") throw Error("Invalid testimonial.");
    const x = Object.fromEntries(
      [
        "id",
        "name",
        "role",
        "body",
        "resourceKey",
        "sourceUrl",
        "portraitAssetId",
      ].map((k) => [
        k,
        typeof v[k] === "string"
          ? v[k]
              .trim()
              .slice(0, k === "body" ? 700 : k === "sourceUrl" ? 2048 : 180)
          : "",
      ]),
    );
    if (
      !/^[a-z0-9][a-z0-9._-]{1,119}$/.test(x.id) ||
      ids.has(x.id) ||
      !x.name ||
      !x.body ||
      !/^https:\/\//.test(x.sourceUrl) ||
      !Number.isInteger(v.rating) ||
      v.rating < 1 ||
      v.rating > 5 ||
      v.publicationPermission !== true
    )
      throw Error(
        "Each testimonial requires a unique ID, real source URL, author, text, 1–5 rating and confirmed publication permission.",
      );
    const source = new URL(x.sourceUrl);
    if (
      source.protocol !== "https:" ||
      source.username ||
      source.password ||
      !source.hostname
    )
      throw Error("Use a public original source URL without credentials.");
    if (x.resourceKey && !/^[a-z0-9][a-z0-9._-]{1,119}$/.test(x.resourceKey))
      throw Error("Invalid testimonial resource.");
    if (
      x.portraitAssetId &&
      !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
        x.portraitAssetId,
      )
    )
      throw Error("Choose a native approved portrait.");
    ids.add(x.id);
    return { ...x, rating: v.rating, publicationPermission: true };
  });
}
export const validLocale = (x: unknown): x is Locale =>
  typeof x === "string" && isLocale(x);

export function normalizeDocumentSocialLinks(
  value: unknown,
): Record<string, string> {
  const x =
      value && typeof value === "object"
        ? (value as Record<string, unknown>)
        : {},
    out: Record<string, string> = {};
  const hosts: Record<string, string[]> = {
    youtube: ["youtube.com", "youtu.be"],
    pinterest: ["pinterest.com"],
    instagram: ["instagram.com"],
    facebook: ["facebook.com"],
  };
  for (const [key, domains] of Object.entries(hosts)) {
    if (!x[key]) continue;
    if (typeof x[key] !== "string" || (x[key] as string).length > 2048)
      throw Error("Invalid social channel.");
    const u = new URL(x[key] as string);
    if (
      u.protocol !== "https:" ||
      u.username ||
      u.password ||
      !domains.some((d) => u.hostname === d || u.hostname.endsWith("." + d))
    )
      throw Error("Choose the official HTTPS channel on its own platform.");
    out[key] = u.href;
  }
  return out;
}

export function previewDocuments(
  data: DocumentsData,
  edition: {
    headline: string;
    description: string;
    documentsTestimonials?: Record<string, unknown>[];
    documentsSocialLinks?: Record<string, string>;
  },
  portraits: Record<string, string> = {},
): DocumentsData {
  const testimonials = (edition.documentsTestimonials || []).flatMap(
    (value) => {
      try {
        const t = normalizeTestimonials([value])[0];
        return [
          {
            id: String(t.id),
            name: String(t.name),
            role: String(t.role),
            body: String(t.body),
            rating: Number(t.rating),
            resourceKey: String(t.resourceKey),
            sourceUrl: String(t.sourceUrl),
            portrait:
              typeof value.portraitPreviewUrl === "string" &&
              /^(https:\/\/|\/(?!\/))/.test(value.portraitPreviewUrl)
                ? value.portraitPreviewUrl
                : portraits[String(t.portraitAssetId)] || "",
          },
        ];
      } catch {
        return [];
      }
    },
  );
  return {
    ...data,
    edition: {
      ...data.edition,
      headline: edition.headline,
      description: edition.description,
      documentsSocialLinks: edition.documentsSocialLinks || {},
    },
    testimonials,
    rows: data.rows.map((r) => {
      const ratings = testimonials.filter((t) => t.resourceKey === r.key);
      return {
        ...r,
        rating: ratings.length
          ? ratings.reduce((n, t) => n + t.rating, 0) / ratings.length
          : null,
        ratingCount: ratings.length,
      };
    }),
  };
}
