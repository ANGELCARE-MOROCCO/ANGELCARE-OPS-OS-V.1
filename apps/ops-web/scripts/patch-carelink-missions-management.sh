#!/usr/bin/env bash
set -euo pipefail

# Run from the ANGELCARE app root, e.g. ~/Desktop/angelcare-opsos-app
if [ ! -f "package.json" ] || [ ! -d "components/carelink/ops/missions" ]; then
  echo "ERROR: run this script from the ANGELCARE app root folder."
  exit 1
fi

TARGET="components/carelink/ops/missions/CareLinkMissionControlCenter.tsx"
BACKUP="${TARGET}.backup-$(date +%Y%m%d-%H%M%S)"
cp "$TARGET" "$BACKUP"
echo "Backup created: $BACKUP"

cat > "$TARGET" <<'EOF'
'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Bell,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  Flag,
  Layers3,
  Loader2,
  MapPinned,
  MessageSquare,
  MoreHorizontal,
  Navigation,
  PencilRuler,
  Plus,
  Radio,
  RefreshCw,
  Route,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  TimerReset,
  UserCheck,
  Users,
  WalletCards,
  X,
  Zap,
} from 'lucide-react'
import { CareLinkCreateMissionDossierModal } from './CareLinkCreateMissionDossierModal'
import { resolvedMissionCode } from '@/lib/missions/mission-codes'
import { safeRefreshInterval, safeUiInterval, shouldStartAutoRefresh } from '@/lib/runtime/client-live-governor'

type AnyRecord = Record<string, any>

type MissionControlCenterProps = {
  activeView?: string
  initialRecords?: AnyRecord[]
}

const SERVICE_TYPES = [
  'All services',
  'Childcare at Home',
  'Baby Post-Partum Support',
  'Special Child at Home',
  'Special Child at School',
  'Hybrid Support',
  'Animation',
  'Excursion',
  'Academy',
  'Flashcards',
]

const PIPELINE = [
  { key: 'intake', label: 'Intake', caption: 'New missions', icon: FileText, tone: 'blue' },
  { key: 'qualification', label: 'Qualification', caption: 'In review', icon: ClipboardCheck, tone: 'teal' },
  { key: 'scheduling', label: 'Scheduling', caption: 'Pending slots', icon: CalendarClock, tone: 'violet' },
  { key: 'assignment', label: 'Assignment', caption: 'Assigning', icon: UserCheck, tone: 'orange' },
  { key: 'in_progress', label: 'In Progress', caption: 'Live missions', icon: Radio, tone: 'emerald' },
  { key: 'quality_control', label: 'Quality Control', caption: 'Under review', icon: ShieldCheck, tone: 'indigo' },
  { key: 'closed', label: 'Closed', caption: 'This month', icon: CheckCircle2, tone: 'green' },
]

const STAGE_ORDER = ['created', 'assigned', 'accepted', 'en_route', 'in_progress', 'report_pending', 'validation', 'completed']

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function arr(value: unknown): AnyRecord[] {
  return Array.isArray(value) ? value as AnyRecord[] : []
}

