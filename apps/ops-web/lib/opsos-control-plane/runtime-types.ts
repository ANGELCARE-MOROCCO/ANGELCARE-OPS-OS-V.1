export type OpsosControlScope = "global" | "route" | "modal" | "api" | "module" | "user" | "environment"

export type OpsosRiskLevel = "low" | "medium" | "high" | "critical"

export type OpsosRuntimeControlValue = string | number | boolean | null | Record<string, unknown> | unknown[]

export type OpsosRuntimeControl = {
  id: string
  key: string
  label: string
  description?: string | null
  scope: OpsosControlScope
  target: string
  value: OpsosRuntimeControlValue
  enabled: boolean
  risk: OpsosRiskLevel
  source: "database" | "fallback" | "default" | "override"
  updatedAt?: string | null
  updatedBy?: string | null
}

export type OpsosFeatureFlag = {
  id: string
  key: string
  label: string
  description?: string | null
  scope: OpsosControlScope
  target: string
  enabled: boolean
  rollout: number
  audience?: string | null
  risk: OpsosRiskLevel
  updatedAt?: string | null
  updatedBy?: string | null
}

export type OpsosSafeModeProfile = {
  id: string
  key: string
  label: string
  description?: string | null
  scope: OpsosControlScope
  target: string
  enabled: boolean
  rules: {
    disableAnimations?: boolean
    disableCharts?: boolean
    disableLivePolling?: boolean
    disablePrintPreview?: boolean
    lazyLoadModals?: boolean
    limitRows?: number
    limitCards?: number
    apiPollingIntervalMs?: number
    compactMode?: boolean
    readOnlyMode?: boolean
    [key: string]: unknown
  }
  risk: OpsosRiskLevel
  updatedAt?: string | null
  updatedBy?: string | null
}

export type OpsosRuntimeConfigSnapshot = {
  ok: boolean
  generatedAt: string
  scope: {
    route?: string
    modal?: string
    module?: string
    api?: string
    userId?: string
  }
  controls: OpsosRuntimeControl[]
  flags: OpsosFeatureFlag[]
  safeModes: OpsosSafeModeProfile[]
  effective: {
    safeModeEnabled: boolean
    featureFlags: Record<string, boolean>
    controls: Record<string, OpsosRuntimeControlValue>
    rules: OpsosSafeModeProfile["rules"]
  }
  source: "database" | "fallback" | "mixed"
}

export type OpsosRuntimeMutation = {
  kind: "control" | "feature_flag" | "safe_mode"
  key: string
  label?: string
  description?: string
  scope?: OpsosControlScope
  target?: string
  value?: OpsosRuntimeControlValue
  enabled?: boolean
  rollout?: number
  audience?: string
  rules?: OpsosSafeModeProfile["rules"]
  risk?: OpsosRiskLevel
  actor?: string
  reason?: string
}
