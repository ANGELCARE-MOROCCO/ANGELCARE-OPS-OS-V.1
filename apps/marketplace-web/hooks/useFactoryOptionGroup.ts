"use client";

import { useCallback, useEffect, useState } from "react";

export type FactoryOption = {
  id?: string;
  group_key?: string;
  value: string;
  label: string;
  description?: string | null;
  availability_scope?: string[];
  metadata_json?: Record<string, unknown>;
  is_enabled?: boolean;
};

export function useFactoryOptionGroup(group: string, moduleKey?: string) {
  const [options, setOptions] = useState<FactoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const params = new URLSearchParams({ group });
      if (moduleKey) params.set("module", moduleKey);
      const response = await fetch(`/api/saas-factory/phase9/options?${params.toString()}`, { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok === false) throw new Error(data.error || "Failed to load factory options");
      setOptions(Array.isArray(data.options) ? data.options : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [group, moduleKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { options, loading, error, refresh };
}
