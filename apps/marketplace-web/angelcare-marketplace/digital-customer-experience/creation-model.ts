import { blankRecord, validateRecord } from "./model";
import {
  createUnit,
  definitionDefaults,
  modeContract,
  LOCALIZED_FIELDS,
} from "./capabilities";
import { FAMILIES, familyByKey } from "./registry";
import {
  array,
  object,
  text,
  type Collection,
  type Data,
  type DceRecord,
  type Field,
  type Issue,
  type Locale,
  type Tri,
} from "./types";

export const CREATION_CONTRACT = "KIDFLIX_CREATION_STUDIO_R1";
const label = (en: string, fr: string, ar: string): Tri => [en, fr, ar];
export const CREATION_PLANS: Record<
  string,
  {
    collection: string;
    title: Tri;
    add: Tri;
    hint: Tri;
    accept: string;
    style: string;
  }
> = {
  documents: {
    collection: "units",
    title: label("Document desk", "Atelier document", "ورشة الوثائق"),
    add: label("Add a chapter", "Ajouter un chapitre", "إضافة فصل"),
    hint: label(
      "Drop a PDF, or write your article here.",
      "Déposez un PDF ou rédigez votre article ici.",
      "أضف ملف PDF أو اكتب مقالك هنا.",
    ),
    accept: "application/pdf,image/jpeg,image/png,image/webp,image/avif",
    style: "reader",
  },
  printables: {
    collection: "units",
    title: label("Printable pack", "Atelier d’impression", "حزمة الطباعة"),
    add: label("Add a sheet", "Ajouter une fiche", "إضافة ورقة"),
    hint: label(
      "Drop your PDF or images. Arrange the sheets in their reading order.",
      "Déposez vos PDF ou images, puis ordonnez les fiches.",
      "أضف ملفات PDF أو الصور ورتب الأوراق.",
    ),
    accept: "application/pdf,image/jpeg,image/png,image/webp,image/avif",
    style: "sheets",
  },
  stories: {
    collection: "units",
    title: label("Story board", "Chemin de l’histoire", "لوحة القصة"),
    add: label("Add a story page", "Ajouter une page", "إضافة صفحة"),
    hint: label(
      "Add illustrated pages or text. Narration stays optional in ordinary reading mode.",
      "Ajoutez les pages illustrées ou le texte. La narration est facultative en lecture simple.",
      "أضف صفحات مصورة أو نصاً. السرد اختياري في القراءة العادية.",
    ),
    accept: "image/jpeg,image/png,image/webp,image/avif",
    style: "story",
  },
  learning: {
    collection: "units",
    title: label("Course builder", "Programme de formation", "بناء الدورة"),
    add: label("Add a lesson", "Ajouter une leçon", "إضافة درس"),
    hint: label(
      "Build your curriculum from videos, documents, audio and written lessons.",
      "Composez votre programme avec vidéos, documents, sons et leçons rédigées.",
      "أنشئ منهجك من الفيديو والوثائق والصوت والدروس المكتوبة.",
    ),
    accept:
      "video/mp4,video/webm,audio/mpeg,application/pdf,image/jpeg,image/png,image/webp",
    style: "curriculum",
  },
  video: {
    collection: "units",
    title: label("Video studio", "Studio vidéo", "استوديو الفيديو"),
    add: label("Add a video", "Ajouter une vidéo", "إضافة فيديو"),
    hint: label(
      "Upload a video. Its duration is read from the selected file.",
      "Déposez une vidéo. Sa durée est lue depuis le fichier sélectionné.",
      "ارفع فيديو. تُقرأ مدته من الملف المحدد.",
    ),
    accept: "video/mp4,video/webm",
    style: "video",
  },
  audio: {
    collection: "units",
    title: label("Audio studio", "Studio audio", "استوديو الصوت"),
    add: label("Add a track", "Ajouter une piste", "إضافة مقطع"),
    hint: label(
      "Add one recording or build a playlist.",
      "Ajoutez un enregistrement ou composez une liste d’écoute.",
      "أضف تسجيلاً أو أنشئ قائمة استماع.",
    ),
    accept: "audio/mpeg",
    style: "audio",
  },
  "visual-cards": {
    collection: "cards",
    title: label("Card collection", "Collection de cartes", "مجموعة البطاقات"),
    add: label("Add a card", "Ajouter une carte", "إضافة بطاقة"),
    hint: label(
      "Add the fronts, then attach backs where needed.",
      "Ajoutez les rectos, puis les versos si nécessaire.",
      "أضف أوجه البطاقات ثم ظهورها عند الحاجة.",
    ),
    accept: "image/jpeg,image/png,image/webp,image/avif",
    style: "cards",
  },
  presentations: {
    collection: "frames",
    title: label(
      "Presentation studio",
      "Atelier de présentation",
      "ورشة العروض",
    ),
    add: label("Add a slide", "Ajouter une diapositive", "إضافة شريحة"),
    hint: label(
      "Add slide images or write slides directly. Reorder by dragging or with the arrows.",
      "Ajoutez des images ou rédigez les diapositives. Réordonnez par glisser-déposer ou avec les flèches.",
      "أضف صور الشرائح أو اكتبها ورتبها بالسحب أو الأسهم.",
    ),
    accept: "image/jpeg,image/png,image/webp,image/avif",
    style: "slides",
  },
  assessments: {
    collection: "questions",
    title: label("Question studio", "Atelier de questions", "ورشة الأسئلة"),
    add: label("Add a question", "Ajouter une question", "إضافة سؤال"),
    hint: label(
      "Write a question, add choices and select the correct answer. Paste rows to work in bulk.",
      "Rédigez la question, ajoutez les choix et sélectionnez la bonne réponse. Collez des lignes pour travailler en lot.",
      "اكتب السؤال وأضف الخيارات وحدد الإجابة الصحيحة. ألصق صفوفاً للعمل بالجملة.",
    ),
    accept: "",
    style: "questions",
  },
  activities: {
    collection: "tasks",
    title: label("Activity workshop", "Atelier d’activités", "ورشة الأنشطة"),
    add: label("Add an activity item", "Ajouter un élément", "إضافة عنصر"),
    hint: label(
      "Choose the activity first. Its own instructions and response controls appear below.",
      "Choisissez l’activité. Ses consignes et ses contrôles de réponse apparaissent ci-dessous.",
      "اختر النشاط لتظهر تعليماته وأدوات الإجابة.",
    ),
    accept: "image/jpeg,image/png,image/webp,image/avif",
    style: "activity",
  },
  tools: {
    collection: "inputs",
    title: label("Tool configurator", "Configurateur d’outil", "إعداد الأداة"),
    add: label("Add an input", "Ajouter une entrée", "إضافة مُدخل"),
    hint: label(
      "Choose a supported calculation and configure only the inputs it needs.",
      "Choisissez un calcul pris en charge et configurez ses entrées.",
      "اختر عملية حسابية مدعومة واضبط مدخلاتها.",
    ),
    accept: "",
    style: "tool",
  },
  planners: {
    collection: "items",
    title: label("Planner workshop", "Atelier planning", "ورشة التخطيط"),
    add: label("Add a planner field", "Ajouter un champ", "إضافة حقل"),
    hint: label(
      "Upload a printable planner or assemble an editable one.",
      "Déposez un planning imprimable ou composez une version modifiable.",
      "أضف مخططاً للطباعة أو أنشئ نسخة قابلة للتعديل.",
    ),
    accept: "application/pdf,image/jpeg,image/png,image/webp,image/avif",
    style: "planner",
  },
  forms: {
    collection: "fields",
    title: label("Private questionnaire", "Questionnaire privé", "استبيان خاص"),
    add: label("Add a question", "Ajouter une question", "إضافة سؤال"),
    hint: label(
      "Arrange questions and optional steps. Responses stay private in the visitor’s browser.",
      "Ordonnez les questions et les étapes facultatives. Les réponses restent privées dans le navigateur du visiteur.",
      "رتب الأسئلة والخطوات. تبقى الإجابات خاصة في متصفح الزائر.",
    ),
    accept: "",
    style: "form",
  },
  community: {
    collection: "rules",
    title: label("Curated archive", "Archives éditoriales", "أرشيف تحريري"),
    add: label("Add an entry", "Ajouter une entrée", "إضافة مدخل"),
    hint: label(
      "Publish a curated, searchable archive. Visitor posting is disabled.",
      "Publiez des archives sélectionnées et consultables. Les contributions des visiteurs sont désactivées.",
      "انشر أرشيفاً منتقى قابلاً للبحث. نشر الزوار معطل.",
    ),
    accept: "",
    style: "archive",
  },
  commerce: {
    collection: "offers",
    title: label("Connected offers", "Offres associées", "العروض المرتبطة"),
    add: label("Choose an offer", "Choisir une offre", "اختيار عرض"),
    hint: label(
      "Connect an existing native offer and add useful editorial context.",
      "Associez une offre native existante et son contexte éditorial.",
      "اربط عرضاً أصلياً موجوداً وأضف سياقه التحريري.",
    ),
    accept: "",
    style: "offers",
  },
  bundles: {
    collection: "steps",
    title: label("Pathway composer", "Compositeur de parcours", "تأليف المسار"),
    add: label("Choose a resource", "Choisir une ressource", "اختيار مورد"),
    hint: label(
      "Choose existing experiences and put them in the right order.",
      "Choisissez les expériences existantes et ordonnez votre parcours.",
      "اختر تجارب موجودة ورتب مسارك.",
    ),
    accept: "",
    style: "path",
  },
};

