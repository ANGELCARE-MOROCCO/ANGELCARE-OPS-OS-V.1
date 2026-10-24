import { ROOT_FIELDS } from "./dossier-fields";
import { FAMILIES, MODULES } from "./registry";
import { DEPTH_FIELDS, DEPTH_COLLECTIONS } from "./experience-depth";
import {
  array,
  object,
  text,
  type Data,
  type DceRecord,
  type Family,
  type Field,
  type Locale,
  type Tri,
  type Kind,
} from "./types";

export const PRODUCTION_CONTRACT = "KIDFLIX_PRODUCTION_STUDIO_R1";
export const SECTION_LABELS: Record<string, Tri> = {
  overview: [
    "Identity & discovery",
    "Identité et découverte",
    "الهوية والاكتشاف",
  ],
  content: [
    "Content & collections",
    "Contenu et collections",
    "المحتوى والمجموعات",
  ],
  media: ["Media & source files", "Médias et fichiers", "الوسائط والملفات"],
  experience: [
    "Experience & tools",
    "Expérience et outils",
    "التجربة والأدوات",
  ],
  design: ["Presentation", "Présentation", "العرض"],
  journey: [
    "Journey & prerequisites",
    "Parcours et prérequis",
    "المسار والمتطلبات",
  ],
  access: ["Access & policies", "Accès et politiques", "الوصول والسياسات"],
  delivery: ["Review & publication", "Revue et publication", "المراجعة والنشر"],
  validation: ["Validation", "Validation", "التحقق"],
  connections: ["Connected dossiers", "Dossiers connectés", "الملفات المرتبطة"],
  team: ["Team & collaboration", "Équipe et collaboration", "الفريق والتعاون"],
  history: [
    "Versions & recovery",
    "Versions et récupération",
    "النسخ والاستعادة",
  ],
};
export const GUIDED_STEPS = [
  "overview",
  "content",
  "media",
  "experience",
  "delivery",
];
export type CapabilityEntry = {
  id: string;
  path: string;
  label: Tri;
  section: string;
  group?: string;
  definition?: Field;
  status: "available" | "legacy";
  kind: "field" | "collection" | "mode" | "action";
};
const legacy = new Set([
  "destination",
  "consentLabel",
  "responsibleTeam",
  "attachmentMaxMb",
  "responsibleStaffId",
  "privateReceiverId",
  "attachmentTypes",
  "statusWorkflow",
  "moderation",
  "eligibility",
  "visibilityPolicy",
  "reportsEnabled",
  "reportReasons",
  "ratingsEnabled",
  "contributionsEnabled",
  "moderationRequired",
  "allowContributions",
  "allowRatings",
]);
export function retiredCapability(family: string, key: string) {
  return (
    (family === "forms" || family === "community") &&
    (legacy.has(key) ||
      /^(rating|contribution|submission|receiver|attachment)/i.test(key))
  );
}
export function experienceGroup(key: string) {
  if (
    [
      "detailSections",
      "sortRules",
      "sortGroups",
      "soundItems",
      "bridgeChallenges",
    ].includes(key)
  )
    return "detail";
  if (["resultBands", "recommendations", "resultsEnabled"].includes(key))
    return "results";
  if (key === "exportLayouts") return "exports";
  if (
    [
      "discoveryPlacements",
      "discoveryTitle",
      "seoDescription",
      "slug",
    ].includes(key)
  )
    return "discovery";
  if (key === "adBreaks") return "ads";
  if (["editionOrder", "storyChoices"].includes(key)) return "languages";
  if (key.startsWith("kidflix")) return "kidflix";
  if (
    [
      "continuityPolicy",
      "progressTtlDays",
      "releaseChangePolicy",
      "reducedMotion",
    ].includes(key)
  )
    return "continuity";
  return "brief";
}
export function capabilityIndex(family: Family): CapabilityEntry[] {
  const result: CapabilityEntry[] = [],
    seen = new Set<string>();
  const add = (entry: CapabilityEntry) => {
    if (!seen.has(entry.id)) {
      seen.add(entry.id);
      result.push(entry);
    }
  };
  const depthKeys = new Set(DEPTH_FIELDS.map((f) => f.key));
  const depthCollections = new Set(DEPTH_COLLECTIONS.map((c) => c.key));
  for (const [key, label] of [
    ["key", ["Stable key", "Clé stable", "المفتاح الثابت"]],
    ["title", ["Title", "Titre", "العنوان"]],
    ["summary", ["Summary", "Résumé", "الملخص"]],
    ["instructions", ["Instructions", "Consignes", "التعليمات"]],
    ["body", ["Main text", "Texte principal", "النص الرئيسي"]],
    ["audience", ["Audience", "Public", "الجمهور"]],
  ] as const)
    add({
      id: "identity:" + key,
      path: key,
      label,
      section: "overview",
      status: "available",
      kind: "field",
    });
  for (const [key, label] of [
    ["visibility", ["Visitor access", "Accès visiteur", "وصول الزائر"]],
    [
      "printAllowed",
      ["Print permission", "Autorisation d’impression", "إذن الطباعة"],
    ],
    ["accessPolicyId", ["Access policy", "Politique d’accès", "سياسة الوصول"]],
    [
      "adPolicyId",
      ["Advertising policy", "Politique publicitaire", "سياسة الإعلان"],
    ],
  ] as const)
    add({
      id: "policy:" + key,
      path: key,
      label,
      section: "access",
      status: "available",
      kind: "field",
    });
  add({
    id: "delivery:downloadAllowed",
    path: "downloadAllowed",
    label: [
      "Download permission",
      "Autorisation de téléchargement",
      "إذن التنزيل",
    ],
    section: "delivery",
    group: "actions",
    status: "available",
    kind: "field",
  });
  if (family.key === "learning")
    for (const key of [
      "enabled",
      "evidence",
      "minimumScore",
      "issuer",
      "followUpDays",
      "requiresCompletion",
      "assessmentId",
    ])
      add({
        id: "certificate:" + key,
        path: "certificatePolicy." + key,
        label: [
          "Certificate · " + key,
          "Certificat · " + key,
          "الشهادة · " + key,
        ],
        section: "delivery",
        group: "certificate",
        status: "available",
        kind: "field",
      });
  for (const field of [...family.fields, ...DEPTH_FIELDS]) {
    const section = depthKeys.has(field.key)
      ? "experience"
      : ["mode", "ageMin", "ageMax", "topic"].includes(field.key)
        ? "overview"
        : "content";
    add({
      id: "field:" + field.key,
      path: field.key,
      label: field.label,
      section,
      group: section === "experience" ? experienceGroup(field.key) : undefined,
      definition: field,
      status: retiredCapability(family.key, field.key) ? "legacy" : "available",
      kind: "field",
    });
  }
  for (const collection of [...family.collections, ...DEPTH_COLLECTIONS]) {
    const section =
      collection.key === "outputs"
        ? "delivery"
        : depthCollections.has(collection.key) ||
            [
              "detailSections",
              "sortRules",
              "sortGroups",
              "soundItems",
              "bridgeChallenges",
            ].includes(collection.key)
          ? "experience"
          : "content";
    const group =
      section === "delivery"
        ? "actions"
        : section === "experience"
          ? experienceGroup(collection.key)
          : undefined;
    add({
      id: "collection:" + collection.key,
      path: collection.key,
      label: collection.label,
      section,
      group,
      status: "available",
      kind: "collection",
    });
    for (const field of collection.fields)
      add({
        id: collection.key + "." + field.key,
        path: collection.key + ".*." + field.key,
        label: field.label,
        section,
        group,
        definition: field,
        status: retiredCapability(family.key, field.key)
          ? "legacy"
          : "available",
        kind: "field",
      });
  }
  for (const mode of family.modes)
    add({
      id: "mode:" + mode,
      path: "mode",
      label: [mode, mode, mode],
      section: "overview",
      status: "available",
      kind: "mode",
    });
  for (const action of family.actions)
    add({
      id: "action:" + action,
      path: "outputs",
      label: [action, action, action],
      section: "delivery",
      group: "actions",
      status: retiredCapability(family.key, action) ? "legacy" : "available",
      kind: "action",
    });
  return result;
}
export function dossierCapabilityIndex(
  record: Partial<DceRecord>,
): CapabilityEntry[] {
  const family = FAMILIES.find(
    (f) =>
      f.key === (record.family || (record.kind === "bundle" ? "bundles" : "")),
  );
  const entries = family
    ? capabilityIndex(family)
    : capabilityIndex(FAMILIES[0]).filter((e) => e.id.startsWith("identity:"));
  for (const field of ROOT_FIELDS[record.kind || "experience"] || [])
    entries.push({
      id: "root:" + field.key,
      path: field.key,
      label: field.label,
      section: "content",
      definition: field,
      status: "available",
      kind: "field",
    });
  return entries;
}
export function issueDestination(
  path: string,
  family?: Family,
  data: Data = {},
  kind?: Kind,
) {
  let clean = path.replace(/^data\./, ""),
    language = clean.match(/(?:^|\.)locales\.(en|fr|ar)\./)?.[1] as
      | Locale
      | undefined;
  clean = clean
    .replace(/(?:^|\.)locales\.(en|fr|ar)\./, ".")
    .replace(/^\./, "");
  const parts = clean.split("."),
    collection = [...(family?.collections || []), ...DEPTH_COLLECTIONS].find(
      (c) => c.key === parts[0],
    );
  if (collection && /^\d+$/.test(parts[1]))
    parts[1] = text(array(data[parts[0]])[Number(parts[1])]?.id) || parts[1];
  if (collection && parts[1] === "*")
    parts[1] = text(array(data[parts[0]])[0]?.id) || "*";
  clean = parts[1] === "*" ? parts[0] : parts.join(".");
  const indexed =
    family &&
    capabilityIndex(family).find(
      (e) => e.path === parts[0] || e.path === parts[0] + ".*." + parts.at(-1),
    );
  const section =
    clean.startsWith("outputs") ||
    clean.startsWith("certificatePolicy") ||
    clean === "downloadAllowed"
      ? "delivery"
      : ["visibility", "printAllowed", "accessPolicyId", "adPolicyId"].includes(
            clean,
          )
        ? "access"
        : clean.startsWith("layout")
          ? "design"
          : [
                "key",
                "title",
                "audience",
                "topic",
                "mode",
                "ageMin",
                "ageMax",
                "summary",
                "instructions",
                "body",
              ].includes(parts[0])
            ? "overview"
            : indexed?.section || "content";
  return {
    path: clean,
    language,
    section:
      kind &&
      !["experience", "template", "bundle"].includes(kind) &&
      ROOT_FIELDS[kind]?.some((f) => f.key === parts[0])
        ? "content"
        : section,
    group:
      section === "delivery"
        ? clean.startsWith("certificatePolicy")
          ? "certificate"
          : "actions"
        : indexed?.group,
  };
}
export function localizedCells(record: Partial<DceRecord>, family?: Family) {
  const data = object(record.data),
    definitions: Field[] = [
      ...["title", "summary", "instructions", "body"].map((key) => ({
        key,
        label: (
          {
            title: ["Title", "Titre", "العنوان"],
            summary: ["Summary", "Résumé", "الملخص"],
            instructions: ["Instructions", "Consignes", "التعليمات"],
            body: ["Main text", "Texte principal", "النص الرئيسي"],
          } as Record<string, Tri>
        )[key],
        type: "textarea" as const,
        localized: true,
      })),
      ...(family?.fields || []).filter((f) => f.localized),
      ...DEPTH_FIELDS.filter((f) => f.localized),
    ];
  const seen = new Set<string>();
  const values = (node: Data, key: string) =>
    Object.fromEntries(
      (["en", "fr", "ar"] as Locale[]).map((l) => [
        l,
        text(object(object(node.locales)[l])[key]) ||
          (l === (data.defaultLocale || "en") ? text(node[key]) : ""),
      ]),
    );
  const root = definitions
    .filter((f) => !seen.has(f.key) && Boolean(seen.add(f.key)))
    .map((def) => ({
      path: def.key,
      label: def.label,
      values: values(data, def.key),
    }));
  for (const collection of family?.collections || [])
    for (const row of array(data[collection.key])) {
      if (!text(row.id)) continue;
      for (const def of collection.fields.filter((f) => f.localized))
        root.push({
          path: collection.key + "." + text(row.id) + "." + def.key,
          label: collection.label.map(
            (label, i) =>
              label +
              " · " +
              (text(row.title) || text(row.id)) +
              " · " +
              def.label[i],
          ) as unknown as Tri,
          values: values(row, def.key),
        });
    }
  return root;
}
export function translatedPatch(
  data: Data,
  path: string,
  language: Locale,
  value: string,
): Data {
  const parts = path.split("."),
    patch = (node: Data, key: string): Data => ({
      locales: {
        ...object(node.locales),
        [language]: { ...object(object(node.locales)[language]), [key]: value },
      },
      ...(language === (data.defaultLocale || "en") ? { [key]: value } : {}),
    });
  if (parts.length === 1) return patch(data, path);
  if (parts.length !== 3) throw Error("Choose a stable translated field.");
  const rows = array(data[parts[0]]);
  if (!rows.some((r) => r.id === parts[1]))
    throw Error("This translated unit no longer exists.");
  return {
    [parts[0]]: rows.map((row) =>
      row.id === parts[1] ? { ...row, ...patch(row, parts[2]) } : row,
    ),
  };
}
export function productionRegister() {
  return {
    contract: PRODUCTION_CONTRACT,
    families: FAMILIES.map((f) => ({
      key: f.key,
      name: f.name,
      entries: capabilityIndex(f),
    })),
    dossierKinds: Object.entries(ROOT_FIELDS).map(([kind, fields]) => ({
      kind,
      fields: fields.map((field) => ({
        key: field.key,
        label: field.label,
        type: field.type,
      })),
    })),
    modules: MODULES.map((m) => ({
      key: m.key,
      label: m.label,
      group: m.group,
      kind: m.kind,
      description: m.description,
    })),
  };
}
export function changedDefinitionPaths(
  before: unknown,
  after: unknown,
  limit = 500,
) {
  const changes: { path: string; change: "added" | "removed" | "changed" }[] =
    [];
  function visit(a: unknown, b: unknown, path: string) {
    if (changes.length >= limit || JSON.stringify(a) === JSON.stringify(b))
      return;
    if (
      a === undefined ||
      b === undefined ||
      a === null ||
      b === null ||
      typeof a !== "object" ||
      typeof b !== "object" ||
      Array.isArray(a) !== Array.isArray(b)
    ) {
      changes.push({
        path: path || "definition",
        change:
          a === undefined ? "added" : b === undefined ? "removed" : "changed",
      });
      return;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      const stableIds = [...a, ...b].every(
        (v) => v && typeof v === "object" && typeof v.id === "string",
      );
      if (stableIds) {
        if (
          JSON.stringify(a.map((v) => v.id)) !==
          JSON.stringify(b.map((v) => v.id))
        )
          changes.push({ path: path + ".order", change: "changed" });
        for (const id of new Set([...a, ...b].map((v) => v.id)))
          visit(
            a.find((v) => v.id === id),
            b.find((v) => v.id === id),
            path + "." + id,
          );
      } else
        for (let i = 0; i < Math.max(a.length, b.length); i++)
          visit(a[i], b[i], path + "." + i);
      return;
    }
    for (const key of [
      ...new Set([...Object.keys(a as object), ...Object.keys(b as object)]),
    ].sort())
      visit((a as any)[key], (b as any)[key], path ? path + "." + key : key);
  }
  visit(before, after, "");
  return { changes, truncated: changes.length >= limit };
}
