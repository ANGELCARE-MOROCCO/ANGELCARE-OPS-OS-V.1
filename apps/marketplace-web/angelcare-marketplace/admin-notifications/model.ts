import { SOURCE_BY_ID, type World } from "./registry";
export type Locale = "fr" | "en" | "ar";
export type Severity = "info" | "positive" | "attention" | "critical";
export interface Notice {
  id: string;
  source: string;
  world: World;
  safe: Record<string, string | number | boolean>;
  severity: Severity;
  actionable: boolean;
  version: number;
  eventCount: number;
  at: string;
  unread: boolean;
  pinned: boolean;
}
export interface Filter {
  world: string;
  view: string;
  source: string;
  severity: string;
  query: string;
}
export type Cursor = string;
export interface Preferences {
  locale?: Locale;
  muted_sources?: string[];
  quiet_start?: number | null;
  quiet_end?: number | null;
}
export interface Feed {
  items: Notice[];
  cursor: Cursor | null;
  counts: {
    unread: number;
    critical: number;
    actionable: number;
    worlds: Partial<Record<World, number>>;
  };
  health: {
    sources: {
      id: string;
      state: string;
      reason: string;
      lastCapture: string | null;
      checkedAt: string;
    }[];
    worker: { lastSuccess: string | null; stale: boolean };
    pending: number;
    failed: number;
    oldestPending: string | null;
  };
  preferences: Preferences;
  generatedAt: string;
  locale: Locale;
  canManage?: boolean;
  rules?: Record<
    string,
    { minimumSeverity: string; expiryWarningDays: number; version: number }
  >;
}
export interface Focus {
  id: string;
  source: string;
  world: World;
  version: number;
  eventCount: number;
  safe: Notice["safe"];
  current: Notice["safe"] | null;
  deleted: boolean;
  at: string;
  events: {
    id: number;
    safe: Notice["safe"];
    severity: Severity;
    at: string;
  }[];
}
export const EMPTY_FILTER: Filter = {
  world: "all",
  view: "unread",
  source: "",
  severity: "all",
  query: "",
};
export function normalizeFilter(input: Record<string, unknown>): Filter {
  const pick = (key: string, allowed: string[], fallback: string) =>
    typeof input[key] === "string" && allowed.includes(input[key] as string)
      ? (input[key] as string)
      : fallback;
  return {
    world: pick("world", ["all", "angelcare", "kidflix", "jobkix"], "all"),
    view: pick(
      "view",
      ["unread", "action", "critical", "all", "archived"],
      "unread",
    ),
    source:
      typeof input.source === "string" && SOURCE_BY_ID.has(input.source)
        ? input.source
        : "",
    severity: pick(
      "severity",
      ["all", "info", "positive", "attention", "critical"],
      "all",
    ),
    query:
      typeof input.query === "string" ? input.query.trim().slice(0, 100) : "",
  };
}
export const isUuid = (v: unknown): v is string =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v,
  );
export function coverage(feed: Feed) {
  const blocked = feed.health.sources.filter((s) => s.state !== "connected");
  const lag =
    !!feed.health.oldestPending &&
    Date.now() - Date.parse(feed.health.oldestPending) > 60000;
  return {
    blocked: blocked.length,
    stale: feed.health.worker.stale,
    pending: feed.health.pending,
    lag,
    complete:
      !blocked.length &&
      !feed.health.worker.stale &&
      !feed.health.failed &&
      !lag,
  };
}
export function badge(feed: Feed | null) {
  if (!feed) return "—";
  const n = feed.counts.unread;
  return n > 99
    ? "99+"
    : n > 0
      ? String(n)
      : coverage(feed).complete
        ? ""
        : "!";
}
export function destination(
  source: string,
  current: Record<string, unknown> | null,
  id: string,
) {
  const s = SOURCE_BY_ID.get(source);
  if (!s || !isUuid(id)) throw new Error("INVALID_NOTIFICATION_TARGET");
  let path = s.route;
  // These IDs are verified native detail identities. Other native areas use the shared exact-record focus companion.
  if (current && isUuid(current.id)) {
    if (source === "angelcare_marketplace_journeys")
      path = "/angelcare-marketplace/admin/orders/" + current.id;
    if (source === "angelcare_marketplace_customer_accounts")
      path = "/angelcare-marketplace/admin/customers/" + current.id;
  }
  if (current?.type === "SANILA_DEMO_REQUEST")
    path = "/angelcare-marketplace/admin/sanila/requests";
  const p = new URLSearchParams({ acNotice: id });
  if (source === "ac_dce_records" && current && isUuid(current.id))
    p.set("record", current.id);
  return path + "?" + p.toString();
}

export function quietNow(p: Preferences, now = new Date()) {
  if (
    p.quiet_start == null ||
    p.quiet_end == null ||
    p.quiet_start === p.quiet_end
  )
    return false;
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Casablanca",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(now),
  );
  return p.quiet_start < p.quiet_end
    ? hour >= p.quiet_start && hour < p.quiet_end
    : hour >= p.quiet_start || hour < p.quiet_end;
}
