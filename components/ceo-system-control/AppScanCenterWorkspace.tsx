'use client'

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  Gauge,
  Layers3,
  Lock,
  MonitorUp,
  RadioTower,
  RefreshCw,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
  Zap,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { safeUiInterval } from '@/lib/runtime/client-live-governor'

const SYSTEM_CONTROL_REFRESH_EVENT = 'system-control-refresh'

type ScanPolicy = {
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
}

type ModuleEntry = {
  id: string
  module_key: string
  module_name: string
  module_group?: string | null
  description?: string | null
  risk_level?: string | null
  status?: string | null
  cost_sensitivity?: string | null
  last_seen_at?: string | null
  policy: ScanPolicy
}

type RouteEntry = {
  id: string
  module_key: string | null
  route_path: string
  route_type: string
  method?: string | null
  is_api: boolean
  is_heavy: boolean
  is_live_sync: boolean
  is_allowed_in_standby: boolean
  risk_level: string
  detected_from?: string | null
  last_seen_at?: string | null
}

type ScanEvent = {
  id: string
  event_type?: string | null
  module_key?: string | null
  route_path?: string | null
  actor_email?: string | null
  before_payload?: Record<string, unknown>
  after_payload?: Record<string, unknown>
  message?: string | null
  created_at?: string | null
}

type ScanResponse = {
  ok: boolean
  connected: boolean
  limited?: boolean
  message?: string
  scan?: {
    id: string
    scan_type: string
    status: string
    modules_detected: number
    routes_detected: number
    api_routes_detected: number
    polling_sources_detected: number
    high_risk_items: number
    payload: {
      modules?: Array<{ module_key: string; module_name: string; risk_level?: string | null }>
      routes?: RouteEntry[]
      candidates?: Array<{ filePath: string; routePath: string | null; moduleKey: string | null; fileType: string; riskLevel: string; signals: string[] }>
      roots?: string[]
    }
    created_at?: string
    created_by?: string | null
  } | null
  modules?: ModuleEntry[]
  routes?: RouteEntry[]
  candidates?: Array<{ filePath: string; routePath: string | null; moduleKey: string | null; fileType: string; riskLevel: string; signals: string[] }>
  policyEvents?: ScanEvent[]
}

type ModulesResponse = {
  ok: boolean
  connected: boolean
  modules: ModuleEntry[]
}

type RoutesResponse = {
  ok: boolean
  connected: boolean
  routes: RouteEntry[]
}

const depthOptions = ['Quick', 'Standard', 'Deep', 'Full Infrastructure'] as const
const scopeChips = ['Frontend', 'APIs', 'Workers', 'Polling', 'Realtime', 'Database', 'Edge', 'Storage', 'Mobile'] as const

function riskChip(risk?: string | null) {
  const normalized = String(risk || 'normal').toLowerCase()
  if (normalized === 'critical') return 'border-rose-200 bg-rose-50 text-rose-700'
  if (normalized === 'high') return 'border-orange-200 bg-orange-50 text-orange-700'
  if (normalized === 'medium') return 'border-amber-200 bg-amber-50 text-amber-700'
  if (normalized === 'low') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  return 'border-slate-200 bg-slate-50 text-slate-600'
}

function liveStatusChip(active: boolean) {
  return active
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-slate-200 bg-slate-50 text-slate-500'
}

function formatInterval(value: number | null | undefined) {
  if (!Number.isFinite(Number(value))) return 'Not connected'
  const ms = Number(value)
  if (ms >= 60_000 && ms % 60_000 === 0) return `${Math.round(ms / 60_000)} min`
  if (ms >= 1_000) return `${Math.round(ms / 1_000)} sec`
  return `${ms} ms`
}

function recommendedInterval(module: ModuleEntry) {
  const risk = String(module.risk_level || 'normal').toLowerCase()
  if (module.module_key === 'ceo-system-control') return 60_000
  if (risk === 'critical') return 300_000
  if (risk === 'high') return 420_000
  if (risk === 'medium') return 600_000
  return 900_000
}

