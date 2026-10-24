import { createUnit } from "./capabilities";
import { FAMILIES } from "./registry";
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
  type Field,
  type Locale,
} from "./types";
import {
  csv,
  parseCsv,
  importBlockingIssues,
  type ImportTask,
} from "./imports";
const langs = ["fr", "en", "ar"] as const,
  mediaKeys = [
    "assetId",
    "coverAssetId",
    "posterAssetId",
    "backAssetId",
    "narrationAssetId",
    "captionAssetId",
  ];
function family(key: string) {
  const f = FAMILIES.find((f) => f.key === key);
  if (!f) throw Error("Choose an experience family.");
  return f;
}
export function sheetCollections(key: string, task: ImportTask) {
  const f = family(key);
  if (task === "create" || ["taxonomy", "access", "advertising"].includes(task))
    return ["root"];
  return [
    "root",
    ...f.collections
      .filter((c) => task !== "journeys" || ["steps", "units"].includes(c.key))
      .map((c) => c.key),
  ];
}
function definitions(key: string, collection: string): Field[] {
  const f = family(key);
  if (collection === "root")
    return [
      {
        key: "title",
        type: "text",
        localized: true,
        label: ["Title", "Titre", "العنوان"],
      },
      {
        key: "summary",
        type: "textarea",
        localized: true,
        label: ["Summary", "Résumé", "الملخص"],
      },
      {
        key: "instructions",
        type: "textarea",
        localized: true,
        label: ["Instructions", "Consignes", "التعليمات"],
      },
      {
        key: "body",
        type: "textarea",
        localized: true,
        label: ["Body", "Contenu", "المحتوى"],
      },
      ...f.fields,
    ];
  const c = f.collections.find((c) => c.key === collection);
  if (!c) throw Error("Choose a declared collection.");
  return c.fields.filter((x) => x.key !== "id");
}
const value = (def: Field, raw: string): any => {
  if (raw === "__CLEAR__") return null;
  if (!raw.trim()) return undefined;
  if (def.type === "number") {
    if (!Number.isFinite(Number(raw)))
      throw Error(def.key + ": use a finite number.");
    return Number(raw);
  }
  if (def.type === "toggle") {
    if (!["true", "false"].includes(raw.toLowerCase()))
      throw Error(def.key + ": use true or false.");
    return raw.toLowerCase() === "true";
  }
  return raw;
};
export function operatorTemplate(
  key: string,
  task: ImportTask,
  collection?: string,
) {
  const f = family(key),
    part =
      collection ||
      (["content", "translations", "media", "journeys"].includes(task)
        ? f.collections.find(
            (c) => task !== "journeys" || ["units", "steps"].includes(c.key),
          )?.key || "root"
        : "root"),
    defs = definitions(key, part);
  let columns: string[];
  if (task === "create")
    columns = [
      "key",
      "title",
      "audience",
      "topic",
      "mode",
      "ageMin",
      "ageMax",
      ...langs.flatMap((l) =>
        [
          "title",
          "summary",
          "instructions",
          "body",
          ...f.fields.filter((x) => x.localized).map((x) => x.key),
        ].map((k) => l + "_" + k),
      ),
      ...f.fields
        .filter(
          (x) => !x.localized && !["mode", "ageMin", "ageMax"].includes(x.key),
        )
        .map((x) => x.key),
    ];
  else if (task === "translations")
    columns = [
      "key",
      "expected_revision",
      "collection",
      "unit_key",
      "locale",
      ...defs.filter((x) => x.localized).map((x) => x.key),
    ];
  else if (task === "media")
    columns = [
      "key",
      "expected_revision",
      "collection",
      "unit_key",
      "locale",
      ...(part === "root"
        ? ["coverAssetId", "posterAssetId", "narrationAssetId"]
        : defs.filter((x) => mediaKeys.includes(x.key)).map((x) => x.key)),
    ];
  else if (["content", "journeys"].includes(task))
    columns = [
      "key",
      "expected_revision",
      "collection",
      "unit_key",
      "operation",
      ...defs.map((x) => x.key),
      ...langs.flatMap((l) =>
        defs.filter((x) => x.localized).map((x) => l + "_" + x.key),
      ),
    ];
  else
    columns = [
      "key",
      "expected_revision",
      ...(task === "taxonomy"
        ? ["topic", "audience", "ageMin", "ageMax"]
        : task === "access"
          ? ["visibility", "downloadAllowed", "printAllowed"]
          : ["adPolicyId", "advertisingEnabled"]),
    ];
  columns = [...new Set(columns)];
  const guide = {
    contract: "ANGELCARE_DCE_OPERATOR_R6",
    family: key,
    task,
    collection: part,
    columns,
    blankUpdate:
      "Empty cells keep existing values. __CLEAR__ explicitly clears a supported optional field.",
    identity:
      "key identifies the experience; unit_key identifies a stable page, lesson, card or question. Updates require expected_revision.",
    locales:
      "Use fr/en/ar in locale. Shared media uses shared. Translation-only sheets never change unit order or file bindings.",
    files:
      "Upload first. Use a native UUID, exact unique filename or sha256:checksum. The selected scope must resolve exactly one eligible file.",
    operations:
      "set updates an existing unit; add creates a unit with unit_key; remove removes exactly that unit after dependency validation. Each experience is one revision-checked draft transaction.",
    publication:
      "Imports prepare and apply drafts only. Editions, review and publication remain separate.",
    fields: defs.map((d) => ({
      key: d.key,
      label: d.label,
      type: d.type,
      required: d.required,
      localized: d.localized,
      options: d.options,
      min: d.min,
      max: d.max,
      reference: d.reference,
      mime: d.mime,
      classification: d.classification,
    })),
    dependencyOrder:
      "Create topics and source files, then independent resources/assessments, courses, and finally bundles. Read the dependency plan before apply.",
  };
  const example = columns.map((k) =>
    k === "key"
      ? "replace-resource-key"
      : k === "expected_revision"
        ? "1"
        : k === "collection"
          ? part
          : k === "unit_key" && part !== "root"
            ? "unit-001"
            : k === "locale"
              ? "fr"
              : k === "operation"
                ? "add"
                : k === "audience"
                  ? "parent"
                  : k === "mode"
                    ? f.modes[0]
                    : k === "title"
                      ? "Replace title"
                      : k === "visibility"
                        ? "free"
                        : "",
  );
  return {
    fileName: `dce-${key}-${task}-${part}.csv`,
    csv: csv([columns]),
    exampleCsv: csv([columns, example]),
    guide,
    guideMarkdown: `# ${f.name[1]} · ${task} · ${part}\n\n${Object.entries(
      guide,
    )
      .filter(([k]) => !["fields", "columns"].includes(k))
      .map(([k, v]) => `**${k}**: ${v}`)
      .join(
        "\n\n",
      )}\n\n| Column | EN / FR / AR | Type | Required | Allowed values / native file |\n|---|---|---|---|---|\n${defs.map((d) => `| ${d.key} | ${d.label.join(" / ")} | ${d.type} | ${d.required ? "yes" : "no"} | ${(d.options || []).join(", ")} ${(d.mime || []).join(", ")} ${d.reference || ""} |`).join("\n")}\n`,
    collection: part,
  };
}
export function isOperatorSheet(headers: string[]) {
  return (
    headers.includes("visibility") ||
    headers.includes("topic") ||
    headers.includes("adPolicyId") ||
    headers.includes("collection") ||
    headers.some((h) => /^(fr|en|ar)_/.test(h))
  );
}
export function planOperatorSheet(
  source: string,
  key: string,
  task: ImportTask,
  existing: DceRecord[],
  locale: Locale,
) {
  const rows = parseCsv(source),
    headers = rows.shift() || [];
  if (!headers.includes("key")) throw Error("Stable key is required.");
  const f = family(key),
    groups = new Map<
      string,
      {
        r: Partial<DceRecord>;
        old?: DceRecord;
        lines: number[];
        issues: string[];
        cells: string[][];
      }
    >();
  for (const [cellsIndex, cells] of rows.entries()) {
    const input = Object.fromEntries(headers.map((h, i) => [h, cells[i]])),
      id = input.key?.trim();
    if (!id) throw Error("Missing key at row " + (cellsIndex + 2));
    let g = groups.get(id);
    if (!g) {
      const old = existing.find(
        (r) => r.key === id && r.family === key && r.kind === "experience",
      );
      g = {
        r: old ? structuredClone(old) : blankRecord("experience", key, locale),
        old,
        lines: [],
        issues: [],
        cells: [],
      };
      g.r.key = id;
      groups.set(id, g);
    }
    g.lines.push(cellsIndex + 2);
    g.cells.push(cells);
    try {
      if (task === "create" && g.old)
        throw Error("Resource already exists; choose an update task.");
      if (
        task !== "create" &&
        (!g.old || Number(input.expected_revision) !== g.old.revision)
      )
        throw Error("Existing resource and exact expected_revision required.");
      if (task === "create" && g.lines.length > 1)
        throw Error(
          "Creation has one root row per resource. Add units with the Content sheet.",
        );
      const d = object(g.r.data),
        part = task === "create" ? "root" : input.collection || "root",
        defs = definitions(key, part),
        l = input.locale || "shared";
      if (!["shared", ...langs].includes(l as any))
        throw Error("Locale must be shared, fr, en or ar.");
      let target = d;
      if (part !== "root") {
        if (!input.unit_key) throw Error("unit_key is required.");
        const list = array(d[part]),
          old = list.find((u) => u.id === input.unit_key),
          op = input.operation || "set";
        if (task === "content" || task === "journeys") {
          if (!["set", "add", "remove"].includes(op))
            throw Error("Use set, add or remove.");
          if (op === "remove") {
            if (!old) throw Error("Unit does not exist.");
            d[part] = list.filter((u) => u !== old);
            continue;
          }
          if (op === "add" && old) throw Error("Unit already exists.");
          if (!old && op !== "add")
            throw Error("Unit is absent; use add explicitly.");
          target =
            old ||
            createUnit(
              f.collections.find((c) => c.key === part)!,
              input.unit_key,
            );
          if (!old) d[part] = [...list, target];
        } else {
          if (!old)
            throw Error("Unit must exist before translation/media assignment.");
          target = old;
        }
      }
      const allowed = new Set(operatorTemplate(key, task, part).guide.columns);
      for (const h of headers)
        if (!allowed.has(h))
          throw Error("Column outside this task/collection: " + h);
      for (const [k, raw] of Object.entries(input)) {
        if (
          [
            "key",
            "expected_revision",
            "collection",
            "unit_key",
            "locale",
            "operation",
          ].includes(k) ||
          raw === ""
        )
          continue;
        const match = k.match(/^(fr|en|ar)_(.+)$/),
          field = match?.[2] || k,
          language =
            match?.[1] ||
            (task === "translations"
              ? l
              : task === "media" && l !== "shared"
                ? l
                : null);
        if (language && !langs.includes(language as any))
          throw Error("Choose one content language.");
        const def =
          defs.find((x) => x.key === field) ||
          ({
            key: field,
            type: ["ageMin", "ageMax"].includes(field)
              ? "number"
              : [
                    "downloadAllowed",
                    "printAllowed",
                    "advertisingEnabled",
                  ].includes(field)
                ? "toggle"
                : "text",
          } as Field);
        if (task === "translations" && !def.localized)
          throw Error("Only declared translated fields are editable.");
        if (task === "media" && !mediaKeys.includes(field))
          throw Error("Only media bindings are editable.");
        let v = value(def, raw);
        if (v === undefined) continue;
        if (task === "access" && field === "visibility" && v !== "free")
          throw Error("Ordinary resources remain free.");
        if (
          task === "translations" &&
          field === "answer" &&
          target.type === "choice" &&
          v !== target.answer
        )
          throw Error(
            "Translate choices in the same order; protected answer index cannot change.",
          );
        if (language) {
          const ls = object(target.locales);
          ls[language] = { ...object(ls[language]), [field]: v };
          target.locales = ls;
        } else if (
          part === "root" &&
          ["title", "topic", "audience"].includes(field)
        )
          Object.assign(g.r, { [field]: v });
        else target[field] = v;
      }
      g.r.data = d;
    } catch (e) {
      g.issues.push("Rows " + g.lines.at(-1) + ": " + (e as Error).message);
    }
  }
  return [...groups.values()].map((g) => {
    let prepared: Data = {};
    try {
      const normalized = normalizeRecord(g.r, g.old),
        r = {
          ...g.r,
          ...normalized,
          id: g.old?.id || "00000000-0000-4000-8000-000000000001",
          revision: g.old?.revision || 0,
        } as DceRecord,
        refs = references({ ...r.data, parentId: r.topic || null }),
        v = validateRecord(r);
      g.issues.push(...importBlockingIssues(v));
      prepared = {
        id: g.old?.id || null,
        revision: g.old?.revision || 0,
        record: normalized as unknown as Data,
        refs: { record: refs.records, media: refs.media, offer: refs.offers },
        sourceRows: g.lines,
        task,
        family: key,
        publishReadiness: v as unknown as Data,
      };
    } catch (e) {
      g.issues.push((e as Error).message);
      prepared = {
        id: g.old?.id || null,
        revision: g.old?.revision || 0,
        record: g.r as unknown as Data,
        sourceRows: g.lines,
        task,
        family: key,
      };
    }
    return {
      rowNumber: g.lines[0],
      original: g.cells.flat(),
      prepared,
      issues: g.issues,
    };
  });
}
export function exportOperatorSheet(
  records: DceRecord[],
  key: string,
  task: ImportTask,
  collection?: string,
) {
  const pack = operatorTemplate(key, task, collection),
    headers = pack.guide.columns,
    out: unknown[][] = [headers];
  for (const r of records.filter(
    (r) => r.kind === "experience" && r.family === key,
  )) {
    const part = pack.collection,
      units = part === "root" ? [r.data] : array(r.data[part]);
    for (const unit of units) {
      const locales =
        task === "translations"
          ? [...langs]
          : task === "media"
            ? ["shared", ...langs]
            : ["shared"];
      for (const l of locales) {
        const values: Data = {
          ...unit,
          key: r.key,
          expected_revision: r.revision,
          collection: part,
          unit_key: part === "root" ? "" : unit.id,
          operation: "set",
          locale: l,
        };
        if (task === "create")
          Object.assign(values, {
            title: r.title,
            topic: r.topic,
            audience: r.audience,
            mode: r.data.mode,
            ageMin: r.data.ageMin,
            ageMax: r.data.ageMax,
          });
        for (const h of headers) {
          const match = h.match(/^(fr|en|ar)_(.+)$/);
          if (match)
            values[h] = object(object(unit.locales)[match[1]])[match[2]] ?? "";
          else if (
            ["translations", "media"].includes(task) &&
            l !== "shared" &&
            ![
              "key",
              "expected_revision",
              "collection",
              "unit_key",
              "locale",
            ].includes(h)
          )
            values[h] = object(object(unit.locales)[l])[h] ?? "";
        }
        out.push(headers.map((h) => values[h] ?? ""));
      }
    }
  }
  return csv(out);
}
