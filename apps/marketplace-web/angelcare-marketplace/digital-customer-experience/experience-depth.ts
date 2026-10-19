import {
  array,
  object,
  text,
  number,
  type Data,
  type Family,
  type Field,
  type Collection,
  type Locale,
  type Issue,
  type Tri,
} from "./types";

export const DEPTH_CONTRACT = "ANGELCARE_DCE_EXPERIENCE_R7";
const label = (en: string, fr: string, ar: string): Tri => [en, fr, ar];
const field = (
  key: string,
  en: string,
  fr: string,
  ar: string,
  type: Field["type"] = "text",
  extra: Partial<Field> = {},
): Field => ({ key, label: label(en, fr, ar), type, ...extra });
const local = (
  key: string,
  en: string,
  fr: string,
  ar: string,
  type: Field["type"] = "textarea",
) => field(key, en, fr, ar, type, { localized: true });
const select = (
  key: string,
  en: string,
  fr: string,
  ar: string,
  options: string[],
) => field(key, en, fr, ar, "select", { options });
const id = field(
  "id",
  "Stable identity",
  "Identité stable",
  "هوية ثابتة",
  "text",
  { required: true },
);
const enabled = field("enabled", "Enabled", "Activé", "مفعل", "toggle", {
  defaultValue: false,
});
export const DEPTH_FIELDS: Field[] = [
  field("subject", "Subject", "Matière", "المادة"),
  field(
    "skillTags",
    "Skills · one per line",
    "Compétences · une par ligne",
    "المهارات · واحدة في كل سطر",
    "textarea",
  ),
  select("difficulty", "Difficulty", "Difficulté", "الصعوبة", [
    "introductory",
    "developing",
    "confident",
    "advanced",
  ]),
  field(
    "educationalLevel",
    "Educational level",
    "Niveau éducatif",
    "المستوى التعليمي",
  ),
  field(
    "estimatedMinutes",
    "Estimated minutes",
    "Minutes estimées",
    "الدقائق المقدرة",
    "number",
    { min: 0, max: 1440 },
  ),
  local(
    "learningObjectives",
    "Learning objectives",
    "Objectifs pédagogiques",
    "أهداف التعلم",
  ),
  local(
    "materials",
    "Materials needed",
    "Matériel nécessaire",
    "المواد المطلوبة",
  ),
  local(
    "caregiverGuidance",
    "Adult guidance",
    "Accompagnement adulte",
    "إرشادات للمرافق",
  ),
  local(
    "discoveryTitle",
    "Discovery title",
    "Titre de découverte",
    "عنوان الاكتشاف",
    "text",
  ),
  local(
    "seoDescription",
    "Discovery description",
    "Description de découverte",
    "وصف الاكتشاف",
  ),
  local(
    "slug",
    "Language URL label",
    "Libellé URL de la langue",
    "اسم رابط اللغة",
    "text",
  ),
  select(
    "continuityPolicy",
    "Personal continuity",
    "Continuité personnelle",
    "استمرارية شخصية",
    ["none", "session", "device"],
  ),
  field(
    "progressTtlDays",
    "Personal progress expiry · days",
    "Expiration progression · jours",
    "انتهاء التقدم · أيام",
    "number",
    { min: 1, max: 365 },
  ),
  select(
    "releaseChangePolicy",
    "When the edition changes",
    "Si l’édition change",
    "عند تغيير النسخة",
    ["ask", "compatible_units", "restart"],
  ),
  field(
    "reducedMotion",
    "Prefer reduced motion",
    "Préférer les animations réduites",
    "تفضيل تقليل الحركة",
    "toggle",
  ),
  field(
    "resultsEnabled",
    "Show authored results",
    "Afficher les résultats rédigés",
    "عرض النتائج المؤلفة",
    "toggle",
  ),
];
export const DEPTH_COLLECTIONS: Collection[] = [
  {
    key: "resultBands",
    label: label(
      "Results & guidance",
      "Résultats et conseils",
      "النتائج والإرشاد",
    ),
    max: 30,
    fields: [
      id,
      local(
        "title",
        "Result title",
        "Titre du résultat",
        "عنوان النتيجة",
        "text",
      ),
      local(
        "text",
        "Result explanation",
        "Explication du résultat",
        "شرح النتيجة",
      ),
      local(
        "guidance",
        "Next-step guidance",
        "Conseil pour la suite",
        "إرشادات الخطوة التالية",
      ),
      field(
        "minScore",
        "Minimum score %",
        "Score minimum %",
        "أقل نتيجة %",
        "number",
        { min: 0, max: 100 },
      ),
      field(
        "maxScore",
        "Maximum score %",
        "Score maximum %",
        "أعلى نتيجة %",
        "number",
        { min: 0, max: 100 },
      ),
      select(
        "completionState",
        "Applies when",
        "Applicable quand",
        "يطبق عند",
        ["any", "complete", "incomplete", "timeout"],
      ),
      local(
        "badgeLabel",
        "Badge label",
        "Libellé du badge",
        "عنوان الشارة",
        "text",
      ),
      select("action", "Next action", "Action suivante", "الإجراء التالي", [
        "none",
        "retry",
        "review",
        "continue",
        "practice",
        "download",
      ]),
      field(
        "experienceId",
        "Next experience",
        "Expérience suivante",
        "التجربة التالية",
        "reference",
        { reference: "experience" },
      ),
      field("priority", "Priority", "Priorité", "الأولوية", "number"),
    ],
  },
  {
    key: "recommendations",
    label: label(
      "Contextual recommendations",
      "Recommandations contextuelles",
      "توصيات سياقية",
    ),
    max: 60,
    fields: [
      id,
      select("role", "Purpose", "Rôle", "الغرض", [
        "related",
        "next",
        "alternative",
        "remedial",
      ]),
      field(
        "experienceId",
        "Experience",
        "Expérience",
        "التجربة",
        "reference",
        { reference: "experience" },
      ),
      local(
        "label",
        "Recommendation label",
        "Libellé de recommandation",
        "عنوان التوصية",
        "text",
      ),
      field(
        "minScore",
        "Minimum score %",
        "Score minimum %",
        "أقل نتيجة %",
        "number",
        { min: 0, max: 100 },
      ),
      field(
        "maxScore",
        "Maximum score %",
        "Score maximum %",
        "أعلى نتيجة %",
        "number",
        { min: 0, max: 100 },
      ),
      select(
        "completionState",
        "Applies when",
        "Applicable quand",
        "يطبق عند",
        ["any", "complete", "incomplete"],
      ),
      field("priority", "Priority", "Priorité", "الأولوية", "number"),
    ],
  },
  {
    key: "exportLayouts",
    label: label(
      "Personal PDF / PNG layouts",
      "Mises en page PDF / PNG personnelles",
      "تخطيطات PDF / PNG الشخصية",
    ),
    max: 20,
    fields: [
      id,
      enabled,
      local(
        "title",
        "Document title",
        "Titre du document",
        "عنوان المستند",
        "text",
      ),
      select(
        "purpose",
        "Source of content",
        "Source du contenu",
        "مصدر المحتوى",
        ["result", "planner", "questionnaire", "cards", "pages", "tool"],
      ),
      select("mime", "File format", "Format du fichier", "صيغة الملف", [
        "application/pdf",
        "image/png",
      ]),
      select(
        "scope",
        "Pages to include",
        "Pages à inclure",
        "الصفحات المطلوبة",
        ["whole", "page", "selection"],
      ),
      field(
        "unitIds",
        "Selected unit IDs · comma separated",
        "IDs choisis · séparés par virgules",
        "معرفات الوحدات المختارة",
        "textarea",
      ),
      select("paper", "Paper size", "Format du papier", "حجم الورق", [
        "A4",
        "Letter",
      ]),
      select("orientation", "Orientation", "Orientation", "الاتجاه", [
        "portrait",
        "landscape",
      ]),
      field(
        "marginMm",
        "Margins · mm",
        "Marges · mm",
        "الهوامش · مم",
        "number",
        { min: 8, max: 35 },
      ),
      field(
        "dpi",
        "Image resolution",
        "Résolution de l’image",
        "دقة الصورة",
        "number",
        { min: 96, max: 200 },
      ),
      field(
        "maxPages",
        "Maximum pages",
        "Pages maximum",
        "أقصى عدد صفحات",
        "number",
        { min: 1, max: 40 },
      ),
      field("fileName", "Download filename", "Nom du fichier", "اسم الملف"),
      local(
        "watermark",
        "Optional watermark",
        "Filigrane facultatif",
        "علامة مائية اختيارية",
        "text",
      ),
      field(
        "includeBrand",
        "Include AngelCare heading",
        "Inclure l’en-tête AngelCare",
        "إضافة عنوان AngelCare",
        "toggle",
      ),
    ],
  },
  {
    key: "discoveryPlacements",
    label: label(
      "Discovery placements",
      "Emplacements découverte",
      "مواضع الاكتشاف",
    ),
    max: 40,
    fields: [
      id,
      enabled,
      select("slot", "Placement", "Emplacement", "الموضع", [
        "featured",
        "collection",
        "topic",
        "skill",
        "seasonal",
      ]),
      field(
        "collectionKey",
        "Collection key",
        "Clé de collection",
        "مفتاح المجموعة",
      ),
      local(
        "label",
        "Visible label",
        "Libellé visible",
        "العنوان الظاهر",
        "text",
      ),
      field("priority", "Priority", "Priorité", "الأولوية", "number"),
      field(
        "startsAt",
        "Starts · ISO date",
        "Début · date ISO",
        "البداية · تاريخ ISO",
      ),
      field(
        "endsAt",
        "Ends · ISO date",
        "Fin · date ISO",
        "النهاية · تاريخ ISO",
      ),
    ],
  },
  {
    key: "adBreaks",
    label: label(
      "Advertising journey map",
      "Carte publicitaire du parcours",
      "خريطة الإعلانات للمسار",
    ),
    max: 80,
    fields: [
      id,
      enabled,
      select(
        "event",
        "Natural opportunity",
        "Occasion naturelle",
        "فرصة طبيعية",
        [
          "after_intro",
          "after_section",
          "after_completion",
          "before_download",
          "natural_break",
          "pre_roll",
          "post_roll",
        ],
      ),
      field(
        "unitId",
        "Content unit · optional",
        "Unité · facultative",
        "وحدة المحتوى · اختيارية",
      ),
      field(
        "timestamp",
        "Position · seconds",
        "Position · secondes",
        "الموضع · ثانية",
        "number",
        { min: 0 },
      ),
      field(
        "adPolicyId",
        "Governing advertising policy",
        "Politique publicitaire",
        "سياسة الإعلان",
        "reference",
        { reference: "record" },
      ),
      local(
        "label",
        "Internal placement label",
        "Libellé interne",
        "عنوان الموضع",
        "text",
      ),
    ],
  },
  {
    key: "editionOrder",
    label: label(
      "Independent language structure",
      "Structure indépendante par langue",
      "بنية مستقلة لكل لغة",
    ),
    max: 500,
    fields: [
      id,
      select("locale", "Language", "Langue", "اللغة", ["ar", "fr", "en"]),
      field(
        "collection",
        "Content collection",
        "Collection de contenu",
        "مجموعة المحتوى",
      ),
      field(
        "unitId",
        "Stable unit ID",
        "ID stable de l’unité",
        "معرف الوحدة الثابت",
      ),
      field(
        "enabled",
        "Include in this language",
        "Inclure dans cette langue",
        "تضمين في هذه اللغة",
        "toggle",
      ),
      field("position", "Position", "Position", "الترتيب", "number", {
        min: 0,
      }),
    ],
  },
];
export function deepenFamily(f: Family): Family {
  return {
    ...f,
    fields: [...f.fields, ...DEPTH_FIELDS],
    collections: [
      ...f.collections
        .map((c) => ({
          ...c,
          fields: c.fields.map((f) =>
            f.key === "condition"
              ? {
                  ...f,
                  options: [
                    ...(f.options || []),
                    "score_at_least",
                    "score_below",
                    "passed",
                    "failed",
                  ],
                }
              : c.key === "questions" && f.key === "type"
                ? { ...f, options: [...(f.options || []), "number"] }
                : f,
          ),
        }))
        .map((c) =>
          c.key === "questions"
            ? {
                ...c,
                fields: [
                  ...c.fields,
                  field(
                    "choiceKeys",
                    "Stable choice keys · one per line",
                    "Clés stables des choix · une par ligne",
                    "معرفات الخيارات · واحد في كل سطر",
                    "textarea",
                  ),
                  field(
                    "correctKeys",
                    "Correct choice keys · comma separated",
                    "Clés des bonnes réponses",
                    "معرفات الإجابات الصحيحة",
                    "text",
                    { classification: "private" },
                  ),
                  select(
                    "credit",
                    "Scoring rule",
                    "Règle de notation",
                    "قاعدة التقييم",
                    ["exact", "partial"],
                  ),
                  field(
                    "tolerance",
                    "Numeric tolerance",
                    "Tolérance numérique",
                    "سماحية رقمية",
                    "number",
                    { min: 0 },
                  ),
                  field(
                    "acceptedAnswers",
                    "Accepted text · one per line",
                    "Textes acceptés · un par ligne",
                    "إجابات نصية مقبولة",
                    "textarea",
                    { classification: "private" },
                  ),
                  select(
                    "normalization",
                    "Text matching",
                    "Correspondance du texte",
                    "مطابقة النص",
                    ["trim_case", "exact", "diacritics"],
                  ),
                  field(
                    "skill",
                    "Assessed skill",
                    "Compétence évaluée",
                    "المهارة المقيمة",
                  ),
                  field(
                    "assetId",
                    "Question illustration",
                    "Illustration de la question",
                    "صورة السؤال",
                    "reference",
                    { reference: "media", mime: ["image/"] },
                  ),
                ],
              }
            : c.key === "tasks"
              ? {
                  ...c,
                  fields: [
                    ...c.fields,
                    field(
                      "assetId",
                      "Activity illustration",
                      "Illustration de l’activité",
                      "صورة النشاط",
                      "reference",
                      { reference: "media", mime: ["image/"] },
                    ),
                  ],
                }
              : c,
        ),
      ...DEPTH_COLLECTIONS,
      ...(f.key === "stories"
        ? [
            {
              key: "storyChoices",
              label: label(
                "Story branches",
                "Branches du récit",
                "تفرعات القصة",
              ),
              max: 120,
              fields: [
                id,
                field("unitId", "From page ID", "Depuis la page", "من الصفحة"),
                local(
                  "label",
                  "Choice label",
                  "Libellé du choix",
                  "عنوان الخيار",
                  "text",
                ),
                field("nextUnitId", "To page ID", "Vers la page", "إلى الصفحة"),
              ],
            },
          ]
        : []),
    ],
  };
}
export function shuffled<T>(
  items: T[],
  random: () => number = Math.random,
): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(
      Math.max(0, Math.min(0.999999999, random())) * (i + 1),
    );
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
export function choiceOptions(q: Data, locale: Locale) {
  const labels = (
      text(object(object(q.locales)[locale]).choices) || text(q.choices)
    )
      .split("\n")
      .filter(Boolean),
    keys = text(q.choiceKeys).split("\n").filter(Boolean);
  return labels.map((label, i) => ({ label, key: keys[i] || String(i) }));
}
function normalize(v: string, mode: string) {
  if (mode === "exact") return v;
  let s = v.trim().toLocaleLowerCase();
  return mode === "diacritics" ? s.normalize("NFD").replace(/\p{M}/gu, "") : s;
}
export function gradeQuestions(
  questions: Data[],
  answers: Record<string, string>,
) {
  let earned = 0,
    total = 0;
  const skills: Record<string, { earned: number; total: number }> = {};
  const results = questions.map((q) => {
    const points = Math.max(0, number(q.points, 1)),
      actual = answers[text(q.id)] ?? "",
      type = text(q.type),
      mode = text(q.normalization);
    let fraction = 0;
    if (type === "multi" || type === "choice") {
      const expected = new Set(
          (text(q.correctKeys) || text(q.answer))
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        ),
        given = new Set(actual.split(",").filter(Boolean));
      if (expected.size) {
        const hit = [...given].filter((v) => expected.has(v)).length,
          wrong = given.size - hit;
        fraction =
          type === "multi" && q.credit === "partial"
            ? Math.max(0, (hit - wrong) / expected.size)
            : given.size === expected.size && hit === expected.size
              ? 1
              : 0;
      }
    } else if (type === "number") {
      const expected = Number(text(q.answer)),
        value = Number(actual);
      fraction =
        actual.trim() !== "" &&
        Number.isFinite(expected) &&
        Number.isFinite(value) &&
        Math.abs(value - expected) <= Math.max(0, number(q.tolerance))
          ? 1
          : 0;
    } else {
      const expected = (text(q.acceptedAnswers) || text(q.answer))
        .split("\n")
        .filter(Boolean);
      fraction =
        actual.trim() &&
        expected.some((v) => normalize(v, mode) === normalize(actual, mode))
          ? 1
          : 0;
    }
    const awarded = points * fraction;
    total += points;
    earned += awarded;
    const skill = text(q.skill);
    if (skill) {
      skills[skill] ??= { earned: 0, total: 0 };
      skills[skill].earned += awarded;
      skills[skill].total += points;
    }
    return {
      id: text(q.id),
      correct: fraction === 1,
      points: awarded,
      explanation: text(q.explanation),
    };
  });
  return {
    earned,
    total,
    percent: total ? Math.round((earned / total) * 100) : 0,
    results,
    skills,
  };
}
export function selectResult(
  data: Data,
  score: number | undefined,
  complete: boolean,
  timeout = false,
) {
  return array(data.resultBands)
    .filter(
      (b) =>
        (score === undefined
          ? b.minScore == null && b.maxScore == null
          : score >= number(b.minScore) && score <= number(b.maxScore, 100)) &&
        (!b.completionState ||
          b.completionState === "any" ||
          b.completionState ===
            (timeout ? "timeout" : complete ? "complete" : "incomplete")),
    )
    .sort((a, b) => number(b.priority) - number(a.priority))[0];
}
export function contextualRecommendations(
  data: Data,
  score: number | undefined,
  complete: boolean,
) {
  return array(data.recommendations)
    .filter(
      (b) =>
        b.experienceId &&
        (score === undefined
          ? b.minScore == null && b.maxScore == null
          : score >= number(b.minScore) && score <= number(b.maxScore, 100)) &&
        (!b.completionState ||
          b.completionState === "any" ||
          b.completionState === (complete ? "complete" : "incomplete")),
    )
    .sort((a, b) => number(b.priority) - number(a.priority));
}
export function applyEditionOrder(data: Data, locale: Locale): Data {
  const out = { ...data };
  const rules = array(data.editionOrder).filter((r) => r.locale === locale);
  for (const key of new Set(rules.map((r) => text(r.collection)))) {
    const entries = rules.filter((r) => r.collection === key),
      index = new Map(entries.map((r) => [text(r.unitId), r]));
    out[key] = array(data[key])
      .filter((u) => index.get(text(u.id))?.enabled !== false)
      .map((u, i) => ({ u, i }))
      .sort(
        (a, b) =>
          number(index.get(text(a.u.id))?.position, a.i) -
          number(index.get(text(b.u.id))?.position, b.i),
      )
      .map((x) => x.u);
  }
  delete out.editionOrder;
  return out;
}
export function depthIssues(data: Data, family: Family | undefined): Issue[] {
  const out: Issue[] = [];
  const fail = (path: string, en: string, fr: string, ar: string) =>
    out.push({
      path,
      code: "EXPERIENCE_R7",
      message: [en, fr, ar],
      severity: "error",
    });
  const units = new Map(
    (
      family?.collections
        .filter((c) => !DEPTH_COLLECTIONS.some((x) => x.key === c.key))
        .flatMap((c) => array(data[c.key])) || []
    ).map((u) => [text(u.id), u]),
  );
  for (const q of array(data.questions)) {
    const keys = text(q.choiceKeys).split("\n").filter(Boolean),
      choices = text(q.choices).split("\n").filter(Boolean),
      correct = text(q.correctKeys).split(",").filter(Boolean);
    if (
      keys.length &&
      (keys.length !== choices.length ||
        new Set(keys).size !== keys.length ||
        keys.some((k) => /[,\s]/.test(k)))
    )
      fail(
        "questions." + q.id + ".choiceKeys",
        "Choice keys must be unique, one per choice, without whitespace or commas.",
        "Les clés doivent être uniques, une par choix, sans espace ni virgule.",
        "يجب أن تكون معرفات الخيارات فريدة دون مسافات أو فواصل.",
      );
    if (correct.length && correct.some((k) => !keys.includes(k)))
      fail(
        "questions." + q.id + ".correctKeys",
        "Correct keys must identify existing choices.",
        "Les bonnes réponses doivent désigner des choix existants.",
        "يجب أن تشير الإجابات الصحيحة إلى خيارات موجودة.",
      );
    if (
      q.type === "number" &&
      (!text(q.answer) || !Number.isFinite(Number(q.answer)))
    )
      fail(
        "questions." + q.id + ".answer",
        "A finite numeric answer is required.",
        "Une réponse numérique finie est requise.",
        "الإجابة الرقمية المحددة مطلوبة.",
      );
  }
  for (const c of DEPTH_COLLECTIONS)
    for (const row of array(data[c.key])) {
      if (row.enabled === false) continue;
      for (const f of c.fields) {
        const v = row[f.key];
        if (
          f.type === "select" &&
          v &&
          f.options &&
          !f.options.includes(text(v))
        )
          fail(
            c.key + "." + row.id + "." + f.key,
            "Choose a supported option.",
            "Choisissez une option prise en charge.",
            "اختر خياراً مدعوماً.",
          );
        if (
          f.type === "number" &&
          v != null &&
          (typeof v !== "number" ||
            !Number.isFinite(v) ||
            (f.min != null && v < f.min) ||
            (f.max != null && v > f.max))
        )
          fail(
            c.key + "." + row.id + "." + f.key,
            "Use a finite number within the declared limits.",
            "Utilisez un nombre fini dans les limites indiquées.",
            "استخدم رقماً محدداً ضمن الحدود المعلنة.",
          );
      }
    }
  for (const r of array(data.recommendations))
    if (!/^[a-f0-9-]{36}$/i.test(text(r.experienceId)))
      fail(
        "recommendations." + r.id,
        "Select a real native experience.",
        "Choisissez une expérience native réelle.",
        "اختر تجربة أصلية موجودة.",
      );
  if (
    data.resultsEnabled === true &&
    array(data.resultBands).some(
      (b) => b.minScore != null || b.maxScore != null,
    )
  ) {
    const bands = array(data.resultBands).filter(
      (b) =>
        !b.completionState ||
        ["any", "complete"].includes(text(b.completionState)),
    );
    for (let n = 0; n <= 100; n++)
      if (
        !bands.some(
          (b) => n >= number(b.minScore) && n <= number(b.maxScore, 100),
        )
      ) {
        fail(
          "resultBands",
          "Cover every complete-result score from 0 to 100, or use an unbounded result.",
          "Couvrez tous les scores terminés de0 à100, ou utilisez un résultat sans borne.",
          "غط جميع نتائج الإكمال من0 إلى100 أو استخدم نتيجة غير محددة.",
        );
        break;
      }
  }
  for (const key of ["resultBands", "recommendations"])
    for (const b of array(data[key]))
      if (
        number(b.minScore) < 0 ||
        number(b.maxScore, 100) > 100 ||
        number(b.minScore) > number(b.maxScore, 100)
      )
        fail(
          key + "." + b.id,
          "Score range must be within 0–100 and ordered.",
          "La plage doit être ordonnée entre 0 et 100.",
          "يجب ترتيب نطاق النتيجة بين 0 و100.",
        );
  if (data.resultsEnabled === true && !array(data.resultBands).length)
    fail(
      "resultBands",
      "Author a result before enabling authored results.",
      "Rédigez un résultat avant de l’activer.",
      "أضف نتيجة قبل تفعيل النتائج المؤلفة.",
    );
  for (const r of array(data.editionOrder)) {
    if (
      !["en", "fr", "ar"].includes(text(r.locale)) ||
      !family?.collections.some(
        (c) =>
          c.key === r.collection &&
          !DEPTH_COLLECTIONS.some((x) => x.key === c.key),
      ) ||
      !array(data[text(r.collection)]).some((u) => u.id === r.unitId)
    )
      fail(
        "editionOrder." + r.id,
        "Language ordering must reference an existing content unit.",
        "La structure de langue doit viser une unité existante.",
        "يجب أن يشير ترتيب اللغة إلى وحدة محتوى موجودة.",
      );
  }
  for (const l of array(data.exportLayouts).filter((l) => l.enabled === true)) {
    if (
      !["application/pdf", "image/png"].includes(text(l.mime)) ||
      ![
        "result",
        "planner",
        "questionnaire",
        "cards",
        "pages",
        "tool",
      ].includes(text(l.purpose)) ||
      number(l.maxPages, 10) < 1 ||
      number(l.maxPages, 10) > 40
    )
      fail(
        "exportLayouts." + l.id,
        "Choose a supported personal output and a page limit of 1–40.",
        "Choisissez une sortie compatible et une limite de 1 à 40 pages.",
        "اختر مخرجاً مدعوماً وحداً من صفحة إلى40.",
      );
    const ids = text(l.unitIds)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (
      l.scope === "selection" &&
      (!ids.length || ids.some((id) => !units.has(id)))
    )
      fail(
        "exportLayouts." + l.id + ".unitIds",
        "Choose existing units for selected-page output.",
        "Choisissez des unités existantes pour la sélection.",
        "اختر وحدات موجودة للتصدير المحدد.",
      );
  }
  for (const a of array(data.adBreaks).filter((a) => a.enabled === true))
    if (
      !text(a.adPolicyId) ||
      (a.unitId && !units.has(text(a.unitId))) ||
      number(a.timestamp) < 0
    )
      fail(
        "adBreaks." + a.id,
        "An advertising opportunity needs a real policy and valid content position.",
        "Une opportunité publicitaire nécessite une politique et une position valides.",
        "تحتاج الفرصة الإعلانية إلى سياسة وموضع محتوى صالحين.",
      );
  for (const p of array(data.discoveryPlacements).filter(
    (p) => p.enabled === true,
  ))
    if (
      (p.startsAt && !Number.isFinite(Date.parse(text(p.startsAt)))) ||
      (p.endsAt && !Number.isFinite(Date.parse(text(p.endsAt)))) ||
      (p.startsAt &&
        p.endsAt &&
        Date.parse(text(p.startsAt)) >= Date.parse(text(p.endsAt)))
    )
      fail(
        "discoveryPlacements." + p.id,
        "Supply valid, ordered ISO dates.",
        "Fournissez des dates ISO valides et ordonnées.",
        "أدخل تواريخ ISO صالحة ومرتبة.",
      );
  for (const node of [...array(data.steps), ...array(data.units)])
    if (
      ["score_at_least", "score_below", "passed", "failed"].includes(
        text(node.condition),
      ) &&
      (!units.has(text(node.conditionTarget)) ||
        node.id === node.conditionTarget ||
        !Number.isFinite(Number(node.conditionValue ?? 70)) ||
        number(node.conditionValue, 70) < 0 ||
        number(node.conditionValue, 70) > 100)
    )
      fail(
        "journey." + node.id,
        "Score branches require another real unit and a 0–100 threshold.",
        "Une branche de score exige une autre unité et un seuil entre 0 et 100.",
        "يتطلب تفرع النتيجة وحدة أخرى وعتبة بين0 و100.",
      );
  const nodes = [...array(data.units), ...array(data.steps)],
    edges = new Map(
      nodes.map((n) => [
        text(n.id),
        [
          ...(Array.isArray(n.prerequisites)
            ? n.prerequisites.map(String)
            : text(n.prerequisites).split(",").filter(Boolean)),
          ...(n.conditionTarget && n.condition !== "always"
            ? [text(n.conditionTarget)]
            : []),
        ],
      ]),
    );
  for (const start of nodes) {
    const visiting = new Set<string>(),
      visited = new Set<string>();
    let cycle = false;
    const walk = (id: string) => {
      if (visiting.has(id)) {
        cycle = true;
        return;
      }
      if (visited.has(id)) return;
      visited.add(id);
      visiting.add(id);
      for (const child of edges.get(id) || []) walk(child);
      visiting.delete(id);
    };
    walk(text(start.id));
    if (cycle) {
      fail(
        "journey." + start.id,
        "Prerequisite and conditional dependencies must not form a cycle.",
        "Prérequis et conditions ne doivent pas former de cycle.",
        "يجب ألا تشكل المتطلبات والشروط دورة.",
      );
      break;
    }
  }
  for (const b of array(data.storyChoices))
    if (!units.has(text(b.unitId)) || !units.has(text(b.nextUnitId)))
      fail(
        "storyChoices." + b.id,
        "Both story pages must exist.",
        "Les deux pages du récit doivent exister.",
        "يجب أن توجد صفحتا القصة.",
      );
  return out;
}
export function restorePersonalState(
  saved: unknown,
  recordId: string,
  locale: Locale,
  revision: number,
  data: Data,
  now = Date.now(),
): { state: Data; needsDecision: boolean } | null {
  const s = object(saved);
  if (
    s.contract !== DEPTH_CONTRACT ||
    s.recordId !== recordId ||
    s.locale !== locale ||
    typeof s.savedAt !== "number" ||
    now - number(s.savedAt) >
      Math.max(1, number(data.progressTtlDays, 30)) * 86400000
  )
    return null;
  const changed = s.revision !== revision;
  if (changed && data.releaseChangePolicy === "restart") return null;
  const state={...object(s.state)};
  if(changed){const ids=new Set(['units','cards','questions','frames','steps','items','fields'].flatMap(key=>array(data[key]).map(u=>text(u.id))));for(const key of ['answers','values','childStates'])if(state[key])state[key]=Object.fromEntries(Object.entries(object(state[key])).filter(([id])=>ids.has(id)));for(const key of ['completed','known'])if(Array.isArray(state[key]))state[key]=(state[key] as unknown[]).map(String).filter(id=>ids.has(id));state.complete=false;state.score=null;delete state.skills;const count=['units','cards','questions','frames','steps'].map(key=>array(data[key]).length).find(Boolean)||1;state.index=Math.max(0,Math.min(number(state.index),count-1));}
  return {
    state,
    needsDecision: changed && data.releaseChangePolicy !== "compatible_units",
  };
}
