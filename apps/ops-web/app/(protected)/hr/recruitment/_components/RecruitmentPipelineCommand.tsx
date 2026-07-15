'use client'

import { useMemo, useState } from 'react'
import {
  Activity,
  BriefcaseBusiness,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Sparkles,
  Target,
  TrendingDown,
  Users,
} from 'lucide-react'

type Row = Record<string, any>

type Props = {
  candidates: Row[]
  openings: Row[]
}

const STAGES = ['applied', 'screening', 'interview', 'assessment', 'offer', 'hired'] as const

const STAGE_META: Record<string, {
  label: string
  dot: string
  bar: string
  soft: string
}> = {
  applied: {
    label: 'Applied',
    dot: 'bg-sky-500',
    bar: 'from-sky-300 via-sky-400 to-sky-500',
    soft: 'bg-sky-50 text-sky-700 border-sky-100',
  },
  screening: {
    label: 'Screening',
    dot: 'bg-fuchsia-500',
    bar: 'from-violet-300 via-fuchsia-400 to-fuchsia-600',
    soft: 'bg-violet-50 text-violet-700 border-violet-100',
  },
  interview: {
    label: 'Interview',
    dot: 'bg-amber-500',
    bar: 'from-amber-300 via-orange-400 to-orange-500',
    soft: 'bg-amber-50 text-amber-700 border-amber-100',
  },
  assessment: {
    label: 'Assessment',
    dot: 'bg-indigo-500',
    bar: 'from-indigo-300 via-indigo-400 to-indigo-600',
    soft: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  },
  offer: {
    label: 'Offer',
    dot: 'bg-emerald-500',
    bar: 'from-emerald-300 via-emerald-400 to-emerald-500',
    soft: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  hired: {
    label: 'Hired',
    dot: 'bg-slate-700',
    bar: 'from-slate-400 via-slate-600 to-slate-800',
    soft: 'bg-slate-100 text-slate-700 border-slate-200',
  },
}

function text(row: Row, keys: string[], fallback = '') {
  for (const key of keys) {
    const value = row?.[key]
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim()
  }
  return fallback
}

function normalize(value: any) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .trim()
}

function candidateStage(row: Row) {
  const value = normalize(
    text(row, ['pipeline_stage', 'stage', 'status', 'decision'], 'applied')
  )
  return value === 'new' ? 'applied' : value
}

function percentage(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0
}

function addMonths(base: Date, offset: number) {
  const next = new Date(base)
  next.setDate(1)
  next.setMonth(next.getMonth() + offset)
  return next
}

function sameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

function isValidDate(d: Date) {
  return !Number.isNaN(d.getTime())
}

function rowDate(row: Row) {
  const raw = text(row, [
    'created_at',
    'applied_at',
    'application_date',
    'submitted_at',
    'date',
    'interview_date',
    'updated_at',
  ], '')
  if (!raw) return null
  const parsed = new Date(raw)
  return isValidDate(parsed) ? parsed : null
}

function departmentOf(row: Row) {
  return text(
    row,
    [
      'department',
      'desired_department',
      'job_department',
      'department_name',
      'team',
    ],
    'Unassigned'
  )
}

