import { createClient } from "@supabase/supabase-js"
import type {
  OpsosControlScope,
  OpsosFeatureFlag,
  OpsosRuntimeConfigSnapshot,
  OpsosRuntimeControl,
  OpsosRuntimeControlValue,
  OpsosRuntimeMutation,
  OpsosSafeModeProfile,
} from "./runtime-types"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ""
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

function canUseSupabase() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
}

function getSupabaseAdmin() {
  if (!canUseSupabase()) return null
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function nowIso() {
  return new Date().toISOString()
}

function normalizedTarget(value?: string | null) {
  const raw = String(value || "global").trim()
  return raw || "global"
}

function targetMatches(recordTarget: string, target?: string) {
  const wanted = normalizedTarget(target)
  const current = normalizedTarget(recordTarget)
  return current === "global" || current === wanted || wanted.startsWith(current + "/")
}

function coerceJson(value: unknown): OpsosRuntimeControlValue {
  if (value === undefined) return null
  return value as OpsosRuntimeControlValue
}

const fallbackControls: OpsosRuntimeControl[] = [
  {
    id: "fallback-control-global-row-limit",
    key: "global.maxRows",
    label: "Global row safety limit",
    description: "Default safety cap for heavy table/list renderers.",
    scope: "global",
    target: "global",
    value: 80,
    enabled: true,
    risk: "low",
    source: "fallback",
    updatedAt: nowIso(),
    updatedBy: "system",
  },
  {
    id: "fallback-control-marketos-card-limit",
    key: "marketos.timeline.limitCards",
    label: "Market-OS timeline card limit",
    description: "Limits campaign timeline card rendering before safe-mode wiring is module-specific.",
    scope: "route",
    target: "/market-os/campaign-lifecycle",
    value: 40,
    enabled: true,
    risk: "medium",
    source: "fallback",
    updatedAt: nowIso(),
    updatedBy: "system",
  },
  {
    id: "fallback-control-employee360-modal-limit",
    key: "hr.employee360.modalRecordLimit",
    label: "Employee 360 modal record limit",
    description: "Default maximum number of nested records shown in heavy HR dossier modals.",
    scope: "modal",
    target: "Employee360DossierModal",
    value: 30,
    enabled: true,
    risk: "medium",
    source: "fallback",
    updatedAt: nowIso(),
    updatedBy: "system",
  },
]

const fallbackFlags: OpsosFeatureFlag[] = [
  {
    id: "fallback-flag-global-heavy-animations",
    key: "global.heavyAnimations",
    label: "Heavy animations",
    description: "Controls non-essential motion and transition-heavy UI effects.",
    scope: "global",
    target: "global",
    enabled: false,
    rollout: 0,
    audience: "all",
    risk: "low",
    updatedAt: nowIso(),
    updatedBy: "system",
  },
  {
    id: "fallback-flag-marketos-live-progress",
    key: "marketos.timeline.liveProgress",
    label: "Market-OS live timeline progress",
    description: "Allows timeline progress to update continuously where target modules support runtime controls.",
    scope: "route",
    target: "/market-os/campaign-lifecycle",
    enabled: true,
    rollout: 100,
    audience: "internal",
    risk: "medium",
    updatedAt: nowIso(),
    updatedBy: "system",
  },
  {
    id: "fallback-flag-hr-print-preview",
    key: "hr.employee360.printPreview",
    label: "Employee 360 print preview",
    description: "Controls early print-preview loading for HR dossier documents.",
    scope: "modal",
    target: "Employee360DossierModal",
    enabled: false,
    rollout: 0,
    audience: "hr-admins",
    risk: "medium",
    updatedAt: nowIso(),
    updatedBy: "system",
  },
]

const fallbackSafeModes: OpsosSafeModeProfile[] = [
  {
    id: "fallback-safe-global",
    key: "global.safeMode",
    label: "Global Runtime Safe Mode",
    description: "Default global runtime protection profile.",
    scope: "global",
    target: "global",
    enabled: false,
    rules: {
      disableAnimations: true,
      disableCharts: false,
      disableLivePolling: true,
      lazyLoadModals: true,
      disablePrintPreview: true,
      limitRows: 50,
      limitCards: 40,
      apiPollingIntervalMs: 60000,
      compactMode: true,
    },
    risk: "high",
    updatedAt: nowIso(),
    updatedBy: "system",
  },
  {
    id: "fallback-safe-marketos",
    key: "marketos.campaignLifecycle.safeMode",
    label: "Market-OS Campaign Lifecycle Safe Mode",
    description: "Limits heavy rendering and polling in the campaign lifecycle workspace.",
    scope: "route",
    target: "/market-os/campaign-lifecycle",
    enabled: false,
    rules: {
      disableAnimations: true,
      disableCharts: true,
      disableLivePolling: true,
      lazyLoadModals: true,
      disablePrintPreview: true,
      limitRows: 40,
      limitCards: 24,
      apiPollingIntervalMs: 90000,
      compactMode: true,
    },
    risk: "high",
    updatedAt: nowIso(),
    updatedBy: "system",
  },
]

function mapDbControl(row: Record<string, any>): OpsosRuntimeControl {
  return {
    id: String(row.id || row.key),
    key: String(row.key),
    label: String(row.label || row.key),
    description: row.description ?? null,
    scope: (row.scope || "global") as OpsosControlScope,
    target: normalizedTarget(row.target),
    value: coerceJson(row.value_json ?? row.value ?? null),
    enabled: Boolean(row.enabled),
    risk: row.risk || "medium",
    source: "database",
    updatedAt: row.updated_at || row.created_at || null,
    updatedBy: row.updated_by || null,
  }
}

function mapDbFlag(row: Record<string, any>): OpsosFeatureFlag {
  return {
    id: String(row.id || row.key),
    key: String(row.key),
    label: String(row.label || row.key),
    description: row.description ?? null,
    scope: (row.scope || "global") as OpsosControlScope,
    target: normalizedTarget(row.target),
    enabled: Boolean(row.enabled),
    rollout: Number(row.rollout ?? 0),
    audience: row.audience || null,
    risk: row.risk || "medium",
    updatedAt: row.updated_at || row.created_at || null,
    updatedBy: row.updated_by || null,
  }
}

function mapDbSafeMode(row: Record<string, any>): OpsosSafeModeProfile {
  return {
    id: String(row.id || row.key),
    key: String(row.key),
    label: String(row.label || row.key),
    description: row.description ?? null,
    scope: (row.scope || "global") as OpsosControlScope,
    target: normalizedTarget(row.target),
    enabled: Boolean(row.enabled),
    rules: (row.rules_json || row.rules || {}) as OpsosSafeModeProfile["rules"],
    risk: row.risk || "high",
    updatedAt: row.updated_at || row.created_at || null,
    updatedBy: row.updated_by || null,
  }
}

function mergeEffective(snapshot: Pick<OpsosRuntimeConfigSnapshot, "controls" | "flags" | "safeModes">) {
  const controls: Record<string, OpsosRuntimeControlValue> = {}
  const featureFlags: Record<string, boolean> = {}
  const rules: OpsosSafeModeProfile["rules"] = {}

  for (const control of snapshot.controls) {
    if (!control.enabled) continue
    controls[control.key] = control.value
  }

  for (const flag of snapshot.flags) {
    featureFlags[flag.key] = Boolean(flag.enabled && Number(flag.rollout || 0) > 0)
  }

  const activeSafeModes = snapshot.safeModes.filter((mode) => mode.enabled)
  for (const mode of activeSafeModes) {
    Object.assign(rules, mode.rules || {})
  }

  return {
    safeModeEnabled: activeSafeModes.length > 0,
    featureFlags,
    controls,
    rules,
  }
}

export async function getOpsosRuntimeConfig(input: {
  route?: string
  modal?: string
  module?: string
  api?: string
  userId?: string
} = {}): Promise<OpsosRuntimeConfigSnapshot> {
  const supabase = getSupabaseAdmin()
  const routeTarget = input.route || input.modal || input.module || input.api || "global"

  let controls = fallbackControls.filter((item) => targetMatches(item.target, routeTarget))
  let flags = fallbackFlags.filter((item) => targetMatches(item.target, routeTarget))
  let safeModes = fallbackSafeModes.filter((item) => targetMatches(item.target, routeTarget))
  let source: OpsosRuntimeConfigSnapshot["source"] = "fallback"

  if (supabase) {
    const [controlsResult, flagsResult, safeModesResult] = await Promise.all([
      supabase.from("opsos_runtime_controls").select("*").eq("is_archived", false).order("updated_at", { ascending: false }),
      supabase.from("opsos_feature_flags").select("*").eq("is_archived", false).order("updated_at", { ascending: false }),
      supabase.from("opsos_safe_mode_profiles").select("*").eq("is_archived", false).order("updated_at", { ascending: false }),
    ])

    const dbControls = (controlsResult.data || []).map(mapDbControl).filter((item) => targetMatches(item.target, routeTarget))
    const dbFlags = (flagsResult.data || []).map(mapDbFlag).filter((item) => targetMatches(item.target, routeTarget))
    const dbSafeModes = (safeModesResult.data || []).map(mapDbSafeMode).filter((item) => targetMatches(item.target, routeTarget))

    if (dbControls.length || dbFlags.length || dbSafeModes.length) {
      controls = dbControls.length ? dbControls : controls
      flags = dbFlags.length ? dbFlags : flags
      safeModes = dbSafeModes.length ? dbSafeModes : safeModes
      source = dbControls.length && dbFlags.length && dbSafeModes.length ? "database" : "mixed"
    }
  }

  const snapshotBase = { controls, flags, safeModes }

  return {
    ok: true,
    generatedAt: nowIso(),
    scope: input,
    ...snapshotBase,
    effective: mergeEffective(snapshotBase),
    source,
  }
}

export async function mutateOpsosRuntimeConfig(mutation: OpsosRuntimeMutation) {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return {
      ok: false,
      error: "Supabase service role environment is not configured. Runtime mutation was not persisted.",
      mutation,
    }
  }

  const scope = mutation.scope || "global"
  const target = normalizedTarget(mutation.target)
  const actor = mutation.actor || "opsos-control-plane"
  const risk = mutation.risk || "medium"
  const payloadBase = {
    key: mutation.key,
    label: mutation.label || mutation.key,
    description: mutation.description || null,
    scope,
    target,
    enabled: mutation.enabled ?? true,
    risk,
    updated_by: actor,
    updated_at: nowIso(),
    is_archived: false,
  }

  let table = "opsos_runtime_controls"
  let payload: Record<string, unknown> = payloadBase

  if (mutation.kind === "feature_flag") {
    table = "opsos_feature_flags"
    payload = {
      ...payloadBase,
      rollout: Math.max(0, Math.min(100, Number(mutation.rollout ?? 100))),
      audience: mutation.audience || "all",
    }
  } else if (mutation.kind === "safe_mode") {
    table = "opsos_safe_mode_profiles"
    payload = {
      ...payloadBase,
      rules_json: mutation.rules || {},
    }
  } else {
    payload = {
      ...payloadBase,
      value_json: mutation.value ?? null,
    }
  }

  const existing = await supabase.from(table).select("id").eq("key", mutation.key).eq("target", target).maybeSingle()
  const result = existing.data?.id
    ? await supabase.from(table).update(payload).eq("id", existing.data.id).select("*").single()
    : await supabase.from(table).insert(payload).select("*").single()

  await supabase.from("opsos_action_logs").insert({
    action_type: `runtime_config.${mutation.kind}.upsert`,
    target,
    status: result.error ? "failed" : "success",
    actor,
    reason: mutation.reason || null,
    payload_json: mutation as Record<string, unknown>,
    result_json: result.error ? { error: result.error.message } : { table, id: result.data?.id },
    created_at: nowIso(),
  })

  if (result.error) {
    return { ok: false, error: result.error.message, table, mutation }
  }

  return { ok: true, table, data: result.data }
}

export async function isOpsosFeatureEnabled(key: string, input: { route?: string; modal?: string; module?: string } = {}) {
  const snapshot = await getOpsosRuntimeConfig(input)
  return Boolean(snapshot.effective.featureFlags[key])
}

export async function isOpsosSafeModeEnabled(input: { route?: string; modal?: string; module?: string } = {}) {
  const snapshot = await getOpsosRuntimeConfig(input)
  return snapshot.effective.safeModeEnabled
}

export async function getOpsosControlValue<T = OpsosRuntimeControlValue>(key: string, fallback: T, input: { route?: string; modal?: string; module?: string } = {}) {
  const snapshot = await getOpsosRuntimeConfig(input)
  return (snapshot.effective.controls[key] ?? fallback) as T
}
