'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  MessageSquareText,
  RefreshCcw,
  Sparkles,
  UserRoundCheck,
  Users,
  Video,
} from 'lucide-react'

type Row = Record<string, any>

type Props = {
  interviews: Row[]
  candidates: Row[]
  openings: Row[]
}

function text(row: Row | null | undefined, keys: string[], fallback = '—') {
  if (!row) return fallback

  for (const key of keys) {
    const value = row?.[key]
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim()
    }
  }

  return fallback
}

function normalize(value: any) {
  return String(value || '').toLowerCase().trim()
}

function dateValue(row: Row) {
  const raw = text(
    row,
    [
      'interview_date',
      'scheduled_at',
      'starts_at',
      'start_time',
      'date',
      'created_at',
    ],
    '',
  )

  if (!raw) return null

  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function addMonths(base: Date, offset: number) {
  const next = new Date(base)
  next.setDate(1)
  next.setHours(12, 0, 0, 0)
  next.setMonth(next.getMonth() + offset)
  return next
}

function sameMonth(a: Date | null, b: Date) {
  if (!a) return false
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatDate(date: Date | null) {
  if (!date) return 'Date à confirmer'

  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatTime(date: Date | null, row: Row) {
  const explicitTime = text(row, ['interview_time', 'time', 'hour'], '')
  if (explicitTime) return explicitTime

  if (!date) return 'Heure à confirmer'

  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function candidateName(interview: Row, candidates: Row[]) {
  const direct = text(
    interview,
    [
      'candidate_name',
      'full_name',
      'name',
      'applicant_name',
      'candidate_full_name',
    ],
    '',
  )

  if (direct) return direct

  const candidateId = text(interview, ['candidate_id', 'applicant_id'], '')
  const match = candidates.find((candidate) => {
    const id = text(candidate, ['id'], '')
    return id && candidateId && id === candidateId
  })

  return text(match, ['full_name', 'name', 'email'], 'Candidate non renseigné')
}

function candidateEmail(interview: Row, candidates: Row[]) {
  const direct = text(interview, ['candidate_email', 'email', 'applicant_email'], '')
  if (direct) return direct

  const candidateId = text(interview, ['candidate_id', 'applicant_id'], '')
  const match = candidates.find((candidate) => text(candidate, ['id'], '') === candidateId)

  return text(match, ['email'], 'Email non renseigné')
}

function jobTitle(interview: Row, openings: Row[]) {
  const direct = text(
    interview,
    [
      'job_title',
      'position',
      'opening_title',
      'role',
      'target_role',
    ],
    '',
  )

  if (direct) return direct

  const openingId = text(interview, ['opening_id', 'job_id', 'requisition_id'], '')
  const match = openings.find((opening) => text(opening, ['id'], '') === openingId)

  return text(match, ['title', 'job_title', 'position', 'role'], 'Rôle non renseigné')
}

function departmentName(interview: Row, openings: Row[]) {
  const direct = text(
    interview,
    [
      'department',
      'department_name',
      'job_department',
      'team',
    ],
    '',
  )

  if (direct) return direct

  const openingId = text(interview, ['opening_id', 'job_id', 'requisition_id'], '')
  const match = openings.find((opening) => text(opening, ['id'], '') === openingId)

  return text(match, ['department', 'department_name', 'team'], 'Département non renseigné')
}

function initials(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .map((item) => item[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'IN'
}

function statusTone(status: string) {
  const value = normalize(status)

  if (value.includes('confirm') || value.includes('scheduled') || value.includes('plan')) {
    return 'border-emerald-100 bg-emerald-50 text-emerald-700'
  }

  if (value.includes('pending') || value.includes('wait')) {
    return 'border-amber-100 bg-amber-50 text-amber-700'
  }

  if (value.includes('cancel') || value.includes('reject')) {
    return 'border-rose-100 bg-rose-50 text-rose-700'
  }

  if (value.includes('done') || value.includes('completed')) {
    return 'border-violet-100 bg-violet-50 text-violet-700'
  }

  return 'border-cyan-100 bg-cyan-50 text-cyan-700'
}

function modeTone(mode: string) {
  const value = normalize(mode)

  if (value.includes('video') || value.includes('meet') || value.includes('zoom')) {
    return 'border-blue-100 bg-blue-50 text-blue-700'
  }

  if (value.includes('phone') || value.includes('call')) {
    return 'border-emerald-100 bg-emerald-50 text-emerald-700'
  }

  if (value.includes('onsite') || value.includes('office') || value.includes('presentiel')) {
    return 'border-amber-100 bg-amber-50 text-amber-700'
  }

  return 'border-slate-200 bg-slate-50 text-slate-600'
}

function interviewHref(interview: Row) {
  const id = text(interview, ['id'], '')
  if (id) return `/hr/recruitment/interviews?id=${encodeURIComponent(id)}`
  return '/hr/recruitment/interviews'
}

function dateRank(row: Row) {
  const date = dateValue(row)
  if (!date) return Number.MAX_SAFE_INTEGER
  return date.getTime()
}

function statusValue(row: Row) {
  return normalize(text(row, ['status', 'interview_status'], 'scheduled'))
}

export default function LiveScheduledInterviewsPanel({
  interviews,
  candidates,
  openings,
}: Props) {
  const [monthOffset, setMonthOffset] = useState(0)

  const projectedMonth = useMemo(() => addMonths(new Date(), monthOffset), [monthOffset])
  const projectedMonthLabel = useMemo(() => monthLabel(projectedMonth), [projectedMonth])

  const scopedInterviews = useMemo(() => {
    return interviews
      .filter((item) => {
        const date = dateValue(item)

        // Undated interviews stay visible only in the current month,
        // so future or past projections stay clean.
        if (!date) return monthOffset === 0

        return sameMonth(date, projectedMonth)
      })
      .sort((a, b) => dateRank(a) - dateRank(b))
  }, [interviews, monthOffset, projectedMonth])

  const allMonthInterviews = useMemo(() => {
    return interviews.filter((item) => {
      const date = dateValue(item)
      if (!date) return monthOffset === 0
      return sameMonth(date, projectedMonth)
    })
  }, [interviews, monthOffset, projectedMonth])

  const visible = scopedInterviews.slice(0, 24)

  const todayCount = useMemo(() => {
    const today = new Date()

    return scopedInterviews.filter((item) => {
      const date = dateValue(item)
      if (!date) return false

      return (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
      )
    }).length
  }, [scopedInterviews])

  const confirmed = scopedInterviews.filter((item) => {
    const status = statusValue(item)
    return status.includes('confirm') || status.includes('scheduled') || status.includes('plan')
  }).length

  const pending = scopedInterviews.filter((item) => {
    const status = statusValue(item)
    return status.includes('pending') || status.includes('wait')
  }).length

  const completed = scopedInterviews.filter((item) => {
    const status = statusValue(item)
    return status.includes('done') || status.includes('completed')
  }).length

  const nextInterview = scopedInterviews.find((item) => {
    const date = dateValue(item)
    return date ? date.getTime() >= Date.now() - 86400000 : true
  })

  const nextDate = nextInterview ? dateValue(nextInterview) : null

  const syncedAt = useMemo(() => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date())
  }, [interviews.length, monthOffset])

  const viewLabel =
    monthOffset === 0
      ? 'Mois actuel'
      : monthOffset < 0
        ? `${Math.abs(monthOffset)} mois avant`
        : `${monthOffset} mois après`

  return (
    <section className="overflow-hidden rounded-[34px] border border-slate-200 bg-white/95 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <div className="border-b border-slate-200 bg-gradient-to-r from-white via-cyan-50/50 to-violet-50/40 px-6 py-6 lg:px-8">
        <div className="flex flex-col gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-700">
                Live interviews
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
                Synced from recruitment data
              </span>
              <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-violet-700">
                {viewLabel}
              </span>
            </div>

            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 lg:text-4xl">
              Scheduled Interviews Command Board
            </h2>

            <p className="mt-2 max-w-6xl text-sm font-semibold leading-6 text-slate-500 lg:text-[15px]">
              Live monthly interview agenda connected to candidates, openings, departments,
              status, dates, owners and execution follow-up. Every card opens the existing interview workspace.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:max-w-5xl">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Projected month
                </p>
                <p className="mt-1 text-lg font-black capitalize text-slate-950">
                  {projectedMonthLabel}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Live sync
                </p>
                <p className="mt-1 text-sm font-black text-slate-700">
                  {syncedAt}
                </p>
              </div>

              <div className="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-500">
                  Records in projection
                </p>
                <p className="mt-1 text-lg font-black text-cyan-800">
                  {allMonthInterviews.length}
                </p>
              </div>
            </div>
          </div>

          <div className="w-full">
            <div className="rounded-[30px] border border-slate-200 bg-white/95 p-3 shadow-xl shadow-slate-200/70">
              <div className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_180px]">
                <button
                  type="button"
                  onClick={() => setMonthOffset((value) => value - 1)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:border-violet-200 hover:bg-violet-50"
                >
                  <ChevronLeft className="mr-2 inline h-4 w-4" />
                  Previous month
                </button>

                <button
                  type="button"
                  onClick={() => setMonthOffset(0)}
                  className={monthOffset === 0
                    ? 'rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-violet-200'
                    : 'rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-black text-violet-700 transition hover:bg-violet-100'
                  }
                >
                  <RefreshCcw className="mr-2 inline h-4 w-4" />
                  This month
                </button>

                <button
                  type="button"
                  onClick={() => setMonthOffset((value) => value + 1)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:border-violet-200 hover:bg-violet-50"
                >
                  Next month
                  <ChevronRight className="ml-2 inline h-4 w-4" />
                </button>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">
                    Month
                  </p>
                  <p className="text-sm font-black capitalize text-emerald-800">
                    {projectedMonthLabel}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ['Scheduled', scopedInterviews.length, 'Scoped interview records', CalendarClock, 'border-violet-100 bg-violet-50 text-violet-700'],
                ['Today', todayCount, 'Interviews planned today', Clock3, 'border-amber-100 bg-amber-50 text-amber-700'],
                ['Confirmed', confirmed, 'Ready to execute', BadgeCheck, 'border-emerald-100 bg-emerald-50 text-emerald-700'],
                ['Pending', pending, 'Needs follow-up', MessageSquareText, 'border-rose-100 bg-rose-50 text-rose-700'],
              ].map(([label, value, sub, Icon, tone]: any) => (
                <div key={label} className={`rounded-[24px] border p-4 shadow-sm ${tone}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">
                        {label}
                      </p>
                      <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                        {value}
                      </p>
                      <p className="mt-1 text-xs font-bold opacity-80">
                        {sub}
                      </p>
                    </div>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid h-[620px] items-stretch gap-5 px-5 py-5 xl:grid-cols-[0.72fr_1.28fr] lg:px-6">
        <aside className="space-y-4">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              Next interview in projection
            </p>

            {nextInterview ? (
              <>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                  {candidateName(nextInterview, candidates)}
                </h3>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  {jobTitle(nextInterview, openings)} · {departmentName(nextInterview, openings)}
                </p>

                <div className="mt-5 grid gap-3">
                  <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">
                    <CalendarClock className="mb-3 h-5 w-5 text-violet-600" />
                    <p className="text-sm font-black text-slate-900">{formatDate(nextDate)}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{formatTime(nextDate, nextInterview)}</p>
                  </div>

                  <Link
                    href={interviewHref(nextInterview)}
                    className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-black text-white shadow-lg transition hover:bg-violet-700"
                  >
                    Open interview workspace
                    <ArrowUpRight className="ml-2 inline h-4 w-4" />
                  </Link>
                </div>
              </>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center">
                <p className="text-lg font-black text-white">No interview in {projectedMonthLabel}</p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  Move backward or forward to inspect other months.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-5 text-white">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/65">
              Monthly execution signal
            </p>
            <h3 className="mt-2 text-2xl font-black capitalize">{projectedMonthLabel}</h3>
            <p className="mt-2 text-sm font-bold leading-6 text-white/65">
              Agenda readiness is recalculated live from the selected month, confirmed interviews,
              pending follow-ups and completed interview records.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/65">Coverage</p>
                <p className="mt-2 text-3xl font-black text-white">{scopedInterviews.length}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/65">Completed</p>
                <p className="mt-2 text-3xl font-black text-white">{completed}</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-white/10 p-4">
              <div className="mb-2 flex items-center justify-between text-xs font-black text-white/70">
                <span>Confirmed readiness</span>
                <span className="text-white">{scopedInterviews.length ? Math.round((confirmed / scopedInterviews.length) * 100) : 0}%</span>
              </div>
              <div className="h-3 rounded-full bg-white/10">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-emerald-400 via-cyan-300 to-violet-400 transition-all duration-500"
                  style={{
                    width: `${Math.max(4, scopedInterviews.length ? Math.round((confirmed / scopedInterviews.length) * 100) : 0)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </aside>

        <main className="flex h-full min-h-0 flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Live monthly interview queue
              </p>
              <h3 className="mt-1 text-2xl font-black capitalize tracking-tight text-white">
                Interviews · {projectedMonthLabel}
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Click any card to open the existing interview page.
              </p>
            </div>

            <Link
              href="/hr/recruitment/interviews"
              className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-black text-violet-700 transition hover:bg-violet-100"
            >
              View all interviews
              <ArrowUpRight className="ml-2 inline h-4 w-4" />
            </Link>
          </div>

          <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-2">
            <div className="grid gap-4 lg:grid-cols-2">
            {visible.map((interview, index) => {
              const date = dateValue(interview)
              const name = candidateName(interview, candidates)
              const status = text(interview, ['status', 'interview_status'], 'scheduled')
              const mode = text(interview, ['mode', 'interview_mode', 'type', 'interview_type'], 'Interview')
              const interviewer = text(interview, ['interviewer', 'interviewer_name', 'owner', 'assigned_to'], 'Interviewer à confirmer')
              const location = text(interview, ['location', 'meeting_location', 'meeting_link', 'address'], 'Lieu / lien à confirmer')
              const score = text(interview, ['score', 'rating', 'interview_score'], '')
              const href = interviewHref(interview)

              return (
                <Link
                  key={text(interview, ['id'], `interview-${index}`)}
                  href={href}
                  className="group overflow-hidden rounded-[28px] border border-white bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)] ring-1 ring-slate-100 transition hover:-translate-y-1 hover:border-violet-200 hover:shadow-2xl"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-500 text-sm font-black text-white shadow-lg">
                          {initials(name)}
                        </div>
                        <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-emerald-500 text-white">
                          <UserRoundCheck className="h-3.5 w-3.5" />
                        </span>
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-lg font-black text-white group-hover:text-violet-700">
                          {name}
                        </p>
                        <p className="mt-1 truncate text-xs font-black uppercase tracking-[0.08em] text-violet-700">
                          {jobTitle(interview, openings)}
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-500">
                          {candidateEmail(interview, candidates)}
                        </p>
                      </div>
                    </div>

                    <ArrowUpRight className="h-5 w-5 text-slate-300 transition group-hover:text-violet-600" />
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                      <CalendarClock className="mb-2 h-4 w-4 text-violet-600" />
                      <p className="text-sm font-black text-slate-900">{formatDate(date)}</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">{formatTime(date, interview)}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                      <Users className="mb-2 h-4 w-4 text-cyan-600" />
                      <p className="text-sm font-black text-slate-900">{interviewer}</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">Interviewer</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className={`rounded-full border px-3 py-1 text-[11px] font-black ${statusTone(status)}`}>
                      {status}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-[11px] font-black ${modeTone(mode)}`}>
                      <Video className="mr-1 inline h-3.5 w-3.5" />
                      {mode}
                    </span>
                    <span className="rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-[11px] font-black text-cyan-700">
                      <MapPin className="mr-1 inline h-3.5 w-3.5" />
                      {departmentName(interview, openings)}
                    </span>
                    {score ? (
                      <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-700">
                        Score {score}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-xs font-bold leading-5 text-slate-500">
                    {location}
                  </div>
                </Link>
              )
            })}

            {!visible.length ? (
              <div className="col-span-full rounded-[28px] border border-dashed border-slate-200 bg-white p-10 text-center">
                <CalendarClock className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-lg font-black text-slate-900">
                  No live scheduled interviews found for {projectedMonthLabel}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  Use previous or next month navigation to inspect the full synced interview calendar.
                </p>
                <Link
                  href="/hr/recruitment/interviews"
                  className="mt-5 inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
                >
                  Open interviews page
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            ) : null}
            </div>
          </div>
        </main>
      </div>
    </section>
  )
}