function findModuleCostPressure(module: ModuleEntry, scan?: ScanResponse['scan']) {
  if (!scan?.payload?.candidates?.length) return 0
  return scan.payload.candidates.filter((candidate) => candidate.moduleKey === module.module_key).length
}

function scanScore(scan?: ScanResponse['scan'], routes?: RouteEntry[]) {
  if (!scan) return null
  const modules = Math.max(scan.modules_detected, 1)
  const risk = scan.high_risk_items
  const routeLoad = routes?.length || scan.routes_detected
  const base = 100 - (risk * 3) - Math.min(routeLoad / 8, 18)
  return Math.max(30, Math.min(99, Math.round(base)))
}

function timelineLabel(value?: string | null) {
  if (!value) return 'Not connected'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not connected'
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export default function AppScanCenterWorkspace() {
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanStepIndex, setScanStepIndex] = useState(0)
  const [scanDepth, setScanDepth] = useState<typeof depthOptions[number]>('Deep')
  const [includeDormantModules, setIncludeDormantModules] = useState(true)
  const [detectOrphanRoutes, setDetectOrphanRoutes] = useState(true)
  const [classifyCostHeavyPaths, setClassifyCostHeavyPaths] = useState(true)
  const [checkPollingFrequency, setCheckPollingFrequency] = useState(true)
  const [detectDuplicateSyncFlows, setDetectDuplicateSyncFlows] = useState(true)
  const [modules, setModules] = useState<ModuleEntry[]>([])
  const [routes, setRoutes] = useState<RouteEntry[]>([])
  const [scan, setScan] = useState<ScanResponse['scan'] | null>(null)
  const [policyEvents, setPolicyEvents] = useState<ScanEvent[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [scanLimited, setScanLimited] = useState(false)
  const [selectedModuleKey, setSelectedModuleKey] = useState<string>('')
  const [liveRateDrafts, setLiveRateDrafts] = useState<Record<string, number>>({})
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const loadDataRef = useRef<() => Promise<void>>(async () => {})

  async function loadData() {
    setLoading(true)
    try {
      const [scanRes, routesRes, modulesRes] = await Promise.all([
        fetch('/api/system-control/scan', { cache: 'no-store' }),
        fetch('/api/system-control/routes', { cache: 'no-store' }),
        fetch('/api/system-control/modules', { cache: 'no-store' }),
      ])
      const scanPayload = await scanRes.json().catch(() => null) as ScanResponse | null
      const routesPayload = await routesRes.json().catch(() => null) as RoutesResponse | null
      const modulesPayload = await modulesRes.json().catch(() => null) as ModulesResponse | null

      const nextModules = Array.isArray(modulesPayload?.modules) ? modulesPayload.modules : []
      const nextRoutes = Array.isArray(routesPayload?.routes) ? routesPayload.routes : []
      const nextScan = scanPayload?.scan || null
      setConnected(Boolean(scanPayload?.connected || routesPayload?.connected || modulesPayload?.connected))
      setScanLimited(Boolean(scanPayload?.limited))
      setModules(nextModules)
      setRoutes(nextRoutes)
      setScan(nextScan)
      setPolicyEvents(Array.isArray(scanPayload?.policyEvents) ? scanPayload.policyEvents : [])
      const nextSelected = selectedModuleKey && nextModules.some((item) => item.module_key === selectedModuleKey)
        ? selectedModuleKey
        : nextModules[0]?.module_key || ''
      setSelectedModuleKey(nextSelected)
      setLiveRateDrafts((current) => {
        const next = { ...current }
        for (const module of nextModules) {
          if (next[module.module_key] == null) next[module.module_key] = module.policy.min_refresh_interval_ms
        }
        return next
      })
      if (scanPayload?.message) setMessage(scanPayload.message)
      if (scanPayload?.limited) setMessage(scanPayload.message || 'Runtime scan limited in production. Use build-time registry or manual module registration.')
    } catch {
      setConnected(false)
      setModules([])
      setRoutes([])
      setScan(null)
      setPolicyEvents([])
      setMessage('Runtime scan limited in production. Use build-time registry or manual module registration.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDataRef.current = loadData
  }, [loadData])

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    function handleRefresh(event: Event) {
      const customEvent = event as CustomEvent<{ source?: string }>
      if (customEvent.detail?.source === 'scan') return
      void loadDataRef.current()
    }

    window.addEventListener(SYSTEM_CONTROL_REFRESH_EVENT, handleRefresh)
    return () => window.removeEventListener(SYSTEM_CONTROL_REFRESH_EVENT, handleRefresh)
  }, [])

  const scanCandidates = scan?.payload?.candidates || []
  const score = scanScore(scan || undefined, routes)
  const activeRoutes = routes.length || scan?.routes_detected || 0
  const activeModules = modules.length || scan?.modules_detected || 0

  function beginAnimation() {
    setScanning(true)
    setScanProgress(8)
    setScanStepIndex(0)
    let index = 0
    const timer = window.setInterval(() => {
      index += 1
      setScanStepIndex(Math.min(index, 6))
      setScanProgress((current) => Math.min(92, current + 13))
      if (index >= 6) window.clearInterval(timer)
    }, safeUiInterval(850))
    return () => window.clearInterval(timer)
  }

  function dispatchRefresh(source: string) {
    window.dispatchEvent(new CustomEvent(SYSTEM_CONTROL_REFRESH_EVENT, { detail: { source } }))
  }

  async function runScan(scanType: 'quick' | 'full' | 'deep') {
    setLoadingAction(scanType)
    setMessage(null)
    const stop = beginAnimation()
    try {
      const response = await fetch('/api/system-control/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanType }),
      })
      const payload = await response.json().catch(() => null) as ScanResponse | null
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message || payload?.scan?.status || 'Scan failed.')
      }
      setScan(payload.scan || null)
      setConnected(Boolean(payload.connected))
      setScanLimited(Boolean(payload.limited))
      setMessage(payload.message || 'Scan completed.')
      await loadData()
      dispatchRefresh('scan')
      setScanProgress(100)
      setScanStepIndex(6)
      window.setTimeout(() => {
        setScanning(false)
        setScanProgress(0)
      }, 400)
    } catch (error) {
      setScanning(false)
      setScanProgress(0)
      setMessage(error instanceof Error ? error.message : 'Runtime scan limited in production. Use build-time registry or manual module registration.')
    } finally {
      stop()
      setLoadingAction(null)
    }
  }

  async function saveModulePolicy(module: ModuleEntry, nextRateMs: number) {
    setMessage(null)
    const minRefresh = Math.max(60_000, Math.floor(nextRateMs))
    const maxRefresh = Math.max(minRefresh, module.policy.max_refresh_interval_ms || minRefresh)
    try {
      const response = await fetch(`/api/system-control/modules/${encodeURIComponent(module.module_key)}/policy`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auto_refresh_enabled: module.policy.auto_refresh_enabled,
          live_polling_enabled: module.policy.live_polling_enabled,
          heavy_sync_enabled: module.policy.heavy_sync_enabled,
          min_refresh_interval_ms: minRefresh,
          max_refresh_interval_ms: maxRefresh,
          jitter_enabled: module.policy.jitter_enabled,
          standby_behavior: module.policy.standby_behavior,
          emergency_behavior: module.policy.emergency_behavior,
          allowed_during_standby: module.policy.allowed_during_standby,
          manual_override_enabled: module.policy.manual_override_enabled,
        }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || 'Unable to save runtime policy.')
      }
      setMessage(`Policy saved for ${module.module_name}.`)
      await loadData()
      dispatchRefresh('scan')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Runtime policy APIs not connected yet.')
    }
  }

  const topCostModules = useMemo(() => {
    const counts = new Map<string, number>()
    for (const candidate of scanCandidates) {
      if (!candidate.moduleKey) continue
      counts.set(candidate.moduleKey, (counts.get(candidate.moduleKey) || 0) + 1)
    }
    return [...counts.entries()]
      .map(([moduleKey, count]) => {
        const module = modules.find((item) => item.module_key === moduleKey)
        return {
          moduleKey,
          name: module?.module_name || moduleKey,
          count,
          risk: module?.risk_level || 'normal',
        }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [modules, scanCandidates])

  const findings = useMemo(() => {
    return scanCandidates
      .map((candidate, index) => {
        const module = modules.find((item) => item.module_key === candidate.moduleKey)
        const severity = candidate.riskLevel === 'critical' ? 'CRITICAL' : candidate.riskLevel === 'high' ? 'HIGH' : candidate.riskLevel === 'medium' ? 'MEDIUM' : 'LOW'
        const detected = index < 3 ? 'just now' : candidate.signals.length ? `${candidate.signals.length} signals` : 'scan result'
        return {
          severity,
          finding: candidate.signals.length ? candidate.signals.join(', ') : 'Route inspected',
          module: module?.module_name || candidate.moduleKey || 'Unknown',
          impact: candidate.riskLevel === 'critical' || candidate.riskLevel === 'high' ? 'High Risk' : 'Moderate Risk',
          detected,
          action: candidate.routePath ? `Review ${candidate.routePath}` : 'Inspect',
          status: candidate.riskLevel === 'critical' || candidate.riskLevel === 'high' ? 'Open' : 'Investigating',
        }
      })
      .slice(0, 10)
  }, [modules, scanCandidates])

  const optimizationChecklist = [
    { label: 'Reduce non-critical polling', complete: (scan?.polling_sources_detected || 0) < 10 },
    { label: 'Move dashboards to guarded refresh mode', complete: modules.every((item) => item.policy.min_refresh_interval_ms >= 300_000 || item.module_key === 'ceo-system-control') },
    { label: 'Align module runtime policies', complete: modules.length > 0 },
    { label: 'Throttle idle scanners', complete: (scanCandidates.length || 0) < 5 },
    { label: 'Consolidate duplicated events', complete: policyEvents.length > 0 },
    { label: 'Protect CEO-only overrides', complete: true },
  ]

  const efficiencyScore = score != null ? `${score}/100` : 'Not connected'

  const moduleRegistryRows = useMemo(() => {
    return modules.map((module) => {
      const route = routes.find((item) => item.module_key === module.module_key)
      return {
        module,
        route,
        currentRate: module.policy.min_refresh_interval_ms,
        recommendedRate: recommendedInterval(module),
        refreshMode: module.policy.allowed_during_standby ? 'Guarded' : module.policy.auto_refresh_enabled ? 'Auto' : 'Manual',
        costPressure: findModuleCostPressure(module, scan),
      }
    })
  }, [modules, routes, scan])

  return (
    <section id="app-scan-center" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_rgba(15,23,42,.06)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${liveStatusChip(Boolean(connected))}`}>
              <ShieldCheck className="h-3.5 w-3.5" />
              {scanLimited ? 'Runtime scan limited in production' : connected ? 'Live Scan: Active' : 'Local scan available'}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-700">
              <Lock className="h-3.5 w-3.5" />
              CEO Only
            </span>
          </div>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-slate-950">App Scan Center</h2>
          <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-600">
            Local filesystem scan, module discovery, configuration control, and rule-based risk indicators.
          </p>
          {scanLimited || !connected ? (
            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-900">
              {scanLimited
                ? 'Runtime scan limited in production. Use build-time registry or manual module registration when filesystem access is unavailable.'
                : 'Local scan available. This workspace reads the filesystem and local registry snapshots.'}
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-7 text-sky-900">
              Rule-based findings are derived from the registry and latest scan payload.
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={scanning || loadingAction !== null} onClick={() => void runScan('quick')} className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60" title="Runs a real backend scan">
            <Zap className="h-4 w-4" />
            {loadingAction === 'quick' ? 'Running...' : 'Run Quick Scan'}
          </button>
          <button type="button" disabled={scanning || loadingAction !== null} onClick={() => void runScan('full')} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60" title="Runs a real backend scan">
            <MonitorUp className="h-4 w-4" />
            {loadingAction === 'full' ? 'Running...' : 'Run Full Scan'}
          </button>
          <button type="button" disabled={scanning || loadingAction !== null} onClick={() => void runScan('deep')} className="inline-flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60" title="Runs a real backend scan">
            <Sparkles className="h-4 w-4" />
            {loadingAction === 'deep' ? 'Running...' : 'Deep Scan'}
          </button>
          <button type="button" disabled className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-50" title="No real backend action available yet">
            <Download className="h-4 w-4" />
            Export Report
          </button>
          <button type="button" disabled className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition disabled:cursor-not-allowed disabled:opacity-50" title="No real backend action available yet">
            <CheckCircle2 className="h-4 w-4" />
            Apply Safe Optimization
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-6">
        {[
          { label: 'Modules Discovered', value: scan?.modules_detected ?? activeModules, icon: Layers3, helper: 'Local scan available' },
          { label: 'Endpoints Monitored', value: scan?.routes_detected ?? activeRoutes, icon: Route, helper: 'Rule-based routing view' },
          { label: 'Rule-based Risk Indicators', value: scan?.high_risk_items ?? scanCandidates.length, icon: AlertCircle, helper: 'Not Vercel billing truth' },
          { label: 'Auto-Refresh Rules', value: modules.filter((item) => item.policy.auto_refresh_enabled).length || 'Not connected', icon: RefreshCw, helper: 'Registry-backed' },
          { label: 'Config Drift Signals', value: scanCandidates.length || 'Not connected', icon: ShieldCheck, helper: 'Rule-based findings' },
          { label: 'Estimated Risk Score', value: efficiencyScore, icon: Gauge, helper: 'Derived from scan signals' },
        ].map((card) => {
          const Icon = card.icon
          return (
            <article key={card.label} className="rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,.04)]">
              <div className="flex items-start justify-between gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-blue-600">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-right text-xs text-slate-400">{loading ? 'Loading' : connected ? 'Live' : 'Preview'}</div>
              </div>
              <div className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{card.label}</div>
              <div className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">{card.value as string | number}</div>
              <div className="mt-2 text-xs leading-5 text-slate-500">{card.helper}</div>
            </article>
          )
        })}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.05fr_.95fr]">
        <section className="rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-base font-bold text-slate-950">Scan Orchestration Center</div>
              <div className="mt-1 text-sm text-slate-500">Depth, scope, and risk classification controls.</div>
            </div>
            <div className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
              {scanDepth}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {depthOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setScanDepth(option)}
                className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition ${scanDepth === option ? 'border-blue-200 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                title="Preview only - not saved."
              >
                {option}
              </button>
            ))}
          </div>
          <div className="mt-2 text-xs text-slate-500">Depth selection is preview only and does not persist.</div>

          <div className="mt-5 flex flex-wrap gap-2">
            {scopeChips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600"
              >
                {chip}
              </span>
            ))}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              { label: 'Include dormant modules', value: includeDormantModules, onChange: setIncludeDormantModules },
              { label: 'Detect orphan routes', value: detectOrphanRoutes, onChange: setDetectOrphanRoutes },
              { label: 'Classify cost-heavy paths', value: classifyCostHeavyPaths, onChange: setClassifyCostHeavyPaths },
              { label: 'Check polling frequency', value: checkPollingFrequency, onChange: setCheckPollingFrequency },
              { label: 'Detect duplicate sync flows', value: detectDuplicateSyncFlows, onChange: setDetectDuplicateSyncFlows },
            ].map((item) => (
              <label key={item.label} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <span className="text-sm font-medium text-slate-800">{item.label}</span>
                <input
                  type="checkbox"
                  checked={item.value}
                  onChange={(event) => item.onChange(event.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-blue-600"
                />
              </label>
            ))}
          </div>
          <div className="mt-2 text-xs text-slate-500">Scan orchestration settings are preview only and do not persist.</div>

          <div className="mt-5 rounded-[1.35rem] border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-950">Scan Progress</div>
                <div className="text-xs text-slate-500">{scanning ? 'Discovery pipeline running' : 'Ready'}</div>
              </div>
              <div className="text-sm font-bold text-slate-950">{Math.round(scanProgress)}%</div>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all" style={{ width: `${scanProgress}%` }} />
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              {['Discovery', 'Classification', 'Cost Analysis', 'Drift Analysis', 'Risk Scoring', 'Optimization Draft', 'Approval Ready'].map((step, index) => {
                const active = index <= scanStepIndex
                return (
                  <div key={step} className={`rounded-2xl border px-3 py-3 text-sm ${active ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                    <div className="font-semibold">{step}</div>
                    <div className="mt-1 text-xs">{active ? 'In progress or complete' : 'Pending'}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-base font-bold text-slate-950">Discovered Module Registry</div>
              <div className="mt-1 text-sm text-slate-500">Runtime-discovered modules and health signals.</div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              <Search className="h-3.5 w-3.5" />
              {modules.length || 0} modules
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-[1.35rem] border border-slate-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Module</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Live Status</th>
                  <th className="px-4 py-3">Scan Health</th>
                  <th className="px-4 py-3">Last Scan</th>
                  <th className="px-4 py-3">Refresh Profile</th>
                  <th className="px-4 py-3">Risk Signals</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {(moduleRegistryRows.length ? moduleRegistryRows : []).map(({ module, route, currentRate, recommendedRate, refreshMode, costPressure }) => (
                  <tr key={module.module_key}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-950">{module.module_name}</div>
                      <div className="mt-1 text-xs text-slate-500">{module.module_key}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{module.module_group || 'Module'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${module.status === 'active' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                        {module.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${riskChip(module.risk_level)}`}>
                        {module.risk_level || 'normal'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{timelineLabel(module.last_seen_at)}</td>
                    <td className="px-4 py-3 text-slate-700">
                      <div className="space-y-2">
                        <div>{refreshMode}</div>
                        <div className="text-xs text-slate-500">{formatInterval(currentRate)} current, {formatInterval(recommendedRate)} recommended</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{costPressure ? `${costPressure} rule-based signals` : 'Low'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" disabled title="Requires module-level API" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
                          <Search className="h-3.5 w-3.5" />
                          Inspect
                        </button>
                        <button type="button" disabled title="Requires module-level API" className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                          <SlidersHorizontal className="h-3.5 w-3.5" />
                          Tune
                        </button>
                        <button type="button" disabled title="Requires module-level API" className="inline-flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 disabled:cursor-not-allowed disabled:opacity-50">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Policies
                        </button>
                        <button type="button" disabled title="Requires module-level API" className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
                          <Clock3 className="h-3.5 w-3.5" />
                          Logs
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            <section className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-950">Rule-based Risk Detection</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { label: 'Top Risk Modules', value: topCostModules.slice(0, 3).map((item) => item.name).join(', ') || 'Not connected yet' },
                  { label: 'Polling Signals', value: scan?.polling_sources_detected || 'Not connected yet' },
                  { label: 'API Route Signals', value: scan?.api_routes_detected || routes.filter((item) => item.is_api).length || 'Not connected yet' },
                  { label: 'Edge / Function Signals', value: scanCandidates.length || 'Not connected yet' },
                  { label: 'Traffic Risk Signals', value: scan?.high_risk_items || 'Not connected yet' },
                  { label: 'Estimated Vercel Risk Only', value: 'Not connected yet' },
                  { label: 'Invocation Signals', value: scan?.routes_detected || 'Not connected yet' },
                  { label: 'Transfer Signals', value: 'Not connected yet' },
                ].map((card) => (
                  <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{card.label}</div>
                    <div className="mt-2 text-sm font-bold text-slate-950">{String(card.value)}</div>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-[1.35rem] border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-slate-950">Refresh Rate & Sync Governance</div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Guarded</span>
              </div>
              <div className="mt-4 space-y-4">
                {moduleRegistryRows.slice(0, 6).map(({ module, currentRate, recommendedRate, refreshMode }) => (
                  <div key={module.module_key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-950">{module.module_name}</div>
                        <div className="text-xs text-slate-500">{refreshMode}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void saveModulePolicy(module, liveRateDrafts[module.module_key] || currentRate)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-3 py-2 text-xs font-bold text-white"
                      >
                        Save Policy
                      </button>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
                      <input
                        type="range"
                        min={60_000}
                        max={900_000}
                        step={30_000}
                        value={liveRateDrafts[module.module_key] || currentRate}
                        onChange={(event) => setLiveRateDrafts((current) => ({ ...current, [module.module_key]: Number(event.target.value) }))}
                        className="w-full"
                      />
                      <div className="text-right text-xs text-slate-500">
                        <div>{formatInterval(liveRateDrafts[module.module_key] || currentRate)} live</div>
                        <div>{formatInterval(recommendedRate)} recommended</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_.9fr]">
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-base font-bold text-slate-950">Rule-based Findings / Priority Queue</div>
              <div className="mt-1 text-sm text-slate-500">Actionable candidates from the latest rule-based scan payload.</div>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              {findings.length} findings
            </div>
          </div>
          <div className="mt-4 overflow-hidden rounded-[1.35rem] border border-slate-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Finding</th>
                  <th className="px-4 py-3">Module</th>
                  <th className="px-4 py-3">Impact</th>
                  <th className="px-4 py-3">Detected</th>
                  <th className="px-4 py-3">Recommended Action</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {findings.length ? findings.map((finding, index) => (
                  <tr key={`${finding.module}-${index}`}>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${riskChip(finding.severity.toLowerCase())}`}>
                        {finding.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{finding.finding}</td>
                    <td className="px-4 py-3 font-semibold text-slate-950">{finding.module}</td>
                    <td className="px-4 py-3 text-slate-700">{finding.impact}</td>
                    <td className="px-4 py-3 text-slate-500">{finding.detected}</td>
                    <td className="px-4 py-3 text-slate-700">{finding.action}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${finding.status === 'Open' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                        {finding.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td className="px-4 py-6 text-sm text-slate-500" colSpan={7}>
                      No findings yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
            <div className="text-base font-bold text-slate-950">Safe Optimization Plan</div>
            <div className="mt-4 space-y-3">
              {optimizationChecklist.map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-800">{item.label}</span>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${item.complete ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500'}`}>
                      {item.complete ? 'Ready' : 'Pending'}
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-500" style={{ width: `${item.complete ? 100 : 40}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-base font-bold text-slate-950">Audit / Scan Timeline</div>
                  <div className="mt-1 text-sm text-slate-500">Latest scan plus policy events.</div>
                </div>
                <button type="button" onClick={() => void loadData()} className="text-sm font-semibold text-blue-700" title="Refresh the latest timeline data">
                  Refresh Timeline
                </button>
              </div>
            <div className="mt-4 space-y-3">
              {[...(policyEvents.slice(0, 4) || [])].map((event) => (
                <div key={event.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-950">{event.event_type || 'policy event'}</div>
                      <div className="mt-1 text-xs text-slate-500">{event.message || 'Policy event recorded.'}</div>
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{timelineLabel(event.created_at || null)}</span>
                  </div>
                </div>
              ))}
              {scan && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-sm font-semibold text-slate-950">{scan.scan_type}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {scan.modules_detected} modules scanned, {scan.routes_detected} routes scanned.
                  </div>
                </div>
              )}
              {!policyEvents.length && !scan && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                  No timeline data yet.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)] p-4">
            <div className="text-base font-bold text-slate-950">Configuration Blueprint</div>
            <div className="mt-4 flex flex-col gap-3">
              {[
                { label: 'Discover', detail: 'Auto discovery of modules & services' },
                { label: 'Classify', detail: 'Type, risk, and cost segmentation' },
                { label: 'Govern', detail: 'Apply runtime policies and guards' },
                { label: 'Optimize', detail: 'Draft safe changes and throttles' },
                { label: 'Monitor', detail: 'Continuous oversight and audit' },
              ].map((step, index) => (
                <div key={step.label} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-sm font-black text-blue-700">{index + 1}</div>
                  <div className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <div className="text-sm font-semibold text-slate-950">{step.label}</div>
                    <div className="text-xs text-slate-500">{step.detail}</div>
                  </div>
                  {index < 4 && <ArrowRight className="h-4 w-4 text-slate-400" />}
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {message && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {message}
        </div>
      )}
    </section>
  )
}
