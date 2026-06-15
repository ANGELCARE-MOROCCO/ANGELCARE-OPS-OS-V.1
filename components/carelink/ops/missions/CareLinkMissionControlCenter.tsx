'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  Flag,
  Gauge,
  Layers3,
  Loader2,
  MapPinned,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Printer,
  Trash2,
  Radio,
  RefreshCw,
  Route,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TimerReset,
  UserCheck,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { CareLinkCreateMissionDossierModal } from './CareLinkCreateMissionDossierModal'

import { resolvedMissionCode } from '@/lib/missions/mission-codes'
type MissionControlCenterProps = {
  activeView?: string
  initialRecords?: any[]
}



type AnyRecord = Record<string, any>

const WORKSPACES = [
  { key: 'board', label: 'Command Board', icon: Layers3 },
  { key: 'master', label: 'Master Registry', icon: FileText },
  { key: 'timeline', label: 'Timeline', icon: CalendarClock },
  { key: 'validation', label: 'Validation', icon: BadgeCheck },
  { key: 'risk', label: 'Risk Center', icon: ShieldAlert },
  { key: 'reports', label: 'Field Reports', icon: ClipboardCheck },
  { key: 'routes', label: 'Routes & Coverage', icon: Route },
  { key: 'audit', label: 'Audit Trail', icon: Activity },
] as const

const LANES = [
  { key: 'created', label: 'Created', tone: 'slate' },
  { key: 'assigned', label: 'Assigned', tone: 'blue' },
  { key: 'accepted', label: 'Accepted / Confirmed', tone: 'violet' },
  { key: 'en_route', label: 'En route', tone: 'cyan' },
  { key: 'in_progress', label: 'In progress', tone: 'emerald' },
  { key: 'report_pending', label: 'Report pending', tone: 'amber' },
  { key: 'validation', label: 'Validation', tone: 'purple' },
  { key: 'at_risk', label: 'At risk', tone: 'rose' },
  { key: 'completed', label: 'Completed', tone: 'green' },
]

const SERVICE_TYPES = ['All services', 'Childcare at Home', 'Baby Post-Partum Support', 'Special Child at Home', 'Special Child at School', 'Hybrid Support', 'Animation', 'Excursion', 'AngelCare Academy', 'Flashcards']


function __missionIsLiveVisible(row: any) {
  if (!row) return false
  const status = String(row.status || row.lifecycle_stage || row.lifecycleStage || row.dossier_status || row.dossierStatus || '').toLowerCase()
  if (row.is_archived === true || row.isArchived === true) return false
  if (status.includes('deleted') || status.includes('archived') || status.includes('cancelled')) return false
  return true
}

function __filterLiveVisibleMissions<T = any>(rows: T[] | null | undefined): T[] {
  return Array.isArray(rows) ? rows.filter((row: any) => __missionIsLiveVisible(row)) : []
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}


function missionIsVisibleLive(row: any) {
  if (!row) return false

  const status = String(
    row.status ??
    row.lifecycle_stage ??
    row.lifecycleStage ??
    row.dossier_status ??
    row.dossierStatus ??
    ''
  ).toLowerCase()

  if (row.is_archived === true || row.isArchived === true) return false
  if (status.includes('deleted')) return false
  if (status.includes('archived')) return false
  if (status.includes('cancelled')) return false

  return true
}

function filterVisibleLiveMissions<T = any>(rows: T[] | null | undefined): T[] {
  return Array.isArray(rows) ? rows.filter((row: any) => missionIsVisibleLive(row)) : []
}


function hardLiveMissionVisible(row: any) {
  if (!row) return false

  const status = String(
    row.status ??
    row.lifecycle_stage ??
    row.lifecycleStage ??
    row.dossier_status ??
    row.dossierStatus ??
    row.dispatchStatus ??
    row.dispatch_status ??
    ''
  ).toLowerCase()

  if (row.is_archived === true || row.isArchived === true) return false
  if (status.includes('deleted')) return false
  if (status.includes('archived')) return false
  if (status.includes('cancelled')) return false

  return true
}

function hardFilterLiveMissions<T = any>(rows: T[] | null | undefined): T[] {
  return Array.isArray(rows) ? rows.filter((row: any) => hardLiveMissionVisible(row)) : []
}


function finalMissionVisible(row: any) {
  if (!row) return false

  const status = String(
    row.status ??
    row.lifecycle_stage ??
    row.lifecycleStage ??
    row.dossier_status ??
    row.dossierStatus ??
    row.dispatchStatus ??
    row.dispatch_status ??
    ''
  ).toLowerCase()

  if (row.is_archived === true || row.isArchived === true) return false
  if (status.includes('deleted')) return false
  if (status.includes('archived')) return false
  if (status.includes('cancelled')) return false

  return true
}

function finalFilterMissions<T = any>(rows: T[] | null | undefined): T[] {
  return Array.isArray(rows) ? rows.filter((row: any) => finalMissionVisible(row)) : []
}

function text(value: unknown, fallback = '—') {
  return value === null || value === undefined || value === '' ? fallback : String(value)
}

function list(value: unknown): AnyRecord[] {
  return Array.isArray(value) ? value as AnyRecord[] : []
}

