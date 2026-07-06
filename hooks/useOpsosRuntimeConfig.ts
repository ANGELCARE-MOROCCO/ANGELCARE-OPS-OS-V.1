"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import type { OpsosRuntimeConfigSnapshot, OpsosRuntimeMutation } from "@/lib/opsos-control-plane/runtime-types"

type RuntimeConfigState = {
  loading: boolean
  error: string | null
  snapshot: OpsosRuntimeConfigSnapshot | null
}

function buildQuery(params: Record<string, string | undefined>) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value)
  })
  const query = search.toString()
  return query ? `?${query}` : ""
}

export function useOpsosRuntimeConfig(options: {
  route?: string
  modal?: string
  module?: string
  api?: string
  pollMs?: number
  enabled?: boolean
} = {}) {
  const pathname = usePathname()
  const route = options.route || pathname || "global"
  const enabled = options.enabled !== false
  const pollMs = Math.max(0, Number(options.pollMs || 0))
  const mountedRef = useRef(false)
  const [state, setState] = useState<RuntimeConfigState>({ loading: true, error: null, snapshot: null })

  const load = useCallback(async () => {
    if (!enabled) return
    try {
      setState((current) => ({ ...current, loading: !current.snapshot, error: null }))
      const query = buildQuery({ route, modal: options.modal, module: options.module, api: options.api })
      const response = await fetch(`/api/opsos-control-plane/runtime-config${query}`, { cache: "no-store" })
      const json = await response.json()
      if (!response.ok || json?.ok === false) throw new Error(json?.error || "Unable to load OPSOS runtime config")
      if (!mountedRef.current) return
      setState({ loading: false, error: null, snapshot: json })
    } catch (error) {
      if (!mountedRef.current) return
      setState((current) => ({ ...current, loading: false, error: error instanceof Error ? error.message : "Runtime config error" }))
    }
  }, [enabled, route, options.modal, options.module, options.api])

  useEffect(() => {
    mountedRef.current = true
    void load()
    if (!enabled || !pollMs) {
      return () => {
        mountedRef.current = false
      }
    }
    const timer = window.setInterval(() => void load(), pollMs)
    return () => {
      mountedRef.current = false
      window.clearInterval(timer)
    }
  }, [enabled, pollMs, load])

  const mutate = useCallback(async (mutation: OpsosRuntimeMutation) => {
    const response = await fetch("/api/opsos-control-plane/runtime-config", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(mutation),
    })
    const json = await response.json()
    if (!response.ok || json?.ok === false) throw new Error(json?.error || "Runtime config mutation failed")
    await load()
    return json
  }, [load])

  const helpers = useMemo(() => {
    const snapshot = state.snapshot
    return {
      safeModeEnabled: Boolean(snapshot?.effective.safeModeEnabled),
      rules: snapshot?.effective.rules || {},
      isFeatureEnabled: (key: string) => Boolean(snapshot?.effective.featureFlags?.[key]),
      getControlValue: <T,>(key: string, fallback: T): T => ((snapshot?.effective.controls?.[key] ?? fallback) as T),
    }
  }, [state.snapshot])

  return {
    ...state,
    ...helpers,
    route,
    reload: load,
    mutate,
  }
}

export default useOpsosRuntimeConfig
