import { restorePersonalState } from "../../digital-customer-experience/experience-depth";
import { familyByKey } from "../../digital-customer-experience/registry";
import {
  modeContract,
  compatibleDefinition,
} from "../../digital-customer-experience/capabilities";
import { outputReadiness } from "../../digital-customer-experience/experience-contract";
import { safeImage, type Locale } from "../catalogue";
export type Row = Record<string, any>;
export interface DetailValue {
  releaseId: string;
  publishedAt: string;
  manifest: Row;
}
export const obj = (v: unknown): Row =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Row) : {};
export const rows = (v: unknown): Row[] =>
  Array.isArray(v)
    ? v.filter((x) => x && typeof x === "object" && !Array.isArray(x))
    : [];
export const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
export const num = (v: unknown, f = 0) =>
  v !== null && v !== "" && Number.isFinite(Number(v)) ? Number(v) : f;
export function engineFor(family: string, data: Row) {
  const f = familyByKey(family);
  return modeContract(f, data)?.engine || f?.modesContract?.[0]?.engine || "";
}
export function definition(family: string, data: Row) {
  return compatibleDefinition(family, data).data as Row;
}
export function asset(m: Row, id: unknown, prefix = "") {
  const a = obj(obj(m.bindings).media?.[str(id)]);
  return safeImage(a.url) && (!prefix || str(a.mime).startsWith(prefix))
    ? a
    : null;
}
export function readyOutputs(m: Row): Row[] {
  const d = obj(m.definition);
  if (d.downloadAllowed !== true) return [];
  return outputReadiness(d, obj(m.bindings)).filter(
    (o) => o.ready && o.enabled !== false,
  );
}
export function mediaUnit(m: Row, u: Row) {
  return asset(m, u.assetId) || asset(m, u.contentAssetId);
}
export function storyProfile(m: Row) {
  const d = obj(m.definition),
    e = engineFor("stories", d),
    narration =
      asset(m, d.narrationAssetId, "audio/") ||
      rows(d.units)
        .map((u) => asset(m, u.narrationAssetId, "audio/"))
        .find(Boolean);
  return {
    narration: ["read_aloud", "slideshow"].includes(e) ? narration : null,
    readable: rows(d.units).some(
      (u) => str(u.text) || u.contentId || asset(m, u.assetId, "image/"),
    ),
    engine: e,
  };
}
export function capabilityFacts(m: Row, l: Locale) {
  const d = obj(m.definition),
    family = str(m.family),
    facts: { label: string; icon: string }[] = [];
  const labels = {
    en: {
      cards: "cards",
      units:
        family === "learning"
          ? "lessons"
          : family === "printables" || family === "stories"
            ? "pages"
            : "parts",
      frames: "slides",
      questions: "questions",
      steps: "steps",
      items: "items",
    },
    fr: {
      cards: "cartes",
      units:
        family === "learning"
          ? "leçons"
          : family === "printables" || family === "stories"
            ? "pages"
            : "parties",
      frames: "diapositives",
      questions: "questions",
      steps: "étapes",
      items: "éléments",
    },
    ar: {
      cards: "بطاقات",
      units:
        family === "learning"
          ? "دروس"
          : family === "printables" || family === "stories"
            ? "صفحات"
            : "أجزاء",
      frames: "شرائح",
      questions: "أسئلة",
      steps: "خطوات",
      items: "عناصر",
    },
  }[l];
  const key =
    family === "visual-cards"
      ? "cards"
      : family === "presentations"
        ? "frames"
        : family === "assessments"
          ? "questions"
          : family === "bundles"
            ? "steps"
            : family === "planners"
              ? "items"
              : "units";
  const count = rows(d[key]).length;
  if (count)
    facts.push({
      label: count + " " + labels[key as keyof typeof labels],
      icon: "Layers",
    });
  if (
    d.ageMin !== null &&
    d.ageMin !== undefined &&
    d.ageMax !== null &&
    d.ageMax !== undefined &&
    Number.isFinite(Number(d.ageMin)) &&
    Number.isFinite(Number(d.ageMax))
  )
    facts.push({
      label:
        (l === "ar" ? "العمر " : l === "fr" ? "Âges " : "Ages ") +
        d.ageMin +
        "–" +
        d.ageMax,
      icon: "Smile",
    });
  if (num(d.estimatedMinutes) > 0)
    facts.push({
      label: d.estimatedMinutes + " " + (l === "ar" ? "د" : "min"),
      icon: "Clock",
    });
  for (const f of new Set(
    readyOutputs(m).map((o) => (o.mime === "application/pdf" ? "PDF" : "PNG")),
  ))
    facts.push({ label: f, icon: "Download" });
  if (family === "printables" && str(d.paper))
    facts.push({
      label: [d.paper, d.orientation].filter(Boolean).join(" · "),
      icon: "Printer",
    });
  return facts;
}
export function publishedReferences(m: Row) {
  const d = obj(m.definition);
  return [
    ...new Set(
      [
        ...rows(d.steps).map((r) => str(r.experienceId)),
        ...rows(d.recommendations).map((r) => str(r.experienceId)),
        ...rows(d.units).flatMap((r) => [
          str(r.contentId),
          str(r.assessmentId),
        ]),
        ...rows(d.sections).map((r) => str(r.contentId)),
        ...rows(d.blocks).map((r) => str(r.contentId)),
        ...rows(d.resultBands).map((r) => str(r.experienceId)),
        str(d.certificatePolicy?.assessmentId),
        str(d.contentId),
        str(d.experienceId),
      ].filter(Boolean),
    ),
  ];
}
export function clampIndex(index: unknown, count: number) {
  return Math.max(0, Math.min(Math.floor(num(index)), Math.max(0, count - 1)));
}
export function time(seconds: number) {
  const n = Math.max(0, Math.floor(num(seconds)));
  return Math.floor(n / 60) + ":" + String(n % 60).padStart(2, "0");
}
export function validReturn(value: string, locale: Locale) {
  return value.startsWith("/kidflix/" + locale + "/experience/") &&
    /^\/kidflix\/(en|fr|ar)\/experience\/[a-z0-9][a-z0-9._-]{1,119}$/.test(
      value,
    )
    ? value
    : "";
}
export const PRIVATE_KEYS = new Set([
  "internalNotes",
  "reviewHistory",
  "answer",
  "answerKeys",
  "correctKeys",
  "acceptedAnswers",
  "explanation",
  "providerSecrets",
  "secret",
  "password",
  "token",
  "customerId",
  "visitorId",
  "privateReceiverId",
  "responsibleStaffId",
  "notes",
  "compatibilityArchive",
]);
export function cleanPublic(value: any, depth = 0): any {
  if (depth > 16) return null;
  if (Array.isArray(value))
    return value.slice(0, 2000).map((x) => cleanPublic(x, depth + 1));
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .filter(([k]) => !PRIVATE_KEYS.has(k))
        .map(([k, v]) => [k, cleanPublic(v, depth + 1)]),
    );
  return value;
}

export function restoreDetailProgress(
  saved: unknown,
  id: string,
  locale: Locale,
  revision: number,
  data: Row,
) {
  const restored = restorePersonalState(saved, id, locale, revision, data);
  if (restored && obj(saved).revision !== revision) {
    const state = { ...restored.state };
    for (const key of [
      "grade",
      "assessment",
      "calculation",
      "toolResult",
      "result",
      "positions",
      "certificateAttempt",
      "deadline",
      "cardOrder",
      "scenarios",
      "outcomeReceipt",
      "completionReceipt",
      "personalVersions",
      "readingMarks",
      "studyIds",
    ])
      delete state[key];
    state.started = false;
    state.complete = false;
    state.attempts = 0;
    state.matched = [];
    state.selected = [];
    return { ...restored, state };
  }
  return restored;
}
