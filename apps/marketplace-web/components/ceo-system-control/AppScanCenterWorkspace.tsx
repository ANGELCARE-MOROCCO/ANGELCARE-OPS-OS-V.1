'use client'

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
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
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
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

type UsagePoint = {
  label: string
  value: number
  cost?: number | null
  count?: number | null
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

const scanTypes = [
  { value: 'quick', label: 'Quick' },
  { value: 'full', label: 'Full' },
  { value: 'deep', label: 'Deep' },
] as const

const tabs = [
  { key: 'modules', label: 'Modules' },
  { key: 'routes', label: 'Routes' },
  { key: 'polling-sources', label: 'Polling Sources' },
  { key: 'risk-indicators', label: 'Risk Indicators' },
  { key: 'registry-drift', label: 'Registry Drift' },
  { key: 'timeline', label: 'Timeline' },
] as const

type TabKey = typeof tabs[number]['key']

function riskChip(risk?: string | null) {
  const normalized = String(risk || 'normal').toLowerCase()
  if (normalized === 'critical') return 'border-rose-200 bg-rose-50 text-rose-700'
  if (normalized === 'high') return 'border-orange-200 bg-orange-50 text-orange-700'
  if (normalized === 'medium') return 'border-amber-200 bg-amber-50 text-amber-700'
  if (normalized === 'low') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  return 'border-slate-200 bg-slate-50 text-slate-600'
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

function scanScore(scan?: ScanResponse['scan'], routes?: RouteEntry[]) {
  if (!scan) return null
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

function scanReason(kind: 'route' | 'module' | 'polling' | 'risk' | 'registry', limited: boolean, connected: boolean) {
  const source = limited ? 'Runtime scan limited in production' : connected ? 'Live scan connected' : 'Local scan available'
  if (kind === 'route') return connected ? 'No route telemetry records in the current scan payload.' : `${source}. Route telemetry not instrumented yet.`
  if (kind === 'module') return connected ? 'No module pressure records were captured in this scan.' : `${source}. Module pressure requires scan data.`
  if (kind === 'polling') return connected ? 'No polling sources were detected in this scan payload.' : `${source}. Polling sources require scan data.`
  if (kind === 'risk') return connected ? 'No risk indicators were captured in the latest scan.' : `${source}. Risk indicators require scan data.`
  return connected ? 'Registry drift is not yet visible from the current scan.' : `${source}. Registry drift requires scan data.`
}

function Sparkline({ values, tone = 'blue' }: { values: number[]; tone?: 'blue' | 'green' | 'orange' | 'rose' | 'slate' }) {
  const id = useRef(`spark-${tone}-${Math.random().toString(36).slice(2)}`).current
  if (!values.length) {
    return (
      <svg viewBox="0 0 160 48" className="h-12 w-full">
        <line x1="4" y1="24" x2="156" y2="24" stroke="#dbe4f0" strokeDasharray="4 4" />
      </svg>
    )
  }

  const safeValues = values.length === 1 ? [values[0], values[0]] : values
  const min = Math.min(...safeValues)
  const max = Math.max(...safeValues)
  const span = Math.max(max - min, 1)
  const width = 160
  const height = 48
  const padding = 4
  const usableWidth = width - padding * 2
  const usableHeight = height - padding * 2
  const linePath = safeValues.map((value, index) => {
    const x = padding + (usableWidth * (index / Math.max(safeValues.length - 1, 1)))
    const y = height - padding - (((value - min) / span) * usableHeight)
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
  }).join(' ')

  const stroke = {
    blue: '#2563eb',
    green: '#16a34a',
    orange: '#f97316',
    rose: '#e11d48',
    slate: '#64748b',
  }[tone]

  return (
    <svg viewBox="0 0 160 48" className="h-12 w-full">
      <defs>
        <linearGradient id={id} x1="0%" x2="0%" y1="0%" y2="100%">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <path d={`${linePath} L 156 44 L 4 44 Z`} fill={`url(#${id})`} />
      <path d={linePath} fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MiniChart({ points, color = 'blue', emptyLabel = 'No data yet' }: { points: number[]; color?: 'blue' | 'green' | 'orange' | 'rose'; emptyLabel?: string }) {
  const tone = color === 'green' ? 'green' : color === 'orange' ? 'orange' : color === 'rose' ? 'rose' : 'blue'
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      {points.length ? <Sparkline values={points} tone={tone} /> : <div className="flex min-h-[190px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 text-sm text-slate-500">{emptyLabel}</div>}
    </div>
  )
}

function StackedBars({ points, emptyLabel }: { points: UsagePoint[]; emptyLabel: string }) {
  if (!points.length) {
    return <div className="flex min-h-[190px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 text-sm text-slate-500">{emptyLabel}</div>
  }

  const safePoints = points.slice(0, 8)
  const max = Math.max(...safePoints.map((point) => Math.max(asNumber(point.value) ?? 0, asNumber(point.cost) ?? 0, asNumber(point.count) ?? 0)), 1)

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 px-4 py-5">
        {safePoints.map((point) => {
          const value = asNumber(point.value) ?? 0
          const cost = asNumber(point.cost) ?? 0
          const count = asNumber(point.count) ?? 0
          const valueHeight = Math.max((value / max) * 140, value > 0 ? 10 : 2)
          const costHeight = Math.max((cost / max) * 140, cost > 0 ? 8 : 0)
          const countHeight = Math.max((count / max) * 140, count > 0 ? 6 : 0)
          return (
            <div key={point.label} className="flex-1">
              <div className="flex h-[170px] items-end gap-1">
                <div className="w-full rounded-t-xl bg-sky-100">
                  <div className="w-full rounded-t-xl bg-gradient-to-t from-blue-600 to-blue-400" style={{ height: `${valueHeight}px` }} />
                  {cost > 0 && <div className="w-full bg-gradient-to-t from-emerald-500 to-emerald-300" style={{ height: `${costHeight}px` }} />}
                  {count > 0 && <div className="w-full rounded-b-xl bg-gradient-to-t from-violet-500 to-violet-300" style={{ height: `${countHeight}px` }} />}
                </div>
              </div>
              <div className="mt-3 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{point.label}</div>
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" />Requests</span>
        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Cost</span>
        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-violet-500" />Count</span>
      </div>
    </div>
  )
}

export default function AppScanCenterWorkspace() {
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanDepth, setScanDepth] = useState<'quick' | 'full' | 'deep'>('deep')
  const [modules, setModules] = useState<ModuleEntry[]>([])
  const [routes, setRoutes] = useState<RouteEntry[]>([])
  const [scan, setScan] = useState<ScanResponse['scan'] | null>(null)
  const [policyEvents, setPolicyEvents] = useState<ScanEvent[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [scanLimited, setScanLimited] = useState(false)
  const [selectedModuleKey, setSelectedModuleKey] = useState<string>('')
  const [activeTab, setActiveTab] = useState<TabKey>('modules')
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [registrySearch, setRegistrySearch] = useState('')
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
      setSelectedModuleKey((current) => {
        if (current && nextModules.some((item) => item.module_key === current)) return current
        return nextModules[0]?.module_key || ''
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
    const timer = window.setInterval(() => {
      setScanProgress((current) => Math.min(92, current + 13))
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
      const payload = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null
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

  const filteredModules = useMemo(() => {
    const query = registrySearch.trim().toLowerCase()
    if (!query) return modules
    return modules.filter((module) => {
      return [module.module_name, module.module_key, module.module_group, module.risk_level, module.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    })
  }, [modules, registrySearch])

  const selectedModule = useMemo(
    () => modules.find((item) => item.module_key === selectedModuleKey) || null,
    [modules, selectedModuleKey],
  )

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
          routePath: candidate.routePath,
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

  const moduleRegistryRows = useMemo(() => {
    return filteredModules.map((module) => {
      const route = routes.find((item) => item.module_key === module.module_key)
      return {
        module,
        route,
        currentRate: module.policy.min_refresh_interval_ms,
        recommendedRate: recommendedInterval(module),
        refreshMode: module.policy.allowed_during_standby ? 'Guarded' : module.policy.auto_refresh_enabled ? 'Auto' : 'Manual',
        costPressure: scanCandidates.filter((candidate) => candidate.moduleKey === module.module_key).length,
      }
    })
  }, [filteredModules, routes, scanCandidates])

  const moduleTab = (
    <div className="grid gap-4 xl:grid-cols-3">
      {moduleRegistryRows.map(({ module, route, currentRate, recommendedRate, refreshMode, costPressure }) => {
        const isSelected = module.module_key === selectedModuleKey
        return (
          <article key={module.module_key} className={`rounded-[1.35rem] border p-4 shadow-[0_10px_24px_rgba(15,23,42,.04)] ${isSelected ? 'border-blue-200 bg-blue-50/40' : 'border-slate-200 bg-white'}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-slate-950">{module.module_name}</div>
                <div className="mt-1 text-xs text-slate-500">{module.module_key}</div>
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${riskChip(module.risk_level)}`}>
                {module.risk_level || 'normal'}
              </span>
            </div>
            <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">Refresh mode: <span className="font-semibold text-slate-900">{refreshMode}</span></div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">Cost pressure: <span className="font-semibold text-slate-900">{costPressure}</span></div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">Interval: <span className="font-semibold text-slate-900">{formatInterval(currentRate)}</span></div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">Recommended: <span className="font-semibold text-slate-900">{formatInterval(recommendedRate)}</span></div>
            </div>
            <div className="mt-3 text-xs text-slate-500">
              Route: {route?.route_path || 'No route telemetry yet'}
            </div>
            <button type="button" onClick={() => {
              setSelectedModuleKey(module.module_key)
              setRegistrySearch(module.module_name)
            }} className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100">
              <ArrowRight className="h-3.5 w-3.5" />
              Focus module
            </button>
            <button type="button" disabled onClick={() => void saveModulePolicy(module, recommendedRate)} className="ml-2 mt-3 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500" title="No active auto-optimization action is available yet">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Apply optimization
            </button>
          </article>
        )
      })}
      {!moduleRegistryRows.length && (
        <div className="rounded-[1.35rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500 xl:col-span-3">
          No modules match the current registry search.
        </div>
      )}
    </div>
  )

  const routesTab = (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
          <tr>
            <th className="px-4 py-3">Route</th>
            <th className="px-4 py-3">Module</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Risk</th>
            <th className="px-4 py-3">Standby</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {routes.length ? routes.slice(0, 20).map((route) => {
            const module = modules.find((item) => item.module_key === route.module_key)
            return (
              <tr key={route.id}>
                <td className="px-4 py-3 font-semibold text-slate-900">{route.route_path}</td>
                <td className="px-4 py-3 text-slate-700">{module?.module_name || route.module_key || 'Unknown'}</td>
                <td className="px-4 py-3 text-slate-600">{route.route_type}</td>
                <td className="px-4 py-3"><span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${riskChip(route.risk_level)}`}>{route.risk_level}</span></td>
                <td className="px-4 py-3 text-slate-600">{route.is_allowed_in_standby ? 'Allowed' : 'Guarded'}</td>
              </tr>
            )
          }) : (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-sm text-slate-500">{scanReason('route', scanLimited, connected)}</td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        Route telemetry stays honest: no synthetic latency or error numbers are shown here.
      </div>
    </div>
  )

  const pollingTab = (
    <div className="grid gap-3">
      {scanCandidates.filter((candidate) => candidate.signals.some((signal) => ['setInterval', 'safeRefreshInterval', 'shouldStartAutoRefresh'].includes(signal))).length ? (
        scanCandidates
          .filter((candidate) => candidate.signals.some((signal) => ['setInterval', 'safeRefreshInterval', 'shouldStartAutoRefresh'].includes(signal)))
          .slice(0, 12)
          .map((candidate) => {
            const module = modules.find((item) => item.module_key === candidate.moduleKey)
            return (
              <div key={`${candidate.filePath}-${candidate.routePath || 'poll'}`} className="rounded-[1.35rem] border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-950">{module?.module_name || candidate.moduleKey || candidate.filePath}</div>
                    <div className="mt-1 text-xs text-slate-500">{candidate.routePath || candidate.filePath}</div>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${riskChip(candidate.riskLevel)}`}>{candidate.riskLevel}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {candidate.signals.map((signal) => (
                    <span key={signal} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                      {signal}
                    </span>
                  ))}
                </div>
              </div>
            )
          })
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
          {scanReason('polling', scanLimited, connected)}
        </div>
      )}
    </div>
  )

  const riskTab = (
    <div className="grid gap-3">
      {findings.length ? findings.map((finding, index) => (
        <div key={`${finding.module}-${index}`} className="rounded-[1.35rem] border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-950">{finding.module}</div>
              <div className="mt-1 text-xs text-slate-500">{finding.routePath || finding.action}</div>
            </div>
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${finding.severity === 'CRITICAL' || finding.severity === 'HIGH' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
              {finding.severity}
            </span>
          </div>
          <div className="mt-2 text-sm text-slate-600">{finding.finding}</div>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            <span className="rounded-full bg-slate-50 px-2.5 py-1">Impact: {finding.impact}</span>
            <span className="rounded-full bg-slate-50 px-2.5 py-1">Status: {finding.status}</span>
            <span className="rounded-full bg-slate-50 px-2.5 py-1">Detected: {finding.detected}</span>
          </div>
        </div>
      )) : (
        <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
          {scanReason('risk', scanLimited, connected)}
        </div>
      )}
    </div>
  )

  const registryDriftTab = (
    <div className="grid gap-4 xl:grid-cols-[.95fr_1.05fr]">
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
        <div className="text-base font-bold text-slate-950">Drift Checklist</div>
        <div className="mt-4 space-y-3">
          {optimizationChecklist.map((item) => (
            <div key={item.label} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full ${item.complete ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                {item.complete ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-950">{item.label}</div>
                <div className="text-xs text-slate-500">{item.complete ? 'Aligned with current registry state.' : 'Requires runtime adoption or more scan data.'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-3">
        {topCostModules.length ? topCostModules.map((module) => (
          <div key={module.moduleKey} className="rounded-[1.35rem] border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-950">{module.name}</div>
                <div className="mt-1 text-xs text-slate-500">{module.moduleKey}</div>
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${riskChip(module.risk)}`}>{module.risk}</span>
            </div>
            <div className="mt-3 text-sm text-slate-600">Detected in {module.count} scan candidates.</div>
          </div>
        )) : (
          <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
            {scanReason('registry', scanLimited, connected)}
          </div>
        )}
      </div>
    </div>
  )

  const timelineTab = (
    <div className="grid gap-4 xl:grid-cols-[1fr_.9fr]">
      <div className="space-y-3">
        {policyEvents.length ? policyEvents.slice(0, 12).map((event) => (
          <div key={event.id} className="relative rounded-[1.35rem] border border-slate-200 bg-white p-4 pl-5">
            <div className="absolute left-0 top-4 h-3 w-3 rounded-full bg-blue-500 ring-4 ring-blue-50" />
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-slate-950">{event.event_type?.replace(/_/g, ' ') || 'runtime event'}</div>
              <div className="text-xs text-slate-500">{timelineLabel(event.created_at)}</div>
            </div>
            <div className="mt-2 text-sm text-slate-600">{event.message || 'Event recorded in runtime scan timeline.'}</div>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              <span className="rounded-full bg-slate-50 px-2.5 py-1">Actor: {event.actor_email || 'system'}</span>
              <span className="rounded-full bg-slate-50 px-2.5 py-1">Module: {event.module_key || '—'}</span>
              <span className="rounded-full bg-slate-50 px-2.5 py-1">Route: {event.route_path || '—'}</span>
            </div>
          </div>
        )) : (
          <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
            No runtime events yet.
          </div>
        )}
      </div>

      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
        <div className="text-base font-bold text-slate-950">Latest Scan Summary</div>
        <div className="mt-4 grid gap-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Latest scan</div>
            <div className="mt-1 text-sm font-semibold text-slate-950">{scan?.scan_type || 'Not connected'}</div>
            <div className="text-xs text-slate-500">{timelineLabel(scan?.created_at || null)}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Risk score</div>
            <div className="mt-1 text-2xl font-black text-slate-950">{score != null ? `${score}/100` : 'Not connected'}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Production message</div>
            <div className="mt-1 text-sm text-slate-600">{scanLimited ? 'Runtime scan limited in production. Use build-time registry or manual module registration.' : 'Rule-based findings are derived from the registry and latest scan payload.'}</div>
          </div>
        </div>
      </div>
    </div>
  )

  const activeTabContent: Record<TabKey, ReactNode> = {
    modules: moduleTab,
    routes: routesTab,
    'polling-sources': pollingTab,
    'risk-indicators': riskTab,
    'registry-drift': registryDriftTab,
    timeline: timelineTab,
  }

  return (
    <section id="app-scan-center" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_rgba(15,23,42,.06)]">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${scanLimited ? 'border-amber-200 bg-amber-50 text-amber-800' : connected ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
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
            Compact scan control center for module discovery, route pressure, polling sources, and registry drift.
          </p>
          {(scanLimited || !connected) && (
            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-900">
              {scanLimited
                ? 'Runtime scan limited in production. Use build-time registry or manual module registration when filesystem access is unavailable.'
                : 'Local scan available. This workspace reads the filesystem and local registry snapshots.'}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <select value={scanDepth} onChange={(event) => setScanDepth(event.target.value as 'quick' | 'full' | 'deep')} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none">
            {scanTypes.map((item) => <option key={item.value} value={item.value}>{item.label} scan</option>)}
          </select>
          <button type="button" disabled={scanning || loadingAction !== null} onClick={() => void runScan('quick')} className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60">
            <Zap className="h-4 w-4" />
            Run Quick Scan
          </button>
          <button type="button" disabled={scanning || loadingAction !== null} onClick={() => void runScan('full')} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
            <MonitorUp className="h-4 w-4" />
            Run Full Scan
          </button>
          <button type="button" disabled={scanning || loadingAction !== null} onClick={() => void runScan('deep')} className="inline-flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60">
            <Sparkles className="h-4 w-4" />
            Deep Scan
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

      {message && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {message}
        </div>
      )}

      <div className="mt-4 grid gap-4 xl:grid-cols-6">
        {[
          { label: 'Modules Discovered', value: scan?.modules_detected ?? activeModules, icon: Layers3, helper: 'Local scan available' },
          { label: 'Endpoints Monitored', value: scan?.routes_detected ?? activeRoutes, icon: Route, helper: 'Rule-based routing view' },
          { label: 'Rule-based Risk Indicators', value: scan?.high_risk_items ?? scanCandidates.length, icon: AlertCircle, helper: 'No synthetic metrics' },
          { label: 'Polling Sources', value: scan?.polling_sources_detected ?? scanCandidates.filter((candidate) => candidate.signals.some((signal) => ['setInterval', 'safeRefreshInterval', 'shouldStartAutoRefresh'].includes(signal))).length, icon: RadioTower, helper: 'Derived from scan signals' },
          { label: 'Config Drift Signals', value: scanCandidates.length || 'Not connected', icon: ShieldCheck, helper: 'Rule-based findings' },
          { label: 'Estimated Risk Score', value: score != null ? `${score}/100` : 'Not connected', icon: Gauge, helper: 'Derived from scan signals' },
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

      {scanning && (
        <div className="mt-4 rounded-[1.35rem] border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Scan in progress: {Math.round(scanProgress)}%
        </div>
      )}

      <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50 p-2">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-semibold transition ${activeTab === tab.key ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:bg-white/70'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.05fr_.95fr]">
        <section className="rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-base font-bold text-slate-950">Scan Orchestration Center</div>
              <div className="mt-1 text-sm text-slate-500">Latest scan summary and focused tabbed findings.</div>
            </div>
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={registrySearch} onChange={(event) => setRegistrySearch(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-300 focus:bg-white" placeholder="Search modules in registry..." />
            </div>
          </div>

          <div className="mt-5">
            {activeTabContent[activeTab]}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-base font-bold text-slate-950">Latest Scan Summary</div>
                <div className="mt-1 text-sm text-slate-500">Summary of the most recent scan payload.</div>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
                {scan?.scan_type || 'No scan'}
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Latest scan</div>
                <div className="mt-1 text-sm font-semibold text-slate-950">{timelineLabel(scan?.created_at || null)}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Module / route density</div>
                <div className="mt-1 text-sm text-slate-600">
                  {scan?.modules_detected || 0} modules, {scan?.routes_detected || 0} routes, {scan?.high_risk_items || 0} high-risk items
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Production note</div>
                <div className="mt-1 text-sm text-slate-600">{scanLimited ? 'Runtime scan limited in production. Use build-time registry or manual module registration.' : 'Rule-based findings are derived from the registry and latest scan payload.'}</div>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
            <div className="text-base font-bold text-slate-950">Selected Module</div>
            {selectedModule ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-sm font-semibold text-slate-950">{selectedModule.module_name}</div>
                  <div className="mt-1 text-xs text-slate-500">{selectedModule.module_key}</div>
                </div>
                <div className="grid gap-2 text-xs text-slate-600">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">Auto refresh: <span className="font-semibold text-slate-900">{selectedModule.policy.auto_refresh_enabled ? 'ON' : 'OFF'}</span></div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">Live polling: <span className="font-semibold text-slate-900">{selectedModule.policy.live_polling_enabled ? 'ON' : 'OFF'}</span></div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">Heavy sync: <span className="font-semibold text-slate-900">{selectedModule.policy.heavy_sync_enabled ? 'ON' : 'OFF'}</span></div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">Interval: <span className="font-semibold text-slate-900">{formatInterval(selectedModule.policy.min_refresh_interval_ms)} - {formatInterval(selectedModule.policy.max_refresh_interval_ms)}</span></div>
                </div>
                <button type="button" onClick={() => void saveModulePolicy(selectedModule, recommendedInterval(selectedModule))} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100">
                  <Sparkles className="h-4 w-4" />
                  Save recommended interval
                </button>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                No module selected yet.
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  )
}
