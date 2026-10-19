import {
  operatorTemplate,
  isOperatorSheet,
  planOperatorSheet,
  exportOperatorSheet,
} from "./operator-sheets";
import { compatibleDefinition } from "./capabilities";
import { FAMILIES, familyByKey } from "./registry";
import {
  blankRecord,
  normalizeRecord,
  references,
  validateRecord,
} from "./model";
import {
  array,
  object,
  text,
  type Data,
  type DceRecord,
  type Kind,
  type Locale,
  type Validation,
} from "./types";
export const TASKS = [
  "create",
  "content",
  "translations",
  "media",
  "taxonomy",
  "journeys",
  "access",
  "advertising",
] as const;
export type ImportTask = (typeof TASKS)[number];
export function csv(rows: unknown[][]) {
  return (
    rows
      .map((row) =>
        row
          .map((v) => '"' + String(v ?? "").replace(/"/g, '""') + '"')
          .join(","),
      )
      .join("\r\n") + "\r\n"
  );
}
export function parseCsv(source: string): string[][] {
  const s = source.replace(/^\uFEFF/, "");
  if (new TextEncoder().encode(s).length > 4 * 1024 * 1024)
    throw Error("CSV exceeds 4 MiB.");
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false,
    closed = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else cell += c;
      continue;
    }
    if (c === '"') {
      if (cell || closed) throw Error("Unexpected quote at character " + i);
      quoted = true;
      continue;
    }
    if (closed && !["\r", "\n", ","].includes(c))
      throw Error("Unexpected data after a quoted field.");
    if (c === ",") {
      row.push(cell);
      cell = "";
      closed = false;
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
      cell = "";
      closed = false;
    } else cell += c;
  }
  if (quoted) throw Error("Unclosed CSV quote.");
  if (cell || row.length) {
    row.push(cell);
    if (row.some((x) => x.trim())) rows.push(row);
  }
  if (rows.length > 5001) throw Error("Maximum 5000 data rows.");
  const width = rows[0]?.length || 0;
  if (rows.some((r) => r.length !== width))
    throw Error("Shifted CSV row; every row must match the header width.");
  if (new Set(rows[0]).size !== width) throw Error("Duplicate CSV columns.");
  return rows;
}
// Draft imports may lack publication assets, but malformed structure and unresolved
// canonical references cannot be marked ready for application. Shared by initial
// planning and operator corrections so correcting a receipt cannot bypass preflight.
const IMPORT_BLOCKING_CODES = new Set([
  "IDENTITY",
  "NUMBER",
  "AGE",
  "MODE",
  "CAPABILITY",
  "CYCLE",
  "MISSING",
  "MEDIA_TYPE",
  "MISSING_MEDIA",
  "MEDIA_UNAVAILABLE",
  "NATIVE_OFFER",
  "MISSING_RECORD",
]);
export function importBlockingIssues(
  validation: Pick<Validation, "errors">,
): string[] {
  return validation.errors
    .filter((e) => IMPORT_BLOCKING_CODES.has(e.code))
    .map((e) => e.path + ": " + e.message[0]);
}
const fieldsByTask: Record<ImportTask, string[]> = {
  create: [
    "title",
    "audience",
    "topic",
    "mode",
    "ageMin",
    "ageMax",
    "requiredLocales",
    "locales",
    "definition",
  ],
  content: ["title", "definition"],
  translations: ["locales"],
  media: ["coverAssetId", "mediaBindings"],
  taxonomy: ["topic", "audience", "ageMin", "ageMax"],
  journeys: ["steps", "units", "completion"],
  access: ["accessPolicyId", "visibility", "downloadAllowed", "printAllowed"],
  advertising: ["adPolicyId", "advertisingEnabled"],
};
export function contentKeys(family: string) {
  const f = familyByKey(family);
  return new Set([
    ...(f?.collections.map((c) => c.key) || []),
    ...(f?.fields.map((f) => f.key) || []),
    "definitionVersion",
    "body",
    "sections",
    "mode",
    "htmlActivity",
    "certificatePolicy",
  ]);
}
function legacyTemplatePack(family: string, task: ImportTask) {
  const f = familyByKey(family);
  if (!f || !TASKS.includes(task)) throw Error("Choose a family and task.");
  const columns = [
    "key",
    ...(task === "create" ? [] : ["expected_revision"]),
    ...fieldsByTask[task],
  ];
  const guide = {
    contract: "ANGELCARE_DCE_ADMIN_R1",
    family,
    task,
    columns,
    blankUpdate:
      "Blank cells preserve the existing value. Use an explicit JSON null only in a field that permits clearing.",
    identity:
      "key + family + native scope; expected_revision is required for every update.",
    locales:
      "locales is JSON with fr/en/ar objects. Nested collection translations use locales on the unit, with translated title, text, choices, answer and feedback as applicable.",
    definition:
      task === "create" || task === "content"
        ? { fields: f.fields, collections: f.collections }
        : undefined,
    media:
      "Native UUIDs only. Upload into the existing vault first. UUID, exact unique file_name or sha256:CHECKSUM references are resolved during planning; ambiguous matches block the row. Editorial cover, unit media and private attachments are separate.",
    publication:
      "Language editions publish independently. Import saves drafts only. Validation, review, approval and release remain separate.",
    values:
      "JSON arrays/objects must be valid JSON and correctly CSV-quoted; numbers are finite, ages are integers.",
    example: "Examples are preparation data, not published records.",
  };
  const sample = columns.map((k) =>
    k === "key"
      ? "replace-with-your-key"
      : k === "expected_revision"
        ? "1"
        : k === "audience"
          ? "parent"
          : k === "mode"
            ? f.modes[0]
            : k === "requiredLocales"
              ? '["fr","en","ar"]'
              : k === "locales"
                ? JSON.stringify({
                    fr: { title: "À remplacer", summary: "" },
                    en: { title: "Replace me", summary: "" },
                    ar: { title: "استبدل النص", summary: "" },
                  })
                : k === "definition"
                  ? JSON.stringify(
                      Object.fromEntries(f.collections.map((c) => [c.key, []])),
                    )
                  : k === "ageMin"
                    ? "0"
                    : k === "ageMax"
                      ? "18"
                      : "",
  );
  return {
    fileName: `dce-${family}-${task}.csv`,
    csv: csv([columns]),
    exampleCsv: csv([columns, sample]),
    guide,
  };
}
function decode(key: string, value: string): unknown {
  if (!value.trim()) return undefined;
  if (
    [
      "definition",
      "locales",
      "requiredLocales",
      "mediaBindings",
      "steps",
      "units",
    ].includes(key)
  ) {
    try {
      return JSON.parse(value);
    } catch {
      throw Error("Invalid JSON in " + key);
    }
  }
  if (["ageMin", "ageMax", "expected_revision"].includes(key)) {
    if (!/^\d+$/.test(value.trim()))
      throw Error("An integer is required in " + key);
    return Number(value);
  }
  if (["downloadAllowed", "printAllowed", "advertisingEnabled"].includes(key)) {
    if (!["true", "false", "null"].includes(value))
      throw Error("Use true, false or null in " + key);
    return value === "null" ? null : value === "true";
  }
  return value === "null" ? null : value.trim();
}
export function planImport(
  source: string,
  family: string,
  task: ImportTask,
  existing: DceRecord[],
  locale: Locale = "fr",
) {
  if (!familyByKey(family) || !TASKS.includes(task))
    throw Error("Unsupported family/task.");
  const incoming = parseCsv(source);
  if (isOperatorSheet(incoming[0] || []))
    return planOperatorSheet(source, family, task, existing, locale);
  const rows = parseCsv(source),
    headers = rows.shift() || [];
  if (!headers.includes("key")) throw Error("Stable key column is required.");
  const allowed = new Set(["key", "expected_revision", ...fieldsByTask[task]]);
  for (const h of headers)
    if (!allowed.has(h)) throw Error("Column outside this task: " + h);
  const seen = new Set<string>();
  return rows.map((cells, index) => {
    const issues: string[] = [];
    let prepared: Data = {};
    try {
      const input = Object.fromEntries(
          headers.map((h, i) => [h, decode(h, cells[i])]),
        ),
        key = text(input.key);
      if (seen.has(key)) throw Error("Duplicate stable key in this batch.");
      seen.add(key);
      const old = existing.find(
        (r) => r.kind === "experience" && r.key === key && r.family === family,
      );
      if (task === "create" && old)
        throw Error("Stable key already exists; choose an update task.");
      if (task !== "create" && !old)
        throw Error("Target experience not found in this scope/family.");
      if (old && input.expected_revision !== old.revision)
        throw Error("Revision changed; export a fresh dossier.");
      const base = old
        ? (JSON.parse(JSON.stringify(old)) as DceRecord)
        : (blankRecord("experience", family, locale) as DceRecord);
      const d = base.data;
      for (const [k, v] of Object.entries(input)) {
        if (v === undefined || ["key", "expected_revision"].includes(k))
          continue;
        if (k === "definition") {
          const next = object(v);
          for (const forbidden of [
            "publicEnabled",
            "providerSecrets",
            "lifecycle",
          ])
            if (forbidden in next)
              throw Error("Managed property cannot be imported: " + forbidden);
          const permitted = contentKeys(family);
          for (const field of Object.keys(next))
            if (task === "content" && !permitted.has(field))
              throw Error(
                "Definition field outside the content task: " + field,
              );
          Object.assign(d, next);
        } else if (k === "mediaBindings") {
          for (const [mk, mv] of Object.entries(object(v)))
            if (
              [
                "units",
                "cards",
                "frames",
                "episodes",
                "outputs",
                "narrationAssetId",
                "captionAssetId",
              ].includes(mk)
            ) {
              if (
                ["units", "cards", "frames", "episodes", "outputs"].includes(mk)
              ) {
                const current = array(d[mk]),
                  updates = array(mv);
                for (const u of updates) {
                  const existing = current.find((x) => x.id === u.id);
                  if (!existing)
                    throw Error("Unknown media unit ID: " + text(u.id));
                  for (const field of Object.keys(u))
                    if (
                      ![
                        "id",
                        "assetId",
                        "backAssetId",
                        "posterAssetId",
                        "narrationAssetId",
                        "captionAssetId",
                      ].includes(field)
                    )
                      throw Error(
                        "Media assignment cannot alter content: " + field,
                      );
                }
                d[mk] = current.map((row) => ({
                  ...row,
                  ...updates.find((u) => u.id === row.id),
                }));
              } else d[mk] = mv;
            } else throw Error("Unsupported media binding: " + mk);
        } else if (k === "locales") {
          const locales = object(d.locales);
          for (const [l, lv] of Object.entries(object(v))) {
            if (!["fr", "en", "ar"].includes(l))
              throw Error("Unknown language.");
            locales[l] = { ...object(locales[l]), ...object(lv) };
          }
          d.locales = locales;
        } else if (["title", "audience", "topic"].includes(k)) {
          Object.assign(base, { [k]: v });
        } else d[k] = v as Data[string];
      }
      base.kind = "experience";
      base.key = key;
      base.family = family;
      const normalized = normalizeRecord(base, old);
      const ref = references({
          ...object(normalized.data),
          parentId: base.topic || null,
        }),
        before = old
          ? references({ ...old.data, parentId: old.topic || null })
          : null;
      const validation = validateRecord({
        ...base,
        ...normalized,
        id: old?.id || "00000000-0000-4000-8000-000000000001",
        revision: old?.revision || 0,
      } as DceRecord);
      // Structural/identity errors block import. Incomplete publish dependencies remain draft warnings.
      issues.push(...importBlockingIssues(validation));
      prepared = {
        id: old?.id || null,
        revision: old?.revision || 0,
        record: normalized as unknown as Data,
        refs: { record: ref.records, media: ref.media, offer: ref.offers },
        refsBefore: before
          ? {
              record: before.records,
              media: before.media,
              offer: before.offers,
            }
          : {},
        publishReadiness: validation as unknown as Data,
      };
    } catch (e) {
      issues.push(e instanceof Error ? e.message : "Invalid row.");
      if (!prepared.record) {
        const key = cells[headers.indexOf("key")] || "";
        const old = existing.find((r) => r.key === key && r.family === family);
        const draft = old || {
          ...blankRecord("experience", family, locale),
          key,
          title: cells[headers.indexOf("title")] || key,
        };
        prepared = {
          id: old?.id || null,
          revision: old?.revision || 0,
          record: draft as unknown as Data,
          originalHeaders: headers,
          originalCells: cells,
          task,
          family,
        };
      }
    }
    return { rowNumber: index + 2, original: cells, prepared, issues };
  });
}
function legacyExportRecords(
  records: DceRecord[],
  family: string,
  task: ImportTask,
) {
  const { csv: empty } = legacyTemplatePack(family, task),
    headers = parseCsv(empty)[0];
  return csv([
    headers,
    ...records
      .filter((r) => r.kind === "experience" && r.family === family)
      .map((r) => {
        const data = compatibleDefinition(r.family, r.data).data;
        return headers.map((k) =>
          k === "key"
            ? r.key
            : k === "expected_revision"
              ? r.revision
              : k === "definition"
                ? JSON.stringify(
                    Object.fromEntries(
                      Object.entries(data).filter(([key]) =>
                        task === "create"
                          ? ![
                              "publicEnabled",
                              "providerSecrets",
                              "lifecycle",
                            ].includes(key)
                          : contentKeys(family).has(key),
                      ),
                    ),
                  )
                : ["title", "audience", "topic"].includes(k)
                  ? r[k as "title"]
                  : typeof data[k] === "object"
                    ? JSON.stringify(data[k])
                    : (data[k] ?? ""),
        );
      }),
  ]);
}
export const PROFILE_COUNT = FAMILIES.length * TASKS.length;
export function assertTaskCorrection(
  before: Partial<DceRecord>,
  after: Partial<DceRecord>,
  task: ImportTask,
) {
  if (task === "create") return;
  const allowedRoot = new Set(
    task === "taxonomy"
      ? ["topic", "audience"]
      : task === "content"
        ? ["title"]
        : [],
  );
  for (const key of [
    "kind",
    "key",
    "family",
    "topic",
    "audience",
    "title",
  ] as const)
    if (
      !allowedRoot.has(key) &&
      JSON.stringify(before[key]) !== JSON.stringify(after[key])
    )
      throw Error("Correction is outside the selected task: " + key);
  const a = object(before.data),
    b = object(after.data),
    family = familyByKey(text(after.family));
  const allowed = new Set(
    task === "content"
      ? [...contentKeys(text(after.family))]
      : fieldsByTask[task],
  );
  allowed.delete("title");
  allowed.delete("audience");
  allowed.delete("topic");
  if (task === "media") {
    allowed.delete("mediaBindings");
    for (const key of [
      "units",
      "cards",
      "frames",
      "episodes",
      "outputs",
      "narrationAssetId",
      "captionAssetId",
    ])
      allowed.add(key);
  }
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)]))
    if (!allowed.has(key) && JSON.stringify(a[key]) !== JSON.stringify(b[key]))
      throw Error("Correction is outside the selected task: " + key);
  if (task === "media")
    for (const key of ["units", "cards", "frames", "episodes", "outputs"]) {
      const clean = (rows: Data[]) =>
        rows.map((row) =>
          Object.fromEntries(
            Object.entries(row).filter(
              ([k]) =>
                ![
                  "assetId",
                  "backAssetId",
                  "posterAssetId",
                  "narrationAssetId",
                  "captionAssetId",
                ].includes(k),
            ),
          ),
        );
      if (
        JSON.stringify(clean(array(a[key]))) !==
        JSON.stringify(clean(array(b[key])))
      )
        throw Error("Media correction cannot change content or ordering.");
    }
}

export const templatePack = operatorTemplate;
export const exportRecords = exportOperatorSheet;
