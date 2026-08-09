"use client";
import { shouldStartAutoRefresh, safeRefreshInterval } from '@/lib/runtime/client-live-governor'

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSaasFactoryOptions, saveLiveOption } from "@/lib/saas-factory/client";

export type LiveOption = {
  id?: string;
  group_key?: string;
  value: string;
  label: string;
  is_enabled?: boolean;
  metadata_json?: Record<string, unknown>;
  availability_scope?: string[];
};

export function useSaasFactoryLiveOptions(group: string, pollMs = 30000) {
  const [options, setOptions] = useState<LiveOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const data = await getSaasFactoryOptions(group);
      setOptions(Array.isArray(data.options) ? data.options : Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [group]);

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
    async (label: string, metadata_json: Record<string, unknown> = {}) => {
      const result = await saveLiveOption({ group_key: group, label, metadata_json });
      await refresh();
      return result;
    },
    [group, refresh]
  );

  return {
    options,
    enabledOptions,
    loading,
    error,
    refresh,
    addOption,
  };
}
