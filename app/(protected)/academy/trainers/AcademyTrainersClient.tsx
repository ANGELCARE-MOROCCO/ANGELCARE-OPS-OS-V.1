'use client'
import { shouldStartAutoRefresh, safeRefreshInterval } from '@/lib/runtime/client-live-governor'

import { useEffect, useMemo, useState } from 'react'

type Trainer = {
  id: string | number
  full_name?: string
  name?: string
  email?: string
  mobile?: string
  phone?: string
  trainer_code?: string
  professional_title?: string
  status?: string
  availability_status?: string
  main_specialty?: string
  specialty?: string
  seniority_level?: string
  city?: string
  base_location?: string
  utilization_rate?: number
  readiness_score?: number
  dispatch_score?: number
  weekly_capacity?: number
  current_load?: number
  documents_count?: number
  required_documents?: number
  certifications_count?: number
  assignments?: Assignment[]
}

type Assignment = {
  [key: string]: any
  id?: string | number
  trainer_id?: string | number | null
  trainer_name?: string
  title?: string
  program_title?: string
  cohort_title?: string
  cohort_reference?: string
  location?: string
  delivery_format?: string
  status?: string
  start_time?: string
  end_time?: string
  start_at?: string
  end_at?: string
  starts_at?: string
  ends_at?: string
  scheduled_date?: string
  date?: string

  cohort_id?: string | number | null
  program_id?: string | number | null
  source?: string | null
  cohort_day_index?: number
  cohort_total_days?: number
  readiness_score?: number
  progression_percent?: number
}

type ViewMode = 'day' | 'week' | 'month'

const HOURS = Array.from({ length: 14 }, (_, index) => index + 8)

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function parseDate(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}

function startOfWeek(date: Date) {
  const copy = new Date(date)
  const day = copy.getDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + diff)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function monthDays(date: Date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1)
  const start = startOfWeek(first)
  return Array.from({ length: 42 }, (_, index) => {
    const d = new Date(start)
    d.setDate(start.getDate() + index)
    return d
  })
}

function weekDays(date: Date) {
  const start = startOfWeek(date)
  return Array.from({ length: 7 }, (_, index) => {
    const d = new Date(start)
    d.setDate(start.getDate() + index)
    return d
  })
}

function niceDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  })
}

function trainerName(trainer: Trainer) {
  return trainer.full_name || trainer.name || trainer.email || trainer.trainer_code || `Trainer ${trainer.id}`
}

function trainerInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'TR'
}

function trainerStatus(trainer: Trainer) {
  return String(trainer.availability_status || trainer.status || 'available').toLowerCase()
}

function assignmentTitle(assignment: Assignment) {
  return assignment.title || assignment.program_title || assignment.cohort_title || 'Scheduled training'
}

function assignmentStart(assignment: Assignment) {
  return assignment.start_time || assignment.start_at || assignment.starts_at || assignment.scheduled_date || assignment.date || ''
}

function assignmentEnd(assignment: Assignment) {
  return assignment.end_time || assignment.end_at || assignment.ends_at || ''
}

function assignmentDateKey(assignment: Assignment) {
  const raw = assignmentStart(assignment)
  if (!raw) return ''
  const parsed = parseDate(raw)
  if (parsed) return dateKey(parsed)
  return String(raw).slice(0, 10)
}

function assignmentHour(assignment: Assignment) {
  const raw = assignmentStart(assignment)
  const parsed = parseDate(raw)
  if (parsed) return parsed.getHours()
  const match = String(raw).match(/(\d{1,2}):/)
  return match ? Number(match[1]) : 9
}

function assignmentTime(assignment: Assignment) {
  const start = parseDate(assignmentStart(assignment))
  const end = parseDate(assignmentEnd(assignment))
  if (!start) return 'Time not set'
  const s = start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const e = end ? end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''
  return e ? `${s} – ${e}` : s
}

function toneFor(index: number) {
  const tones = [
    'border-blue-200 bg-blue-50 text-blue-950',
    'border-emerald-200 bg-emerald-50 text-emerald-950',
    'border-violet-200 bg-violet-50 text-violet-950',
    'border-orange-200 bg-orange-50 text-orange-950',
    'border-cyan-200 bg-cyan-50 text-cyan-950',
  ]
  return tones[index % tones.length]
}

function normalizeList(payload: any): Trainer[] {
  const value = payload?.data || payload?.trainers || payload?.items || payload || []
  return Array.isArray(value) ? value : []
}

function normalizeAssignments(payload: any): Assignment[] {
  const value = payload?.data || payload?.assignments || payload?.items || payload || []
  return Array.isArray(value) ? value : []
}


function AcademySidebar() {
  const items = [
    ['⌂', 'Command Center', '/academy'],
    ['◎', 'Trainees', '/academy/trainees'],
    ['▤', 'Enrollments', '/academy/enrollments'],
    ['◷', 'Attendance', '/academy/attendance'],
    ['▭', 'Payments', '/academy/payments'],
    ['◈', 'Certificates', '/academy/certificates'],
    ['♟', 'Trainers', '/academy/trainers'],
    ['▣', 'Programs', '/academy/courses'],
    ['◇', 'Job Placement', '/academy/job-placement'],
    ['♡', 'Partners & Employers', '/academy/partners-employers'],
    ['◂', 'Announcements', '/academy/announcements'],
    ['▥', 'Reports & Analytics', '/academy/reports'],
    ['◇', 'Integrations', '/academy/integrations'],
    ['⚙', 'Automation', '/academy/automation'],
    ['⚙', 'Settings', '/academy/settings'],
  ]

  return (
    <aside className="sticky top-0 hidden h-screen overflow-y-auto border-r border-slate-200 bg-white px-5 py-6 shadow-sm lg:block">
      <div className="mb-8 flex items-center gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-3xl bg-blue-600 text-3xl font-black text-white">A</div>
        <div>
          <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">AngelCare</h2>
          <p className="text-xs font-black uppercase tracking-[0.42em] text-slate-500">Academy OS</p>
        </div>
      </div>

      <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-slate-400">Academy</p>

      <nav className="space-y-1.5">
        {items.map(([icon, label, href]) => {
          const active = href === '/academy/trainers'
          return (
            <a
              key={href}
              href={href}
              className={
                active
                  ? 'flex items-center gap-3 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 shadow-sm ring-1 ring-blue-100'
                  : 'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 hover:text-blue-700'
              }
            >
              <span className={active ? 'text-lg text-blue-600' : 'text-lg text-slate-500'}>{icon}</span>
              <span>{label}</span>
            </a>
          )
        })}
      </nav>

      <div className="mt-10 rounded-[2rem] border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm font-black text-slate-950">Academy OS</p>
        <p className="mt-1 text-xs font-bold text-emerald-600">Online</p>
        <p className="mt-1 text-xs font-bold text-slate-500">All systems operational</p>
      </div>
    </aside>
  )
}





function previewPdf(url: string) {
  if (typeof window === 'undefined') return
  window.open(url, '_blank', 'noopener,noreferrer')
}

