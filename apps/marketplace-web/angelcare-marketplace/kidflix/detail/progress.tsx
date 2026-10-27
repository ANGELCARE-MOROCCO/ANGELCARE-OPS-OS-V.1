"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { DEPTH_CONTRACT } from "../../digital-customer-experience/experience-depth";
import {
  obj,
  restoreDetailProgress,
  type DetailValue,
  type Row,
} from "./model";
import type { Locale } from "../catalogue";
import { hasStarted } from "../journey/contract";
export function progressKey(id: string, locale: Locale) {
  return "kidflix.progress.r1." + id + "." + locale;
}
export function useProgress(value: DetailValue, locale: Locale) {
  const m = value.manifest,
    d = obj(m.definition),
    key = progressKey(m.id, locale),
    mode = d.continuityPolicy === "device" ? "localStorage" : "sessionStorage",
    enabled = d.continuityPolicy !== "none";
  const [state, set] = useState<Row>({}),
    [ready, setReady] = useState(false),
    [error, setError] = useState(false),
    [recovery, setRecovery] = useState<Row | null>(null),
    pending = useRef(false);
  useEffect(() => {
    let restored: Row = {};
    try {
      if (enabled) {
        const old = restoreDetailProgress(
          JSON.parse(window[mode].getItem(key) || "null"),
          m.id,
          locale,
          m.revision,
          d,
        );
        if (old?.needsDecision) setRecovery(old.state);
        else if (old) restored = old.state;
      }
    } catch {
      setError(true);
    }
    set(restored);
    setReady(true);
  }, [key, mode, enabled]);
  useEffect(() => {
    if (ready && enabled && !recovery && hasStarted(state))
      window.dispatchEvent(
        new CustomEvent("kidflix:progress", {
          detail: {
            id: m.id,
            key: m.key,
            locale,
            revision: m.revision,
            at: Date.now(),
            complete: state.complete === true,
            started: true,
            prepared: state.prepared === true,
          },
        }),
      );
  }, [ready, key]);
  useEffect(() => {
    if (!ready || !enabled || recovery || !pending.current) return;
    const save = () => {
      if (!pending.current) return;
      try {
        const serialized = JSON.stringify({
          contract: DEPTH_CONTRACT,
          recordId: m.id,
          locale,
          revision: m.revision,
          savedAt: Date.now(),
          state,
        });
        if (serialized.length > 150000) throw Error("Progress too large");
        window[mode].setItem(key, serialized);
        window.dispatchEvent(
          new CustomEvent("kidflix:progress", {
            detail: {
              id: m.id,
              key: m.key,
              locale,
              revision: m.revision,
              at: Date.now(),
              complete: state.complete === true,
              started: hasStarted(state),
              prepared: state.prepared === true,
            },
          }),
        );
      } catch {
        setError(true);
      }
    };
    const timer = setTimeout(save, 250);
    window.addEventListener("pagehide", save);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pagehide", save);
      save();
    };
  }, [ready, state, recovery, enabled, key, mode, m.id, m.revision, locale]);
  useEffect(() => {
    const clear = () => {
      pending.current = false;
      set({});
      setRecovery(null);
    };
    const sync = (e: StorageEvent) => {
      if (e.key !== key) return;
      try {
        const next = restoreDetailProgress(
          JSON.parse(e.newValue || "null"),
          m.id,
          locale,
          m.revision,
          d,
        );
        pending.current = false;
        if (next?.needsDecision) setRecovery(next.state);
        else set(next?.state || {});
      } catch {
        setError(true);
      }
    };
    window.addEventListener("kidflix:cleared", clear);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("kidflix:cleared", clear);
      window.removeEventListener("storage", sync);
    };
  }, [key, m.id, m.revision, locale]);
  const update = useCallback((patch: Row) => {
    pending.current = true;
    set((old) => ({ ...old, ...patch, updatedAt: Date.now() }));
  }, []);
  const reset = useCallback(() => {
    pending.current = false;
    set({});
    setRecovery(null);
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
      window.dispatchEvent(
        new CustomEvent("kidflix:progress", {
          detail: {
            id: m.id,
            key: m.key,
            locale,
            revision: m.revision,
            at: Date.now(),
            complete: false,
            started: false,
            prepared: false,
          },
        }),
      );
    } catch {
      setError(true);
    }
  }, [key]);
  return {
    state,
    update,
    ready,
    error,
    recovery,
    restore: () => {
      pending.current = true;
      set(recovery || {});
      setRecovery(null);
    },
    reset,
  };
}
