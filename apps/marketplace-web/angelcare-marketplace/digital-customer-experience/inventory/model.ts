import { FAMILIES } from "../registry";
import { SUBTYPES } from "../reference-model";
import { type Locale, type Tri } from "../types";

export const LANGUAGES: Locale[] = ["en", "fr", "ar"];
export const PLAN_KEY = "kidflix-inventory-targets-r1";
export type Selection = { family?: string; subtype?: string; topic?: string };
export type Plan = {
  version: 1;
  targets: Record<string, Partial<Record<Locale, number>>>;
};
export type LanguageState = {
  present: boolean;
  complete: boolean;
  filled: number;
  total: number;
  missing: string[];
  state: string;
  changed: boolean;
  activeId: string | null;
};
export type Publication = {
  locale: Locale;
  id: string;
  family: string;
  subtype: string;
  topic: string;
  at: string | null;
  public: boolean;
};
export type Entry = {
  id: string;
  key: string;
  kind: string;
  title: Record<Locale, string>;
  family: string;
  subtype: string;
  topic: string;
  lifecycle: string;
  revision: number;
  updatedAt: string;
  legacy: boolean;
  languages: Record<Locale, LanguageState>;
  publications: Publication[];
  facets: Record<string, string[]>;
  units: number;
  issues: string[];
};
export type Topic = { id: string; parent: string; title: Tri; key: string };
export type Snapshot = {
  version: 1;
  at: string;
  startedAt: string;
  scopeKey: string;
  entries: Entry[];
  topics: Topic[];
  plan: Plan;
  planRevision: number;
  warnings: string[];
  support: Record<string, number>;
};
export type Metrics = {
  authored: number;
  published: number;
  editions: number;
  drafts: number;
  changed: number;
  unclassified: number;
  languages: Record<
    Locale,
    {
      present: number;
      complete: number;
      published: number;
      public: number;
      missing: number;
      draft: number;
      changed: number;
      target: number | null;
      gap: number;
    }
  >;
  target: number | null;
  gap: number;
  status: "empty" | "pipeline" | "thin" | "healthy" | "populated";
};
export const EMPTY_PLAN: Plan = { version: 1, targets: {} };
export const families = () => FAMILIES;
export const subtypeList = (family: string) => SUBTYPES[family]?.authored || [];
export const nodeKey = (s: Selection) =>
  s.topic
    ? "topic/" + s.topic
    : (s.family || "all") + (s.subtype ? "/" + s.subtype : "");
