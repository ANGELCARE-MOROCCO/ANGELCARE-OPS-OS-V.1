"use client";

import { useCallback, useEffect, useState } from "react";
import { getEnvelope } from "./api";
import type { ApiEnvelope } from "./types";

export function useWorkspace<T = Record<string, unknown>>(url: string) {
  const [envelope, setEnvelope] = useState<ApiEnvelope<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    try {
      const next = await getEnvelope<T>(url, controller.signal);
      setEnvelope(next);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load AC CAPITAL OS data.");
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, [url]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { envelope, loading, error, refresh };
}
