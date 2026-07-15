'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  Activity,
  AlertCircle,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Cloud,
  Cpu,
  Bell,
  HelpCircle,
  LayoutDashboard,
  Lock,
  MonitorUp,
  PauseCircle,
  PlayCircle,
  RadioTower,
  RefreshCw,
  Route,
  Search,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  SignalHigh,
  Sparkles,
  Users2,
  Wallet,
  Waves,
  Wifi,
  Zap,
} from 'lucide-react'
import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react'
import { safeRefreshInterval, safeUiInterval, shouldStartAutoRefresh } from '@/lib/runtime/client-live-governor'
import AppScanCenterWorkspace from '@/components/ceo-system-control/AppScanCenterWorkspace'
import RuntimePolicyStudioWorkspace from '@/components/ceo-system-control/RuntimePolicyStudioWorkspace'
import VoiceTerminalRuntimeControl from '@/components/ceo-system-control/VoiceTerminalRuntimeControl'
import ActionProgressPanel from '@/components/shared/ActionProgressPanel'
import { useActionProgress } from '@/hooks/useActionProgress'

type RuntimeState = {
  id: string
  mode: string
  isSystemOnline: boolean
  shutdownStartedAt: string | null
  shutdownEndsAt: string | null
  resumeAt: string | null
  timezone: string
  reason: string | null
  authorizedRoles: string[]
  authorizedEmails: string[]
  disabledModules: Record<string, {
    disabled: boolean
    updatedAt: string | null
    pressure?: number
    reason?: string | null
    lastActivityAt?: string | null
    scope?: string | null
  }>
  enabledCoreRoutes: string[]
  schedule: Record<string, unknown>
  lastActionBy: string | null
  lastActionAt: string | null
  createdAt: string | null
  updatedAt: string | null
}

type UsagePoint = {
  label: string
  value: number
  cost?: number | null
  count?: number | null
}

type UsageUsage = {
  route: string
  value: number
}

type UsageModule = {
  module: string
  value: number
}

type UsageHistory = {
  label: string
  value: number
  at: string
  index: number
  fromMode: string | null
  toMode: string | null
}

type SystemUsageResponse = {
  ok: boolean
  connected: { vercel: boolean; internal: boolean }
  vercel: {
    connected: boolean
    configured: boolean
    missingEnv: string[]
    status: 'connected' | 'missing_env' | 'permission_denied' | 'provider_unavailable' | 'unsupported' | 'no_data'
    message: string
    data: unknown
    source?: string
  }
  state?: RuntimeState
  summary: {
    activeCpu: number | null
    functionInvocations: number | null
    edgeRequests: number | null
    bandwidth: number | null
    errorRate: number | null
    topRoutePressure: string
    estimatedCostPressure: number | null
  }
  charts: {
    hourly: UsagePoint[]
    daily: UsagePoint[]
    weekly: UsagePoint[]
    routePressure: UsageUsage[]
    modulePressure: UsageModule[]
    shutdownHistory: UsageHistory[]
  }
  metrics: { internalSnapshots: number; runtimeEvents: number }
}

type RuntimeEvent = {
  id: string
  event_type: string
  from_mode: string | null
  to_mode: string | null
  actor_email: string | null
  actor_role: string | null
  payload: Record<string, unknown>
  created_at: string
}

type ProgressStep = {
  percent: number
  key: string
  label: string
  detail: string
}

type ActionKind = 'shutdown' | 'restore' | 'schedule' | null
type WorkspaceKey = 'overview' | 'telemetry' | 'route-pressure' | 'module-control' | 'shutdown-center' | 'runtime-policy-studio' | 'app-scan-center' | 'schedules' | 'audit-events' | 'settings'

type WorkspaceItem = {
  label: string
  workspace: WorkspaceKey
  href: string
  icon: typeof LayoutDashboard
  keywords: string[]
  description: string
}

const WORKSPACES: WorkspaceItem[] = [
  { label: 'Overview', workspace: 'overview', href: '/ceo/system-control?workspace=overview', icon: LayoutDashboard, keywords: ['overview', 'home', 'summary'], description: 'Executive status and quick actions' },
  { label: 'Telemetry', workspace: 'telemetry', href: '/ceo/system-control?workspace=telemetry', icon: Activity, keywords: ['telemetry', 'usage', 'metrics', 'consumption'], description: 'Usage and Vercel status' },
  { label: 'Route Pressure', workspace: 'route-pressure', href: '/ceo/system-control?workspace=route-pressure', icon: Route, keywords: ['route', 'pressure', 'routes'], description: 'Pressure table and route telemetry' },
  { label: 'Module Control', workspace: 'module-control', href: '/ceo/system-control?workspace=module-control', icon: MonitorUp, keywords: ['module', 'modules', 'control'], description: 'Module grid and disabled controls' },
  { label: 'Shutdown Center', workspace: 'shutdown-center', href: '/ceo/system-control?workspace=shutdown-center', icon: ShieldAlert, keywords: ['shutdown', 'restore', 'emergency', 'command'], description: 'Standby, restore, and schedule workflow' },
  { label: 'Runtime Policy Studio', workspace: 'runtime-policy-studio', href: '/ceo/system-control?workspace=runtime-policy-studio', icon: Settings2, keywords: ['policy', 'runtime', 'studio'], description: 'Batch policy operations' },
  { label: 'App Scan Center', workspace: 'app-scan-center', href: '/ceo/system-control?workspace=app-scan-center', icon: Sparkles, keywords: ['scan', 'app scan', 'registry'], description: 'Scan and drift analysis' },
  { label: 'Schedules', workspace: 'schedules', href: '/ceo/system-control?workspace=schedules', icon: CalendarClock, keywords: ['schedule', 'schedules'], description: 'Schedule editor' },
  { label: 'Audit Events', workspace: 'audit-events', href: '/ceo/system-control?workspace=audit-events', icon: ShieldCheck, keywords: ['audit', 'events', 'timeline'], description: 'Searchable event timeline' },
  { label: 'Settings', workspace: 'settings', href: '/ceo/system-control?workspace=settings', icon: Settings2, keywords: ['settings', 'security'], description: 'Security and telemetry notes' },
]

const MODULES = [
  { key: 'carelink_ops', label: 'CareLink Ops', icon: Cloud, runtimeKeys: ['carelink_ops'] },
  { key: 'carelink_mobile', label: 'CareLink Mobile', icon: Wifi, runtimeKeys: ['carelink_mobile'] },
  { key: 'email_os', label: 'Email-OS', icon: LayoutDashboard, runtimeKeys: ['email-connect-voice', 'email_os'] },
  { key: 'voice', label: 'Voice', icon: RadioTower, runtimeKeys: ['email-connect-voice', 'voice'] },
  { key: 'connect', label: 'Connect', icon: Waves, runtimeKeys: ['email-connect-voice', 'connect'] },
  { key: 'hr', label: 'HR', icon: Users2, runtimeKeys: ['dashboards', 'hr'] },
  { key: 'b2b', label: 'B2B', icon: Sparkles, runtimeKeys: ['dashboards', 'b2b'] },
  { key: 'revenue', label: 'Revenue', icon: Wallet, runtimeKeys: ['dashboards', 'revenue'] },
] as const

const SHUTDOWN_WORKFLOW = [
  { percent: 0, label: 'Validate CEO authorization' },
  { percent: 15, label: 'Freeze live polling' },
  { percent: 30, label: 'Disable background sync' },
  { percent: 45, label: 'Disable heavy APIs' },
  { percent: 60, label: 'Lock normal users' },
  { percent: 75, label: 'Preserve CEO core routes' },
  { percent: 90, label: 'Write audit event' },
  { percent: 100, label: 'Standby mode active' },
] as const

const RESTORE_WORKFLOW = [
  { percent: 0, label: 'Validate CEO authorization' },
  { percent: 15, label: 'Unlock routing' },
  { percent: 30, label: 'Re-enable core APIs' },
  { percent: 45, label: 'Re-enable module APIs' },
  { percent: 60, label: 'Re-enable polling at safe rate' },
  { percent: 75, label: 'Re-enable scheduled sync' },
  { percent: 90, label: 'Write audit event' },
  { percent: 100, label: 'Normal mode restored' },
] as const

function normalizeWorkspace(value: unknown): WorkspaceKey {
  const next = String(value || '').trim().toLowerCase()
  const direct = WORKSPACES.find((workspace) => workspace.workspace === next)
  if (direct) return direct.workspace
  if (next === 'consumption' || next === 'live-consumption') return 'telemetry'
  if (next === 'routes') return 'route-pressure'
  if (next === 'modules') return 'module-control'
  if (next === 'command-center') return 'shutdown-center'
  if (next === 'events') return 'audit-events'
  return 'overview'
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function formatCompact(value: number | null, digits = 1) {
  if (value == null) return '0'
  return new Intl.NumberFormat('en-GB', { notation: 'compact', maximumFractionDigits: digits }).format(value)
}

function formatPercent(value: number | null, digits = 2) {
  if (value == null) return '0%'
  return `${new Intl.NumberFormat('en-GB', { maximumFractionDigits: digits }).format(value)}%`
}

function formatDateTime(value: string | null, timeZone?: string | null) {
  if (!value) return 'No timestamp'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No timestamp'
  try {
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: timeZone || undefined,
    }).format(date)
  } catch {
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
  }
}

function formatClock(value: Date, timeZone?: string | null) {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'full',
      timeStyle: 'medium',
      timeZone: timeZone || undefined,
    }).format(value)
  } catch {
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'full',
      timeStyle: 'medium',
    }).format(value)
  }
}

function formatBandwidth(value: number | null) {
  if (value == null) return '0 B/hr'
  const abs = Math.abs(value)
  if (abs >= 1e12) return `${new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(value / 1e12)} TB/hr`
  if (abs >= 1e9) return `${new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(value / 1e9)} GB/hr`
  if (abs >= 1e6) return `${new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(value / 1e6)} MB/hr`
  if (abs >= 1e3) return `${new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(value / 1e3)} KB/hr`
  return `${new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(value)} B/hr`
}

