import {USES as DOCUMENT_USES,GRADES as DOCUMENT_GRADES,THEMES as DOCUMENT_THEMES,NEEDS as DOCUMENT_NEEDS,SUBJECTS as DOCUMENT_SUBJECTS,USE_KEYS}from "../kidflix/documents/model";
import { enrichDetailExperience } from "./detail-experience";
import { actionCapabilities } from "./action-contract";
import { SUBTYPES } from "./reference-model";
import {
  array,
  object,
  text,
  type Collection,
  type Data,
  type Family,
  type Field,
  type Json,
  type Locale,
  type Tri,
} from "./types";

/** Version of the authored definition, independent from the installed SQL ownership tag. */
export const DEFINITION_VERSION = 2;
export const LOCALIZED_FIELDS = new Set([
  "title",
  "text",
  "label",
  "prompt",
  "front",
  "back",
  "choices",
  "answer",
  "explanation",
  "notes",
  "transcript",
  "description",
  "options",
  "body",
  "source",
  "accessibleText",
  "consentLabel",
  "methodology",
  "outputUnit",
  "help",
  "hint",
  "goal",
  "feedback",
  "alt",
  "assumptions",
  "successText",
  "contributionPolicy",
  "reportReasons",
]);
const label = (en: string, fr: string, ar: string): Tri => [en, fr, ar];
const field = (
  key: string,
  en: string,
  fr: string,
  ar: string,
  type: Field["type"] = "text",
  extra: Partial<Field> = {},
): Field => ({
  key,
  label: label(en, fr, ar),
  type,
  localized: LOCALIZED_FIELDS.has(key),
  classification: [
    "answer",
    "explanation",
    "notes",
    "responsibleStaffId",
    "responsibleTeam",
    "privateReceiverId",
  ].includes(key)
    ? "private"
    : "public",
  ...extra,
});
const select = (
  key: string,
  en: string,
  fr: string,
  ar: string,
  options: string[],
  extra: Partial<Field> = {},
) => field(key, en, fr, ar, "select", { options, ...extra });
const num = (
  key: string,
  en: string,
  fr: string,
  ar: string,
  min = 0,
  max = 86400,
  defaultValue = 0,
) => field(key, en, fr, ar, "number", { min, max, defaultValue });
const toggle = (
  key: string,
  en: string,
  fr: string,
  ar: string,
  defaultValue = false,
) => field(key, en, fr, ar, "toggle", { defaultValue });
const ref = (
  key: string,
  en: string,
  fr: string,
  ar: string,
  reference: Field["reference"],
  mime?: string[],
) => field(key, en, fr, ar, "reference", { reference, mime });
const stable = field(
  "id",
  "Stable identity",
  "Identité stable",
  "هوية ثابتة",
  "text",
  { required: true, localized: false },
);
const title = field("title", "Title", "Titre", "العنوان", "text", {
  required: true,
});
const collection = (
  key: string,
  en: string,
  fr: string,
  ar: string,
  fields: Field[],
  min = 0,
): Collection => ({
  key,
  label: label(en, fr, ar),
  fields: [stable, ...fields],
  min,
});
const additions: Record<
  string,
  { fields?: Field[]; collections?: Collection[]; unitFields?: Field[] }
