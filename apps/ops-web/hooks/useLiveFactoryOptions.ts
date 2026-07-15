"use client";
import { shouldStartAutoRefresh, safeRefreshInterval } from '@/lib/runtime/client-live-governor'

import { useCallback, useEffect, useMemo, useState } from "react";

export type LiveFactoryOption = {
  id?: string;
  group_key?: string;
  value: string;
  label: string;
  description?: string | null;
  sort_order?: number;
  color?: string | null;
  icon?: string | null;
  metadata_json?: Record<string, unknown>;
  availability_scope?: string[];
  is_default?: boolean;
  is_enabled?: boolean;
};

export function useLiveFactoryOptions(group: string, moduleKey?: string, pollMs = 30000) {
  const [options, setOptions] = useState<LiveFactoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const params = new URLSearchParams({ group });
      if (moduleKey) params.set("module", moduleKey);

      const response = await fetch(`/api/saas-factory/live-options?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.ok === false) {
        throw new Error(data.error || `Failed to load ${group}`);
      }

      setOptions(Array.isArray(data.options) ? data.options : []);
      setLastSyncedAt(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [group, moduleKey]);

  useEffect(() => {
    let active = true;
    refresh();

    if (!shouldStartAutoRefresh()) return
    const id = window.setInterval(() => {
      if (active) refresh();
    }, safeRefreshInterval(pollMs));

    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [refresh, pollMs]);

  const enabledOptions = useMemo(
    () => options.filter((option) => option.is_enabled !== false),
    [options]
  );

  const addOption = useCallback(
    async (label: string, extra: Partial<LiveFactoryOption> = {}) => {
      setSaving(true);
      setError(null);
      try {
        const response = await fetch("/api/saas-factory/live-options", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            group_key: group,
            label,
            module_key: moduleKey,
            availability_scope: moduleKey ? [moduleKey] : extra.availability_scope,
            ...extra,
          }),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.ok === false) {
          throw new Error(data.error || "Failed to save option");
        }

        await refresh();
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [group, moduleKey, refresh]
  );

  return {
    options,
    enabledOptions,
    loading,
    saving,
    error,
    lastSyncedAt,
    refresh,
    addOption,
  };
}
