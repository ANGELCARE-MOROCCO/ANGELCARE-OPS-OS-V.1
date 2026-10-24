import { csv, parseCsv, TASKS, type ImportTask } from "./imports";
import { operatorTemplate, sheetCollections } from "./operator-sheets";
import { FAMILIES } from "./registry";

export const MAPPING_VERSION = "kidflix-import-mapping-v1";
export type Mapping = {
  columns: Record<string, string>;
  constants: Record<string, string>;
};
export type MappingProfile = {
  id?: string;
  revision?: number;
  title: string;
  family: string;
  task: ImportTask;
  collection: string;
  headers: string[];
  mapping: Mapping;
  version: typeof MAPPING_VERSION;
};
export function inspectSource(source: string) {
  const parsed = parseCsv(source),
    headers = parsed.shift() || [];
  if (!headers.length || headers.length > 200)
    throw Error("Use between 1 and 200 named columns.");
  if (
    headers.some((h) => !h.trim() || h.length > 160) ||
    new Set(headers).size !== headers.length
  )
    throw Error("Column names must be nonempty and unique.");
  if (parsed.some((row) => row.length > headers.length))
    throw Error(
      "A data row has more cells than the header. Check CSV quoting.",
    );
  return {
    headers,
    rows: parsed.map((row) => headers.map((_, i) => row[i] || "")),
  };
}
export function automaticMapping(
  headers: string[],
  columns: string[],
): Mapping {
  const normalized = (s: string) => s.toLowerCase().replace(/[\s_-]/g, "");
  const output: Mapping = { columns: {}, constants: {} };
  for (const column of columns) {
    const matches = headers.filter((h) => normalized(h) === normalized(column));
    if (matches.length === 1) output.columns[column] = matches[0];
  }
  return output;
}
export function validateProfile(input: unknown): MappingProfile {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw Error("Choose a mapping profile.");
  if (new TextEncoder().encode(JSON.stringify(input)).length > 65536)
    throw Error("Mapping profiles must stay below 64 KiB.");
  const p = input as MappingProfile;
  if (
    p.version !== MAPPING_VERSION ||
    !FAMILIES.some((f) => f.key === p.family) ||
    !TASKS.includes(p.task) ||
    !sheetCollections(p.family, p.task).includes(p.collection)
  )
    throw Error("Mapping profile scope or version is incompatible.");
  if (
    typeof p.title !== "string" ||
    !p.title.trim() ||
    p.title.length > 100 ||
    !Array.isArray(p.headers) ||
    p.headers.length > 200 ||
    p.headers.some((h) => typeof h !== "string" || !h || h.length > 160) ||
    new Set(p.headers).size !== p.headers.length
  )
    throw Error("Choose a profile name and unique source columns.");
  const targets = operatorTemplate(p.family, p.task, p.collection).guide
    .columns;
  if (
    !p.mapping ||
    typeof p.mapping !== "object" ||
    !p.mapping.columns ||
    !p.mapping.constants
  )
    throw Error("Invalid column mapping.");
  for (const [key, value] of Object.entries(p.mapping.columns))
    if (
      !targets.includes(key) ||
      typeof value !== "string" ||
      (value !== "" && !p.headers.includes(value))
    )
      throw Error("Mapping references an unavailable column.");
  for (const [key, value] of Object.entries(p.mapping.constants))
    if (
      !targets.includes(key) ||
      typeof value !== "string" ||
      value.length > 10000
    )
      throw Error("Mapping constant is invalid.");
  return {
    version: MAPPING_VERSION,
    title: p.title.trim(),
    family: p.family,
    task: p.task,
    collection: p.collection,
    headers: [...p.headers],
    mapping: {
      columns: { ...p.mapping.columns },
      constants: { ...p.mapping.constants },
    },
  };
}
export function mappedRows(
  headers: string[],
  rows: string[][],
  targets: string[],
  mapping: Mapping,
) {
  return rows.map((row) =>
    targets.map((target) =>
      mapping.columns[target]
        ? row[headers.indexOf(mapping.columns[target])] || ""
        : mapping.constants[target] || "",
    ),
  );
}
export function serializeMapping(
  source: string,
  family: string,
  task: ImportTask,
  collection: string,
  mapping: Mapping,
) {
  const { headers, rows } = inspectSource(source),
    template = operatorTemplate(family, task, collection),
    columns = template.guide.columns;
  validateProfile({
    version: MAPPING_VERSION,
    title: "validation",
    family,
    task,
    collection,
    headers,
    mapping,
  });
  if (!rows.length) throw Error("Add at least one data row.");
  const output = mappedRows(headers, rows, columns, mapping);
  const required = ["key", ...(task !== "create" ? ["expected_revision"] : [])];
  for (const field of required)
    if (output.some((row) => !row[columns.indexOf(field)]?.trim()))
      throw Error("Every row needs " + field + ".");
  const result = csv([columns, ...output]);
  if (new TextEncoder().encode(result).length > 4 * 1024 * 1024)
    throw Error("Mapped CSV exceeds 4 MiB. Split this source.");
  return result;
}
