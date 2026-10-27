import { FAMILIES } from "../registry";
import { SUBTYPES } from "../reference-model";
import { BASE, type Locale } from "../types";
import { csv, parseCsv } from "../imports";
export type ImportTarget = {
  version: 1;
  family: string;
  subtype: string;
  locale: Locale;
  topic?: string;
};
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function validateTarget(value: unknown): ImportTarget {
  const x = value as ImportTarget;
  if (
    !x ||
    x.version !== 1 ||
    !FAMILIES.some((f) => f.key === x.family) ||
    !SUBTYPES[x.family]?.authored.some((t) => t.id === x.subtype) ||
    !["en", "fr", "ar"].includes(x.locale) ||
    (x.topic && (!uuid.test(x.topic) || typeof x.topic !== "string"))
  )
    throw Error(
      "Choose an exact native category, subcategory and content language.",
    );
  return {
    version: 1,
    family: x.family,
    subtype: x.subtype,
    locale: x.locale,
    ...(x.topic ? { topic: x.topic } : {}),
  };
}
export function targetFromParams(
  params: { get: (key: string) => string | null } | null,
): ImportTarget | null {
  if (params?.get("from") !== "inventory-map") return null;
  if (params.get("context"))
    throw Error(
      "An inventory branch and a dossier context cannot be combined.",
    );
  return validateTarget({
    version: 1,
    family: params.get("family"),
    subtype: params.get("inventorySubtype"),
    locale: params.get("inventoryLocale"),
    topic: params.get("inventoryTopic") || undefined,
  });
}
export function importHref(target: ImportTarget) {
  const t = validateTarget(target),
    params = new URLSearchParams({
      from: "inventory-map",
      family: t.family,
      task: "create",
      inventorySubtype: t.subtype,
      inventoryLocale: t.locale,
    });
  if (t.topic) params.set("inventoryTopic", t.topic);
  return BASE + "/imports?" + params;
}
export function targetScope(t: ImportTarget) {
  return [t.family, t.subtype, t.locale, t.topic || "all-topics"].join(".");
}
export function applyImportTarget(
  source: string,
  value: unknown,
  fillBlanks: boolean,
) {
  const t = validateTarget(value),
    rows = parseCsv(source),
    headers = rows.shift() || [];
  if (
    !headers.length ||
    headers.length > 200 ||
    new Set(headers).size !== headers.length ||
    headers.some((h) => !h.trim())
  )
    throw Error("Use named unique CSV columns.");
  if (!rows.length)
    throw Error("Add at least one resource row before reviewing the target.");
  if (rows.some((r) => r.length > headers.length))
    throw Error("A source row has more cells than its header.");
  const values: Record<string, string> = {
    subtype: t.subtype,
    locale: t.locale,
    ...(t.topic ? { topic: t.topic } : {}),
  };
  let filled = 0;
  for (const [column, value] of Object.entries(values)) {
    let index = headers.indexOf(column);
    if (index < 0) {
      if (!fillBlanks)
        throw Error("Review and enable filling blank target cells: " + column);
      index = headers.length;
      headers.push(column);
    }
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      while (row.length < headers.length) row.push("");
      const current = row[index]?.trim();
      if (current && current !== value)
        throw Error(
          "Row " +
            (i + 2) +
            " conflicts with the selected " +
            column +
            " target: " +
            current +
            ". Correct the source or choose the correct branch.",
        );
      if (!current) {
        if (!fillBlanks)
          throw Error(
            "Row " +
              (i + 2) +
              " needs " +
              column +
              ". Review blank-cell target filling.",
          );
        row[index] = value;
        filled++;
      }
    }
  }
  return {
    source: csv([headers, ...rows]),
    rows: rows.length,
    filled,
    target: t,
  };
}