function num(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function dateText(value: unknown) {
  if (!value) return 'No date'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('fr-MA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function money(value: unknown) {
  return `${num(value).toLocaleString('fr-MA')} DH`
}


function missionNumericId(record: AnyRecord | null | undefined) {
  const raw = record?.id ?? record?.missionId ?? record?.mission_id ?? record?.parent_mission_id
  const parsed = Number(raw)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

function missionId(record: AnyRecord) {
  return text(record.id || record.mission_id || record.uuid || record.code || record.dossier_reference, '')
}

function missionCode(record: AnyRecord) {
  return text(record.code || record.reference || record.dossier_reference || record.mission_reference || `MISSION-${missionId(record) || 'LIVE'}`)
}

function missionTitle(record: AnyRecord) {
  return text(record.title || record.serviceType || record.service_type || record.service || record.designation || record.label || 'Mission dossier')
}

function missionClient(record: AnyRecord) {
  return text(record.familyName || record.family_name || record.clientName || record.client_name || record.client_label || record.family?.full_name || record.family?.name || 'Client / family')
}

function missionAgent(record: AnyRecord) {
  return text(record.agentName || record.agent_name || record.caregiverName || record.caregiver_name || record.caregiver?.full_name || record.caregiver?.name || 'Unassigned')
}

function missionCity(record: AnyRecord) {
  return text(record.city || record.location_city || record.family?.city || 'City')
}

function missionZone(record: AnyRecord) {
  return text(record.zone || record.location_zone || record.family?.zone || 'Zone')
}

function missionStatus(record: AnyRecord) {
  const raw = text(record.status || record.lifecycleStage || record.lifecycle_stage || record.dispatch_status || record.report_status || 'created').toLowerCase()
  if (raw.includes('deleted') || raw.includes('archived') || raw.includes('cancelled')) return 'deleted'
  if (raw.includes('progress')) return 'in_progress'
  if (raw.includes('route')) return 'en_route'
  if (raw.includes('accepted') || raw.includes('confirm')) return 'accepted'
  if (raw.includes('assign')) return 'assigned'
  if (raw.includes('report')) return 'report_pending'
  if (raw.includes('valid')) return 'validation'
  if (raw.includes('risk') || raw.includes('incident') || raw.includes('blocked')) return 'at_risk'
  if (raw.includes('complete') || raw.includes('closed')) return 'completed'
  return raw
}

function riskLevel(record: AnyRecord) {
  const raw = text(record.riskLevel || record.risk_level || record.priority || record.urgency || 'normal').toLowerCase()
  if (['high', 'urgent', 'critical', 'at_risk'].some((item) => raw.includes(item))) return 'high'
  if (raw.includes('medium') || raw.includes('warning')) return 'medium'
  return 'normal'
}

function laneFor(record: AnyRecord) {
  const status = missionStatus(record)
  if (LANES.some((lane) => lane.key === status)) return status
  return 'created'
}

function toneClass(tone: string) {
  const tones: Record<string, string> = {
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    violet: 'border-violet-200 bg-violet-50 text-violet-700',
    cyan: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    purple: 'border-purple-200 bg-purple-50 text-purple-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
    green: 'border-green-200 bg-green-50 text-green-700',
  }
  return tones[tone] || tones.slate
}

function PrimaryButton({ children, onClick, disabled }: { children: ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 active:scale-[0.99] disabled:opacity-60"
    >
      {children}
    </button>
  )
}

function GhostButton({ children, onClick, disabled, className }: { children: ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.99] disabled:opacity-60',
        className,
      )}
    >
      {children}
    </button>
  )
}

function MetricCard({ label, value, helper, icon, tone = 'blue' }: { label: string; value: string | number; helper: string; icon: ReactNode; tone?: string }) {
  return (
    <article className={cx('rounded-[1.8rem] border p-5 shadow-sm', toneClass(tone))}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] opacity-70">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-tight">{value}</p>
          <p className="mt-2 text-xs font-bold opacity-75">{helper}</p>
        </div>
        <div className="rounded-2xl bg-white/70 p-3 shadow-sm">{icon}</div>
      </div>
    </article>
  )
}

function Panel({ title, subtitle, children, action }: { title: string; subtitle?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-950">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
      <p className="font-black text-slate-800">{title}</p>
      <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">{body}</p>
    </div>
  )
}

