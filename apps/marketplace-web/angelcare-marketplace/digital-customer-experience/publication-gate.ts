import { dossierCapabilityIndex } from "./production-model";
import { classificationChoices } from "../kidflix/storefront-reference/taxonomy";
import { DEPTH_COLLECTIONS } from "./experience-depth";
import { mediaSlots } from "./validation";
import { familyByKey } from "./registry";
import {
  array,
  object,
  text,
  type DceRecord,
  type Field,
  type Issue,
  type Json,
  type Locale,
  type Kind,
  type Tri,
} from "./types";
export type GateChoice = { value: string; label: Tri };
export type GateControl = {
  kind:
    | "text"
    | "textarea"
    | "number"
    | "toggle"
    | "select"
    | "multi"
    | "media"
    | "record"
    | "offers"
    | "topic"
    | "package"
    | "decision";
  path: string;
  localized?: boolean;
  min?: number;
  max?: number;
  options?: GateChoice[];
  mime?: string[];
  recordKind?: Kind;
};
export type GateDiagnostic = {
  id: string;
  path: string;
  codes: string[];
  severity: "error" | "warning";
  title: Tri;
  cause: Tri;
  impact: Tri;
  control: GateControl;
  current: Json;
  evidence: Tri[];
};
const tri = (v: string): Tri => [v, v, v];
/** Only declared controls can be edited by the final gate. A validation path is never an arbitrary object write. */
export function gateControl(record: DceRecord, path: string): GateControl {
  const family = familyByKey(record.family || ""),
    clean = path.replace(/^data\./, "").replace(/^locales\.(en|fr|ar)\./, "");
  if (clean === "interactivePackage" || clean.startsWith("interactivePackages"))
    return { kind: "package", path: "interactivePackage" };
  if (clean === "certificatePolicy" || clean === "certificatePolicy.enabled")
    return { kind: "toggle", path: "certificatePolicy.enabled" };
  if (clean === "certificatePolicy.minimumScore")
    return { kind: "number", path: clean, min: 0, max: 100 };
  if (clean === "certificatePolicy.evidence")
    return {
      kind: "select",
      path: clean,
      options: ["manual_review", "server_assessment"].map((value) => ({
        value,
        label: tri(value),
      })),
    };
  if (clean === "certificatePolicy.assessmentId")
    return { kind: "record", path: clean, recordKind: "experience" };
  if (clean === "topic") return { kind: "topic", path: clean };
  if (clean === "audience")
    return {
      kind: "select",
      path: clean,
      options: ["child", "parent", "educator", "professional", "school"].map(
        (value) => ({ value, label: tri(value) }),
      ),
    };
  if (clean === "coverAssetId")
    return { kind: "media", path: clean, mime: ["image/png"] };
  if (
    [
      "storefrontFocus",
      "storefrontThemes",
      "storefrontNeeds",
      "storefrontQuick",
    ].includes(clean)
  )
    return {
      kind: "multi",
      path: clean,
      options: classificationChoices(record.family || "", clean).map((c) => ({
        value: c.key,
        label: c.title,
      })),
    };
  const simple: Record<string, Field> = {
    title: { key: "title", label: tri("Title"), type: "text", localized: true },
    summary: {
      key: "summary",
      label: tri("Summary"),
      type: "textarea",
      localized: true,
    },
    instructions: {
      key: "instructions",
      label: tri("Instructions"),
      type: "textarea",
      localized: true,
    },
    body: {
      key: "body",
      label: tri("Body"),
      type: "textarea",
      localized: true,
    },
    mode: {
      key: "mode",
      label: tri("Mode"),
      type: "select",
      options: family?.modes || [],
    },
    ageMin: {
      key: "ageMin",
      label: tri("Minimum age"),
      type: "number",
      min: 0,
      max: 25,
    },
    ageMax: {
      key: "ageMax",
      label: tri("Maximum age"),
      type: "number",
      min: 0,
      max: 25,
    },
  };
  const parts = clean.split("."),
    collection = [...(family?.collections || []), ...DEPTH_COLLECTIONS].find(
      (c) => c.key === parts[0],
    );
  let definition: Field | undefined;
  if (parts.length === 1)
    definition =
      simple[clean] ||
      dossierCapabilityIndex(record).find((c) => c.path === clean)?.definition;
  else if (
    parts.length === 3 &&
    collection &&
    array(record.data[parts[0]]).some((u) => u.id === parts[1])
  )
    definition = collection.fields.find((f) => f.key === parts[2]);
  if (!definition) return { kind: "decision", path: clean };
  if (definition.type === "reference") {
    if (definition.reference === "media" || /AssetId$/.test(definition.key))
      return {
        kind: "media",
        path: clean,
        mime: definition.mime || [
          "image/png",
          "application/pdf",
          "video/",
          "audio/",
        ],
      };
    if (definition.reference === "offers")
      return { kind: "offers", path: clean };
    const declaredKind: Kind | undefined =
      definition.reference === "content"
        ? "content"
        : definition.reference === "experience"
          ? "experience"
          : (
              {
                templateId: "template",
                accessPolicyId: "access_policy",
                assessmentId: "experience",
                experienceId: "experience",
                contentId: "content",
              } as Record<string, Kind>
            )[definition.key];
    return declaredKind
      ? { kind: "record", path: clean, recordKind: declaredKind }
      : { kind: "decision", path: clean };
  }
  const multi =
    clean.startsWith("document") &&
    definition.type === "textarea" &&
    definition.options;
  return {
    kind: multi
      ? "multi"
      : definition.type === "toggle"
        ? "toggle"
        : definition.type,
    path: clean,
    localized: definition.localized,
    min: definition.min,
    max: definition.max,
    options: definition.options?.map((value) => ({
      value,
      label: definition.optionLabels?.[value] || tri(value),
    })),
  };
}
export function gateValue(
  record: DceRecord,
  control: GateControl,
  locale: Locale,
): Json {
  if (control.path === "topic" || control.path === "audience")
    return record[control.path];
  let v: unknown = record.data;
  const parts = control.path.split(".");
  if (parts.length === 3) {
    const unit = array(record.data[parts[0]]).find((u) => u.id === parts[1]);
    v = control.localized
      ? object(object(unit?.locales)[locale])[parts[2]]
      : unit?.[parts[2]];
  } else if (parts.length === 2 && parts[0] === "certificatePolicy")
    v = object(record.data[parts[0]])[parts[1]];
  else
    v = control.localized
      ? object(object(record.data.locales)[locale])[parts[0]]
      : record.data[parts[0]];
  return v === undefined ? null : (v as Json);
}
export function gateDiagnostics(
  record: DceRecord,
  issues: Issue[],
  locale: Locale,
): GateDiagnostic[] {
  const grouped = new Map<string, Issue[]>();
  for (const issue of issues) {
    const slots =
      issue.path === "media"
        ? mediaSlots(familyByKey(record.family || ""), record.data).filter(
            (slot) => issue.message[0].includes(slot.id),
          )
        : [];
    for (const path of slots.length
      ? slots.map((slot) => slot.path)
      : [issue.path])
      grouped.set(path, [...(grouped.get(path) || []), { ...issue, path }]);
  }
  return [...grouped].map(([path, rows]) => {
    const control = gateControl(record, path),
      entry = dossierCapabilityIndex(record).find(
        (c) => c.path === control.path,
      );
    return {
      id: path,
      path,
      codes: [...new Set(rows.map((r) => r.code))],
      severity: rows.some((r) => r.severity === "error") ? "error" : "warning",
      title:
        entry?.label ||
        (
          {
            coverAssetId: [
              "Editorial cover",
              "Couverture éditoriale",
              "الغلاف التحريري",
            ],
            interactivePackage: ["HTML package", "Package HTML", "حزمة HTML"],
            topic: ["Parent topic", "Thème parent", "الموضوع الأصلي"],
          } as Record<string, Tri>
        )[path] ||
        tri(path),
      cause: decodeGateCause(rows[0]),
      evidence: rows.map((row) => row.message),
      impact: rows.some((r) => r.severity === "error")
        ? [
            "This prevents publication of the selected edition.",
            "Ce point empêche la publication de l’édition sélectionnée.",
            "يمنع هذا نشر النسخة المختارة.",
          ]
        : [
            "Review this warning before publication.",
            "Vérifiez cet avertissement avant publication.",
            "راجع هذا التنبيه قبل النشر.",
          ],
      control,
      current: gateValue(record, control, locale),
    };
  });
}
export function setGateValue(
  record: DceRecord,
  control: GateControl,
  locale: Locale,
  value: Json,
): DceRecord {
  const next = structuredClone(record),
    p = control.path.split(".");
  if (control.path === "topic") next.topic = text(value) || null;
  else if (control.path === "audience") next.audience = text(value);
  else if (p.length === 3) {
    next.data[p[0]] = array(next.data[p[0]]).map((unit) =>
      unit.id !== p[1]
        ? unit
        : control.localized
          ? {
              ...unit,
              locales: {
                ...object(unit.locales),
                [locale]: {
                  ...object(object(unit.locales)[locale]),
                  [p[2]]: value,
                },
              },
            }
          : { ...unit, [p[2]]: value },
    );
  } else if (
    p.length === 2 &&
    p[0] === "certificatePolicy" &&
    ["enabled", "minimumScore", "evidence", "assessmentId"].includes(p[1])
  )
    next.data[p[0]] = { ...object(next.data[p[0]]), [p[1]]: value };
  else if (p.length === 1) {
    if (control.localized) {
      next.data.locales = {
        ...object(next.data.locales),
        [locale]: {
          ...object(object(next.data.locales)[locale]),
          [p[0]]: value,
        },
      };
      if (locale === next.data.defaultLocale) next.data[p[0]] = value;
      if (p[0] === "title" && !text(next.title)) next.title = text(value);
    } else next.data[p[0]] = value;
  } else throw Error("UNSUPPORTED_REPAIR_PATH");
  return next;
}
export function validateGateValue(
  control: GateControl,
  value: unknown,
): asserts value is Json {
  if (["decision", "package"].includes(control.kind))
    throw Error("REPAIR_REQUIRES_SPECIALIST_ACTION");
  if (control.kind === "number") {
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      (control.min !== undefined && value < control.min) ||
      (control.max !== undefined && value > control.max)
    )
      throw Error("REPAIR_NUMBER_OUT_OF_RANGE");
    return;
  }
  if (control.kind === "toggle") {
    if (typeof value !== "boolean") throw Error("REPAIR_BOOLEAN_REQUIRED");
    return;
  }
  if (typeof value !== "string" || value.length > 24000)
    throw Error("REPAIR_TEXT_INVALID");
  if (
    control.kind === "select" &&
    !control.options?.some((o) => o.value === value)
  )
    throw Error("REPAIR_OPTION_NOT_ELIGIBLE");
  if (
    control.kind === "multi" &&
    value
      .split(/\r?\n/)
      .filter(Boolean)
      .some((v) => !control.options?.some((o) => o.value === v))
  )
    throw Error("REPAIR_OPTION_NOT_ELIGIBLE");
}

