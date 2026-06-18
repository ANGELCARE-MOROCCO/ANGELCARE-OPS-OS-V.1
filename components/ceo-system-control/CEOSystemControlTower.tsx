'use client'

import Link from 'next/link'
import AppScanCenterWorkspace from '@/components/ceo-system-control/AppScanCenterWorkspace'
import RuntimePolicyStudioWorkspace from '@/components/ceo-system-control/RuntimePolicyStudioWorkspace'
import {
  Activity,
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Bell,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Cloud,
  Cpu,
  HelpCircle,
  LayoutDashboard,
  Lock,
  MonitorUp,
  PauseCircle,
  PlayCircle,
  RadioTower,
  RefreshCw,
  Route,
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
import { type ReactNode, useEffect, useId, useMemo, useState } from 'react'
import { safeRefreshInterval, safeUiInterval, shouldStartAutoRefresh } from '@/lib/runtime/client-live-governor'

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

const SIDEBAR_ITEMS = [
  { label: 'Overview', workspace: 'overview', href: '/ceo/system-control?workspace=overview', icon: LayoutDashboard, sectionId: 'overview' },
  { label: 'Live Consumption', workspace: 'consumption', href: '/ceo/system-control?workspace=consumption', icon: Activity, sectionId: 'consumption' },
  { label: 'Route Pressure', workspace: 'routes', href: '/ceo/system-control?workspace=routes', icon: Route, sectionId: 'routes' },
  { label: 'Module Control', workspace: 'modules', href: '/ceo/system-control?workspace=modules', icon: MonitorUp, sectionId: 'modules' },
  { label: 'Shutdown Center', workspace: 'command-center', href: '/ceo/system-control?workspace=command-center', icon: ShieldAlert, sectionId: 'command-center' },
  { label: 'Runtime Policy Studio', workspace: 'runtime-policy-studio', href: '/ceo/system-control?workspace=runtime-policy-studio', icon: Settings2, sectionId: 'runtime-policy-studio' },
  { label: 'App Scan Center', workspace: 'app-scan-center', href: '/ceo/system-control?workspace=app-scan-center', icon: Sparkles, sectionId: 'app-scan-center' },
  { label: 'Schedules', workspace: 'schedules', href: '/ceo/system-control?workspace=schedules', icon: CalendarClock, sectionId: 'schedules' },
  { label: 'Audit Events', workspace: 'events', href: '/ceo/system-control?workspace=events', icon: ShieldCheck, sectionId: 'events' },
  { label: 'Settings', workspace: 'settings', href: '/ceo/system-control?workspace=settings', icon: Settings2, sectionId: 'settings' },
] as const

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

function getRouteState(value: number) {
  if (value >= 16_000) return { label: 'Blocked', className: 'border-rose-200 bg-rose-50 text-rose-700' }
  if (value >= 9_000) return { label: 'Aggressive', className: 'border-orange-200 bg-orange-50 text-orange-700' }
  if (value >= 3_000) return { label: 'Watch', className: 'border-amber-200 bg-amber-50 text-amber-700' }
  return { label: 'Normal', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' }
}

function getEventTone(eventType: string) {
  const normalized = eventType.toLowerCase()
  if (normalized.includes('restore')) return { label: 'Restore', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' }
  if (normalized.includes('emergency') || normalized.includes('shutdown')) return { label: 'Critical', className: 'border-rose-200 bg-rose-50 text-rose-700' }
  if (normalized.includes('schedule')) return { label: 'Scheduled', className: 'border-sky-200 bg-sky-50 text-sky-700' }
  return { label: 'Info', className: 'border-slate-200 bg-slate-50 text-slate-700' }
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
  return input
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const entry = item as Record<string, unknown>
      const normalized: UsagePoint = {
        label: String(entry.label || entry.at || entry.day || entry.hour || ''),
        value: asNumber(entry.value) ?? 0,
        cost: asNumber(entry.cost) ?? null,
        count: asNumber(entry.count) ?? null,
      }
      return normalized
    })
    .filter((item): item is UsagePoint => Boolean(item && item.label))
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
  const label = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}% vs prior point`
  return label
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
  const path = buildSparklinePath(values)
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

function MiniChart({ points, title, subtitle, emptyLabel, color = 'blue' }: {
  points: number[]
  title: string
  subtitle: string
  emptyLabel: string
  color?: 'blue' | 'green' | 'orange' | 'rose'
}) {
  const tone = color === 'green' ? 'green' : color === 'orange' ? 'orange' : color === 'rose' ? 'rose' : 'blue'
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,.06)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-xs text-slate-500">{subtitle}</div>
        </div>
        <div className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          {points.length ? 'Live' : 'No data'}
        </div>
      </div>
      <div className="mt-4">
        {points.length ? (
          <MiniLineChart points={points} color={tone} />
        ) : (
          <div className="flex min-h-[190px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 text-sm text-slate-500">
            {emptyLabel}
          </div>
        )}
      </div>
    </div>
  )
}

function MiniLineChart({ points, color }: { points: number[]; color: 'blue' | 'green' | 'orange' | 'rose' }) {
  const gradientSuffix = useId().replace(/:/g, '')
  const width = 600
  const height = 240
  const paddingX = 18
  const paddingY = 18
  const safePoints = points.length === 1 ? [points[0], points[0]] : points
  const min = Math.min(...safePoints)
  const max = Math.max(...safePoints)
  const span = Math.max(max - min, 1)
  const usableWidth = width - paddingX * 2
  const usableHeight = height - paddingY * 2
  const stroke = {
    blue: '#2563eb',
    green: '#16a34a',
    orange: '#f97316',
    rose: '#e11d48',
  }[color]

  const linePath = safePoints
    .map((point, index) => {
      const x = paddingX + (usableWidth * (index / Math.max(safePoints.length - 1, 1)))
      const y = height - paddingY - (((point - min) / span) * usableHeight)
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')

  const areaPath = `${linePath} L ${width - paddingX} ${height - paddingY} L ${paddingX} ${height - paddingY} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-[240px] w-full">
      <defs>
        <linearGradient id={`chart-${color}-${gradientSuffix}`} x1="0%" x2="0%" y1="0%" y2="100%">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((grid) => {
        const y = paddingY + (usableHeight * (grid / 3))
        return <line key={grid} x1={paddingX} x2={width - paddingX} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" />
      })}
      <path d={areaPath} fill={`url(#chart-${color}-${gradientSuffix})`} />
      <path d={linePath} fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {safePoints.map((point, index) => {
        const x = paddingX + (usableWidth * (index / Math.max(safePoints.length - 1, 1)))
        const y = height - paddingY - (((point - min) / span) * usableHeight)
        return <circle key={`${index}-${point}`} cx={x} cy={y} r="3.8" fill={stroke} stroke="white" strokeWidth="2" />
      })}
    </svg>
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

