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
        if (
          v.rows.some(
            (x: any) =>
              !x ||
              typeof x.key !== "string" ||
              typeof x.title !== "string" ||
              !x.title.trim() ||
              !WORLDS.some((w) => w.key === x.family) ||
              !Array.isArray(x.skills) ||
              !x.skills.every((value: unknown) => typeof value === "string") ||
              !Array.isArray(x.formats) ||
              !x.formats.every((value: unknown) => typeof value === "string"),
          )
        ) {
          throw Error("INVALID_LIBRARY_RESOURCE");
        }
        return v.rows.filter((x: Resource) => wanted.has(x.key)) as Resource[];
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
    [revision, refresh] = useState(0),
    [settled, setSettled] = useState("");
  const requestKey = locale + ":" + revision + ":" + signature;
  useEffect(() => {
    const controller = new AbortController();
    set([]);
    setError(false);
    const ids: string[] = JSON.parse(signature);
    if (!ids.length) {
      setBusy(false);
      setSettled(requestKey);
      return;
    }
    setBusy(true);
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
      setBusy(false);
      setError(true);
      setSettled(requestKey);
    }, 45000);
    readLibraryResources(ids, locale, controller.signal)
      .then((v) => {
        if (!controller.signal.aborted) {
          set(v);
          setSettled(requestKey);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted || timedOut) {
          setError(true);
          setSettled(requestKey);
        }
      })
      .finally(() => {
        clearTimeout(timer);
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [signature, locale, revision, requestKey]);
  return {
    data,
    busy: busy || (keys.length > 0 && settled !== requestKey),
    error,
    retry: () => refresh((n) => n + 1),
  };
}
