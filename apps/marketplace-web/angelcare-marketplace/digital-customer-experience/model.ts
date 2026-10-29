import { gradeQuestions } from "./experience-depth";
import { WORLD_DEFAULTS, worldIssues } from "./administration";
import { projectLayout } from "./composition";
import {
  compatibleDefinition,
  definitionDefaults,
  DEFINITION_VERSION,
} from "./capabilities";
import { htmlActivityIssues, restrictedMarkup } from "./html-activity";
import { capabilityIssues } from "./validation";
import { AD_FORMATS, FAMILIES, familyByKey, formatById } from "./registry";
import {
  AUDIENCES,
  CONTRACT,
  KINDS,
  LIFECYCLES,
  LOCALES,
  array,
  localized,
  number,
  object,
  text,
} from "./types";
import type {
  Data,
  DceRecord,
  Issue,
  Json,
  Kind,
  Locale,
  Validation,
} from "./types";

const ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const isId = (
  value: unknown,
): value is string & { readonly __uuid: "uuid" } =>
  typeof value === "string" && ID.test(value);
export const keyPattern = /^[a-z0-9][a-z0-9._-]{1,119}$/;
export const MAX_DOCUMENT_BYTES = 512 * 1024;
export function assertJson(value: unknown, depth = 0): asserts value is Json {
  if (depth > 20) throw Error("Document nesting exceeds 20 levels.");
  if (value === null || typeof value === "string" || typeof value === "boolean")
    return;
  if (typeof value === "number" && Number.isFinite(value)) return;
  if (Array.isArray(value)) {
    if (value.length > 2000) throw Error("A collection exceeds 2000 entries.");
    value.forEach((v) => assertJson(v, depth + 1));
    return;
  }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      if (["__proto__", "prototype", "constructor"].includes(k))
        throw Error("Unsafe property.");
      assertJson(v, depth + 1);
    }
    return;
  }
  throw Error("JSON contains an unsupported value.");
}
export function safeHref(value: unknown): boolean {
  const s = text(value);
  if (!s || /[\u0000-\u001f\\]/.test(s) || s.startsWith("//")) return false;
  if (s.startsWith("/")) return !s.includes("..");
  try {
    const u = new URL(s);
    return u.protocol === "https:" && !u.username && !u.password;
  } catch {
    return false;
  }
}
export function blankRecord(
  kind: Kind = "experience",
  family = "documents",
  locale: Locale = "en",
  world: Data = {},
): Partial<DceRecord> {
  const f = familyByKey(family) || FAMILIES[0];
  const data: Data = {
    locales: {
      en: { title: "", summary: "" },
      fr: { title: "", summary: "" },
      ar: { title: "", summary: "" },
    },
    defaultLocale: locale,
    requiredLocales: [locale],
    ageMin: 0,
    ageMax: 18,
    visibility: "free",
    publicEnabled: false,
  };
  if (kind === "experience" || kind === "template") {
    data.mode = f.modes[0];
    data.actions = [...f.actions];
    data.units = [];
    for (const c of f.collections) data[c.key] = [];
    data.layout = {
      theme: "reference-light",
      accent: f.color,
      regions: [
        "stage",
        "details",
        "panels",
        "actions",
        "continuity",
        "monetization",
      ],
    };
    data.dependencies = [];
  }
  if (kind === "topic")
    Object.assign(data, {
      parentId: null,
      icon: "Heart",
      color: "#ec4c91",
      sortOrder: 0,
      visible: true,
    });
  if (kind === "content")
    Object.assign(data, {
      body: "",
      sections: [],
      source: "",
      rights: "owned",
    });
  if (kind === "asset")
    Object.assign(data, {
      nativeAssetId: "",
      rights: "owned",
      downloadAllowed: false,
      printAllowed: false,
      accessibleText: "",
      renditions: [],
      processingState: "not_inspected",
    });
  if (kind === "bundle")
    Object.assign(data, {
      steps: [],
      requiredLocales: [locale],
      completion: "required_steps",
      allowRestart: true,
    });
  if (kind === "access_policy")
    Object.assign(data, {
      scope: "direct",
      targetId: "",
      use: "free",
      download: "permitted",
      print: "disabled",
      contribute: "account",
      audiences: [...AUDIENCES],
      expiresAt: null,
    });
  if (kind === "offer_link")
    Object.assign(data, {
      nativeId: "",
      role: "related",
      action: "details",
      entitlementSource: "native",
    });
  if (kind === "ad_policy")
    Object.assign(data, {
      enabled: false,
      scope: "world",
      targetId: "",
      formatId: "01",
      zone: "after_intro",
      unitId: "",
      audiences: ["parent", "educator", "professional", "school"],
      allowedLocales: [...LOCALES],
      devices: ["desktop", "mobile"],
      consentRequired: true,
      minimumSpacing: 600,
      maximumCount: 2,
      frequencyMinutes: 30,
      childTreatment: true,
      priority: 0,
    });
  if (kind === "ad_connection")
    Object.assign(data, {
      publisherId: "",
      account: "",
      site: "",
      programs: [],
      verification: "not_verified",
    });
  if (kind === "ad_unit")
    Object.assign(data, {
      providerName: "",
      unitId: "",
      formatId: "01",
      size: "1x3",
      providerState: "unknown",
      localEnabled: false,
    });
  if (kind === "contribution")
    Object.assign(data, {
      experienceId: "",
      customerId: "",
      body: "",
      rating: 0,
      consent: false,
      moderationReason: "",
      reports: [],
    });
  if (kind === "case")
    Object.assign(data, {
      experienceId: "",
      customerId: "",
      subject: "",
      body: "",
      assignedTo: "",
      priority: "normal",
      notes: [],
      attachments: [],
      destination: "dce",
      nativeReference: "",
    });
  if (kind === "setting")
    Object.assign(data, WORLD_DEFAULTS, { defaultLocale: locale });
  if (["experience", "template", "bundle"].includes(kind))
    Object.assign(
      data,
      definitionDefaults(kind === "bundle" ? familyByKey("bundles")! : f, data),
    );
  if (["experience", "template", "bundle"].includes(kind)) {
    if (["fr", "en", "ar"].includes(text(world.defaultLocale)))
      data.defaultLocale = world.defaultLocale;
    if (Array.isArray(world.enabledLocales) && world.enabledLocales.length)
      data.requiredLocales = [data.defaultLocale || locale];
    if (
      ["free", "account", "native_entitlement"].includes(
        text(world.defaultVisibility),
      )
    )
      data.visibility = world.defaultVisibility;
    if (
      ["explicit", "required_units", "assessment_pass"].includes(
        text(world.defaultCompletion),
      ) &&
      kind !== "bundle" &&
      (!f.fields.find((field) => field.key === "completion")?.options ||
        f.fields
          .find((field) => field.key === "completion")!
          .options!.includes(text(world.defaultCompletion)))
    )
      data.completion = world.defaultCompletion;
    data.layout = {
      accent: text(world.brandAccent) || "#076bff",
      ...object(data.layout),
    };
    data.brandSignature = text(world.brandSignature);
    if (f?.key === "forms" && text(world.supportTeam))
      data.responsibleTeam = text(world.supportTeam);
    if (world.allowDownloads === false) data.downloadAllowed = false;
    if (world.allowPrint === false) data.printAllowed = false;
  }
  return {
    kind,
    key: "",
    title: "",
    family: ["experience", "template"].includes(kind) ? f.key : null,
    topic: null,
    audience: "parent",
    data,
    lifecycle:
      kind === "case" ? "open" : kind === "contribution" ? "pending" : "draft",
    revision: 0,
  };
}
export function normalizeRecord(
  input: Partial<DceRecord>,
  existing?: DceRecord,
): Partial<DceRecord> {
  if (!KINDS.includes(input.kind as Kind))
    throw Error("Unsupported record kind.");
  const kind = input.kind as Kind,
    source = object(input.data);
  if (number(source.definitionVersion, 1) > DEFINITION_VERSION)
    throw Error(
      "Definition version is newer than this editor; preserve and upgrade before editing.",
    );
  const adapted = compatibleDefinition(input.family || null, source),
    data = { ...adapted.data, definitionVersion: DEFINITION_VERSION };
  assertJson(data);
  if (
    new TextEncoder().encode(JSON.stringify(data)).byteLength >
    MAX_DOCUMENT_BYTES
  )
    throw Error(
      "Document exceeds 512 KiB; split large resources into child records.",
    );
  const key = text(input.key).toLowerCase();
  if (!keyPattern.test(key))
    throw Error(
      "Use a stable key of 2–120 letters, digits, dots, hyphens or underscores.",
    );
  if (existing && (existing.kind !== kind || existing.key !== key))
    throw Error(
      "Record kind and stable key cannot be changed; duplicate to create a different identity.",
    );
  const title = text(input.title).slice(0, 220);
  if (!title) throw Error("A record title is required.");
  if (!AUDIENCES.includes(input.audience as (typeof AUDIENCES)[number]))
    throw Error("A child/family audience is required.");
  const family = text(input.family) || null;
  if (["experience", "template"].includes(kind) && !familyByKey(family || ""))
    throw Error("Choose one of the sixteen experience families.");
  if (input.lifecycle && !LIFECYCLES.includes(input.lifecycle))
    throw Error("Unknown lifecycle.");
  for (const [path, v] of Object.entries(data)) {
    if (
      (path.toLowerCase().endsWith("url") || path === "href") &&
      v &&
      !safeHref(v)
    )
      throw Error("Unsupported URL in " + path);
  }
  const inspect = (v: Json, k = "") => {
    if (
      typeof v === "string" &&
      (/url$/i.test(k) || k === "href") &&
      v &&
      !safeHref(v)
    )
      throw Error("Unsupported URL in " + k);
    if (Array.isArray(v)) v.forEach((x) => inspect(x, k));
    else if (v && typeof v === "object")
      Object.entries(v).forEach(([name, x]) => inspect(x, name));
  };
  inspect(data);
  return {
    kind,
    key,
    title,
    family,
    topic: text(input.topic) || null,
    audience: input.audience,
    data,
    lifecycle: existing?.lifecycle || input.lifecycle || "draft",
  };
}
export function validateRecord(
  record: DceRecord,
  now = new Date(),
): Validation {
  record = {
    ...record,
    data: {
      ...record.data,
      outputs: array(record.data.outputs).filter((o) => o.enabled !== false),
    },
  };
  const errors: Issue[] = [],
    warnings: Issue[] = [];
  const issue = (
    path: string,
    code: string,
    en: string,
    fr: string,
    ar: string,
    warning = false,
  ) =>
    (warning ? warnings : errors).push({
      path,
      code,
      message: [en, fr, ar],
      severity: warning ? "warning" : "error",
    });
  const d = compatibleDefinition(record.family, record.data).data,
    f = familyByKey(
      record.family || (record.kind === "bundle" ? "bundles" : ""),
    );
  if (d.publicRuntimeReady === true)
    issue(
      "publicRuntimeReady",
      "PUBLIC_RUNTIME",
      "Public runtime activation belongs to Chapter 2.",
      "Activation publique au chapitre 2.",
      "تفعيل العرض العام في الفصل الثاني.",
    );
  if (record.topic && !isId(record.topic))
    issue(
      "topic",
      "TOPIC",
      "Choose a real topic ID.",
      "Choisissez un ID de thème réel.",
      "اختر معرف موضوع حقيقي.",
    );
  const required = Array.isArray(d.requiredLocales)
    ? d.requiredLocales
    : [d.defaultLocale || "en"];
  for (const l of required) {
    if (!LOCALES.includes(l as Locale)) {
      issue(
        "requiredLocales",
        "LOCALE",
        "Unknown language.",
        "Langue inconnue.",
        "لغة غير معروفة.",
      );
      continue;
    }
    if (!text(object(object(d.locales)[String(l)]).title))
      issue(
        "locales." + l + ".title",
        "TITLE",
        "A localized title is required.",
        "Titre traduit requis.",
        "العنوان المترجم مطلوب.",
      );
  }
  const min = number(d.ageMin),
    max = number(d.ageMax, 18);
  if (
    !Number.isInteger(min) ||
    !Number.isInteger(max) ||
    min < 0 ||
    max < min ||
    max > 25
  )
    issue(
      "ageMin",
      "AGE",
      "Age range is invalid.",
      "Tranche d’âge invalide.",
      "الفئة العمرية غير صالحة.",
    );
  if (["experience", "template"].includes(record.kind)) {
    if (!f)
      issue(
        "family",
        "FAMILY",
        "Unknown family.",
        "Famille inconnue.",
        "عائلة غير معروفة.",
      );
    else {
      if (!f.modes.includes(text(d.mode)))
        issue(
          "mode",
          "MODE",
          "Select a compatible viewer mode.",
          "Choisissez un mode compatible.",
          "اختر وضعاً متوافقاً.",
        );
      const enabled = Array.isArray(d.actions) ? d.actions : [];
      for (const a of enabled)
        if (!f.actions.includes(String(a)))
          issue(
            "actions",
            "CAPABILITY",
            "Unsupported action.",
            "Action non prise en charge.",
            "إجراء غير مدعوم.",
          );
      for (const c of f.collections) {
        const rows = array(d[c.key]);
        if (rows.length < (c.min || 0) && record.kind === "experience" &&
          !(record.family === "planners" && c.key === "items" &&
            text(d.mode) === "Printable Preview" && array(d.units).some(u => ["pdf","image"].includes(text(u.kind)) && isId(u.assetId))))
          issue(
            c.key,
            "COLLECTION",
            "Add the required content.",
            "Ajoutez le contenu requis.",
            "أضف المحتوى المطلوب.",
          );
        const ids = new Set<string>();
        rows.forEach((row, i) => {
          const id = text(row.id);
          if (!id || ids.has(id))
            issue(
              `${c.key}.${i}.id`,
              "IDENTITY",
              "A unique stable unit ID is required.",
              "Identifiant d’unité stable et unique requis.",
              "معرّف وحدة ثابت وفريد مطلوب.",
            );
          ids.add(id);
          for (const field of c.fields) {
            const value = row[field.key];
            if (field.required && !text(value) && typeof value !== "number")
              issue(
                `${c.key}.${i}.${field.key}`,
                "REQUIRED",
                "Complete this field.",
                "Complétez ce champ.",
                "أكمل هذا الحقل.",
              );
            if (
              field.type === "select" &&
              value &&
              field.options &&
              !field.options.includes(text(value))
            )
              issue(
                `${c.key}.${i}.${field.key}`,
                "ENUM",
                "Choose a compatible declared option.",
                "Choisissez une option compatible.",
                "اختر خياراً متوافقاً.",
              );
            if (
              field.type === "number" &&
              value != null &&
              (typeof value !== "number" ||
                !Number.isFinite(value) ||
                (field.min != null && value < field.min) ||
                (field.max != null && value > field.max))
            )
              issue(
                `${c.key}.${i}.${field.key}`,
                "NUMBER",
                "Value is outside the allowed range.",
                "Valeur hors limites.",
                "القيمة خارج الحدود.",
              );
          }
        });
      }
    }
  }
  for (const u of array(d.units)) {
    if (
      ["pdf", "image", "video", "audio"].includes(text(u.kind)) &&
      !isId(u.assetId)
    )
      issue(
        "units." + text(u.id) + ".assetId",
        "ASSET",
        "Select a real media asset.",
        "Sélectionnez un média réel.",
        "اختر ملف وسائط حقيقياً.",
      );
    if (text(u.kind) === "article" && !text(u.text) && !isId(u.contentId))
      issue(
        "units." + text(u.id),
        "BODY",
        "Provide text or a content record.",
        "Ajoutez du texte ou un contenu.",
        "أضف نصاً أو سجلاً للمحتوى.",
      );
  }
  if (
    ["PDF Reader", "Chaptered PDF", "PDF Preview"].includes(text(d.mode)) &&
    !array(d.units).some((u) => u.kind === "pdf")
  )
    issue(
      "mode",
      "MODE_CONTENT",
      "This mode requires a PDF source.",
      "Ce mode requiert un PDF source.",
      "يتطلب هذا الوضع مصدر PDF.",
    );
  if (f?.key === "visual-cards")
    for (const c of array(d.cards))
      if (!text(c.front) && !isId(c.assetId))
        issue(
          "cards." + text(c.id),
          "CARD",
          "A card needs text or an image.",
          "Une carte requiert un texte ou une image.",
          "تحتاج البطاقة إلى نص أو صورة.",
        );
  if (f?.key === "presentations")
    for (const frame of array(d.frames))
      if (!text(frame.text) && !isId(frame.assetId))
        issue(
          "frames." + text(frame.id),
          "FRAME",
          "A frame needs real content.",
          "Une frame requiert du contenu réel.",
          "يتطلب الإطار محتوى حقيقياً.",
        );
  for (const q of array(d.questions)) {
    const choices = text(q.choices)
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean),
      type = text(q.type) || "choice",
      answers = (text(q.correctKeys) || text(q.answer))
        .split(",")
        .map((x) => x.trim());
    if (
      ["choice", "multi"].includes(type) &&
      (choices.length < 2 ||
        (!text(q.correctKeys) &&
          answers.some((x) => !/^\d+$/.test(x) || Number(x) >= choices.length)))
    )
      issue(
        "questions." + text(q.id) + ".answer",
        "ANSWER",
        "Answer indexes must match real choices.",
        "Les indices doivent correspondre aux choix.",
        "يجب أن تتوافق الإجابات مع الخيارات.",
      );
    if (type === "true_false" && !["true", "false"].includes(text(q.answer)))
      issue(
        "questions." + text(q.id) + ".answer",
        "ANSWER",
        "Use true or false.",
        "Utilisez true ou false.",
        "استخدم true أو false.",
      );
    if (number(q.points, 1) <= 0)
      issue(
        "questions." + text(q.id) + ".points",
        "POINTS",
        "Points must be positive.",
        "Les points doivent être positifs.",
        "يجب أن تكون النقاط موجبة.",
      );
    if (!text(q.answer) && !text(q.correctKeys) && !text(q.acceptedAnswers))
      issue(
        "questions." + text(q.id) + ".answer",
        "ANSWER",
        "A scoring answer is required.",
        "Réponse de notation requise.",
        "إجابة التقييم مطلوبة.",
      );
  }
  if (f?.key === "forms") {
    if (
      array(d.fields).some((x) => x.type === "file") &&
      !isId(d.privateReceiverId)
    )
      issue(
        "fields",
        "PRIVATE_RECEIVER",
        "Private attachments need a protected receiver before release.",
        "Réception privée requise pour les pièces.",
        "تحتاج المرفقات الخاصة استقبالاً محمياً.",
      );
    if (!text(d.consentLabel))
      issue(
        "consentLabel",
        "CONSENT",
        "Define the required consent statement.",
        "Définissez le consentement.",
        "حدّد نص الموافقة.",
      );
    if (!["dce", "hotline", "academy", "b2b"].includes(text(d.destination)))
      issue(
        "destination",
        "DESTINATION",
        "A receiving destination is required.",
        "Destination de réception requise.",
        "وجهة الاستقبال مطلوبة.",
      );
  }
  if (
    f?.key === "tools" &&
    !["sum", "average", "ratio", "groups", "duration"].includes(
      text(d.operation),
    )
  )
    issue(
      "operation",
      "ENGINE",
      "Select an approved calculation.",
      "Choisissez un calcul approuvé.",
      "اختر حساباً معتمداً.",
    );
  if (
    f?.key === "activities" &&
    !["matching", "memory", "sequence", "sorting", "choice", "bridge"].includes(
      text(d.engine),
    )
  )
    issue(
      "engine",
      "ENGINE",
      "Select an approved activity engine.",
      "Choisissez un moteur approuvé.",
      "اختر محرك نشاط معتمداً.",
    );
  if (["experience", "bundle"].includes(record.kind))
    for (const error of graphErrors(
      array(d.steps).length ? array(d.steps) : array(d.units),
    ))
      issue(
        "steps",
        error.code,
        error.message,
        "Parcours invalide : " + error.message,
        "مسار غير صالح: " + error.message,
      );
  for (const node of [...array(d.units), ...array(d.steps)])
    if (node.condition && node.condition !== "always") {
      if (
        ![
          "completed",
          "answer_equals",
          "value_at_least",
          "score_at_least",
          "score_below",
          "passed",
          "failed",
        ].includes(text(node.condition)) ||
        !text(node.conditionTarget)
      )
        issue(
          "journey",
          "CONDITION",
          "A declared condition and target are required.",
          "Condition déclarée et cible requises.",
          "شرط معلن وهدف مطلوبان.",
        );
    }
  if (record.kind === "bundle")
    for (const step of array(d.steps))
      if (!isId(step.experienceId) || step.experienceId === record.id)
        issue(
          "steps." + text(step.id),
          "MEMBER",
          "Select another real experience.",
          "Sélectionnez une autre expérience.",
          "اختر تجربة أخرى حقيقية.",
        );
  if (record.kind === "asset" && !isId(d.nativeAssetId))
    issue(
      "nativeAssetId",
      "ASSET",
      "Bind a native media record.",
      "Liez un média natif.",
      "اربط ملف وسائط أصلياً.",
    );
  if (record.kind === "offer_link" && !isId(d.nativeId))
    issue(
      "nativeId",
      "OFFER",
      "Bind a canonical native offer.",
      "Liez une offre native canonique.",
      "اربط عرضاً أصلياً.",
    );
  if (record.kind === "ad_policy") {
    const format = formatById(text(d.formatId));
    if (!format)
      issue(
        "formatId",
        "FORMAT",
        "Unknown ad classification.",
        "Classification publicitaire inconnue.",
        "تصنيف إعلان غير معروف.",
      );
    if (format && !format.zones.includes(text(d.zone)))
      issue(
        "zone",
        "ZONE",
        "Choose a compatible zone.",
        "Choisissez une zone compatible.",
        "اختر موضعاً متوافقاً.",
      );
    if (
      d.enabled === true &&
      format?.family === "manual" &&
      !/^\d{1,30}$/.test(text(d.unitId))
    )
      issue(
        "unitId",
        "UNIT",
        "A real Google unit ID is required.",
        "ID Google réel requis.",
        "معرّف وحدة Google حقيقي مطلوب.",
      );
    if (
      !["world", "family", "topic", "template", "experience", "zone"].includes(
        text(d.scope),
      )
    )
      issue(
        "scope",
        "SCOPE",
        "Unknown rule scope.",
        "Périmètre inconnu.",
        "نطاق غير معروف.",
      );
    if (d.scope !== "world" && !text(d.targetId))
      issue(
        "targetId",
        "TARGET",
        "Choose the rule target.",
        "Choisissez la cible.",
        "اختر هدف القاعدة.",
      );
  }
  if (
    record.kind === "content" &&
    !text(d.body) &&
    !localized(d, "body", (d.defaultLocale as Locale) || "fr") &&
    !array(d.sections).length
  )
    issue(
      "body",
      "BODY",
      "Content body is empty.",
      "Le corps est vide.",
      "المحتوى فارغ.",
    );
  if (
    record.kind === "access_policy" &&
    !["free", "account", "native_entitlement", "rewarded"].includes(text(d.use))
  )
    issue(
      "use",
      "ACCESS",
      "Unknown access policy.",
      "Politique d’accès inconnue.",
      "سياسة وصول غير معروفة.",
    );
  if (
    d.visibility === "rewarded" &&
    (!text(d.rewardPolicyId) || !isId(d.accessPolicyId))
  )
    issue(
      "visibility",
      "REWARD",
      "Rewarded access requires a reviewed policy and recognized issuer.",
      "Accès récompensé : politique et émetteur requis.",
      "يتطلب الوصول بمكافأة سياسة ومصدراً معتمدين.",
    );
  if (f)
    for (const c of f.collections)
      for (const [i, row] of array(d[c.key]).entries())
        for (const l of required) {
          if (l === d.defaultLocale) continue;
          for (const field of c.fields.filter(
            (x) => x.required && ["title", "label", "prompt"].includes(x.key),
          ))
            if (!text(object(object(row.locales)[String(l)])[field.key]))
              issue(
                `${c.key}.${i}.locales.${l}.${field.key}`,
                "UNIT_TRANSLATION",
                "Required unit translation missing.",
                "Traduction d’unité requise absente.",
                "ترجمة الوحدة المطلوبة مفقودة.",
              );
        }
  if (record.kind === "setting") errors.push(...worldIssues(d));
  errors.push(...capabilityIssues(record, f));
  for (const message of htmlActivityIssues(d))
    issue("htmlActivity", "HTML_ACTIVITY", message, message, message);
  if (
    object(d.htmlActivity).enabled === true &&
    (record.family !== "activities" || d.engine !== "choice")
  )
    issue(
      "htmlActivity",
      "HTML_ENGINE",
      "Use controlled HTML with choice activities.",
      "Utilisez le HTML contrôlé avec les activités à choix.",
      "استخدم HTML المضبوط مع أنشطة الاختيار.",
    );
  if (LOCALES.some((l) => !text(object(object(d.locales)[l]).title)))
    issue(
      "locales",
      "TRANSLATIONS",
      "Some language content is unavailable.",
      "Certaines traductions sont absentes.",
      "بعض الترجمات غير متاحة.",
      true,
    );
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    checkedAt: now.toISOString(),
    revision: record.revision,
    capabilities: f ? [...f.actions] : [],
  };
}
function prerequisites(row: Data): string[] {
  return Array.isArray(row.prerequisites)
    ? row.prerequisites.map(String)
    : text(row.prerequisites)
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
}
export function graphErrors(
  nodes: Data[],
): { code: string; message: string }[] {
  const result: { code: string; message: string }[] = [],
    ids = new Set(nodes.map((n) => text(n.id))),
    seen = new Set<string>(),
    active = new Set<string>(),
    by = new Map(nodes.map((n) => [text(n.id), n]));
  function visit(id: string) {
    if (active.has(id)) {
      result.push({ code: "CYCLE", message: "Prerequisite cycle at " + id });
      return;
    }
    if (seen.has(id)) return;
    active.add(id);
    for (const dep of prerequisites(by.get(id) || {})) {
      if (!ids.has(dep))
        result.push({
          code: "MISSING",
          message: "Missing prerequisite " + dep,
        });
      else visit(dep);
    }
    active.delete(id);
    seen.add(id);
  }
  for (const id of ids) visit(id);
  return result;
}
export function references(data: Data): {
  records: string[];
  media: string[];
  offers: string[];
} {
  const records = new Set<string>(),
    media = new Set<string>(),
    offers = new Set<string>();
  const scan = (v: Json, key = "") => {
    if (typeof v === "string" && isId(v)) {
      if (
        [
          "assetId",
          "nativeAssetId",
          "narrationAssetId",
          "captionAssetId",
          "backAssetId",
          "coverAssetId",
          "posterAssetId",
        ].includes(key)
      )
        media.add(v);
      else if (key === "nativeId") offers.add(v);
      else if (
        [
          "experienceId",
          "assessmentId",
          "contentId",
          "templateId",
          "accessPolicyId",
          "parentId",
          "adPolicyId",
          "rewardPolicyId",
          "dependencies",
        ].includes(key)
      )
        records.add(v);
    } else if (Array.isArray(v))
      v.filter((x) => key !== "outputs" || object(x).enabled !== false).forEach(
        (x) => scan(x, key),
      );
    else if (v && typeof v === "object")
      Object.entries(v).forEach(([k, x]) => scan(x, k));
  };
  scan(data);
  return { records: [...records], media: [...media], offers: [...offers] };
}
export function publicManifest(record: DceRecord, bindings: Data): Data {
  const definition = compatibleDefinition(record.family, record.data).data;
  const family = familyByKey(
    record.family || (record.kind === "bundle" ? "bundles" : ""),
  );
  const kindFields: Partial<Record<Kind, string[]>> = {
    ad_policy: [
      "enabled",
      "scope",
      "targetId",
      "formatId",
      "zone",
      "unitId",
      "audiences",
      "allowedLocales",
      "devices",
      "regions",
      "consentRequired",
      "minimumSpacing",
      "maximumCount",
      "frequencyMinutes",
      "childTreatment",
      "priority",
    ],
    access_policy: [
      "scope",
      "targetId",
      "use",
      "download",
      "print",
      "contribute",
      "audiences",
      "expiresAt",
      "nativeId",
      "rewardPolicyId",
    ],
  };
  const allowed = new Set([
    "definitionVersion",
    "templateId",
    "layoutOverride",
    "locales",
    "defaultLocale",
    "requiredLocales",
    "ageMin",
    "ageMax",
    "visibility",
    "mode",
    "actions",
    "layout",
    "coverAssetId",
    "accessPolicyId",
    "adPolicyId",
    "completion",
    "allowRestart",
    "downloadAllowed",
    "printAllowed",
    "body",
    "sections",
    "formattedText",
    "source",
    "rights",
    "accessibleText",
    "steps",
    "outputs",
    "certificatePolicy",
    "htmlActivity",
    ...(kindFields[record.kind] || []),
    ...(family?.fields
      .filter((f) => f.classification !== "private")
      .map((f) => f.key) || []),
    ...(family?.collections.map((c) => c.key) || []),
  ]);
  const clone = JSON.parse(
    JSON.stringify(
      Object.fromEntries(
        Object.entries(definition).filter(([k]) => allowed.has(k)),
      ),
    ),
  ) as Data;
  const removePrivate = (v: Json): Json => {
    if (Array.isArray(v)) return v.map(removePrivate);
    if (v && typeof v === "object")
      return Object.fromEntries(
        Object.entries(v)
          .filter(
            ([k]) =>
              ![
                "internalNotes",
                "reviewHistory",
                "answer",
                "explanation",
                "answerKeys",
                "correctKeys",
                "acceptedAnswers",
                "providerSecrets",
                "secret",
                "password",
                "token",
                "customerId",
                "visitorId",
                "privateReceiverId",
                "responsibleStaffId",
                "notes",
              ].includes(k),
          )
          .map(([k, x]) => [k, removePrivate(x)]),
      );
    return v;
  };
  const safeLocalized = (value: Json, keys: string[]) =>
    Object.fromEntries(
      LOCALES.filter((l) => Object.hasOwn(object(value), l)).map((l) => [
        l,
        Object.fromEntries(
          Object.entries(object(object(value)[l])).filter(([k]) =>
            keys.includes(k),
          ),
        ),
      ]),
    );
  if (clone.formattedText)
    clone.formattedText = Object.fromEntries(
      LOCALES.map((l) => [
        l,
        Object.fromEntries(
          ["body", "summary", "instructions"].map((k) => [
            k,
            array(object(object(clone.formattedText)[l])[k]).map((span) => ({
              text: typeof span.text === "string" ? span.text : "",
              bold: span.bold === true,
              italic: span.italic === true,
              underline: span.underline === true,
            })),
          ]),
        ),
      ]),
    );
  clone.locales = safeLocalized(clone.locales || {}, [
    "title",
    "summary",
    "instructions",
    "body",
    "source",
    "accessibleText",
    "transcript",
    "consentLabel",
    "methodology",
    "outputUnit",
    "narrationAssetId",
    ...(family?.fields.filter((f) => f.localized).map((f) => f.key) || []),
  ]);
  if (clone.layout) clone.layout = projectLayout(clone.layout);
  if (Array.isArray(clone.sections))
    clone.sections = array(clone.sections).map((section) => {
      const clean = Object.fromEntries(
        Object.entries(section).filter(([k]) =>
          [
            "id",
            "title",
            "type",
            "text",
            "assetId",
            "contentId",
            "href",
            "alt",
            "source",
            "locales",
          ].includes(k),
        ),
      );
      if (clean.locales)
        clean.locales = safeLocalized(clean.locales, [
          "title",
          "text",
          "alt",
          "source",
        ]);
      return clean;
    });
  if (family)
    for (const c of family.collections) {
      const keys = [
        "id",
        "publicNoteText",
        ...c.fields
          .filter((f) => f.classification !== "private")
          .map((f) => f.key),
        "locales",
      ];
      clone[c.key] = array(clone[c.key]).map((row) => {
        const projected = {
          ...row,
          ...(c.key === "frames" && row.publicNotes === true
            ? { publicNoteText: row.notes || "" }
            : {}),
        };
        const clean = Object.fromEntries(
          Object.entries(projected).filter(([k]) => keys.includes(k)),
        ) as Data;
        if (clean.locales)
          clean.locales = safeLocalized(
            clean.locales,
            c.fields
              .filter((f) => f.classification !== "private")
              .map((f) => f.key),
          );
        return clean;
      });
    }
  for (const key of [
    "internalNotes",
    "reviewHistory",
    "answerKeys",
    "correctKeys",
    "acceptedAnswers",
    "providerSecrets",
    "secret",
    "password",
    "token",
  ])
    delete clone[key];
  if (Array.isArray(clone.questions))
    clone.questions = array(clone.questions).map((q) => {
      const next = { ...q };
      delete next.answer;
      delete next.explanation;
      return next;
    });
  if (Array.isArray(clone.frames))
    clone.frames = array(clone.frames).map((f) => {
      const next = { ...f };
      if (next.publicNotes && next.publicNoteText === undefined)
        next.publicNoteText = next.notes || "";
      delete next.notes;
      return next;
    });
  if (clone.htmlActivity) {
    const p = object(clone.htmlActivity);
    clone.htmlActivity = {
      enabled: p.enabled === true,
      version: 1,
      markup: restrictedMarkup(text(p.markup)),
    };
  }
  if (["forms", "community"].includes(record.family || "")) {
    for (const key of [
      "destination",
      "responsibleTeam",
      "responsibleStaffId",
      "privateReceiverId",
      "consentLabel",
      "attachmentTypes",
      "attachmentMaxMb",
      "statusWorkflow",
    ])
      delete clone[key];
    if (Array.isArray(clone.actions))
      clone.actions = clone.actions.filter(
        (a) =>
          ![
            "upload",
            "submit",
            "confirm",
            "track_status",
            "comment",
            "review",
            "rate",
            "like",
            "report",
          ].includes(String(a)),
      );
  }
  return {
    contract: CONTRACT,
    id: record.id,
    key: record.key,
    family: family?.key || record.family,
    audience: record.audience,
    revision: record.revision,
    definition: removePrivate(clone),
    bindings,
    publicRuntimeReady: false,
  };
}
export interface PolicyContext {
  family: string;
  topic: string;
  templateId: string;
  experienceId: string;
  zone: string;
  audience: string;
  locale: Locale;
  device: string;
  consent: "granted" | "limited" | "unknown" | "denied";
  programs: string[];
  monetizationEnabled: boolean;
  region?: string;
  impressionCount?: number;
  lastImpressionAt?: number;
  previousSpacing?: number;
  releaseId?: string;
  journeyId?: string;
}
export function effectiveAdPolicy(policies: DceRecord[], ctx: PolicyContext) {
  if (
    [
      "assessment",
      "submission",
      "consent",
      "checkout",
      "private_upload",
      "private_result",
    ].includes(ctx.zone)
  )
    return { eligible: false, reason: "PROTECTED_AREA", rule: null };
  if (!ctx.monetizationEnabled)
    return { eligible: false, reason: "WORLD_DISABLED", rule: null };
  if (ctx.consent === "denied")
    return { eligible: false, reason: "CONSENT_DENIED", rule: null };
  const target: Record<string, string> = {
    world: "",
    family: ctx.family,
    topic: ctx.topic,
    template: ctx.templateId,
    experience: ctx.experienceId,
    edition: ctx.experienceId + ":" + ctx.locale,
    release: ctx.releaseId || "",
    journey: ctx.journeyId || "",
    zone: ctx.zone,
  };
  const rank = [
    "world",
    "family",
    "topic",
    "template",
    "experience",
    "edition",
    "release",
    "journey",
    "zone",
  ];
  const matches = policies
    .filter(
      (r) =>
        r.kind === "ad_policy" &&
        r.lifecycle !== "archived" &&
        Object.hasOwn(target, text(r.data.scope)) &&
        (r.data.scope === "world" ||
          text(r.data.targetId) === target[text(r.data.scope)]),
    )
    .sort(
      (a, b) =>
        rank.indexOf(text(a.data.scope)) - rank.indexOf(text(b.data.scope)) ||
        number(a.data.priority) - number(b.data.priority) ||
        a.id.localeCompare(b.id),
    );
  const exclusion = matches.find((r) => r.data.enabled === false);
  if (exclusion)
    return {
      eligible: false,
      reason:
        exclusion.data.scope === "world"
          ? "WORLD_EXCLUSION"
          : "INHERITED_EXCLUSION",
      rule: exclusion,
    };
  for (const parent of matches) {
    if (
      Array.isArray(parent.data.regions) &&
      parent.data.regions.length &&
      !parent.data.regions.includes(ctx.region || "unknown")
    )
      return {
        eligible: false,
        reason: "INHERITED_REGION_EXCLUSION",
        rule: parent,
      };
    if (number(ctx.impressionCount) >= number(parent.data.maximumCount, 2))
      return { eligible: false, reason: "INHERITED_COUNT_CAP", rule: parent };
    for (const [key, value] of [
      ["audiences", ctx.audience],
      ["allowedLocales", ctx.locale],
      ["devices", ctx.device],
    ])
      if (Array.isArray(parent.data[key]) && !parent.data[key].includes(value))
        return {
          eligible: false,
          reason: "INHERITED_CONTEXT_EXCLUSION",
          rule: parent,
        };
    if (
      parent.data.consentRequired === true &&
      !["granted", "limited"].includes(ctx.consent)
    )
      return { eligible: false, reason: "CONSENT_UNRESOLVED", rule: parent };
    if (ctx.audience === "child" && parent.data.childTreatment !== true)
      return {
        eligible: false,
        reason: "CHILD_TREATMENT_REQUIRED",
        rule: parent,
      };
  }
  const rule = matches.at(-1) || null;
  if (!rule || rule.data.enabled !== true)
    return { eligible: false, reason: "NO_ENABLED_RULE", rule };
  const d = rule.data;
  if (
    Array.isArray(d.regions) &&
    d.regions.length &&
    !d.regions.includes(ctx.region || "unknown")
  )
    return { eligible: false, reason: "REGION_EXCLUDED", rule };
  if (number(ctx.impressionCount) >= number(d.maximumCount, 2))
    return { eligible: false, reason: "COUNT_CAP", rule };
  if (
    ctx.lastImpressionAt &&
    Date.now() - ctx.lastImpressionAt < number(d.frequencyMinutes, 30) * 60000
  )
    return { eligible: false, reason: "FREQUENCY_CAP", rule };
  if (
    ctx.previousSpacing != null &&
    ctx.previousSpacing < number(d.minimumSpacing, 600)
  )
    return { eligible: false, reason: "SPACING_CAP", rule };
  const format = formatById(text(d.formatId));
  if (!format) return { eligible: false, reason: "UNKNOWN_FORMAT", rule };
  for (const [key, value] of [
    ["audiences", ctx.audience],
    ["allowedLocales", ctx.locale],
    ["devices", ctx.device],
  ])
    if (Array.isArray(d[key]) && !d[key].includes(value))
      return { eligible: false, reason: "CONTEXT_EXCLUDED", rule };
  if (
    ctx.audience === "child" &&
    ["rewarded", "search", "game", "video"].includes(format.family)
  )
    return { eligible: false, reason: "CHILD_SPECIALIST_PROGRAM_REVIEW", rule };
  if (ctx.audience === "child" && d.childTreatment !== true)
    return { eligible: false, reason: "CHILD_TREATMENT_REQUIRED", rule };
  if (
    d.consentRequired === true &&
    !["granted", "limited"].includes(ctx.consent)
  )
    return { eligible: false, reason: "CONSENT_UNRESOLVED", rule };
  if (!ctx.programs.includes(format.requires))
    return { eligible: false, reason: "PROVIDER_NOT_READY", rule };
  if (!format.zones.includes(ctx.zone))
    return { eligible: false, reason: "ZONE_INCOMPATIBLE", rule };
  return {
    eligible: true,
    reason: "ELIGIBLE",
    rule,
    format,
    ageTreatment: ctx.audience === "child" ? 1 : 0,
  };
}
export function calculate(data: Data, values: Record<string, number>) {
  const inputs = array(data.inputs),
    numbers = inputs.map((i) => {
      const v = values[text(i.id)];
      if (
        (i.type === "integer" && !Number.isInteger(v)) ||
        !Number.isFinite(v) ||
        v < number(i.min, -1e9) ||
        v > number(i.max, 1e9)
      )
        throw Error("Input outside its declared range: " + text(i.id));
      return v;
    });
  if (!numbers.length) throw Error("Inputs are required.");
  const sum = numbers.reduce((a, b) => a + b, 0);
  let value: number;
  const model = text(data.model) || "custom_arithmetic";
  if (number(data.modelVersion, 1) !== 1)
    throw Error("Unsupported calculation model version.");
  if (model === "unit_conversion" || model === "recipe_scaling")
    value = numbers[0] * number(data.factor, 1);
  else if (model === "shape_area") {
    if (numbers.length < 2)
      throw Error("Width and height inputs are required.");
    value = numbers[0] * numbers[1];
  } else if (model === "classroom_groups") {
    if (numbers.length < 2 || numbers[1] <= 0)
      throw Error("Learner count and positive group size required.");
    value = Math.ceil(numbers[0] / numbers[1]);
  } else if (model === "reading_duration") {
    if (numbers.length < 2 || numbers[1] <= 0)
      throw Error("Word count and positive words-per-minute required.");
    value = numbers[0] / numbers[1];
  } else if (model === "eco_comparison") {
    if (numbers.length < 2) throw Error("Two comparable quantities required.");
    value = numbers[0] - numbers[1];
  } else
    switch (text(data.operation)) {
      case "sum":
      case "duration":
        value = sum;
        break;
      case "average":
        value = sum / numbers.length;
        break;
      case "ratio":
        if (numbers.length < 2 || numbers[1] === 0)
          throw Error("A non-zero denominator is required.");
        value = numbers[0] / numbers[1];
        break;
      case "groups":
        if (numbers.length < 2 || numbers[1] <= 0)
          throw Error("A positive group size is required.");
        value = Math.ceil(numbers[0] / numbers[1]);
        break;
      default:
        throw Error("Unsupported calculation.");
    }
  if (!Number.isFinite(value)) throw Error("Calculation is not finite.");
  value = Number(value.toFixed(number(data.precision, 2)));
  return {
    value,
    model,
    assumptions: text(data.assumptions),
    unit: text(data.outputUnit),
    modelVersion: 1,
    operation: text(data.operation),
    methodology: text(data.methodology),
  };
}
export function scoreQuestions(
  questions: Data[],
  answers: Record<string, string>,
) {
  return gradeQuestions(questions, answers);
}
