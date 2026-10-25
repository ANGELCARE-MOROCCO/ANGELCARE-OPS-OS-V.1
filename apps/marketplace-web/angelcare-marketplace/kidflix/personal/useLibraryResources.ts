"use client";
import { useEffect, useState } from "react";
import { WORLDS, type Locale, type Resource } from "../catalogue";
import { KEY_PATTERN } from "../journey/contract";
export async function readLibraryResources(
  keys: string[],
  locale: Locale,
  signal?: AbortSignal,
  reader: typeof fetch = fetch,
) {
  const clean = [...new Set(keys.filter((k) => KEY_PATTERN.test(k)))].slice(
    0,
    2000,
  );
  const jobs: URLSearchParams[] = [];
  for (let i = 0; i < clean.length; i += 100) {
    const chunk = clean.slice(i, i + 100);
    for (let page = 1; page <= Math.ceil(chunk.length / 24); page++)
      jobs.push(
        new URLSearchParams({
          locale,
          keys: chunk.join(","),
          page: String(page),
        }),
      );
  }
  const all: Resource[] = [];
  for (let i = 0; i < jobs.length; i += 4) {
    const batches = await Promise.all(
      jobs.slice(i, i + 4).map(async (q) => {
        const r = await reader("/api/kidflix/discovery?" + q, {
          signal,
          cache: "no-store",
        });
        if (!r.ok) throw Error("LIBRARY_READ_FAILED");
        const v = await r.json();
        if (!Array.isArray(v.rows)) throw Error("INVALID_LIBRARY_RESPONSE");
        const wanted = new Set((q.get("keys") || "").split(","));
        return v.rows.filter(
          (x: any) =>
            x &&
            wanted.has(x.key) &&
            typeof x.title === "string" &&
            WORLDS.some((w) => w.key === x.family),
        ) as Resource[];
      }),
    );
    all.push(...batches.flat());
  }
  const by = new Map(all.map((r) => [r.key, r]));
  return clean.flatMap((k) => (by.has(k) ? [by.get(k)!] : []));
}
export function useLibraryResources(keys: string[], locale: Locale) {
  const signature = JSON.stringify([...new Set(keys)].sort()),
    [data, set] = useState<Resource[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false),
    [revision, refresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    set([]);
    setError(false);
    const ids: string[] = JSON.parse(signature);
    if (!ids.length) {
      setBusy(false);
      return;
    }
    setBusy(true);
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
      setBusy(false);
      setError(true);
    }, 45000);
    readLibraryResources(ids, locale, controller.signal)
      .then((v) => {
        if (!controller.signal.aborted) set(v);
      })
      .catch(() => {
        if (!controller.signal.aborted || timedOut) setError(true);
      })
      .finally(() => {
        clearTimeout(timer);
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [signature, locale, revision]);
  return { data, busy, error, retry: () => refresh((n) => n + 1) };
}