export function creationId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const h = [...bytes].map((v) => v.toString(16).padStart(2, "0")).join("");
  return [
    h.slice(0, 8),
    h.slice(8, 12),
    h.slice(12, 16),
    h.slice(16, 20),
    h.slice(20),
  ].join("-");
}
export function fileTitle(name: string) {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}
export function mimeFor(name: string, supplied = "") {
  const known: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    avif: "image/avif",
    svg: "image/svg+xml",
    mp4: "video/mp4",
    webm: "video/webm",
    mp3: "audio/mpeg",
  };
  return supplied && supplied !== "application/octet-stream"
    ? supplied
    : known[name.split(".").pop()?.toLowerCase() || ""] || "";
}
export function sourceKind(mime: string) {
  return mime === "application/pdf"
    ? "pdf"
    : mime.startsWith("image/")
      ? "image"
      : mime.startsWith("video/")
        ? "video"
        : mime.startsWith("audio/")
          ? "audio"
          : "article";
}
export function newCreation(
  family: string,
  locale: Locale,
  world: Data = {},
  prepared?: Partial<DceRecord>,
): Partial<DceRecord> {
  const f = familyByKey(family);
  if (!f) throw Error("Unknown content category.");
  const base = blankRecord("experience", family, locale, world);
  const data = definitionDefaults(f, object(base.data));
  // Technical defaults only. Educational goals, ages and answers are never inferred here.
  data.publicEnabled = true;
  data.requiredLocales = [locale];
  data.defaultLocale = locale;
  if (family === "community") data.contributionPolicy = "disabled";
  if (family === "activities") {
    data.engine = "choice";
    data.mode = f.modes[1];
  }
  if (family === "tools") data.operation = "sum";
  if (family === "forms") data.mode = f.modes[0];
  const next = {
    ...base,
    key: "resource-" + creationId(),
    audience: "parent",
    ...structuredClone(prepared || {}),
    data: { ...data, ...object(structuredClone(prepared?.data)) },
  };
  return next;
}
export function primaryCollection(
  record: Partial<DceRecord>,
): Collection | undefined {
  const f = familyByKey(record.family || ""),
    d = object(record.data);
  const key =
    record.family === "activities" && d.engine === "bridge"
      ? "bridgeChallenges"
      : record.family === "planners" &&
          array(d.units).length &&
          modeContract(f, d)?.engine === "print"
        ? "units"
        : CREATION_PLANS[record.family || ""]?.collection;
  return f?.collections.find((c) => c.key === key);
}
export function localizedWrite(
  data: Data,
  key: string,
  value: Data[string],
  locale: Locale,
  localized = true,
): Data {
  const next = { ...data, [key]: value };
  if (localized && (typeof value === "string" || typeof value === "number" || value === null))
    next.locales = {
      ...object(data.locales),
      [locale]: { ...object(object(data.locales)[locale]), [key]: value },
    };
  return next;
}
/** Selecting an existing edition must never overwrite its authored title. */
export function changeCreationLanguage(record: Partial<DceRecord>, locale: Locale): Partial<DceRecord> {
  const data = object(record.data), editions = object(data.locales), edition = object(editions[locale]);
  const title = text(edition.title) || text(record.title);
  const required = Array.isArray(data.requiredLocales) ? data.requiredLocales.filter((l): l is Locale => ["en", "fr", "ar"].includes(String(l))) : [];
  return { ...record, title, data: { ...data, defaultLocale: locale, requiredLocales: record.id ? Array.from(new Set([...required, locale])) : [locale], locales: { ...editions, [locale]: { ...edition, title } } } };
}
export function writeTitle(
  record: Partial<DceRecord>,
  value: string,
  locale: Locale,
): Partial<DceRecord> {
  return {
    ...record,
    title: value,
    data: localizedWrite(object(record.data), "title", value, locale),
  };
}
export function newCreationUnit(collection: Collection, locale: Locale): Data {
  const row = createUnit(collection, "unit-" + creationId());
  if (collection.key === "questions")
    Object.assign(row, {
      type: "choice",
      points: 1,
      choices: "",
      choiceKeys: "",
      correctKeys: "",
      answer: "",
    });
  if (collection.key === "fields") {
    row.type = "text";
    row.required = false;
  }
  if (collection.key === "items") row.type = "checkbox";
  row.locales = { [locale]: {} };
  return row;
}
export function appendSource(
  record: Partial<DceRecord>,
  source: {
    id?: string;
    name: string;
    mime: string;
    duration?: number;
    pageCount?: number;
  },
  locale: Locale,
): { record: Partial<DceRecord>; collection: string; unit: Data } {
  const f = familyByKey(record.family || "");
  if (!f) throw Error("Unknown category.");
  const kind = sourceKind(source.mime),
    d = { ...object(record.data) };
  let collection = CREATION_PLANS[f.key].collection;
  if (f.key === "planners") collection = "units";
  const schema = f.collections.find((c) => c.key === collection);
  if (!schema)
    throw Error("No source collection is available for this category.");
  const unit = newCreationUnit(schema, locale),
    title = fileTitle(source.name);
  Object.assign(unit, localizedWrite(unit, "title", title, locale));
  if (collection === "units")
    Object.assign(unit, {
      kind,
      required: false,
      completion: "manual",
      condition: "always",
    });
  if (source.id) unit.assetId = source.id;
  if (source.duration && source.duration > 0) unit.duration = source.duration;
  if (source.pageCount) unit.pageCount = source.pageCount;
  d[collection] = [...array(d[collection]), unit];
  if (f.key === "documents") d.mode = kind === "pdf" ? f.modes[1] : f.modes[0];
  if (f.key === "planners") d.mode = f.modes[0];
  if (f.key === "learning") {
    const kinds = new Set(array(d.units).map((u) => text(u.kind)));
    d.mode = kinds.size > 1 ? f.modes[1] : f.modes[0];
  }
  let next: Partial<DceRecord> = { ...record, data: d };
  if (!text(record.title)) next = writeTitle(next, title, locale);
  return { record: next, collection, unit };
}
/** Apply only a completed native upload to its retained placement and language. */
export function applyCreationMedia(record: Partial<DceRecord>, target: { collection: string; unit: string; field: string; locale?: Locale }, assetId: string, metadata: { duration?: number; pageCount?: number } = {}): Partial<DceRecord> {
  const d = object(record.data), locale = target.locale || (d.defaultLocale as Locale) || "fr";
  if (target.collection === "@root") return { ...record, data: localizedWrite(d, target.field, assetId, locale, true) };
  return { ...record, data: { ...d, [target.collection]: array(d[target.collection]).map(row => {
    if (row.id !== target.unit) return row;
    const previous = text(object(object(row.locales)[locale])[target.field] ?? row[target.field]);
    const next = localizedWrite(row, target.field, assetId, locale, true);
    if (target.field === "assetId") {
      const local = { ...object(object(next.locales)[locale]) };
      if (previous !== assetId) {
        delete next.pageCount; delete next.duration;
        delete local.pageCount; delete local.duration;
      }
      if (metadata.duration) { next.duration = metadata.duration; local.duration = metadata.duration; }
      if (metadata.pageCount) { next.pageCount = metadata.pageCount; local.pageCount = metadata.pageCount; }
      next.locales = { ...object(next.locales), [locale]: local };
    }
    return next;
  }) } };
}
export function updateUnit(
  record: Partial<DceRecord>,
  collection: string,
  id: string,
  patch: Data,
): Partial<DceRecord> {
  return {
    ...record,
    data: {
      ...object(record.data),
      [collection]: array(record.data?.[collection]).map((u) =>
        u.id === id ? { ...u, ...patch } : u,
      ),
    },
  };
}
export function moveUnit(
  record: Partial<DceRecord>,
  collection: string,
  from: number,
  to: number,
): Partial<DceRecord> {
  const rows = [...array(record.data?.[collection])];
  if (from < 0 || to < 0 || from >= rows.length || to >= rows.length)
    return record;
  const [item] = rows.splice(from, 1);
  rows.splice(to, 0, item);
  return { ...record, data: { ...object(record.data), [collection]: rows } };
}
export function setQuestionChoices(row: Data, choices: string[]): Data {
  const oldKeys = text(row.choiceKeys).split(/\r?\n/).filter(Boolean);
  const keys = choices.map((_, i) => oldKeys[i] || "option-" + creationId());
  const valid = new Set(keys);
  return {
    ...row,
    choices: choices.join("\n"),
    choiceKeys: keys.join("\n"),
    correctKeys: text(row.correctKeys)
      .split(",")
      .filter((k) => valid.has(k))
      .join(","),
  };
}
const RETIRED_FORM_PATHS = new Set([
  "destination",
  "responsibleTeam",
  "responsibleStaffId",
  "privateReceiverId",
  "consentLabel",
  "attachmentTypes",
  "attachmentMaxMb",
  "statusWorkflow",
]);
export function creationIssues(record: Partial<DceRecord>): Issue[] {
  let issues = validateRecord(record as DceRecord).errors;
  if (record.family === "forms")
    issues = issues.filter(
      (e) =>
        !e.path.split(".").some((p) => RETIRED_FORM_PATHS.has(p)) &&
        !["PRIVATE_RECEIVER", "UPLOAD", "BOOKING_RECEIVER"].includes(e.code),
    );
  const f = familyByKey(record.family || ""),
    unique = new Map<string, Issue>();
  for (const issue of issues) {
    let path = issue.path
      .replace(/^locales\.(fr|en|ar)\./, "")
      .replace(/\.locales\.(fr|en|ar)\./g, ".");
    const location = path.split(".");
    if (
      f?.collections.some((c) => c.key === location[0]) &&
      /^\d+$/.test(location[1] || "")
    ) {
      location[1] =
        text(array(record.data?.[location[0]])[Number(location[1])]?.id) ||
        location[1];
      path = location.join(".");
    }
    let message = issue.message;
    if (path === "title")
      message = label(
        "Add the resource title.",
        "Ajoutez le titre de la ressource.",
        "أضف عنوان المورد.",
      );
    else if (issue.code === "COLLECTION")
      message = label(
        "Add content to this resource.",
        "Ajoutez le contenu de cette ressource.",
        "أضف محتوى هذا المورد.",
      );
    else if (["REQUIRED", "TRANSLATION_REQUIRED"].includes(issue.code)) {
      const parts = path.split("."),
        definition =
          parts.length > 1
            ? f?.collections
                .find((c) => c.key === parts[0])
                ?.fields.find((v) => v.key === parts.at(-1))
            : f?.fields.find((v) => v.key === path);
      if (definition)
        message = label(
          "Complete: " + definition.label[0],
          "Complétez : " + definition.label[1],
          "أكمل: " + definition.label[2],
        );
    }
    if (!unique.has(path)) unique.set(path, { ...issue, path, message });
  }
  return [...unique.values()];
}
export function visibleCreationField(
  field: Field,
  record: Partial<DceRecord>,
): boolean {
  if (field.key === "id") return false;
  if (record.family === "forms" && RETIRED_FORM_PATHS.has(field.key))
    return false;
  const engine =
    modeContract(familyByKey(record.family || ""), object(record.data))
      ?.engine || "";
  return !field.modes?.length || field.modes.includes(engine);
}
export function primaryFields(
  collection: Collection,
  record: Partial<DceRecord>,
): Field[] {
  const preferred: Record<string, string[]> = {
    units: [
      "title",
      "kind",
      "assetId",
      "text",
      "duration",
      "module",
      "assessmentId",
    ],
    cards: ["title", "front", "assetId", "back", "backAssetId"],
    frames: ["title", "text", "assetId"],
    questions: [
      "prompt",
      "type",
      "choices",
      "correctKeys",
      "answer",
      "acceptedAnswers",
      "points",
      "explanation",
    ],
    tasks: ["prompt", "assetId", "choices", "answer", "feedback"],
    bridgeChallenges: ["title", "span", "strength", "targetLoad", "edgeBudget"],
    inputs: ["label", "type", "default", "min", "max", "options", "value"],
    items: ["label", "type", "options", "default"],
    fields: ["label", "type", "required", "options", "help", "step"],
    rules: ["title", "text"],
    offers: ["nativeId", "label"],
    steps: ["title", "experienceId"],
  };
  return collection.fields
    .filter(
      (f) =>
        (f.required || preferred[collection.key]?.includes(f.key)) &&
        visibleCreationField(f, record),
    )
    .map((f) =>
      f.key === "assetId"
        ? {
            ...f,
            label: label("Source file", "Fichier source", "الملف الأصلي"),
          }
        : f,
    );
}
export function fieldIsLocalized(field: Field) {
  return (
    field.localized === true ||
    (LOCALIZED_FIELDS.has(field.key) && field.localized !== false)
  );
}
export function completeCreation(
  record: Partial<DceRecord>,
): Partial<DceRecord> {
  // Preserve every expert field and every other language. Only synchronize the active title.
  const d = object(record.data),
    l = (d.defaultLocale || "fr") as Locale;
  return { ...record, data: localizedWrite(d, "title", text(record.title), l) };
}
export function categoryByMime(mime: string) {
  return mime === "application/pdf"
    ? "documents"
    : mime.startsWith("video/")
      ? "video"
      : mime.startsWith("audio/")
        ? "audio"
        : mime.startsWith("image/")
          ? "visual-cards"
          : "documents";
}
export function creationFamilies() {
  return FAMILIES.filter((f) => !!CREATION_PLANS[f.key]);
}