> = {
  documents: {
    fields: [
      {...field("documentUses","Document uses","Usages du document","استخدامات الوثيقة","textarea"),options:USE_KEYS,optionLabels:Object.fromEntries([...DOCUMENT_USES,{key:'routines',title:['Routines','Routines','الروتين'] as const}].map(x=>[x.key,x.title])),hint:["Select all verified uses. No classification is inferred from the title.","Sélectionnez les usages vérifiés. Aucun classement déduit du titre.","حدد الاستخدامات المؤكدة. لا يستنتج التصنيف من العنوان."]},
      {...field("documentGrades","Published grade levels","Niveaux scolaires publiés","المستويات الدراسية المنشورة","textarea"),options:DOCUMENT_GRADES.map(x=>x.key),optionLabels:Object.fromEntries(DOCUMENT_GRADES.map(x=>[x.key,x.title]))},
      {...field("documentThemes","Document themes and seasons","Thèmes et saisons","مواضيع الوثيقة ومواسمها","textarea"),options:DOCUMENT_THEMES.map(x=>x.key),optionLabels:Object.fromEntries(DOCUMENT_THEMES.map(x=>[x.key,x.title]))},
      {...field("documentNeeds","Document purposes","Besoins couverts","احتياجات الوثيقة","textarea"),options:DOCUMENT_NEEDS.map(x=>x.key),optionLabels:Object.fromEntries(DOCUMENT_NEEDS.map(x=>[x.key,x.title]))},
      select("documentSubject","Document subject","Matière documentaire","مادة الوثيقة",DOCUMENT_SUBJECTS.map(x=>x.key),{optionLabels:Object.fromEntries(DOCUMENT_SUBJECTS.map(x=>[x.key,x.title]))}),
      select(
        "readingWidth",
        "Reading width",
        "Largeur de lecture",
        "عرض القراءة",
        ["comfortable", "wide"],
        { defaultValue: "comfortable" },
      ),
    ],
    collections: [
      collection(
        "blocks",
        "Reusable editorial blocks",
        "Blocs éditoriaux réutilisables",
        "كتل تحريرية قابلة لإعادة الاستخدام",
        [
          title,
          select("type", "Block type", "Type de bloc", "نوع الكتلة", [
            "paragraph",
            "heading",
            "callout",
            "list",
            "image",
            "content",
          ]),
          field(
            "text",
            "Accessible text",
            "Texte accessible",
            "نص متاح",
            "textarea",
          ),
          ref("assetId", "Image", "Image", "صورة", "media", ["image/"]),
          ref(
            "contentId",
            "Published content",
            "Contenu publié",
            "محتوى منشور",
            "content",
          ),
          field("href", "Safe source link", "Lien source sûr", "رابط مصدر آمن"),
        ],
      ),
    ],
  },
  printables: {
    fields: [
      select(
        "orientation",
        "Orientation",
        "Orientation",
        "الاتجاه",
        ["portrait", "landscape"],
        { defaultValue: "portrait" },
      ),
      select(
        "colourMode",
        "Output colour",
        "Couleur de sortie",
        "ألوان الإخراج",
        ["colour", "grayscale"],
        { defaultValue: "colour" },
      ),
      num(
        "minimumDpi",
        "Minimum image DPI",
        "DPI minimal des images",
        "دقة الصورة الدنيا",
        72,
        1200,
        300,
      ),
      field(
        "edition",
        "Edition / variant",
        "Édition / variante",
        "الإصدار / النسخة",
      ),
      toggle(
        "printAllowed",
        "Allow printing",
        "Autoriser l’impression",
        "السماح بالطباعة",
      ),
    ],
    unitFields: [
      num(
        "widthMm",
        "Output width · mm",
        "Largeur · mm",
        "العرض · مم",
        1,
        2000,
        210,
      ),
      num(
        "heightMm",
        "Output height · mm",
        "Hauteur · mm",
        "الارتفاع · مم",
        1,
        2000,
        297,
      ),
      field(
        "variant",
        "Audience / age variant",
        "Variante public / âge",
        "نسخة الجمهور / العمر",
      ),
    ],
  },
  stories: {
    fields: [
      field("edition", "Edition", "Édition", "الإصدار"),
      select(
        "pageLayout",
        "Text and image relationship",
        "Relation texte et image",
        "علاقة النص بالصورة",
        ["image_above", "side_by_side", "text_only"],
        { defaultValue: "image_above" },
      ),
      num(
        "pageSeconds",
        "Default page duration · seconds",
        "Durée de page · secondes",
        "مدة الصفحة · ثوان",
        1,
        600,
        8,
      ),
    ],
    unitFields: [
      ref(
        "narrationAssetId",
        "Page narration",
        "Narration de page",
        "سرد الصفحة",
        "media",
        ["audio/"],
      ),
      num(
        "startSeconds",
        "Narration starts · seconds",
        "Début de narration · secondes",
        "بداية السرد · ثوان",
        0,
      ),
      num(
        "endSeconds",
        "Narration ends · seconds",
        "Fin de narration · secondes",
        "نهاية السرد · ثوان",
        0,
      ),
      field("alt", "Image alternative", "Alternative de l’image", "وصف الصورة"),
    ],
    collections: [
      collection(
        "cues",
        "Read-aloud text cues",
        "Repères de lecture à voix haute",
        "إشارات القراءة بصوت عال",
        [
          field(
            "unitId",
            "Page identity",
            "Identité de page",
            "هوية الصفحة",
            "text",
            { required: true },
          ),
          field(
            "text",
            "Spoken text",
            "Texte prononcé",
            "النص المنطوق",
            "textarea",
            { required: true },
          ),
          num(
            "startSeconds",
            "Start · seconds",
            "Début · secondes",
            "البداية · ثوان",
          ),
          num(
            "endSeconds",
            "End · seconds",
            "Fin · secondes",
            "النهاية · ثوان",
          ),
        ],
      ),
    ],
  },
  learning: {
    fields: [
      ref(
        "nativeId",
        "Native Academy course",
        "Formation Academy native",
        "دورة الأكاديمية الأصلية",
        "offers",
      ),
      select(
        "completion",
        "Course completion",
        "Complétion du cours",
        "إكمال الدورة",
        ["required_steps", "all_steps", "assessment_pass"],
        { defaultValue: "required_steps" },
      ),
      toggle(
        "allowRestart",
        "Allow a fresh attempt",
        "Autoriser une nouvelle tentative",
        "السماح بمحاولة جديدة",
        true,
      ),
    ],
    unitFields: [
      field(
        "module",
        "Curriculum section",
        "Section du programme",
        "قسم المنهج",
      ),
      ref(
        "assessmentId",
        "Assessment experience",
        "Expérience d’évaluation",
        "تجربة التقييم",
        "experience",
      ),
      select(
        "lessonCompletion",
        "Lesson completion policy",
        "Politique de complétion de la leçon",
        "سياسة إكمال الدرس",
        ["explicit", "ended", "threshold"],
        { defaultValue: "explicit" },
      ),
      num(
        "completionPercent",
        "Required viewed proportion · %",
        "Proportion visionnée requise · %",
        "نسبة المشاهدة المطلوبة · ٪",
        1,
        100,
        90,
      ),
      field(
        "resourceIds",
        "Resource unit identities · comma separated",
        "Identités ressources · séparées par virgule",
        "هويات الموارد · مفصولة بفاصلة",
      ),
    ],
  },
  video: {
    fields: [
      ref(
        "posterAssetId",
        "Video poster",
        "Affiche vidéo",
        "ملصق الفيديو",
        "media",
        ["image/"],
      ),
      ref(
        "experienceId",
        "Linked course experience",
        "Expérience de cours liée",
        "تجربة دورة مرتبطة",
        "experience",
      ),
      select(
        "completionPolicy",
        "Viewing completion",
        "Complétion du visionnage",
        "إكمال المشاهدة",
        ["ended", "threshold", "explicit"],
        { defaultValue: "ended" },
      ),
      num(
        "completionPercent",
        "Viewing threshold · %",
        "Seuil de visionnage · %",
        "عتبة المشاهدة · ٪",
        1,
        100,
        90,
      ),
    ],
    collections: [
      collection(
        "chapters",
        "Video chapters",
        "Chapitres vidéo",
        "فصول الفيديو",
        [
          title,
          field(
            "unitId",
            "Video unit identity",
            "Identité vidéo",
            "هوية الفيديو",
            "text",
            { required: true },
          ),
          num(
            "startSeconds",
            "Timestamp · seconds",
            "Position · secondes",
            "الموضع · ثوان",
          ),
        ],
      ),
      collection(
        "captions",
        "Caption languages",
        "Langues de sous-titres",
        "لغات الترجمة",
        [
          select("locale", "Language", "Langue", "اللغة", ["fr", "en", "ar"]),
          ref(
            "captionAssetId",
            "WebVTT source",
            "Source WebVTT",
            "مصدر WebVTT",
            "media",
            ["text/vtt"],
          ),
          field(
            "unitId",
            "Video unit identity",
            "Identité vidéo",
            "هوية الفيديو",
          ),
          field(
            "text",
            "Caption text",
            "Texte de sous-titre",
            "نص الترجمة",
            "textarea",
          ),
          num(
            "startSeconds",
            "Cue start · seconds",
            "Début du repère · secondes",
            "بداية الإشارة · ثوان",
          ),
          num(
            "endSeconds",
            "Cue end · seconds",
            "Fin du repère · secondes",
            "نهاية الإشارة · ثوان",
          ),
        ],
      ),
    ],
  },
  audio: {
    fields: [
      select(
        "completionPolicy",
        "Listening completion",
        "Complétion de l’écoute",
        "إكمال الاستماع",
        ["ended", "explicit"],
        { defaultValue: "ended" },
      ),
      num(
        "seekSeconds",
        "Seek interval · seconds",
        "Intervalle de saut · secondes",
        "فترة التخطي · ثوان",
        1,
        120,
        15,
      ),
    ],
    unitFields: [
      field(
        "transcript",
        "Episode transcript",
        "Transcription de l’épisode",
        "نص الحلقة",
        "textarea",
      ),
      num(
        "startSeconds",
        "Start position · seconds",
        "Position initiale · secondes",
        "الموضع الأولي · ثوان",
      ),
      num(
        "endSeconds",
        "End position · seconds",
        "Position finale · secondes",
        "الموضع النهائي · ثوان",
      ),
    ],
    collections: [
      collection(
        "chapters",
        "Audio chapters",
        "Chapitres audio",
        "فصول الصوت",
        [
          title,
          field(
            "unitId",
            "Episode identity",
            "Identité épisode",
            "هوية الحلقة",
            "text",
            { required: true },
          ),
          num(
            "startSeconds",
            "Timestamp · seconds",
            "Position · secondes",
            "الموضع · ثوان",
          ),
        ],
      ),
    ],
  },
  "visual-cards": {
    fields: [
      select(
        "imageFit",
        "Image fit",
        "Ajustement des images",
        "ملاءمة الصور",
        ["contain", "cover"],
        { defaultValue: "contain" },
      ),
      num(
        "columns",
        "Gallery columns",
        "Colonnes de galerie",
        "أعمدة المعرض",
        1,
        6,
        3,
      ),
      toggle(
        "allowZoom",
        "Allow image zoom",
        "Autoriser le zoom",
        "السماح بالتكبير",
        true,
      ),
      toggle(
        "shuffle",
        "Shuffle study cards",
        "Mélanger les cartes d’étude",
        "خلط بطاقات الدراسة",
      ),
    ],
    unitFields: [],
  },
  presentations: {
    fields: [
      toggle(
        "loop",
        "Repeat autoplay",
        "Répéter la lecture automatique",
        "تكرار العرض التلقائي",
      ),
      toggle(
        "navigationAllowed",
        "Allow manual navigation",
        "Navigation manuelle permise",
        "السماح بالتنقل اليدوي",
        true,
      ),
      num(
        "defaultSeconds",
        "Default frame duration",
        "Durée par défaut",
        "مدة الإطار الافتراضية",
        1,
        600,
        6,
      ),
    ],
  },
  assessments: {
    fields: [
      select(
        "feedbackPolicy",
        "Feedback visibility",
        "Visibilité des retours",
        "إظهار الملاحظات",
        ["after_submit", "immediate", "score_only"],
        { defaultValue: "after_submit" },
      ),
      select(
        "retryPolicy",
        "Retry policy",
        "Politique de nouvelle tentative",
        "سياسة إعادة المحاولة",
        ["allowed", "until_pass", "disabled"],
        { defaultValue: "allowed" },
      ),
      toggle(
        "shuffle",
        "Shuffle question order",
        "Mélanger les questions",
        "خلط الأسئلة",
      ),
      field(
        "successText",
        "Passing result interpretation",
        "Interprétation de réussite",
        "تفسير نتيجة النجاح",
        "textarea",
      ),
    ],
  },
  activities: {
    fields: [
      field(
        "goal",
        "Activity goal",
        "Objectif de l’activité",
        "هدف النشاط",
        "textarea",
        { required: true },
      ),
      field(
        "accessibleText",
        "Keyboard / text alternative",
        "Alternative clavier / texte",
        "بديل لوحة المفاتيح / النص",
        "textarea",
        { required: true },
      ),
      num(
        "attemptLimit",
        "Maximum attempts · 0 unlimited",
        "Tentatives · 0 illimité",
        "المحاولات · 0 بلا حد",
        0,
        100,
        0,
      ),
      num(
        "challengeSeconds",
        "Challenge time · seconds",
        "Durée du défi · secondes",
        "مدة التحدي · ثوان",
        1,
        3600,
        120,
      ),
      toggle(
        "hintsEnabled",
        "Allow hints",
        "Autoriser les indices",
        "السماح بالتلميحات",
        true,
      ),
    ],
    unitFields: [
      ref(
        "assetId",
        "Task illustration",
        "Illustration de tâche",
        "صورة المهمة",
        "media",
        ["image/"],
      ),
      field("category", "Sorting category", "Catégorie de tri", "فئة الفرز"),
      field(
        "feedback",
        "Checkpoint feedback",
        "Retour d’étape",
        "ملاحظات المرحلة",
        "textarea",
      ),
    ],
  },
  tools: {
    fields: [
      select(
        "model",
        "Educational model",
        "Modèle éducatif",
        "النموذج التعليمي",
        [
          "custom_arithmetic",
          "classroom_groups",
          "reading_duration",
          "unit_conversion",
          "recipe_scaling",
          "shape_area",
          "eco_comparison",
        ],
        { defaultValue: "custom_arithmetic" },
      ),
      num(
        "modelVersion",
        "Model version",
        "Version du modèle",
        "نسخة النموذج",
        1,
        1,
        1,
      ),
      field(
        "assumptions",
        "Assumptions and limits",
        "Hypothèses et limites",
        "الافتراضات والحدود",
        "textarea",
        { required: true },
      ),
      num(
        "factor",
        "Conversion / scale factor",
        "Facteur de conversion / échelle",
        "عامل التحويل / المقياس",
        0.000001,
        1000000,
        1,
      ),
      num(
        "precision",
        "Decimal places",
        "Décimales",
        "المنازل العشرية",
        0,
        6,
        2,
      ),
      toggle(
        "exportAllowed",
        "Allow result export",
        "Autoriser l’export de résultat",
        "السماح بتصدير النتيجة",
        true,
      ),
    ],
    unitFields: [
      select(
        "type",
        "Input type",
        "Type de saisie",
        "نوع الإدخال",
        ["number", "integer", "range"],
        { defaultValue: "number" },
      ),
      num(
        "step",
        "Input step",
        "Pas de saisie",
        "خطوة الإدخال",
        0.000001,
        10000,
        1,
      ),
    ],
  },
  planners: {
    fields: [
      select(
        "savingPolicy",
        "Personal copy policy",
        "Politique de copie personnelle",
        "سياسة النسخة الشخصية",
        ["local_copy", "account_copy", "export_only"],
        { defaultValue: "local_copy" },
      ),
      toggle(
        "exportAllowed",
        "Allow copy export",
        "Autoriser l’export de copie",
        "السماح بتصدير النسخة",
        true,
      ),
      toggle(
        "printAllowed",
        "Allow printing",
        "Autoriser l’impression",
        "السماح بالطباعة",
      ),
    ],
    unitFields: [
      field(
        "value",
        "Initial / fixed value",
        "Valeur initiale / fixe",
        "القيمة الأولية / الثابتة",
        "textarea",
      ),
      field(
        "options",
        "Select options · one per line",
        "Options · une par ligne",
        "الخيارات · خيار في كل سطر",
        "textarea",
      ),
      field(
        "due",
        "Due date / instruction",
        "Échéance / instruction",
        "الموعد / التعليمات",
      ),
      num("min", "Minimum", "Minimum", "الحد الأدنى", -100000, 100000, 0),
      num("max", "Maximum", "Maximum", "الحد الأقصى", -100000, 100000, 100),
    ],
  },
  forms: {
    fields: [
      ref(
        "responsibleStaffId",
        "Responsible native staff",
        "Responsable natif",
        "الموظف الأصلي المسؤول",
        "staff",
      ),
      field(
        "responsibleTeam",
        "Receiving team",
        "Équipe de réception",
        "فريق الاستقبال",
        "text",
        { required: true },
      ),
      select(
        "draftPolicy",
        "Editable draft policy",
        "Politique de brouillon modifiable",
        "سياسة المسودة القابلة للتعديل",
        ["until_submit", "until_review", "disabled"],
        { defaultValue: "until_submit" },
      ),
      ref(
        "privateReceiverId",
        "Protected attachment receiver",
        "Réception des pièces protégées",
        "استقبال المرفقات المحمي",
        "record",
      ),
      field(
        "attachmentTypes",
        "Permitted attachment MIME types",
        "Types MIME permis",
        "أنواع MIME المسموحة",
      ),
      num(
        "attachmentMaxMb",
        "Attachment size limit · MB",
        "Taille des pièces · Mo",
        "حد حجم المرفقات · ميغابايت",
        1,
        20,
        10,
      ),
      field(
        "statusWorkflow",
        "Receiving states · comma separated",
        "États de réception · séparés par virgule",
        "حالات الاستقبال · مفصولة بفاصلة",
        "text",
        { defaultValue: "open,assigned,waiting_customer,resolved,closed" },
      ),
    ],
    unitFields: [
      num(
        "step",
        "Application step",
        "Étape de candidature",
        "مرحلة الطلب",
        1,
        30,
        1,
      ),
      select(
        "condition",
        "Show field when",
        "Afficher le champ si",
        "إظهار الحقل عندما",
        ["always", "answer_equals"],
        { defaultValue: "always" },
      ),
      field(
        "conditionTarget",
        "Condition field identity",
        "Identité du champ de condition",
        "هوية حقل الشرط",
      ),
      field(
        "conditionValue",
        "Required condition value",
        "Valeur de condition requise",
        "قيمة الشرط المطلوبة",
      ),
      num(
        "min",
        "Minimum value / length",
        "Valeur / longueur minimale",
        "القيمة / الطول الأدنى",
        0,
        100000,
        0,
      ),
      num(
        "max",
        "Maximum value / length",
        "Valeur / longueur maximale",
        "القيمة / الطول الأقصى",
        0,
        100000,
        4000,
      ),
      field(
        "defaultValue",
        "Initial value",
        "Valeur initiale",
        "القيمة الأولية",
      ),
    ],
  },
  community: {
    fields: [
      select(
        "eligibility",
        "Contribution eligibility",
        "Éligibilité de contribution",
        "أهلية المساهمة",
        ["native_account", "native_entitlement", "completed_experience"],
        { defaultValue: "native_account" },
      ),
      toggle(
        "ratingsEnabled",
        "Allow ratings",
        "Autoriser les notes",
        "السماح بالتقييمات",
        true,
      ),
      toggle(
        "reportsEnabled",
        "Allow reports",
        "Autoriser les signalements",
        "السماح بالبلاغات",
        true,
      ),
      select(
        "visibilityPolicy",
        "Approved contribution visibility",
        "Visibilité après approbation",
        "ظهور المساهمة بعد الاعتماد",
        ["public", "members", "private_team"],
        { defaultValue: "public" },
      ),
      field(
        "reportReasons",
        "Report reasons · one per line",
        "Motifs de signalement · un par ligne",
        "أسباب البلاغ · سبب في كل سطر",
        "textarea",
      ),
    ],
  },
  commerce: {
    fields: [
      ref(
        "contentId",
        "Published editorial resource",
        "Ressource éditoriale publiée",
        "مورد تحريري منشور",
        "content",
      ),
      ref(
        "experienceId",
        "Related course / resource",
        "Cours / ressource lié",
        "دورة / مورد مرتبط",
        "experience",
      ),
      select(
        "deliveryAuthority",
        "Recognized delivery authority",
        "Autorité de livraison reconnue",
        "جهة التسليم المعترف بها",
        ["native_order", "native_booking", "native_academy", "native_b2b"],
        { defaultValue: "native_order" },
      ),
    ],
    unitFields: [
      select(
        "action",
        "Native continuation",
        "Suite native",
        "المتابعة الأصلية",
        ["details", "purchase", "booking", "enrolment", "enquiry"],
        { defaultValue: "details" },
      ),
    ],
  },
  bundles: {
    fields: [
      select(
        "completion",
        "Aggregate completion",
        "Complétion agrégée",
        "الإكمال الإجمالي",
        ["required_steps", "all_steps"],
        { defaultValue: "required_steps" },
      ),
      select(
        "restartScope",
        "Restart scope",
        "Portée du redémarrage",
        "نطاق إعادة البدء",
        ["journey_only", "include_children"],
        { defaultValue: "journey_only" },
      ),
      toggle(
        "allowRestart",
        "Allow restart",
        "Autoriser le redémarrage",
        "السماح بإعادة البدء",
        true,
      ),
    ],
    unitFields: [
      field(
        "releaseId",
        "Pinned child release",
        "Release enfant fixée",
        "إصدار فرعي مثبت",
      ),
      select(
        "accessDependency",
        "Child access dependency",
        "Dépendance d’accès enfant",
        "اعتمادية الوصول الفرعي",
        ["inherit", "native_entitlement", "free"],
        { defaultValue: "inherit" },
      ),
    ],
  },
};
export interface ModeContract {
  key: string;
  family: string;
  engine: string;
  controls: string[];
  requiredCollections: string[];
  description: Tri;
  version: 2;
  allowedEngines?: string[];
}
const engines: Record<string, string[]> = {
  documents: ["article", "pdf", "chaptered", "rich"],
  printables: ["print", "carousel", "flipbook", "gate"],
  stories: ["flipbook", "read_aloud", "immersive", "slideshow"],
  learning: ["course", "mixed_path", "video_course", "assessment_path"],
  video: ["cinematic", "chapters", "course_link", "vertical"],
  audio: ["single_audio", "playlist", "podcast", "narrated"],
  "visual-cards": ["gallery", "swipe", "lightbox", "study"],
  presentations: ["slides", "frames", "presenter", "autoplay"],
  assessments: ["quiz", "timed", "practice", "results"],
  activities: ["canvas", "stepper", "simulation", "challenge"],
  tools: ["interactive", "calculator", "comparison", "form_result"],
  planners: ["print", "editable", "template_gallery", "checklist"],
  forms: ["form", "multistep", "upload", "booking_request"],
  community: ["review_feed", "proof_wall", "thread", "hub"],
  commerce: ["shoppable", "resource", "course_product", "delivery"],
  bundles: ["guided", "dashboard", "sequential", "starter"],
};
const modeControls: Record<string, string[]> = {
  pdf: ["searchEnabled"],
  chaptered: ["searchEnabled"],
  rich: ["blocks"],
  print: ["paper", "orientation", "colourMode", "minimumDpi", "printAllowed"],
  gate: ["accessPolicyId", "downloadAllowed"],
  read_aloud: ["cues", "narrationAssetId"],
  slideshow: ["pageSeconds", "cues"],
  immersive: ["readingWidth"],
  video_course: ["completion"],
  assessment_path: ["passingScore", "questions"],
  chapters: ["chapters", "captions"],
  course_link: ["experienceId"],
  vertical: ["posterAssetId"],
  podcast: ["chapters"],
  narrated: ["transcript"],
  gallery: ["columns", "imageFit"],
  lightbox: ["allowZoom"],
  study: ["shuffle"],
  presenter: ["frames"],
  autoplay: ["loop", "defaultSeconds"],
  timed: ["minutes", "attemptLimit", "retryPolicy"],
  practice: ["feedbackPolicy", "retryPolicy"],
  results: ["passingScore", "successText"],
  simulation: ["goal", "tasks"],
  challenge: ["challengeSeconds", "attemptLimit"],
  comparison: ["model", "assumptions"],
  multistep: ["fields", "draftPolicy"],
  upload: ["privateReceiverId", "attachmentTypes", "attachmentMaxMb"],
  booking_request: ["destination", "responsibleTeam"],
  thread: ["eligibility", "reportsEnabled"],
  proof_wall: ["visibilityPolicy"],
  delivery: ["deliveryAuthority"],
  guided: ["steps", "completion"],
  sequential: ["steps"],
  starter: ["steps"],
};
export function enrichFamily(base: Family): Family {
  const extra = additions[base.key] || {},
    fields = [...base.fields];
  const collections: Collection[] = base.collections.map((c) => ({
    ...c,
    fields: c.fields.map((f) => ({
      ...f,
      localized: LOCALIZED_FIELDS.has(f.key),
      classification: ["answer", "explanation", "notes"].includes(f.key)
        ? ("private" as const)
        : ("public" as const),
    })),
  }));
  const merge = (target: Field[], incoming: Field[]) => {
    for (const f of incoming) {
      const at = target.findIndex((x) => x.key === f.key);
      if (at < 0) target.push(f);
      else target[at] = { ...target[at], ...f };
    }
  };
  merge(fields, extra.fields || []);
  const subtypes = SUBTYPES[base.key]?.authored;
  if (subtypes)
    fields.unshift(
      select(
        "subtype",
        "Experience subtype",
        "Sous-type d’expérience",
        "النوع الفرعي للتجربة",
        subtypes.map((s) => s.id),
        {
          optionLabels: Object.fromEntries(
            subtypes.map((s) => [s.id, s.label]),
          ),
        },
      ),
    );
  const primary = collections[0];
  if (primary) merge(primary.fields, extra.unitFields || []);
  for (const c of extra.collections || []) collections.push(c);
  if (base.key === "video") {
    const captions = collections.find((c) => c.key === "captions");
    if (captions)
      merge(captions.fields, [
        field(
          "text",
          "Caption cue text",
          "Texte du sous-titre",
          "نص مقطع الترجمة",
          "textarea",
        ),
        num(
          "startSeconds",
          "Caption start · seconds",
          "Début du sous-titre · secondes",
          "بداية الترجمة · ثوان",
        ),
        num(
          "endSeconds",
          "Caption end · seconds",
          "Fin du sous-titre · secondes",
          "نهاية الترجمة · ثوان",
        ),
      ]);
  }
  for (const c of collections)
    for (const f of c.fields) {
      if (base.key === "activities" && f.key === "answer") f.localized = false;
      if (f.key === "assetId")
        Object.assign(f, {
          reference: "media",
          mime:
            base.key === "printables"
              ? ["application/pdf", "image/"]
              : base.key === "video"
                ? ["video/"]
                : base.key === "audio"
                  ? ["audio/"]
                  : base.key === "stories" ||
                      base.key === "visual-cards" ||
                      base.key === "presentations"
                    ? ["image/"]
                    : undefined,
        });
      if (f.key === "narrationAssetId") f.localized = true;
      if (f.key === "nativeId") f.reference = "offers";
      if (f.key === "contentId") f.reference = "content";
      if (f.key === "experienceId" || f.key === "assessmentId")
        f.reference = "experience";
      if (f.key === "backAssetId")
        Object.assign(f, { reference: "media", mime: ["image/"] });
    }
  if (base.key === "planners" && primary) {
    const type = primary.fields.find((f) => f.key === "type");
    if (type)
      type.options = [
        "checkbox",
        "text",
        "textarea",
        "number",
        "date",
        "select",
        "fixed",
      ];
  }
  for (const f of fields) {
    if (f.type === "reference" && f.key === "narrationAssetId")
      Object.assign(f, {
        reference: "media",
        mime: ["audio/"],
        localized: true,
      });
    if (f.type === "reference" && f.key === "captionAssetId")
      Object.assign(f, { reference: "media", mime: ["text/vtt"] });
  }
  const placements: Record<string, string[]> = {
    minutes: ["timed"],
    challengeSeconds: ["challenge"],
    columns: ["gallery"],
    shuffle:
      base.key === "visual-cards" ? ["study"] : ["quiz", "practice", "timed"],
    loop: ["autoplay"],
    defaultSeconds: ["autoplay"],
    pageSeconds: ["slideshow"],
    narrationAssetId: base.key === "stories" ? ["read_aloud", "slideshow"] : [],
    privateReceiverId: ["upload"],
    attachmentTypes: ["upload"],
    attachmentMaxMb: ["upload"],
  };
  for (const f of fields)
    if (placements[f.key]?.length) f.modes = placements[f.key];
  const capabilities = actionCapabilities(base.key, base.actions);
  return enrichDetailExperience({
    ...base,
    actions: capabilities.map((c) => c.id),
    capabilities,
    fields,
    collections,
    definitionVersion: DEFINITION_VERSION,
    modesContract: base.modes.map((key, i) => ({
      key,
      family: base.key,
      engine: engines[base.key][i],
      controls: modeControls[engines[base.key][i]] || fields.map((f) => f.key),
      requiredCollections: primary ? [primary.key] : [],
      description: label(
        key + " authoring and inspection",
        "Édition et inspection · " + key,
        "التحرير والفحص · " + key,
      ),
      version: 2,
      allowedEngines:
        base.key === "activities"
          ? i === 2
            ? ["choice", "sorting"]
            : ["matching", "memory", "sequence", "sorting", "choice"]
          : undefined,
    })),
  });
}
export function modeContract(family: Family | undefined, data: Data) {
  const m = family?.modesContract?.find((m) => m.key === data.mode);
  return family?.key === "activities" && data.engine === "bridge" && m
    ? { ...m, requiredCollections: ["bridgeChallenges"] }
    : m;
}