function openingStatus(row: Row) {
  return normalize(text(row, ['status'], 'open'))
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`
}

export default function RecruitmentPipelineCommand({ candidates, openings }: Props) {
  const [monthOffset, setMonthOffset] = useState<-1 | 0 | 1>(0)
  const [department, setDepartment] = useState('all')

  const targetMonth = useMemo(() => addMonths(new Date(), monthOffset), [monthOffset])

  const departments = useMemo(() => {
    const values = [
      ...candidates.map((c) => departmentOf(c)),
      ...openings.map((o) => departmentOf(o)),
    ]
      .map((v) => String(v || '').trim())
      .filter(Boolean)

    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))
  }, [candidates, openings])

  const filteredCandidates = useMemo(() => {
    return candidates.filter((candidate) => {
      const candidateDepartment = departmentOf(candidate)
      if (department !== 'all' && candidateDepartment !== department) return false

      const date = rowDate(candidate)
      if (!date) return monthOffset === 0
      return sameMonth(date, targetMonth)
    })
  }, [candidates, department, monthOffset, targetMonth])

  const filteredOpenings = useMemo(() => {
    return openings.filter((opening) => {
      const openingDepartment = departmentOf(opening)
      if (department !== 'all' && openingDepartment !== department) return false

      const date = rowDate(opening)
      if (!date) return monthOffset === 0
      return sameMonth(date, targetMonth)
    })
  }, [openings, department, monthOffset, targetMonth])

  const stageCounts = useMemo(() => {
    return STAGES.map((stage) => {
      const count = filteredCandidates.filter((candidate) => candidateStage(candidate) === stage).length
      return {
        stage,
        count,
        label: STAGE_META[stage].label,
      }
    })
  }, [filteredCandidates])

  const totalCandidates = filteredCandidates.length
  const topStageCount = Math.max(1, ...stageCounts.map((item) => item.count))
  const hiredCount = stageCounts.find((item) => item.stage === 'hired')?.count || 0
  const offerCount = stageCounts.find((item) => item.stage === 'offer')?.count || 0
  const interviewCount = stageCounts.find((item) => item.stage === 'interview')?.count || 0
  const screeningCount = stageCounts.find((item) => item.stage === 'screening')?.count || 0
  const activePipeline = Math.max(0, totalCandidates - hiredCount)
  const conversionRate = percentage(hiredCount, totalCandidates)
  const dropOffCount = Math.max(0, totalCandidates - hiredCount)
  const liveOpenings = filteredOpenings.filter((opening) => openingStatus(opening) === 'open').length

  const dominantStage = useMemo(() => {
    return [...stageCounts].sort((a, b) => b.count - a.count)[0]
  }, [stageCounts])

  const monthLabel = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
    }).format(targetMonth)
  }, [targetMonth])

  const syncStamp = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date())
  }, [monthOffset, department, candidates.length, openings.length])

  const viewLabel =
    monthOffset === -1 ? 'Last month'
    : monthOffset === 1 ? 'Next month'
    : 'This month'

  return (
    <section className="rounded-[34px] border border-slate-200 bg-white/95 shadow-[0_24px_80px_rgba(15,23,42,0.08)] overflow-hidden">
      <div className="border-b border-slate-200 bg-gradient-to-r from-white via-violet-50/40 to-cyan-50/50 px-6 py-6 lg:px-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
                Live synced
              </span>
              <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-violet-700">
                Recruitment pipeline command
              </span>
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 lg:text-4xl">
              Pipeline Performance & Conversion Command
            </h2>

            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 lg:text-[15px]">
              Dynamic month-based pipeline intelligence using live candidate records,
              real stage progression and synced department filtering across current and future recruitment data.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
                <CalendarRange className="h-4 w-4 text-violet-600" />
                Active window: <span className="font-black text-slate-800">{monthLabel}</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
                <Sparkles className="h-4 w-4 text-cyan-600" />
                View: <span className="font-black text-slate-800">{viewLabel}</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
                <Activity className="h-4 w-4 text-emerald-600" />
                Synced: <span className="font-black text-slate-800">{syncStamp}</span>
              </span>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 xl:w-auto xl:min-w-[420px]">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
              <div className="flex items-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setMonthOffset(-1)}
                  className={`flex-1 rounded-xl px-4 py-3 text-sm font-black transition ${
                    monthOffset === -1
                      ? 'bg-slate-950 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <ChevronLeft className="h-4 w-4" />
                    Last month
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMonthOffset(0)}
                  className={`flex-1 rounded-xl px-4 py-3 text-sm font-black transition ${
                    monthOffset === 0
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  This month
                </button>

                <button
                  type="button"
                  onClick={() => setMonthOffset(1)}
                  className={`flex-1 rounded-xl px-4 py-3 text-sm font-black transition ${
                    monthOffset === 1
                      ? 'bg-slate-950 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    Next month
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </button>
              </div>

              <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-center shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-500">
                  Live month
                </p>
                <p className="mt-1 text-sm font-black text-violet-800">
                  {monthLabel}
                </p>
              </div>
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <Filter className="h-4 w-4 text-violet-600" />
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-transparent text-sm font-black text-slate-800 outline-none"
              >
                <option value="all">All departments</option>
                {departments.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="grid gap-4 border-b border-slate-200 bg-slate-50/60 px-6 py-5 md:grid-cols-2 xl:grid-cols-6 lg:px-8">
        {[
          ['Candidates in scope', totalCandidates, 'Visible within selected month + department', Users, 'from-violet-500 to-fuchsia-500'],
          ['Active pipeline', activePipeline, 'Profiles not yet converted to hired', Activity, 'from-cyan-500 to-sky-500'],
          ['Hired', hiredCount, 'Final conversions in this scope', CheckCircle2, 'from-emerald-500 to-teal-500'],
          ['Conversion rate', `${conversionRate}%`, 'Hired vs total scoped candidates', Target, 'from-violet-500 to-indigo-500'],
          ['Drop-off', dropOffCount, 'Candidates not converted to hired', TrendingDown, 'from-rose-500 to-orange-500'],
          ['Open requisitions', liveOpenings, 'Live openings in selected scope', BriefcaseBusiness, 'from-amber-500 to-yellow-500'],
        ].map(([label, value, sub, Icon, gradient]: any) => (
          <div
            key={label}
            className="rounded-[26px] border border-white bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  {label}
                </p>
                <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                  {value}
                </p>
                <p className="mt-2 text-xs font-bold leading-5 text-slate-500">
                  {sub}
                </p>
              </div>
              <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 px-5 py-5 xl:grid-cols-[1.45fr_.55fr] lg:px-6">
        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_14px_42px_rgba(15,23,42,0.045)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Stage navigation
              </p>
              <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                Recruitment stage distribution
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Live progress by stage for {monthLabel}{department !== 'all' ? ` · ${department}` : ''}.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Dominant stage
              </p>
              <p className="mt-1 text-sm font-black text-slate-900">
                {dominantStage?.label || '—'}
              </p>
              <p className="text-xs font-bold text-slate-500">
                {dominantStage?.count || 0} candidate(s)
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {stageCounts.map((item) => {
              const meta = STAGE_META[item.stage]
              const relativeWidth = totalCandidates === 0
                ? 0
                : Math.max(8, Math.round((item.count / topStageCount) * 100))

              return (
                <div
                  key={item.stage}
                  className="rounded-[20px] border border-slate-100 bg-slate-50/80 p-3"
                >
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`h-3.5 w-3.5 rounded-full ${meta.dot}`} />
                      <span className="text-base font-black text-slate-900">
                        {meta.label}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-black ${meta.soft}`}>
                        {item.count} candidate(s)
                      </span>
                    </div>
                    <div className="text-sm font-black text-slate-500">
                      {percentage(item.count, totalCandidates)}%
                    </div>
                  </div>

                  <div className="h-9 overflow-hidden rounded-full bg-slate-200/70 ring-1 ring-inset ring-slate-200">
                    <div
                      className={`grid h-full place-items-center rounded-full bg-gradient-to-r ${meta.bar} text-sm font-black text-white shadow-[inset_0_-1px_0_rgba(255,255,255,0.25)] transition-all duration-500`}
                      style={{ width: `${relativeWidth}%` }}
                    >
                      {item.count}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {!totalCandidates ? (
            <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-base font-black text-slate-900">
                No candidate records found for this scope
              </p>
              <p className="mt-2 text-sm font-bold text-slate-500">
                Try another month or department, or wait for new synced candidate data.
              </p>
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_14px_42px_rgba(15,23,42,0.045)]">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              Live intelligence
            </p>
            <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">
              Pipeline insights
            </h3>

            <div className="mt-4 space-y-2.5">
              {[
                ['Current month', monthLabel, 'Live active analysis window', 'bg-violet-50 text-violet-800 border-violet-100'],
                ['Department scope', department === 'all' ? 'All departments' : department, 'Live synced department filter', 'bg-cyan-50 text-cyan-800 border-cyan-100'],
                ['Screening load', `${screeningCount} profile(s)`, 'Candidates needing recruiter review', 'bg-fuchsia-50 text-fuchsia-800 border-fuchsia-100'],
                ['Interview readiness', `${interviewCount} profile(s)`, 'Profiles already in interview flow', 'bg-amber-50 text-amber-800 border-amber-100'],
                ['Offer momentum', `${offerCount} profile(s)`, 'Candidates close to final conversion', 'bg-emerald-50 text-emerald-800 border-emerald-100'],
              ].map(([label, value, sub, tone]: any) => (
                <div key={label} className={`rounded-2xl border p-3 ${tone}`}>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">
                    {label}
                  </p>
                  <p className="mt-1.5 text-base font-black">
                    {value}
                  </p>
                  <p className="mt-1 text-xs font-bold opacity-80">
                    {sub}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 text-white shadow-[0_14px_42px_rgba(15,23,42,0.16)]">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/50">
              Executive conversion signal
            </p>
            <h3 className="mt-1.5 text-xl font-black">
              Hiring outcome snapshot
            </h3>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/60">
                  Hired
                </p>
                <p className="mt-1.5 text-2xl font-black text-white">{hiredCount}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/60">
                  Conversion
                </p>
                <p className="mt-1.5 text-2xl font-black text-white">{conversionRate}%</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white/10 p-3">
              <div className="mb-2 flex items-center justify-between text-xs font-black text-white/70">
                <span>Hiring performance</span>
                <span className="text-white">{conversionRate}%</span>
              </div>
              <div className="h-3 rounded-full bg-white/10">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-emerald-400 via-cyan-300 to-violet-400 transition-all duration-500"
                  style={{ width: `${Math.max(6, conversionRate)}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] font-bold leading-5 text-white/70">
                This signal updates live according to the selected month and department using synced candidate progression.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
