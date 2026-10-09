"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  DiscoveryItem,
  StorefrontExperience,
} from "../catalog-discovery/types";
import { safeIds } from "./contract";

export function useSelections(
  experience: StorefrontExperience,
  items: readonly DiscoveryItem[],
) {
  const [saved, setSaved] = useState<string[]>([]),
    [compared, setCompared] = useState<string[]>([]),
    [recent, setRecent] = useState<string[]>([]);
  const [pending, setPending] = useState<string[]>([]),
    [error, setError] = useState<"failed" | "limit" | null>(null);
  const locks = useRef(new Set<string>()),
    touched = useRef(new Set<string>()),
    generation = useRef(0);
  const scope = `${experience.key}:${experience.locale}:${experience.territoryCode || "default"}`,
    itemIds = items.map((i) => i.id).join("|");
  const live = useRef({
    saved,
    compared,
    allowed: new Set(items.map((i) => i.id)),
    scope,
  });
  live.current = {
    saved,
    compared,
    allowed: new Set(items.map((i) => i.id)),
    scope,
  };
  useEffect(() => {
    const current = ++generation.current,
      controller = new AbortController(),
      allowed = new Set(itemIds.split("|"));
    touched.current.clear();
    locks.current.clear();
    setPending([]);
    setSaved([]);
    setCompared([]);
    setError(null);
    try {
      setRecent(
        safeIds(
          localStorage.getItem(`ac.storefront.recent.v1:${scope}`),
          allowed,
        ),
      );
    } catch {
      setRecent([]);
    }
    void fetch("/api/angelcare-marketplace/homepage/engagement", {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw Error("Selection load failed");
        const payload: unknown = await response.json(),
          data =
            payload && typeof payload === "object" && "data" in payload
              ? (payload as { data: unknown }).data
              : null;
        if (!Array.isArray(data) || generation.current !== current) return;
        for (const [type, setter, limit] of [
          ["saved", setSaved, 80],
          ["compare", setCompared, 4],
        ] as const) {
          const incoming = data.flatMap((row) =>
            row &&
            row.selection_type === type &&
            typeof row.catalog_item_id === "string" &&
            allowed.has(row.catalog_item_id)
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
      .catch(() => {
        if (!controller.signal.aborted && generation.current === current)
          setError("failed");
      });
    return () => {
      controller.abort();
      generation.current++;
    };
  }, [scope, itemIds]);
  const select = useCallback(
    async (id: string, type: "saved" | "compare") => {
      const state = live.current,
        key = `${type}:${id}`,
        selected = type === "saved" ? state.saved : state.compared,
        active = !selected.includes(id);
      if (
        !state.allowed.has(id) ||
        locks.current.has(key) ||
        (type === "compare" &&
          [...locks.current].some((k) => k.startsWith("compare:")))
      )
        return;
      if (type === "compare" && active && selected.length >= 4) {
        setError("limit");
        return;
      }
      const current = generation.current,
        controller = new AbortController(),
        timer = window.setTimeout(() => controller.abort(), 15000);
      locks.current.add(key);
      touched.current.add(key);
      setPending([...locks.current]);
      setError(null);
      try {
        const response = await fetch(
          "/api/angelcare-marketplace/homepage/engagement",
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              event_name: "storefront.selection_changed",
              catalog_item_id: id,
              selection_type: type,
              active,
              locale: experience.locale,
              territory_code: experience.territoryCode || null,
              category_key: experience.key,
              route: `/angelcare-marketplace/${experience.locale}/${experience.key}`,
            }),
          },
        );
        if (!response.ok) throw Error("Selection failed");
        if (generation.current !== current) return;
        const setter = type === "saved" ? setSaved : setCompared;
        setter((previous) =>
          active
            ? [...new Set([...previous, id])].slice(
                0,
                type === "saved" ? 80 : 4,
              )
            : previous.filter((value) => value !== id),
        );
      } catch {
        if (generation.current === current) setError("failed");
      } finally {
        window.clearTimeout(timer);
        if (generation.current === current) {
          locks.current.delete(key);
          setPending([...locks.current]);
        }
      }
    },
    [experience.locale, experience.key, experience.territoryCode],
  );
  const remember = useCallback((id: string) => {
    if (!live.current.allowed.has(id)) return;
    setRecent((previous) => {
      const next = [id, ...previous.filter((value) => value !== id)].slice(
        0,
        20,
      );
      try {
        localStorage.setItem(
          `ac.storefront.recent.v1:${live.current.scope}`,
          JSON.stringify(next),
        );
      } catch {}
      return next;
    });
  }, []);
  return {
    saved,
    compared,
    recent,
    pending,
    error,
    select,
    remember,
    dismiss: () => setError(null),
  };
}
export type Selections = ReturnType<typeof useSelections>;
