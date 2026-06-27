'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { CareLinkCaregiverCreateModal } from './CareLinkCaregiverCreateModal'

type AnyRecord = Record<string, any>

function text(value: unknown, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback
  return String(value)
}

function number(value: unknown) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function lower(value: unknown) {
  return text(value, '').toLowerCase()
}

function bool(value: unknown) {
  return value === true || value === 'true' || value === 1 || value === '1' || value === 'yes'
}

function nameOf(row: AnyRecord) {
  return text(row.full_name || row.name || row.display_name, `Caregiver #${row.id}`)
}

function cityOf(row: AnyRecord) {
  return text(row.city || row.location_city || row.base_city, 'Unassigned city')
}

function zoneOf(row: AnyRecord) {
  return text(row.zone || row.location_zone || row.base_zone, 'No zone')
}

function statusOf(row: AnyRecord) {
  return text(row.current_status || row.status || row.availability_status, 'available')
}

function phoneOf(row: AnyRecord) {
  return text(row.phone || row.mobile || row.phone_number, 'No phone')
}

function listOf(value: unknown) {
  if (Array.isArray(value)) return value.map((x) => text(x, '')).filter(Boolean)
  return text(value, '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
}

function skillsOf(row: AnyRecord) {
  return listOf(row.skill_tags || row.skills || row.competencies || row.tags).slice(0, 6)
}

function initials(name: string) {
  return name
    .split(' ')
    .map((x) => x[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function readinessOf(row: AnyRecord) {
  let score = number(row.readiness_score || row.reliability_score || row.score)
  if (phoneOf(row) !== 'No phone') score += 10
  if (cityOf(row) !== 'Unassigned city') score += 10
  if (zoneOf(row) !== 'No zone') score += 10
  if (skillsOf(row).length) score += 10
  if (bool(row.academy_certified)) score += 10
  if (bool(row.special_needs_capable)) score += 5
  return Math.max(0, Math.min(100, score || 0))
}

function statusTone(status: string) {
  const s = status.toLowerCase()
  if (s.includes('archived') || s.includes('inactive') || s.includes('blocked')) return 'rose'
  if (s.includes('assigned') || s.includes('mission') || s.includes('busy')) return 'blue'
  if (s.includes('training')) return 'amber'
  return 'emerald'
}

function toneClasses(tone: string) {
  if (tone === 'rose') return 'border-rose-200 bg-rose-50 text-rose-700'
  if (tone === 'blue') return 'border-blue-200 bg-blue-50 text-blue-700'
  if (tone === 'amber') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

function barColor(score: number) {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 55) return 'bg-amber-500'
  return 'bg-rose-500'
}

function riskLabel(row: AnyRecord) {
  const readiness = readinessOf(row)
  if (readiness < 55) return 'Profile risk'
  if (phoneOf(row) === 'No phone') return 'Missing phone'
  if (zoneOf(row) === 'No zone') return 'No zone'
  if (!skillsOf(row).length) return 'Skills missing'
  return 'Ready control'
}

function signal(row: AnyRecord) {
  const s = [row.online, row.is_online, row.live_status, row.connection_status, row.presence_status, row.status]
    .map((x) => String(x || '').toLowerCase())
    .join(' ')

  if (s.includes('online') || s.includes('connected') || s.includes('live') || s.includes('active')) {
    return { label: 'Live', tone: 'emerald', pulse: true }
  }

  if (lower(statusOf(row)).includes('assigned') || lower(statusOf(row)).includes('mission')) {
    return { label: 'In mission', tone: 'blue', pulse: true }
  }

  if (lower(statusOf(row)).includes('archived') || lower(statusOf(row)).includes('inactive')) {
    return { label: 'Offline', tone: 'rose', pulse: false }
  }

  return { label: 'Standby', tone: 'amber', pulse: false }
}

function Mini({ label, value, tone = 'slate' }: { label: string; value: string | number; tone?: 'slate' | 'blue' | 'emerald' | 'amber' | 'rose' }) {
  const cls = {
    slate: 'border-slate-200 bg-white text-slate-700',
    blue: 'border-blue-100 bg-blue-50 text-blue-700',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
    rose: 'border-rose-100 bg-rose-50 text-rose-700',
  }[tone]

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${cls}`}>
      <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">{label}</div>
      <div className="mt-2 text-lg font-black text-slate-950">{value}</div>
    </div>
  )
}

export function CareLinkCaregiverPremiumGrid({ caregivers }: { caregivers: AnyRecord[] }) {
  const rows = Array.isArray(caregivers) ? caregivers : []
  const [selected, setSelected] = useState<AnyRecord | null>(null)

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        const readiness = readinessOf(row)
        if (readiness >= 80) acc.ready += 1
        if (readiness < 55) acc.risk += 1
        if (statusTone(statusOf(row)) === 'emerald') acc.available += 1
        if (statusTone(statusOf(row)) === 'blue') acc.inMission += 1
        return acc
      },
      { ready: 0, risk: 0, available: 0, inMission: 0 },
    )
  }, [rows])

  return (
    <>
      <section className="mt-6 rounded-[34px] border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-blue-700">
              CareLink live workforce registry
            </div>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-950">
              Existing caregivers command cards
            </h2>
            <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-500">
              Click any caregiver card to open the same Agent Command Console with synced profile data, then edit, save or cancel.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Mini label="Cards" value={rows.length} tone="blue" />
            <Mini label="Available" value={summary.available} tone="emerald" />
            <Mini label="In mission" value={summary.inMission} tone="amber" />
            <Mini label="Risk" value={summary.risk} tone="rose" />
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-2">
        {rows.map((caregiver) => {
          const name = nameOf(caregiver)
          const readiness = readinessOf(caregiver)
          const status = statusOf(caregiver)
          const tone = statusTone(status)
          const live = signal(caregiver)
          const skills = skillsOf(caregiver)

          return (
            <article
              key={String(caregiver.id)}
              role="button"
              tabIndex={0}
              onClick={() => setSelected(caregiver)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') setSelected(caregiver)
              }}
              className="group relative overflow-hidden rounded-[34px] border border-slate-200 bg-white p-6 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_26px_70px_rgba(37,99,235,0.16)]"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400 opacity-0 transition group-hover:opacity-100" />
              <div className="pointer-events-none absolute -right-24 -top-24 h-52 w-52 rounded-full bg-blue-100/60 blur-3xl transition group-hover:bg-cyan-100" />

              <div className="relative flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="grid h-16 w-16 place-items-center rounded-[24px] bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 text-lg font-black text-white shadow-[0_18px_35px_rgba(37,99,235,0.28)]">
                      {initials(name)}
                    </div>
                    <span className={`absolute -right-1 -top-1 h-4 w-4 rounded-full ${live.tone === 'emerald' ? 'bg-emerald-400' : live.tone === 'blue' ? 'bg-blue-400' : live.tone === 'rose' ? 'bg-rose-400' : 'bg-amber-400'}`}>
                      {live.pulse ? <span className="absolute inset-0 animate-ping rounded-full bg-current opacity-60" /> : null}
                    </span>
                  </div>

                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
                      Caregiver #{text(caregiver.id)}
                    </div>
                    <h3 className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">
                      {name}
                    </h3>
                    <p className="mt-2 text-xs font-black uppercase tracking-[0.05em] text-slate-500">
                      {cityOf(caregiver)} · {zoneOf(caregiver)} · {phoneOf(caregiver)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-black ${toneClasses(tone)}`}>
                    {status}
                  </span>
                  <span className={`rounded-full border px-3 py-1 text-xs font-black ${toneClasses(live.tone)}`}>
                    {live.label}
                  </span>
                </div>
              </div>

              <div className="relative mt-5 grid gap-3 md:grid-cols-4">
                <Mini label="Readiness" value={`${readiness}%`} tone={readiness >= 80 ? 'emerald' : readiness >= 55 ? 'amber' : 'rose'} />
                <Mini label="Reliability" value={`${number(caregiver.reliability_score)}/100`} />
                <Mini label="Academy" value={bool(caregiver.academy_certified) ? 'Yes' : 'No'} tone={bool(caregiver.academy_certified) ? 'emerald' : 'amber'} />
                <Mini label="Special needs" value={bool(caregiver.special_needs_capable) ? 'Yes' : 'No'} tone={bool(caregiver.special_needs_capable) ? 'blue' : 'slate'} />
              </div>

              <div className="relative mt-5">
                <div className="flex items-center justify-between text-xs font-black text-slate-500">
                  <span>{riskLabel(caregiver)}</span>
                  <span>{readiness}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div className={`h-2 rounded-full ${barColor(readiness)}`} style={{ width: `${readiness}%` }} />
                </div>
              </div>

              <div className="relative mt-5 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap gap-2">
                  {skills.length ? skills.map((skill) => (
                    <span key={skill} className="rounded-full bg-white px-3 py-1 text-xs font-black text-blue-700 shadow-sm">
                      {skill}
                    </span>
                  )) : (
                    <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-700">
                      Skills missing
                    </span>
                  )}
                </div>
              </div>

              <div className="relative mt-5 rounded-[22px] border border-emerald-100 bg-emerald-50/70 p-4">
                <div className="text-sm font-black text-emerald-800">Operational summary</div>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                  {text(caregiver.summary || caregiver.notes || caregiver.description, 'Live caregiver profile connected to CareLink Ops workforce command.')}
                </p>
              </div>

              <div className="relative mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    setSelected(caregiver)
                  }}
                  className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
                >
                  Open command modal
                </button>

                <Link
                  href={`/operations/replacements?caregiver_id=${caregiver.id}`}
                  onClick={(event) => event.stopPropagation()}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
                >
                  Matching
                </Link>

                <Link
                  href={`/carelink-ops/missions?caregiver_id=${caregiver.id}`}
                  onClick={(event) => event.stopPropagation()}
                  className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black text-blue-700 hover:bg-blue-100"
                >
                  Missions
                </Link>
              </div>
            </article>
          )
        })}
      </section>

      <CareLinkCaregiverCreateModal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        mode="edit"
        initialCaregiver={selected}
        onSaved={() => {
          window.location.reload()
        }}
      />
    </>
  )
}

export default CareLinkCaregiverPremiumGrid
