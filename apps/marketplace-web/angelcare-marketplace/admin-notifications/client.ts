"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { API_PATH } from "./registry";
import type { Cursor, Feed, Filter } from "./model";
export async function request<T>(
  params: string,
  command?: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(API_PATH + params, {
    method: command ? "POST" : "GET",
    credentials: "same-origin",
    cache: "no-store",
    headers: command ? { "Content-Type": "application/json" } : undefined,
    body: command ? JSON.stringify(command) : undefined,
    signal,
    keepalive: !!command,
  });
  const json = await response.json().catch(() => null);
  if (!response.ok || json?.ok === false) {
    const e = new Error(
      json?.error?.message || "NOTIFICATION_UNAVAILABLE",
    ) as Error & { status?: number };
    e.status = response.status;
    throw e;
  }
  return (json?.data ?? json) as T;
}
const notify = () => {
  window.dispatchEvent(new Event("ac-notifications-changed"));
  try {
    const b = new BroadcastChannel("ac-notifications-r1");
    b.postMessage("invalidate");
    b.close();
  } catch {}
};
export function useNotifications(
  open: boolean,
  filter: Filter,
  reading: () => boolean,
) {
  const failures = useRef(0);
  const [feed, setFeed] = useState<Feed | null>(null),
    [error, setError] = useState(false),
    [busy, setBusy] = useState(false),
    [arrivals, setArrivals] = useState(false);
  const feedRef = useRef<Feed | null>(null);
  const staged = useRef<Feed | null>(null),
    version = useRef(0),
    abort = useRef<AbortController | null>(null),
    filterKey = JSON.stringify(filter),
    filterRef = useRef(filter);
  filterRef.current = filter;
  const refresh = useCallback(
    async (force = false, cursor?: Cursor) => {
      const serial = ++version.current;
      abort.current?.abort();
      const controller = new AbortController();
      abort.current = controller;
      const p = new URLSearchParams({ ...filterRef.current });
      if (cursor) p.set("cursor", cursor);
      try {
        const next = await request<Feed>("?" + p, undefined, controller.signal);
        if (serial !== version.current) return;
        setError(false);
        failures.current = 0;
        const prev = feedRef.current;
        let visible = next;
        if (cursor && prev) {
          const byId = new Map(prev.items.map((n) => [n.id, n]));
          next.items.forEach((n) => byId.set(n.id, n));
          visible = { ...next, items: [...byId.values()] };
        } else if (
          !force &&
          prev &&
          reading() &&
          JSON.stringify(prev.items) !== JSON.stringify(next.items)
        ) {
          staged.current = next;
          setArrivals(true);
          visible = { ...next, items: prev.items, cursor: prev.cursor };
        } else {
          staged.current = null;
          setArrivals(false);
        }
        feedRef.current = visible;
        setFeed(visible);
      } catch (e) {
        if (controller.signal.aborted) return;
        setError(true);
        failures.current = Math.min(5, failures.current + 1);
        if ([401, 403, 404].includes((e as { status?: number }).status || 0)) {
          feedRef.current = null;
          setFeed(null);
          staged.current = null;
          setArrivals(false);
        }
      }
    },
    [reading],
  );
  useEffect(() => {
    staged.current = null;
    setArrivals(false);
    void refresh(true);
  }, [filterKey, refresh]);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (!document.hidden && navigator.onLine) void refresh();
      timer = setTimeout(
        tick,
        Math.min(120000, (open ? 10000 : 30000) * 2 ** failures.current) +
          Math.random() * 1500,
      );
    };
    timer = setTimeout(tick, open ? 10000 : 30000);
    const visible = () => {
      if (!document.hidden && navigator.onLine) void refresh();
    };
    const changed = () => {
      void refresh(true);
    };
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("focus", visible);
    window.addEventListener("online", visible);
    window.addEventListener("ac-notifications-changed", changed);
    let channel: BroadcastChannel | undefined;
    try {
      channel = new BroadcastChannel("ac-notifications-r1");
      channel.onmessage = changed;
    } catch {}
    return () => {
      clearTimeout(timer);
      abort.current?.abort();
      channel?.close();
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("focus", visible);
      window.removeEventListener("online", visible);
      window.removeEventListener("ac-notifications-changed", changed);
    };
  }, [open, refresh]);
  const command = useCallback(async (data: Record<string, unknown>) => {
    setBusy(true);
    const body = { ...data, requestId: crypto.randomUUID() };
    try {
      let result;
      try {
        result = await request<Record<string, unknown>>("", body);
      } catch (e) {
        if ((e as { status?: number }).status) throw e;
        result = await request<Record<string, unknown>>("", body);
      }
      notify();
      return result;
    } finally {
      setBusy(false);
    }
  }, []);
  const showArrivals = () => {
    if (staged.current) {
      feedRef.current = staged.current;
      setFeed(staged.current);
      staged.current = null;
    }
    setArrivals(false);
  };
  return { feed, error, busy, arrivals, refresh, command, showArrivals };
}