export interface CompatibilityResult {
  data: Data;
  notices: { path: string; message: string; conflict: boolean }[];
}
/** Pure read adapter. The input, archived definitions and release manifests are never mutated. */
export function compatibleDefinition(
  family: string | null,
  data: Data,
): CompatibilityResult {
  const next = structuredClone(data),
    notices: CompatibilityResult["notices"] = [];
  const alias = (target: Data, key: string, oldKey: string, path: string) => {
    if (target[oldKey] === undefined) return;
    if (next.compatibilityAdopted === true && target[key] !== undefined) return;
    if (target[key] === undefined) {
      target[key] = structuredClone(target[oldKey]);
      notices.push({
        path,
        message: `Legacy ${oldKey} is read as ${key}; save a new draft to adopt version 2.`,
        conflict: false,
      });
    } else if (JSON.stringify(target[key]) !== JSON.stringify(target[oldKey]))
      notices.push({
        path,
        message: `${key} and legacy ${oldKey} differ. The canonical ${key} is used; reconcile the legacy value explicitly.`,
        conflict: true,
      });
  };
  if (family === "forms") alias(next, "fields", "formFields", "fields");
  if (
    family === "audio" &&
    !array(next.units).length &&
    array(next.episodes).length
  ) {
    next.units = structuredClone(next.episodes);
    notices.push({
      path: "units",
      message: "Legacy episodes are read as ordered audio units.",
      conflict: false,
    });
  }
  for (const row of array(next.tasks)) {
    alias(row, "prompt", "label", "tasks." + text(row.id) + ".prompt");
    for (const locale of Object.values(object(row.locales)))
      alias(
        object(locale),
        "prompt",
        "label",
        "tasks." + text(row.id) + ".locales",
      );
  }
  for (const row of array(next.rules)) {
    alias(row, "title", "label", "rules." + text(row.id) + ".title");
    alias(row, "text", "description", "rules." + text(row.id) + ".text");
    for (const locale of Object.values(object(row.locales))) {
      alias(
        object(locale),
        "title",
        "label",
        "rules." + text(row.id) + ".locales",
      );
      alias(
        object(locale),
        "text",
        "description",
        "rules." + text(row.id) + ".locales",
      );
    }
  }
  for (const row of array(next.items)) {
    if (!row.type) row.type = row.editable === true ? "textarea" : "checkbox";
    if (row.editable === false && row.type !== "checkbox") row.type = "fixed";
  }
  return { data: next, notices };
}
export function definitionDefaults(family: Family, data: Data): Data {
  const next = { ...data, definitionVersion: DEFINITION_VERSION } as Data;
  for (const f of family.fields)
    if (next[f.key] === undefined && f.defaultValue !== undefined)
      next[f.key] = structuredClone(f.defaultValue);
  for (const c of family.collections)
    if (next[c.key] === undefined) next[c.key] = [];
  return next;
}
/** These mutations are used directly by the real editor, and by import/UI conformance checks. */
export function createUnit(collection: Collection, id: string): Data {
  const row: Data = { id };
  for (const f of collection.fields)
    if (f.key !== "id") {
      if (f.defaultValue !== undefined)
        row[f.key] = structuredClone(f.defaultValue);
      else if (f.type === "toggle") row[f.key] = false;
      else if (f.type === "number") row[f.key] = f.min ?? 0;
      else if (f.type === "select") row[f.key] = f.options?.[0] || "";
    }
  return row;
}
export function editUnit(
  row: Data,
  field: Field,
  value: Json,
  locale: Locale,
  defaultLocale: Locale,
): Data {
  const updated = { ...row, [field.key]: value };
  if (
    field.localized &&
    typeof value === "string" &&
    !["select", "number", "toggle"].includes(field.type)
  ) {
    updated.locales = {
      ...object(row.locales),
      [locale]: { ...object(object(row.locales)[locale]), [field.key]: value },
    };
    if (
      field.localized &&
      locale !== defaultLocale &&
      row[field.key] !== undefined
    )
      updated[field.key] = row[field.key];
  }
  return updated;
}
export function reorderUnits(rows: Data[], id: string, offset: number): Data[] {
  const index = rows.findIndex((r) => r.id === id),
    to = index + offset;
  if (index < 0 || to < 0 || to >= rows.length) return rows;
  const next = [...rows];
  [next[index], next[to]] = [next[to], next[index]];
  return next;
}
export function visibleFormFields(fields: Data[], values: Data, step?: number) {
  const resolved = new Map<string, boolean>();
  function visible(f: Data, path = new Set<string>()): boolean {
    const id = text(f.id);
    if (resolved.has(id)) return resolved.get(id)!;
    if (path.has(id)) return false;
    path.add(id);
    const target = fields.find((t) => t.id === f.conditionTarget),
      result =
        !f.condition ||
        f.condition === "always" ||
        (f.condition === "answer_equals" &&
          Boolean(target && visible(target, new Set(path))) &&
          String(values[text(f.conditionTarget)] ?? "") ===
            text(f.conditionValue));
    resolved.set(id, result);
    return result;
  }
  return fields.filter(
    (f) => (step === undefined || Number(f.step || 1) === step) && visible(f),
  );
}
export function formValueErrors(
  fields: Data[],
  values: Data,
): { path: string; message: string }[] {
  const errors: { path: string; message: string }[] = [];
  for (const f of visibleFormFields(fields, values)) {
    const v = values[text(f.id)],
      s = String(v ?? "");
    if (
      f.required === true &&
      (!s.trim() || (f.type === "checkbox" && v !== true))
    )
      errors.push({
        path: "fields." + text(f.id),
        message: "Complete the required field.",
      });
    if (!s) continue;
    if (f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))
      errors.push({
        path: "fields." + text(f.id),
        message: "Enter a valid email.",
      });
    if (
      f.type === "number" &&
      (!Number.isFinite(Number(v)) ||
        Number(v) < Number(f.min ?? 0) ||
        Number(v) > Number(f.max ?? 100000))
    )
      errors.push({
        path: "fields." + text(f.id),
        message: "Number is outside the configured bounds.",
      });
    if (
      ["text", "textarea", "email", "tel"].includes(text(f.type)) &&
      (s.length < Number(f.min ?? 0) || s.length > Number(f.max ?? 4000))
    )
      errors.push({
        path: "fields." + text(f.id),
        message: "Text length is outside the configured bounds.",
      });
    if (f.type === "select" && !text(f.options).split("\n").includes(s))
      errors.push({
        path: "fields." + text(f.id),
        message: "Choose a declared option.",
      });
  }
  return errors;
}