function HorizontalPressureBars({ rows, emptyLabel }: { rows: UsageModule[]; emptyLabel: string }) {
  if (!rows.length) {
    return <div className="flex min-h-[250px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 text-sm text-slate-500">{emptyLabel}</div>
  }

  const safeRows = rows.slice(0, 8)
  const max = Math.max(...safeRows.map((row) => row.value), 1)

  return (
    <div className="space-y-4">
      {safeRows.map((row) => {
        const state = getRouteState(row.value)
        return (
          <div key={row.module} className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-slate-700">{row.module}</span>
              <span className="font-semibold text-slate-900">{formatCompact(row.value)}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500" style={{ width: `${(row.value / max) * 100}%` }} />
            </div>
            <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.18em] text-slate-500">
              <span>Auto-derived pressure</span>
              <span className={`rounded-full border px-2.5 py-1 font-semibold ${state.className}`}>{state.label}</span>
            </div>
          </div>
        )
      })}
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

function Panel({
  title,
  subtitle,
  badge,
  children,
  id,
}: {
  title: string
  subtitle?: string
  badge?: ReactNode
  children: ReactNode
  id?: string
}) {
  return (
    <section id={id} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,.06)]">
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
  const tone = getEventTone(event.event_type)
  const count = Math.max(1, event.count || 1)
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

function ModuleCard({
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
      <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">{telemetryStatus === 'Internal snapshots only' ? 'Internal snapshot available.' : 'Module telemetry not instrumented yet.'}</div>
    </article>
  )
}

function PressureTable({ rows, emptyLabel }: { rows: UsageUsage[]; emptyLabel: string }) {
  if (!rows.length) {
    return <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">{emptyLabel}</div>
  }

  const rowsSorted = [...rows].sort((a, b) => b.value - a.value).slice(0, 8)
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
          <tr>
            <th className="px-4 py-3">Route</th>
            <th className="px-4 py-3">Requests / hour</th>
            <th className="px-4 py-3">Avg latency</th>
            <th className="px-4 py-3">Error rate</th>
            <th className="px-4 py-3">State</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rowsSorted.map((row, index) => {
            const state = getRouteState(row.value)
            return (
              <tr key={`${row.route}-${index}`}>
                <td className="px-4 py-3 font-semibold text-slate-900">{row.route}</td>
                <td className="px-4 py-3 text-slate-700">{formatCompact(row.value)}</td>
                <td className="px-4 py-3 text-slate-500">No route telemetry yet</td>
                <td className="px-4 py-3 text-slate-500">No route telemetry yet</td>
                <td className="px-4 py-3"><Pill className={state.className}>{state.label}</Pill></td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        Table state is derived from route pressure only when deeper latency telemetry is unavailable.
      </div>
    </div>
  )
}

function SectionBadge({ children }: { children: ReactNode }) {
  return <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{children}</div>
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
  initialWorkspace: 'overview' | 'consumption' | 'routes' | 'modules' | 'command-center' | 'runtime-policy-studio' | 'app-scan-center' | 'schedules' | 'events' | 'settings'
}) {
  const [state, setState] = useState<RuntimeState>(initialState)
  const [usage, setUsage] = useState<SystemUsageResponse | null>(() => normalizeUsage(initialUsage))
  const [events, setEvents] = useState<RuntimeEvent[]>(() => normalizeEvents(initialEvents))
  const [activeWorkspace, setActiveWorkspace] = useState(initialWorkspace)
  const [isMounted, setIsMounted] = useState(false)
  const [now, setNow] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [busyAction, setBusyAction] = useState<ActionKind>(null)
  const [workflowPercent, setWorkflowPercent] = useState(0)
  const [workflowLabel, setWorkflowLabel] = useState('Idle')
  const [workflowSteps, setWorkflowSteps] = useState<ProgressStep[]>([])
  const [sectionMode, setSectionMode] = useState<'manual' | 'scheduled'>('manual')
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scheduleTouched, setScheduleTouched] = useState(false)
  const [scheduleEnabled, setScheduleEnabled] = useState(() => Boolean(initialState.schedule?.shutdownAt || initialState.schedule?.resumeAt))
  const [scheduleShutdownAt, setScheduleShutdownAt] = useState('')
  const [scheduleResumeAt, setScheduleResumeAt] = useState('')
  const [scheduleTimezone, setScheduleTimezone] = useState(initialState.timezone || 'Africa/Casablanca')
  const [scheduleReason, setScheduleReason] = useState(initialState.reason || '')

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
  const routePoints = usageAvailable ? (usage?.charts.routePressure || []).map((row) => row.value) : []
  const modulePressureRows = usageAvailable ? usage?.charts.modulePressure || [] : []
  const topRouteRows = usageAvailable ? usage?.charts.routePressure || [] : []
  const groupedEvents = useMemo(() => groupRuntimeEvents(events), [events])
  const activeData = useMemo(() => {
    return {
      cpu: hourlyPoints.length ? hourlyPoints : [],
      invocations: dailyPoints.length ? dailyPoints : [],
      edge: routePoints.length ? routePoints : [],
      bandwidth: usageAvailable && usage?.charts.hourly.length ? seriesValues(usage.charts.hourly, 'cost') : [],
      error: usageAvailable && usage?.charts.daily.length ? seriesValues(usage.charts.daily) : [],
      cost: usageAvailable && usage?.charts.weekly.length ? seriesValues(usage.charts.weekly, 'cost') : [],
    }
  }, [dailyPoints, hourlyPoints, routePoints, usage, usageAvailable])

  const modulePressureMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const row of modulePressureRows) map.set(row.module, row.value)
    for (const [module, details] of Object.entries(state.disabledModules)) {
      if (!map.has(module) && typeof details.pressure === 'number') map.set(module, details.pressure)
    }
    return map
  }, [modulePressureRows, state.disabledModules])

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
    setIsMounted(true)
    setActiveWorkspace(initialWorkspace)
    return () => setIsMounted(false)
  }, [initialWorkspace])

  useEffect(() => {
    if (!isMounted) return
    setNow(new Date())
    const timer = window.setInterval(() => setNow(new Date()), safeUiInterval(1000))
    return () => window.clearInterval(timer)
  }, [isMounted])

  useEffect(() => {
    if (!isMounted || activeWorkspace === 'overview') return
    const target = document.getElementById(activeWorkspace)
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [activeWorkspace, isMounted])

  useEffect(() => {
    let mounted = true

    const refresh = async (broadcast = false) => {
      if (busyAction) return
      try {
        setRefreshing(true)
        const [stateRes, usageRes, eventsRes] = await Promise.all([
          fetch('/api/system-control/state', { cache: 'no-store' }),
          fetch('/api/system-control/usage', { cache: 'no-store' }),
          fetch('/api/system-control/events?limit=40', { cache: 'no-store' }),
        ])

        if (!mounted) return

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
      } catch {
        // Keep the last known snapshot. The UI already shows safe empty states.
      } finally {
        if (mounted) setRefreshing(false)
        if (broadcast) {
          window.dispatchEvent(new CustomEvent('system-control-refresh', { detail: { source: 'tower' } }))
        }
      }
    }

    void refresh()

    if (!shouldStartAutoRefresh()) {
      return () => {
        mounted = false
      }
    }

    const timer = window.setInterval(() => {
      void refresh()
    }, safeRefreshInterval(60_000))

    return () => {
      mounted = false
      window.clearInterval(timer)
    }
  }, [busyAction])

  async function animateWorkflow(steps: ProgressStep[]) {
    setWorkflowSteps(steps)
    for (const step of steps) {
      setWorkflowLabel(step.label)
      setWorkflowPercent(step.percent)
      await new Promise((resolve) => window.setTimeout(resolve, 170))
    }
  }

  async function refreshAll(broadcast = false) {
    try {
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
      // Intentional no-op.
    }
  }

  async function runAction(endpoint: '/api/system-control/shutdown' | '/api/system-control/restore' | '/api/system-control/schedule', body: Record<string, unknown>, action: ActionKind, steps?: ProgressStep[]) {
    setBusyAction(action)
    setNotice(null)
    setError(null)
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || 'Action failed')
      }

      if (Array.isArray(payload.progress) && payload.progress.length) {
        setWorkflowSteps(payload.progress)
        await animateWorkflow(payload.progress as ProgressStep[])
      } else if (steps?.length) {
        await animateWorkflow(steps)
      }

      if (payload.state) setState(payload.state)
      await refreshAll(true)
      setWorkflowLabel(action === 'restore' ? 'Normal mode restored' : action === 'schedule' ? 'Schedule saved' : 'Standby mode active')
      setWorkflowPercent(100)
      setNotice(action === 'schedule' ? 'Schedule updated successfully.' : action === 'restore' ? 'System restored.' : 'Shutdown command executed.')
      setScheduleTouched(false)
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Action failed')
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

  const clockText = isMounted && now ? formatClock(now, state.timezone || 'Africa/Casablanca') : 'Clock initializing...'
  const routeTableRows = useMemo(() => topRouteRows, [topRouteRows])
  const hourlyTrend = pointTrend(hourlyPoints)
  const invTrend = pointTrend(dailyPoints)
  const edgeTrend = pointTrend(routePoints)
  const bandwidthTrend = pointTrend(activeData.bandwidth)
  const errorTrend = pointTrend(activeData.error)
  const costTrend = pointTrend(activeData.cost)

  const systemHealthLabel = state.isSystemOnline ? 'System Online' : 'Protected Standby'
  const snapshotState = state.mode.toUpperCase()
  const uptimeLabel = state.createdAt ? formatDateTime(state.createdAt, state.timezone) : 'No snapshot available'
  const lastCheck = formatDateTime(state.updatedAt || state.lastActionAt, state.timezone)
  const scheduleStatus = scheduleEnabled ? (scheduleShutdownAt || scheduleResumeAt ? 'Scheduled' : 'Manual') : 'Disabled'

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,.10),_transparent_28%),linear-gradient(180deg,_#f8fbff_0%,_#eef4fb_100%)] text-slate-900">
      <div className="mx-auto grid min-h-screen w-full max-w-[1800px] gap-6 px-4 py-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:px-6">
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
              {SIDEBAR_ITEMS.map((item) => {
                const Icon = item.icon
                const active = activeWorkspace === item.workspace
                return (
                  <Link
                    key={item.label}
                    href={item.href}
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
          <section id="overview" className="rounded-[2rem] border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_42px_rgba(15,23,42,.06)] lg:px-6">
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
                  Real-time system control, cost protection & operational command center.
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
                  onClick={() => void refreshAll(true)}
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

          <section id="consumption" className="grid gap-4 xl:grid-cols-3">
            <StatCard
              icon={<Cpu className="h-5 w-5" />}
              label="Active CPU"
              value={formatPercent(activeCpu)}
              trend={hourlyPoints.length ? hourlyTrend : telemetryStatusLabel}
              helper={usage?.connected.internal ? 'Internal snapshot' : telemetryStatusLabel}
              tone="blue"
              sparkline={activeData.cpu}
            />
            <StatCard
              icon={<Zap className="h-5 w-5" />}
              label="Function Invocations"
              value={formatCompact(invocations)}
              trend={dailyPoints.length ? invTrend : telemetryStatusLabel}
              helper={usage?.connected.internal ? 'Internal snapshot' : telemetryStatusLabel}
              tone="green"
              sparkline={activeData.invocations}
            />
            <StatCard
              icon={<SignalHigh className="h-5 w-5" />}
              label="Edge Requests"
              value={formatCompact(edgeRequests)}
              trend={routePoints.length ? edgeTrend : telemetryStatusLabel}
              helper={usage?.connected.internal ? 'Internal snapshot' : telemetryStatusLabel}
              tone="orange"
              sparkline={activeData.edge}
            />
            <StatCard
              icon={<Cloud className="h-5 w-5" />}
              label="Data Transfer"
              value={formatBandwidth(bandwidth)}
              trend={activeData.bandwidth.length ? bandwidthTrend : telemetryStatusLabel}
              helper={usage?.connected.internal ? 'Internal snapshot' : telemetryStatusLabel}
              tone="blue"
              sparkline={activeData.bandwidth}
            />
            <StatCard
              icon={<AlertCircle className="h-5 w-5" />}
              label="Error Rate"
              value={formatPercent(errorRate)}
              trend={activeData.error.length ? errorTrend : telemetryStatusLabel}
              helper={usage?.connected.internal ? 'Internal snapshot' : telemetryStatusLabel}
              tone="rose"
              sparkline={activeData.error}
            />
            <StatCard
              icon={<Wallet className="h-5 w-5" />}
              label="Cost Pressure"
              value={formatCompact(costPressure)}
              trend={activeData.cost.length ? costTrend : telemetryStatusLabel}
              helper={usage?.vercel.status === 'connected' ? 'Vercel billing source available' : 'Estimated cost is 0 MAD without an external billing source'}
              tone="orange"
              sparkline={activeData.cost}
            />
          </section>

          <section id="consumption-analytics" className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-4">
            <Panel
              title="Hourly Consumption"
              subtitle="Requests and cost curve over the latest internal snapshot window."
              badge={<SectionBadge><Activity className="h-3.5 w-3.5" /> Hourly</SectionBadge>}
            >
              <MiniChart
                points={usageAvailable ? seriesValues(usage?.charts.hourly || []) : []}
                title="Requests + Cost"
                subtitle="Last 24 internal points"
                emptyLabel={getTelemetryEmptyCopy(usage, 'snapshot')}
                color="blue"
              />
            </Panel>
            <Panel
              title="Daily Consumption"
              subtitle="Stacked snapshot bars for daily request and cost accumulation."
              badge={<SectionBadge><CalendarClock className="h-3.5 w-3.5" /> Daily</SectionBadge>}
            >
              <StackedBars
                points={usageAvailable ? usage?.charts.daily || [] : []}
                emptyLabel={usageAvailable ? 'Daily telemetry has no records yet.' : getTelemetryEmptyCopy(usage, 'snapshot')}
              />
            </Panel>
            <Panel
              title="Module Pressure Index"
              subtitle="Pressure is derived from disabled module state and snapshot telemetry."
              badge={<SectionBadge><ShieldCheck className="h-3.5 w-3.5" /> Modules</SectionBadge>}
            >
              <HorizontalPressureBars
                rows={usageAvailable ? usage?.charts.modulePressure || [] : []}
                emptyLabel={getTelemetryEmptyCopy(usage, 'module')}
              />
            </Panel>
            <Panel
              title="Route Traffic & Latency Trend"
              subtitle="Traffic is plotted from route pressure; latency remains hidden until telemetry connects."
              badge={<SectionBadge><Route className="h-3.5 w-3.5" /> Routes</SectionBadge>}
            >
              {usageAvailable && routeTableRows.length ? (
                <MiniLineChart points={routePoints} color="green" />
              ) : (
                <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 text-sm text-slate-500">
                  {getTelemetryEmptyCopy(usage, 'route')}
                </div>
              )}
            </Panel>
          </section>

          <section id="modules" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_rgba(15,23,42,.06)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-[15px] font-bold tracking-[-0.02em] text-slate-950">Module Control Grid</div>
                <div className="mt-1 text-sm leading-6 text-slate-500">Live status of all core modules. Button controls stay safely disconnected until a module-level API exists.</div>
              </div>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1 text-xs font-semibold">
                <button type="button" onClick={() => setSectionMode('manual')} className={`rounded-xl px-3 py-2 ${sectionMode === 'manual' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'}`}>
                  Manual
                </button>
                <button type="button" onClick={() => setSectionMode('scheduled')} className={`rounded-xl px-3 py-2 ${sectionMode === 'scheduled' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'}`}>
                  Scheduled
                </button>
              </div>
              <div className="mt-2 text-xs text-slate-500">View mode only. These tabs only change the draft layout.</div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {MODULES.map((module) => {
                return (
                  <ModuleCard
                    key={module.key}
                    module={module}
                    details={getModuleDetails(module.key)}
                    pressure={makeModulePressure(module.key)}
                    autoRefreshOn={shouldStartAutoRefresh()}
                    onUnavailable={handleModuleUnavailable}
                    telemetryStatus={telemetryStatusLabel}
                  />
                )
              })}
            </div>
          </section>

          <section id="command-center" className="grid gap-4 xl:grid-cols-[1.2fr_.9fr]">
            <Panel
              title="Shutdown / Restore Command Center"
              subtitle="Protected workflows, subsystem health bars, and scheduled standby controls."
              badge={<SectionBadge><ShieldAlert className="h-3.5 w-3.5" /> Control</SectionBadge>}
            >
              <div className="grid gap-5 xl:grid-cols-[1.3fr_.9fr]">
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setSectionMode('manual')} className={`rounded-xl px-4 py-2 text-sm font-semibold ${sectionMode === 'manual' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>
                        Manual
                      </button>
                      <button type="button" onClick={() => setSectionMode('scheduled')} className={`rounded-xl px-4 py-2 text-sm font-semibold ${sectionMode === 'scheduled' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>
                        Scheduled
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

                <div className="space-y-4">
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Scheduled Standby</div>
                    <div className="mt-3 space-y-3 text-sm text-slate-700">
                      <div className="flex items-center justify-between gap-3"><span>Shutdown at</span><span className="font-semibold text-slate-950">22:00</span></div>
                      <div className="flex items-center justify-between gap-3"><span>Restore at</span><span className="font-semibold text-slate-950">08:00</span></div>
                      <div className="flex items-center justify-between gap-3"><span>Timezone</span><span className="font-semibold text-slate-950">Africa/Casablanca</span></div>
                      <div className="flex items-center justify-between gap-3"><span>Status</span><Pill className={scheduleEnabled ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-600'}>{scheduleStatus}</Pill></div>
                    </div>
                    <button type="button" onClick={() => document.getElementById('schedules')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} title="Jump to the schedule draft section" className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50">
                      Manage schedule
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      disabled={busyAction === 'shutdown'}
                      onClick={() => void runAction('/api/system-control/shutdown', {
                        command: 'shutdown_now',
                        reason: scheduleReason || state.reason || 'Protected standby mode enabled.',
                        resumeAt: scheduleEnabled ? (scheduleResumeAt || null) : null,
                        timezone: scheduleTimezone,
                      }, 'shutdown', SHUTDOWN_WORKFLOW.map((step) => ({ percent: step.percent, key: step.label, label: step.label, detail: step.label })))}
                      className="inline-flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                    >
                      <span className="inline-flex items-center gap-2"><ShieldAlert className="h-4 w-4" /> Execute Shutdown Now</span>
                      <span>CEO only</span>
                    </button>
                    <button
                      type="button"
                      disabled={busyAction === 'restore'}
                      onClick={() => void runAction('/api/system-control/restore', {
                        command: 'restore_now',
                        reason: scheduleReason || null,
                        timezone: scheduleTimezone,
                      }, 'restore', RESTORE_WORKFLOW.map((step) => ({ percent: step.percent, key: step.label, label: step.label, detail: step.label })))}
                      className="inline-flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
                    >
                      <span className="inline-flex items-center gap-2"><PlayCircle className="h-4 w-4" /> Restore System Now</span>
                      <span>Normal mode</span>
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
                      className="inline-flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                    >
                      <span className="inline-flex items-center gap-2"><Lock className="h-4 w-4" /> Emergency Lock</span>
                      <span>Freeze access</span>
                    </button>
                  </div>
                </div>
              </div>
            </Panel>

            <Panel
              title="Schedule Manager"
              subtitle="Configure protected standby start and restore times."
              badge={<SectionBadge><CalendarClock className="h-3.5 w-3.5" /> Schedules</SectionBadge>}
              id="schedules"
            >
              <div className="grid gap-4">
                <div className="flex items-center gap-2 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-2 text-sm font-semibold">
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
            </Panel>
          </section>

          <section id="routes" className="grid gap-4 xl:grid-cols-[1.3fr_.9fr]">
            <Panel
              title="Top Expensive Routes / Route Pressure"
              subtitle="Pressure is pulled from the usage API when available; latency and error rate remain hidden until telemetry is connected."
              badge={<SectionBadge><Route className="h-3.5 w-3.5" /> Route Pressure</SectionBadge>}
            >
              <PressureTable rows={routeTableRows} emptyLabel={getTelemetryEmptyCopy(usage, 'route')} />
            </Panel>

            <Panel
              title="Audit & Runtime Events"
              subtitle="Events are loaded from the runtime events API and rendered as an executive timeline."
              badge={<SectionBadge><ShieldCheck className="h-3.5 w-3.5" /> Events</SectionBadge>}
              id="events"
            >
              <div className="space-y-4">
                {groupedEvents.length ? groupedEvents.slice(0, 8).map((event) => <TimelineItem key={event.id} event={event} />) : (
                  <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">No runtime events yet.</div>
                )}
              </div>
            </Panel>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1fr_.95fr]" id="settings">
            <Panel
              title="Offline Notice Preview"
              subtitle="Preview only. This mirrors the public standby notice without exposing the live route."
              badge={<SectionBadge><AlertCircle className="h-3.5 w-3.5" /> Preview</SectionBadge>}
            >
              <div className="rounded-[1.75rem] border border-blue-200 bg-[linear-gradient(180deg,_#f8fbff_0%,_#eef6ff_100%)] p-5">
                <div className="inline-flex items-center rounded-full border border-blue-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-700">
                  ANGELCARE System Standby Mode
                </div>
                <div className="mt-4 text-2xl font-black tracking-[-0.04em] text-slate-950">Protected standby preview</div>
                <div className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                  System will resume at 08:00 except for authorized users.
                </div>
                <div className="mt-5 rounded-[1.35rem] border border-blue-100 bg-white p-4 text-sm text-slate-600">
                  This preview is shown only to the CEO control tower. It mirrors the protected standby message without changing the public route.
                </div>
              </div>
            </Panel>

            <Panel
              title="Settings"
              subtitle="Access policy and refresh governance are server-side protected."
              badge={<SectionBadge><Settings2 className="h-3.5 w-3.5" /> Security</SectionBadge>}
            >
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
            </Panel>
          </section>

          <RuntimePolicyStudioWorkspace />

          <AppScanCenterWorkspace />

          <footer className="pb-4 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">ANGELCARE CEO System Control Tower</span> • runtime state is refreshed safely, privileged routes remain protected, and module controls stay disconnected until supported APIs exist.
          </footer>
        </div>
      </div>
    </main>
  )
}
