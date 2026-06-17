'use client'

import {
  AlertCircle,
  ChevronDown,
  CheckCircle2,
  Layers3,
  Lock,
  Pencil,
  RadioTower,
  RefreshCw,
  Search,
  Settings2,
  ShieldAlert,
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

function statusChip(value: boolean) {
  return value
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-slate-200 bg-slate-50 text-slate-500'
}

function toneForRisk(value?: string | null) {
  const normalized = String(value || 'normal').toLowerCase()
  if (normalized === 'critical') return 'border-rose-200 bg-rose-50 text-rose-700'
  if (normalized === 'high') return 'border-orange-200 bg-orange-50 text-orange-700'
  if (normalized === 'medium') return 'border-amber-200 bg-amber-50 text-amber-700'
  if (normalized === 'low') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  return 'border-slate-200 bg-slate-50 text-slate-600'
}

function iconForRisk(value?: string | null) {
  const normalized = String(value || 'normal').toLowerCase()
  if (normalized === 'critical') return <ShieldAlert className="h-4 w-4" />
  if (normalized === 'high') return <AlertCircle className="h-4 w-4" />
  if (normalized === 'medium') return <ShieldCheck className="h-4 w-4" />
  return <CheckCircle2 className="h-4 w-4" />
}

function governanceTone(index: number) {
  return [
    'border-blue-200 bg-blue-50 text-blue-700',
    'border-emerald-200 bg-emerald-50 text-emerald-700',
    'border-violet-200 bg-violet-50 text-violet-700',
    'border-amber-200 bg-amber-50 text-amber-700',
  ][index] || 'border-slate-200 bg-slate-50 text-slate-600'
}

function recommendedPolicy(module: ModuleRegistryItem) {
  const risk = String(module.risk_level || 'normal').toLowerCase()
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

  if (risk === 'critical' || risk === 'high') {
    return {
      auto_refresh_enabled: true,
      live_polling_enabled: true,
      heavy_sync_enabled: risk === 'critical',
      min_refresh_interval_ms: 300_000,
      max_refresh_interval_ms: 600_000,
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
    max_refresh_interval_ms: 900_000,
    jitter_enabled: true,
    standby_behavior: 'disable_non_core',
    emergency_behavior: 'block',
    allowed_during_standby: false,
    manual_override_enabled: true,
  }
}

export default function RuntimePolicyStudioWorkspace() {
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [modules, setModules] = useState<ModuleRegistryItem[]>([])
  const [selectedModuleKey, setSelectedModuleKey] = useState<string>('')
  const [draft, setDraft] = useState<Partial<ModulePolicy> | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const loadModulesRef = useRef<() => Promise<void>>(async () => {})

  async function loadModules() {
    setLoading(true)
    try {
      const response = await fetch('/api/system-control/modules', { cache: 'no-store' })
      const payload = await response.json().catch(() => null) as ModulesResponse | null
      const nextModules = Array.isArray(payload?.modules) ? payload.modules : []
      setConnected(Boolean(response.ok && payload?.connected))
      setModules(nextModules)
      const nextSelected = selectedModuleKey && nextModules.some((item) => item.module_key === selectedModuleKey)
        ? selectedModuleKey
        : nextModules[0]?.module_key || ''
      setSelectedModuleKey(nextSelected)
      if (nextSelected) {
        const current = nextModules.find((item) => item.module_key === nextSelected)
        setDraft(current ? { ...current.policy } : null)
      } else {
        setDraft(null)
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const selectedModule = useMemo(() => modules.find((item) => item.module_key === selectedModuleKey) || null, [modules, selectedModuleKey])
  const filteredModules = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return modules
    return modules.filter((item) => {
      return [item.module_name, item.module_key, item.module_group, item.risk_level, item.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    })
  }, [modules, searchTerm])

  useEffect(() => {
    if (!selectedModule) return
    if (draft && draft.module_key === selectedModule.module_key) return
    setDraft({ ...selectedModule.policy })
  }, [draft, selectedModule])

  function updateDraft(patch: Partial<ModulePolicy>) {
    setDraft((current) => (current ? { ...current, ...patch } : current))
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
      const payload = await response.json().catch(() => null)
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

  const governanceCards = [
    {
      title: 'Auto Refresh Governance',
      description: 'Controls automated data refresh frequency and cost protection.',
      icon: RefreshCw,
      active: connected,
    },
    {
      title: 'Live Polling Governance',
      description: 'Manages real-time polling behavior and route pressure optimization.',
      icon: RadioTower,
      active: connected,
    },
    {
      title: 'Heavy Sync Governance',
      description: 'Governs large payload synchronizations and bandwidth protection.',
      icon: Layers3,
      active: connected,
    },
    {
      title: 'Standby Rules',
      description: 'Defines behavior during standby and failover conditions.',
      icon: ShieldCheck,
      active: connected,
    },
  ]

  const selectedPolicy = draft || selectedModule?.policy || null

  return (
    <section id="runtime-policy-studio" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_rgba(15,23,42,.06)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {connected ? 'Connected' : 'Not connected'}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
              <Lock className="h-3.5 w-3.5" />
              Production Safe
            </span>
          </div>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-slate-950">Runtime Policy Studio</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
            Configure refresh, polling, standby, emergency behavior and module-level cost rules.
          </p>
          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-900">
            Policies are saved to the runtime registry. Full module-wide enforcement requires modules to adopt runtime policy helpers.
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadModules()}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Registry
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-4">
        {governanceCards.map((card, index) => {
          const Icon = card.icon
          return (
            <article key={card.title} className={`rounded-[1.5rem] border bg-gradient-to-b from-white to-slate-50 p-5 shadow-[0_12px_26px_rgba(15,23,42,.05)] ${governanceTone(index)}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="rounded-2xl border border-current/15 bg-white/80 p-3">
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${statusChip(card.active)}`}>
                  {card.active ? 'Active' : 'Offline'}
                </span>
              </div>
              <div className="mt-4 text-base font-bold text-slate-950">{card.title}</div>
              <div className="mt-1 text-sm leading-6 text-slate-600">{card.description}</div>
            </article>
          )
        })}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.25fr_.95fr]">
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-base font-bold text-slate-950">Module Policy Registry</div>
              <div className="mt-1 text-sm text-slate-500">Policy engine registry and current runtime settings.</div>
            </div>
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
                placeholder="Search module..."
              />
            </div>
          </div>

          {!connected && !loading ? (
            <div className="mt-5 rounded-[1.35rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
              Policy engine not connected yet.
            </div>
          ) : (
            <div className="mt-5 overflow-hidden rounded-[1.35rem] border border-slate-200">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Module</th>
                    <th className="px-4 py-3">Risk</th>
                    <th className="px-4 py-3">Auto Refresh</th>
                    <th className="px-4 py-3">Interval</th>
                    <th className="px-4 py-3">Standby Behavior</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredModules.map((module) => (
                    <tr key={module.module_key}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-950">{module.module_name}</div>
                        <div className="mt-1 text-xs text-slate-500">{module.module_key}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${toneForRisk(module.risk_level)}`}>
                          {iconForRisk(module.risk_level)}
                          {module.risk_level || 'normal'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{module.policy.auto_refresh_enabled ? 'ON' : 'OFF'}</td>
                      <td className="px-4 py-3 text-slate-700">{formatDurationRange(module.policy.min_refresh_interval_ms, module.policy.max_refresh_interval_ms)}</td>
                      <td className="px-4 py-3 text-slate-700">{module.policy.standby_behavior}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${module.policy.allowed_during_standby ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                          {module.policy.allowed_during_standby ? 'Active' : 'Guarded'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedModuleKey(module.module_key)
                            setDraft({ ...module.policy })
                          }}
                          className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit Policy
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)] p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-base font-bold text-slate-950">Policy Editor</div>
              <div className="mt-1 text-sm text-slate-500">Module-level refresh and standby governance.</div>
            </div>
            <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${statusChip(Boolean(connected && selectedModule))}`}>
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
                    min={selectedModule.module_key === 'ceo-system-control' ? 60000 : 60000}
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

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Standby behavior</span>
                  <input
                    value={selectedPolicy.standby_behavior}
                    onChange={(event) => updateDraft({ standby_behavior: event.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                    placeholder="disable_non_core"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Emergency behavior</span>
                  <input
                    value={selectedPolicy.emergency_behavior}
                    onChange={(event) => updateDraft({ emergency_behavior: event.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                    placeholder="block"
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetDraft}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset Draft
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void savePolicy()}
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  <Settings2 className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Policy'}
                </button>
                <button
                  type="button"
                  onClick={applyRecommendation}
                  className="inline-flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
                >
                  <Sparkles className="h-4 w-4" />
                  Preview Recommendation
                </button>
              </div>

              <div className="rounded-[1.35rem] border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm leading-7 text-blue-900">
                Policy changes are saved to the runtime registry. Enforcement remains pending until each module adopts runtime policy helpers.
              </div>

              <div className="rounded-[1.35rem] border border-slate-200 bg-white p-4 text-sm text-slate-600">
                <div className="flex items-center gap-2 font-semibold text-slate-950">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  Safety note
                </div>
                <div className="mt-2 leading-7">
                  {selectedModule.module_key === 'ceo-system-control'
                    ? 'CEO control module stays available during standby and keeps the runtime governor reachable.'
                    : 'Changes here govern runtime behavior only. They do not modify business workflows or source files.'}
                </div>
              </div>
            </div>
          )}

          {message && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              {message}
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}
