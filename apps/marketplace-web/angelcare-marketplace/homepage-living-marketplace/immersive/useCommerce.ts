"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  HomepageExperience,
  HomepageItem,
} from "../../homepage-flagship/types";
import { safeIds } from "./contract";

export function useCommerce(
  experience: HomepageExperience,
  items: readonly HomepageItem[],
) {
  const allowed = new Set(items.map((item) => item.id));
  const scope = `${experience.locale}:${experience.territory?.territory_code || "default"}`;
  const [saved, setSaved] = useState(() =>
    experience.selection.saved.filter((id) => allowed.has(id)).slice(0, 120),
  );
  const [compared, setCompared] = useState(() =>
    experience.selection.compare.filter((id) => allowed.has(id)).slice(0, 4),
  );
  const [recent, setRecent] = useState<string[]>([]);
  const [pending, setPending] = useState<string[]>([]);
  const [error, setError] = useState<"failed" | "compareLimit" | null>(null);
  const locks = useRef(new Set<string>());
  const touched = useRef(new Set<string>());
  const generation = useRef(0);
  const live = useRef({ saved, compared, allowed, scope });
  live.current = { saved, compared, allowed, scope };
  const itemIds = items.map((item) => item.id).join("|");
  const initialSaved = experience.selection.saved.join("|"),
    initialCompare = experience.selection.compare.join("|");
  useEffect(() => {
    const allowedNow = new Set(itemIds.split("|")),
      controller = new AbortController(),
      current = ++generation.current;
    touched.current.clear();
    locks.current.clear();
    setPending([]);
    setError(null);
    setSaved(
      initialSaved
        .split("|")
        .filter((id) => allowedNow.has(id))
        .slice(0, 120),
    );
    setCompared(
      initialCompare
        .split("|")
        .filter((id) => allowedNow.has(id))
        .slice(0, 4),
    );
    try {
      setRecent(
        safeIds(localStorage.getItem(`ac.home.recent.v1:${scope}`), allowedNow),
      );
    } catch {
      setRecent([]);
    }
    void fetch("/api/angelcare-marketplace/homepage/engagement", {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return;
        const payload: unknown = await response.json();
        const rows =
          payload && typeof payload === "object" && "data" in payload
            ? (payload as { data: unknown }).data
            : null;
        if (!Array.isArray(rows) || generation.current !== current) return;
        for (const [type, setter, limit] of [
          ["saved", setSaved, 120],
          ["compare", setCompared, 4],
        ] as const) {
          const incoming = rows.flatMap((row) =>
            row &&
            typeof row === "object" &&
            row.selection_type === type &&
            typeof row.catalog_item_id === "string" &&
            allowedNow.has(row.catalog_item_id)
              ? [row.catalog_item_id as string]
              : [],
          );
          setter((previous) =>
            [
              ...new Set([
                ...previous.filter((id) =>
                  touched.current.has(`${type}:${id}`),
                ),
                ...incoming.filter(
                  (id) => !touched.current.has(`${type}:${id}`),
                ),
              ]),
            ].slice(0, limit),
          );
        }
      })
      .catch(() => undefined);
    return () => {
      controller.abort();
      generation.current++;
    };
  }, [scope, itemIds, initialSaved, initialCompare]);
  const select = useCallback(
    async (id: string, type: "saved" | "compare") => {
      const {
        saved: currentSaved,
        compared: currentCompared,
        allowed: currentAllowed,
      } = live.current;
      if (!currentAllowed.has(id)) return;
      const key = `${type}:${id}`,
        selected = type === "saved" ? currentSaved : currentCompared,
        active = !selected.includes(id);
      if (
        locks.current.has(key) ||
        (type === "compare" &&
          [...locks.current].some((key) => key.startsWith("compare:")))
      )
        return;
      if (type === "compare" && active && selected.length >= 4) {
        setError("compareLimit");
        return;
      }
      const currentGeneration = generation.current;
      locks.current.add(key);
      touched.current.add(key);
      setPending([...locks.current]);
      setError(null);
      const controller = new AbortController(),
        timeout = window.setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(
          "/api/angelcare-marketplace/homepage/engagement",
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              event_name: "living_home.selection_changed",
              catalog_item_id: id,
              selection_type: type,
              active,
              locale: experience.locale,
              territory_code: experience.territory?.territory_code || null,
              page_key: "homepage",
            }),
          },
        );
        if (!response.ok) throw Error("Selection failed");
        if (generation.current !== currentGeneration) return;
        const setter = type === "saved" ? setSaved : setCompared;
        setter((previous) =>
          active
            ? [...new Set([...previous, id])].slice(
                0,
                type === "saved" ? 120 : 4,
              )
            : previous.filter((value) => value !== id),
        );
      } catch {
        if (generation.current === currentGeneration) setError("failed");
      } finally {
        window.clearTimeout(timeout);
        if (generation.current === currentGeneration) {
          locks.current.delete(key);
          setPending([...locks.current]);
        }
      }
    },
    [experience.locale, experience.territory?.territory_code],
  );
  const remember = useCallback((id: string) => {
    if (!live.current.allowed.has(id)) return;
    setRecent((previous) => {
      const next = [id, ...previous.filter((value) => value !== id)].slice(
        0,
        12,
      );
      try {
        localStorage.setItem(
          `ac.home.recent.v1:${live.current.scope}`,
          JSON.stringify(next),
        );
      } catch {
        /* Discovery remains usable without storage. */
      }
      return next;
    });
  }, []);
  const clearRecent = useCallback(() => {
    setRecent([]);
    try {
      localStorage.removeItem(`ac.home.recent.v1:${live.current.scope}`);
    } catch {
      /* No storage dependency. */
    }
  }, []);
  return {
    saved,
    compared,
    recent,
    pending,
    error,
    select,
    remember,
    clearRecent,
    dismissError: () => setError(null),
  };
}
export type CommerceState = ReturnType<typeof useCommerce>;
