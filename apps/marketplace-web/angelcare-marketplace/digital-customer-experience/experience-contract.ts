import { applyEditionOrder } from "./experience-depth";
import { FAMILIES } from "./registry";
import { translationCoverage } from "./localisation";
import {
  array,
  object,
  text,
  LOCALES,
  type Data,
  type DceRecord,
  type Locale,
  type Tri,
} from "./types";
export const AUTONOMOUS_CONTRACT = "ANGELCARE_DCE_AUTONOMOUS_R5";
export const EDITION_KINDS = ["experience", "template", "content", "bundle"];
export const OUTCOMES: Record<string, { primary: string; description: Tri }> = {
  documents: {
    primary: "read",
    description: ["Read and resume.", "Lire et reprendre.", "اقرأ وتابع."],
  },
  printables: {
    primary: "download",
    description: [
      "Inspect and obtain real PDF/PNG files.",
      "Examiner et obtenir les vrais fichiers PDF/PNG.",
      "عاين واحصل على ملفات PDF/PNG الفعلية.",
    ],
  },
  stories: {
    primary: "read",
    description: ["Read or listen.", "Lire ou écouter.", "اقرأ أو استمع."],
  },
  learning: {
    primary: "start",
    description: [
      "Learn and view results; certificates are optional.",
      "Apprendre et voir les résultats ; certificat facultatif.",
      "تعلم واعرض النتيجة؛ الشهادة اختيارية.",
    ],
  },
  video: {
    primary: "play",
    description: ["Watch and resume.", "Regarder et reprendre.", "شاهد وتابع."],
  },
  audio: {
    primary: "play",
    description: [
      "Listen and resume.",
      "Écouter et reprendre.",
      "استمع وتابع.",
    ],
  },
  "visual-cards": {
    primary: "study",
    description: [
      "Explore cards and obtain available sets.",
      "Explorer les cartes et obtenir les jeux disponibles.",
      "استكشف البطاقات واحصل على المجموعات المتاحة.",
    ],
  },
  presentations: {
    primary: "explore",
    description: [
      "Explore the frames.",
      "Explorer les diapositives.",
      "استكشف الشرائح.",
    ],
  },
  assessments: {
    primary: "score",
    description: [
      "Get my result without an admin submission.",
      "Voir mon résultat sans envoi à un opérateur.",
      "عرض نتيجتي دون إرسال للإدارة.",
    ],
  },
  activities: {
    primary: "play",
    description: [
      "Play, complete and try again.",
      "Jouer, terminer et réessayer.",
      "العب وأكمل وحاول مجدداً.",
    ],
  },
  tools: {
    primary: "generate",
    description: [
      "Generate a private result.",
      "Générer un résultat privé.",
      "أنشئ نتيجة خاصة.",
    ],
  },
  planners: {
    primary: "generate",
    description: [
      "Personalise your copy and export.",
      "Personnaliser sa copie et exporter.",
      "خصص نسختك وصدّرها.",
    ],
  },
  forms: {
    primary: "result",
    description: [
      "Private questionnaire; no administrative submission.",
      "Questionnaire privé ; aucun envoi administratif.",
      "استبيان خاص دون إرسال إداري.",
    ],
  },
  community: {
    primary: "read",
    description: [
      "Read-only; historical records retained.",
      "Lecture seule ; historique conservé.",
      "للقراءة فقط؛ السجل محفوظ.",
    ],
  },
  commerce: {
    primary: "read",
    description: [
      "Use a free resource; native offers remain optional.",
      "Utiliser une ressource gratuite ; offres natives facultatives.",
      "استخدم مورداً مجانياً؛ العروض الأصلية اختيارية.",
    ],
  },
  bundles: {
    primary: "start",
    description: [
      "Follow real resources with independent progress.",
      "Parcourir des ressources réelles avec progression indépendante.",
      "تابع موارد حقيقية مع تقدم مستقل.",
    ],
  },
};
export function stable(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(stable).join(",") + "]";
  if (value && typeof value === "object")
    return (
      "{" +
      Object.entries(value)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => JSON.stringify(k) + ":" + stable(v))
        .join(",") +
      "}"
    );
  return JSON.stringify(value) ?? "null";
}
export function editionProjection(r: DceRecord, locale: Locale): DceRecord {
  if (!LOCALES.includes(locale)) throw Error("Choose AR, FR or EN.");
  const source = object(r.data),
    base = text(source.defaultLocale) || "en",
    f = FAMILIES.find(
      (f) => f.key === (r.family || (r.kind === "bundle" ? "bundles" : "")),
    );
  const project = (v: any): any =>
    Array.isArray(v)
      ? v.map(project)
      : v && typeof v === "object"
        ? Object.fromEntries(
            Object.entries(v).map(([k, x]) => [
              k,
              ["locales", "formattedText"].includes(k) && !Array.isArray(x)
                ? { [locale]: project(object(x)[locale] || {}) }
                : project(x),
            ]),
          )
        : v;
  const data = project(source) as Data,
    apply = (dst: Data, src: Data, keys: string[]) => {
      const local = object(object(src.locales)[locale]);
      for (const k of keys) {
        if (Object.hasOwn(local, k)) dst[k] = local[k];
        else if (locale !== base) delete dst[k];
      }
    };
  apply(data, source, [
    ...new Set([
      "summary",
      "instructions",
      "body",
      ...(f?.fields.filter((x) => x.localized).map((x) => x.key) || []),
    ]),
  ]);
  for (const c of f?.collections || [])
    array(data[c.key]).forEach((u, i) =>
      apply(
        u,
        array(source[c.key])[i] || {},
        c.fields.filter((x) => x.localized).map((x) => x.key),
      ),
    );
  const mediaKeys = [
    "assetId",
    "coverAssetId",
    "posterAssetId",
    "backAssetId",
    "narrationAssetId",
    "captionAssetId",
    "pageCount",
    "duration",
  ];
  const mediaOverride = (dst: Data, src: Data) => {
    const local = object(object(src.locales)[locale]);
    for (const k of mediaKeys) if (Object.hasOwn(local, k)) dst[k] = local[k];
  };
  mediaOverride(data, source);
  for (const c of f?.collections || [])
    array(data[c.key]).forEach((u, i) => {
      mediaOverride(u, array(source[c.key])[i] || {});
      if (c.key === "outputs") {
        const local = object(object(array(source[c.key])[i]?.locales)[locale]);
        if (Object.hasOwn(local, "enabled")) u.enabled = local.enabled;
      }
    });
  data.outputs = array(data.outputs).filter((o) => o.enabled !== false);
  const certificate = certificatePolicy(data);
  if (
    certificate.enabled &&
    !(certificate.locales as string[]).includes(locale)
  )
    data.certificatePolicy = { enabled: false };
  else if (certificate.enabled)
    data.certificatePolicy = { ...certificate, locales: [locale] };
  data.enabledLocales = [locale];
  if (object(source.htmlActivity).enabled === true) {
    const p = object(source.htmlActivity);
    data.htmlActivity = {
      ...object(data.htmlActivity),
      markup:
        text(object(object(p.locales)[locale]).markup) ||
        (locale === base ? text(p.markup) : ""),
    };
  }
  data.defaultLocale = locale;
  data.requiredLocales = [locale];
  data.translationFallback = false;
  return {
    ...r,
    title:
      text(object(object(source.locales)[locale]).title) ||
      (locale === base ? r.title : ""),
    data: applyEditionOrder(data, locale),
  };
}
export function editionDefinition(r: DceRecord, l: Locale): Data {
  const p = editionProjection(r, l);
  return {
    kind: p.kind,
    family: p.family,
    topic: p.topic,
    audience: p.audience,
    title: p.title,
    data: p.data,
  };
}
export function editionReadiness(r: DceRecord, l: Locale) {
  return {
    locale: l,
    present:
      l === (text(r.data.defaultLocale) || "en") ||
      !!text(object(object(r.data.locales)[l]).title),
    coverage: translationCoverage(r, l),
  };
}
export function certificatePolicy(data: Data): Data {
  const p = object(data.certificatePolicy);
  return {
    enabled: p.enabled === true,
    locales: Array.isArray(p.locales)
      ? p.locales.filter((l) => LOCALES.includes(l as Locale))
      : [...LOCALES],
    requiresCompletion: p.requiresCompletion !== false,
    evidence:
      p.evidence === "server_assessment"
        ? "server_assessment"
        : "manual_review",
    assessmentId: text(p.assessmentId),
    minimumScore: Math.max(0, Math.min(100, Number(p.minimumScore) || 0)),
    issuer: text(p.issuer) || "AngelCare",
    followUpDays: Math.max(
      1,
      Math.min(365, Math.floor(Number(p.followUpDays) || 3)),
    ),
  };
}
export type Output = Data & { ready: boolean; issues: string[]; asset: Data };
export function outputReadiness(data: Data, bindings: Data): Output[] {
  const seen = new Set();
  return array(data.outputs).map((o) => {
    const asset = object(object(bindings.media)[text(o.assetId)]),
      issues: string[] = [];
    if (!text(o.id) || seen.has(o.id))
      issues.push("A unique output identity is required.");
    seen.add(o.id);
    if (!text(o.label)) issues.push("Name this output.");
    if (!["application/pdf", "image/png"].includes(text(o.mime)))
      issues.push("Choose PDF or PNG.");
    if (!text(o.assetId) || !/^(https:\/\/|\/(?!\/))/.test(text(asset.url)))
      issues.push("Select a ready native delivery file.");
    if (asset.mime !== o.mime) issues.push("The native MIME type must match.");
    if (o.scope && !["whole", "page", "set"].includes(text(o.scope)))
      issues.push("Choose whole, page or set.");
    return { ...o, asset, issues, ready: !issues.length };
  });
}
export function outcomePlan(r: Partial<DceRecord>, bindings: Data = {}) {
  const data = object(r.data),
    family = r.family || (r.kind === "bundle" ? "bundles" : "documents"),
    entry = OUTCOMES[family] || OUTCOMES.documents,
    outputs = outputReadiness(data, bindings),
    available = outputs.filter(
      (o) => o.ready && o.enabled !== false && data.downloadAllowed === true,
    ),
    policy = certificatePolicy(data),
    certificate =
      family === "learning" &&
      policy.enabled === true &&
      (policy.locales as string[]).includes(text(data.defaultLocale) || "en");
  return {
    family,
    description: entry.description,
    primary:
      entry.primary === "download" && !available.length
        ? "read"
        : entry.primary,
    outputs,
    certificate: family === "learning" ? policy : { enabled: false },
    actions: [
      entry.primary === "download" && !available.length
        ? "read"
        : entry.primary,
      ...available.map((o) =>
        o.mime === "application/pdf" ? "download_pdf" : "download_png",
      ),
      ...(certificate ? ["certificate"] : []),
    ],
    ordinaryIntake: false,
    accountRequired: false,
  };
}