export function creationModeLabel(
  family: string,
  mode: string,
  locale: Locale,
): string {
  const index = familyByKey(family)?.modes.indexOf(mode) ?? -1;
  const names: Record<string, [string[], string[]]> = {
    documents: [
      [
        "Lecture d’article",
        "Lecture PDF",
        "Guide à chapitres",
        "Article enrichi",
      ],
      ["قراءة مقال", "قراءة PDF", "دليل بفصول", "مقال غني"],
    ],
    printables: [
      [
        "Aperçu imprimable",
        "Pages en carrousel",
        "Feuilletage",
        "Accès au téléchargement",
      ],
      ["معاينة للطباعة", "عرض الصفحات", "تصفح الصفحات", "الوصول للتنزيل"],
    ],
    stories: [
      [
        "Livre à feuilleter",
        "Histoire racontée",
        "Lecture immersive",
        "Histoire en diaporama",
      ],
      ["كتاب للتصفح", "قصة مسموعة", "قراءة غامرة", "قصة بالشرائح"],
    ],
    learning: [
      [
        "Parcours de leçons",
        "Parcours multimédia",
        "Formation vidéo à chapitres",
        "Parcours avec évaluation",
      ],
      [
        "مسار الدروس",
        "مسار متعدد الوسائط",
        "دورة فيديو بفصول",
        "مسار مع تقييم",
      ],
    ],
    video: [
      [
        "Lecture vidéo",
        "Vidéo avec chapitres",
        "Vidéo liée à une formation",
        "Vidéo verticale",
      ],
      ["مشغل فيديو", "فيديو بفصول", "فيديو مرتبط بدورة", "فيديو عمودي"],
    ],
    audio: [
      ["Écoute simple", "Liste d’écoute", "Podcast à chapitres", "Récit audio"],
      ["استماع فردي", "قائمة استماع", "بودكاست بفصول", "سرد صوتي"],
    ],
    "visual-cards": [
      [
        "Galerie de cartes",
        "Cartes à faire défiler",
        "Visionneuse agrandie",
        "Étude et révision",
      ],
      ["معرض بطاقات", "تمرير البطاقات", "عرض مكبر", "دراسة ومراجعة"],
    ],
    presentations: [
      [
        "Présentation de diapositives",
        "Lecture image par image",
        "Mode présentateur",
        "Défilement automatique",
      ],
      ["عرض الشرائح", "عرض إطار بإطار", "وضع المقدم", "عرض تلقائي"],
    ],
    assessments: [
      [
        "Quiz interactif",
        "Évaluation chronométrée",
        "Entraînement",
        "Résultats et bilan",
      ],
      ["اختبار تفاعلي", "تقييم مؤقت", "تدريب", "نتائج وتقرير"],
    ],
    activities: [
      [
        "Espace de jeu",
        "Activité par étapes",
        "Simulation guidée",
        "Défi chronométré",
      ],
      ["مساحة اللعب", "نشاط بخطوات", "محاكاة موجهة", "تحد مؤقت"],
    ],
    tools: [
      [
        "Outil interactif",
        "Calculateur",
        "Comparaison de scénarios",
        "Entrées et résultat",
      ],
      ["أداة تفاعلية", "حاسبة", "مقارنة سيناريوهات", "مدخلات ونتيجة"],
    ],
    planners: [
      [
        "Planning imprimable",
        "Planning modifiable",
        "Galerie de modèles",
        "Liste à cocher",
      ],
      ["مخطط للطباعة", "مخطط قابل للتعديل", "معرض قوالب", "قائمة تحقق"],
    ],
    forms: [
      [
        "Questionnaire privé",
        "Questionnaire à étapes",
        "Ancien mode de dépôt",
        "Ancien mode de réservation",
      ],
      ["استبيان خاص", "استبيان بخطوات", "وضع إيداع سابق", "وضع حجز سابق"],
    ],
    community: [
      [
        "Archives consultables",
        "Mur d’archives",
        "Questions et réponses archivées",
        "Centre d’archives",
      ],
      ["أرشيف للقراءة", "لوحة أرشيف", "أسئلة وأجوبة مؤرشفة", "مركز الأرشيف"],
    ],
    commerce: [
      [
        "Article avec offres",
        "Ressource avec offre",
        "Formation et produit",
        "Remise de fichiers",
      ],
      ["مقال مع عروض", "مورد مع عرض", "دورة ومنتج", "تسليم ملفات"],
    ],
    bundles: [
      [
        "Parcours guidé",
        "Vue d’ensemble du parcours",
        "Parcours séquentiel",
        "Kit de démarrage",
      ],
      ["مسار موجه", "نظرة عامة للمسار", "مسار متسلسل", "حزمة بداية"],
    ],
  };
  return locale === "en"
    ? mode
    : names[family]?.[locale === "fr" ? 0 : 1]?.[index] || mode;
}