export function validatePlan(value: unknown): Plan {
  const p = value as Plan;
  if (
    !p ||
    p.version !== 1 ||
    !p.targets ||
    typeof p.targets !== "object" ||
    Array.isArray(p.targets)
  )
    throw Error("Invalid inventory targets.");
  const valid = new Set(
    FAMILIES.flatMap((f) => subtypeList(f.key).map((t) => f.key + "/" + t.id)),
  );
  const targets: Plan["targets"] = {};
  for (const [key, row] of Object.entries(p.targets)) {
    if (
      !valid.has(key) ||
      !row ||
      typeof row !== "object" ||
      Array.isArray(row)
    )
      throw Error("Targets must use a native subcategory.");
    targets[key] = {};
    for (const [locale, v] of Object.entries(row)) {
      if (
        !LANGUAGES.includes(locale as Locale) ||
        !Number.isInteger(v) ||
        Number(v) < 0 ||
        Number(v) > 100000
      )
        throw Error("Use whole-number language targets from 0 to 100,000.");
      targets[key][locale as Locale] = v;
    }
  }
  return { version: 1, targets };
}
export function topicDescendants(topics: Topic[], id: string): Set<string> {
  const out = new Set<string>([id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const t of topics)
      if (out.has(t.parent) && !out.has(t.id)) {
        out.add(t.id);
        changed = true;
      }
  }
  return out;
}
export function topicPath(topics: Topic[], id: string): Topic[] {
  const list: Topic[] = [],
    seen = new Set<string>();
  let current = topics.find((t) => t.id === id);
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    list.unshift(current);
    current = topics.find((t) => t.id === current!.parent);
  }
  return list;
}
export function orderedTopics(topics: Topic[]): Topic[] {
  const result: Topic[] = [],
    seen = new Set<string>(),
    ids = new Set(topics.map((t) => t.id));
  const visit = (t: Topic) => {
    if (seen.has(t.id)) return;
    seen.add(t.id);
    result.push(t);
    topics
      .filter((child) => child.parent === t.id)
      .sort((a, b) => a.key.localeCompare(b.key))
      .forEach(visit);
  };
  topics
    .filter((t) => !t.parent || !ids.has(t.parent))
    .sort((a, b) => a.key.localeCompare(b.key))
    .forEach(visit);
  topics.forEach(visit);
  return result;
}
export function topicProblems(topics: Topic[]): string[] {
  const ids = new Set(topics.map((t) => t.id)),
    out: string[] = [];
  for (const t of topics) {
    if (t.parent && !ids.has(t.parent))
      out.push("Topic " + t.key + " has an unavailable parent.");
    const seen = new Set<string>();
    let n: Topic | undefined = t;
    while (n) {
      if (seen.has(n.id)) {
        out.push("Topic " + t.key + " contains a parent cycle.");
        break;
      }
      seen.add(n.id);
      n = topics.find((t) => t.id === n!.parent);
    }
  }
  return [...new Set(out)];
}
export function members(snapshot: Snapshot, s: Selection) {
  const descendants = s.topic
    ? topicDescendants(snapshot.topics, s.topic)
    : null;
  const match = (family: string, subtype: string, topic: string) =>
    (!s.family || s.family === family) &&
    (!s.subtype ||
      (s.subtype === "__unclassified__"
        ? !subtypeList(family).some((t) => t.id === subtype)
        : s.subtype === subtype)) &&
    (!descendants || descendants.has(topic));
  return snapshot.entries
    .map((e) => ({
      entry: e,
      authored: match(e.family, e.subtype, e.topic),
      live: e.publications.filter((p) => match(p.family, p.subtype, p.topic)),
    }))
    .filter((x) => x.authored || x.live.length);
}
export function hasAuthoringWork(entry: Entry, l: Locale) {
  return (
    entry.languages[l].present &&
    (!entry.publications.some((p) => p.locale === l) ||
      entry.languages[l].changed ||
      entry.languages[l].state === "review")
  );
}
export function metrics(snapshot: Snapshot, s: Selection = {}): Metrics {
  const rows = members(snapshot, s),
    authored = rows.filter((r) => r.authored),
    live = rows.filter((r) => r.live.length);
  const nodes = FAMILIES.filter((f) => !s.family || f.key === s.family).flatMap(
    (f) =>
      subtypeList(f.key)
        .filter((t) => !s.subtype || s.subtype === t.id)
        .map((t) => f.key + "/" + t.id),
  );
  const targetFor = (locale: Locale) => {
    if (s.topic || s.subtype === "__unclassified__") return null;
    const values = nodes
      .map((k) => snapshot.plan.targets[k]?.[locale])
      .filter((n): n is number => n !== undefined);
    return values.length ? values.reduce((a, b) => a + b, 0) : null;
  };
  const languages = Object.fromEntries(
    LANGUAGES.map((l) => {
      const target = targetFor(l),
        published = rows.filter((r) =>
          r.live.some((p) => p.locale === l),
        ).length;
      return [
        l,
        {
          present: authored.filter((r) => r.entry.languages[l].present).length,
          complete: authored.filter((r) => r.entry.languages[l].complete)
            .length,
          published,
          public: rows.filter((r) =>
            r.live.some((p) => p.locale === l && p.public),
          ).length,
          missing: authored.filter((r) => !r.entry.languages[l].present).length,
          draft: authored.filter((r) => hasAuthoringWork(r.entry, l)).length,
          changed: authored.filter(
            (r) =>
              r.entry.languages[l].changed &&
              r.entry.publications.some((p) => p.locale === l),
          ).length,
          target,
          gap:
            target === null
              ? 0
              : nodes.reduce((sum, key) => {
                  const goal = snapshot.plan.targets[key]?.[l];
                  if (goal === undefined) return sum;
                  const [family, subtype] = key.split("/");
                  const n = snapshot.entries.filter((e) =>
                    e.publications.some(
                      (p) =>
                        p.family === family &&
                        p.subtype === subtype &&
                        p.locale === l,
                    ),
                  ).length;
                  return sum + Math.max(0, goal - n);
                }, 0),
        },
      ];
    }),
  ) as Metrics["languages"];
  // Summing leaf gaps prevents a surplus in one branch from hiding a different empty branch.
  const leafGaps = LANGUAGES.reduce((n, l) => n + languages[l].gap, 0);
  const targetValues = LANGUAGES.map((l) => languages[l].target).filter(
      (x): x is number => x !== null,
    ),
    target = targetValues.length
      ? targetValues.reduce((a, b) => a + b, 0)
      : null;
  const status = !rows.length
    ? "empty"
    : !live.length
      ? "pipeline"
      : leafGaps
        ? "thin"
        : target !== null
          ? "healthy"
          : "populated";
  return {
    authored: authored.length,
    published: live.length,
    editions: rows.reduce((n, r) => n + r.live.length, 0),
    drafts: authored.filter((r) =>
      LANGUAGES.some((l) => hasAuthoringWork(r.entry, l)),
    ).length,
    changed: authored.filter((r) =>
      LANGUAGES.some(
        (l) =>
          r.entry.publications.some((p) => p.locale === l) &&
          r.entry.languages[l].changed,
      ),
    ).length,
    unclassified: authored.filter(
      (r) => !subtypeList(r.entry.family).some((t) => t.id === r.entry.subtype),
    ).length,
    languages,
    target,
    gap: leafGaps,
    status,
  };
}
export function coverageCSV(snapshot: Snapshot) {
  const rows: unknown[][] = [
    [
      "category",
      "subcategory",
      "authored_dossiers",
      "active_published_dossiers",
      "draft_dossiers",
      "locale",
      "authored_editions",
      "complete_translations",
      "published_editions",
      "public_discovery_editions",
      "missing_editions",
      "target",
      "deficit",
      "refreshed_at",
    ],
  ];
  for (const f of FAMILIES)
    for (const t of subtypeList(f.key)) {
      const m = metrics(snapshot, { family: f.key, subtype: t.id });
      for (const l of LANGUAGES) {
        const v = m.languages[l];
        rows.push([
          f.key,
          t.id,
          m.authored,
          m.published,
          m.drafts,
          l,
          v.present,
          v.complete,
          v.published,
          v.public,
          v.missing,
          v.target ?? "",
          v.gap,
          snapshot.at,
        ]);
      }
    }
  return rows
    .map((row) =>
      row
        .map((v) => '"' + String(v ?? "").replaceAll('"', '""') + '"')
        .join(","),
    )
    .join("\r\n");
}
