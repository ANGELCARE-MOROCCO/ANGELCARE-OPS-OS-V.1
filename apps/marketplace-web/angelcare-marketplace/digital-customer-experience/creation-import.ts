import {
  creationId,
  newCreationUnit,
  localizedWrite,
  fieldIsLocalized,
} from "./creation-model";
import { text, type Collection, type Data, type Locale } from "./types";
export type Sheet = { headers: string[]; rows: string[][] };
const normalize = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
const ALIASES: Record<string, string[]> = {
  title: ["title", "titre", "nom"],
  prompt: ["question", "consigne", "prompt"],
  label: ["label", "libelle", "intitule"],
  text: ["text", "texte", "body", "contenu"],
  front: ["front", "recto"],
  back: ["back", "verso"],
  choices: ["choices", "choix", "options"],
  answer: ["answer", "reponse", "bonnereponse", "correctanswer"],
  explanation: ["explanation", "explication", "correction"],
  points: ["points", "score", "bareme"],
  type: ["type", "questiontype"],
  duration: ["duration", "duree", "secondes"],
  help: ["help", "aide"],
  hint: ["hint", "indice"],
  options: ["options"],
  acceptedAnswers: ["acceptedanswers", "reponsesacceptees"],
  correctKeys: ["correctkeys"],
  choiceKeys: ["choicekeys"],
};
export function parseCreationSheet(source: string): Sheet {
  if (new TextEncoder().encode(source).length > 4 * 1024 * 1024)
    throw Error("Use a source smaller than 4 MiB.");
  const first = source.split(/\r?\n/)[0] || "",
    delimiter = first.includes("\t")
      ? "\t"
      : first.split(";").length > first.split(",").length
        ? ";"
        : ",";
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === '"') {
      if (quoted && source[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (quoted || cell === "") quoted = !quoted;
      else cell += c;
    } else if (c === delimiter && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && source[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((v) => v.trim())) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (quoted) throw Error("A quoted cell is unfinished.");
  row.push(cell);
  if (row.some((v) => v.trim())) rows.push(row);
  const headers = (rows.shift() || []).map(
    (s, i) => s.replace(/^\uFEFF/, "").trim() || "Column " + (i + 1),
  );
  if (!headers.length || !rows.length)
    throw Error("Include a header row and at least one content row.");
  if (headers.length > 200 || rows.length > 5000)
    throw Error("Use at most 200 columns and 5,000 rows.");
  if (rows.some((r) => r.length > headers.length))
    throw Error("A row contains more cells than the header.");
  return { headers, rows };
}
export function suggestCreationMapping(
  sheet: Sheet,
  collection: Collection,
): string[] {
  return sheet.headers.map((h) => {
    const name = normalize(h);
    const direct = collection.fields.find(
      (f) =>
        normalize(f.key) === name ||
        Object.values(f.label).some((l) => normalize(l) === name),
    );
    if (direct && direct.key !== "id") return direct.key;
    const alias = Object.keys(ALIASES).find(
      (k) =>
        ALIASES[k].includes(name) && collection.fields.some((f) => f.key === k),
    );
    if (alias) return alias;
    if (/^(choice|choix|option)[a-z0-9]$/.test(name)) return "@choice";
    return "";
  });
}
export function importCreationUnits(
  sheet: Sheet,
  mapping: string[],
  collection: Collection,
  locale: Locale,
  answerFormat: "text" | "letter" | "position" = "text",
): Data[] {
  const keys = mapping.filter((k) => k && k !== "@choice");
  if (new Set(keys).size !== keys.length)
    throw Error(
      "Map each field once. Multiple separate choice columns are allowed.",
    );
  return sheet.rows.map((values, index) => {
    let row = newCreationUnit(collection, locale);
    const separate: string[] = [];
    mapping.forEach((key, i) => {
      const value = (values[i] || "").trim();
      if (!key || !value) return;
      if (key === "@choice") {
        separate.push(value);
        return;
      }
      const field = collection.fields.find((f) => f.key === key);
      if (!field || key === "id") throw Error("Unsupported mapped field.");
      let parsed: Data[string] = value.replace(/\\n/g, "\n");
      if (field.type === "number") {
        parsed = Number(value.replace(",", "."));
        if (!Number.isFinite(parsed))
          throw Error(`Row ${index + 2}: ${field.label[0]} needs a number.`);
      }
      if (field.type === "toggle") {
        if (
          !["true", "false", "1", "0", "yes", "no", "oui", "non"].includes(
            value.toLowerCase(),
          )
        )
          throw Error(
            `Row ${index + 2}: choose yes or no for ${field.label[0]}.`,
          );
        parsed = ["true", "1", "yes", "oui"].includes(value.toLowerCase());
      }
      row = localizedWrite(row, key, parsed, locale, fieldIsLocalized(field));
    });
    if (separate.length)
      row = localizedWrite(row, "choices", separate.join("\n"), locale);
    if (
      collection.key === "questions" &&
      ["choice", "multi"].includes(text(row.type))
    ) {
      const choices = text(row.choices).split(/\r?\n/).filter(Boolean);
      const choiceKeys = text(row.choiceKeys).split(/\r?\n/).filter(Boolean);
      const stable = choices.map(
        (_, i) => choiceKeys[i] || "option-" + creationId(),
      );
      row.choiceKeys = stable.join("\n");
      if (!text(row.correctKeys) && text(row.answer)) {
        const answers = text(row.answer)
          .split(/\r?\n|\|/)
          .map((s) => s.trim())
          .filter(Boolean);
        const correct = answers.map((answer) => {
          const n =
            answerFormat === "letter"
              ? answer.toUpperCase().charCodeAt(0) - 65
              : answerFormat === "position"
                ? Number(answer) - 1
                : choices.indexOf(answer);
          if (
            !Number.isInteger(n) ||
            n < 0 ||
            n >= choices.length ||
            (answerFormat === "text" &&
              choices.filter((c) => c === answer).length !== 1)
          )
            throw Error(
              `Row ${index + 2}: select an unambiguous correct answer.`,
            );
          return stable[n];
        });
        row.correctKeys = correct.join(",");
        row.answer = "";
      }
    }
    return row;
  });
}
