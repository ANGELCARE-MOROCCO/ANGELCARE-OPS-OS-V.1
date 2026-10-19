// Shared state contract consumed by protected admin previews and the future public runtime.
import { array, object, text, type Data } from "./types";
export interface Continuity {
  completed: string[];
  bookmarks: string[];
  shared: string[];
  downloads: string[];
  answers: Data;
  drafts: Data;
  results: Data[];
  updatedAt: string;
  revision: number;
}
export type ContinuityEvent =
  | {
      type: "checkpoint" | "bookmark" | "share" | "download";
      id: string;
      enabled?: boolean;
    }
  | { type: "draft"; id: string; value: Data }
  | { type: "result"; id: string; value: Data };
export function continueExperience(
  state: Continuity,
  event: ContinuityEvent,
  expectedRevision: number,
): Continuity {
  if (state.revision !== expectedRevision)
    throw Error("Continuity revision conflict.");
  if (!event.id || event.id.length > 120)
    throw Error("Stable unit identity required.");
  const next = structuredClone(state);
  if (event.type === "draft") next.drafts[event.id] = event.value;
  else if (event.type === "result")
    next.results = [
      ...next.results.filter((x) => x.id !== event.id),
      { ...event.value, id: event.id },
    ];
  else {
    const key =
      event.type === "checkpoint"
        ? "completed"
        : event.type === "bookmark"
          ? "bookmarks"
          : event.type === "share"
            ? "shared"
            : "downloads";
    const present = next[key].includes(event.id);
    if (event.enabled === false)
      next[key] = next[key].filter((x) => x !== event.id);
    else if (!present) next[key].push(event.id);
  }
  next.revision++;
  next.updatedAt = new Date().toISOString();
  return next;
}
export function availableNodes(
  nodes: Data[],
  state: Continuity,
  values: Data = {},
) {
  return nodes.filter((n) => {
    const prereqs = Array.isArray(n.prerequisites)
      ? n.prerequisites.map(String)
      : text(n.prerequisites)
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
    if (prereqs.some((p) => !state.completed.includes(p))) return false;
    const condition = text(n.condition);
    if (!condition || condition === "always") return true;
    const id = text(n.conditionTarget);
    if (condition === "completed") return state.completed.includes(id);
    if (condition === "answer_equals")
      return (
        String(values[id] ?? state.answers[id] ?? "") === text(n.conditionValue)
      );
    if (condition === "value_at_least") {
      const actual = values[id] ?? state.answers[id],
        required = n.conditionValue;
      if (
        actual === undefined ||
        actual === null ||
        required === undefined ||
        required === null ||
        String(actual).trim() === "" ||
        String(required).trim() === ""
      )
        return false;
      const actualNumber = Number(actual),
        requiredNumber = Number(required);
      return (
        Number.isFinite(actualNumber) &&
        Number.isFinite(requiredNumber) &&
        actualNumber >= requiredNumber
      );
    }
    if (
      ["score_at_least", "score_below", "passed", "failed"].includes(condition)
    ) {
      const result = state.results.find((r) => r.id === id);
      if (!result || typeof result.score !== "number") return false;
      const threshold = Number(n.conditionValue ?? 70);
      if (!Number.isFinite(threshold)) return false;
      return condition === "score_at_least"
        ? result.score >= threshold
        : condition === "score_below"
          ? result.score < threshold
          : condition === "passed"
            ? typeof result.passed === "boolean"
              ? result.passed
              : result.score >= threshold
            : typeof result.passed === "boolean"
              ? !result.passed
              : result.score < threshold;
    }
    return false;
  });
}
export function completedJourney(nodes: Data[], state: Continuity) {
  const required = nodes.filter((n) => n.required !== false);
  return (
    required.length > 0 &&
    required.every((n) => state.completed.includes(text(n.id)))
  );
}
export function blankContinuity(): Continuity {
  return {
    completed: [],
    bookmarks: [],
    shared: [],
    downloads: [],
    answers: {},
    drafts: {},
    results: [],
    revision: 0,
    updatedAt: new Date().toISOString(),
  };
}
export function journeyProgress(
  nodes: Data[],
  state: Continuity,
  values: Data = {},
) {
  const ready = new Set(
    availableNodes(nodes, state, values).map((n) => text(n.id)),
  );
  let possible = 0,
    earned = 0,
    unresolved = false;
  for (const node of nodes.filter((n) => n.required !== false)) {
    const condition = text(node.condition),
      target = text(node.conditionTarget);
    const decided =
      !condition || condition === "always" || condition === "completed"
        ? true
        : ["score_at_least", "score_below", "passed", "failed"].includes(
              condition,
            )
          ? state.results.some(
              (r) => r.id === target && typeof r.score === "number",
            )
          : values[target] !== undefined || state.answers[target] !== undefined;
    if (!decided) {
      unresolved = true;
      continue;
    }
    const eligible =
      ready.has(text(node.id)) || state.completed.includes(text(node.id));
    if (condition && condition !== "always" && !eligible) {
      const test = { ...node, prerequisites: [] };
      if (!availableNodes([test], state, values).length) continue;
    }
    const weight = Math.max(0, Number(node.weight ?? 1));
    possible += weight;
    if (state.completed.includes(text(node.id))) earned += weight;
  }
  return {
    earned,
    possible,
    percent: possible ? Math.round((earned / possible) * 100) : 0,
    complete: !unresolved && possible > 0 && earned === possible,
    unresolved,
  };
}