const DECODERS: Record<string, Tri> = {
  STOREFRONT_CLASSIFICATION: [
    "Some saved values do not exist in this category’s verified filters. Choose replacements or remove the optional invalid selections.",
    "Certaines valeurs enregistrées n’existent pas dans les filtres vérifiés de cette catégorie. Choisissez des remplacements ou retirez les sélections facultatives invalides.",
    "بعض القيم المحفوظة غير موجودة في مرشحات هذه الفئة المعتمدة. اختر بدائل أو احذف القيم الاختيارية غير الصالحة.",
  ],
  DOCUMENT_CLASSIFICATION: [
    "The document classification differs from the registered choices.",
    "Le classement documentaire diffère des choix enregistrés.",
    "يختلف تصنيف المستند عن الخيارات المسجلة.",
  ],
  PUBLIC_COVER_REQUIRED: [
    "The storefront needs an available editorial image. Choose a PNG from the native vault or upload it here.",
    "La carte publique nécessite une image éditoriale disponible. Choisissez un PNG du coffre natif ou ajoutez-le ici.",
    "تحتاج البطاقة العامة إلى غلاف متاح. اختر PNG من الخزنة الأصلية أو ارفعه هنا.",
  ],
  PUBLIC_MEDIA_UNAVAILABLE: [
    "The public player cannot resolve this source. Select an available replacement; the original reference stays in the repair receipt.",
    "Le lecteur public ne peut pas ouvrir cette source. Sélectionnez un remplacement disponible ; la référence d’origine reste dans le reçu de correction.",
    "لا يمكن للمشغل العام فتح هذا المصدر. اختر بديلاً متاحاً؛ يبقى المرجع الأصلي في إيصال التصحيح.",
  ],
  PUBLIC_MEDIA_TYPE: [
    "This file format does not match the player’s declared source type. The choices below use the allowed formats.",
    "Le format du fichier ne correspond pas au type de source déclaré. Les choix ci-dessous utilisent les formats autorisés.",
    "لا يطابق تنسيق الملف نوع المصدر المعلن. تعرض الخيارات أدناه التنسيقات المسموحة.",
  ],
  ENUM: [
    "This saved value is not supported by the registered control. Select an actual option below.",
    "Cette valeur enregistrée n’est pas prise en charge. Sélectionnez un choix réellement disponible ci-dessous.",
    "هذه القيمة المحفوظة غير مدعومة. اختر قيمة متاحة أدناه.",
  ],
  MODE: [
    "The native mode name does not match this category’s registered modes. HTML content keeps its own interactions.",
    "Le mode natif ne correspond pas aux modes enregistrés de cette catégorie. Le contenu HTML conserve ses propres interactions.",
    "لا يطابق الوضع الأصلي الأوضاع المسجلة لهذه الفئة. يحتفظ محتوى HTML بتفاعلاته.",
  ],
  NUMBER: [
    "A number is missing or outside the declared limits. Use the limits shown by this control.",
    "Une valeur numérique est absente ou hors des limites déclarées. Utilisez les limites de ce réglage.",
    "قيمة رقمية مفقودة أو خارج الحدود المعلنة. استخدم حدود هذا الإعداد.",
  ],
  TRANSLATION_REQUIRED: [
    "Text for this edition is missing. Enter the reviewed translation here; another language’s text is not treated as a translation.",
    "Un texte de cette édition manque. Saisissez ici la traduction vérifiée ; le texte d’une autre langue ne vaut pas traduction.",
    "ينقص نص لهذه النسخة. أدخل الترجمة المراجعة هنا؛ لا يُعد نص لغة أخرى ترجمة.",
  ],
  EDITION_TRANSLATION: [
    "This language edition is incomplete. Add the reviewed text at this exact position.",
    "Cette édition linguistique est incomplète. Ajoutez le texte vérifié à cet emplacement précis.",
    "هذه النسخة اللغوية غير مكتملة. أضف النص المراجع في هذا الموضع.",
  ],
};
function decodeGateCause(issue: Issue): Tri {
  if (issue.code === "INTERACTIVE_PACKAGE") {
    if (/SQL_REQUIRED/.test(issue.message[0]))
      return [
        "The installed publication service is not activated. An administrator must activate the supplied database migration, then retry this check.",
        "Le service de publication installé n’est pas activé. Un administrateur doit activer la migration fournie, puis relancer ce contrôle.",
        "خدمة النشر المثبتة غير مفعلة. يجب على مسؤول تفعيل الترحيل المرفق ثم إعادة الفحص.",
      ];
    return [
      "The HTML package is absent, incompatible with this edition or already bound elsewhere. Choose an eligible package below; a package bound to another dossier requires an independent copy.",
      "Le package HTML est absent, incompatible avec cette édition ou déjà lié ailleurs. Choisissez un package éligible ci-dessous ; un package lié à un autre dossier nécessite une copie indépendante.",
      "حزمة HTML غائبة أو غير متوافقة أو مرتبطة بملف آخر. اختر حزمة مؤهلة؛ تتطلب الحزمة المرتبطة بملف آخر نسخة مستقلة.",
    ];
  }
  return DECODERS[issue.code] || issue.message;
}