/** Explicit operator adoption retains original aliases in private compatibility evidence. */
export function adoptLegacyDefinition(
  family: string,
  data: Data,
  prefer: "canonical" | "legacy",
): Data {
  const next = structuredClone(data),
    archive: Data = {};
  const adopt = (target: Data, key: string, old: string, path: string) => {
    if (target[old] === undefined) return;
    archive[path] = {
      canonical: target[key] ?? null,
      legacy: target[old],
      choice: prefer,
    };
    if (prefer === "legacy" || target[key] === undefined)
      target[key] = structuredClone(target[old]);
    target[old] = structuredClone(target[key]);
  };
  if (family === "forms") adopt(next, "fields", "formFields", "fields");
  if (family === "audio") adopt(next, "units", "episodes", "units");
  for (const row of array(next.tasks))
    adopt(row, "prompt", "label", "tasks." + text(row.id));
  for (const row of array(next.rules)) {
    adopt(row, "title", "label", "rules." + text(row.id) + ".title");
    adopt(row, "text", "description", "rules." + text(row.id) + ".text");
  }
  next.compatibilityArchive = [
    ...array(next.compatibilityArchive),
    {
      adoptedAt: new Date().toISOString(),
      version: DEFINITION_VERSION,
      evidence: archive,
    },
  ];
  next.compatibilityAdopted = true;
  next.definitionVersion = DEFINITION_VERSION;
  return next;
}

