import { FAMILIES } from "./registry";
import { modeContract } from "./capabilities";
import {
  array,
  object,
  text,
  tr,
  type Locale,
  type Tri,
  type DceRecord,
  type Field,
} from "./types";

export function activeField(field: Field, engine: string) {
  return !field.modes?.length || field.modes.includes(engine);
}
/** The same canonical contract is consumed by inventory, authoring and release validation. */
export function translationCoverage(
  record: Partial<DceRecord>,
  locale: string,
) {
  const d = object(record.data),
    base = text(d.defaultLocale) || "en";
  const family = FAMILIES.find((f) => f.key === record.family),
    engine = modeContract(family, d)?.engine || "";
  const source = object(object(d.locales)[base]),
    target = object(object(d.locales)[locale]);
  const missing: string[] = [],
    checked: string[] = [],
    fallback: string[] = [];
  const check = (path: string, value: unknown) => {
    if (checked.includes(path)) return;
    checked.push(path);
    if (!text(value)) missing.push(path);
  };
  check("title", target.title || (locale === base ? record.title : undefined));
  for (const key of ["summary", "body", "instructions"])
    if (text(source[key]) || text(d[key]))
      check(key, target[key] || (locale === base ? d[key] : undefined));
  for (const field of family?.fields || [])
    if (
      !(
        record.family === "forms" &&
        ["consentLabel", "responsibleTeam", "destination"].includes(field.key)
      ) &&
      field.localized &&
      activeField(field, engine) &&
      (field.required || text(d[field.key]) || text(source[field.key]))
    )
      check(
        field.key,
        target[field.key] || (locale === base ? d[field.key] : undefined),
      );
  for (const collection of family?.collections || [])
    for (const unit of array(d[collection.key]).filter(
      (u) =>
        (![
          "outputs",
          "exportLayouts",
          "adBreaks",
          "discoveryPlacements",
        ].includes(collection.key) ||
          u.enabled !== false) &&
        !array(d.editionOrder).some(
          (r) =>
            r.locale === locale &&
            r.collection === collection.key &&
            r.unitId === u.id &&
            r.enabled === false,
        ),
    )) {
      const original = object(object(unit.locales)[base]),
        translated = object(object(unit.locales)[locale]);
      for (const field of collection.fields)
        if (
          !(
            record.family === "forms" &&
            ["consentLabel", "responsibleTeam", "destination"].includes(
              field.key,
            )
          ) &&
          field.localized &&
          activeField(field, engine) &&
          (field.required || text(unit[field.key]) || text(original[field.key]))
        )
          check(
            collection.key + "." + text(unit.id) + "." + field.key,
            translated[field.key] ||
              (locale === base ? unit[field.key] : undefined),
          );
    }
  if (object(d.htmlActivity).enabled === true)
    check(
      "htmlActivity.markup",
      object(object(object(d.htmlActivity).locales)[locale]).markup ||
        (locale === base ? object(d.htmlActivity).markup : undefined),
    );
  // An allowed display fallback remains missing translation, never certified coverage.
  if (locale !== base && d.translationFallback === true)
    fallback.push(...missing);
  return {
    complete: missing.length === 0,
    total: checked.length,
    filled: checked.length - missing.length,
    missing,
    fallback,
    engine,
    contract: 2,
    checked,
  };
}

/** Operator labels use canonical definitions and actual unit names, not opaque identifiers. */
export function coverageFieldLabel(
  record: Partial<DceRecord>,
  path: string,
  locale: Locale,
) {
  const common: Record<string, Tri> = {
      title: ["Title", "Titre", "العنوان"],
      summary: ["Summary", "Résumé", "الملخص"],
      body: ["Content", "Contenu", "المحتوى"],
      instructions: ["Instructions", "Consignes", "التعليمات"],
    },
    family = FAMILIES.find((f) => f.key === record.family),
    parts = path.split(".");
  if (parts.length === 1)
    return tr(
      family?.fields.find((f) => f.key === path)?.label ||
        common[path] || ["Published text", "Texte publié", "النص المنشور"],
      locale,
    );
  const collection = family?.collections.find((c) => c.key === parts[0]),
    units = array(record.data?.[parts[0]]),
    index = units.findIndex((u) => u.id === parts[1]),
    unit = units[index],
    title = unit
      ? text(object(object(unit.locales)[locale]).title) || text(unit.title)
      : "",
    field = collection?.fields.find((f) => f.key === parts[2]);
  return [
    collection
      ? tr(collection.label, locale)
      : tr(["Content units", "Unités de contenu", "وحدات المحتوى"], locale),
    title || String(index + 1),
    field
      ? tr(field.label, locale)
      : tr(["Published text", "Texte publié", "النص المنشور"], locale),
  ].join(" · ");
}
