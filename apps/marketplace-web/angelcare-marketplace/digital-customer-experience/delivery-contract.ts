import { classificationChoices } from "../kidflix/storefront-reference/taxonomy";
import { SUBTYPES } from "./reference-model";
import {
  array,
  object,
  text,
  type Data,
  type DceRecord,
  type Family,
  type Locale,
} from "./types";

export const DELIVERY_CONTRACT = "KIDFLIX_DELIVERY_R2";
export type InteractiveReference = {
  id: string;
  checksum: string;
  locale: Locale;
  entry: string;
};
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export function validInteractiveReference(
  value: unknown,
): value is InteractiveReference {
  const r = object(value),
    entry = text(r.entry);
  return (
    uuid.test(text(r.id)) &&
    /^[a-f0-9]{64}$/i.test(text(r.checksum)) &&
    ["fr", "en", "ar"].includes(text(r.locale)) &&
    /^[A-Za-z0-9/_.-]+\.html$/.test(entry) &&
    !entry.split("/").some((x) => !x || x === "." || x === "..")
  );
}
/** A locale map never falls back to another language's executable content. */
export function packageForLocale(
  data: Data,
  locale: string = text(data.defaultLocale) || "en",
): Data {
  const editions = object(data.interactivePackages);
  if (Object.hasOwn(editions, locale)) return object(editions[locale]);
  const legacy = object(data.interactivePackage);
  return legacy.locale === locale ? legacy : {};
}
export function isHtmlDelivery(
  data: Data,
  locale: string = text(data.defaultLocale) || "en",
): boolean {
  const selected = text(object(data.delivery).kind);
  if (selected === "native") return false;
  return (
    selected === "html" ||
    Object.keys(packageForLocale(data, locale)).length > 0
  );
}
// Shared platform collections remain fully available. Other collections belong
// to the native player and must not leak into HTML validation or public bindings.
const sharedCollections = new Set([
  "outputs",
  "detailSections",
  "resultBands",
  "recommendations",
  "exportLayouts",
  "discoveryPlacements",
  "adBreaks",
  "editionOrder",
]);
const sharedFields = new Set([
  "subject",
  "skillTags",
  "difficulty",
  "educationalLevel",
  "estimatedMinutes",
  "learningObjectives",
  "materials",
  "caregiverGuidance",
  "discoveryTitle",
  "seoDescription",
  "slug",
  "continuityPolicy",
  "progressTtlDays",
  "releaseChangePolicy",
  "reducedMotion",
  "resultsEnabled",
  "completion",
  "allowRestart",
  "downloadAllowed",
  "printAllowed",
  "coverAssetId",
  "accessPolicyId",
  "adPolicyId",
  "documentUses",
  "documentGrades",
  "documentThemes",
  "documentNeeds",
  "documentSubject",
  "subtype",
]);
export function fieldAppliesToDelivery(
  key: string,
  data: Data,
  family?: Family,
): boolean {
  if (!isHtmlDelivery(data) || !family) return true;
  return (
    sharedFields.has(key) ||
    key.startsWith("kidflix") ||
    key.startsWith("storefront")
  );
}
export function collectionAppliesToDelivery(key: string, data: Data): boolean {
  return !isHtmlDelivery(data) || sharedCollections.has(key);
}
/** Pure projection. The saved dossier is never erased or normalized implicitly. */
export function activeDeliveryData(
  data: Data,
  family?: Family,
  locale = text(data.defaultLocale) || "en",
): Data {
  if (!isHtmlDelivery(data, locale)) {
    const next = { ...data };
    delete next.interactivePackage;
    delete next.interactivePackages;
    return next;
  }
  const next: Data = {
    ...data,
    defaultLocale: locale,
    delivery: { ...object(data.delivery), kind: "html" },
  };
  const ref = packageForLocale(data, locale);
  next.interactivePackage = ref;
  delete next.interactivePackages;
  for (const c of family?.collections || [])
    if (!collectionAppliesToDelivery(c.key, next)) delete next[c.key];
  for (const f of family?.fields || [])
    if (!fieldAppliesToDelivery(f.key, next, family)) delete next[f.key];
  // Some native sources predate their family registry declarations.
  for (const key of [
    "units",
    "cards",
    "questions",
    "frames",
    "steps",
    "fields",
    "items",
    "blocks",
    "cues",
    "chapters",
    "captions",
    "sortRules",
    "sortGroups",
    "soundItems",
    "bridgeChallenges",
    "storyChoices",
  ])
    if (!collectionAppliesToDelivery(key, next)) delete next[key];
  for (const key of [
    "sortingEnabled",
    "htmlActivity",
    "narrationAssetId",
    "captionAssetId",
    "posterAssetId",
  ])
    delete next[key];
  next.editionOrder = array(next.editionOrder).filter(
    (row) =>
      sharedCollections.has(text(row.collection)) &&
      row.collection !== "editionOrder",
  );
  const local = object(next.locales);
  next.locales = Object.fromEntries(
    Object.entries(local).map(([l, v]) => {
      const edition = { ...object(v) };
      for (const f of family?.fields || [])
        if (!fieldAppliesToDelivery(f.key, next, family)) delete edition[f.key];
      return [l, edition];
    }),
  );
  return next;
}
export function activeDeliveryRecord<T extends Partial<DceRecord>>(
  record: T,
  family?: Family,
  locale?: string,
): T {
  return {
    ...record,
    data: activeDeliveryData(object(record.data), family, locale),
  };
}
export function attachInteractivePackage(
  record: Partial<DceRecord>,
  pkg: InteractiveReference & {
    title?: string;
    audience?: { age_min?: number; age_max?: number };
    rights?: unknown;
    coverAssetId?: string;
    manifest?: Record<string, unknown>;
  },
  family: Family,
): Partial<DceRecord> {
  if (!validInteractiveReference(pkg))
    throw Error("INVALID_INTERACTIVE_PACKAGE_REFERENCE");
  const original = object(record.data),
    locale = pkg.locale,
    legacy = object(original.interactivePackage);
  const map = { ...object(original.interactivePackages) };
  if (validInteractiveReference(legacy)) map[legacy.locale] = legacy;
  const ref: Data = {
    id: pkg.id,
    checksum: pkg.checksum,
    locale,
    entry: pkg.entry,
  };
  map[locale] = ref;
  const title = text(record.title) || text(pkg.title),
    editions = object(original.locales);
  const data: Data = {
    ...original,
    delivery: { ...object(original.delivery), kind: "html" },
    interactivePackages: map,
    interactivePackage: ref,
    defaultLocale: locale,
    requiredLocales: [locale],
    visibility: "free",
    mode: family.modes.includes(text(original.mode))
      ? original.mode
      : family.modes[0],
    locales: {
      ...editions,
      [locale]: {
        ...object(editions[locale]),
        title: text(object(editions[locale]).title) || title,
      },
    },
  };
  if (
    !record.id &&
    Number.isInteger(pkg.audience?.age_min) &&
    Number.isInteger(pkg.audience?.age_max)
  ) {
    data.ageMin = pkg.audience!.age_min!;
    data.ageMax = pkg.audience!.age_max!;
  }
  if (pkg.coverAssetId && !text(data.coverAssetId))
    data.coverAssetId = pkg.coverAssetId;
  const metadata = object(pkg.manifest),
    catalogue = object(metadata.catalogue),
    editorial = object(metadata.editorial);
  const edition = object(object(data.locales)[locale]);
  for (const key of [
    "summary",
    "instructions",
    "learningObjectives",
    "caregiverGuidance",
    "seoDescription",
    "discoveryTitle",
  ])
    if (!text(edition[key]) && !text(data[key]) && text(editorial[key])) {
      edition[key] = text(editorial[key]);
      data[key] = text(editorial[key]);
    }
  data.locales = { ...object(data.locales), [locale]: edition };
  for (const key of [
    "storefrontFocus",
    "storefrontThemes",
    "storefrontNeeds",
    "storefrontQuick",
  ]) {
    const allowed = new Set(
        classificationChoices(family.key, key).map((c) => c.key),
      ),
      values = text(catalogue[key]).split(/\r?\n/).filter(Boolean);
    if (
      !text(data[key]) &&
      values.length &&
      values.every((v) => allowed.has(v))
    )
      data[key] = [...new Set(values)].join("\n");
  }
  if (!text(data.subject) && text(catalogue.subject))
    data.subject = catalogue.subject;
  if (
    !text(data.subtype) &&
    SUBTYPES[family.key]?.authored.some((s) => s.id === catalogue.subtype)
  )
    data.subtype = catalogue.subtype;
  const catalogueKey = text(catalogue.collection_key),
    key =
      !record.id && text(record.key).startsWith("resource-")
        ? /^[a-z0-9][a-z0-9._-]{1,119}$/.test(catalogueKey)
          ? catalogueKey
          : "html-" + pkg.id
        : record.key;
  return {
    ...record,
    key,
    title,
    topic:
      record.topic ||
      (uuid.test(text(catalogue.topic_id)) ? text(catalogue.topic_id) : null),
    data,
  };
}