export default function AcademyTrainersClient() {
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [query, setQuery] = useState('')
  const [availability, setAvailability] = useState('all')
  const [specialty, setSpecialty] = useState('all')
  const [loadFilter, setLoadFilter] = useState('all')
  const [selectedDate, setSelectedDate] = useState(todayKey())
  const [viewMode, setViewMode] = useState<ViewMode>('day')
  const [modalMode, setModalMode] = useState<'create' | 'view' | 'edit' | null>(null)
  const [selectedCohortView, setSelectedCohortView] = useState<any | null>(null)
  const [cohortViewLoading, setCohortViewLoading] = useState(false)
  const [activeTrainer, setActiveTrainer] = useState<Trainer | null>(null)
  const [managementTrainer, setManagementTrainer] = useState<Trainer | null>(null)
  const [managementOpen, setManagementOpen] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    mobile: '',
    professional_title: 'Registered Trainer',
    status: 'available',
    main_specialty: 'General Training',
    seniority_level: 'senior',
    city: '',
    readiness_score: 0,
    dispatch_score: 0,
    weekly_capacity: 40,
  })

  async function loadData() {
    setLoading(true)
    try {
      const [trainerResponse, assignmentResponse] = await Promise.all([
        fetch('/api/academy/trainers', { cache: 'no-store' }),
        fetch('/api/academy/trainer-assignments', { cache: 'no-store' }).catch(() => null),
      ])

      const trainerJson = await trainerResponse.json().catch(() => ({}))
      const assignmentJson = assignmentResponse ? await assignmentResponse.json().catch(() => ({})) : {}

      const loadedTrainers = normalizeList(trainerJson)
      const loadedAssignments = normalizeAssignments(assignmentJson)

      const embeddedAssignments = loadedTrainers.flatMap((trainer) =>
        Array.isArray(trainer.assignments)
          ? trainer.assignments.map((assignment) => ({
              ...assignment,
              trainer_id: assignment.trainer_id || trainer.id,
              trainer_name: assignment.trainer_name || trainerName(trainer),
            }))
          : [],
      )

      setTrainers(loadedTrainers)
      setAssignments([...loadedAssignments, ...embeddedAssignments])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    if (!shouldStartAutoRefresh()) return
    const interval = window.setInterval(loadData, safeRefreshInterval(15000))

    function handleFocus() {
      loadData()
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleFocus)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleFocus)
    }
  }, [])

  const filteredTrainers = useMemo(() => {
    const text = query.trim().toLowerCase()
    return trainers.filter((trainer) => {
      const name = trainerName(trainer).toLowerCase()
      const email = String(trainer.email || '').toLowerCase()
      const city = String(trainer.city || trainer.base_location || '').toLowerCase()
      const spec = String(trainer.main_specialty || trainer.specialty || 'General Training').toLowerCase()
      const status = trainerStatus(trainer)
      const util = Number(trainer.utilization_rate || trainer.current_load || 0)

      if (text && !`${name} ${email} ${city} ${spec}`.includes(text)) return false
      if (availability !== 'all' && status !== availability) return false
      if (specialty !== 'all' && spec !== specialty.toLowerCase()) return false
      if (loadFilter === 'high' && util < 75) return false
      if (loadFilter === 'normal' && util >= 75) return false

      return true
    })
  }, [trainers, query, availability, specialty, loadFilter])

  const selectedDateObject = useMemo(() => {
    const parsed = new Date(`${selectedDate}T12:00:00`)
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed
  }, [selectedDate])

  const selectedAssignments = useMemo(() => {
    if (viewMode === 'day') {
      return assignments.filter((assignment) => assignmentDateKey(assignment) === selectedDate)
    }

    if (viewMode === 'week') {
      const keys = new Set(weekDays(selectedDateObject).map(dateKey))
      return assignments.filter((assignment) => keys.has(assignmentDateKey(assignment)))
    }

    const month = selectedDateObject.getMonth()
    const year = selectedDateObject.getFullYear()
    return assignments.filter((assignment) => {
      const parsed = parseDate(assignmentStart(assignment))
      return parsed && parsed.getMonth() === month && parsed.getFullYear() === year
    })
  }, [assignments, selectedDate, selectedDateObject, viewMode])

  const total = trainers.length
  const availableCount = trainers.filter((trainer) => ['available', 'active', 'ready'].includes(trainerStatus(trainer))).length
  const assignedToday = assignments.filter((assignment) => assignmentDateKey(assignment) === todayKey()).length
  const upcoming = assignments.filter((assignment) => {
    const parsed = parseDate(assignmentStart(assignment))
    return parsed ? parsed >= new Date() : false
  }).length
  const averageLoad = total
    ? Math.round(trainers.reduce((sum, trainer) => sum + Number(trainer.utilization_rate || trainer.current_load || 0), 0) / total)
    : 0
  const highLoadCount = trainers.filter((trainer) => Number(trainer.utilization_rate || trainer.current_load || 0) >= 75).length
  const overloadedCount = trainers.filter((trainer) => Number(trainer.utilization_rate || trainer.current_load || 0) >= 100).length
  const unavailableCount = trainers.filter((trainer) => ['unavailable', 'leave', 'inactive', 'sick'].includes(trainerStatus(trainer))).length
  const avgReadiness = total
    ? Math.round(trainers.reduce((sum, trainer) => sum + Number(trainer.readiness_score || 0), 0) / total)
    : 0
  const documentRisk = trainers.filter((trainer) => {
    const docs = Number(trainer.documents_count || 0)
    const required = Number(trainer.required_documents || 5)
    return docs < required
  }).length
  const coverageRate = upcoming ? Math.round((selectedAssignments.length / upcoming) * 100) : 0

  const specialties = useMemo(() => {
    return Array.from(new Set(trainers.map((trainer) => trainer.main_specialty || trainer.specialty || 'General Training'))).filter(Boolean)
  }, [trainers])

  const alerts = useMemo(() => {
    const list: { title: string; message: string; tone: string }[] = []
    trainers.forEach((trainer) => {
      const name = trainerName(trainer)
      const util = Number(trainer.utilization_rate || trainer.current_load || 0)
      const docs = Number(trainer.documents_count || 0)
      const required = Number(trainer.required_documents || 5)
      const readiness = Number(trainer.readiness_score || 0)

      if (util >= 100) list.push({ title: `${name} overloaded`, message: 'Trainer load is above safe capacity.', tone: 'red' })
      if (util >= 75 && util < 100) list.push({ title: `${name} high load`, message: 'Review upcoming assignments and balance workload.', tone: 'amber' })
      if (docs < required) list.push({ title: `${name} document risk`, message: 'Missing trainer documents or compliance files.', tone: 'red' })
      if (readiness < 50) list.push({ title: `${name} readiness incomplete`, message: 'Profile, documents or compliance need review.', tone: 'amber' })
    })
    return list.slice(0, 6)
  }, [trainers])

  function openCreate() {
    setActiveTrainer(null)
    setForm({
      full_name: '',
      email: '',
      mobile: '',
      professional_title: 'Registered Trainer',
      status: 'available',
      main_specialty: 'General Training',
      seniority_level: 'senior',
      city: '',
      readiness_score: 0,
      dispatch_score: 0,
      weekly_capacity: 40,
    })
    setModalMode('create')
  }

  function openTrainer(trainer: Trainer, mode: 'view' | 'edit') {
    setManagementTrainer(trainer)
    setManagementOpen(true)
  }

  async function saveTrainer() {
    setSaving(true)
    try {
      const isEdit = modalMode === 'edit' && activeTrainer
      const url = isEdit ? `/api/academy/trainers/${activeTrainer.id}` : '/api/academy/trainers'
      const response = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await response.json().catch(() => ({}))
      if (!response.ok || json?.ok === false) throw new Error(json?.error || 'Unable to save trainer')
      const savedTrainer = json?.data || json?.trainer || json?.record || {
        ...(activeTrainer || {}),
        ...form,
        id: activeTrainer?.id || json?.id || Date.now(),
      }
      await loadData()
      setActiveTrainer(savedTrainer)
      setModalMode('view')
    } catch (error: any) {
      alert(error?.message || 'Unable to save trainer')
    } finally {
      setSaving(false)
    }
  }


  async function openCohortView(cohortId: string | number | null | undefined) {
    if (!cohortId) return

    setCohortViewLoading(true)
    try {
      const response = await fetch(`/api/academy/cohorts/${cohortId}`, { cache: 'no-store' })
      const json = await response.json().catch(() => ({}))

      if (!response.ok || json?.ok === false) {
        throw new Error(json?.error || 'Unable to load cohort details')
      }

      setSelectedCohortView(json?.data || json?.cohort || json)
    } catch (error: any) {
      alert(error?.message || 'Unable to load cohort details')
    } finally {
      setCohortViewLoading(false)
    }
  }

  async function assignTrainer(trainer: Trainer) {
    const title = window.prompt('Training / assignment title')
    if (!title) return

    const start = window.prompt('Start date/time', `${selectedDate}T09:00:00`)
    if (!start) return

    const end = window.prompt('End date/time', `${selectedDate}T11:00:00`)
    if (!end) return

    try {
      const response = await fetch('/api/academy/trainer-assignments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          trainer_id: trainer.id,
          trainer_name: trainerName(trainer),
          title,
          start_time: start,
          end_time: end,
          status: 'planned',
        }),
      })
      const json = await response.json().catch(() => ({}))
      if (!response.ok || json?.ok === false) throw new Error(json?.error || 'Unable to assign trainer')
      await loadData()
    } catch (error: any) {
      alert(error?.message || 'Unable to assign trainer')
    }
  }

  function exportCsv() {
    const rows = [
      ['Trainer', 'Email', 'Specialty', 'Status', 'Utilization', 'Readiness'],
      ...filteredTrainers.map((trainer) => [
        trainerName(trainer),
        trainer.email || '',
        trainer.main_specialty || trainer.specialty || 'General Training',
        trainer.status || trainer.availability_status || 'available',
        String(trainer.utilization_rate || trainer.current_load || 0),
        String(trainer.readiness_score || 0),
      ]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'academy-trainers.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
      <AcademySidebar />
      <main className="min-w-0 bg-slate-100 px-5 pb-10 pt-4">
      <section className="w-full max-w-none space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black text-slate-500">Home › Trainers › Dispatch</p>
            <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-slate-950">Trainers Dispatch & Management</h1>
            <p className="mt-1 text-sm font-bold text-slate-500">
              Real-time command center for trainer operations, availability, load balancing and live assignments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search trainers, skills, programs..."
              className="h-12 w-[360px] rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm outline-none focus:border-blue-400"
            />
            <button className="h-12 rounded-2xl border border-blue-300 bg-white px-5 text-sm font-black text-slate-900 shadow-sm">
              Dispatch Board
            </button>
            <button onClick={openCreate} className="h-12 rounded-2xl bg-blue-600 px-6 text-sm font-black text-white shadow-xl shadow-blue-200">
              + Add Trainer
            </button>
            <button onClick={exportCsv} className="h-12 rounded-2xl bg-white px-5 text-sm font-black text-slate-900 shadow-sm">
              Export
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <KpiCard icon="👥" label="Active Trainers" value={availableCount} caption={`${total} live registry`} tone="blue" />
          <KpiCard icon="◎" label="Assigned Today" value={assignedToday} caption="sessions planned" tone="violet" />
          <KpiCard icon="♧" label="Upcoming Sessions" value={upcoming} caption="next 7 days" tone="cyan" />
          <KpiCard icon="◉" label="Coverage Rate" value={`${coverageRate}%`} caption="covered assignments" tone="orange" />
          <KpiCard icon="▣" label="Average Load" value={`${averageLoad}%`} caption="capacity used" tone="green" />
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_150px_150px_130px_110px]">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search trainers by name, skill, city, email..."
              className="h-12 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold outline-none focus:border-blue-400"
            />
            <select value={availability} onChange={(event) => setAvailability(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold">
              <option value="all">Availability · All</option>
              <option value="available">Available</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="unavailable">Unavailable</option>
            </select>
            <select value={specialty} onChange={(event) => setSpecialty(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold">
              <option value="all">Specialty · All</option>
              {specialties.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select value={loadFilter} onChange={(event) => setLoadFilter(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold">
              <option value="all">Load · All</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
            <button onClick={loadData} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black">
              Refresh
            </button>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[330px_minmax(760px,1fr)_330px]">
          <aside className="space-y-5">
            <TrainerStatusOverview
              total={total}
              available={availableCount}
              highLoad={highLoadCount}
              overloaded={overloadedCount}
              unavailable={unavailableCount}
              readiness={avgReadiness}
              workload={averageLoad}
              documentRisk={documentRisk}
            />

            <section className="min-w-0 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black">Trainer Workload</h3>
                  <p className="text-xs font-bold text-slate-500">Clickable operational load cards</p>
                </div>
                <span className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-black">Live</span>
              </div>
              <div className="space-y-3">
                {filteredTrainers.map((trainer) => {
                  const util = Number(trainer.utilization_rate || trainer.current_load || 0)
                  return (
                    <button
                      key={`workload-${trainer.id}`}
                      onClick={() => openTrainer(trainer, 'view')}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-sm font-black">{trainerName(trainer)}</strong>
                        <span className={util >= 75 ? 'text-xs font-black text-orange-600' : 'text-xs font-black text-emerald-600'}>
                          {util >= 75 ? 'High Load' : 'Normal'}
                        </span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-slate-200">
                        <div className="h-2 rounded-full bg-blue-600" style={{ width: `${Math.min(100, util)}%` }} />
                      </div>
                      <div className="mt-2 flex justify-between text-xs font-bold text-slate-500">
                        <span>{trainer.main_specialty || trainer.specialty || 'General Training'}</span>
                        <span>{util}%</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>
          </aside>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <ScheduleHeader
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />

            {viewMode === 'day' && (
              <DaySchedule
                selectedDate={selectedDate}
                assignments={selectedAssignments}
                trainers={trainers}
                onTrainerClick={(trainer) => openTrainer(trainer, 'view')}
                onCohortOpen={openCohortView}
              />
            )}

            {viewMode === 'week' && (
              <WeekSchedule
                selectedDate={selectedDateObject}
                assignments={selectedAssignments}
                trainers={trainers}
              />
            )}

            {viewMode === 'month' && (
              <MonthSchedule
                selectedDate={selectedDateObject}
                assignments={selectedAssignments}
              />
            )}
          </section>

          <aside className="space-y-5">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-black">Upcoming Assignments</h3>
              <p className="text-xs font-bold text-slate-500">Live scheduled trainings</p>
              <div className="mt-4 space-y-3">
                {assignments.slice(0, 5).map((assignment, index) => (
                  <article
                    key={`upcoming-${assignment.id || index}-${assignmentDateKey(assignment)}`}
                    onClick={() => openCohortView(assignment.cohort_id)}
                    className="cursor-pointer rounded-2xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <strong className="text-sm font-black">{assignmentTitle(assignment)}</strong>
                        <p className="mt-1 text-xs font-bold text-slate-500">{assignment.trainer_name || 'Trainer not assigned'}</p>
                        <p className="mt-1 text-xs font-black text-blue-600">{assignmentTime(assignment)}</p>
                      </div>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                        {assignment.status || 'planned'}
                      </span>
                    </div>
                  </article>
                ))}
                {!assignments.length && <EmptyBox text="No upcoming assignments yet." />}
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-black">Alerts & Notifications</h3>
              <p className="text-xs font-bold text-slate-500">Derived from live trainer data</p>
              <div className="mt-4 space-y-3">
                {alerts.map((alert, index) => (
                  <article key={`alert-${index}-${alert.title}`} className="rounded-2xl border border-slate-200 p-4">
                    <p className={alert.tone === 'red' ? 'text-sm font-black text-red-600' : 'text-sm font-black text-orange-600'}>
                      △ {alert.title}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{alert.message}</p>
                  </article>
                ))}
                {!alerts.length && <EmptyBox text="No live alerts right now." />}
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-black">Trainer Availability</h3>
                <button className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-black">View Calendar</button>
              </div>
              <div className="space-y-3">
                {filteredTrainers.slice(0, 6).map((trainer) => (
                  <button
                    key={`availability-${trainer.id}`}
                    onClick={() => openTrainer(trainer, 'view')}
                    className="flex w-full items-center justify-between rounded-2xl bg-slate-50 p-3 text-left hover:bg-blue-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-50 text-xs font-black text-blue-700">
                        {trainerInitials(trainerName(trainer))}
                      </span>
                      <div>
                        <strong className="block text-xs font-black">{trainerName(trainer)}</strong>
                        <span className="text-xs font-bold text-slate-500">{trainer.main_specialty || trainer.specialty || 'Trainer'}</span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-emerald-600">{trainer.status || trainer.availability_status || 'available'}</span>
                  </button>
                ))}
              </div>
            </section>
          </aside>
        </div>

        {loading && (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center text-sm font-black text-slate-500">
            Loading live trainers workspace…
          </div>
        )}
      </section>

      {selectedCohortView && (
        <CohortViewFromTrainerBoardModal
          cohort={selectedCohortView}
          loading={cohortViewLoading}
          onRefresh={() => openCohortView(selectedCohortView?.id)}
          onClose={() => setSelectedCohortView(null)}
        />
      )}

      {managementOpen && managementTrainer && (
        <TrainerManagementModal
          trainer={managementTrainer}
          onClose={() => {
            setManagementOpen(false)
            setManagementTrainer(null)
          }}
          onEditDossier={() => {
            setActiveTrainer(managementTrainer)
            setManagementOpen(false)
            setModalMode('edit')
          }}
        />
      )}

      {modalMode && (
        <TrainerModal
          mode={modalMode}
          form={form}
          setForm={setForm}
          activeTrainer={activeTrainer}
          saving={saving}
          onClose={() => setModalMode(null)}
          onEdit={() => setModalMode('edit')}
          onSave={saveTrainer}
        />
      )}
      </main>
    </div>
  )
}

function KpiCard({ icon, label, value, caption, tone }: { icon: string; label: string; value: string | number; caption: string; tone: string }) {
  const bg: Record<string, string> = {
    blue: 'bg-blue-500',
    violet: 'bg-violet-500',
    cyan: 'bg-teal-500',
    orange: 'bg-orange-500',
    green: 'bg-green-500',
  }

  return (
    <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className={`grid h-12 w-12 place-items-center rounded-2xl ${bg[tone] || 'bg-blue-500'} text-white`}>
          {icon}
        </div>
        <div className="h-8 w-20 rounded-full bg-gradient-to-r from-transparent via-emerald-100 to-emerald-200" />
      </div>
      <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <strong className="mt-1 block text-3xl font-black">{value}</strong>
      <p className="mt-2 text-xs font-bold text-slate-500">{caption}</p>
    </article>
  )
}

function TrainerStatusOverview({
  total,
  available,
  highLoad,
  overloaded,
  unavailable,
  readiness,
  workload,
  documentRisk,
}: {
  total: number
  available: number
  highLoad: number
  overloaded: number
  unavailable: number
  readiness: number
  workload: number
  documentRisk: number
}) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black tracking-[-0.03em]">Trainer Status Overview</h3>
          <p className="text-xs font-bold text-slate-500">Live trainer readiness and dispatch health</p>
        </div>
        <span className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">Live</span>
      </div>

      <div className="grid gap-5">
        <div className="grid grid-cols-[132px_1fr] gap-4">
          <div className="grid h-32 w-32 place-items-center rounded-full bg-emerald-500 text-center text-white shadow-lg shadow-emerald-100">
            <div>
              <strong className="block text-4xl font-black">{total}</strong>
              <span className="text-xs font-black uppercase tracking-[0.16em]">Trainers</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatusMetric label="Available" value={available} tone="emerald" />
            <StatusMetric label="High Load" value={highLoad} tone="amber" />
            <StatusMetric label="Overloaded" value={overloaded} tone="red" />
            <StatusMetric label="Unavailable" value={unavailable} tone="slate" />
          </div>
        </div>

        <HealthBar label="Average readiness" value={readiness} />
        <HealthBar label="Average workload" value={workload} />
        <HealthBar label="Document risk" value={documentRisk} max={Math.max(1, total)} />
      </div>
    </section>
  )
}

function StatusMetric({ label, value, tone }: { label: string; value: number; tone: 'emerald' | 'amber' | 'red' | 'slate' }) {
  const cls = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    red: 'border-red-200 bg-red-50 text-red-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
  }[tone]

  return (
    <div className={`rounded-2xl border p-4 ${cls}`}>
      <strong className="block text-3xl font-black">{value}</strong>
      <span className="text-xs font-black">{label}</span>
    </div>
  )
}

function HealthBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const percent = Math.max(0, Math.min(100, Math.round((value / max) * 100)))
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-black text-slate-500">{label}</span>
        <strong className="text-lg font-black">{value}{max === 100 ? '%' : ''}</strong>
      </div>
      <div className="mt-3 h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-blue-600" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

function ScheduleHeader({
  selectedDate,
  setSelectedDate,
  viewMode,
  setViewMode,
}: {
  selectedDate: string
  setSelectedDate: (value: string) => void
  viewMode: ViewMode
  setViewMode: (value: ViewMode) => void
}) {
  const date = new Date(`${selectedDate}T12:00:00`)

  function move(delta: number) {
    const copy = new Date(date)
    if (viewMode === 'day') copy.setDate(copy.getDate() + delta)
    if (viewMode === 'week') copy.setDate(copy.getDate() + delta * 7)
    if (viewMode === 'month') copy.setMonth(copy.getMonth() + delta)
    setSelectedDate(dateKey(copy))
  }

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
      <div>
        <h2 className="text-xl font-black tracking-[-0.03em]">Live Training Schedule</h2>
        <p className="text-xs font-bold text-slate-500">Training-based daily dispatch · operational hours 08:00 → 21:00</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={selectedDate}
          onChange={(event) => setSelectedDate(event.target.value)}
          className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm outline-none focus:border-blue-400"
        />
        {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={viewMode === mode ? 'h-11 rounded-2xl bg-blue-600 px-4 text-sm font-black capitalize text-white' : 'h-11 rounded-2xl bg-slate-50 px-4 text-sm font-black capitalize text-slate-700'}
          >
            {mode}
          </button>
        ))}
        <button onClick={() => setSelectedDate(todayKey())} className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black">
          Today
        </button>
        <button onClick={() => move(-1)} className="h-11 w-11 rounded-2xl border border-slate-200 bg-white text-sm font-black">‹</button>
        <button onClick={() => move(1)} className="h-11 w-11 rounded-2xl border border-slate-200 bg-white text-sm font-black">›</button>
      </div>
    </div>
  )
}

function DaySchedule({
  selectedDate,
  assignments,
  trainers,
  onTrainerClick,
  onCohortOpen,
}: {
  selectedDate: string
  assignments: Assignment[]
  trainers: Trainer[]
  onTrainerClick: (trainer: Trainer) => void
  onCohortOpen: (cohortId: string | number | null | undefined) => void
}) {
  return (
    <div>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h3 className="text-lg font-black">{niceDate(selectedDate)}</h3>
          <p className="text-xs font-bold text-slate-500">Cards are grouped by scheduled start time. Trainers are attached inside each training.</p>
        </div>
        <span className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black text-slate-500">
          {assignments.length} trainings
        </span>
      </div>

      <div className="space-y-3">
        {HOURS.map((hour) => {
          const hourAssignments = assignments.filter((assignment) => assignmentHour(assignment) === hour)
          const label = `${String(hour).padStart(2, '0')}:00`
          const period = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening'

          return (
            <section key={`hour-${selectedDate}-${hour}`} className="grid grid-cols-[78px_1fr] gap-3">
              <div className="pt-3">
                <strong className="block text-lg font-black">{label}</strong>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{period}</span>
              </div>

              <div className="min-h-[72px] rounded-3xl border border-slate-200 bg-slate-50/80 p-3">
                {hourAssignments.length ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {hourAssignments.map((assignment, index) => {
                      const trainer = trainers.find((item) => String(item.id) === String(assignment.trainer_id))
                      return (
                        <article
                          key={`training-${assignment.id || index}-${selectedDate}-${hour}`}
                          onClick={() => onCohortOpen(assignment.cohort_id)}
                          className={`cursor-pointer rounded-3xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${toneFor(index)}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="text-sm font-black">{assignmentTitle(assignment)}</h4>
                              <p className="mt-1 text-xs font-bold opacity-80">{assignmentTime(assignment)}</p>
                              <p className="mt-1 text-xs font-bold opacity-70">{assignment.location || assignment.cohort_reference || assignment.delivery_format || 'Training slot'}</p>
                            </div>
                            <span className="rounded-full bg-white/70 px-3 py-1 text-[10px] font-black uppercase">{assignment.status || 'planned'}</span>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {trainer ? (
                              <button
                                onClick={(event) => {
                                  event.stopPropagation()
                                  onTrainerClick(trainer)
                                }}
                                className="flex items-center gap-2 rounded-2xl bg-white/80 px-3 py-2 text-xs font-black"
                              >
                                <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-600 text-[10px] text-white">
                                  {trainerInitials(trainerName(trainer))}
                                </span>
                                {trainerName(trainer)}
                              </button>
                            ) : (
                              <span className="rounded-2xl bg-white/80 px-3 py-2 text-xs font-black text-orange-600">Trainer not assigned</span>
                            )}
                          </div>
                        </article>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex h-full min-h-[48px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-xs font-black text-slate-400">
                    No training scheduled in this hour
                  </div>
                )}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function WeekSchedule({ selectedDate, assignments }: { selectedDate: Date; assignments: Assignment[]; trainers: Trainer[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-7">
      {weekDays(selectedDate).map((day, index) => {
        const key = dateKey(day)
        const dayAssignments = assignments.filter((assignment) => assignmentDateKey(assignment) === key)
        return (
          <article key={`week-${key}-${index}`} className="min-h-[320px] rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase text-slate-400">{day.toLocaleDateString('en-GB', { weekday: 'short' })}</p>
            <h3 className="mt-1 text-xl font-black">{day.getDate()}</h3>
            <div className="mt-4 space-y-2">
              {dayAssignments.map((assignment, assignmentIndex) => (
                <div key={`week-assignment-${key}-${assignment.id || assignmentIndex}`} className={`rounded-2xl border p-3 text-xs font-black ${toneFor(assignmentIndex)}`}>
                  <p>{assignmentTitle(assignment)}</p>
                  <span className="mt-1 block opacity-70">{assignmentTime(assignment)}</span>
                </div>
              ))}
              {!dayAssignments.length && <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-center text-xs font-black text-slate-400">No trainings</p>}
            </div>
          </article>
        )
      })}
    </div>
  )
}

function MonthSchedule({ selectedDate, assignments }: { selectedDate: Date; assignments: Assignment[] }) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {monthDays(selectedDate).map((day, index) => {
        const key = dateKey(day)
        const dayAssignments = assignments.filter((assignment) => assignmentDateKey(assignment) === key)
        const isCurrentMonth = day.getMonth() === selectedDate.getMonth()
        return (
          <article key={`month-${key}-${index}`} className={isCurrentMonth ? 'min-h-[120px] rounded-2xl border border-slate-200 bg-white p-3' : 'min-h-[120px] rounded-2xl border border-slate-100 bg-slate-50 p-3 opacity-50'}>
            <div className="flex items-center justify-between">
              <strong className="text-sm font-black">{day.getDate()}</strong>
              {dayAssignments.length > 0 && <span className="rounded-full bg-blue-600 px-2 py-1 text-[10px] font-black text-white">{dayAssignments.length}</span>}
            </div>
            <div className="mt-2 space-y-1">
              {dayAssignments.slice(0, 3).map((assignment, assignmentIndex) => (
                <p key={`month-assignment-${key}-${assignment.id || assignmentIndex}`} className="truncate rounded-xl bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-700">
                  {assignmentTitle(assignment)}
                </p>
              ))}
            </div>
          </article>
        )
      })}
    </div>
  )
}

function EmptyBox({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm font-black text-slate-400">{text}</div>
}





function CohortViewFromTrainerBoardModal({
  cohort,
  loading,
  onRefresh,
  onClose,
}: {
  cohort: any
  loading: boolean
  onRefresh: () => void
  onClose: () => void
}) {
  const participants = Array.isArray(cohort?.participants) ? cohort.participants : []
  const checklist = Array.isArray(cohort?.checklist) ? cohort.checklist : []
  const capacity = Number(cohort?.capacity || 0)
  const availableSeats = Math.max(0, capacity - participants.length)
  const checkedCount = checklist.filter((item: any) => item.checked).length
  const checklistPercent = checklist.length ? Math.round((checkedCount / checklist.length) * 100) : 0

  function printCohort() {
    if (cohort?.id) window.open(`/api/academy/cohorts/${cohort.id}/pdf`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="fixed inset-0 z-[11000] overflow-y-auto bg-slate-950/55 px-4 py-6 backdrop-blur-md">
      <div className="mx-auto flex min-h-[90vh] w-full max-w-[1720px] flex-col overflow-hidden rounded-[2.4rem] border border-white/70 bg-white shadow-[0_45px_140px_rgba(15,23,42,0.38)]">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-white px-7 py-5">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-3xl bg-blue-50 text-2xl text-blue-700 ring-1 ring-blue-100">▣</span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-600">Live cohort view mode</p>
              <h2 className="text-3xl font-black tracking-[-0.04em] text-slate-950">
                {cohort?.title || cohort?.reference_number || `Cohort ${cohort?.id}`}
              </h2>
              <p className="mt-1 text-sm font-bold text-slate-500">
                Live synced from cohort operations: trainer, participants, readiness, capacity and A4 manifest.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
              <span className="text-xs font-black text-slate-500">Reference Number</span>
              <strong className="ml-3 text-sm font-black text-slate-950">{cohort?.reference_number || '—'}</strong>
            </div>
            <button onClick={onRefresh} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm">
              {loading ? 'Refreshing…' : 'Refresh Live'}
            </button>
            <button onClick={printCohort} className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black text-blue-700 shadow-sm">
              Print A4
            </button>
            <a
              href="/academy/cohorts"
              className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-xl shadow-blue-200"
            >
              Open Cohorts Page
            </a>
            <button onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-700">
              Close
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 border-b border-slate-100 bg-slate-50 px-7 py-5 md:grid-cols-6">
          <CohortKpi label="Status" value={cohort?.status || 'planned'} tone="blue" />
          <CohortKpi label="Participants" value={`${participants.length}/${capacity || 0}`} tone="emerald" />
          <CohortKpi label="Available Seats" value={availableSeats} tone="violet" />
          <CohortKpi label="Readiness" value={`${cohort?.readiness_score || checklistPercent || 0}%`} tone="emerald" />
          <CohortKpi label="Progression" value={`${cohort?.progression_percent || 0}%`} tone="amber" />
          <CohortKpi label="Attendance Health" value={`${cohort?.attendance_health || 0}%`} tone="slate" />
        </section>

        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_380px] gap-5 overflow-auto bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
          <main className="space-y-5">
            <section className="grid gap-5 xl:grid-cols-2">
              <CohortModalPanel title="Cohort Core Control">
                <div className="grid gap-4 md:grid-cols-2">
                  <ReadonlyField label="Cohort Title" value={cohort?.title} />
                  <ReadonlyField label="Linked Program" value={cohort?.program_title || cohort?.program_name} />
                  <ReadonlyField label="Assigned Trainer" value={cohort?.trainer_name} />
                  <ReadonlyField label="Status" value={cohort?.status} />
                  <ReadonlyField label="Start Date" value={cohort?.start_date} />
                  <ReadonlyField label="End Date" value={cohort?.end_date} />
                  <ReadonlyField label="Start Time" value={cohort?.training_start_time || cohort?.start_time || '09:00'} />
                  <ReadonlyField label="End Time" value={cohort?.training_end_time || cohort?.end_time || '17:00'} />
                  <ReadonlyField label="Seat Capacity" value={cohort?.capacity} />
                  <ReadonlyField label="Operational Notes" value={cohort?.notes || '—'} wide />
                </div>
              </CohortModalPanel>

              <CohortModalPanel title="Cohort Manifest Summary">
                <div className="grid gap-4 md:grid-cols-2">
                  <ReadonlyField label="Reference" value={cohort?.reference_number} />
                  <ReadonlyField label="Program" value={cohort?.program_title || cohort?.program_name} />
                  <ReadonlyField label="Trainer" value={cohort?.trainer_name} />
                  <ReadonlyField label="Dates" value={`${cohort?.start_date || '—'} → ${cohort?.end_date || '—'}`} />
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <MiniCohortStat label="Available Seats" value={`${availableSeats}/${capacity || 0}`} />
                  <MiniCohortStat label="Readiness" value={`${cohort?.readiness_score || checklistPercent || 0}%`} />
                  <MiniCohortStat label="Progression" value={`${cohort?.progression_percent || 0}%`} />
                </div>
              </CohortModalPanel>
            </section>

            <section className="grid gap-5 xl:grid-cols-[1fr_1.3fr]">
              <CohortModalPanel title="Seat & Readiness Control">
                <div className="grid grid-cols-3 gap-3">
                  <MiniCohortStat label="Capacity" value={capacity || 0} />
                  <MiniCohortStat label="Participants" value={participants.length} />
                  <MiniCohortStat label="Available" value={availableSeats} />
                </div>
                <div className="mt-5 space-y-4">
                  <ProgressLine label="Readiness Score" value={Number(cohort?.readiness_score || checklistPercent || 0)} />
                  <ProgressLine label="Progression" value={Number(cohort?.progression_percent || 0)} />
                  <ProgressLine label="Attendance Health" value={Number(cohort?.attendance_health || 0)} />
                </div>
              </CohortModalPanel>

              <CohortModalPanel title="Participants From Approved Enrollments">
                <div className="space-y-3">
                  {participants.map((participant: any, index: number) => (
                    <article key={`cohort-view-participant-${participant.id || index}`} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div>
                        <strong className="block text-sm font-black text-slate-950">
                          {participant.trainee_name || participant.name || `Participant ${index + 1}`}
                        </strong>
                        <span className="text-xs font-bold text-slate-500">{participant.email || participant.phone || 'No contact info'}</span>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                        {participant.status || 'assigned'}
                      </span>
                    </article>
                  ))}

                  {!participants.length && (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm font-black text-slate-400">
                      No participants assigned yet.
                    </div>
                  )}
                </div>
              </CohortModalPanel>
            </section>

            <CohortModalPanel title="Readiness Checklist & Progression">
              <div className="grid gap-3 md:grid-cols-3">
                {checklist.map((item: any, index: number) => (
                  <div key={`cohort-view-check-${item.id || index}`} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                    <span className={item.checked ? 'grid h-6 w-6 place-items-center rounded-lg bg-emerald-500 text-xs font-black text-white' : 'grid h-6 w-6 place-items-center rounded-lg border border-slate-300 text-xs font-black text-slate-400'}>
                      {item.checked ? '✓' : ''}
                    </span>
                    <strong className="text-sm font-black text-slate-700">{item.label || item.item_key}</strong>
                  </div>
                ))}

                {!checklist.length && (
                  <div className="col-span-full rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm font-black text-slate-400">
                    No checklist configured yet.
                  </div>
                )}
              </div>
            </CohortModalPanel>
          </main>

          <aside className="space-y-5">
            <CohortModalPanel title="Live Actions">
              <div className="grid gap-3">
                <button onClick={onRefresh} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-black hover:bg-blue-50">
                  Refresh live cohort
                </button>
                <button onClick={printCohort} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-black hover:bg-blue-50">
                  Generate A4 manifest
                </button>
                <a href="/academy/cohorts" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-black hover:bg-blue-50">
                  Manage in cohorts module
                </a>
              </div>
            </CohortModalPanel>

            <CohortModalPanel title="Operational Status">
              <div className="space-y-3">
                <MiniCohortStat label="Program" value={cohort?.program_title || '—'} />
                <MiniCohortStat label="Trainer" value={cohort?.trainer_name || '—'} />
                <MiniCohortStat label="Launch Readiness" value={`${cohort?.readiness_score || checklistPercent || 0}%`} />
              </div>
            </CohortModalPanel>
          </aside>
        </div>
      </div>
    </div>
  )
}

function CohortKpi({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  const map: Record<string, string> = {
    blue: 'border-blue-100 bg-blue-50 text-blue-700',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    violet: 'border-violet-100 bg-violet-50 text-violet-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
    slate: 'border-slate-100 bg-slate-50 text-slate-700',
  }

  return (
    <article className={`rounded-[1.6rem] border p-4 ${map[tone] || map.blue}`}>
      <p className="text-xs font-black uppercase tracking-[0.18em] opacity-70">{label}</p>
      <strong className="mt-2 block text-2xl font-black">{value}</strong>
    </article>
  )
}

function CohortModalPanel({ title, children }: { title: string; children: any }) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-black tracking-[-0.03em] text-slate-950">{title}</h3>
      {children}
    </section>
  )
}

function ReadonlyField({ label, value, wide }: { label: string; value: any; wide?: boolean }) {
  return (
    <div className={wide ? 'md:col-span-2' : ''}>
      <span className="text-xs font-black text-slate-500">{label}</span>
      <div className="mt-2 min-h-[44px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-900">
        {value || '—'}
      </div>
    </div>
  )
}

function MiniCohortStat({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <span className="block text-xs font-black text-slate-500">{label}</span>
      <strong className="mt-1 block text-xl font-black text-slate-950">{value}</strong>
    </div>
  )
}


function TrainerManagementModal({
  trainer,
  onClose,
  onEditDossier,
}: {
  trainer: Trainer
  onClose: () => void
  onEditDossier: () => void
}) {
  const [tab, setTab] = useState<'overview' | 'cohorts' | 'payments' | 'notes' | 'receipt' | 'dossier'>('overview')
  const [data, setData] = useState<any>({ trainer, cohorts: [], payments: [], notes: [], assignments: [], totals: {}, availableProgramCompensationModels: [] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewPayment, setPreviewPayment] = useState<any | null>(null)

  const trainerId = String(trainer.id)
  const liveTrainer = data.trainer || trainer
  const cohorts = Array.isArray(data.cohorts) ? data.cohorts : []
  const payments = Array.isArray(data.payments) ? data.payments : []
  const notes = Array.isArray(data.notes) ? data.notes : []
  const totals = data.totals || data.stats || {}
  const compensationMap = Array.isArray(data.availableProgramCompensationModels) ? data.availableProgramCompensationModels : []

  async function loadManagement() {
    setLoading(true)
    try {
      const response = await fetch(`/api/academy/trainers/${trainerId}/management`, { cache: 'no-store' })
      const json = await response.json().catch(() => ({}))
      if (!response.ok || json?.ok === false) throw new Error(json?.error || 'Unable to load trainer management')
      const payload = json?.data || json
      setData({
        trainer: payload.trainer || json.trainer || trainer,
        cohorts: payload.cohorts || json.cohorts || [],
        payments: payload.payments || json.payments || [],
        notes: payload.notes || json.notes || [],
        assignments: payload.assignments || json.assignments || [],
        availableProgramCompensationModels: payload.availableProgramCompensationModels || json.availableProgramCompensationModels || [],
        totals: payload.totals || payload.stats || json.totals || json.stats || {},
      })
    } catch (error: any) {
      alert(error?.message || 'Unable to load trainer management')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadManagement()
  }, [trainerId])

  function setPayments(next: any[]) {
    setData((current: any) => ({ ...current, payments: next }))
  }

  function setNotes(next: any[]) {
    setData((current: any) => ({ ...current, notes: next }))
  }

  function modelsForCohort(cohortId: any) {
    const found = compensationMap.find((item: any) => String(item.cohort_id) === String(cohortId))
    return Array.isArray(found?.models) ? found.models : []
  }

  function cohortById(cohortId: any) {
    return cohorts.find((cohort: any) => String(cohort.id) === String(cohortId))
  }

  function amountForModel(cohortId: any, modelKey: any, tier: any) {
    const models = modelsForCohort(cohortId)
    const selected = models.find((model: any) => String(model.key) === String(modelKey))
    if (!selected) return null
    const tierNumber = Number(tier || selected.participant_tier || 0)
    const exactTier = models.find((model: any) => String(model.key) === String(modelKey) && Number(model.participant_tier || 0) === tierNumber)
    return Number((exactTier || selected).amount_dhs || 0)
  }

  function referenceSeed() {
    return String(Date.now()).slice(-6)
  }

  function addPayment() {
    const defaultCohort = cohorts[0]
    const models = defaultCohort ? modelsForCohort(defaultCohort.id) : []
    const model = models[0]
    const amount = model ? Number(model.amount_dhs || 0) : 0
    const newPayment = {
      local_id: `local-${Date.now()}`,
      reference_number: `TRP-${new Date().getFullYear()}-${referenceSeed()}`,
      payment_reference: `TRP-${new Date().getFullYear()}-${referenceSeed()}`,
      audit_code: `TRPAY-${String(trainerId).replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase()}-${String(defaultCohort?.id || 'NOCOHORT')}-${Date.now()}`,
      label: model?.label || 'Trainer payment',
      cohort_id: defaultCohort?.id || '',
      cohort_reference: defaultCohort?.reference_number || '',
      cohort_title: defaultCohort?.title || '',
      program_id: defaultCohort?.program_id || '',
      program_title: defaultCohort?.program_title || '',
      compensation_model_key: model?.key || '',
      compensation_model_label: model?.label || '',
      participant_tier: model?.participant_tier || '',
      amount_dhs: amount,
      status: 'pending',
      due_date: '',
      paid_date: '',
      payment_method: '',
      payment_details: '',
      finance_note: '',
      manual_override: false,
    }
    setPayments([newPayment, ...payments])
    setPreviewPayment(newPayment)
    setTab('payments')
  }

  function updatePayment(index: number, key: string, value: any) {
    const next = payments.map((payment: any, i: number) => {
      if (i !== index) return payment
      const updated = { ...payment, [key]: value }

      if (key === 'cohort_id') {
        const cohort = cohortById(value)
        const models = modelsForCohort(value)
        const model = models[0]
        updated.cohort_reference = cohort?.reference_number || ''
        updated.cohort_title = cohort?.title || ''
        updated.program_id = cohort?.program_id || ''
        updated.program_title = cohort?.program_title || ''
        updated.compensation_model_key = model?.key || ''
        updated.compensation_model_label = model?.label || ''
        updated.participant_tier = model?.participant_tier || ''
        updated.amount_dhs = Number(model?.amount_dhs || 0)
        updated.manual_override = false
        updated.audit_code = updated.audit_code || `TRPAY-${String(trainerId).replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase()}-${String(value || 'NOCOHORT')}-${Date.now()}`
      }

      if (key === 'compensation_model_key') {
        const model = modelsForCohort(updated.cohort_id).find((item: any) => String(item.key) === String(value))
        updated.compensation_model_label = model?.label || ''
        updated.participant_tier = model?.participant_tier || updated.participant_tier || ''
        updated.amount_dhs = Number(model?.amount_dhs || 0)
        updated.manual_override = false
      }

      if (key === 'participant_tier') {
        const amount = amountForModel(updated.cohort_id, updated.compensation_model_key, value)
        if (amount !== null) {
          updated.amount_dhs = amount
          updated.manual_override = false
        }
      }

      if (key === 'amount_dhs') {
        updated.amount_dhs = Number(value || 0)
        updated.manual_override = true
      }

      if (key === 'status' && value === 'paid' && !updated.paid_date) {
        updated.paid_date = new Date().toISOString().slice(0, 10)
      }

      return updated
    })
    setPayments(next)
  }

  function removePayment(index: number) {
    setPayments(payments.filter((_: any, i: number) => i !== index))
  }

  function addNote() {
    setNotes([
      {
        local_id: `note-${Date.now()}`,
        category: 'admin',
        priority: 'normal',
        status: 'open',
        note: '',
        cohort_id: '',
      },
      ...notes,
    ])
    setTab('notes')
  }

  function updateNote(index: number, key: string, value: any) {
    setNotes(notes.map((note: any, i: number) => i === index ? { ...note, [key]: value } : note))
  }

  function removeNote(index: number) {
    setNotes(notes.filter((_: any, i: number) => i !== index))
  }

  async function saveManagement() {
    setSaving(true)
    try {
      const response = await fetch(`/api/academy/trainers/${trainerId}/management`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ payments, notes }),
      })
      const json = await response.json().catch(() => ({}))
      if (!response.ok || json?.ok === false) throw new Error(json?.error || 'Unable to save trainer management')
      const payload = json?.data || json
      setData({
        trainer: payload.trainer || trainer,
        cohorts: payload.cohorts || [],
        payments: payload.payments || [],
        notes: payload.notes || [],
        assignments: payload.assignments || [],
        availableProgramCompensationModels: payload.availableProgramCompensationModels || [],
        totals: payload.totals || payload.stats || {},
      })
    } catch (error: any) {
      alert(error?.message || 'Unable to save trainer management')
    } finally {
      setSaving(false)
    }
  }

  function printReceipt(payment: any) {
    if (!payment?.id) {
      alert('Save this payment first before printing an A4 receipt.')
      return
    }
    previewPdf(`/api/academy/trainers/${trainerId}/payments/${payment.id}/receipt/pdf`)
  }

  const trainerLabel = trainerName(liveTrainer)
  const paidTotal = Number(totals.paid_total || payments.filter((p: any) => p.status === 'paid').reduce((sum: number, p: any) => sum + Number(p.amount_dhs || 0), 0))
  const pendingTotal = Number(totals.pending_total || payments.filter((p: any) => p.status === 'pending').reduce((sum: number, p: any) => sum + Number(p.amount_dhs || 0), 0))
  const rejectedTotal = Number(totals.rejected_total || payments.filter((p: any) => p.status === 'rejected').reduce((sum: number, p: any) => sum + Number(p.amount_dhs || 0), 0))

  return (
    <div className="fixed inset-0 z-[10000] overflow-y-auto bg-slate-950/55 px-4 py-6 backdrop-blur-md">
      <div className="mx-auto flex min-h-[92vh] w-full max-w-[1780px] flex-col overflow-hidden rounded-[2.4rem] border border-white/70 bg-white shadow-[0_45px_140px_rgba(15,23,42,0.38)]">
        <header className="flex flex-wrap items-center justify-between gap-5 border-b border-slate-100 bg-white px-7 py-5">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-3xl bg-blue-50 text-xl font-black text-blue-700">{trainerInitials(trainerLabel)}</span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">Existing Trainer Management</p>
              <h2 className="text-3xl font-black tracking-[-0.04em] text-slate-950">{trainerLabel}</h2>
              <p className="mt-1 text-sm font-bold text-slate-500">Live cohorts, operations, payments, receipts, audit and trainer delivery control.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={loadManagement} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm">Refresh Live</button>
            <button onClick={addPayment} className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700 shadow-sm">+ Payment</button>
            <button onClick={addNote} className="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-3 text-sm font-black text-violet-700 shadow-sm">+ Ops Note</button>
            <button onClick={onEditDossier} className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-xl shadow-blue-200">Edit Dossier</button>
            <button onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-700">Close</button>
          </div>
        </header>

        <section className="grid gap-3 border-b border-slate-100 bg-slate-50 px-7 py-4 md:grid-cols-3 xl:grid-cols-7">
          <OpsKpi label="Live Cohorts" value={totals.live_cohorts || cohorts.length} tone="blue" />
          <OpsKpi label="Ongoing" value={totals.ongoing || 0} tone="emerald" />
          <OpsKpi label="Upcoming" value={totals.upcoming || 0} tone="violet" />
          <OpsKpi label="Finished" value={totals.finished || 0} tone="slate" />
          <OpsKpi label="Paid" value={`${paidTotal.toLocaleString('fr-MA')} Dhs`} tone="emerald" />
          <OpsKpi label="Pending" value={`${pendingTotal.toLocaleString('fr-MA')} Dhs`} tone="amber" />
          <OpsKpi label="Next Due" value={totals.next_payment_due || '—'} tone="red" />
        </section>

        <div className="grid min-h-0 flex-1 grid-cols-[250px_minmax(0,1fr)_340px] gap-5 overflow-auto bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
          <aside className="space-y-4">
            {[
              ['overview', 'Command Overview', 'Trainer control room'],
              ['cohorts', 'Cohorts & Delivery', 'Ongoing, upcoming, finished'],
              ['payments', 'Payments Control', 'Cohorts, models, receipts'],
              ['notes', 'Operational Notes', 'Admin, pay, absence, query'],
              ['receipt', 'Receipt & Audit', 'Preview and financial tracking'],
              ['dossier', 'Trainer Dossier', 'Profile snapshot'],
            ].map(([key, title, subtitle]) => (
              <button key={key} onClick={() => setTab(key as any)} className={`w-full rounded-2xl border px-4 py-4 text-left transition ${tab === key ? 'border-blue-200 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                <span className="block text-sm font-black text-slate-950">{title}</span>
                <span className="text-xs font-bold text-slate-500">{subtitle}</span>
              </button>
            ))}

            <ManagementPanel title="Trainer Snapshot">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{liveTrainer.seniority_level || 'Trainer'}</p>
              <p className="mt-2 text-sm font-black text-slate-950">{liveTrainer.email || 'No email'}</p>
              <p className="text-xs font-bold text-slate-500">{liveTrainer.mobile || liveTrainer.phone || 'No phone'}</p>
              <span className="mt-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{liveTrainer.status || liveTrainer.availability_status || 'available'}</span>
            </ManagementPanel>
          </aside>

          <section className="min-w-0 space-y-5">
            {loading && <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center text-sm font-black text-slate-500">Loading live trainer management data…</div>}

            {!loading && tab === 'overview' && (
              <>
                <div className="grid gap-5 xl:grid-cols-3">
                  <ManagementPanel title="Delivery Health">
                    <div className="grid grid-cols-2 gap-3">
                      <MetricBox label="Assigned Cohorts" value={cohorts.length} />
                      <MetricBox label="Assignments" value={totals.assignments || 0} />
                      <MetricBox label="Ops Notes" value={notes.length} />
                      <MetricBox label="Rejected Pay" value={`${rejectedTotal.toLocaleString('fr-MA')} Dhs`} />
                    </div>
                  </ManagementPanel>
                  <ManagementPanel title="Payment Intelligence"><PaymentBar paid={paidTotal} pending={pendingTotal} rejected={rejectedTotal} /></ManagementPanel>
                  <ManagementPanel title="Operational Risk">
                    <div className="space-y-3">
                      <RiskLine label="Pending payments" value={payments.filter((p: any) => p.status === 'pending').length} tone="amber" />
                      <RiskLine label="Rejected payments" value={payments.filter((p: any) => p.status === 'rejected').length} tone="red" />
                      <RiskLine label="Open notes" value={notes.filter((n: any) => n.status !== 'closed').length} tone="blue" />
                    </div>
                  </ManagementPanel>
                </div>
                <ManagementPanel title="Latest Cohort Activity"><CohortTable cohorts={cohorts.slice(0, 6)} detailed /></ManagementPanel>
              </>
            )}

            {!loading && tab === 'cohorts' && <ManagementPanel title="Live Cohorts & Training Delivery"><CohortTable cohorts={cohorts} detailed /></ManagementPanel>}

            {!loading && tab === 'payments' && (
              <ManagementPanel title="Enterprise Trainer Payment Control">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-bold text-slate-500">Select cohort, linked program and saved compensation model. Amount auto-fills and can be manually overridden.</p>
                  <button onClick={addPayment} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">+ Add Payment Row</button>
                </div>
                <div className="space-y-4">
                  {payments.map((payment: any, index: number) => {
                    const cohort = cohortById(payment.cohort_id)
                    const models = modelsForCohort(payment.cohort_id)
                    const tierOptions = Array.from(new Set([20, 30, 50, ...models.map((model: any) => Number(model.participant_tier || 0)).filter(Boolean)])).map(String)
                    return (
                      <article key={`payment-row-${payment.id || payment.local_id || index}`} className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-4 shadow-sm">
                        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-500">{payment.reference_number || payment.payment_reference || 'Unsaved payment'}</p>
                            <h4 className="mt-1 text-lg font-black text-slate-950">{payment.label || payment.compensation_model_label || 'Trainer payment'}</h4>
                            <p className="text-xs font-bold text-slate-500">Audit: {payment.audit_code || 'Generated on save'} · {cohort?.reference_number || payment.cohort_reference || 'No cohort selected'}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => { setPreviewPayment(payment); setTab('receipt') }} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700">Preview</button>
                            <button onClick={() => printReceipt(payment)} className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">Print A4</button>
                            <button onClick={() => removePayment(index)} className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-600">Remove</button>
                          </div>
                        </div>
                        <div className="grid gap-3 xl:grid-cols-4">
                          <SmallSelect label="Linked Cohort" value={String(payment.cohort_id || '')} options={['', ...cohorts.map((c: any) => String(c.id))]} onChange={(value) => updatePayment(index, 'cohort_id', value)} />
                          <ReadonlyMini label="Cohort / Program" value={`${payment.cohort_reference || cohort?.reference_number || '—'} · ${payment.program_title || cohort?.program_title || '—'}`} />
                          <SmallSelect label="Compensation Model" value={payment.compensation_model_key || ''} options={['', ...models.map((model: any) => String(model.key))]} onChange={(value) => updatePayment(index, 'compensation_model_key', value)} />
                          <SmallSelect label="Participant Tier" value={String(payment.participant_tier || '')} options={['', ...tierOptions]} onChange={(value) => updatePayment(index, 'participant_tier', value)} />
                          <SmallInput label="Amount Dhs" value={String(payment.amount_dhs || '')} onChange={(value) => updatePayment(index, 'amount_dhs', value)} />
                          <SmallSelect label="Status" value={payment.status || 'pending'} options={['pending', 'paid', 'rejected', 'cancelled']} onChange={(value) => updatePayment(index, 'status', value)} />
                          <SmallInput label="Due Date" value={payment.due_date || ''} onChange={(value) => updatePayment(index, 'due_date', value)} />
                          <SmallInput label="Paid Date" value={payment.paid_date || ''} onChange={(value) => updatePayment(index, 'paid_date', value)} />
                          <SmallSelect label="Payment Method" value={payment.payment_method || ''} options={['', 'Cash', 'Bank Transfer', 'Cheque', 'Wallet', 'Other']} onChange={(value) => updatePayment(index, 'payment_method', value)} />
                          <SmallInput label="Method Details" value={payment.payment_details || ''} onChange={(value) => updatePayment(index, 'payment_details', value)} />
                          <SmallInput label="Finance Note" value={payment.finance_note || ''} onChange={(value) => updatePayment(index, 'finance_note', value)} />
                          <ReadonlyMini label="Override" value={payment.manual_override ? 'Manual amount override' : 'Synced from program model'} />
                        </div>
                        {!models.length && payment.cohort_id && <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-black text-amber-700">No compensation model configured for this program. Manual amount is allowed and will be tracked as override.</p>}
                      </article>
                    )
                  })}
                  {!payments.length && <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm font-black text-slate-400">No payment records yet. Add one or more trainer compensation rows linked to live cohorts.</div>}
                </div>
              </ManagementPanel>
            )}

            {!loading && tab === 'notes' && (
              <ManagementPanel title="Operational Notes & Trainer Follow-up">
                <div className="mb-4 flex justify-end"><button onClick={addNote} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">+ Add Operational Note</button></div>
                <div className="space-y-3">
                  {notes.map((note: any, index: number) => (
                    <div key={`note-row-${note.id || note.local_id || index}`} className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 xl:grid-cols-[160px_130px_160px_1fr_44px]">
                      <SmallSelect label="Category" value={note.category || 'admin'} options={['admin', 'pay', 'query', 'absence', 'incident', 'performance', 'scheduling', 'compliance', 'other']} onChange={(value) => updateNote(index, 'category', value)} />
                      <SmallSelect label="Priority" value={note.priority || 'normal'} options={['low', 'normal', 'high']} onChange={(value) => updateNote(index, 'priority', value)} />
                      <SmallSelect label="Linked Cohort" value={String(note.cohort_id || '')} options={['', ...cohorts.map((c: any) => String(c.id))]} onChange={(value) => updateNote(index, 'cohort_id', value)} />
                      <label><span className="text-xs font-black text-slate-500">Note</span><textarea value={note.note || ''} onChange={(event) => updateNote(index, 'note', event.target.value)} className="mt-2 min-h-[72px] w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-bold outline-none" /></label>
                      <button onClick={() => removeNote(index)} className="self-end rounded-2xl bg-red-50 px-3 py-3 text-sm font-black text-red-600">×</button>
                    </div>
                  ))}
                  {!notes.length && <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm font-black text-slate-400">No operational notes yet. Add admin, pay, query, absence, incident or scheduling remarks.</div>}
                </div>
              </ManagementPanel>
            )}

            {!loading && tab === 'receipt' && (
              <ManagementPanel title="Receipt Preview & Audit Trail">
                <ReceiptPreview payment={previewPayment || payments[0]} trainer={liveTrainer} cohort={cohortById((previewPayment || payments[0])?.cohort_id)} onPrint={() => printReceipt(previewPayment || payments[0])} />
              </ManagementPanel>
            )}

            {!loading && tab === 'dossier' && (
              <ManagementPanel title="Trainer Dossier Snapshot">
                <div className="grid gap-3 md:grid-cols-2">
                  <ReadonlyMini label="Trainer Code" value={liveTrainer.trainer_code || liveTrainer.id} />
                  <ReadonlyMini label="Professional Title" value={liveTrainer.professional_title || 'Registered Trainer'} />
                  <ReadonlyMini label="Main Specialty" value={liveTrainer.main_specialty || liveTrainer.specialty || 'General Training'} />
                  <ReadonlyMini label="Availability" value={liveTrainer.availability_status || liveTrainer.status || 'available'} />
                  <ReadonlyMini label="Readiness" value={`${Number(liveTrainer.readiness_score || 0)}%`} />
                  <ReadonlyMini label="Dispatch Score" value={liveTrainer.dispatch_score || 0} />
                </div>
              </ManagementPanel>
            )}
          </section>

          <aside className="space-y-5">
            <ManagementPanel title="Live Control Actions">
              <div className="grid gap-3">
                <button onClick={() => setTab('cohorts')} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-black hover:bg-blue-50">Open Cohorts Control</button>
                <button onClick={() => setTab('payments')} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-black hover:bg-emerald-50">Manage Payments</button>
                <button onClick={() => setTab('notes')} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-black hover:bg-violet-50">Add Operational Note</button>
                <button onClick={onEditDossier} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-black hover:bg-slate-50">Edit Trainer Dossier</button>
              </div>
            </ManagementPanel>
            <ManagementPanel title="Payment Status">
              <div className="space-y-3">
                <StatusCount label="Paid" value={payments.filter((p: any) => p.status === 'paid').length} tone="emerald" />
                <StatusCount label="Pending" value={payments.filter((p: any) => p.status === 'pending').length} tone="amber" />
                <StatusCount label="Rejected" value={payments.filter((p: any) => p.status === 'rejected').length} tone="red" />
              </div>
            </ManagementPanel>
            <ManagementPanel title="Save Operations">
              <p className="text-xs font-bold text-slate-500">Saves payment rows and operational notes to live database with payment references and audit codes.</p>
              <button onClick={saveManagement} disabled={saving} className="mt-4 w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-xl shadow-blue-200 disabled:opacity-50">{saving ? 'Saving live updates…' : 'Save Live Updates'}</button>
            </ManagementPanel>
          </aside>
        </div>
      </div>
    </div>
  )
}

function ReadonlyMini({ label, value }: { label: string; value: any }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-3"><span className="block text-xs font-black text-slate-500">{label}</span><strong className="mt-1 block text-sm font-black text-slate-950">{value || '—'}</strong></div>
}

function ReceiptPreview({ payment, trainer, cohort, onPrint }: { payment: any; trainer: any; cohort: any; onPrint: () => void }) {
  if (!payment) return <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm font-black text-slate-400">Select or create a payment row to preview the enterprise receipt.</div>
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
        <div><p className="text-xs font-black uppercase tracking-[0.2em] text-blue-500">Trainer Payment Receipt</p><h3 className="mt-1 text-2xl font-black text-slate-950">{payment.reference_number || payment.payment_reference || 'Unsaved receipt'}</h3><p className="text-sm font-bold text-slate-500">Audit: {payment.audit_code || 'Generated after save'}</p></div>
        <button onClick={onPrint} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">Print A4 Receipt</button>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <ReadonlyMini label="Trainer" value={trainer?.full_name || trainer?.name || trainer?.email} />
        <ReadonlyMini label="Amount" value={`${Number(payment.amount_dhs || 0).toLocaleString('fr-MA')} Dhs`} />
        <ReadonlyMini label="Cohort" value={`${payment.cohort_reference || cohort?.reference_number || '—'} · ${payment.cohort_title || cohort?.title || '—'}`} />
        <ReadonlyMini label="Program" value={payment.program_title || cohort?.program_title || '—'} />
        <ReadonlyMini label="Model" value={payment.compensation_model_label || payment.label || '—'} />
        <ReadonlyMini label="Status" value={payment.status || 'pending'} />
        <ReadonlyMini label="Due / Paid" value={`${payment.due_date || '—'} / ${payment.paid_date || payment.paid_at || '—'}`} />
        <ReadonlyMini label="Method" value={`${payment.payment_method || '—'} · ${payment.payment_details || ''}`} />
      </div>
      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-600">{payment.finance_note || payment.rejected_reason || 'No finance note recorded.'}</div>
    </div>
  )
}

function OpsKpi({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  const toneClass: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    violet: 'bg-violet-50 text-violet-700 border-violet-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    slate: 'bg-slate-50 text-slate-700 border-slate-100',
  }

  return (
    <article className={`rounded-[1.7rem] border p-4 ${toneClass[tone] || toneClass.blue}`}>
      <p className="text-xs font-black uppercase tracking-[0.18em] opacity-70">{label}</p>
      <strong className="mt-2 block text-2xl font-black">{value}</strong>
    </article>
  )
}

function ManagementPanel({ title, children }: { title: string; children: any }) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-black tracking-[-0.03em] text-slate-950">{title}</h3>
      {children}
    </section>
  )
}

function CohortTable({ cohorts, detailed = false }: { cohorts: any[]; detailed?: boolean }) {
  if (!cohorts.length) {
    return <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-black text-slate-400">No cohorts linked to this trainer yet.</div>
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
          <tr>
            <th className="px-4 py-3">Cohort</th>
            <th className="px-4 py-3">Program</th>
            <th className="px-4 py-3">Dates</th>
            <th className="px-4 py-3">Seats</th>
            <th className="px-4 py-3">Readiness</th>
            <th className="px-4 py-3">Live Status</th>
            {detailed && <th className="px-4 py-3">Progress</th>}
          </tr>
        </thead>
        <tbody>
          {cohorts.map((cohort, index) => (
            <tr key={`cohort-management-${cohort.id || index}`} className="border-t border-slate-100">
              <td className="px-4 py-3 font-black">{cohort.title || cohort.reference_number || `Cohort ${cohort.id}`}</td>
              <td className="px-4 py-3 font-bold text-slate-500">{cohort.program_title || cohort.program_name || '—'}</td>
              <td className="px-4 py-3 font-bold text-slate-500">{cohort.start_date || '—'} → {cohort.end_date || '—'}</td>
              <td className="px-4 py-3 font-bold">{cohort.capacity || '—'}</td>
              <td className="px-4 py-3 font-bold">{cohort.readiness_score || 0}%</td>
              <td className="px-4 py-3">
                <span className={
                  cohort.live_status === 'ongoing'
                    ? 'rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700'
                    : cohort.live_status === 'finished'
                      ? 'rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600'
                      : 'rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700'
                }>
                  {cohort.live_status || cohort.status || 'upcoming'}
                </span>
              </td>
              {detailed && <td className="px-4 py-3 font-bold">{cohort.progression_percent || 0}%</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PaymentBar({ paid, pending, rejected }: { paid: number; pending: number; rejected: number }) {
  const total = Math.max(1, Number(paid) + Number(pending) + Number(rejected))
  return (
    <div>
      <div className="flex overflow-hidden rounded-full bg-slate-100">
        <div className="h-4 bg-emerald-500" style={{ width: `${(paid / total) * 100}%` }} />
        <div className="h-4 bg-amber-400" style={{ width: `${(pending / total) * 100}%` }} />
        <div className="h-4 bg-red-500" style={{ width: `${(rejected / total) * 100}%` }} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <StatusCount label="Paid" value={`${Number(paid).toLocaleString('fr-MA')} Dhs`} tone="emerald" />
        <StatusCount label="Pending" value={`${Number(pending).toLocaleString('fr-MA')} Dhs`} tone="amber" />
        <StatusCount label="Rejected" value={`${Number(rejected).toLocaleString('fr-MA')} Dhs`} tone="red" />
      </div>
    </div>
  )
}

function StatusCount({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  const cls: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    blue: 'bg-blue-50 text-blue-700',
  }

  return (
    <div className={`rounded-2xl p-4 ${cls[tone] || cls.blue}`}>
      <span className="block text-xs font-black">{label}</span>
      <strong className="mt-1 block text-lg font-black">{value}</strong>
    </div>
  )
}

function RiskLine({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
      <span className="text-sm font-black">{label}</span>
      <span className={tone === 'red' ? 'text-sm font-black text-red-600' : tone === 'amber' ? 'text-sm font-black text-amber-600' : 'text-sm font-black text-blue-600'}>
        {value}
      </span>
    </div>
  )
}

function SmallInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="text-xs font-black text-slate-500">{label}</span>
      <input value={value || ''} onChange={(event) => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-blue-400" />
    </label>
  )
}

function SmallSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="text-xs font-black text-slate-500">{label}</span>
      <select value={value || ''} onChange={(event) => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-blue-400">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  )
}


function TrainerModal({
  mode,
  form,
  setForm,
  activeTrainer,
  saving,
  onClose,
  onEdit,
  onSave,
}: {
  mode: 'create' | 'view' | 'edit'
  form: any
  setForm: (value: any) => void
  activeTrainer: Trainer | null
  saving: boolean
  onClose: () => void
  onEdit: () => void
  onSave: () => void
}) {
  const locked = mode === 'view'
  const trainerRecord: any = activeTrainer || {}
  const [programs, setPrograms] = useState<any[]>([])
  const [newLanguage, setNewLanguage] = useState('')
  const [newRegion, setNewRegion] = useState('')

  function arr(key: string, fallback: any[] = []) {
    const formValue = form?.[key]
    const recordValue = trainerRecord?.[key]
    if (Array.isArray(formValue)) return formValue
    if (Array.isArray(recordValue)) return recordValue
    return fallback
  }

  const languages = arr('languages', ['French', 'Arabic'])
  const certifications = arr('certifications', [])
  const documents = arr('documents', [])
  const verifications = {
    medical: form?.verification_medical || trainerRecord?.verification_medical || 'pending',
    background: form?.verification_background || trainerRecord?.verification_background || 'pending',
    id: form?.verification_id || trainerRecord?.verification_id || 'pending',
    reference: form?.verification_reference || trainerRecord?.verification_reference || 'pending',
  }
  const assignedPrograms = arr('assigned_programs', [])
  const regions = arr('regions_covered_list', [])
  const preferredDays = arr('preferred_days', ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
  const timeSlots = arr('preferred_time_slots', [{ label: 'Main Slot', start: '09:00', end: '17:00' }])
  const paymentMethods = arr('payment_methods', [{ method: 'Bank Transfer', details: '', priority: 'Primary' }])
  const internalNotes = arr('internal_notes', [])

  const reference = trainerRecord?.trainer_code || form.trainer_code || 'TRN-2026-00087'
  const previewName = form.full_name || trainerName(activeTrainer || ({ id: 'new', full_name: 'New Trainer' } as Trainer))
  const readiness = Number(form.readiness_score || trainerRecord?.readiness_score || 0)
  const dispatch = Number(form.dispatch_score || trainerRecord?.dispatch_score || 0)
  const utilization = Number(trainerRecord?.utilization_rate || trainerRecord?.current_load || 0)

  useEffect(() => {
    let mounted = true

    async function loadPrograms() {
      const attempts = ['/api/academy/trainer-program-options', '/api/academy/programs', '/api/academy/courses']
      for (const url of attempts) {
        try {
          const response = await fetch(url, { cache: 'no-store' })
          const json = await response.json().catch(() => ({}))
          const rows = json?.data || json?.programs || json?.courses || json?.items || []
          if (mounted && Array.isArray(rows)) {
            setPrograms(rows)
            return
          }
        } catch {}
      }
      if (mounted) setPrograms([])
    }

    loadPrograms()
    return () => {
      mounted = false
    }
  }, [])

  function update(key: string, value: any) {
    setForm({ ...form, [key]: value })
  }

  function setArray(key: string, value: any[]) {
    setForm({ ...form, [key]: value })
  }

  function addLanguage() {
    const value = newLanguage.trim()
    if (!value || languages.includes(value)) return
    setArray('languages', [...languages, value])
    setNewLanguage('')
  }

  function removeLanguage(value: string) {
    setArray('languages', languages.filter((item: string) => item !== value))
  }

  function addCertification() {
    setArray('certifications', [
      ...certifications,
      {
        title: '',
        issuer: '',
        expiry_date: '',
        status: 'valid',
        reference: '',
      },
    ])
  }

  function updateCertification(index: number, key: string, value: any) {
    setArray('certifications', certifications.map((item: any, i: number) => i === index ? { ...item, [key]: value } : item))
  }

  function removeCertification(index: number) {
    setArray('certifications', certifications.filter((_: any, i: number) => i !== index))
  }

  function addDocument() {
    setArray('documents', [
      ...documents,
      {
        type: 'Document',
        title: '',
        url: '',
        status: 'pending',
      },
    ])
  }

  function updateDocument(index: number, key: string, value: any) {
    setArray('documents', documents.map((item: any, i: number) => i === index ? { ...item, [key]: value } : item))
  }

  function removeDocument(index: number) {
    setArray('documents', documents.filter((_: any, i: number) => i !== index))
  }

  function setVerification(key: string, value: string) {
    update(`verification_${key}`, value)
  }

  function addProgram(programId: string) {
    if (!programId) return
    const program = programs.find((item: any) => String(item.id) === String(programId))
    const already = assignedPrograms.some((item: any) => String(item.program_id) === String(programId))
    if (!program || already) return

    setArray('assigned_programs', [
      ...assignedPrograms,
      {
        program_id: program.id,
        title: program.title || program.name || program.program_name || 'Registered Program',
        reference_number: program.reference_number || program.reference || '',
        price_20: '',
        price_30: '',
        price_50: '',
      },
    ])
  }

  function updateProgram(index: number, key: string, value: any) {
    setArray('assigned_programs', assignedPrograms.map((item: any, i: number) => i === index ? { ...item, [key]: value } : item))
  }

  function removeProgram(index: number) {
    setArray('assigned_programs', assignedPrograms.filter((_: any, i: number) => i !== index))
  }

  function addRegion() {
    const value = newRegion.trim()
    if (!value || regions.includes(value)) return
    setArray('regions_covered_list', [...regions, value])
    setNewRegion('')
  }

  function removeRegion(value: string) {
    setArray('regions_covered_list', regions.filter((item: string) => item !== value))
  }

  function togglePreferredDay(day: string) {
    if (locked) return
    if (preferredDays.includes(day)) {
      setArray('preferred_days', preferredDays.filter((item: string) => item !== day))
    } else {
      setArray('preferred_days', [...preferredDays, day])
    }
  }

  function addTimeSlot() {
    setArray('preferred_time_slots', [...timeSlots, { label: `Slot ${timeSlots.length + 1}`, start: '09:00', end: '17:00' }])
  }

  function updateTimeSlot(index: number, key: string, value: any) {
    setArray('preferred_time_slots', timeSlots.map((item: any, i: number) => i === index ? { ...item, [key]: value } : item))
  }

  function removeTimeSlot(index: number) {
    setArray('preferred_time_slots', timeSlots.filter((_: any, i: number) => i !== index))
  }

  function addPaymentMethod() {
    setArray('payment_methods', [...paymentMethods, { method: '', details: '', priority: 'Secondary' }])
  }

  function updatePaymentMethod(index: number, key: string, value: any) {
    setArray('payment_methods', paymentMethods.map((item: any, i: number) => i === index ? { ...item, [key]: value } : item))
  }

  function removePaymentMethod(index: number) {
    setArray('payment_methods', paymentMethods.filter((_: any, i: number) => i !== index))
  }

  function addInternalNote() {
    setArray('internal_notes', [
      ...internalNotes,
      {
        category: 'admin',
        note: '',
        created_at: new Date().toISOString(),
      },
    ])
  }

  function updateInternalNote(index: number, key: string, value: any) {
    setArray('internal_notes', internalNotes.map((item: any, i: number) => i === index ? { ...item, [key]: value } : item))
  }

  function removeInternalNote(index: number) {
    setArray('internal_notes', internalNotes.filter((_: any, i: number) => i !== index))
  }

  return (
    <div className="fixed inset-0 z-[10000] overflow-y-auto bg-slate-950/45 px-4 py-6 backdrop-blur-md">
      <div className="mx-auto flex min-h-[92vh] w-full max-w-[1780px] flex-col overflow-hidden rounded-[2.2rem] border border-white/70 bg-white shadow-[0_40px_120px_rgba(15,23,42,0.35)]">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-white/95 px-7 py-5">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-3xl bg-blue-50 text-2xl text-blue-700 ring-1 ring-blue-100">♟</div>
            <div>
              <h2 className="text-3xl font-black tracking-[-0.04em] text-slate-950">
                {mode === 'create' ? 'Add New Trainer' : mode === 'edit' ? 'Edit Trainer Dossier' : 'Trainer Dossier'}
              </h2>
              <p className="mt-1 text-sm font-bold text-slate-500">Create and configure a complete trainer dossier</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <span className="text-xs font-black text-slate-500">Reference #</span>
              <strong className="text-sm font-black text-slate-950">{reference}</strong>
              <button type="button" onClick={() => navigator.clipboard?.writeText(reference)} className="rounded-lg bg-slate-50 px-2 py-1 text-xs font-black text-slate-500">⧉</button>
            </div>

            {mode !== 'view' && (
              <button type="button" onClick={onSave} disabled={saving} className="rounded-2xl border border-blue-200 bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-sm disabled:opacity-50">
                Save Draft
              </button>
            )}

            {mode === 'view' ? (
              <button type="button" onClick={onEdit} className="rounded-2xl bg-blue-600 px-7 py-3 text-sm font-black text-white shadow-xl shadow-blue-200">Edit</button>
            ) : (
              <button type="button" onClick={onSave} disabled={saving} className="rounded-2xl bg-blue-600 px-7 py-3 text-sm font-black text-white shadow-xl shadow-blue-200 disabled:opacity-50">
                {saving ? 'Saving…' : mode === 'create' ? 'Create Trainer' : 'Save Changes'}
              </button>
            )}

            <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-700 shadow-sm">Close</button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-[250px_minmax(0,1fr)_340px] gap-5 overflow-auto bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
          <aside className="space-y-3">
            {[
              ['1', 'Identity & Profile', 'Personal information'],
              ['2', 'Status & Classification', 'Role and capabilities'],
              ['3', 'Certificates & Documents', 'Compliance uploads'],
              ['4', 'Programs & Pricing', 'Courses and ranges'],
              ['5', 'Regions & Delivery', 'Coverage and formats'],
              ['6', 'Availability & Dispatch', 'Days, slots and capacity'],
              ['7', 'Payment Handover', 'Methods and details'],
              ['8', 'Admin Notes', 'Internal remarks'],
            ].map(([number, title, subtitle], index) => (
              <button type="button" key={title} className={index === 0 ? 'flex w-full items-start gap-3 rounded-2xl bg-blue-50 p-4 text-left text-blue-800 ring-1 ring-blue-100' : 'flex w-full items-start gap-3 rounded-2xl bg-white p-4 text-left text-slate-700 ring-1 ring-slate-100 hover:bg-slate-50'}>
                <span className="grid h-7 w-7 place-items-center rounded-xl bg-white text-xs font-black shadow-sm">{number}</span>
                <span>
                  <strong className="block text-sm font-black">{title}</strong>
                  <small className="mt-1 block text-xs font-bold opacity-70">{subtitle}</small>
                </span>
              </button>
            ))}
          </aside>

          <section className="space-y-5">
            <DossierPanel number="1" title="Identity & Profile">
              <div className="grid gap-5 xl:grid-cols-[170px_1fr]">
                <div className="grid min-h-[145px] place-items-center rounded-3xl border border-dashed border-blue-200 bg-blue-50 text-center ring-1 ring-blue-100">
                  <div>
                    <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-2xl bg-white text-2xl text-blue-600 shadow-sm">⇧</div>
                    <strong className="text-sm font-black text-blue-700">Upload photo</strong>
                    <p className="mt-2 text-xs font-bold text-slate-500">JPG, PNG max 5MB</p>
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-4">
                  <SmartField label="Full Name" required value={form.full_name} locked={locked} onChange={(v) => update('full_name', v)} />
                  <SmartField label="Trainer Code" required value={trainerRecord?.trainer_code || 'Auto generated'} locked />
                  <SmartField label="Professional Title" required value={form.professional_title} locked={locked} onChange={(v) => update('professional_title', v)} />
                  <SmartSelect label="Gender" value={form.gender || ''} locked={locked} options={['', 'Female', 'Male']} onChange={(v) => update('gender', v)} />
                  <SmartField label="Mobile" value={form.mobile} locked={locked} onChange={(v) => update('mobile', v)} />
                  <SmartField label="Email" required value={form.email} locked={locked} onChange={(v) => update('email', v)} />
                  <SmartField label="City / Base Location" required value={form.city} locked={locked} onChange={(v) => update('city', v)} />

                  <div>
                    <span className="text-xs font-black text-slate-600">Spoken Languages</span>
                    <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-2">
                      <div className="flex flex-wrap gap-2">
                        {languages.map((language: string) => (
                          <span key={language} className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
                            {language}
                            {!locked && <button type="button" onClick={() => removeLanguage(language)} className="text-red-500">×</button>}
                          </span>
                        ))}
                      </div>
                      {!locked && (
                        <div className="mt-2 flex gap-2">
                          <input value={newLanguage} onChange={(e) => setNewLanguage(e.target.value)} placeholder="Add language" className="h-9 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-xs font-bold outline-none" />
                          <button type="button" onClick={addLanguage} className="rounded-xl bg-blue-600 px-3 text-xs font-black text-white">Add</button>
                        </div>
                      )}
                    </div>
                  </div>

                  <label className="xl:col-span-4">
                    <span className="text-xs font-black text-slate-600">Short Professional Bio</span>
                    <textarea disabled={locked} value={form.bio || ''} onChange={(event) => update('bio', event.target.value)} placeholder="Experienced trainer with corporate learning, classroom delivery, and field coaching background..." className="mt-2 min-h-[78px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-400 disabled:bg-slate-50" />
                  </label>
                </div>
              </div>
            </DossierPanel>

            <DossierPanel number="2" title="Professional Status & Classification">
              <div className="grid gap-4 xl:grid-cols-6">
                <SmartSelect label="Employment Type" value={form.employment_type || 'internal'} locked={locked} options={['internal', 'external', 'freelance', 'partner']} onChange={(v) => update('employment_type', v)} />
                <SmartSelect label="Status" value={form.status} locked={locked} options={['available', 'active', 'inactive', 'unavailable', 'on leave']} onChange={(v) => update('status', v)} />
                <SmartSelect label="Seniority Level" value={form.seniority_level} locked={locked} options={['junior', 'intermediate', 'senior', 'expert']} onChange={(v) => update('seniority_level', v)} />
                <SmartField label="Main Specialty" required value={form.main_specialty} locked={locked} onChange={(v) => update('main_specialty', v)} />
                <SmartField label="Readiness %" value={String(readiness)} locked={locked} onChange={(v) => update('readiness_score', Number(v || 0))} />
                <SmartField label="Dispatch Score" value={String(dispatch)} locked={locked} onChange={(v) => update('dispatch_score', Number(v || 0))} />
              </div>
            </DossierPanel>

            <DossierPanel number="3" title="Certifications, Documents & Manual Verification">
              <div className="grid gap-5 xl:grid-cols-2">
                <DynamicCertifications locked={locked} rows={certifications} add={addCertification} update={updateCertification} remove={removeCertification} />
                <DynamicDocuments locked={locked} rows={documents} add={addDocument} update={updateDocument} remove={removeDocument} />
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-4">
                {[
                  ['medical', 'Medical Fitness'],
                  ['background', 'Background Check'],
                  ['id', 'ID Verification'],
                  ['reference', 'Reference Check'],
                ].map(([key, label]) => (
                  <VerificationControl key={key} label={label} value={(verifications as any)[key]} locked={locked} onChange={(value) => setVerification(key, value)} />
                ))}
              </div>
            </DossierPanel>

            <DossierPanel number="4" title="Assigned Programs / Courses & Participant Price Ranges">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-bold text-slate-500">Assign one or multiple registered programs and define compensation ranges by cohort size.</p>
                {!locked && (
                  <select onChange={(event) => { addProgram(event.target.value); event.currentTarget.value = '' }} className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black">
                    <option value="">+ Add registered program</option>
                    {programs.map((program: any) => (
                      <option key={program.id} value={program.id}>{program.title || program.name || program.program_name || `Program ${program.id}`}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-3">
                {assignedPrograms.map((program: any, index: number) => (
                  <div key={`${program.program_id || index}-${program.title}`} className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 xl:grid-cols-[1fr_130px_130px_130px_44px]">
                    <div>
                      <strong className="block text-sm font-black">{program.title}</strong>
                      <span className="text-xs font-bold text-slate-500">{program.reference_number || 'Registered course'}</span>
                    </div>
                    <SmartField label="20 participants" value={String(program.price_20 || '')} locked={locked} onChange={(v) => updateProgram(index, 'price_20', v)} />
                    <SmartField label="30 participants" value={String(program.price_30 || '')} locked={locked} onChange={(v) => updateProgram(index, 'price_30', v)} />
                    <SmartField label="50 participants" value={String(program.price_50 || '')} locked={locked} onChange={(v) => updateProgram(index, 'price_50', v)} />
                    {!locked && <button type="button" onClick={() => removeProgram(index)} className="self-end rounded-2xl bg-red-50 px-3 py-3 text-sm font-black text-red-600">×</button>}
                  </div>
                ))}
                {!assignedPrograms.length && <EmptyState text="No assigned programs yet." />}
              </div>
            </DossierPanel>

            <DossierPanel number="5" title="Regions Covered & Delivery Capability">
              <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-black">Regions Covered</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {regions.map((region: string) => (
                      <span key={region} className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                        {region}
                        {!locked && <button type="button" onClick={() => removeRegion(region)} className="text-red-500">×</button>}
                      </span>
                    ))}
                  </div>
                  {!locked && (
                    <div className="mt-3 flex gap-2">
                      <input value={newRegion} onChange={(e) => setNewRegion(e.target.value)} placeholder="Add region, city or area" className="h-11 min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 text-sm font-bold outline-none" />
                      <button type="button" onClick={addRegion} className="rounded-2xl bg-blue-600 px-4 text-sm font-black text-white">Add</button>
                    </div>
                  )}
                </div>

                <div className="grid gap-3 xl:grid-cols-3">
                  <SmartField label="Programs Qualified" value={form.programs_qualified || '12 Programs'} locked={locked} onChange={(v) => update('programs_qualified', v)} />
                  <SmartField label="Max Hours / Day" value={form.max_hours_day || '6'} locked={locked} onChange={(v) => update('max_hours_day', v)} />
                  <SmartField label="Delivery Formats" value={form.delivery_formats || 'Onsite, Online, Hybrid'} locked={locked} onChange={(v) => update('delivery_formats', v)} />
                </div>
              </div>
            </DossierPanel>

            <DossierPanel number="6" title="Availability, Preferred Days, Time Slots & Weekly Capacity">
              <div className="grid gap-5 xl:grid-cols-[1fr_1.2fr_180px]">
                <div>
                  <p className="mb-3 text-xs font-black text-slate-500">Preferred Days</p>
                  <div className="grid grid-cols-7 gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                      const active = preferredDays.includes(day)
                      return (
                        <button type="button" key={day} disabled={locked} onClick={() => togglePreferredDay(day)} className={active ? 'rounded-2xl bg-emerald-50 px-3 py-4 text-center text-xs font-black text-emerald-700 ring-1 ring-emerald-100' : 'rounded-2xl bg-slate-50 px-3 py-4 text-center text-xs font-black text-slate-400 ring-1 ring-slate-100'}>
                          {day}<br />{active ? '✓' : '—'}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-black text-slate-500">Preferred Time Slots</p>
                    {!locked && <button type="button" onClick={addTimeSlot} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white">+ Add slot</button>}
                  </div>
                  <div className="space-y-2">
                    {timeSlots.map((slot: any, index: number) => (
                      <div key={`slot-${index}`} className="grid grid-cols-[1fr_120px_120px_40px] gap-2 rounded-2xl bg-slate-50 p-3">
                        <SmartField label="Label" value={slot.label || ''} locked={locked} onChange={(v) => updateTimeSlot(index, 'label', v)} />
                        <SmartField label="Start" value={slot.start || ''} locked={locked} onChange={(v) => updateTimeSlot(index, 'start', v)} />
                        <SmartField label="End" value={slot.end || ''} locked={locked} onChange={(v) => updateTimeSlot(index, 'end', v)} />
                        {!locked && <button type="button" onClick={() => removeTimeSlot(index)} className="self-end rounded-xl bg-red-50 px-3 py-3 text-sm font-black text-red-600">×</button>}
                      </div>
                    ))}
                  </div>
                </div>

                <SmartField label="Weekly Capacity" value={String(form.weekly_capacity || 40)} locked={locked} onChange={(v) => update('weekly_capacity', Number(v || 0))} />
              </div>
            </DossierPanel>

            <DossierPanel number="7" title="Payment Handover Preference">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500">Add one or multiple payment methods and details. Remove rows when needed.</p>
                {!locked && <button type="button" onClick={addPaymentMethod} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white">+ Add method</button>}
              </div>
              <div className="space-y-3">
                {paymentMethods.map((payment: any, index: number) => (
                  <div key={`payment-${index}`} className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 xl:grid-cols-[180px_1fr_160px_44px]">
                    <SmartSelect label="Method" value={payment.method || ''} locked={locked} options={['', 'Cash', 'Bank Transfer', 'Cheque', 'Wallet', 'Other']} onChange={(v) => updatePaymentMethod(index, 'method', v)} />
                    <SmartField label="Details / Account / Handover Instructions" value={payment.details || ''} locked={locked} onChange={(v) => updatePaymentMethod(index, 'details', v)} />
                    <SmartSelect label="Priority" value={payment.priority || 'Secondary'} locked={locked} options={['Primary', 'Secondary', 'Emergency Only']} onChange={(v) => updatePaymentMethod(index, 'priority', v)} />
                    {!locked && <button type="button" onClick={() => removePaymentMethod(index)} className="self-end rounded-2xl bg-red-50 px-3 py-3 text-sm font-black text-red-600">×</button>}
                  </div>
                ))}
              </div>
            </DossierPanel>

            <DossierPanel number="8" title="Internal Notes & Remarks">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500">Add internal remarks by category: admin, pay, query, absence, compliance, performance, dispatch.</p>
                {!locked && <button type="button" onClick={addInternalNote} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white">+ Add note</button>}
              </div>
              <div className="space-y-3">
                {internalNotes.map((note: any, index: number) => (
                  <div key={`note-${index}`} className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 xl:grid-cols-[180px_1fr_44px]">
                    <SmartSelect label="Category" value={note.category || 'admin'} locked={locked} options={['admin', 'pay', 'query', 'absence', 'compliance', 'performance', 'dispatch', 'other']} onChange={(v) => updateInternalNote(index, 'category', v)} />
                    <label>
                      <span className="text-xs font-black text-slate-600">Remark / Note</span>
                      <textarea disabled={locked} value={note.note || ''} onChange={(e) => updateInternalNote(index, 'note', e.target.value)} className="mt-2 min-h-[76px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none disabled:bg-slate-50" />
                    </label>
                    {!locked && <button type="button" onClick={() => removeInternalNote(index)} className="self-end rounded-2xl bg-red-50 px-3 py-3 text-sm font-black text-red-600">×</button>}
                  </div>
                ))}
                {!internalNotes.length && <EmptyState text="No internal notes yet." />}
              </div>
            </DossierPanel>
          </section>

          <aside className="space-y-5">
            <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
              <p className="text-xs font-black text-slate-400">Trainer Summary Preview</p>
              <div className="mt-5 flex items-center gap-4">
                <span className="grid h-20 w-20 place-items-center rounded-full bg-blue-100 text-2xl font-black text-blue-700">{trainerInitials(previewName)}</span>
                <div>
                  <h3 className="text-2xl font-black tracking-[-0.04em]">{previewName}</h3>
                  <p className="text-sm font-bold text-slate-500">{form.professional_title || 'Registered Trainer'}</p>
                  <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{form.status || 'available'}</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-[120px_1fr] gap-5">
                <div className="grid h-28 w-28 place-items-center rounded-full border-[10px] border-emerald-400 bg-white text-center">
                  <div>
                    <strong className="block text-2xl font-black">{readiness}%</strong>
                    <span className="text-[10px] font-black text-emerald-600">Ready</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <ProgressLine label="Profile Completion" value={readiness} />
                  <ProgressLine label="Compliance" value={88} />
                  <ProgressLine label="Availability" value={85} />
                  <ProgressLine label="Documents" value={documents.length ? 90 : 0} />
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
              <p className="text-xs font-black text-slate-500">Dossier Completion</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <MetricBox label="Languages" value={languages.length} />
                <MetricBox label="Certifications" value={certifications.length} />
                <MetricBox label="Documents" value={documents.length} />
                <MetricBox label="Programs" value={assignedPrograms.length} />
                <MetricBox label="Regions" value={regions.length} />
                <MetricBox label="Pay Methods" value={paymentMethods.length} />
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
              <p className="text-xs font-black text-slate-500">Verification Snapshot</p>
              {[
                ['Medical', verifications.medical],
                ['Background', verifications.background],
                ['ID', verifications.id],
                ['Reference', verifications.reference],
              ].map(([label, value]) => (
                <div key={label} className="mt-3 flex justify-between rounded-2xl bg-slate-50 px-4 py-3 text-xs font-black">
                  <span>{label}</span>
                  <span className={value === 'verified' ? 'text-emerald-600' : value === 'not_needed' ? 'text-slate-500' : 'text-orange-600'}>{value}</span>
                </div>
              ))}
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}

function DossierPanel({ number, title, children }: { number: string; title: string; children: any }) {
  return (
    <section className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-7 w-7 place-items-center rounded-xl bg-blue-600 text-xs font-black text-white">{number}</span>
        <h3 className="text-sm font-black text-slate-950">{title}</h3>
      </div>
      {children}
    </section>
  )
}

function SmartField({ label, value, locked, required, onChange }: { label: string; value: string; locked?: boolean; required?: boolean; onChange?: (value: string) => void }) {
  return (
    <label>
      <span className="text-xs font-black text-slate-600">{label}{required && <b className="text-red-500"> *</b>}</span>
      <input disabled={locked} value={value || ''} onChange={(event) => onChange?.(event.target.value)} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none focus:border-blue-400 disabled:bg-slate-50" />
    </label>
  )
}

function SmartSelect({ label, value, options, locked, onChange }: { label: string; value: string; options: string[]; locked?: boolean; onChange?: (value: string) => void }) {
  return (
    <label>
      <span className="text-xs font-black text-slate-600">{label}</span>
      <select disabled={locked} value={value || ''} onChange={(event) => onChange?.(event.target.value)} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none focus:border-blue-400 disabled:bg-slate-50">
        {options.map((option) => <option key={option} value={option}>{option || 'Select'}</option>)}
      </select>
    </label>
  )
}

function DynamicCertifications({ locked, rows, add, update, remove }: { locked: boolean; rows: any[]; add: () => void; update: (index: number, key: string, value: any) => void; remove: (index: number) => void }) {
  return (
    <div className="rounded-3xl bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-black">Manual Certifications</h4>
        {!locked && <button type="button" onClick={add} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white">+ Add</button>}
      </div>
      <div className="space-y-3">
        {rows.map((row, index) => (
          <div key={`cert-${index}`} className="grid gap-2 rounded-2xl bg-white p-3 ring-1 ring-slate-100">
            <div className="grid grid-cols-2 gap-2">
              <SmartField label="Certification" value={row.title || ''} locked={locked} onChange={(v) => update(index, 'title', v)} />
              <SmartField label="Issuer" value={row.issuer || ''} locked={locked} onChange={(v) => update(index, 'issuer', v)} />
              <SmartField label="Expiry Date" value={row.expiry_date || ''} locked={locked} onChange={(v) => update(index, 'expiry_date', v)} />
              <SmartSelect label="Status" value={row.status || 'valid'} locked={locked} options={['valid', 'expiring', 'expired', 'pending']} onChange={(v) => update(index, 'status', v)} />
            </div>
            {!locked && <button type="button" onClick={() => remove(index)} className="text-left text-xs font-black text-red-600">Remove certification</button>}
          </div>
        ))}
        {!rows.length && <EmptyState text="No certifications added yet." />}
      </div>
    </div>
  )
}

function DynamicDocuments({ locked, rows, add, update, remove }: { locked: boolean; rows: any[]; add: () => void; update: (index: number, key: string, value: any) => void; remove: (index: number) => void }) {
  return (
    <div className="rounded-3xl bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-black">Managed Documents</h4>
        {!locked && <button type="button" onClick={add} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white">+ Add</button>}
      </div>
      <div className="space-y-3">
        {rows.map((row, index) => (
          <div key={`doc-${index}`} className="grid gap-2 rounded-2xl bg-white p-3 ring-1 ring-slate-100">
            <div className="grid grid-cols-2 gap-2">
              <SmartField label="Document Type" value={row.type || ''} locked={locked} onChange={(v) => update(index, 'type', v)} />
              <SmartField label="Title / File Name" value={row.title || ''} locked={locked} onChange={(v) => update(index, 'title', v)} />
              <SmartField label="Link / Storage URL" value={row.url || ''} locked={locked} onChange={(v) => update(index, 'url', v)} />
              <SmartSelect label="Status" value={row.status || 'pending'} locked={locked} options={['pending', 'verified', 'missing', 'expired', 'not_needed']} onChange={(v) => update(index, 'status', v)} />
            </div>
            {!locked && <button type="button" onClick={() => remove(index)} className="text-left text-xs font-black text-red-600">Remove document</button>}
          </div>
        ))}
        {!rows.length && <EmptyState text="No documents added yet." />}
      </div>
    </div>
  )
}

function VerificationControl({ label, value, locked, onChange }: { label: string; value: string; locked: boolean; onChange: (value: string) => void }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-black">{label}</p>
      <select disabled={locked} value={value || 'pending'} onChange={(event) => onChange(event.target.value)} className="mt-3 h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm font-black">
        <option value="verified">Verified</option>
        <option value="pending">Pending</option>
        <option value="not_needed">Not needed</option>
        <option value="rejected">Rejected</option>
      </select>
    </div>
  )
}

function ProgressLine({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs font-black">
        <span className="text-slate-500">{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-blue-600" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-center text-xs font-black text-slate-400">{text}</div>
}

function MetricBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <span className="block text-xs font-black text-slate-500">{label}</span>
      <strong className="mt-1 block text-xl font-black">{value}</strong>
    </div>
  )
}