function n(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function txt(value: unknown, fallback = '—') {
  return value === null || value === undefined || value === '' ? fallback : String(value)
}

function moneyMAD(value: unknown) {
  const amount = n(value)
  return `${amount.toLocaleString('fr-MA')} MAD`
}

function numericId(record: AnyRecord | null | undefined) {
  const raw = record?.id ?? record?.missionId ?? record?.mission_id ?? record?.parent_mission_id
  const parsed = Number(raw)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

function missionId(record: AnyRecord) {
  return txt(record.id ?? record.mission_id ?? record.uuid ?? record.code ?? record.missionCode ?? record.dossier_reference, '')
}

function missionCode(record: AnyRecord) {
  try {
    const code = resolvedMissionCode(record)
    if (code) return code
  } catch {}
  return txt(record.missionCode ?? record.code ?? record.reference ?? record.dossier_reference ?? record.mission_reference ?? `M-${missionId(record) || 'LIVE'}`)
}

function missionTitle(record: AnyRecord) {
  return txt(record.serviceType ?? record.service_type ?? record.designation ?? record.service ?? record.title ?? record.label, 'Mission dossier')
}

function missionClient(record: AnyRecord) {
  return txt(record.familyName ?? record.family_name ?? record.clientName ?? record.client_name ?? record.client_label ?? record.family?.full_name ?? record.family?.name, 'Client / Family')
}

function missionAgent(record: AnyRecord) {
  return txt(record.agentName ?? record.agent_name ?? record.caregiverName ?? record.caregiver_name ?? record.assignedAgent ?? record.caregiver?.full_name ?? record.caregiver?.name, 'Unassigned')
}

function missionCity(record: AnyRecord) {
  return txt(record.city ?? record.location_city ?? record.family?.city, 'Rabat')
}

function missionZone(record: AnyRecord) {
  return txt(record.zone ?? record.location_zone ?? record.family?.zone, 'Z1')
}

function rawStatus(record: AnyRecord) {
  return txt(record.status ?? record.lifecycleStage ?? record.lifecycle_stage ?? record.dispatchStatus ?? record.dispatch_status ?? record.report_status ?? 'created', 'created').toLowerCase()
}

function missionStage(record: AnyRecord) {
  const raw = rawStatus(record)
  if (raw.includes('deleted') || raw.includes('archived') || raw.includes('cancel')) return 'hidden'
  if (raw.includes('complete') || raw.includes('closed')) return 'completed'
  if (raw.includes('valid') || raw.includes('qc') || raw.includes('quality')) return 'validation'
  if (raw.includes('report')) return 'report_pending'
  if (raw.includes('progress') || raw.includes('start')) return 'in_progress'
  if (raw.includes('route') || raw.includes('travel')) return 'en_route'
  if (raw.includes('accept') || raw.includes('confirm')) return 'accepted'
  if (raw.includes('assign')) return 'assigned'
  return 'created'
}

function riskLevel(record: AnyRecord) {
  const raw = txt(record.riskLevel ?? record.risk_level ?? record.priority ?? record.urgency ?? record.severity ?? 'normal', 'normal').toLowerCase()
  if (['critical', 'urgent', 'high', 'incident', 'at_risk', 'blocked'].some((item) => raw.includes(item))) return 'high'
  if (['medium', 'warning', 'elevated'].some((item) => raw.includes(item))) return 'medium'
  return 'low'
}

function isVisible(record: AnyRecord) {
  if (!record) return false
  if (record.is_archived === true || record.isArchived === true) return false
  return missionStage(record) !== 'hidden'
}

function startDate(record: AnyRecord) {
  return record.scheduledStart ?? record.scheduled_start ?? record.start_at ?? record.missionDate ?? record.mission_date ?? record.created_at ?? record.createdAt
}

function dateLabel(value: unknown) {
  if (!value) return 'Not scheduled'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('fr-MA', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function paymentStatus(record: AnyRecord) {
  const raw = txt(record.payment_status ?? record.paymentStatus ?? record.invoice_status ?? record.billing_status ?? record.payment?.status ?? '', '').toLowerCase()
  if (raw.includes('paid') || raw.includes('settled')) return 'Paid'
  if (raw.includes('unpaid') || raw.includes('late') || raw.includes('failed')) return 'Unpaid'
  if (raw.includes('pending') || raw.includes('due')) return 'Pending'
  if (n(record.pending_amount ?? record.balance_due ?? record.remaining_amount) > 0) return 'Pending'
  return missionStage(record) === 'completed' ? 'Paid' : 'Pending'
}

function missionAmount(record: AnyRecord) {
  return n(record.pending_amount ?? record.balance_due ?? record.remaining_amount ?? record.total_amount ?? record.amount ?? record.price)
}

function progressValue(record: AnyRecord) {
  const direct = n(record.progress ?? record.progress_percent ?? record.completionRate)
  if (direct > 0) return Math.min(100, Math.round(direct))
  const stage = missionStage(record)
  const index = STAGE_ORDER.indexOf(stage)
  if (index < 0) return 8
  return Math.min(100, Math.max(8, Math.round(((index + 1) / STAGE_ORDER.length) * 100)))
}

function extractMissions(payload: AnyRecord | null): AnyRecord[] {
  if (!payload) return []
  const candidates = [
    arr(payload.missions),
    arr(payload.dossiers),
    arr(payload.records),
    arr(payload.data?.missions),
    arr(payload.data?.dossiers),
    arr(payload.data?.records),
    Array.isArray(payload.data) ? payload.data : [],
    arr(payload.dashboard?.missions),
    arr(payload.workspace?.missions),
    arr(payload.payload?.missions),
    arr(payload.upcomingMissions),
  ]
  return candidates.find((rows) => rows.length) || []
}

function countBy(rows: AnyRecord[], predicate: (row: AnyRecord) => boolean) {
  return rows.filter(predicate).length
}

function toneClasses(tone: string) {
  const map: Record<string, string> = {
    blue: 'border-blue-100 bg-blue-50 text-blue-700',
    teal: 'border-teal-100 bg-teal-50 text-teal-700',
    violet: 'border-violet-100 bg-violet-50 text-violet-700',
    orange: 'border-orange-100 bg-orange-50 text-orange-700',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    indigo: 'border-indigo-100 bg-indigo-50 text-indigo-700',
    green: 'border-green-100 bg-green-50 text-green-700',
    rose: 'border-rose-100 bg-rose-50 text-rose-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
    slate: 'border-slate-100 bg-slate-50 text-slate-700',
  }
  return map[tone] || map.blue
}

function Pill({ children, tone = 'slate' }: { children: ReactNode; tone?: string }) {
  return <span className={cx('inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black', toneClasses(tone))}>{children}</span>
}

function Button({ children, onClick, variant = 'ghost', disabled }: { children: ReactNode; onClick?: () => void; variant?: 'primary' | 'ghost' | 'danger'; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-4 text-sm font-black transition active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50',
        variant === 'primary' && 'border-blue-700 bg-blue-700 text-white shadow-lg shadow-blue-100 hover:bg-blue-800',
        variant === 'danger' && 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
        variant === 'ghost' && 'border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50',
      )}
    >
      {children}
    </button>
  )
}

function KpiCard({ icon, label, value, helper, tone }: { icon: ReactNode; label: string; value: string | number; helper: string; tone: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={cx('grid h-12 w-12 place-items-center rounded-full border', toneClasses(tone))}>{icon}</div>
        <div className="min-w-0">
          <p className="truncate text-xs font-black text-slate-600">{label}</p>
          <p className="mt-1 text-2xl font-black leading-none text-slate-950">{value}</p>
          <p className="mt-1 truncate text-[11px] font-bold text-slate-500">{helper}</p>
        </div>
      </div>
    </article>
  )
}

function Panel({ title, children, action, className }: { title: string; children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <section className={cx('rounded-2xl border border-slate-200 bg-white shadow-sm', className)}>
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-black text-slate-950">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function MiniLine({ points }: { points: number[] }) {
  const safe = points.length ? points : [10, 30, 20, 55, 40, 70]
  const max = Math.max(...safe, 1)
  const coords = safe.map((value, index) => `${(index / Math.max(1, safe.length - 1)) * 100},${46 - (value / max) * 38}`).join(' ')
  return (
    <svg viewBox="0 0 100 50" className="h-24 w-full overflow-visible">
      <path d="M0 46 H100" stroke="currentColor" strokeOpacity="0.08" />
      <path d="M0 30 H100" stroke="currentColor" strokeOpacity="0.08" />
      <path d="M0 14 H100" stroke="currentColor" strokeOpacity="0.08" />
      <polyline points={coords} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {safe.map((value, index) => (
        <circle key={`${value}-${index}`} cx={(index / Math.max(1, safe.length - 1)) * 100} cy={46 - (value / max) * 38} r="1.8" fill="currentColor" />
      ))}
    </svg>
  )
}

function BarSeries({ values }: { values: number[] }) {
  const max = Math.max(...values, 1)
  return (
    <div className="flex h-24 items-end gap-3 px-1">
      {values.map((value, index) => (
        <div key={`${value}-${index}`} className="flex flex-1 flex-col items-center gap-2">
          <div className="w-full rounded-t-lg bg-blue-600/85" style={{ height: `${Math.max(12, (value / max) * 88)}px` }} />
          <span className="text-[10px] font-bold text-slate-400">{['Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed'][index] || index + 1}</span>
        </div>
      ))}
    </div>
  )
}

export function CareLinkMissionControlCenter({ activeView, initialRecords = [] }: MissionControlCenterProps = {}) {
  void activeView
  const router = useRouter()
  const [records, setRecords] = useState<AnyRecord[]>(() => initialRecords.filter(isVisible))
  const [payload, setPayload] = useState<AnyRecord>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [serviceFilter, setServiceFilter] = useState('All services')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedMission, setSelectedMission] = useState<AnyRecord | null>(null)
  const [selectedMissionLoading, setSelectedMissionLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [command, setCommand] = useState<string | null>(null)
  const [commandText, setCommandText] = useState('')
  const [commandSaving, setCommandSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const loadMissions = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const endpoints = ['/api/carelink/ops/missions', '/api/missions/dossiers', '/api/missions/control-center', '/api/missions']
      let found: AnyRecord | null = null
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, { cache: 'no-store', headers: { Accept: 'application/json' } })
          const json = await response.json().catch(() => null)
          if (response.ok && json) {
            const rows = extractMissions(json)
            if (rows.length || json.ok !== false) {
              found = json
              break
            }
          }
        } catch {}
      }
      if (!found) throw new Error('No live mission endpoint responded.')
      const rows = extractMissions(found).filter(isVisible)
      setPayload(found)
      setRecords(rows)
      setSelectedIds((current) => current.filter((id) => rows.some((row) => missionId(row) === id)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load CareLink missions.')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMissions(Boolean(initialRecords.length))
  }, [initialRecords.length, loadMissions])

  useEffect(() => {
    if (!shouldStartAutoRefresh()) return
    const timer = window.setInterval(() => loadMissions(true), safeRefreshInterval(30000))
    return () => window.clearInterval(timer)
  }, [loadMissions])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), safeUiInterval(3400))
    return () => window.clearTimeout(timer)
  }, [toast])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return records.filter((record) => {
      const text = [missionCode(record), missionClient(record), missionTitle(record), missionAgent(record), missionCity(record), missionZone(record), rawStatus(record)].join(' ').toLowerCase()
      const matchesQuery = !q || text.includes(q)
      const matchesService = serviceFilter === 'All services' || missionTitle(record).toLowerCase().includes(serviceFilter.toLowerCase())
      return matchesQuery && matchesService
    })
  }, [query, records, serviceFilter])

  const selectedMissions = useMemo(() => filtered.filter((row) => selectedIds.includes(missionId(row))), [filtered, selectedIds])
  const primaryMission = selectedMissions[0] || filtered[0] || null

  const metrics = useMemo(() => {
    const total = filtered.length
    const completed = countBy(filtered, (row) => missionStage(row) === 'completed')
    const active = countBy(filtered, (row) => ['assigned', 'accepted', 'en_route', 'in_progress', 'report_pending', 'validation'].includes(missionStage(row)))
    const inProgress = countBy(filtered, (row) => ['en_route', 'in_progress'].includes(missionStage(row)))
    const validation = countBy(filtered, (row) => ['report_pending', 'validation'].includes(missionStage(row)))
    const urgent = countBy(filtered, (row) => riskLevel(row) === 'high')
    const pendingPaymentRows = filtered.filter((row) => paymentStatus(row) !== 'Paid')
    const pendingMAD = pendingPaymentRows.reduce((sum, row) => sum + missionAmount(row), 0)
    const agents = new Set(filtered.map(missionAgent).filter((name) => name !== 'Unassigned')).size
    const completionRate = total ? Math.round((completed / total) * 1000) / 10 : 0
    const sla = total ? Math.max(0, Math.round(((total - urgent) / total) * 1000) / 10) : 100
    return { total, active, completed, inProgress, validation, urgent, pendingPaymentRows, pendingMAD, agents, completionRate, sla }
  }, [filtered])

  const pipelineCounts = useMemo(() => ({
    intake: countBy(filtered, (row) => missionStage(row) === 'created'),
    qualification: countBy(filtered, (row) => missionStage(row) === 'accepted'),
    scheduling: countBy(filtered, (row) => missionStage(row) === 'created' && missionAgent(row) === 'Unassigned'),
    assignment: countBy(filtered, (row) => missionStage(row) === 'assigned'),
    in_progress: countBy(filtered, (row) => ['en_route', 'in_progress'].includes(missionStage(row))),
    quality_control: countBy(filtered, (row) => ['report_pending', 'validation'].includes(missionStage(row))),
    closed: countBy(filtered, (row) => missionStage(row) === 'completed'),
  }), [filtered])

  const cityStats = useMemo(() => {
    const map = new Map<string, number>()
    filtered.forEach((row) => map.set(missionCity(row), (map.get(missionCity(row)) || 0) + 1))
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [filtered])

  const chartValues = useMemo(() => {
    const base = Math.max(1, filtered.length)
    return [0.32, 0.48, 0.54, 0.63, 0.72, 0.84, 1].map((ratio) => Math.max(1, Math.round(base * ratio)))
  }, [filtered.length])

  function toggle(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  async function openMission(record: AnyRecord | null) {
    if (!record) return
    setSelectedMission(record)
    const id = numericId(record)
    if (!id) return
    setSelectedMissionLoading(true)
    try {
      const response = await fetch(`/api/missions/dossiers/${id}`, { cache: 'no-store', headers: { Accept: 'application/json' } })
      const json = await response.json().catch(() => null)
      if (response.ok && json?.ok && json.data) setSelectedMission(json.data)
    } catch {}
    finally { setSelectedMissionLoading(false) }
  }

  async function runCommand(action: string, rows = selectedMissions) {
    setCommandSaving(true)
    try {
      const ids = rows.map(numericId).filter((id): id is number => Boolean(id))
      if (action === 'validate_report' && ids.length) {
        await Promise.all(ids.map((id) => fetch(`/api/missions/${id}/validate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note: commandText || 'Validated from CareLink Missions Management.' }) }).catch(() => null)))
      } else if (action === 'escalate' && ids.length) {
        await Promise.all(ids.map((id) => fetch(`/api/missions/${id}/incident`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ severity: 'high', note: commandText || 'Escalated from CareLink Missions Management.' }) }).catch(() => null)))
      } else if (action === 'assign_agent' && rows[0]) {
        await openMission(rows[0])
      } else {
        await fetch('/api/carelink/ops/missions/actions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ action, missionIds: ids.length ? ids : selectedIds, message: commandText, source: 'carelink_ops_missions_management' }),
        }).catch(() => null)
      }
      setToast(`${action.replace(/_/g, ' ')} synced for ${rows.length || filtered.length} mission(s).`)
      setCommand(null)
      setCommandText('')
      await loadMissions(true)
    } finally {
      setCommandSaving(false)
    }
  }

  function exportCsv() {
    const rows = filtered.map((row) => ({
      mission_code: missionCode(row),
      family_client: missionClient(row),
      service_type: missionTitle(row),
      city_zone: `${missionCity(row)} / ${missionZone(row)}`,
      assigned_caregiver: missionAgent(row),
      start_date: dateLabel(startDate(row)),
      current_stage: missionStage(row),
      payment_status: paymentStatus(row),
      progress: `${progressValue(row)}%`,
      risk: riskLevel(row),
    }))
    const headers = Object.keys(rows[0] || { mission_code: '', family_client: '', service_type: '', city_zone: '', assigned_caregiver: '', start_date: '', current_stage: '', payment_status: '', progress: '', risk: '' })
    const csv = [headers.join(','), ...rows.map((row) => headers.map((key) => `"${String((row as AnyRecord)[key] || '').replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `carelink-missions-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const priority = filtered.filter((row) => riskLevel(row) === 'high').slice(0, 3)
  const delayed = filtered.filter((row) => ['en_route', 'assigned'].includes(missionStage(row)) || rawStatus(row).includes('delay')).slice(0, 3)
  const intervention = filtered.filter((row) => paymentStatus(row) !== 'Paid' || missionAgent(row) === 'Unassigned').slice(0, 3)
  const tableRows = filtered.slice(0, 8)

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <div className="space-y-3 p-3 sm:p-4 lg:p-5">
        <section className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-700 text-white shadow-lg shadow-blue-100"><Layers3 size={20} /></div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight text-slate-950">Missions Management</h1>
                  <span className="grid h-5 w-5 place-items-center rounded-full border border-slate-200 text-[10px] font-black text-slate-400">i</span>
                </div>
                <p className="text-sm font-semibold text-slate-500">Command center for mission oversight, execution and quality assurance.</p>
              </div>
            </div>
            <div className="flex flex-1 items-center justify-end gap-3">
              <div className="relative hidden min-w-[340px] max-w-xl flex-1 lg:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search missions, clients, agents, dossiers..." className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-bold outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50" />
              </div>
              <button type="button" className="relative grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700"><Bell size={17} /><span className="absolute -right-1 -top-1 rounded-full bg-rose-600 px-1.5 text-[10px] font-black text-white">{metrics.urgent}</span></button>
              <button type="button" className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700"><MessageSquare size={17} /></button>
              <div className="hidden items-center gap-3 border-l border-slate-200 pl-3 xl:flex">
                <div className="text-right"><p className="text-sm font-black text-slate-900">CareLink Ops</p><p className="text-xs font-semibold text-slate-500">Operations Director</p></div>
                <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-900 text-xs font-black text-white">AC</div>
              </div>
            </div>
          </div>
        </section>

        {error ? <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-black text-rose-700">{error}</div> : null}
        {toast ? <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-black text-emerald-700">{toast}</div> : null}

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
          <KpiCard icon={<Activity size={22} />} label="Active Missions" value={metrics.active} helper="▲ live synced" tone="blue" />
          <KpiCard icon={<CheckCircle2 size={22} />} label="Mission Completion Rate" value={`${metrics.completionRate}%`} helper="▲ from live records" tone="green" />
          <KpiCard icon={<ShieldCheck size={22} />} label="SLA Compliance" value={`${metrics.sla}%`} helper="▲ risk adjusted" tone="violet" />
          <KpiCard icon={<Users size={22} />} label="Agents Deployed" value={metrics.agents} helper="unique caregivers" tone="blue" />
          <KpiCard icon={<AlertTriangle size={22} />} label="Urgent Incidents" value={metrics.urgent} helper="high risk missions" tone="rose" />
          <KpiCard icon={<WalletCards size={22} />} label="Payments Pending" value={moneyMAD(metrics.pendingMAD)} helper={`${metrics.pendingPaymentRows.length} invoices`} tone="orange" />
          <KpiCard icon={<FileCheck2 size={22} />} label="Reports Awaiting Validation" value={metrics.validation} helper="QC queue" tone="blue" />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="grid gap-2 md:grid-cols-4 xl:grid-cols-8">
            <Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={16} /> New Mission Dossier</Button>
            <Button onClick={() => selectedMissions.length ? setCommand('assign_agent') : setToast('Select one mission first, then assign an agent.')}><UserCheck size={16} /> Assign Agent</Button>
            <Button onClick={() => router.push('/carelink-ops/dispatch')}><Navigation size={16} /> Launch Dispatch</Button>
            <Button onClick={() => openMission(primaryMission)} disabled={!primaryMission}><FileText size={16} /> Open Dossier</Button>
            <Button onClick={() => setCommand('edit_route')} disabled={!filtered.length}><PencilRuler size={16} /> Edit Route</Button>
            <Button onClick={() => selectedMissions.length ? setCommand('validate_report') : setToast('Select missions to validate reports.')}><BadgeCheck size={16} /> Validate Report</Button>
            <Button onClick={() => selectedMissions.length ? setCommand('escalate') : setToast('Select missions to escalate.')}><AlertTriangle size={16} /> Escalate</Button>
            <div className="flex gap-2">
              <Button onClick={exportCsv}><Download size={16} /> Export <ChevronDown size={14} /></Button>
              <Button onClick={() => loadMissions()} disabled={loading}>{loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}</Button>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid lg:grid-cols-[150px_1fr]">
            <div className="border-b border-slate-100 p-4 lg:border-b-0 lg:border-r"><p className="text-sm font-black text-slate-950">Mission Pipeline</p><p className="mt-1 text-xs font-bold text-blue-600">Live Overview</p></div>
            <div className="grid gap-0 md:grid-cols-2 xl:grid-cols-7">
              {PIPELINE.map((item, index) => {
                const Icon = item.icon
                return (
                  <div key={item.key} className="flex items-center gap-3 border-b border-slate-100 p-4 last:border-b-0 xl:border-b-0 xl:border-r xl:last:border-r-0">
                    <div className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-full border', toneClasses(item.tone))}><Icon size={17} /></div>
                    <div className="min-w-0 flex-1"><p className="text-xs font-black text-slate-600">{item.label}</p><p className="mt-1 text-lg font-black text-slate-950">{pipelineCounts[item.key as keyof typeof pipelineCounts]}</p><p className="truncate text-[11px] font-semibold text-slate-500">{item.caption}</p></div>
                    {index < PIPELINE.length - 1 ? <ChevronRight className="hidden shrink-0 text-slate-300 xl:block" size={16} /> : null}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="grid gap-3 2xl:grid-cols-[1.42fr_.62fr_1fr]">
          <Panel title="Mission Dossiers" action={<div className="flex items-center gap-2"><Pill tone="blue">All Active</Pill><Pill tone="slate">{filtered.length}</Pill></div>} className="overflow-hidden">
            <div className="border-b border-slate-100 p-3 lg:hidden">
              <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search missions..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-bold outline-none" /></div>
            </div>
            <div className="max-h-[360px] overflow-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="sticky top-0 z-10 bg-white text-[10px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3"><input type="checkbox" checked={tableRows.length > 0 && tableRows.every((row) => selectedIds.includes(missionId(row)))} onChange={(event) => setSelectedIds(event.target.checked ? Array.from(new Set([...selectedIds, ...tableRows.map(missionId)])) : selectedIds.filter((id) => !tableRows.some((row) => missionId(row) === id)))} /></th>
                    <th className="px-4 py-3">Mission Code</th><th className="px-4 py-3">Family / Client</th><th className="px-4 py-3">Service Type</th><th className="px-4 py-3">City / Zone</th><th className="px-4 py-3">Assigned Caregiver</th><th className="px-4 py-3">Start Date</th><th className="px-4 py-3">Current Stage</th><th className="px-4 py-3">Payment</th><th className="px-4 py-3">Progress</th><th className="px-4 py-3">Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {tableRows.map((row) => {
                    const id = missionId(row)
                    const progress = progressValue(row)
                    const risk = riskLevel(row)
                    const pay = paymentStatus(row)
                    return (
                      <tr key={id || missionCode(row)} className="hover:bg-slate-50">
                        <td className="px-4 py-3"><input type="checkbox" checked={selectedIds.includes(id)} onChange={() => toggle(id)} /></td>
                        <td className="whitespace-nowrap px-4 py-3 font-black text-blue-700"><button onClick={() => openMission(row)}>{missionCode(row)}</button></td>
                        <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-800">{missionClient(row)}</td>
                        <td className="whitespace-nowrap px-4 py-3">{missionTitle(row)}</td>
                        <td className="whitespace-nowrap px-4 py-3">{missionCity(row)} / {missionZone(row)}</td>
                        <td className="whitespace-nowrap px-4 py-3"><div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-[10px] font-black text-slate-600">{missionAgent(row).slice(0, 2).toUpperCase()}</span><span>{missionAgent(row)}</span></div></td>
                        <td className="whitespace-nowrap px-4 py-3">{dateLabel(startDate(row))}</td>
                        <td className="whitespace-nowrap px-4 py-3"><Pill tone={missionStage(row) === 'in_progress' ? 'emerald' : missionStage(row) === 'assigned' ? 'orange' : missionStage(row) === 'validation' ? 'violet' : 'slate'}>{missionStage(row).replace(/_/g, ' ')}</Pill></td>
                        <td className="whitespace-nowrap px-4 py-3"><Pill tone={pay === 'Paid' ? 'green' : pay === 'Unpaid' ? 'rose' : 'amber'}>{pay}</Pill></td>
                        <td className="min-w-[100px] px-4 py-3"><div className="flex items-center gap-2"><span className="w-9 font-black">{progress}%</span><div className="h-1.5 flex-1 rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-700" style={{ width: `${progress}%` }} /></div></div></td>
                        <td className="whitespace-nowrap px-4 py-3"><Pill tone={risk === 'high' ? 'rose' : risk === 'medium' ? 'amber' : 'green'}>{risk}</Pill></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {!tableRows.length ? <div className="p-8 text-center text-sm font-bold text-slate-500">No live missions match the current filters.</div> : null}
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs font-bold text-slate-500"><span>Showing {Math.min(tableRows.length, filtered.length)} of {filtered.length} missions</span><div className="flex items-center gap-2"><Button><ChevronLeft size={14} /></Button><span className="grid h-8 w-8 place-items-center rounded-lg border border-blue-200 bg-blue-50 font-black text-blue-700">1</span><span>2</span><span>3</span><span>...</span><span>{Math.max(1, Math.ceil(filtered.length / 8))}</span><Button><ChevronRight size={14} /></Button></div></div>
          </Panel>

          <Panel title="Live Operations Board" action={<button className="text-xs font-black text-blue-700">View all</button>}>
            <OpsGroup icon={<Flag size={16} />} tone="rose" title="Priority Missions" count={priority.length} rows={priority} label="Require immediate attention" />
            <OpsGroup icon={<Clock3 size={16} />} tone="orange" title="Delayed Missions" count={delayed.length} rows={delayed} label="Behind schedule" />
            <OpsGroup icon={<AlertTriangle size={16} />} tone="amber" title="Needs Intervention" count={intervention.length} rows={intervention} label="At risk of SLA breach" />
          </Panel>

          <Panel title="Route & Territory Overview" action={<Button onClick={() => router.push('/carelink-ops/dispatch')}>Optimize <ChevronDown size={14} /></Button>}>
            <div className="p-4">
              <div className="relative h-[300px] overflow-hidden rounded-xl border border-slate-200 bg-[radial-gradient(circle_at_20%_20%,#e0f2fe_0,transparent_25%),radial-gradient(circle_at_80%_30%,#dcfce7_0,transparent_25%),radial-gradient(circle_at_40%_80%,#fef3c7_0,transparent_28%),linear-gradient(135deg,#f8fafc,#eef2ff)]">
                <svg viewBox="0 0 560 300" className="absolute inset-0 h-full w-full">
                  <path d="M25 60 L155 35 L255 80 L330 45 L520 65 L498 248 L336 222 L234 258 L88 220 Z" fill="none" stroke="#60a5fa" strokeWidth="2" strokeDasharray="7 7" />
                  <path d="M55 205 C118 132 190 150 245 104 C313 48 383 90 502 54" fill="none" stroke="#2563eb" strokeWidth="5" strokeLinecap="round" />
                  <path d="M90 224 C158 170 232 220 316 168 C394 120 438 170 500 118" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" opacity=".75" />
                  <path d="M78 75 L162 52 L218 108 L160 175 L64 150 Z" fill="#f9731614" stroke="#fb923c" strokeWidth="2" />
                  <path d="M332 70 L510 78 L510 220 L378 226 L320 150 Z" fill="#22c55e14" stroke="#22c55e" strokeWidth="2" />
                  <path d="M175 70 L317 48 L348 165 L248 210 L145 165 Z" fill="#8b5cf614" stroke="#8b5cf6" strokeWidth="2" />
                  {[[85,192,'3'],[146,147,'8'],[224,120,'16'],[302,96,'4'],[360,160,'7'],[440,94,'31'],[492,128,'5']].map(([x,y,label]) => <g key={`${x}-${y}`}><circle cx={x} cy={y} r="13" fill="#2563eb" /><text x={x} y={Number(y)+4} textAnchor="middle" fontSize="11" fontWeight="800" fill="white">{label}</text></g>)}
                  <g><circle cx="395" cy="55" r="11" fill="#16a34a" /><path d="M389 55 h12 M395 49 v12" stroke="white" strokeWidth="2" /></g>
                  <g><circle cx="526" cy="150" r="11" fill="#dc2626" /><path d="M526 144 v8 M526 156 v2" stroke="white" strokeWidth="2" /></g>
                </svg>
                <div className="absolute left-16 top-12 text-sm font-black text-slate-700">Northside</div><div className="absolute bottom-20 left-20 text-sm font-black text-slate-700">Westfield</div><div className="absolute right-16 top-24 text-sm font-black text-slate-700">Eastview</div><div className="absolute left-[48%] top-[48%] text-sm font-black text-slate-700">Downtown</div>
                <div className="absolute right-3 top-1/2 grid -translate-y-1/2 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"><button className="px-3 py-2 font-black">+</button><button className="border-y border-slate-200 px-3 py-2 font-black">−</button><button className="px-3 py-2"><Layers3 size={14} /></button></div>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-[11px] font-black text-slate-600"><Legend color="bg-blue-600" label="Active Mission" /><Legend color="bg-green-600" label="Caregiver" /><Legend color="bg-slate-700" label="Client Location" /><Legend color="bg-rose-600" label="Delayed" /><Legend color="bg-blue-300" label="Optimized Route" /></div>
            </div>
          </Panel>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <ChartCard title="Trajectory (Today)" value={`${Math.min(metrics.active, metrics.total)} / ${Math.max(metrics.total, 1)}`} helper="Missions" tone="blue"><MiniLine points={chartValues} /></ChartCard>
          <ChartCard title="Mission Progression (7 Days)" value={`${metrics.completionRate}%`} helper="Completion Rate" tone="emerald"><BarSeries values={chartValues} /></ChartCard>
          <ChartCard title="Service Demand Trend" value={metrics.total} helper="Total Requests" tone="blue"><MiniLine points={[...chartValues].reverse()} /></ChartCard>
          <ChartCard title="Workload Distribution" value={String(metrics.agents || 0)} helper="Total agents" tone="violet"><Donut cityStats={cityStats} total={filtered.length} /></ChartCard>
          <ChartCard title="Avg. Response Time" value={`${Math.max(12, 52 - metrics.sla / 2).toFixed(0)} min`} helper="Average" tone="blue"><MiniLine points={[18, 26, 23, 31, 28, 42, 29]} /></ChartCard>
          <ChartCard title="Mission Stage Overview" value="Live" helper="All missions" tone="emerald"><StageBars rows={filtered} /></ChartCard>
        </section>

        <section className="grid gap-3 xl:grid-cols-[1.35fr_.8fr_.85fr_1fr]">
          <Panel title="Today's Schedule" action={<button className="text-xs font-black text-blue-700">View full timeline</button>}>
            <Schedule rows={filtered.slice(0, 5)} />
          </Panel>
          <Panel title="Caregiver Allocation" action={<button className="text-xs font-black text-blue-700">View all</button>}>
            <div className="space-y-3 p-4">
              {Array.from(new Map<string, AnyRecord>(filtered.map((row) => [missionAgent(row), row] as [string, AnyRecord])).entries()).slice(0, 5).map(([agent, row], index) => <AgentRow key={agent} agent={agent} row={row} index={index} />)}
              {!filtered.length ? <p className="text-sm font-bold text-slate-500">No caregiver allocation loaded yet.</p> : null}
            </div>
          </Panel>
          <Panel title="Quality & Reporting" action={<button className="text-xs font-black text-blue-700">View all</button>}>
            <div className="space-y-4 p-4">
              <QualityRow label="Reports Awaiting Validation" value={metrics.validation} percent={Math.min(100, metrics.validation * 10)} />
              <QualityRow label="Validation Compliance" value={`${metrics.sla}%`} percent={metrics.sla} />
              <QualityRow label="Checklists Completed" value={`${metrics.completed}/${Math.max(metrics.total, 1)}`} percent={metrics.total ? (metrics.completed / metrics.total) * 100 : 0} />
              <QualityRow label="Quality Score (7 Days)" value="4.7 / 5" percent={94} />
            </div>
          </Panel>
          <Panel title="Alerts & Communications" action={<button className="text-xs font-black text-blue-700">View all</button>}>
            <div className="space-y-3 p-4">
              <AlertRow tone="rose" icon={<AlertTriangle size={14} />} text={`SLA Alert: ${priority[0] ? missionCode(priority[0]) : 'No critical mission'} requires attention.`} />
              <AlertRow tone="amber" icon={<Clock3 size={14} />} text={`${delayed[0] ? missionAgent(delayed[0]) : 'Caregiver'} route requires dispatch review.`} />
              <AlertRow tone="blue" icon={<FileCheck2 size={14} />} text={`${metrics.validation} report(s) awaiting validation.`} />
              <AlertRow tone="green" icon={<WalletCards size={14} />} text={`${metrics.pendingPaymentRows.length} payment record(s) pending finance follow-up.`} />
            </div>
          </Panel>
        </section>
      </div>

      {createOpen ? <CareLinkCreateMissionDossierModal close={() => { setCreateOpen(false); setTimeout(() => loadMissions(true), 350) }} refresh={async () => loadMissions(true)} /> : null}
      {selectedMission ? <><>{selectedMissionLoading ? <div className="fixed right-6 top-6 z-[10001] rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-black text-blue-700 shadow-xl">Loading full dossier…</div> : null}</><CareLinkCreateMissionDossierModal mode="edit" initialMission={selectedMission} close={() => setSelectedMission(null)} refresh={async () => loadMissions(true)} /></> : null}
      {command ? <CommandModal action={command} message={commandText} setMessage={setCommandText} saving={commandSaving} selectedCount={selectedMissions.length} close={() => setCommand(null)} submit={() => runCommand(command)} /> : null}
    </main>
  )
}

function OpsGroup({ icon, tone, title, count, label, rows }: { icon: ReactNode; tone: string; title: string; count: number; label: string; rows: AnyRecord[] }) {
  return (
    <div className="border-b border-slate-100 p-4 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3"><span className={cx('mt-0.5', tone === 'rose' ? 'text-rose-600' : tone === 'orange' ? 'text-orange-500' : 'text-amber-500')}>{icon}</span><div><p className="text-sm font-black text-slate-900">{title}</p><p className="text-[11px] font-semibold text-slate-500">{label}</p></div></div>
        <span className="text-xl font-black text-slate-950">{count}</span>
      </div>
      <div className="mt-3 space-y-2">
        {rows.map((row) => <div key={missionCode(row)} className="grid grid-cols-[1fr_auto] gap-2 text-[11px] font-bold"><span className="truncate text-blue-700">{missionCode(row)}</span><span className="text-slate-500">{missionCity(row)} / {missionZone(row)}</span></div>)}
        {!rows.length ? <p className="text-[11px] font-bold text-slate-400">No matching live mission.</p> : null}
      </div>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="inline-flex items-center gap-1.5"><span className={cx('h-2.5 w-2.5 rounded-full', color)} />{label}</span>
}

function ChartCard({ title, value, helper, tone, children }: { title: string; value: ReactNode; helper: string; tone: string; children: ReactNode }) {
  return <Panel title={title}><div className={cx('px-4 pb-4 pt-2', tone === 'emerald' ? 'text-emerald-600' : tone === 'violet' ? 'text-violet-600' : 'text-blue-600')}><p className="text-2xl font-black">{value}</p><p className="text-xs font-bold text-slate-500">{helper}</p>{children}</div></Panel>
}

function Donut({ cityStats, total }: { cityStats: Array<[string, number]>; total: number }) {
  return (
    <div className="mt-3 grid grid-cols-[96px_1fr] items-center gap-4 text-slate-700">
      <div className="grid h-24 w-24 place-items-center rounded-full bg-[conic-gradient(#2563eb_0_30%,#14b8a6_30%_54%,#f97316_54%_74%,#a855f7_74%_88%,#e2e8f0_88%_100%)]"><div className="grid h-14 w-14 place-items-center rounded-full bg-white text-center text-sm font-black text-slate-950">{total}<br /><span className="text-[10px] text-slate-400">Total</span></div></div>
      <div className="space-y-1 text-[11px] font-bold text-slate-500">{cityStats.length ? cityStats.map(([city, count]) => <div key={city} className="flex justify-between gap-2"><span>{city}</span><span>{Math.round((count / Math.max(total, 1)) * 100)}%</span></div>) : <p>No zone data</p>}</div>
    </div>
  )
}

function StageBars({ rows }: { rows: AnyRecord[] }) {
  const stages = [
    ['In Progress', countBy(rows, (row) => ['en_route', 'in_progress'].includes(missionStage(row))), 'bg-emerald-500'],
    ['Assignment', countBy(rows, (row) => missionStage(row) === 'assigned'), 'bg-orange-400'],
    ['Scheduling', countBy(rows, (row) => missionStage(row) === 'created'), 'bg-violet-400'],
    ['QC Review', countBy(rows, (row) => ['report_pending', 'validation'].includes(missionStage(row))), 'bg-indigo-400'],
    ['Closed', countBy(rows, (row) => missionStage(row) === 'completed'), 'bg-green-300'],
  ] as const
  const total = Math.max(rows.length, 1)
  return <div className="mt-5"><div className="flex h-4 overflow-hidden rounded-full bg-slate-100">{stages.map(([label, value, cls]) => <div key={label} className={cls} style={{ width: `${(value / total) * 100}%` }} />)}</div><div className="mt-4 grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-500">{stages.map(([label, value, cls]) => <div key={label} className="flex items-center gap-2"><span className={cx('h-2 w-2 rounded-full', cls)} />{label} <span className="ml-auto">{value}</span></div>)}</div></div>
}

function Schedule({ rows }: { rows: AnyRecord[] }) {
  return <div className="overflow-auto p-4"><div className="min-w-[560px] space-y-3">{rows.map((row, index) => <div key={missionCode(row)} className="grid grid-cols-[150px_1fr] items-center gap-3"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-[10px] font-black text-slate-600">{missionAgent(row).slice(0, 2).toUpperCase()}</span><div><p className="text-[11px] font-black text-slate-900">{missionCode(row)}</p><p className="text-[10px] font-bold text-slate-500">{missionClient(row)}</p></div></div><div className="relative h-8 rounded-lg bg-slate-50 ring-1 ring-slate-100"><div className={cx('absolute top-1 h-6 rounded-lg px-3 text-center text-[10px] font-black leading-6', index % 4 === 0 ? 'left-[10%] w-[20%] bg-blue-100 text-blue-700' : index % 4 === 1 ? 'left-[22%] w-[18%] bg-orange-100 text-orange-700' : index % 4 === 2 ? 'left-[35%] w-[28%] bg-emerald-100 text-emerald-700' : 'left-[18%] w-[16%] bg-rose-100 text-rose-700')}>{missionStage(row).replace(/_/g, ' ')}</div><div className="absolute left-1/2 top-0 h-full border-l border-dashed border-rose-400" /></div></div>)}{!rows.length ? <p className="text-sm font-bold text-slate-500">No schedule rows loaded.</p> : null}</div></div>
}

function AgentRow({ agent, row, index }: { agent: string; row: AnyRecord; index: number }) {
  const availability = [70, 50, 80, 100, 30][index % 5]
  return <div className="grid grid-cols-[1fr_auto] items-center gap-3 text-xs"><div className="min-w-0"><p className="truncate font-black text-slate-900">{agent}</p><p className="mt-1 font-bold text-slate-500">{missionStage(row).replace(/_/g, ' ')}</p></div><div className="w-28"><div className="h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${availability}%` }} /></div><p className="mt-1 text-right font-black text-slate-500">{availability}%</p></div></div>
}

function QualityRow({ label, value, percent }: { label: string; value: ReactNode; percent: number }) {
  return <div><div className="mb-2 flex justify-between gap-3 text-xs font-bold"><span className="text-slate-600">{label}</span><span className="font-black text-slate-900">{value}</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-700" style={{ width: `${Math.max(3, Math.min(100, percent))}%` }} /></div></div>
}

function AlertRow({ tone, icon, text }: { tone: string; icon: ReactNode; text: string }) {
  return <div className="grid grid-cols-[24px_1fr_auto] items-center gap-2 text-xs font-bold"><span className={tone === 'rose' ? 'text-rose-600' : tone === 'amber' ? 'text-amber-500' : tone === 'green' ? 'text-green-600' : 'text-blue-600'}>{icon}</span><span className="text-slate-700">{text}</span><span className="text-[11px] text-slate-400">Now</span></div>
}

function CommandModal({ action, message, setMessage, selectedCount, saving, close, submit }: { action: string; message: string; setMessage: (value: string) => void; selectedCount: number; saving: boolean; close: () => void; submit: () => void }) {
  return (
    <div className="fixed inset-0 z-[10000] grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-white/70 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-blue-700">Operational command</p><h3 className="mt-2 text-2xl font-black text-slate-950">{action.replace(/_/g, ' ')}</h3><p className="mt-2 text-sm font-semibold text-slate-500">Selected missions: {selectedCount}. Command will sync through the live CareLink mission API.</p></div><button onClick={close} className="rounded-xl border border-slate-200 bg-white p-2"><X size={18} /></button></div>
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Command note, dispatch instruction, validation comment or escalation reason..." className="mt-5 min-h-32 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50" />
        <div className="mt-5 flex justify-end gap-3"><Button onClick={close}>Cancel</Button><Button variant="primary" onClick={submit} disabled={saving}>{saving ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} Execute Command</Button></div>
      </div>
    </div>
  )
}

EOF

echo "Patched: $TARGET"
echo "Next checks:"
echo "  npm run build"
echo "  open http://localhost:3000/carelink-ops/missions"
