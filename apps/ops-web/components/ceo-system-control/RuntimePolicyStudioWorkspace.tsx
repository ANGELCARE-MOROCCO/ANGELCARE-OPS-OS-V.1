'use client'

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Layers3,
  Lock,
  Pencil,
  RadioTower,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

const SYSTEM_CONTROL_REFRESH_EVENT = 'system-control-refresh'

type ModulePolicy = {
  id: string
  module_key: string
  auto_refresh_enabled: boolean
  live_polling_enabled: boolean
  heavy_sync_enabled: boolean
  min_refresh_interval_ms: number
  max_refresh_interval_ms: number
  jitter_enabled: boolean
  standby_behavior: string
  emergency_behavior: string
  allowed_during_standby: boolean
  manual_override_enabled: boolean
  schedule?: Record<string, unknown>
  policy?: Record<string, unknown>
  updated_at?: string | null
}

type ModuleRegistryItem = {
  id: string
  module_key: string
  module_name: string
  module_group?: string | null
  description?: string | null
  route_prefixes?: string[] | null
  api_prefixes?: string[] | null
  owner_role?: string | null
  status?: string | null
  risk_level?: string | null
  cost_sensitivity?: string | null
  is_core_system?: boolean | null
  is_allowed_in_standby?: boolean | null
  detected_source?: string | null
  last_seen_at?: string | null
  policy: ModulePolicy
}

type ModulesResponse = {
  ok: boolean
  connected: boolean
  modules: ModuleRegistryItem[]
}

type BatchResponse = {
  ok: boolean
  error?: string
  updatedPolicies?: Array<{ moduleKey: string; moduleName: string }>
  failures?: Array<{ moduleKey: string; error: string }>
  summary?: {
    updatedCount: number
    failedCount: number
    unchangedCount: number
    auditEventWritten: boolean
  }
}

const BATCH_PRESETS = {
  conservativeProduction: {
    label: 'Conservative Production',
    auto_refresh_enabled: true,
    live_polling_enabled: true,
    heavy_sync_enabled: false,
    min_refresh_interval_ms: 300_000,
    max_refresh_interval_ms: 900_000,
    standby_behavior: 'disable_non_core',
    emergency_behavior: 'block',
  },
  lowActivity: {
    label: 'Low Activity',
    auto_refresh_enabled: true,
    live_polling_enabled: true,
    heavy_sync_enabled: false,
    min_refresh_interval_ms: 600_000,
    max_refresh_interval_ms: 1_800_000,
    standby_behavior: 'disable_non_core',
    emergency_behavior: 'block',
  },
  operationalLive: {
    label: 'Operational Live',
    auto_refresh_enabled: true,
    live_polling_enabled: true,
    heavy_sync_enabled: false,
    min_refresh_interval_ms: 120_000,
    max_refresh_interval_ms: 300_000,
    standby_behavior: 'allow',
    emergency_behavior: 'block',
  },
  emergencySafe: {
    label: 'Emergency Safe',
    auto_refresh_enabled: false,
    live_polling_enabled: false,
    heavy_sync_enabled: false,
    min_refresh_interval_ms: 600_000,
    max_refresh_interval_ms: 1_800_000,
    standby_behavior: 'disable_non_core',
    emergency_behavior: 'block',
  },
  developmentFriendly: {
    label: 'Development Friendly',
    auto_refresh_enabled: true,
    live_polling_enabled: true,
    heavy_sync_enabled: false,
    min_refresh_interval_ms: 60_000,
    max_refresh_interval_ms: 300_000,
    standby_behavior: 'allow',
    emergency_behavior: 'block',
  },
} as const

function intervalLabel(ms: number | null | undefined) {
  if (!Number.isFinite(Number(ms))) return 'Not connected'
  const value = Number(ms)
  if (value >= 60_000 && value % 60_000 === 0) return `${Math.round(value / 60_000)} min`
  if (value >= 1_000) return `${Math.round(value / 1_000)} sec`
  return `${value} ms`
}

function formatDurationRange(min: number, max: number) {
  return `${intervalLabel(min)} - ${intervalLabel(max)}`
}

function normalizeRiskLevel(value?: string | null) {
  const risk = String(value || 'normal').toLowerCase()
  if (risk === 'critical' || risk === 'high') return 'high'
  if (risk === 'medium' || risk === 'elevated') return 'elevated'
  if (risk === 'low') return 'low'
  return 'normal'
}

function riskTone(value?: string | null) {
  const normalized = normalizeRiskLevel(value)
  if (normalized === 'high') return 'border-rose-200 bg-rose-50 text-rose-700'
  if (normalized === 'elevated') return 'border-orange-200 bg-orange-50 text-orange-700'
  if (normalized === 'low') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  return 'border-slate-200 bg-slate-50 text-slate-600'
}

