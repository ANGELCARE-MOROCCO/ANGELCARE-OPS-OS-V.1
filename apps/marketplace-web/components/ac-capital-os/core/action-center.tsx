"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type CapitalCommandStatus =
  | "running"
  | "awaiting-approval"
  | "completed"
  | "completed-with-warnings"
  | "blocked"
  | "failed"
  | "cancelled";

export type CapitalCommandEvent = {
  id: string;
  title: string;
  message: string;
  status: CapitalCommandStatus;
  workspaceKey: string;
  route: string;
  stage: string;
  startedAt: string;
  completedAt?: string | null;
  actionHref?: string | null;
  auditRef?: string | null;
  affectedRecords?: number | null;
  detail?: Record<string, unknown> | null;
  read?: boolean;
};

const EVENT_NAME = "ac-capital-command-event";
const STORAGE_KEY = "ac-capital-os:command-activity:v1";
const MAX_LOCAL_EVENTS = 80;

function browserReady() {
  return typeof window !== "undefined";
}

function normalizeEvent(value: unknown): CapitalCommandEvent | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const id = String(row.id || row.client_action_id || "").trim();
  if (!id) return null;
  const rawStatus = String(row.status || "failed").replaceAll("_", "-") as CapitalCommandStatus;
  const allowed: CapitalCommandStatus[] = ["running", "awaiting-approval", "completed", "completed-with-warnings", "blocked", "failed", "cancelled"];
  return {
    id,
    title: String(row.title || "Capital command"),
    message: String(row.message || row.summary || "Command evidence recorded."),
    status: allowed.includes(rawStatus) ? rawStatus : "failed",
    workspaceKey: String(row.workspaceKey || row.workspace_key || "ac-capital-os"),
    route: String(row.route || "/ac-capital-os"),
    stage: String(row.stage || "recorded"),
    startedAt: String(row.startedAt || row.started_at || row.created_at || new Date().toISOString()),
    completedAt: row.completedAt || row.completed_at ? String(row.completedAt || row.completed_at) : null,
    actionHref: row.actionHref || row.action_href ? String(row.actionHref || row.action_href) : null,
    auditRef: row.auditRef || row.audit_ref ? String(row.auditRef || row.audit_ref) : null,
    affectedRecords: row.affectedRecords == null && row.affected_records == null ? null : Number(row.affectedRecords ?? row.affected_records),
    detail: row.detail && typeof row.detail === "object" ? row.detail as Record<string, unknown> : row.detail_json && typeof row.detail_json === "object" ? row.detail_json as Record<string, unknown> : null,
    read: Boolean(row.read ?? row.is_read),
  };
}

function readLocalEvents() {
  if (!browserReady()) return [] as CapitalCommandEvent[];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeEvent).filter(Boolean) as CapitalCommandEvent[];
  } catch {
    return [];
  }
}

function writeLocalEvents(events: CapitalCommandEvent[]) {
  if (!browserReady()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(0, MAX_LOCAL_EVENTS)));
  } catch {
    // Browser storage is a resilience fallback; server persistence remains authoritative.
  }
}

function mergeEvents(current: CapitalCommandEvent[], incoming: CapitalCommandEvent[]) {
  const merged = new Map<string, CapitalCommandEvent>();
  for (const item of [...incoming, ...current]) {
    const existing = merged.get(item.id);
    if (!existing || new Date(item.completedAt || item.startedAt).getTime() >= new Date(existing.completedAt || existing.startedAt).getTime()) {
      merged.set(item.id, { ...existing, ...item });
    }
  }
  return Array.from(merged.values())
    .sort((left, right) => new Date(right.completedAt || right.startedAt).getTime() - new Date(left.completedAt || left.startedAt).getTime())
    .slice(0, MAX_LOCAL_EVENTS);
}

export function createCapitalCommandId() {
  if (browserReady() && typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `ac-command-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function emitCapitalCommandEvent(event: CapitalCommandEvent) {
  if (!browserReady()) return;
  const next = mergeEvents(readLocalEvents(), [event]);
  writeLocalEvents(next);
  window.dispatchEvent(new CustomEvent<CapitalCommandEvent>(EVENT_NAME, { detail: event }));
}

export async function persistCapitalCommandEvent(event: CapitalCommandEvent) {
  if (!browserReady()) return;
  try {
    await fetch("/api/ac-capital-os/command-activity", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(event),
      keepalive: event.status !== "running",
    });
  } catch {
    // The command remains visible through the local event fallback.
  }
}

export function useCapitalCommandCenter() {
  const [events, setEvents] = useState<CapitalCommandEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setEvents(readLocalEvents());
    const controller = new AbortController();
    void fetch("/api/ac-capital-os/command-activity?limit=60", { cache: "no-store", signal: controller.signal, headers: { Accept: "application/json" } })
      .then(async (response) => response.ok ? response.json() : null)
      .then((payload) => {
        const rows = Array.isArray(payload?.data?.events) ? payload.data.events : [];
        const normalized = rows.map(normalizeEvent).filter(Boolean) as CapitalCommandEvent[];
        setEvents((current) => {
          const next = mergeEvents(current, normalized);
          writeLocalEvents(next);
          return next;
        });
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));

    const listener = (rawEvent: Event) => {
      const event = normalizeEvent((rawEvent as CustomEvent<CapitalCommandEvent>).detail);
      if (!event) return;
      setEvents((current) => {
        const next = mergeEvents(current, [event]);
        writeLocalEvents(next);
        return next;
      });
    };
    window.addEventListener(EVENT_NAME, listener);
    return () => {
      controller.abort();
      window.removeEventListener(EVENT_NAME, listener);
    };
  }, []);

  const markRead = useCallback((id: string) => {
    setEvents((current) => {
      const next = current.map((item) => item.id === id ? { ...item, read: true } : item);
      writeLocalEvents(next);
      return next;
    });
    void fetch("/api/ac-capital-os/command-activity", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ id, read: true }),
    }).catch(() => undefined);
  }, []);

  const markAllRead = useCallback(() => {
    setEvents((current) => {
      const next = current.map((item) => ({ ...item, read: true }));
      writeLocalEvents(next);
      return next;
    });
    void fetch("/api/ac-capital-os/command-activity", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ all: true, read: true }),
    }).catch(() => undefined);
  }, []);

  const running = useMemo(() => events.filter((item) => item.status === "running"), [events]);
  const unread = useMemo(() => events.filter((item) => !item.read && item.status !== "running").length, [events]);
  const latestToast = useMemo(() => events.find((item) => !item.read && item.status !== "running") || null, [events]);

  return { events, loading, running, unread, latestToast, markRead, markAllRead };
}