export const CONTENT_WORKBENCH: Family = {
  key: "editorial",
  number: 0,
  name: label(
    "Reusable editorial content",
    "Contenu éditorial réutilisable",
    "محتوى تحريري قابل لإعادة الاستخدام",
  ),
  description: label(
    "Governed reusable blocks",
    "Blocs réutilisables gouvernés",
    "كتل قابلة لإعادة الاستخدام ومحكومة",
  ),
  icon: "FileText",
  color: "#1474ed",
  modes: ["Structured editorial"],
  actions: ["read"],
  fields: [
    field(
      "body",
      "Accessible body",
      "Corps accessible",
      "النص المتاح",
      "textarea",
    ),
    field(
      "source",
      "Source and attribution",
      "Source et attribution",
      "المصدر والإسناد",
    ),
    select("rights", "Editorial rights", "Droits éditoriaux", "حقوق المحتوى", [
      "owned",
      "licensed",
      "permission",
      "public_domain",
      "unverified",
    ]),
  ],
  collections: [
    collection(
      "sections",
      "Structured editorial blocks",
      "Blocs éditoriaux structurés",
      "الكتل التحريرية المنظمة",
      [
        title,
        select("type", "Block type", "Type de bloc", "نوع الكتلة", [
          "heading",
          "paragraph",
          "callout",
          "list",
          "image",
          "content",
        ]),
        field("text", "Block text", "Texte du bloc", "نص الكتلة", "textarea"),
        ref(
          "assetId",
          "Illustration",
          "Illustration",
          "صورة توضيحية",
          "media",
          ["image/"],
        ),
        ref(
          "contentId",
          "Reusable published content",
          "Contenu publié réutilisable",
          "محتوى منشور قابل لإعادة الاستخدام",
          "content",
        ),
        field(
          "alt",
          "Accessible image alternative",
          "Alternative accessible de l’image",
          "وصف متاح للصورة",
        ),
        field("href", "Safe source link", "Lien source sûr", "رابط مصدر آمن"),
      ],
    ),
  ],
  definitionVersion: 2,
};
export const MEDIA_WORKBENCH: Family = {
  key: "asset",
  number: 0,
  name: label(
    "Source and rendition inspector",
    "Inspecteur de source et renditions",
    "فاحص المصدر والنسخ",
  ),
  description: label(
    "Native vault owned sources",
    "Sources du coffre natif",
    "مصادر الخزنة الأصلية",
  ),
  icon: "Images",
  color: "#089eaa",
  modes: ["Native sources"],
  actions: [],
  fields: [
    ref(
      "nativeAssetId",
      "Original native source",
      "Source native originale",
      "المصدر الأصلي",
      "media",
    ),
    select("rights", "Rights", "Droits", "الحقوق", [
      "owned",
      "licensed",
      "permission",
      "public_domain",
      "unverified",
    ]),
    field(
      "rightsHolder",
      "Rights holder",
      "Titulaire des droits",
      "صاحب الحقوق",
    ),
    field(
      "rightsExpiresAt",
      "Rights expiry · ISO date",
      "Expiration des droits · date ISO",
      "انتهاء الحقوق · تاريخ ISO",
    ),
    field(
      "accessibleText",
      "Accessible source text",
      "Texte source accessible",
      "نص المصدر المتاح",
      "textarea",
    ),
    toggle(
      "downloadAllowed",
      "Download permitted",
      "Téléchargement permis",
      "التنزيل مسموح",
    ),
    toggle(
      "printAllowed",
      "Print permitted",
      "Impression permise",
      "الطباعة مسموحة",
    ),
  ],
  collections: [
    collection(
      "renditions",
      "Native renditions and accessibility sources",
      "Renditions natives et sources d’accessibilité",
      "النسخ الأصلية ومصادر الإتاحة",
      [
        title,
        select(
          "role",
          "Rendition purpose",
          "Usage de la rendition",
          "غرض النسخة",
          [
            "preview",
            "print",
            "download",
            "poster",
            "caption",
            "transcript",
            "narration",
          ],
        ),
        ref(
          "assetId",
          "Existing native rendition",
          "Rendition native existante",
          "نسخة أصلية موجودة",
          "media",
        ),
        select("locale", "Language", "Langue", "اللغة", ["fr", "en", "ar"]),
        field(
          "sourceChecksum",
          "Produced-from checksum evidence",
          "Preuve du checksum source",
          "دليل بصمة المصدر",
        ),
        field(
          "processingReference",
          "Native processing reference",
          "Référence de traitement natif",
          "مرجع المعالجة الأصلي",
        ),
      ],
    ),
  ],
  definitionVersion: 2,
};