function riskIcon(value?: string | null) {
  const normalized = normalizeRiskLevel(value)
  if (normalized === 'high') return <AlertCircle className="h-4 w-4" />
  if (normalized === 'elevated') return <ShieldCheck className="h-4 w-4" />
  return <CheckCircle2 className="h-4 w-4" />
}

function getEnforcementState(module: ModuleRegistryItem) {
  if (module.status && module.status !== 'active') return 'unavailable'
  if (!module.policy.auto_refresh_enabled || !module.policy.live_polling_enabled) return 'enforcement pending'
  return 'active'
}

function recommendedPolicy(module: ModuleRegistryItem) {
  const risk = normalizeRiskLevel(module.risk_level)
  if (module.module_key === 'ceo-system-control') {
    return {
      auto_refresh_enabled: true,
      live_polling_enabled: true,
      heavy_sync_enabled: true,
      min_refresh_interval_ms: 60_000,
      max_refresh_interval_ms: 300_000,
      jitter_enabled: true,
      standby_behavior: 'allow',
      emergency_behavior: 'block',
      allowed_during_standby: true,
      manual_override_enabled: true,
    }
  }

  if (risk === 'high') {
    return {
      auto_refresh_enabled: true,
      live_polling_enabled: true,
      heavy_sync_enabled: false,
      min_refresh_interval_ms: 300_000,
      max_refresh_interval_ms: 900_000,
      jitter_enabled: true,
      standby_behavior: 'disable_non_core',
      emergency_behavior: 'block',
      allowed_during_standby: false,
      manual_override_enabled: true,
    }
  }

  return {
    auto_refresh_enabled: true,
    live_polling_enabled: true,
    heavy_sync_enabled: false,
    min_refresh_interval_ms: 600_000,
    max_refresh_interval_ms: 1_200_000,
    jitter_enabled: true,
    standby_behavior: 'disable_non_core',
    emergency_behavior: 'block',
    allowed_during_standby: false,
    manual_override_enabled: true,
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return 'No timestamp'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No timestamp'
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export default function RuntimePolicyStudioWorkspace() {
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'unavailable' | 'enforcement pending'>('all')
  const [riskFilter, setRiskFilter] = useState<'all' | 'low' | 'normal' | 'elevated' | 'high'>('all')
  const [refreshFilter, setRefreshFilter] = useState<'all' | 'enabled' | 'disabled'>('all')
  const [livePollingFilter, setLivePollingFilter] = useState<'all' | 'enabled' | 'disabled'>('all')
  const [heavySyncFilter, setHeavySyncFilter] = useState<'all' | 'enabled' | 'disabled'>('all')
  const [standbyBehaviorFilter, setStandbyBehaviorFilter] = useState('all')
  const [emergencyBehaviorFilter, setEmergencyBehaviorFilter] = useState('all')
  const [selectedOnly, setSelectedOnly] = useState(false)
  const [modules, setModules] = useState<ModuleRegistryItem[]>([])
  const [selectedModuleKey, setSelectedModuleKey] = useState('')
  const [draft, setDraft] = useState<Partial<ModulePolicy> | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [bulkEditorOpen, setBulkEditorOpen] = useState(false)
  const [batchMode, setBatchMode] = useState<'edit' | 'preset'>('edit')
  const [bulkReason, setBulkReason] = useState('')
  const [batchPatch, setBatchPatch] = useState<Record<string, unknown>>({})
  const [batchFieldEnabled, setBatchFieldEnabled] = useState<Record<string, boolean>>({})
  const [batchResult, setBatchResult] = useState<BatchResponse | null>(null)
  const loadModulesRef = useRef<() => Promise<void>>(async () => {})

  const selectedModule = useMemo(
    () => modules.find((item) => item.module_key === selectedModuleKey) || null,
    [modules, selectedModuleKey],
  )

  async function loadModules() {
    setLoading(true)
    try {
      const response = await fetch('/api/system-control/modules', { cache: 'no-store' })
      const payload = await response.json().catch(() => null) as ModulesResponse | null
      const nextModules = Array.isArray(payload?.modules) ? payload.modules : []
      setConnected(Boolean(response.ok && payload?.connected))
      setModules(nextModules)
      setSelectedKeys((current) => current.filter((key) => nextModules.some((item) => item.module_key === key)))
      const nextSelected = nextModules.some((item) => item.module_key === selectedModuleKey)
        ? selectedModuleKey
        : nextModules[0]?.module_key || ''
      setSelectedModuleKey(nextSelected)
      const nextSelectedModule = nextModules.find((item) => item.module_key === nextSelected)
      setDraft(nextSelectedModule ? { ...nextSelectedModule.policy } : null)
    } catch {
      setConnected(false)
      setModules([])
      setDraft(null)
      setMessage('Policy engine not connected yet.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadModulesRef.current = loadModules
  }, [loadModules])

  useEffect(() => {
    void loadModules()
  }, [])

  useEffect(() => {
    function handleRefresh(event: Event) {
      const customEvent = event as CustomEvent<{ source?: string }>
      if (customEvent.detail?.source === 'policy') return
      void loadModulesRef.current()
    }

    window.addEventListener(SYSTEM_CONTROL_REFRESH_EVENT, handleRefresh)
    return () => window.removeEventListener(SYSTEM_CONTROL_REFRESH_EVENT, handleRefresh)
  }, [])

  useEffect(() => {
    if (!selectedModule && modules.length) {
      const next = modules[0]
      setSelectedModuleKey(next.module_key)
      setDraft({ ...next.policy })
    }
  }, [modules, selectedModule])

  useEffect(() => {
    if (!selectedModule) return
    if (draft && draft.module_key === selectedModule.module_key) return
    setDraft({ ...selectedModule.policy })
  }, [draft, selectedModule])

  const filteredModules = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    const selectedSet = new Set(selectedKeys)
    return modules.filter((item) => {
      const enforcement = getEnforcementState(item)
      const risk = normalizeRiskLevel(item.risk_level)
      const standby = String(item.policy.standby_behavior || '')
      const emergency = String(item.policy.emergency_behavior || '')
      const matchesQuery = !query || [item.module_name, item.module_key, item.module_group, item.risk_level, item.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
      const matchesStatus = statusFilter === 'all' || enforcement === statusFilter
      const matchesRisk = riskFilter === 'all' || risk === riskFilter
      const matchesRefresh = refreshFilter === 'all' || (refreshFilter === 'enabled' ? item.policy.auto_refresh_enabled : !item.policy.auto_refresh_enabled)
      const matchesPolling = livePollingFilter === 'all' || (livePollingFilter === 'enabled' ? item.policy.live_polling_enabled : !item.policy.live_polling_enabled)
      const matchesHeavy = heavySyncFilter === 'all' || (heavySyncFilter === 'enabled' ? item.policy.heavy_sync_enabled : !item.policy.heavy_sync_enabled)
      const matchesStandby = standbyBehaviorFilter === 'all' || standby === standbyBehaviorFilter
      const matchesEmergency = emergencyBehaviorFilter === 'all' || emergency === emergencyBehaviorFilter
      const matchesSelection = !selectedOnly || selectedSet.has(item.module_key)
      return matchesQuery && matchesStatus && matchesRisk && matchesRefresh && matchesPolling && matchesHeavy && matchesStandby && matchesEmergency && matchesSelection
    })
  }, [emergencyBehaviorFilter, heavySyncFilter, livePollingFilter, modules, refreshFilter, riskFilter, searchTerm, selectedKeys, selectedOnly, standbyBehaviorFilter, statusFilter])

  const availableStandbyBehaviors = useMemo(
    () => Array.from(new Set(modules.map((item) => String(item.policy.standby_behavior || '')).filter(Boolean))).sort(),
    [modules],
  )

  const availableEmergencyBehaviors = useMemo(
    () => Array.from(new Set(modules.map((item) => String(item.policy.emergency_behavior || '')).filter(Boolean))).sort(),
    [modules],
  )

  const selectedModuleCount = selectedKeys.length
  const visibleModuleCount = filteredModules.length

  function updateDraft(patch: Partial<ModulePolicy>) {
    setDraft((current) => (current ? { ...current, ...patch } : current))
  }

  function updateBatchPatch(patch: Record<string, unknown>) {
    setBatchPatch((current) => ({ ...current, ...patch }))
  }

  function toggleSelected(moduleKey: string) {
    setSelectedKeys((current) => (current.includes(moduleKey) ? current.filter((key) => key !== moduleKey) : [...current, moduleKey]))
  }

  function selectVisible() {
    setSelectedKeys(filteredModules.map((item) => item.module_key))
  }

  function selectAll() {
    setSelectedKeys(modules.map((item) => item.module_key))
  }

  function clearSelection() {
    setSelectedKeys([])
  }

  function resetDraft() {
    if (!selectedModule) return
    setDraft({ ...selectedModule.policy })
    setMessage('Preview reset. Not saved.')
  }

  function applyRecommendation() {
    if (!selectedModule) return
    setDraft({ ...selectedModule.policy, ...recommendedPolicy(selectedModule) })
    setMessage('Preview only - not saved.')
  }

  function buildBatchPayload() {
    const payload: Record<string, unknown> = {}
    for (const [key, enabled] of Object.entries(batchFieldEnabled)) {
      if (!enabled) continue
      const value = batchPatch[key]
      if (value !== undefined && value !== null && value !== '') payload[key] = value
    }
    return payload
  }

  function openBulkEditor(mode: 'edit' | 'preset') {
    setBatchMode(mode)
    setBulkEditorOpen(true)
    if (!selectedKeys.length && filteredModules.length) {
      setSelectedKeys(filteredModules.slice(0, Math.min(6, filteredModules.length)).map((item) => item.module_key))
    }
  }

  function closeBulkEditor() {
    setBulkEditorOpen(false)
  }

  function applyPreset(presetKey: keyof typeof BATCH_PRESETS) {
    const preset = BATCH_PRESETS[presetKey]
    setBatchMode('preset')
    setBatchPatch({
      auto_refresh_enabled: preset.auto_refresh_enabled,
      live_polling_enabled: preset.live_polling_enabled,
      heavy_sync_enabled: preset.heavy_sync_enabled,
      min_refresh_interval_ms: preset.min_refresh_interval_ms,
      max_refresh_interval_ms: preset.max_refresh_interval_ms,
      standby_behavior: preset.standby_behavior,
      emergency_behavior: preset.emergency_behavior,
    })
    setBatchFieldEnabled({
      auto_refresh_enabled: true,
      live_polling_enabled: true,
      heavy_sync_enabled: true,
      min_refresh_interval_ms: true,
      max_refresh_interval_ms: true,
      standby_behavior: true,
      emergency_behavior: true,
    })
    setBulkEditorOpen(true)
    setMessage(`Preset loaded: ${preset.label}. Preview before saving.`)
  }

  async function savePolicy(nextPolicy?: Partial<ModulePolicy>) {
    const current = selectedModule
    if (!current) return
    const policy = {
      ...(draft || current.policy),
      ...(nextPolicy || {}),
    }

    setSaving(true)
    setMessage(null)
    try {
      const response = await fetch(`/api/system-control/modules/${encodeURIComponent(current.module_key)}/policy`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policy),
      })
      const payload = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || 'Unable to save runtime policy.')
      }
      await loadModules()
      window.dispatchEvent(new CustomEvent(SYSTEM_CONTROL_REFRESH_EVENT, { detail: { source: 'policy' } }))
      setMessage(`Policy saved for ${current.module_name}. Enforcement pending until modules adopt runtime policy helpers.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Runtime policy APIs not connected yet.')
    } finally {
      setSaving(false)
    }
  }

  async function saveBatch() {
    if (!selectedKeys.length) {
      setMessage('Select at least one module before saving a batch.')
      return
    }

    const patch = buildBatchPayload()
    if (!Object.keys(patch).length) {
      setMessage('Choose one or more fields or a preset before saving a batch.')
      return
    }

    setSaving(true)
    setMessage(null)
    setBatchResult(null)
    try {
      const response = await fetch('/api/system-control/modules/bulk-policy', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleKeys: selectedKeys,
          patch,
          reason: bulkReason || undefined,
        }),
      })
      const payload = await response.json().catch(() => null) as BatchResponse | null
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || 'Unable to save batch policy.')
      }

      setBatchResult(payload)
      await loadModules()
      window.dispatchEvent(new CustomEvent(SYSTEM_CONTROL_REFRESH_EVENT, { detail: { source: 'policy-batch' } }))
      setMessage(payload.summary?.failedCount
        ? `Batch saved with ${payload.summary.updatedCount} updates and ${payload.summary.failedCount} failures.`
        : `Batch saved for ${payload.summary?.updatedCount || selectedKeys.length} modules.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Runtime policy APIs not connected yet.')
    } finally {
      setSaving(false)
    }
  }

  const selectedPreview = useMemo(() => {
    const patch = buildBatchPayload()
    return modules.filter((item) => selectedKeys.includes(item.module_key)).map((module) => ({
      module,
      preview: {
        auto_refresh_enabled: typeof patch.auto_refresh_enabled === 'boolean' ? patch.auto_refresh_enabled : module.policy.auto_refresh_enabled,
        live_polling_enabled: typeof patch.live_polling_enabled === 'boolean' ? patch.live_polling_enabled : module.policy.live_polling_enabled,
        heavy_sync_enabled: typeof patch.heavy_sync_enabled === 'boolean' ? patch.heavy_sync_enabled : module.policy.heavy_sync_enabled,
        min_refresh_interval_ms: typeof patch.min_refresh_interval_ms === 'number' ? patch.min_refresh_interval_ms : module.policy.min_refresh_interval_ms,
        max_refresh_interval_ms: typeof patch.max_refresh_interval_ms === 'number' ? patch.max_refresh_interval_ms : module.policy.max_refresh_interval_ms,
        standby_behavior: typeof patch.standby_behavior === 'string' ? patch.standby_behavior : module.policy.standby_behavior,
        emergency_behavior: typeof patch.emergency_behavior === 'string' ? patch.emergency_behavior : module.policy.emergency_behavior,
      },
    }))
  }, [batchFieldEnabled, batchPatch, modules, selectedKeys])

  const selectedPolicy = draft || selectedModule?.policy || null
  const batchPatchReady = Object.keys(buildBatchPayload()).length > 0 && selectedKeys.length > 0

  return (
    <section id="runtime-policy-studio" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_rgba(15,23,42,.06)]">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {connected ? 'Connected' : 'Not connected'}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
              <Lock className="h-3.5 w-3.5" />
              Production Safe
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600">
              {selectedModuleCount} selected
            </span>
          </div>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-slate-950">Runtime Policy Studio</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
            Control refresh, sync, and standby behavior by module. Batch edits are previewed before any save is written.
          </p>
          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-900">
            Policies are saved to the runtime registry. Full module-wide enforcement requires modules to adopt runtime policy helpers.
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => void loadModules()} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Registry
          </button>
          <button type="button" onClick={() => openBulkEditor('edit')} className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100">
            <SlidersHorizontal className="h-4 w-4" />
            Bulk Edit Selected
          </button>
          <button type="button" onClick={() => applyPreset('operationalLive')} className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100">
            <Sparkles className="h-4 w-4" />
            Apply Preset
          </button>
          <button type="button" disabled={!batchPatchReady || saving} onClick={() => void saveBatch()} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
            <CheckCircle2 className="h-4 w-4" />
            {saving ? 'Saving batch...' : 'Save Batch'}
          </button>
          <button type="button" onClick={clearSelection} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
            Reset Selection
          </button>
        </div>
      </div>

      {message && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {message}
        </div>
      )}

      {batchResult && (
        <div className="mt-4 grid gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 lg:grid-cols-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Updated</div>
            <div className="mt-1 text-lg font-black text-slate-950">{batchResult.summary?.updatedCount || batchResult.updatedPolicies?.length || 0}</div>
            <div className="text-sm text-slate-500">Modules updated</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Failed</div>
            <div className="mt-1 text-lg font-black text-slate-950">{batchResult.summary?.failedCount || batchResult.failures?.length || 0}</div>
            <div className="text-sm text-slate-500">Validation or save failures</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Audit</div>
            <div className="mt-1 text-lg font-black text-slate-950">{batchResult.summary?.auditEventWritten ? 'Written' : 'Pending'}</div>
            <div className="text-sm text-slate-500">Batch event status</div>
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.18fr_.82fr]">
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-base font-bold text-slate-950">Module Policy Registry</div>
              <div className="mt-1 text-sm text-slate-500">Select modules, preview changes, and save a batch in one action.</div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-300 focus:bg-white" placeholder="Search module name or key" />
              </div>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none">
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="unavailable">Unavailable</option>
                <option value="enforcement pending">Enforcement pending</option>
              </select>
              <select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value as typeof riskFilter)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none">
                <option value="all">All risk</option>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="elevated">Elevated</option>
                <option value="high">High</option>
              </select>
              <select value={refreshFilter} onChange={(event) => setRefreshFilter(event.target.value as typeof refreshFilter)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none">
                <option value="all">Any refresh</option>
                <option value="enabled">Refresh enabled</option>
                <option value="disabled">Refresh disabled</option>
              </select>
              <select value={livePollingFilter} onChange={(event) => setLivePollingFilter(event.target.value as typeof livePollingFilter)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none">
                <option value="all">Any polling</option>
                <option value="enabled">Polling enabled</option>
                <option value="disabled">Polling disabled</option>
              </select>
              <select value={heavySyncFilter} onChange={(event) => setHeavySyncFilter(event.target.value as typeof heavySyncFilter)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none">
                <option value="all">Any sync</option>
                <option value="enabled">Heavy sync enabled</option>
                <option value="disabled">Heavy sync disabled</option>
              </select>
              <select value={standbyBehaviorFilter} onChange={(event) => setStandbyBehaviorFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none">
                <option value="all">Any standby</option>
                {availableStandbyBehaviors.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
              <select value={emergencyBehaviorFilter} onChange={(event) => setEmergencyBehaviorFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none">
                <option value="all">Any emergency</option>
                {availableEmergencyBehaviors.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
              <label className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input type="checkbox" checked={selectedOnly} onChange={(event) => setSelectedOnly(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                Selected only
              </label>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <button type="button" onClick={selectVisible} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-700">Select visible</button>
            <button type="button" onClick={selectAll} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-700">Select all</button>
            <button type="button" onClick={clearSelection} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700">Clear</button>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-blue-700">{selectedModuleCount} selected</span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-600">{visibleModuleCount} visible</span>
          </div>

          {!connected && !loading ? (
            <div className="mt-5 rounded-[1.35rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
              Policy engine not connected yet.
            </div>
          ) : (
            <>
              <div className="mt-5 overflow-hidden rounded-[1.35rem] border border-slate-200 hidden md:block">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3"><input type="checkbox" checked={filteredModules.length > 0 && filteredModules.every((item) => selectedKeys.includes(item.module_key))} onChange={(event) => event.target.checked ? selectVisible() : clearSelection()} className="h-4 w-4 rounded border-slate-300 text-blue-600" /></th>
                      <th className="px-4 py-3">Module</th>
                      <th className="px-4 py-3">Risk</th>
                      <th className="px-4 py-3">Enforcement</th>
                      <th className="px-4 py-3">Auto Refresh</th>
                      <th className="px-4 py-3">Live Polling</th>
                      <th className="px-4 py-3">Heavy Sync</th>
                      <th className="px-4 py-3">Interval</th>
                      <th className="px-4 py-3">Standby</th>
                      <th className="px-4 py-3">Emergency</th>
                      <th className="px-4 py-3">Updated</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredModules.map((module) => {
                      const isSelected = selectedKeys.includes(module.module_key)
                      return (
                        <tr key={module.module_key} className={isSelected ? 'bg-blue-50/40' : undefined}>
                          <td className="px-4 py-3">
                            <input type="checkbox" checked={isSelected} onChange={() => toggleSelected(module.module_key)} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-950">{module.module_name}</div>
                            <div className="mt-1 text-xs text-slate-500">{module.module_key}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${riskTone(module.risk_level)}`}>
                              {riskIcon(module.risk_level)}
                              {normalizeRiskLevel(module.risk_level)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-700">{getEnforcementState(module)}</td>
                          <td className="px-4 py-3 text-slate-700">{module.policy.auto_refresh_enabled ? 'ON' : 'OFF'}</td>
                          <td className="px-4 py-3 text-slate-700">{module.policy.live_polling_enabled ? 'ON' : 'OFF'}</td>
                          <td className="px-4 py-3 text-slate-700">{module.policy.heavy_sync_enabled ? 'ON' : 'OFF'}</td>
                          <td className="px-4 py-3 text-slate-700">{formatDurationRange(module.policy.min_refresh_interval_ms, module.policy.max_refresh_interval_ms)}</td>
                          <td className="px-4 py-3 text-slate-700">{module.policy.standby_behavior}</td>
                          <td className="px-4 py-3 text-slate-700">{module.policy.emergency_behavior}</td>
                          <td className="px-4 py-3 text-slate-700">{formatDateTime(module.policy.updated_at || module.last_seen_at || null)}</td>
                          <td className="px-4 py-3">
                            <button type="button" onClick={() => {
                              setSelectedModuleKey(module.module_key)
                              setDraft({ ...module.policy })
                            }} className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100">
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 space-y-3 md:hidden">
                {filteredModules.map((module) => {
                  const isSelected = selectedKeys.includes(module.module_key)
                  return (
                    <article key={module.module_key} className={`rounded-[1.35rem] border p-4 ${isSelected ? 'border-blue-200 bg-blue-50/40' : 'border-slate-200 bg-white'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <input type="checkbox" checked={isSelected} onChange={() => toggleSelected(module.module_key)} className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600" />
                          <div>
                            <div className="font-semibold text-slate-950">{module.module_name}</div>
                            <div className="mt-1 text-xs text-slate-500">{module.module_key}</div>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${riskTone(module.risk_level)}`}>
                          {riskIcon(module.risk_level)}
                          {normalizeRiskLevel(module.risk_level)}
                        </span>
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">Enforcement: <span className="font-semibold text-slate-900">{getEnforcementState(module)}</span></div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">Auto refresh: <span className="font-semibold text-slate-900">{module.policy.auto_refresh_enabled ? 'ON' : 'OFF'}</span></div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">Polling: <span className="font-semibold text-slate-900">{module.policy.live_polling_enabled ? 'ON' : 'OFF'}</span></div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">Heavy sync: <span className="font-semibold text-slate-900">{module.policy.heavy_sync_enabled ? 'ON' : 'OFF'}</span></div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">Interval: <span className="font-semibold text-slate-900">{formatDurationRange(module.policy.min_refresh_interval_ms, module.policy.max_refresh_interval_ms)}</span></div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">Standby: <span className="font-semibold text-slate-900">{module.policy.standby_behavior}</span></div>
                      </div>
                      <button type="button" onClick={() => {
                        setSelectedModuleKey(module.module_key)
                        setDraft({ ...module.policy })
                      }} className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                        <Pencil className="h-3.5 w-3.5" />
                        Edit Policy
                      </button>
                    </article>
                  )
                })}
              </div>
            </>
          )}
        </section>

        <aside className="space-y-4">
          <section className="rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-base font-bold text-slate-950">Selected Module Editor</div>
                <div className="mt-1 text-sm text-slate-500">One-by-one editing remains available for precise changes.</div>
              </div>
              <span className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] border-slate-200 bg-slate-50 text-slate-600">
                {selectedModule ? selectedModule.module_key : 'No module'}
              </span>
            </div>

            {!selectedModule || !selectedPolicy ? (
              <div className="mt-5 rounded-[1.35rem] border border-dashed border-slate-200 bg-white px-4 py-8 text-sm text-slate-500">
                Select a module to edit its runtime policy.
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <label className="block space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Module</span>
                  <div className="relative">
                    <select
                      value={selectedModule.module_key}
                      onChange={(event) => {
                        const next = modules.find((item) => item.module_key === event.target.value)
                        if (!next) return
                        setSelectedModuleKey(next.module_key)
                        setDraft({ ...next.policy })
                      }}
                      className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm outline-none"
                    >
                      {modules.map((item) => (
                        <option key={item.module_key} value={item.module_key}>{item.module_name}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { key: 'auto_refresh_enabled', label: 'Auto refresh' },
                    { key: 'live_polling_enabled', label: 'Live polling' },
                    { key: 'heavy_sync_enabled', label: 'Heavy sync' },
                    { key: 'jitter_enabled', label: 'Jitter' },
                    { key: 'allowed_during_standby', label: 'Allowed during standby' },
                    { key: 'manual_override_enabled', label: 'Manual override' },
                  ].map((field) => (
                    <label key={field.key} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <span className="text-sm font-medium text-slate-800">{field.label}</span>
                      <input
                        type="checkbox"
                        checked={Boolean((selectedPolicy as Record<string, unknown>)[field.key])}
                        onChange={(event) => updateDraft({ [field.key]: event.target.checked } as Partial<ModulePolicy>)}
                        className="h-5 w-5 rounded border-slate-300 text-blue-600"
                      />
                    </label>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Min refresh interval</span>
                    <input
                      type="number"
                      min={60000}
                      step={1000}
                      value={selectedPolicy.min_refresh_interval_ms}
                      onChange={(event) => updateDraft({ min_refresh_interval_ms: Number(event.target.value || 0) })}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Max refresh interval</span>
                    <input
                      type="number"
                      min={selectedPolicy.min_refresh_interval_ms}
                      step={1000}
                      value={selectedPolicy.max_refresh_interval_ms}
                      onChange={(event) => updateDraft({ max_refresh_interval_ms: Number(event.target.value || 0) })}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                    />
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={applyRecommendation} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">
                    <Sparkles className="h-3.5 w-3.5" />
                    Apply recommendation
                  </button>
                  <button type="button" onClick={resetDraft} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">
                    Reset
                  </button>
                  <button type="button" disabled={saving} onClick={() => void savePolicy()} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {saving ? 'Saving...' : 'Save Policy'}
                  </button>
                </div>

                <div className="rounded-[1.35rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                  Policies are saved to the runtime registry. Full module-wide enforcement requires modules to adopt runtime policy helpers.
                </div>
              </div>
            )}
          </section>

          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-base font-bold text-slate-950">Batch Preview</div>
                <div className="mt-1 text-sm text-slate-500">Preview the selected modules before you save them in bulk.</div>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                {selectedPreview.length} modules
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {selectedPreview.length ? selectedPreview.slice(0, 4).map(({ module, preview }) => (
                <div key={module.module_key} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
                  <div className="font-semibold text-slate-950">{module.module_name}</div>
                  <div className="mt-2 grid gap-2 text-xs text-slate-600">
                    <div>Refresh: {preview.auto_refresh_enabled ? 'ON' : 'OFF'} / Polling: {preview.live_polling_enabled ? 'ON' : 'OFF'}</div>
                    <div>Heavy sync: {preview.heavy_sync_enabled ? 'ON' : 'OFF'} / Interval: {formatDurationRange(preview.min_refresh_interval_ms, preview.max_refresh_interval_ms)}</div>
                    <div>Standby: {preview.standby_behavior} / Emergency: {preview.emergency_behavior}</div>
                  </div>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  Select modules to preview batch changes here.
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>

      {bulkEditorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/25 p-0 lg:p-6">
          <div className="ml-auto flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl lg:max-w-[760px] lg:rounded-[2rem]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-4 lg:p-6">
              <div>
                <div className="text-lg font-black tracking-[-0.04em] text-slate-950">Bulk Policy Editor</div>
                <div className="mt-1 text-sm text-slate-500">{selectedModuleCount} selected modules. Preview first, then confirm.</div>
              </div>
              <button type="button" onClick={closeBulkEditor} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 lg:p-6">
              <div className="grid gap-4 lg:grid-cols-[1fr_.95fr]">
                <div className="space-y-4">
                  <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Selected modules</div>
                    <div className="mt-3 max-h-36 space-y-2 overflow-auto">
                      {selectedPreview.length ? selectedPreview.map(({ module }) => (
                        <div key={module.module_key} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                          {module.module_name} <span className="text-slate-400">({module.module_key})</span>
                        </div>
                      )) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-3 py-4 text-sm text-slate-500">No modules selected.</div>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      ['auto_refresh_enabled', 'Auto refresh'],
                      ['live_polling_enabled', 'Live polling'],
                      ['heavy_sync_enabled', 'Heavy sync'],
                      ['min_refresh_interval_ms', 'Min interval'],
                      ['max_refresh_interval_ms', 'Max interval'],
                      ['standby_behavior', 'Standby behavior'],
                      ['emergency_behavior', 'Emergency behavior'],
                    ].map(([key, label]) => (
                      <label key={key} className="space-y-2 rounded-[1.35rem] border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-slate-900">{label}</span>
                          <input
                            type="checkbox"
                            checked={Boolean(batchFieldEnabled[key])}
                            onChange={(event) => setBatchFieldEnabled((current) => ({ ...current, [key]: event.target.checked }))}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600"
                          />
                        </div>
                        {key === 'auto_refresh_enabled' || key === 'live_polling_enabled' || key === 'heavy_sync_enabled' ? (
                          <select
                            value={String(batchPatch[key] ?? 'true')}
                            onChange={(event) => updateBatchPatch({ [key]: event.target.value === 'true' })}
                            disabled={!batchFieldEnabled[key]}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none disabled:opacity-50"
                          >
                            <option value="true">Enabled</option>
                            <option value="false">Disabled</option>
                          </select>
                        ) : key === 'min_refresh_interval_ms' || key === 'max_refresh_interval_ms' ? (
                          <input
                            type="number"
                            min={60000}
                            step={60000}
                            value={Number(batchPatch[key]) || ''}
                            onChange={(event) => updateBatchPatch({ [key]: Number(event.target.value || 0) })}
                            disabled={!batchFieldEnabled[key]}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none disabled:opacity-50"
                          />
                        ) : (
                          <select
                            value={String(batchPatch[key] || '')}
                            onChange={(event) => updateBatchPatch({ [key]: event.target.value })}
                            disabled={!batchFieldEnabled[key]}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none disabled:opacity-50"
                          >
                            <option value="">Select one</option>
                            {(key === 'standby_behavior' ? availableStandbyBehaviors : availableEmergencyBehaviors).map((value) => (
                              <option key={value} value={value}>{value}</option>
                            ))}
                          </select>
                        )}
                      </label>
                    ))}
                  </div>

                  <label className="space-y-2 rounded-[1.35rem] border border-slate-200 bg-white p-4">
                    <span className="text-sm font-semibold text-slate-900">Reason</span>
                    <textarea
                      value={bulkReason}
                      onChange={(event) => setBulkReason(event.target.value)}
                      rows={3}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
                      placeholder="Optional change reason for the audit trail"
                    />
                  </label>

                  <div className="flex flex-wrap gap-2">
                    {Object.entries(BATCH_PRESETS).map(([key, preset]) => (
                      <button key={key} type="button" onClick={() => applyPreset(key as keyof typeof BATCH_PRESETS)} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Preview changes</div>
                    <div className="mt-3 space-y-3">
                      {selectedPreview.length ? selectedPreview.map(({ module, preview }) => (
                        <div key={module.module_key} className="rounded-2xl border border-slate-200 bg-white p-3">
                          <div className="font-semibold text-slate-950">{module.module_name}</div>
                          <div className="mt-2 space-y-1 text-xs text-slate-600">
                            <div>Auto refresh: {module.policy.auto_refresh_enabled ? 'ON' : 'OFF'} → {preview.auto_refresh_enabled ? 'ON' : 'OFF'}</div>
                            <div>Live polling: {module.policy.live_polling_enabled ? 'ON' : 'OFF'} → {preview.live_polling_enabled ? 'ON' : 'OFF'}</div>
                            <div>Heavy sync: {module.policy.heavy_sync_enabled ? 'ON' : 'OFF'} → {preview.heavy_sync_enabled ? 'ON' : 'OFF'}</div>
                            <div>Min interval: {formatDurationRange(module.policy.min_refresh_interval_ms, module.policy.max_refresh_interval_ms)} → {formatDurationRange(preview.min_refresh_interval_ms, preview.max_refresh_interval_ms)}</div>
                            <div>Standby: {module.policy.standby_behavior} → {preview.standby_behavior}</div>
                            <div>Emergency: {module.policy.emergency_behavior} → {preview.emergency_behavior}</div>
                          </div>
                        </div>
                      )) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-3 py-4 text-sm text-slate-500">No selected modules to preview.</div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[1.35rem] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                    Policies are saved to the runtime registry. Full module-wide enforcement requires modules to adopt runtime policy helpers.
                  </div>

                  <div className="sticky bottom-0 flex gap-3 border-t border-slate-200 bg-white pt-4 lg:static lg:border-0 lg:bg-transparent lg:pt-0">
                    <button type="button" onClick={closeBulkEditor} className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                      Cancel
                    </button>
                    <button type="button" disabled={!batchPatchReady || saving} onClick={() => void saveBatch()} className="flex-1 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
                      {saving ? 'Saving...' : 'Confirm apply'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