function getModeTone(mode: string) {
  const normalized = mode.toLowerCase()
  if (normalized === 'emergency_lock') return { label: 'EMERGENCY', className: 'border-rose-200 bg-rose-50 text-rose-700' }
  if (normalized === 'normal') return { label: 'NORMAL', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' }
  return { label: 'STANDBY', className: 'border-amber-200 bg-amber-50 text-amber-700' }
}

function getTelemetrySourceBadge(usage: SystemUsageResponse | null) {
  if (usage?.vercel.connected) return { label: 'Vercel connected', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' }
  if (usage?.connected.internal) return { label: 'Internal', className: 'border-blue-200 bg-blue-50 text-blue-700' }
  return { label: 'Vercel disconnected', className: 'border-slate-200 bg-slate-50 text-slate-600' }
}

function getTelemetryStatusLabel(usage: SystemUsageResponse | null) {
  if (!usage) return 'Vercel disconnected'
  if (usage.vercel.status === 'missing_env') return 'Vercel env missing'
  if (usage.vercel.status === 'permission_denied') return 'Vercel permission denied'
  if (usage.vercel.status === 'provider_unavailable') return 'Vercel API unavailable'
  if (usage.vercel.status === 'unsupported') return 'Vercel usage unsupported'
  if (usage.connected.internal && !usage.vercel.connected) return 'Internal snapshots only'
  if (usage.vercel.status === 'no_data') return 'Vercel connected but no data yet'
  if (usage.vercel.connected) return 'Vercel connected'
  return 'Vercel disconnected'
}

function getTelemetryEmptyCopy(usage: SystemUsageResponse | null, kind: 'route' | 'module' | 'metrics' | 'snapshot') {
  const source = getTelemetryStatusLabel(usage)
  if (kind === 'route') return usage?.connected.internal ? 'No route telemetry yet. Internal snapshots available.' : `${source}. Route telemetry not instrumented yet.`
  if (kind === 'module') return usage?.connected.internal ? 'No module pressure records yet. Module pressure requires module-level adoption.' : `${source}. Module pressure requires module-level adoption.`
  if (kind === 'metrics') return usage?.connected.internal ? 'Internal snapshot' : source
  return usage?.connected.internal ? 'Internal snapshot available.' : source
}

function formatEventMessage(event: RuntimeEvent) {
  const payload = event.payload || {}
  const reason = typeof payload.reason === 'string' ? payload.reason : null
  if (typeof payload.message === 'string' && payload.message.trim()) return payload.message
  if (reason) return reason
  if (event.event_type === 'runtime_shutdown_transition') return 'System transition into protected standby mode.'
  if (event.event_type === 'runtime_restore_transition') return 'System restored to normal runtime mode.'
  if (event.event_type === 'runtime_schedule_updated') return 'Scheduled standby configuration updated.'
  if (event.event_type === 'scheduled_shutdown_activated') return 'Scheduled shutdown activated by runtime scheduler.'
  if (event.event_type === 'scheduled_restore_activated') return 'Scheduled restore activated by runtime scheduler.'
  return event.event_type.replace(/_/g, ' ')
}

function normalizeChartSeries(input: unknown): UsagePoint[] {
  if (!Array.isArray(input)) return []
  const mapped: Array<UsagePoint | null> = input
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const entry = item as Record<string, unknown>
      return {
        label: String(entry.label || entry.at || entry.day || entry.hour || ''),
        value: asNumber(entry.value) ?? 0,
        cost: asNumber(entry.cost) ?? null,
        count: asNumber(entry.count) ?? null,
      } satisfies UsagePoint
    })
  return mapped.filter((item): item is UsagePoint => Boolean(item && item.label))
}

function normalizeUsage(input: unknown): SystemUsageResponse | null {
  if (!input || typeof input !== 'object') return null
  const data = input as Record<string, unknown>
  const charts = data.charts && typeof data.charts === 'object' ? data.charts as Record<string, unknown> : {}
  const summary = data.summary && typeof data.summary === 'object' ? data.summary as Record<string, unknown> : {}
  const connected = data.connected && typeof data.connected === 'object' ? data.connected as Record<string, unknown> : {}
  const vercel = data.vercel && typeof data.vercel === 'object' ? data.vercel as Record<string, unknown> : {}
  const metrics = data.metrics && typeof data.metrics === 'object' ? data.metrics as Record<string, unknown> : {}

  return {
    ok: data.ok !== false,
    connected: {
      vercel: Boolean(connected.vercel),
      internal: Boolean(connected.internal),
    },
    vercel: {
      connected: Boolean(vercel.connected),
      configured: Boolean(vercel.configured),
      missingEnv: Array.isArray(vercel.missingEnv) ? vercel.missingEnv.map(String) : [],
      status: (['connected', 'missing_env', 'permission_denied', 'provider_unavailable', 'unsupported', 'no_data'].includes(String(vercel.status))
        ? String(vercel.status)
        : 'provider_unavailable') as SystemUsageResponse['vercel']['status'],
      message: String(vercel.message || 'Vercel API unavailable'),
      data: vercel.data,
      source: typeof vercel.source === 'string' ? String(vercel.source) : 'vercel',
    },
    state: data.state && typeof data.state === 'object' ? data.state as RuntimeState : undefined,
    summary: {
      activeCpu: asNumber(summary.activeCpu),
      functionInvocations: asNumber(summary.functionInvocations),
      edgeRequests: asNumber(summary.edgeRequests),
      bandwidth: asNumber(summary.bandwidth),
      errorRate: asNumber(summary.errorRate),
      topRoutePressure: typeof summary.topRoutePressure === 'string' ? summary.topRoutePressure : 'No route telemetry yet',
      estimatedCostPressure: asNumber(summary.estimatedCostPressure),
    },
    charts: {
      hourly: normalizeChartSeries(charts.hourly),
      daily: normalizeChartSeries(charts.daily),
      weekly: normalizeChartSeries(charts.weekly),
      routePressure: Array.isArray(charts.routePressure)
        ? charts.routePressure
            .map((item) => (item && typeof item === 'object'
              ? { route: String((item as Record<string, unknown>).route || ''), value: asNumber((item as Record<string, unknown>).value) ?? 0 }
              : null))
            .filter((item): item is UsageUsage => Boolean(item?.route))
        : [],
      modulePressure: Array.isArray(charts.modulePressure)
        ? charts.modulePressure
            .map((item) => (item && typeof item === 'object'
              ? { module: String((item as Record<string, unknown>).module || ''), value: asNumber((item as Record<string, unknown>).value) ?? 0 }
              : null))
            .filter((item): item is UsageModule => Boolean(item?.module))
        : [],
      shutdownHistory: Array.isArray(charts.shutdownHistory)
        ? charts.shutdownHistory
            .map((item) => (item && typeof item === 'object'
              ? {
                  label: String((item as Record<string, unknown>).label || ''),
                  value: asNumber((item as Record<string, unknown>).value) ?? 0,
                  at: String((item as Record<string, unknown>).at || ''),
                  index: asNumber((item as Record<string, unknown>).index) ?? 0,
                  fromMode: typeof (item as Record<string, unknown>).fromMode === 'string' ? String((item as Record<string, unknown>).fromMode) : null,
                  toMode: typeof (item as Record<string, unknown>).toMode === 'string' ? String((item as Record<string, unknown>).toMode) : null,
                }
              : null))
            .filter((item): item is UsageHistory => Boolean(item?.label))
        : [],
    },
    metrics: {
      internalSnapshots: asNumber(metrics.internalSnapshots) ?? 0,
      runtimeEvents: asNumber(metrics.runtimeEvents) ?? 0,
    },
  }
}

function normalizeEvents(input: unknown): RuntimeEvent[] {
  if (!Array.isArray(input)) return []
  return input
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null
      const event = item as Record<string, unknown>
      return {
        id: String(event.id || event.event_id || `${String(event.event_type || event.eventType || 'runtime_event')}-${String(event.created_at || event.createdAt || index)}`),
        event_type: String(event.event_type || event.eventType || 'runtime_event'),
        from_mode: typeof event.from_mode === 'string' ? String(event.from_mode) : null,
        to_mode: typeof event.to_mode === 'string' ? String(event.to_mode) : null,
        actor_email: typeof event.actor_email === 'string' ? String(event.actor_email) : null,
        actor_role: typeof event.actor_role === 'string' ? String(event.actor_role) : null,
        payload: event.payload && typeof event.payload === 'object' ? event.payload as Record<string, unknown> : {},
        created_at: String(event.created_at || event.createdAt || ''),
      }
    })
    .filter((item): item is RuntimeEvent => Boolean(item))
}

function groupRuntimeEvents(events: RuntimeEvent[]) {
  const groups: Array<RuntimeEvent & { count: number }> = []

  for (const event of events) {
    const createdAt = Date.parse(event.created_at)
    const lastGroup = groups[groups.length - 1]
    const lastGroupTime = lastGroup ? Date.parse(lastGroup.created_at) : NaN
    const sameKey = Boolean(lastGroup)
      && lastGroup.event_type === event.event_type
      && lastGroup.from_mode === event.from_mode
      && lastGroup.to_mode === event.to_mode
    const withinWindow = Number.isFinite(createdAt) && Number.isFinite(lastGroupTime)
      ? Math.abs(lastGroupTime - createdAt) <= 10_000
      : false

    if (sameKey && withinWindow) {
      lastGroup.count += 1
      continue
    }

    groups.push({ ...event, count: 1 })
  }

  return groups
}

function seriesValues(points: UsagePoint[], key: 'value' | 'cost' | 'count' = 'value') {
  return points.map((point) => asNumber(point[key]) ?? 0)
}

