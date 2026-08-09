"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useOpsosRuntimeConfig } from "@/hooks/useOpsosRuntimeConfig"
import type { OpsosRuntimeConfigSnapshot, OpsosRuntimeMutation } from "@/lib/opsos-control-plane/runtime-types"

type OpsosRuntimeContextValue = {
  loading: boolean
  error: string | null
  snapshot: OpsosRuntimeConfigSnapshot | null
  route: string
  safeModeEnabled: boolean
  rules: Record<string, unknown>
  isFeatureEnabled: (key: string) => boolean
  getControlValue: <T>(key: string, fallback: T) => T
  reload: () => Promise<void>
  mutate: (mutation: OpsosRuntimeMutation) => Promise<unknown>
}

const OpsosRuntimeConfigContext = createContext<OpsosRuntimeContextValue | null>(null)

export function OpsosRuntimeConfigProvider({
  children,
  route,
  module,
  modal,
  pollMs = 0,
}: {
  children: ReactNode
  route?: string
  module?: string
  modal?: string
  pollMs?: number
}) {
  const runtime = useOpsosRuntimeConfig({ route, module, modal, pollMs })
  return <OpsosRuntimeConfigContext.Provider value={runtime}>{children}</OpsosRuntimeConfigContext.Provider>
}

export function useOpsosRuntime() {
  const context = useContext(OpsosRuntimeConfigContext)
  if (!context) {
    throw new Error("useOpsosRuntime must be used inside OpsosRuntimeConfigProvider")
  }
  return context
}

export function OpsosRuntimeSafeModeBanner() {
  const runtime = useOpsosRuntime()
  if (!runtime.safeModeEnabled) return null

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-800 shadow-sm">
      OPSOS Safe Mode is active for this workspace. Heavy animations, polling, print preview, or large lists may be limited by runtime controls.
    </div>
  )
}

export function OpsosRuntimeGate({
  flag,
  children,
  fallback = null,
}: {
  flag: string
  children: ReactNode
  fallback?: ReactNode
}) {
  const runtime = useOpsosRuntime()
  return runtime.isFeatureEnabled(flag) ? <>{children}</> : <>{fallback}</>
}
