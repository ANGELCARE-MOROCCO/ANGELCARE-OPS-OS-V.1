"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getEnvelope } from "./api";
import type { ApiEnvelope } from "./types";

export function useWorkspace<T = Record<string, unknown>>(url: string) {
  const [envelope, setEnvelope] = useState<ApiEnvelope<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const controllerRef = useRef<AbortController | null>(null);
  const requestRef = useRef(0);

  const refresh = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const requestId = ++requestRef.current;
    setLoading(true);
    setError("");
    try {
      const next = await getEnvelope<T>(url, controller.signal);
      if (requestId === requestRef.current) setEnvelope(next);
      return next;
    } catch (reason) {
      if (controller.signal.aborted) return null;
      if (requestId === requestRef.current) setError(reason instanceof Error ? reason.message : "Unable to load AC CAPITAL OS data.");
      return null;
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    void refresh();
    return () => controllerRef.current?.abort();
  }, [refresh]);

  return { envelope, loading, error, refresh };
}