function pointTrend(points: number[]) {
  if (points.length < 2) return 'No data yet'
  const first = points[0] || 0
  const last = points[points.length - 1] || 0
  const base = Math.max(Math.abs(first), 1)
  const diff = ((last - first) / base) * 100
  if (!Number.isFinite(diff)) return 'No data yet'
  return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}% vs prior point`
}

function buildSparklinePath(values: number[], width = 160, height = 48, padding = 4) {
  if (!values.length) return ''
  const safeValues = values.length === 1 ? [values[0], values[0]] : values
  const min = Math.min(...safeValues)
  const max = Math.max(...safeValues)
  const span = Math.max(max - min, 1)
  const usableWidth = width - padding * 2
  const usableHeight = height - padding * 2
  return safeValues
    .map((value, index) => {
      const x = padding + (usableWidth * (index / Math.max(safeValues.length - 1, 1)))
      const y = height - padding - (((value - min) / span) * usableHeight)
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')
}

function Sparkline({ values, tone = 'blue' }: { values: number[]; tone?: 'blue' | 'green' | 'orange' | 'rose' | 'slate' }) {
  const gradientId = `spark-${tone}-${useId().replace(/:/g, '')}`
  const stroke = {
    blue: '#2563eb',
    green: '#16a34a',
    orange: '#f97316',
    rose: '#e11d48',
    slate: '#64748b',
  }[tone]

  if (!values.length) {
    return (
      <svg viewBox="0 0 160 48" className="h-12 w-full">
        <line x1="4" y1="24" x2="156" y2="24" stroke="#dbe4f0" strokeDasharray="4 4" />
      </svg>
    )
  }

  const path = buildSparklinePath(values)
  return (
    <svg viewBox="0 0 160 48" className="h-12 w-full">
      <defs>
        <linearGradient id={gradientId} x1="0%" x2="0%" y1="0%" y2="100%">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <path d={`${path} L 156 44 L 4 44 Z`} fill={`url(#${gradientId})`} />
      <path d={path} fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
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

function Pill({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${className}`}>{children}</span>
}

function StatCard({
  icon,
  label,
  value,
  trend,
  helper,
  tone,
  sparkline,
}: {
  icon: ReactNode
  label: string
  value: string
  trend: string
  helper: string
  tone: 'blue' | 'green' | 'orange' | 'rose' | 'slate'
  sparkline: number[]
}) {
  const toneClasses = {
    blue: 'border-blue-100 bg-blue-50 text-blue-700',
    green: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    orange: 'border-orange-100 bg-orange-50 text-orange-700',
    rose: 'border-rose-100 bg-rose-50 text-rose-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
  }[tone]

  return (
    <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{label}</div>
          <div className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">{value}</div>
        </div>
        <div className={`rounded-2xl border p-3 ${toneClasses}`}>{icon}</div>
      </div>
      <div className="mt-4">
        <Sparkline values={sparkline} tone={tone === 'slate' ? 'slate' : tone} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-emerald-700">{trend}</span>
        <span className="text-slate-500">{helper}</span>
      </div>
    </article>
  )
}

function SectionCard({
  title,
  subtitle,
  badge,
  children,
}: {
  title: string
  subtitle?: string
  badge?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[15px] font-bold tracking-[-0.02em] text-slate-950">{title}</div>
          {subtitle && <div className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</div>}
        </div>
        {badge}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function TimelineItem({ event }: { event: RuntimeEvent & { count?: number } }) {
  const count = Math.max(1, event.count || 1)
  const tone = (() => {
    const normalized = event.event_type.toLowerCase()
    if (normalized.includes('restore')) return { label: 'Restore', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' }
    if (normalized.includes('emergency') || normalized.includes('shutdown')) return { label: 'Critical', className: 'border-rose-200 bg-rose-50 text-rose-700' }
    if (normalized.includes('schedule')) return { label: 'Scheduled', className: 'border-sky-200 bg-sky-50 text-sky-700' }
    return { label: 'Info', className: 'border-slate-200 bg-slate-50 text-slate-700' }
  })()

  return (
    <div className="relative pl-5">
      <div className="absolute left-0 top-2 h-2.5 w-2.5 rounded-full bg-blue-500 ring-4 ring-blue-50" />
      <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-950">{formatDateTime(event.created_at, 'Africa/Casablanca')}</div>
          <Pill className={tone.className}>{tone.label}</Pill>
        </div>
        <div className="mt-2 text-sm font-semibold text-slate-800">{event.event_type.replace(/_/g, ' ')}{count > 1 ? ` × ${count}` : ''}</div>
        <div className="mt-1 text-sm leading-6 text-slate-600">{formatEventMessage(event)}</div>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          <span className="rounded-full bg-white px-2.5 py-1">Actor: {event.actor_email || 'system'}</span>
          <span className="rounded-full bg-white px-2.5 py-1">Role: {event.actor_role || 'system'}</span>
          <span className="rounded-full bg-white px-2.5 py-1">From: {event.from_mode || '—'}</span>
          <span className="rounded-full bg-white px-2.5 py-1">To: {event.to_mode || '—'}</span>
        </div>
      </div>
    </div>
  )
}

function WorkflowList({ steps, activePercent }: { steps: readonly { percent: number; label: string }[]; activePercent: number }) {
  return (
    <div className="space-y-3">
      {steps.map((step) => {
        const active = activePercent >= step.percent
        return (
          <div key={step.percent} className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${active ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white'}`}>
            <div className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{step.percent}</div>
            <div>
              <div className="text-sm font-semibold text-slate-950">{step.label}</div>
              <div className="text-xs text-slate-500">{active ? 'In progress or completed' : 'Pending'}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ModuleTile({
  module,
  details,
  pressure,
  autoRefreshOn,
  onUnavailable,
  telemetryStatus,
}: {
  module: { key: string; label: string; icon: typeof Cloud; runtimeKeys: readonly string[] }
  details: RuntimeState['disabledModules'][string] | undefined
  pressure: number
  autoRefreshOn: boolean
  onUnavailable: () => void
  telemetryStatus: string
}) {
  const status = details?.disabled ? 'SAFE MODE' : 'LIVE'
  const tone =
    status === 'LIVE'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-amber-200 bg-amber-50 text-amber-700'
  const Icon = module.icon
  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_12px_26px_rgba(15,23,42,.05)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-blue-600"><Icon className="h-5 w-5" /></div>
          <div>
            <div className="text-sm font-bold text-slate-950">{module.label}</div>
            <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">{details?.scope || 'Core module'}</div>
          </div>
        </div>
        <Pill className={tone}>{status}</Pill>
      </div>
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
          <span>Pressure</span>
          <span className="font-semibold text-slate-900">{`${Math.round(pressure)}%`}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all" style={{ width: `${Math.min(pressure || 0, 100)}%` }} />
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Auto refresh</div>
            <div className="mt-1 font-semibold text-slate-950">{autoRefreshOn ? 'ON' : 'OFF'}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Last activity</div>
            <div className="mt-1 font-semibold text-slate-950">{details?.lastActivityAt ? formatDateTime(details.lastActivityAt, 'Africa/Casablanca') : telemetryStatus}</div>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button type="button" disabled onClick={onUnavailable} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
            <PauseCircle className="h-4 w-4" /> Pause module
          </button>
          <button type="button" disabled onClick={onUnavailable} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
            <Activity className="h-4 w-4" /> View module
          </button>
        </div>
        <button type="button" disabled onClick={onUnavailable} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
          <ShieldCheck className="h-4 w-4" /> Safe Mode module
        </button>
      </div>
      <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
        {telemetryStatus === 'Internal snapshots only' ? 'Internal snapshot available.' : 'Module telemetry not instrumented yet.'}
      </div>
    </article>
  )
}

function PressureTable({ rows, emptyLabel }: { rows: UsageUsage[]; emptyLabel: string }) {
  if (!rows.length) {
    return <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">{emptyLabel}</div>
  }

  const rowsSorted = [...rows].sort((a, b) => b.value - a.value).slice(0, 12)
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
          <tr>
            <th className="px-4 py-3">Route</th>
            <th className="px-4 py-3">Requests / hour</th>
            <th className="px-4 py-3">State</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rowsSorted.map((row, index) => (
            <tr key={`${row.route}-${index}`}>
              <td className="px-4 py-3 font-semibold text-slate-900">{row.route}</td>
              <td className="px-4 py-3 text-slate-700">{formatCompact(row.value)}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${row.value >= 16_000 ? 'border-rose-200 bg-rose-50 text-rose-700' : row.value >= 9_000 ? 'border-orange-200 bg-orange-50 text-orange-700' : row.value >= 3_000 ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                  {row.value >= 16_000 ? 'Blocked' : row.value >= 9_000 ? 'Aggressive' : row.value >= 3_000 ? 'Watch' : 'Normal'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        Route telemetry stays honest: no synthetic latency or error numbers are shown here.
      </div>
    </div>
  )
}

export default function CEOSystemControlTower({
  initialState,
  initialUsage,
  initialEvents,
  operatorName,
  initialWorkspace,
}: {
  initialState: RuntimeState
  initialUsage: unknown
  initialEvents: unknown
  operatorName: string | null
  initialWorkspace: WorkspaceKey
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [state, setState] = useState<RuntimeState>(initialState)
  const [usage, setUsage] = useState<SystemUsageResponse | null>(() => normalizeUsage(initialUsage))
  const [events, setEvents] = useState<RuntimeEvent[]>(() => normalizeEvents(initialEvents))
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceKey>(initialWorkspace)
  const [isMounted, setIsMounted] = useState(false)
  const [now, setNow] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [busyAction, setBusyAction] = useState<ActionKind>(null)
  const [workflowPercent, setWorkflowPercent] = useState(0)
  const [workflowLabel, setWorkflowLabel] = useState('Idle')
  const [workflowSteps, setWorkflowSteps] = useState<ProgressStep[]>([])
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scheduleTouched, setScheduleTouched] = useState(false)
  const [scheduleEnabled, setScheduleEnabled] = useState(() => Boolean(initialState.schedule?.shutdownAt || initialState.schedule?.resumeAt))
  const [scheduleShutdownAt, setScheduleShutdownAt] = useState('')
  const [scheduleResumeAt, setScheduleResumeAt] = useState('')
  const [scheduleTimezone, setScheduleTimezone] = useState(initialState.timezone || 'Africa/Casablanca')
  const [scheduleReason, setScheduleReason] = useState(initialState.reason || '')
  const actionProgress = useActionProgress()
  const [internalRoutePressure, setInternalRoutePressure] = useState<any | null>(null)
  const [eventSearch, setEventSearch] = useState('')
  const [eventTypeFilter, setEventTypeFilter] = useState<'all' | 'shutdown' | 'restore' | 'schedule' | 'other'>('all')
  const [commandQuery, setCommandQuery] = useState('')
  const [commandOpen, setCommandOpen] = useState(false)
  const loadRef = useRef<() => Promise<void>>(async () => {})

  const workspaceMeta = useMemo(() => WORKSPACES.find((item) => item.workspace === activeWorkspace) || WORKSPACES[0], [activeWorkspace])
  const modeTone = getModeTone(state.mode)
  const telemetrySourceBadge = getTelemetrySourceBadge(usage)
  const telemetryStatusLabel = getTelemetryStatusLabel(usage)
  const usageAvailable = Boolean(usage && (usage.connected.vercel || usage.connected.internal))
  const activeCpu = usageAvailable ? usage?.summary.activeCpu ?? null : null
  const invocations = usageAvailable ? usage?.summary.functionInvocations ?? null : null
  const edgeRequests = usageAvailable ? usage?.summary.edgeRequests ?? null : null
  const bandwidth = usageAvailable ? usage?.summary.bandwidth ?? null : null
  const errorRate = usageAvailable ? usage?.summary.errorRate ?? null : null
  const costPressure = usageAvailable ? usage?.summary.estimatedCostPressure ?? null : null
  const hourlyPoints = usageAvailable ? seriesValues(usage?.charts.hourly || []) : []
  const dailyPoints = usageAvailable ? seriesValues(usage?.charts.daily || [], 'count') : []
  const internalRouteRows = Array.isArray(internalRoutePressure?.top)
    ? internalRoutePressure.top
    : Array.isArray(internalRoutePressure?.rows)
      ? internalRoutePressure.rows
      : []

  const routePoints = internalRouteRows.length
    ? internalRouteRows.slice(0, 12).map((row: any) => Number(row.pressureScore || row.value || 0))
    : usageAvailable
      ? (usage?.charts.routePressure || []).map((row) => row.value)
      : []

  const routeSparklinePoints = routePoints.length ? routePoints : [18, 32, 24, 45, 38, 52]

  const topRouteRows = internalRouteRows.length
    ? internalRouteRows
    : usageAvailable
      ? usage?.charts.routePressure || []
      : []
  const groupedEvents = useMemo(() => groupRuntimeEvents(events), [events])

  const activeData = useMemo(() => ({
    cpu: hourlyPoints.length ? hourlyPoints : [],
    invocations: dailyPoints.length ? dailyPoints : [],
    edge: routePoints.length ? routePoints : [],
    bandwidth: usageAvailable && usage?.charts.hourly.length ? seriesValues(usage.charts.hourly, 'cost') : [],
    error: usageAvailable && usage?.charts.daily.length ? seriesValues(usage.charts.daily) : [],
    cost: usageAvailable && usage?.charts.weekly.length ? seriesValues(usage.charts.weekly, 'cost') : [],
  }), [dailyPoints, hourlyPoints, routePoints, usage, usageAvailable])

  const modulePressureRows = usageAvailable
    ? (usage?.charts.modulePressure || [])
    : []

  const modulePressureMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const row of modulePressureRows) map.set(row.module, row.value)
    for (const [module, details] of Object.entries(state.disabledModules)) {
      if (!map.has(module) && typeof details.pressure === 'number') map.set(module, details.pressure)
    }
    return map
  }, [modulePressureRows, state.disabledModules])
  const commandResults = useMemo(() => {
    const query = commandQuery.trim().toLowerCase()
    if (!query) return []
    return WORKSPACES
      .filter((item) => item.label.toLowerCase().includes(query) || item.description.toLowerCase().includes(query) || item.keywords.some((keyword) => keyword.includes(query)))
      .slice(0, 6)
      .map((item) => ({ label: item.label, workspace: item.workspace, description: item.description }))
  }, [commandQuery])

  const clockText = isMounted && now ? formatClock(now, state.timezone || 'Africa/Casablanca') : 'Clock initializing...'
  const groupedEventsFiltered = useMemo(() => {
    const query = eventSearch.trim().toLowerCase()
    return groupedEvents.filter((event) => {
      const type = event.event_type.toLowerCase()
      const matchesType = eventTypeFilter === 'all'
        || (eventTypeFilter === 'shutdown' && type.includes('shutdown'))
        || (eventTypeFilter === 'restore' && type.includes('restore'))
        || (eventTypeFilter === 'schedule' && type.includes('schedule'))
        || (eventTypeFilter === 'other' && !type.includes('shutdown') && !type.includes('restore') && !type.includes('schedule'))
      const matchesQuery = !query
        || [event.event_type, event.actor_email, event.actor_role, event.from_mode, event.to_mode, formatEventMessage(event)]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      return matchesType && matchesQuery
    })
  }, [eventSearch, eventTypeFilter, groupedEvents])

  useEffect(() => {
    const workspace = normalizeWorkspace(searchParams?.get('workspace') || initialWorkspace)
    setActiveWorkspace(workspace)
  }, [initialWorkspace, searchParams])

  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  useEffect(() => {
    if (!isMounted) return
    setNow(new Date())
    const timer = window.setInterval(() => setNow(new Date()), safeUiInterval(1000))
    return () => window.clearInterval(timer)
  }, [isMounted])

  useEffect(() => {
    if (!isMounted || busyAction) return
    if (!shouldStartAutoRefresh()) return
    const timer = window.setInterval(() => {
      void refreshAll()
    }, safeRefreshInterval(60_000))
    return () => window.clearInterval(timer)
  }, [busyAction, isMounted])

  useEffect(() => {
    const schedule = state.schedule || {}
    if (!scheduleTouched) {
      setScheduleTimezone(state.timezone || 'Africa/Casablanca')
      setScheduleReason(state.reason || '')
      setScheduleEnabled(Boolean(schedule.shutdownAt || schedule.resumeAt))
      setScheduleShutdownAt(typeof schedule.shutdownAt === 'string' ? schedule.shutdownAt.slice(0, 16) : '')
      setScheduleResumeAt(typeof schedule.resumeAt === 'string' ? schedule.resumeAt.slice(0, 16) : '')
    }
  }, [scheduleTouched, state.reason, state.schedule, state.timezone])

  useEffect(() => {
    loadRef.current = refreshAll
  })

  async function refreshAll(broadcast = false) {
    try {
      setRefreshing(true)
      const [stateRes, usageRes, eventsRes] = await Promise.all([
        fetch('/api/system-control/state', { cache: 'no-store' }),
        fetch('/api/system-control/usage', { cache: 'no-store' }),
        fetch('/api/system-control/events?limit=40', { cache: 'no-store' }),
      ])

      if (stateRes.ok) {
        const payload = await stateRes.json().catch(() => null)
        if (payload?.data?.state) setState(payload.data.state)
      }

      if (usageRes.ok) {
        const payload = await usageRes.json().catch(() => null)
        const normalized = normalizeUsage(payload)
        if (normalized) setUsage(normalized)
      }

      if (eventsRes.ok) {
        const payload = await eventsRes.json().catch(() => null)
        setEvents(normalizeEvents(payload?.data))
      }

      if (broadcast) {
        window.dispatchEvent(new CustomEvent('system-control-refresh', { detail: { source: 'tower' } }))
      }
    } catch {
      // Keep last known snapshot.
    } finally {
      setRefreshing(false)
    }
  }

  function progressStepsFor(action: ActionKind, incomingSteps?: ProgressStep[]) {
    const source = incomingSteps?.length
      ? incomingSteps
      : action === 'restore'
        ? RESTORE_WORKFLOW.map((step) => ({ percent: step.percent, key: step.label, label: step.label, detail: step.label }))
        : SHUTDOWN_WORKFLOW.map((step) => ({ percent: step.percent, key: step.label, label: step.label, detail: step.label }))

    return source.map((step, index) => ({
      id: step.key || `step-${index + 1}`,
      label: step.label,
      detail: step.detail || step.label,
      percent: step.percent,
    }))
  }

  function actionTitle(action: ActionKind) {
    if (action === 'restore') return 'Restore System'
    if (action === 'schedule') return 'Schedule Runtime Transition'
    return 'Protected System Shutdown'
  }

  async function animateWorkflow(steps: ProgressStep[]) {
    setWorkflowSteps(steps)
    for (const step of steps) {
      setWorkflowLabel(step.label)
      setWorkflowPercent(step.percent)
      await new Promise((resolve) => window.setTimeout(resolve, 170))
    }
  }

  async function refreshInternalRoutePressure(showProgress = false) {
    try {
      if (showProgress) {
        actionProgress.updateProgress(55, 'Calculating internal route pressure indicators…', 'Route pressure')
      }

      const response = await fetch('/api/system-control/route-pressure', { cache: 'no-store' })
      const payload = await response.json().catch(() => null)

      if (response.ok && payload?.ok) {
        setInternalRoutePressure(payload)
      }
    } catch {
      // Keep last known route pressure snapshot.
    }
  }

  async function refreshAllWithProgress() {
    actionProgress.startAction({
      title: 'Refresh CEO System Control',
      subtitle: 'Refreshing runtime state, telemetry snapshot, schedules and audit visibility.',
      steps: [
        { id: 'validate', label: 'Validate refresh request', percent: 10 },
        { id: 'runtime', label: 'Refresh runtime state', percent: 35 },
        { id: 'telemetry', label: 'Refresh telemetry snapshot', percent: 65 },
        { id: 'events', label: 'Refresh audit and schedules', percent: 85 },
        { id: 'complete', label: 'Refresh completed', percent: 100 },
      ],
    })

    setNotice(null)
    setError(null)

    try {
      actionProgress.updateProgress(10, 'CEO refresh request validated.', 'Validated')
      actionProgress.updateProgress(35, 'Refreshing runtime control state…', 'Runtime refresh')
      await refreshAll(true)
      await refreshInternalRoutePressure(true)
      actionProgress.updateProgress(85, 'Runtime, telemetry, route pressure and audit panels refreshed.', 'Panels refreshed')

      const telemetryConfigured = Boolean(
        typeof window !== 'undefined'
          ? false
          : false
      )

      const finalNotice = telemetryStatusLabel?.toLowerCase?.().includes('unsupported')
        ? 'Refresh completed. Provider telemetry is not configured, so internal snapshots are shown.'
        : 'CEO System Control refreshed successfully.'

      setNotice(finalNotice)
      actionProgress.completeAction(finalNotice, {
        telemetry: telemetryStatusLabel,
        source: telemetrySourceBadge?.label,
        runtimeMode: state.mode,
      })
    } catch (refreshError) {
      const message = refreshError instanceof Error ? refreshError.message : 'Unable to refresh CEO System Control.'
      setError(message)
      actionProgress.failAction(message)
    }
  }

  async function runAction(
    endpoint: '/api/system-control/shutdown' | '/api/system-control/restore' | '/api/system-control/schedule',
    body: Record<string, unknown>,
    action: ActionKind,
    steps?: ProgressStep[],
  ) {
    const progressSteps = progressStepsFor(action, steps)

    actionProgress.startAction({
      title: actionTitle(action),
      subtitle:
        action === 'restore'
          ? 'Restoring protected runtime mode and refreshing control state.'
          : action === 'schedule'
            ? 'Saving scheduled runtime transition and validating standby timing.'
            : 'Executing protected shutdown workflow with audit visibility.',
      steps: progressSteps,
    })

    setBusyAction(action)
    setNotice(null)
    setError(null)

    try {
      actionProgress.updateProgress(5, 'CEO action received and validation started.', 'Action received')

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || payload?.message || payload?.details?.message || 'Action failed')
      }

      actionProgress.updateProgress(45, 'Runtime API accepted command. Applying returned workflow…', 'Runtime accepted')

      if (Array.isArray(payload.progress) && payload.progress.length) {
        await animateWorkflow(payload.progress as ProgressStep[])
      } else if (steps?.length) {
        await animateWorkflow(steps)
      }

      if (payload.state) setState(payload.state)
      await refreshAll(true)
      await refreshInternalRoutePressure(false)
      setWorkflowLabel(action === 'restore' ? 'Normal mode restored' : action === 'schedule' ? 'Schedule saved' : 'Standby mode active')
      setWorkflowPercent(100)
      const finalNotice = action === 'schedule' ? 'Schedule updated successfully.' : action === 'restore' ? 'System restored.' : 'Shutdown command executed.'
      setNotice(finalNotice)
      actionProgress.completeAction(finalNotice, {
        mode: payload.state?.mode || state.mode,
        online: payload.state?.isSystemOnline ?? state.isSystemOnline,
      })
      setScheduleTouched(false)
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : 'Action failed'
      setError(message)
      actionProgress.failAction(message)
    } finally {
      setBusyAction(null)
    }
  }

  function makeModulePressure(moduleKey: string) {
    const module = MODULES.find((item) => item.key === moduleKey)
    const candidates = module?.runtimeKeys || [moduleKey]
    for (const candidate of candidates) {
      const row = modulePressureMap.get(candidate)
      if (typeof row === 'number') return Math.max(0, Math.min(100, row))
    }
    return 0
  }

  function getModuleDetails(moduleKey: string) {
    const module = MODULES.find((item) => item.key === moduleKey)
    const candidates = module?.runtimeKeys || [moduleKey]
    for (const candidate of candidates) {
      const details = state.disabledModules[candidate]
      if (details) return details
    }
    return undefined
  }

  function handleModuleUnavailable() {
    setNotice('Module telemetry requires module-level adoption.')
  }

  function navigateWorkspace(workspace: WorkspaceKey) {
    const nextUrl = `${pathname}?workspace=${workspace}`
    setActiveWorkspace(workspace)
    router.push(nextUrl, { scroll: false })
    setCommandOpen(false)
    setCommandQuery('')
  }

  function commandResultsToEntries() {
    if (!commandResults.length) return []
    return commandResults.map((item) => ({ label: item.label, workspace: item.workspace, description: item.description }))
  }

  const systemHealthLabel = state.isSystemOnline ? 'System Online' : 'Protected Standby'
  const snapshotState = state.mode.toUpperCase()
  const uptimeLabel = state.createdAt ? formatDateTime(state.createdAt, state.timezone) : 'No snapshot available'
  const lastCheck = formatDateTime(state.updatedAt || state.lastActionAt, state.timezone)
  const scheduleStatus = scheduleEnabled ? (scheduleShutdownAt || scheduleResumeAt ? 'Scheduled' : 'Manual') : 'Disabled'
  const routeTableRows = useMemo(() => topRouteRows, [topRouteRows])
  const hourlyTrend = pointTrend(hourlyPoints)
  const invTrend = pointTrend(dailyPoints)
  const edgeTrend = pointTrend(routePoints)
  const bandwidthTrend = pointTrend(activeData.bandwidth)
  const errorTrend = pointTrend(activeData.error)
  const costTrend = pointTrend(activeData.cost)

  function renderScheduleForm(mode: 'compact' | 'full') {
    return (
      <div className={`grid gap-4 ${mode === 'full' ? 'md:grid-cols-2' : 'xl:grid-cols-2'}`}>
        <div className="space-y-3 rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 rounded-[1.5rem] border border-slate-200 bg-white p-2 text-sm font-semibold">
            <button type="button" onClick={() => setScheduleEnabled(true)} className={`rounded-xl px-4 py-2 ${scheduleEnabled ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>Enable</button>
            <button type="button" onClick={() => setScheduleEnabled(false)} className={`rounded-xl px-4 py-2 ${!scheduleEnabled ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>Disable</button>
          </div>
          <div className="text-xs text-slate-500">Schedule inputs are draft-only until Save Schedule runs successfully.</div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Shutdown time</span>
              <input
                type="time"
                value={scheduleShutdownAt ? scheduleShutdownAt.slice(11, 16) : '22:00'}
                onChange={(event) => {
                  setScheduleShutdownAt(`1970-01-01T${event.target.value}:00`)
                  setScheduleTouched(true)
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Restore time</span>
              <input
                type="time"
                value={scheduleResumeAt ? scheduleResumeAt.slice(11, 16) : '08:00'}
                onChange={(event) => {
                  setScheduleResumeAt(`1970-01-01T${event.target.value}:00`)
                  setScheduleTouched(true)
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Timezone</span>
              <input
                value={scheduleTimezone}
                onChange={(event) => {
                  setScheduleTimezone(event.target.value)
                  setScheduleTouched(true)
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                placeholder="Africa/Casablanca"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Reason</span>
              <input
                value={scheduleReason}
                onChange={(event) => {
                  setScheduleReason(event.target.value)
                  setScheduleTouched(true)
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                placeholder="Protected standby"
              />
            </label>
          </div>
          <button
            type="button"
            disabled={busyAction === 'schedule'}
            onClick={() => void runAction('/api/system-control/schedule', {
              shutdownAt: scheduleEnabled ? (scheduleShutdownAt || '1970-01-01T22:00:00') : null,
              resumeAt: scheduleEnabled ? (scheduleResumeAt || '1970-01-01T08:00:00') : null,
              timezone: scheduleTimezone || 'Africa/Casablanca',
              reason: scheduleReason || null,
              enabledCoreRoutes: state.enabledCoreRoutes,
              disabledModules: state.disabledModules,
            }, 'schedule', [
              { percent: 0, key: 'validate', label: 'Validate schedule', detail: 'Validate CEO schedule inputs.' },
              { percent: 40, key: 'persist', label: 'Persist schedule', detail: 'Write schedule settings to runtime control.' },
              { percent: 70, key: 'audit', label: 'Write audit event', detail: 'Persist the schedule update event.' },
              { percent: 100, key: 'done', label: 'Schedule saved', detail: 'Schedule updated successfully.' },
            ])}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            <CalendarClock className="h-4 w-4" />
            Save Schedule
          </button>
        </div>

        <div className="space-y-3 rounded-[1.35rem] border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Current schedule status</div>
          <div className="space-y-3 text-sm text-slate-700">
            <div className="flex items-center justify-between gap-3"><span>Shutdown at</span><span className="font-semibold text-slate-950">{scheduleShutdownAt ? formatDateTime(scheduleShutdownAt, scheduleTimezone) : '22:00'}</span></div>
            <div className="flex items-center justify-between gap-3"><span>Restore at</span><span className="font-semibold text-slate-950">{scheduleResumeAt ? formatDateTime(scheduleResumeAt, scheduleTimezone) : '08:00'}</span></div>
            <div className="flex items-center justify-between gap-3"><span>Timezone</span><span className="font-semibold text-slate-950">{scheduleTimezone}</span></div>
            <div className="flex items-center justify-between gap-3"><span>Status</span><Pill className={scheduleEnabled ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-600'}>{scheduleStatus}</Pill></div>
          </div>
          <div className="rounded-[1.35rem] border border-blue-200 bg-[linear-gradient(180deg,_#f8fbff_0%,_#eef6ff_100%)] p-4 text-sm text-slate-600">
            This preview is shown only to the CEO control tower. It mirrors the protected standby message without changing the public route.
          </div>
        </div>
      </div>
    )
  }

  function renderOverview() {
    return (
      <>
        <section className="rounded-[2rem] border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_42px_rgba(15,23,42,.06)] lg:px-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <Pill className={modeTone.className}>{modeTone.label}</Pill>
                <Pill className="border-emerald-200 bg-emerald-50 text-emerald-700">PRODUCTION LIVE</Pill>
                <Pill className="border-slate-200 bg-slate-50 text-slate-700">{state.timezone || 'Africa/Casablanca'}</Pill>
              </div>
              <div className="mt-4 flex items-end gap-3">
                <h1 className="text-3xl font-black tracking-[-0.05em] text-slate-950 sm:text-4xl">CEO System Control Tower</h1>
              </div>
              <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-600 sm:text-[15px]">
                Real-time system control, cost protection and operational command center.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                  <Clock3 className="h-4 w-4 text-blue-600" />
                  {clockText}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Authenticated CEO / admin access only
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                  <CheckCircle2 className="h-4 w-4 text-cyan-600" />
                  {telemetryStatusLabel}
                </span>
                <Pill className={telemetrySourceBadge.className}>{telemetrySourceBadge.label}</Pill>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void refreshAllWithProgress()}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                type="button"
                disabled={busyAction === 'shutdown'}
                onClick={() => void runAction('/api/system-control/shutdown', {
                  command: 'shutdown_now',
                  reason: scheduleReason || state.reason || 'Protected standby mode enabled.',
                  resumeAt: scheduleEnabled ? (scheduleResumeAt || null) : null,
                  timezone: scheduleTimezone,
                }, 'shutdown', SHUTDOWN_WORKFLOW.map((step) => ({ percent: step.percent, key: step.label, label: step.label, detail: step.label })))}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 px-4 py-3 text-sm font-bold text-white shadow-[0_16px_30px_rgba(239,68,68,.22)] transition hover:opacity-95 disabled:opacity-60"
              >
                <ArrowDownToLine className="h-4 w-4" />
                Shutdown Now
              </button>
              <button
                type="button"
                disabled={busyAction === 'restore'}
                onClick={() => void runAction('/api/system-control/restore', {
                  command: 'restore_now',
                  reason: scheduleReason || null,
                  timezone: scheduleTimezone,
                }, 'restore', RESTORE_WORKFLOW.map((step) => ({ percent: step.percent, key: step.label, label: step.label, detail: step.label })))}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-3 text-sm font-bold text-white shadow-[0_16px_30px_rgba(37,99,235,.18)] transition hover:opacity-95 disabled:opacity-60"
              >
                <ArrowUpFromLine className="h-4 w-4" />
                Restore System
              </button>
              <button
                type="button"
                disabled={busyAction === 'shutdown'}
                onClick={() => void runAction('/api/system-control/shutdown', {
                  command: 'emergency_lock',
                  reason: scheduleReason || 'Emergency lock',
                  resumeAt: scheduleEnabled ? (scheduleResumeAt || null) : null,
                  timezone: scheduleTimezone,
                }, 'shutdown', SHUTDOWN_WORKFLOW.map((step) => ({ percent: step.percent, key: step.label, label: step.label, detail: step.label })))}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-800 px-4 py-3 text-sm font-bold text-white shadow-[0_16px_30px_rgba(15,23,42,.18)] transition hover:opacity-95 disabled:opacity-60"
              >
                <Lock className="h-4 w-4" />
                Emergency Lock
              </button>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <Bell className="h-4 w-4 text-slate-500" />
                <HelpCircle className="h-4 w-4 text-slate-500" />
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">{(operatorName || 'CEO').slice(0, 2).toUpperCase()}</div>
              </div>
            </div>
          </div>

          {(notice || error) && (
            <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
              {error || notice}
            </div>
          )}
        </section>

        <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          <StatCard icon={<Cpu className="h-5 w-5" />} label="Active CPU" value={formatPercent(activeCpu)} trend={hourlyPoints.length ? hourlyTrend : telemetryStatusLabel} helper={usage?.connected.internal ? 'Internal snapshot' : telemetryStatusLabel} tone="blue" sparkline={activeData.cpu} />
          <StatCard icon={<Zap className="h-5 w-5" />} label="Function Invocations" value={formatCompact(invocations)} trend={dailyPoints.length ? invTrend : telemetryStatusLabel} helper={usage?.connected.internal ? 'Internal snapshot' : telemetryStatusLabel} tone="green" sparkline={activeData.invocations} />
          <StatCard icon={<SignalHigh className="h-5 w-5" />} label="Edge Requests" value={formatCompact(edgeRequests)} trend={routePoints.length ? edgeTrend : telemetryStatusLabel} helper={usage?.connected.internal ? 'Internal snapshot' : telemetryStatusLabel} tone="orange" sparkline={activeData.edge} />
          <StatCard icon={<Cloud className="h-5 w-5" />} label="Data Transfer" value={formatBandwidth(bandwidth)} trend={activeData.bandwidth.length ? bandwidthTrend : telemetryStatusLabel} helper={usage?.connected.internal ? 'Internal snapshot' : telemetryStatusLabel} tone="blue" sparkline={activeData.bandwidth} />
          <StatCard icon={<AlertCircle className="h-5 w-5" />} label="Error Rate" value={formatPercent(errorRate)} trend={activeData.error.length ? errorTrend : telemetryStatusLabel} helper={usage?.connected.internal ? 'Internal snapshot' : telemetryStatusLabel} tone="rose" sparkline={activeData.error} />
          <StatCard icon={<Wallet className="h-5 w-5" />} label="Cost Pressure" value={formatCompact(costPressure)} trend={activeData.cost.length ? costTrend : telemetryStatusLabel} helper={usage?.vercel.status === 'connected' ? 'Vercel billing source available' : 'Estimated cost is 0 MAD without an external billing source'} tone="orange" sparkline={activeData.cost} />
        </section>

        <section className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
          <SectionCard title="Recent Events" subtitle="Grouped runtime events from the latest safe refresh." badge={<Pill className="border-slate-200 bg-slate-50 text-slate-600">Timeline</Pill>}>
            <div className="space-y-4">
              {groupedEvents.slice(0, 4).length ? groupedEvents.slice(0, 4).map((event) => <TimelineItem key={event.id} event={event} />) : (
                <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">No runtime events yet.</div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Quick Actions" subtitle="Jump to focused workspaces without scrolling." badge={<Pill className="border-blue-200 bg-blue-50 text-blue-700">Workspaces</Pill>}>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['telemetry', 'Telemetry'],
                ['route-pressure', 'Route Pressure'],
                ['module-control', 'Module Control'],
                ['shutdown-center', 'Shutdown Center'],
                ['runtime-policy-studio', 'Runtime Policy Studio'],
                ['app-scan-center', 'App Scan Center'],
                ['schedules', 'Schedules'],
                ['audit-events', 'Audit Events'],
              ].map(([workspace, label]) => (
                <button key={workspace} type="button" onClick={() => navigateWorkspace(workspace as WorkspaceKey)} className="inline-flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white">
                  <span>{label}</span>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </button>
              ))}
            </div>
          </SectionCard>
        </section>
      </>
    )
  }

  function renderTelemetry() {
    return (
      <>
        <section className="grid gap-4 xl:grid-cols-4">
          <SectionCard title="Usage Status" subtitle="Exact telemetry source and connection state." badge={<Pill className="border-blue-200 bg-blue-50 text-blue-700">Status</Pill>}>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between gap-3"><span>Usage source</span><span className="font-semibold text-slate-900">{telemetryStatusLabel}</span></div>
              <div className="flex items-center justify-between gap-3"><span>Internal snapshots</span><span className="font-semibold text-slate-900">{usage?.metrics.internalSnapshots || 0}</span></div>
              <div className="flex items-center justify-between gap-3"><span>Runtime events</span><span className="font-semibold text-slate-900">{usage?.metrics.runtimeEvents || 0}</span></div>
            </div>
          </SectionCard>
          <SectionCard title="Vercel Status" subtitle="Honest provider state only." badge={<Pill className={telemetrySourceBadge.className}>{telemetrySourceBadge.label}</Pill>}>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between gap-3"><span>Status</span><span className="font-semibold text-slate-900">{usage?.vercel.status || 'provider_unavailable'}</span></div>
              <div className="flex items-center justify-between gap-3"><span>Configured</span><span className="font-semibold text-slate-900">{usage?.vercel.configured ? 'Yes' : 'No'}</span></div>
              <div className="flex items-center justify-between gap-3"><span>Missing env</span><span className="font-semibold text-slate-900">{usage?.vercel.missingEnv.length || 0}</span></div>
            </div>
          </SectionCard>
          <SectionCard title="Hourly Chart" subtitle="Requests and cost curve over the latest internal snapshot window." badge={<Pill className="border-slate-200 bg-slate-50 text-slate-600">Hourly</Pill>}>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              {usageAvailable ? <MiniChart points={seriesValues(usage?.charts.hourly || [])} color="blue" /> : <div className="flex min-h-[190px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-4 text-sm text-slate-500">{getTelemetryEmptyCopy(usage, 'snapshot')}</div>}
            </div>
          </SectionCard>
          <SectionCard title="Daily Chart" subtitle="Stacked snapshot bars for daily request and cost accumulation." badge={<Pill className="border-slate-200 bg-slate-50 text-slate-600">Daily</Pill>}>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              {usageAvailable ? <StackedBars points={usage?.charts.daily || []} emptyLabel={getTelemetryEmptyCopy(usage, 'snapshot')} /> : <div className="flex min-h-[190px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-4 text-sm text-slate-500">{getTelemetryEmptyCopy(usage, 'snapshot')}</div>}
            </div>
          </SectionCard>
        </section>
        <section className="mt-4 grid gap-4 xl:grid-cols-2">
          <SectionCard title="Internal Snapshots" subtitle="No synthetic metrics. Only recorded snapshots are shown." badge={<Pill className="border-emerald-200 bg-emerald-50 text-emerald-700">Snapshots</Pill>}>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <span>Internal snapshot count</span>
                <span className="font-semibold text-slate-900">{usage?.metrics.internalSnapshots || 0}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <span>Vercel message</span>
                <span className="font-semibold text-slate-900">{usage?.vercel.message || 'No provider data'}</span>
              </div>
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
                {getTelemetryEmptyCopy(usage, 'module')}
              </div>
            </div>
          </SectionCard>
          <SectionCard title="Route / Module Pressure" subtitle="Derived from the existing runtime usage payload." badge={<Pill className="border-blue-200 bg-blue-50 text-blue-700">Pressure</Pill>}>
            <div className="grid gap-4">
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Routes</div>
                {usageAvailable && routePoints.length ? <MiniChart points={routePoints} color="green" /> : <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">{getTelemetryEmptyCopy(usage, 'route')}</div>}
              </div>
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Modules</div>
                <div className="max-h-[240px] overflow-auto rounded-2xl border border-slate-200 bg-white p-3">
                  {usageAvailable && modulePressureRows.length ? modulePressureRows.slice(0, 8).map((row) => (
                    <div key={row.module} className="mb-3 last:mb-0">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-slate-700">{row.module}</span>
                        <span className="font-semibold text-slate-900">{formatCompact(row.value)}</span>
                      </div>
                      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500" style={{ width: `${Math.min(row.value, 100)}%` }} />
                      </div>
                    </div>
                  )) : <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">{getTelemetryEmptyCopy(usage, 'module')}</div>}
                </div>
              </div>
            </div>
          </SectionCard>
        </section>
      </>
    )
  }

  function renderRoutePressure() {
    return (
      <section className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <SectionCard title="Route Pressure Command Indicators" subtitle="Internal route pressure is calculated from the app route registry and recent runtime events. Vercel telemetry can enrich it later." badge={<Pill className="border-blue-200 bg-blue-50 text-blue-700">Route Pressure</Pill>}>
          <div className="grid gap-3 md:grid-cols-4">
            {[
              ['Routes monitored', internalRoutePressure?.summary?.routes ?? topRouteRows.length ?? 0],
              ['API routes', internalRoutePressure?.summary?.apiRoutes ?? 0],
              ['High pressure', internalRoutePressure?.summary?.high ?? 0],
              ['Critical', internalRoutePressure?.summary?.critical ?? 0],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">{label}</div>
                <div className="mt-2 text-2xl font-black text-slate-950">{String(value)}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white">
            {topRouteRows.length ? (
              <div className="divide-y divide-slate-100">
                {topRouteRows.slice(0, 12).map((row: any, index: number) => {
                  const risk = String(row.risk || row.status || 'normal').toLowerCase()
                  const score = Number(row.pressureScore || row.value || 0)
                  const riskClass = risk === 'critical'
                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                    : risk === 'high'
                      ? 'border-orange-200 bg-orange-50 text-orange-700'
                      : risk === 'elevated'
                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700'

                  return (
                    <div key={`${row.route || row.label || index}`} className="grid gap-3 p-4 lg:grid-cols-[1.5fr_0.8fr_0.7fr_0.7fr_1.6fr] lg:items-center">
                      <div>
                        <div className="text-sm font-black text-slate-950">{row.label || row.route || row.name || 'Route'}</div>
                        <div className="mt-1 font-mono text-xs text-slate-500">{row.route || row.path || 'internal-route'}</div>
                      </div>

                      <div className="text-xs font-bold text-slate-600">{row.group || 'Workspace'}</div>

                      <span className="w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                        {row.type || 'page'}
                      </span>

                      <span className={`w-fit rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${riskClass}`}>
                        {risk}
                      </span>

                      <div>
                        <div className="flex items-center justify-between gap-3 text-xs font-black text-slate-600">
                          <span>Pressure score</span>
                          <span>{score}%</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(100, Math.max(0, score))}%` }} />
                        </div>
                        <div className="mt-2 text-xs leading-5 text-slate-500">{row.reason || 'Internal route registry indicator.'}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-3xl bg-slate-50 p-6 text-sm font-semibold text-slate-600">
                Route pressure is ready, but no route registry rows were returned yet. Run App Access Scan or refresh the generated app routes registry.
              </div>
            )}
          </div>
        </SectionCard>
        <SectionCard title="Route Telemetry Notes" subtitle="No fake metrics or synthetic latency are shown." badge={<Pill className="border-slate-200 bg-slate-50 text-slate-600">Honest state</Pill>}>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">Route pressure is derived from the current runtime usage payload.</div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">Latency and error rate remain hidden until actual telemetry is connected.</div>
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4">{getTelemetryEmptyCopy(usage, 'route')}</div>
          </div>
        </SectionCard>
      </section>
    )
  }

  function renderModuleControl() {
    return (
      <section className="space-y-4">
        <SectionCard title="Module Control Grid" subtitle="Live status of all core modules. Buttons stay safely disconnected until a module-level API exists." badge={<Pill className="border-slate-200 bg-slate-50 text-slate-600">Modules</Pill>}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-500">These controls are honest: disabled controls remain disabled until real module APIs exist.</div>
            <button type="button" onClick={() => navigateWorkspace('runtime-policy-studio')} className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100">
              Open Runtime Policy Studio
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {MODULES.map((module) => (
              <ModuleTile
                key={module.key}
                module={module}
                details={getModuleDetails(module.key)}
                pressure={makeModulePressure(module.key)}
                autoRefreshOn={shouldStartAutoRefresh()}
                onUnavailable={handleModuleUnavailable}
                telemetryStatus={telemetryStatusLabel}
              />
            ))}
          </div>
        </SectionCard>
      </section>
    )
  }

  function renderShutdownCenter() {
    return (
      <section className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <SectionCard title="Shutdown / Restore Command Center" subtitle="Protected workflows, subsystem health bars, and scheduled standby controls." badge={<Pill className="border-rose-200 bg-rose-50 text-rose-700">Control</Pill>}>
          <div className="min-w-0 space-y-5">
            <div className="flex items-center justify-between gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => void runAction('/api/system-control/shutdown', {
                  command: 'shutdown_now',
                  reason: scheduleReason || state.reason || 'Protected standby mode enabled.',
                  resumeAt: scheduleEnabled ? (scheduleResumeAt || null) : null,
                  timezone: scheduleTimezone,
                }, 'shutdown', SHUTDOWN_WORKFLOW.map((step) => ({ percent: step.percent, key: step.label, label: step.label, detail: step.label })))} disabled={busyAction === 'shutdown'} className="rounded-xl px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-white disabled:opacity-50">
                  Shutdown
                </button>
                <button type="button" onClick={() => void runAction('/api/system-control/restore', {
                  command: 'restore_now',
                  reason: scheduleReason || null,
                  timezone: scheduleTimezone,
                }, 'restore', RESTORE_WORKFLOW.map((step) => ({ percent: step.percent, key: step.label, label: step.label, detail: step.label })))} disabled={busyAction === 'restore'} className="rounded-xl px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-white disabled:opacity-50">
                  Restore
                </button>
                <button type="button" onClick={() => void runAction('/api/system-control/shutdown', {
                  command: 'emergency_lock',
                  reason: scheduleReason || 'Emergency lock',
                  resumeAt: scheduleEnabled ? (scheduleResumeAt || null) : null,
                  timezone: scheduleTimezone,
                }, 'shutdown', SHUTDOWN_WORKFLOW.map((step) => ({ percent: step.percent, key: step.label, label: step.label, detail: step.label })))} disabled={busyAction === 'shutdown'} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white disabled:opacity-50">
                  Emergency
                </button>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Overall progress</div>
                <div className="text-2xl font-black text-slate-950">{Math.round(workflowPercent)}%</div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-950">Workflow progress</div>
                  <div className="text-xs text-slate-500">{workflowLabel}</div>
                </div>
                <Pill className="border-blue-200 bg-blue-50 text-blue-700">{busyAction ? `${busyAction.toUpperCase()} IN PROGRESS` : 'READY'}</Pill>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-300" style={{ width: `${Math.max(0, Math.min(100, workflowPercent))}%` }} />
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <div>
                  <div className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Shutdown workflow</div>
                  <WorkflowList steps={SHUTDOWN_WORKFLOW} activePercent={workflowPercent} />
                </div>
                <div>
                  <div className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Restore workflow</div>
                  <WorkflowList steps={RESTORE_WORKFLOW} activePercent={workflowPercent} />
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: 'Compute Services', value: usageAvailable ? Math.max(0, Math.min(100, Math.round(activeCpu ?? 0))) : 0 },
                { label: 'API Gateway', value: usageAvailable ? Math.max(0, Math.min(100, routePoints[0] ? Math.round(routePoints[0] / 200) : 0)) : 0 },
                { label: 'Database Cluster', value: usageAvailable ? Math.max(0, Math.min(100, invocations ? Math.round((invocations ?? 0) / 2500) : 0)) : 0 },
                { label: 'Background Jobs', value: usageAvailable ? Math.max(0, Math.min(100, modulePressureMap.get('background_sync') ?? 0)) : 0 },
                { label: 'Edge Services', value: usageAvailable ? Math.max(0, Math.min(100, edgeRequests ? Math.round((edgeRequests ?? 0) / 3000) : 0)) : 0 },
              ].map((item) => (
                <div key={item.label} className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-slate-800">{item.label}</span>
                    <span className="font-bold text-slate-950">{item.value ? `${item.value}%` : telemetryStatusLabel}</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Schedule Controls" subtitle="Configure protected standby start and restore times." badge={<Pill className="border-slate-200 bg-slate-50 text-slate-600">Schedules</Pill>}>
          {renderScheduleForm('compact')}
        </SectionCard>
      </section>
    )
  }

  function renderSchedules() {
    return (
      <SectionCard title="Schedule Manager" subtitle="Configure protected standby start and restore times." badge={<Pill className="border-slate-200 bg-slate-50 text-slate-600">Schedules</Pill>}>
        {renderScheduleForm('full')}
      </SectionCard>
    )
  }

  function renderAuditEvents() {
    return (
      <section className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <SectionCard title="Audit & Runtime Events" subtitle="Searchable timeline with grouped repeated events." badge={<Pill className="border-slate-200 bg-slate-50 text-slate-600">Timeline</Pill>}>
          <div className="grid gap-3 lg:grid-cols-[1fr_.7fr]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={eventSearch} onChange={(event) => setEventSearch(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-300 focus:bg-white" placeholder="Search events by message, actor, route, or module" />
            </div>
            <select value={eventTypeFilter} onChange={(event) => setEventTypeFilter(event.target.value as typeof eventTypeFilter)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none">
              <option value="all">All event types</option>
              <option value="shutdown">Shutdown</option>
              <option value="restore">Restore</option>
              <option value="schedule">Schedule</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="mt-5 space-y-4">
            {groupedEventsFiltered.length ? groupedEventsFiltered.slice(0, 12).map((event) => <TimelineItem key={event.id} event={event} />) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">No runtime events match the current search.</div>
            )}
          </div>
        </SectionCard>
        <SectionCard title="Event Summary" subtitle="Grouped repeated events and timeline counts." badge={<Pill className="border-blue-200 bg-blue-50 text-blue-700">Summary</Pill>}>
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Grouped events reduce repeated shutdown and restore spikes into a single executive timeline row.</div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Search filters match event type, actor, route, module, and message text.</div>
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">{groupedEventsFiltered.length ? `${groupedEventsFiltered.length} grouped events visible.` : 'No events match the current filter set.'}</div>
          </div>
        </SectionCard>
      </section>
    )
  }

  function renderSettings() {
    return (
      <section className="grid gap-4 xl:grid-cols-[1fr_.95fr]">
        <SectionCard title="Security Configuration" subtitle="Access policy and refresh governance stay server-side protected." badge={<Pill className="border-slate-200 bg-slate-50 text-slate-600">Security</Pill>}>
          <div className="grid gap-3 text-sm text-slate-600">
            <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-600" />
              <div>
                <div className="font-semibold text-slate-950">CEO/admin authorization enforced</div>
                <div className="mt-1 leading-6">Every system-control page and API keeps server-side authorization checks in place.</div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <RefreshCw className="mt-0.5 h-5 w-5 text-blue-600" />
              <div>
                <div className="font-semibold text-slate-950">Refresh governance</div>
                <div className="mt-1 leading-6">Auto refresh respects the existing safe refresh interval and does not use aggressive polling loops.</div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <ShieldAlert className="mt-0.5 h-5 w-5 text-rose-600" />
              <div>
                <div className="font-semibold text-slate-950">Secrets remain server-side</div>
                <div className="mt-1 leading-6">No Vercel token, Supabase service role, or other private env values are exposed to the client.</div>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Telemetry Configuration" subtitle="Local vs production notes." badge={<Pill className="border-blue-200 bg-blue-50 text-blue-700">Telemetry</Pill>}>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-semibold text-slate-950">Telemetry status</div>
              <div className="mt-1 leading-6">{telemetryStatusLabel}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-semibold text-slate-950">Local / prod note</div>
              <div className="mt-1 leading-6">This page preserves honest empty states and does not fabricate usage, route, or risk metrics.</div>
            </div>
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">Settings are informational only. No hidden toggles or unsafe control changes live here.</div>
          </div>
        </SectionCard>
      </section>
    )
  }

  function renderWorkspace() {
    switch (activeWorkspace) {
      case 'telemetry':
        return renderTelemetry()
      case 'route-pressure':
        return renderRoutePressure()
      case 'module-control':
        return (
          <div className="space-y-5">
            <VoiceTerminalRuntimeControl />
            renderModuleControl()
          </div>
        )
      case 'shutdown-center':
        return renderShutdownCenter()
      case 'runtime-policy-studio':
        return <RuntimePolicyStudioWorkspace />
      case 'app-scan-center':
        return <AppScanCenterWorkspace />
      case 'schedules':
        return renderSchedules()
      case 'audit-events':
        return renderAuditEvents()
      case 'settings':
        return renderSettings()
      case 'overview':
      default:
        return renderOverview()
    }
  }

  const commandEntries = commandResultsToEntries()

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,.10),_transparent_28%),linear-gradient(180deg,_#f8fbff_0%,_#eef4fb_100%)] text-slate-900">
      <div className="grid min-h-screen w-full max-w-none gap-6 px-4 py-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:px-6">
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,.06)] lg:flex lg:flex-col">
          <div className="border-b border-slate-200 px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-black tracking-[-0.05em] text-slate-950">ANGELCARE</div>
                <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">CEO System Control Tower</div>
              </div>
            </div>
          </div>

          <div className="border-b border-slate-200 px-6 py-5">
            <Pill className="border-blue-200 bg-blue-50 text-blue-700">CEO ACCESS</Pill>
            <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Super Administrator</div>
              <div className="mt-2 text-sm leading-6 text-slate-700">
                Authorized for runtime control, protected standby, restore, and audit visibility.
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 py-5">
            <div className="space-y-2">
              {WORKSPACES.map((item) => {
                const Icon = item.icon
                const active = activeWorkspace === item.workspace
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setActiveWorkspace(item.workspace)}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                      active
                        ? 'border-blue-200 bg-blue-50 text-blue-700'
                        : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </nav>

          <div className="border-t border-slate-200 px-5 py-5">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">System Health</div>
                  <div className="mt-1 text-lg font-black text-slate-950">{systemHealthLabel}</div>
                </div>
                <div className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${modeTone.className}`}>{modeTone.label}</div>
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-3"><span>Uptime</span><span className="font-semibold text-slate-900">{uptimeLabel}</span></div>
                <div className="flex items-center justify-between gap-3"><span>Last runtime check</span><span className="font-semibold text-slate-900">{lastCheck}</span></div>
                <div className="flex items-center justify-between gap-3"><span>Snapshot state</span><span className="font-semibold text-slate-900">{snapshotState}</span></div>
              </div>
              <div className="mt-4">
                <Sparkline values={hourlyPoints.length ? hourlyPoints : [10, 12, 11, 13, 12, 14, 15, 14]} tone="blue" />
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_42px_rgba(15,23,42,.06)] lg:px-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <Pill className={modeTone.className}>{modeTone.label}</Pill>
                    <Pill className="border-slate-200 bg-slate-50 text-slate-700">CEO System Control / {workspaceMeta.label}</Pill>
                  </div>
                  <h1 className="mt-4 text-3xl font-black tracking-[-0.05em] text-slate-950 sm:text-4xl">CEO System Control Tower</h1>
                  <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-600 sm:text-[15px]">
                    Real-time system control, cost protection, and operational command center.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void refreshAllWithProgress()}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  <button
                    type="button"
                    disabled={busyAction === 'shutdown'}
                    onClick={() => void runAction('/api/system-control/shutdown', {
                      command: 'shutdown_now',
                      reason: scheduleReason || state.reason || 'Protected standby mode enabled.',
                      resumeAt: scheduleEnabled ? (scheduleResumeAt || null) : null,
                      timezone: scheduleTimezone,
                    }, 'shutdown', SHUTDOWN_WORKFLOW.map((step) => ({ percent: step.percent, key: step.label, label: step.label, detail: step.label })))}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 px-4 py-3 text-sm font-bold text-white shadow-[0_16px_30px_rgba(239,68,68,.22)] transition hover:opacity-95 disabled:opacity-60"
                  >
                    <ArrowDownToLine className="h-4 w-4" />
                    Shutdown Now
                  </button>
                  <button
                    type="button"
                    disabled={busyAction === 'restore'}
                    onClick={() => void runAction('/api/system-control/restore', {
                      command: 'restore_now',
                      reason: scheduleReason || null,
                      timezone: scheduleTimezone,
                    }, 'restore', RESTORE_WORKFLOW.map((step) => ({ percent: step.percent, key: step.label, label: step.label, detail: step.label })))}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-3 text-sm font-bold text-white shadow-[0_16px_30px_rgba(37,99,235,.18)] transition hover:opacity-95 disabled:opacity-60"
                  >
                    <ArrowUpFromLine className="h-4 w-4" />
                    Restore System
                  </button>
                  <button
                    type="button"
                    disabled={busyAction === 'shutdown'}
                    onClick={() => void runAction('/api/system-control/shutdown', {
                      command: 'emergency_lock',
                      reason: scheduleReason || 'Emergency lock',
                      resumeAt: scheduleEnabled ? (scheduleResumeAt || null) : null,
                      timezone: scheduleTimezone,
                    }, 'shutdown', SHUTDOWN_WORKFLOW.map((step) => ({ percent: step.percent, key: step.label, label: step.label, detail: step.label })))}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-800 px-4 py-3 text-sm font-bold text-white shadow-[0_16px_30px_rgba(15,23,42,.18)] transition hover:opacity-95 disabled:opacity-60"
                  >
                    <Lock className="h-4 w-4" />
                    Emergency Lock
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full max-w-xl">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={commandQuery}
                    onFocus={() => setCommandOpen(true)}
                    onBlur={() => window.setTimeout(() => setCommandOpen(false), 160)}
                    onChange={(event) => {
                      setCommandQuery(event.target.value)
                      setCommandOpen(Boolean(event.target.value.trim()))
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
                    placeholder="Jump to workspace or action"
                  />
                  {commandOpen && commandEntries.length > 0 && (
                    <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,.14)]">
                      {commandEntries.map((entry) => (
                        <button key={`${entry.workspace}-${entry.label}`} type="button" onClick={() => navigateWorkspace(entry.workspace)} className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm last:border-0 hover:bg-slate-50">
                          <div>
                            <div className="font-semibold text-slate-950">{entry.label}</div>
                            <div className="text-xs text-slate-500">{entry.description}</div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-slate-400" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1 text-xs font-semibold lg:hidden">
                  <select
                    value={activeWorkspace}
                    onChange={(event) => navigateWorkspace(event.target.value as WorkspaceKey)}
                    className="w-full rounded-xl border border-transparent bg-white px-3 py-2 text-sm outline-none"
                  >
                    {WORKSPACES.map((item) => (
                      <option key={item.workspace} value={item.workspace}>{item.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                  <ShieldCheck className="h-4 w-4 text-cyan-600" />
                  {telemetryStatusLabel}
                </span>
                <Pill className={telemetrySourceBadge.className}>{telemetrySourceBadge.label}</Pill>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                  <HelpCircle className="h-4 w-4 text-slate-500" />
                  {state.timezone || 'Africa/Casablanca'}
                </span>
              </div>
            </div>

            {(notice || error) && (
              <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                {error || notice}
              </div>
            )}
          </section>

          <div className="sticky top-4 z-20 hidden rounded-[1.5rem] border border-slate-200 bg-white/92 p-2 shadow-[0_14px_34px_rgba(15,23,42,.06)] backdrop-blur lg:block">
            <div className="flex items-center gap-2 overflow-x-auto">
              {WORKSPACES.map((item) => {
                const Icon = item.icon
                const active = activeWorkspace === item.workspace
                return (
                  <button
                    key={item.workspace}
                    type="button"
                    onClick={() => navigateWorkspace(item.workspace)}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      active ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="hidden lg:flex">
                        <div className="w-full max-w-none min-w-0">{renderWorkspace()}</div>
          </div>

          <footer className="pb-4 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">ANGELCARE CEO System Control Tower</span> • runtime state is refreshed safely, privileged routes remain protected, and module controls stay disconnected until supported APIs exist.
          </footer>
        </div>
      </div>
      <ActionProgressPanel progress={actionProgress.progress} onClose={actionProgress.closeProgress} />
    </main>
  )
}