export function CareLinkMissionControlCenter({ activeView, initialRecords }: MissionControlCenterProps = {}) {
  void activeView
  void initialRecords
  const [records, setRecords] = useState<AnyRecord[]>([])
  const [payload, setPayload] = useState<AnyRecord>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [serviceFilter, setServiceFilter] = useState('All services')
  const [riskFilter, setRiskFilter] = useState('all')
  const [workspace, setWorkspace] = useState<(typeof WORKSPACES)[number]['key']>('board')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkDeleteSaving, setBulkDeleteSaving] = useState(false)
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState(0)
  const [bulkDeleteStage, setBulkDeleteStage] = useState<'idle' | 'running' | 'completed' | 'error'>('idle')
  const [bulkDeleteMessage, setBulkDeleteMessage] = useState('')
  const [selectedMission, setSelectedMission] = useState<AnyRecord | null>(null)
  const [selectedMissionLoading, setSelectedMissionLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState<string | null>(null)
  const [commandMessage, setCommandMessage] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  async function loadMissions() {
    setLoading(true)
    setError(null)
    try {
      const endpoints = ['/api/missions/dossiers', '/api/carelink/ops/missions', '/api/missions', '/api/carelink/ops/dashboard']
      let found: AnyRecord | null = null

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, { cache: 'no-store' })
          const json = await response.json().catch(() => null)
          if (response.ok && json) {
            found = json
            break
          }
        } catch {
          // try next endpoint
        }
      }

      if (!found) throw new Error('No mission endpoint responded.')

      const raw =
        list(found.missions).length ? list(found.missions) :
        list(found.dossiers).length ? list(found.dossiers) :
        list(found.records).length ? list(found.records) :
        list(found.data?.missions).length ? list(found.data?.missions) :
        list(found.data?.dossiers).length ? list(found.data?.dossiers) :
        list(found.data?.records).length ? list(found.data?.records) :
        Array.isArray(found.data) ? found.data :
        list(found.dashboard?.missions).length ? list(found.dashboard?.missions) :
        list(found.workspace?.missions).length ? list(found.workspace?.missions) :
        list(found.payload?.missions).length ? list(found.payload?.missions) :
        list(found.upcomingMissions).length ? list(found.upcomingMissions) :
        []

      setPayload(found)
      setRecords(raw)
      setSelectedIds([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load mission workspace.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMissions()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return records.filter((record) => {
      const searchable = [
        missionCode(record),
        missionTitle(record),
        missionClient(record),
        missionAgent(record),
        missionCity(record),
        missionZone(record),
        record.status,
        record.priority,
        record.risk_level,
      ].join(' ').toLowerCase()

      const matchesQuery = !q || searchable.includes(q)
      const matchesService = serviceFilter === 'All services' || missionTitle(record).toLowerCase().includes(serviceFilter.toLowerCase())
      const matchesRisk = riskFilter === 'all' || riskLevel(record) === riskFilter || laneFor(record) === riskFilter
      return matchesQuery && matchesService && matchesRisk
    })
  }, [records, query, serviceFilter, riskFilter])

  const today = filtered.filter((record) => {
    const raw = record.scheduledStart || record.scheduled_start || record.start_at || record.missionDate || record.mission_date
    if (!raw) return false
    return String(raw).slice(0, 10) === new Date().toISOString().slice(0, 10)
  })

  const summary = {
    total: filtered.length,
    today: today.length,
    assigned: filtered.filter((record) => ['assigned', 'accepted', 'en_route', 'in_progress'].includes(laneFor(record))).length,
    active: filtered.filter((record) => ['en_route', 'in_progress'].includes(laneFor(record))).length,
    validation: filtered.filter((record) => ['report_pending', 'validation'].includes(laneFor(record))).length,
    atRisk: filtered.filter((record) => laneFor(record) === 'at_risk' || riskLevel(record) === 'high').length,
    completed: filtered.filter((record) => laneFor(record) === 'completed').length,
    unassigned: filtered.filter((record) => missionAgent(record) === 'Unassigned').length,
  }

  function toggleSelect(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  async function openMissionDossier(record: AnyRecord) {
    setSelectedMission(record)
    const id = missionNumericId(record)
    if (!id) return

    setSelectedMissionLoading(true)
    try {
      const response = await fetch(`/api/missions/dossiers/${id}`, { cache: 'no-store', headers: { Accept: 'application/json' } })
      const json = await response.json().catch(() => null)
      if (response.ok && json?.ok && json.data) setSelectedMission(json.data)
    } catch (error) {
      console.warn('[CareLinkMissions] Unable to load full mission dossier, using row fallback', error)
    } finally {
      setSelectedMissionLoading(false)
    }
  }

  function exportCsv() {
    const rows = filtered.map((record) => ({
      code: missionCode(record),
      service: missionTitle(record),
      client: missionClient(record),
      agent: missionAgent(record),
      city: missionCity(record),
      zone: missionZone(record),
      status: laneFor(record),
      risk: riskLevel(record),
      date: text(record.scheduledStart || record.scheduled_start || record.missionDate || record.mission_date),
    }))

    const header = Object.keys(rows[0] || { code: '', service: '', client: '', agent: '', city: '', zone: '', status: '', risk: '', date: '' })
    const csv = [header.join(','), ...rows.map((row) => header.map((key) => `"${String((row as AnyRecord)[key] || '').replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `carelink-missions-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  async function submitCommand() {
    const action = commandOpen
    const message = commandMessage.trim()
    setToast(null)

    try {
      await fetch('/api/carelink/ops/missions/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          action,
          missionIds: selectedIds,
          message,
          source: 'carelink_ops_mission_control',
        }),
      }).catch(() => null)
    } finally {
      setToast(`${action || 'Action'} prepared for ${selectedIds.length || filtered.length} mission(s).`)
      setCommandOpen(null)
      setCommandMessage('')
      await loadMissions()
    }
  }

  async function deleteSelectedMissions() {
    const ids = selectedIds
      .map((id: any) => Number(id))
      .filter((id: number) => Number.isFinite(id) && id > 0)

    if (!ids.length) {
      setBulkDeleteStage('error')
      setBulkDeleteMessage('Select at least one mission to delete.')
      return
    }

    setBulkDeleteOpen(false)
    setBulkDeleteSaving(true)
    setBulkDeleteStage('running')
    setBulkDeleteProgress(0)
    setBulkDeleteMessage(`Preparing permanent deletion for ${ids.length} selected mission(s)…`)

    let timer: ReturnType<typeof setInterval> | null = null

    try {
      timer = setInterval(() => {
        setBulkDeleteProgress((value) => {
          if (value >= 92) return value
          return Math.min(92, value + Math.max(3, Math.round((92 - value) / 6)))
        })
      }, 220)

      const res = await fetch('/api/missions/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ids, mode: 'permanent' }),
      })

      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Permanent mission deletion failed.')

      if (timer) clearInterval(timer)

      setBulkDeleteProgress(100)
      setBulkDeleteStage('completed')
      setBulkDeleteMessage(`Deletion completed · ${json?.data?.deletedCount || ids.length} mission record(s) removed from live CareLink.`)
      setSelectedIds([])

      window.setTimeout(() => {
        window.location.reload()
      }, 1600)
    } catch (error) {
      if (timer) clearInterval(timer)
      setBulkDeleteStage('error')
      setBulkDeleteMessage(error instanceof Error ? error.message : 'Permanent mission deletion failed.')
    } finally {
      setBulkDeleteSaving(false)
    }
  }


  const missionPageKpiRows = hardFilterLiveMissions(
    filterVisibleLiveMissions(Array.isArray(initialRecords) ? initialRecords : [])
  )

  const missionPageKpis = {
    total: missionPageKpiRows.length,
    today: missionPageKpiRows.filter((mission: any) => {
      const raw = String(mission.dateLabel || mission.mission_date || mission.missionDate || '')
      const today = new Date().toISOString().slice(0, 10)
      return raw.includes(today)
    }).length,
    assigned: missionPageKpiRows.filter((mission: any) =>
      mission.caregiverId ||
      mission.caregiver_id ||
      mission.caregiverName ||
      mission.assignedAgent
    ).length,
    active: missionPageKpiRows.filter((mission: any) => {
      const status = String(mission.status || mission.lifecycleStage || mission.lifecycle_stage || '').toLowerCase()
      return status.includes('route') || status.includes('progress') || status.includes('active')
    }).length,
    validation: missionPageKpiRows.filter((mission: any) => {
      const status = String(mission.validationStatus || mission.validation_status || mission.reportStatus || mission.report_status || mission.lifecycleStage || mission.lifecycle_stage || '').toLowerCase()
      return status.includes('pending') || status.includes('validation') || status.includes('report')
    }).length,
    risk: missionPageKpiRows.filter((mission: any) => {
      const status = String(mission.status || mission.lifecycleStage || mission.lifecycle_stage || mission.riskLevel || mission.risk_level || '').toLowerCase()
      return status.includes('risk') || status.includes('incident') || status.includes('high')
    }).length,
    completed: missionPageKpiRows.filter((mission: any) => {
      const status = String(mission.status || mission.lifecycleStage || mission.lifecycle_stage || '').toLowerCase()
      return status.includes('completed') || status.includes('closed')
    }).length,
  }


  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <div className="space-y-6 p-6">
        <section className="overflow-hidden rounded-[2.2rem] border border-slate-200 bg-white shadow-sm">
          <div className="relative p-6">
            <div className="absolute right-0 top-0 h-40 w-72 rounded-bl-[4rem] bg-blue-50" />
            <div className="relative flex flex-wrap items-start justify-between gap-5">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.35em] text-blue-600">Mission Operations</p>
                <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Mission Control Center</h1>
                <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-500">
                  Enterprise mission orchestration, dossier supervision, sub-mission lifecycle monitoring, route coordination,
                  agent assignment, risk control, field report validation and audit oversight.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <GhostButton onClick={loadMissions} disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                  Refresh
                </GhostButton>
                <PrimaryButton onClick={() => setCreateOpen(true)}>
                  <Plus size={16} />
                  Create Dossier
                </PrimaryButton>
              </div>
            </div>

            <div className="relative mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
              <MetricCard label="Missions" value={missionPageKpis.total} helper="Total loaded" icon={<Layers3 size={19} />} tone="blue" />
              <MetricCard label="Today" value={missionPageKpis.today} helper="Scheduled today" icon={<Clock3 size={19} />} tone="cyan" />
              <MetricCard label="Assigned" value={missionPageKpis.assigned} helper="Agent linked" icon={<UserCheck size={19} />} tone="violet" />
              <MetricCard label="Active" value={missionPageKpis.active} helper="En route / in progress" icon={<Radio size={19} />} tone="emerald" />
              <MetricCard label="Validation" value={missionPageKpis.validation} helper="Reports pending" icon={<FileCheck2 size={19} />} tone="amber" />
              <MetricCard label="At risk" value={summary.atRisk} helper="Needs intervention" icon={<AlertTriangle size={19} />} tone="rose" />
              <MetricCard label="Completed" value={missionPageKpis.completed} helper="Closed missions" icon={<CheckCircle2 size={19} />} tone="green" />
              <MetricCard label="Unassigned" value={summary.unassigned} helper="Dispatch queue" icon={<Users size={19} />} tone="slate" />
            </div>
          </div>

          <div className="border-t border-slate-100 px-6 py-4">
            <div className="flex flex-wrap gap-2">
              {WORKSPACES.map((item) => {
                const Icon = item.icon
                const active = workspace === item.key
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setWorkspace(item.key)}
                    className={cx(
                      'inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition',
                      active ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                    )}
                  >
                    <Icon size={15} />
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-3xl border border-rose-100 bg-rose-50 p-4 text-sm font-black text-rose-700">
            {error}
          </div>
        ) : null}

        {toast ? (
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-black text-emerald-700">
            {toast}
          </div>
        ) : null}

        <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[320px] flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search missions, dossiers, caregivers, clients, cities, service types..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-bold outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>
            <select value={serviceFilter} onChange={(event) => setServiceFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
              {SERVICE_TYPES.map((service) => <option key={service}>{service}</option>)}
            </select>
            <select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
              <option value="all">All risks/status</option>
              <option value="high">High risk</option>
              <option value="medium">Medium risk</option>
              <option value="normal">Normal risk</option>
              <option value="report_pending">Report pending</option>
              <option value="validation">Validation</option>
            </select>
            <GhostButton onClick={() => setCommandOpen('batch_assign')} disabled={!selectedIds.length}><Users size={16} /> Batch Assign</GhostButton>
            <GhostButton
              onClick={() => setBulkDeleteOpen(true)}
              disabled={!selectedIds.length || bulkDeleteSaving}
              className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
            >
              <Trash2 size={16} /> Delete selected {selectedIds.length ? `(${selectedIds.length})` : ''}
            </GhostButton>

            {bulkDeleteOpen ? (
              <div className="fixed inset-0 z-[1300] grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm">
                <div className="w-full max-w-lg rounded-[2rem] border border-white/70 bg-white p-6 shadow-2xl">
                  <div className="text-xs font-black uppercase tracking-[0.25em] text-rose-600">Permanent deletion</div>
                  <h3 className="mt-2 text-2xl font-black text-slate-950">Permanent delete selected missions</h3>
                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
                    This will permanently remove selected missions and linked live production records.
                  </p>
                  <div className="mt-5 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-700">
                    Selected missions: {selectedIds.length}. This action cannot be undone from the UI.
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={() => setBulkDeleteOpen(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600">Cancel</button>
                    <button type="button" disabled={bulkDeleteSaving} onClick={deleteSelectedMissions} className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-rose-100 disabled:opacity-60">Delete permanently</button>
                  </div>
                </div>
              </div>
            ) : null}

            {(bulkDeleteSaving || bulkDeleteStage === 'completed' || bulkDeleteStage === 'error') ? (
              <div className="fixed inset-0 z-[1350] grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm">
                <div className="w-full max-w-lg rounded-[2rem] border border-white/70 bg-white p-6 shadow-2xl">
                  <div className="text-xs font-black uppercase tracking-[0.25em] text-rose-600">Live production deletion</div>
                  <h3 className="mt-2 text-2xl font-black text-slate-950">
                    {bulkDeleteStage === 'completed' ? 'Deletion completed' : bulkDeleteStage === 'error' ? 'Deletion failed' : 'Deleting selected missions'}
                  </h3>
                  <p className="mt-2 text-sm font-semibold text-slate-500">{bulkDeleteMessage || 'Removing selected missions from live CareLink data…'}</p>
                  <div className="mt-6">
                    <div className="mb-2 flex items-center justify-between text-xs font-black text-slate-500">
                      <span>{bulkDeleteStage === 'completed' ? 'Completed' : bulkDeleteStage === 'error' ? 'Needs attention' : 'Syncing deletion'}</span>
                      <span>{bulkDeleteProgress}%</span>
                    </div>
                    <div className="h-4 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${bulkDeleteStage === 'error' ? 'bg-rose-500' : bulkDeleteStage === 'completed' ? 'bg-emerald-500' : 'bg-rose-600'}`}
                        style={{ width: `${bulkDeleteProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <GhostButton onClick={() => setCommandOpen('validate')} disabled={!selectedIds.length}><BadgeCheck size={16} /> Validate</GhostButton>
            <GhostButton onClick={exportCsv}><Download size={16} /> Export</GhostButton>
            <GhostButton onClick={() => window.print()}><Printer size={16} /> Print</GhostButton>
          </div>
        </section>

        {workspace === 'board' ? (
          <BoardView
            missions={filtered}
            selectedIds={selectedIds}
            toggleSelect={toggleSelect}
            openMission={openMissionDossier}
          />
        ) : null}

        {workspace === 'master' ? (
          <MasterRegistryView
            missions={filtered}
            selectedIds={selectedIds}
            toggleSelect={toggleSelect}
            openMission={openMissionDossier}
          />
        ) : null}

        {workspace === 'timeline' ? <TimelineView missions={filtered} /> : null}
        {workspace === 'validation' ? <ValidationView missions={filtered} openMission={openMissionDossier} /> : null}
        {workspace === 'risk' ? <RiskView missions={filtered} openCommand={setCommandOpen} /> : null}
        {workspace === 'reports' ? <ReportsView missions={filtered} /> : null}
        {workspace === 'routes' ? <RoutesView missions={filtered} payload={payload} /> : null}
        {workspace === 'audit' ? <AuditView missions={filtered} payload={payload} /> : null}

        <section className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
          <Panel title="Operational Command Center" subtitle="Mission-level production controls and action preparation.">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <CommandTile icon={<Zap />} title="Optimize Routes" body="Prepare route optimization for selected missions." onClick={() => setCommandOpen('optimize_routes')} />
              <CommandTile icon={<MessageSquare />} title="Broadcast Dispatch" body="Send operational instruction to linked agents." onClick={() => setCommandOpen('broadcast')} />
              <CommandTile icon={<Flag />} title="Escalate Risk" body="Open escalation workflow for mission risk." onClick={() => setCommandOpen('escalate')} />
              <CommandTile icon={<TimerReset />} title="SLA Review" body="Review timing, delays and validation blockers." onClick={() => setCommandOpen('sla_review')} />
            </div>
          </Panel>

          <Panel title="Live Integrity Signals" subtitle="Production readiness, empty-state visibility and operating health.">
            <div className="grid gap-3 md:grid-cols-2">
              <Signal label="Mission source" value={records.length ? 'Live missions loaded' : 'Waiting for live missions'} tone={records.length ? 'emerald' : 'amber'} />
              <Signal label="Selected records" value={`${selectedIds.length} selected`} tone="blue" />
              <Signal label="Create dossier" value="Existing modal connected" tone="emerald" />
              <Signal label="Mobile cooperation" value="Caregiver assignment drives mobile visibility" tone="violet" />
            </div>
          </Panel>
        </section>
      </div>

      {createOpen ? (
        <CareLinkCreateMissionDossierModal
          close={() => {
            setCreateOpen(false)
            setTimeout(() => loadMissions(), 350)
          }}
          refresh={async () => {
            await loadMissions()
            setTimeout(() => loadMissions(), 700)
          }}
        />
      ) : null}

      {selectedMission ? (
        <>
          {selectedMissionLoading ? (
            <div className="fixed right-6 top-6 z-[10001] rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-black text-blue-700 shadow-xl">Loading full dossier…</div>
          ) : null}
          <CareLinkCreateMissionDossierModal
            mode="edit"
            initialMission={selectedMission}
            close={() => setSelectedMission(null)}
            refresh={async () => {
              await loadMissions()
            }}
          />
        </>
      ) : null}

      {commandOpen ? (
        <CommandModal
          action={commandOpen}
          selectedCount={selectedIds.length}
          message={commandMessage}
          setMessage={setCommandMessage}
          close={() => setCommandOpen(null)}
          submit={submitCommand}
        />
      ) : null}
    </main>
  )
}

function BoardView({ missions, selectedIds, toggleSelect, openMission }: { missions: AnyRecord[]; selectedIds: string[]; toggleSelect: (id: string) => void; openMission: (mission: AnyRecord) => void }) {
  const liveBoardMissions = hardFilterLiveMissions(filterVisibleLiveMissions(missions))
  const lanes = LANES.map((lane) => ({
    ...lane,
    missions: liveBoardMissions.filter((mission) => laneFor(mission) === lane.key),
  }))

  return (
    <Panel title="Mission Dispatch Workflow" subtitle="Live operational lanes by lifecycle, assignment, route, report and validation state.">
      <div className="overflow-x-auto pb-3">
        <div className="grid min-w-[1600px] grid-cols-9 gap-3">
          {lanes.map((lane) => (
            <div key={lane.key} className={cx('rounded-[1.5rem] border p-3', toneClass(lane.tone))}>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-black">{lane.label}</p>
                <span className="rounded-full bg-white/70 px-2 py-1 text-xs font-black">{filterVisibleLiveMissions(lane.missions).length}</span>
              </div>
              <div className="space-y-2">
                {lane.missions.slice(0, 8).map((mission) => {
                  const id = missionId(mission)
                  return (
                    <MissionMiniCard
                      key={id || missionCode(mission)}
                      mission={mission}
                      checked={selectedIds.includes(id)}
                      toggle={() => toggleSelect(id)}
                      open={() => openMission(mission)}
                    />
                  )
                })}
                {!filterVisibleLiveMissions(lane.missions).length ? (
                  <div className="rounded-2xl border border-dashed border-white/80 bg-white/60 p-4 text-center text-xs font-black">
                    No live missions
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  )
}

function MissionMiniCard({ mission, checked, toggle, open }: { mission: AnyRecord; checked: boolean; toggle: () => void; open: () => void }) {
  return (
    <article className="rounded-2xl border border-white/70 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-2">
        <input type="checkbox" checked={checked} onChange={toggle} className="mt-1 h-4 w-4 rounded border-slate-300" />
        <button type="button" onClick={open} className="min-w-0 flex-1 text-left">
          <p className="truncate text-xs font-black text-slate-950">{missionCode(mission)}</p>
          <p className="mt-1 line-clamp-2 text-xs font-semibold text-slate-600">{missionTitle(mission)}</p>
          <p className="mt-2 truncate text-[11px] font-bold text-slate-400">{missionClient(mission)} · {missionAgent(mission)}</p>
        </button>
      </div>
    </article>
  )
}

function MasterRegistryView({ missions, selectedIds, toggleSelect, openMission }: { missions: AnyRecord[]; selectedIds: string[]; toggleSelect: (id: string) => void; openMission: (mission: AnyRecord) => void }) {
  return (
    <Panel title="Master Mission Registry" subtitle="Searchable production table for dossiers, sub-missions, assignment, risk, route and validation states.">
      {filterVisibleLiveMissions(missions).length ? (
        <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
          <table className="w-full min-w-[1200px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-[0.24em] text-slate-500">
              <tr>
                <th className="px-4 py-4">✓</th>
                <th className="px-4 py-4">Mission</th>
                <th className="px-4 py-4">Client</th>
                <th className="px-4 py-4">Agent</th>
                <th className="px-4 py-4">Location</th>
                <th className="px-4 py-4">Date</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Risk</th>
                <th className="px-4 py-4">Open</th>
              </tr>
            </thead>
            <tbody>
              {hardFilterLiveMissions(missions).map((mission) => {
                const id = missionId(mission)
                return (
                  <tr key={id || missionCode(mission)} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <input type="checkbox" checked={selectedIds.includes(id)} onChange={() => toggleSelect(id)} />
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-black text-slate-950">{missionCode(mission)}</p>
                      <p className="text-xs font-semibold text-slate-500">{missionTitle(mission)}</p>
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-700">{missionClient(mission)}</td>
                    <td className="px-4 py-4 font-bold text-slate-700">{missionAgent(mission)}</td>
                    <td className="px-4 py-4 text-xs font-bold text-slate-500">{missionCity(mission)} · {missionZone(mission)}</td>
                    <td className="px-4 py-4 text-xs font-bold text-slate-500">{dateText(mission.scheduledStart || mission.scheduled_start || mission.missionDate || mission.mission_date)}</td>
                    <td className="px-4 py-4"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{laneFor(mission)}</span></td>
                    <td className="px-4 py-4"><span className={cx('rounded-full px-3 py-1 text-xs font-black', riskLevel(mission) === 'high' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700')}>{riskLevel(mission)}</span></td>
                    <td className="px-4 py-4">
                      <button onClick={() => openMission(mission)} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Open</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No missions loaded" body="Created dossiers and distributed sub-missions will appear here from the live mission engine." />
      )}
    </Panel>
  )
}

function TimelineView({ missions }: { missions: AnyRecord[] }) {
  const sorted = [...missions].sort((a, b) => String(a.scheduledStart || a.scheduled_start || '').localeCompare(String(b.scheduledStart || b.scheduled_start || '')))
  return (
    <Panel title="Mission Timeline" subtitle="Operational sequence by date, route, service and execution lifecycle.">
      <div className="grid gap-3">
        {sorted.slice(0, 80).map((mission, index) => (
          <article key={`${missionId(mission)}-${index}`} className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[160px_1fr_180px]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Schedule</p>
              <p className="mt-2 font-black text-slate-950">{dateText(mission.scheduledStart || mission.scheduled_start || mission.missionDate || mission.mission_date)}</p>
            </div>
            <div>
              <p className="font-black text-slate-950">{missionCode(mission)} · {missionTitle(mission)}</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">{missionClient(mission)} · {missionCity(mission)} / {missionZone(mission)}</p>
            </div>
            <div className="text-right">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{laneFor(mission)}</span>
            </div>
          </article>
        ))}
        {!sorted.length ? <EmptyState title="Timeline empty" body="Mission dates and sub-mission occurrences will populate the operational timeline." /> : null}
      </div>
    </Panel>
  )
}

function ValidationView({ missions, openMission }: { missions: AnyRecord[]; openMission: (mission: AnyRecord) => void }) {
  const queue = missions.filter((mission) => ['report_pending', 'validation', 'completed'].includes(laneFor(mission)))
  return (
    <Panel title="Validation Queue" subtitle="Reports, corrections, completion controls, finance handoff and audit readiness.">
      <div className="grid gap-3">
        {queue.map((mission) => (
          <article key={missionId(mission) || missionCode(mission)} className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-4">
            <div>
              <p className="font-black text-slate-950">{missionCode(mission)}</p>
              <p className="text-sm font-semibold text-slate-500">{missionTitle(mission)} · {missionClient(mission)}</p>
            </div>
            <div className="flex gap-2">
              <GhostButton onClick={() => openMission(mission)}><Eye size={16} /> Review</GhostButton>
            </div>
          </article>
        ))}
        {!queue.length ? <EmptyState title="No validation pending" body="Field reports and closure validations will appear here when missions are completed." /> : null}
      </div>
    </Panel>
  )
}

function RiskView({ missions, openCommand }: { missions: AnyRecord[]; openCommand: (action: string) => void }) {
  const risk = missions.filter((mission) => riskLevel(mission) !== 'normal' || laneFor(mission) === 'at_risk')
  return (
    <Panel title="Risk Monitoring Center" subtitle="Critical blockers, unassigned missions, incidents, no-show, backup gaps and SLA exposure." action={<GhostButton onClick={() => openCommand('risk_escalation')}><ShieldAlert size={16} /> Escalate</GhostButton>}>
      <div className="grid gap-4 md:grid-cols-3">
        <Signal label="High risk" value={String(risk.filter((mission) => riskLevel(mission) === 'high').length)} tone="rose" />
        <Signal label="Unassigned" value={String(missions.filter((mission) => missionAgent(mission) === 'Unassigned').length)} tone="amber" />
        <Signal label="SLA exposed" value={String(missions.filter((mission) => ['en_route', 'report_pending', 'validation'].includes(laneFor(mission))).length)} tone="blue" />
      </div>
      <div className="mt-5 grid gap-3">
        {risk.slice(0, 30).map((mission) => (
          <article key={missionId(mission) || missionCode(mission)} className="rounded-[1.5rem] border border-rose-100 bg-rose-50 p-4">
            <p className="font-black text-rose-900">{missionCode(mission)} · {missionTitle(mission)}</p>
            <p className="mt-1 text-sm font-semibold text-rose-700">{missionClient(mission)} · {missionAgent(mission)} · {riskLevel(mission)}</p>
          </article>
        ))}
        {!risk.length ? <EmptyState title="No critical risk loaded" body="Risk signals will populate from incidents, backup gaps, readiness blockers and SLA rules." /> : null}
      </div>
    </Panel>
  )
}

function ReportsView({ missions }: { missions: AnyRecord[] }) {
  const reports = missions.filter((mission) => ['report_pending', 'validation', 'completed'].includes(laneFor(mission)))
  return (
    <Panel title="Field Reports Workspace" subtitle="Mission reporting, correction requests, quality control and operational closure.">
      <div className="grid gap-4 md:grid-cols-4">
        <Signal label="Reports pending" value={String(reports.filter((mission) => laneFor(mission) === 'report_pending').length)} tone="amber" />
        <Signal label="Validation" value={String(reports.filter((mission) => laneFor(mission) === 'validation').length)} tone="violet" />
        <Signal label="Closed" value={String(reports.filter((mission) => laneFor(mission) === 'completed').length)} tone="emerald" />
        <Signal label="Quality index" value="Live" tone="blue" />
      </div>
    </Panel>
  )
}

function RoutesView({ missions, payload }: { missions: AnyRecord[]; payload: AnyRecord }) {
  return (
    <Panel title="Routes, Coverage & Dispatch Geography" subtitle="City, zone, travel, transport and route-aware operating visibility.">
      <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
        <div className="grid gap-3">
          <Signal label="Cities covered" value={String(new Set(hardFilterLiveMissions(missions).map(missionCity)).size)} tone="blue" />
          <Signal label="Zones covered" value={String(new Set(hardFilterLiveMissions(missions).map(missionZone)).size)} tone="emerald" />
          <Signal label="Transport lines" value={String(list(payload.transport || payload.routes).length)} tone="amber" />
        </div>
        <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <MapPinned className="mx-auto text-blue-600" size={34} />
          <p className="mt-3 font-black text-slate-900">Route map layer ready</p>
          <p className="mt-2 text-sm font-semibold text-slate-500">Live mission locations and route records can be connected here without changing the mission creation modal.</p>
        </div>
      </div>
    </Panel>
  )
}

function AuditView({ missions, payload }: { missions: AnyRecord[]; payload: AnyRecord }) {
  const events = list(payload.events || payload.audit || payload.auditEvents)
  return (
    <Panel title="Audit Trail & Operational Trace" subtitle="Mission events, dispatch actions, report transitions and command activity.">
      <div className="grid gap-3">
        {(events.length ? events : missions.slice(0, 30)).map((item, index) => (
          <article key={item.id || index} className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="font-black text-slate-950">{item.action || item.event_type || item.status || missionCode(item)}</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">{item.content || item.description || item.created_at || missionTitle(item)}</p>
          </article>
        ))}
        {!events.length && !filterVisibleLiveMissions(missions).length ? <EmptyState title="No audit records loaded" body="Mission events and command actions will appear here as operations are executed." /> : null}
      </div>
    </Panel>
  )
}

function CommandTile({ icon, title, body, onClick }: { icon: ReactNode; title: string; body: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50">
      <div className="mb-4 inline-flex rounded-2xl bg-white p-3 text-blue-600 shadow-sm">{icon}</div>
      <p className="font-black text-slate-950">{title}</p>
      <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{body}</p>
    </button>
  )
}

function Signal({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={cx('rounded-[1.5rem] border p-4', toneClass(tone))}>
      <p className="text-[10px] font-black uppercase tracking-[0.24em] opacity-70">{label}</p>
      <p className="mt-2 text-xl font-black">{value}</p>
    </div>
  )
}

function MissionDrawer({ mission, close, openCommand }: { mission: AnyRecord; close: () => void; openCommand: (action: string) => void }) {
  return (
    <div className="fixed inset-0 z-[10000] bg-slate-950/45 p-5 backdrop-blur-sm">
      <div className="ml-auto flex h-full max-w-5xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-100 p-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-blue-600">Mission Dossier</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">{missionCode(mission)}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">{missionTitle(mission)} · {missionClient(mission)}</p>
          </div>
          <button onClick={close} className="rounded-2xl bg-slate-100 p-3 text-slate-600"><X size={18} /></button>
        </header>

        <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-6">
          <div className="grid gap-5 md:grid-cols-3">
            <Signal label="Status" value={laneFor(mission)} tone="blue" />
            <Signal label="Risk" value={riskLevel(mission)} tone={riskLevel(mission) === 'high' ? 'rose' : 'emerald'} />
            <Signal label="Agent" value={missionAgent(mission)} tone="violet" />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Panel title="Client & service">
              <div className="grid gap-3">
                <Info label="Client" value={missionClient(mission)} />
                <Info label="Service" value={missionTitle(mission)} />
                <Info label="Location" value={`${missionCity(mission)} · ${missionZone(mission)}`} />
                <Info label="Schedule" value={dateText(mission.scheduledStart || mission.scheduled_start || mission.missionDate || mission.mission_date)} />
              </div>
            </Panel>
            <Panel title="Operations actions">
              <div className="grid gap-3">
                <GhostButton onClick={() => openCommand('mission_note')}><MessageSquare size={16} /> Add command note</GhostButton>
                <GhostButton onClick={() => openCommand('mission_escalation')}><AlertTriangle size={16} /> Escalate mission</GhostButton>
                <GhostButton onClick={() => openCommand('mission_validation')}><BadgeCheck size={16} /> Prepare validation</GhostButton>
              </div>
            </Panel>
          </div>

          <div className="mt-5">
            <Panel title="Raw live mission payload" subtitle="Temporary technical trace until the dedicated dossier reader is connected.">
              <pre className="max-h-[360px] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs font-semibold text-slate-100">
                {JSON.stringify(mission, null, 2)}
              </pre>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-black text-slate-900">{value}</p>
    </div>
  )
}

function CommandModal({ action, selectedCount, message, setMessage, close, submit }: { action: string; selectedCount: number; message: string; setMessage: (value: string) => void; close: () => void; submit: () => void }) {
  return (
    <div className="fixed inset-0 z-[10001] grid place-items-center bg-slate-950/45 p-5 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 pb-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-blue-600">Mission Command Action</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">{action.replace(/_/g, ' ')}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">{selectedCount} selected mission(s)</p>
          </div>
          <button onClick={close} className="rounded-2xl bg-slate-100 p-3"><X size={18} /></button>
        </div>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={6}
          placeholder="Add operational note, instruction, validation comment, escalation reason..."
          className="mt-5 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
        />
        <div className="mt-5 flex justify-end gap-3">
          <GhostButton onClick={close}>Cancel</GhostButton>
          <PrimaryButton onClick={submit}><Send size={16} /> Execute</PrimaryButton>
        </div>
      </div>
    </div>
  )
}

export default CareLinkMissionControlCenter
