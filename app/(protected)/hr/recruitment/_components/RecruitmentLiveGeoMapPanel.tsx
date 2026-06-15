'use client'

import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import {
  BriefcaseBusiness,
  CalendarClock,
  MapPin,
  Radio,
  Sparkles,
  Users,
} from 'lucide-react'

type Row = Record<string, any>

type Mode = 'requisitions' | 'candidates' | 'interviews'

const RecruitmentGeoLeafletMap = dynamic(() => import('./RecruitmentGeoLeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center rounded-[34px] bg-slate-50">
      <div className="rounded-[28px] border border-violet-100 bg-white px-8 py-6 text-center shadow-xl shadow-slate-200/70">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-violet-700">
          Loading recruitment map
        </p>
        <p className="mt-2 text-lg font-black text-slate-950">
          Preparing OpenStreetMap zoning...
        </p>
      </div>
    </div>
  ),
})

const CITY_COORDS: Record<string, { lat: number; lng: number; aliases: string[] }> = {
  Rabat: { lat: 34.0209, lng: -6.8416, aliases: ['rabat'] },
  Temara: { lat: 33.9287, lng: -6.9067, aliases: ['temara', 'témara'] },
  Salé: { lat: 34.0531, lng: -6.7985, aliases: ['sale', 'salé'] },
  Skhirate: { lat: 33.8527, lng: -7.0317, aliases: ['skhirate', 'shekhirate', 'skhirat'] },
  Bouznika: { lat: 33.7894, lng: -7.1597, aliases: ['bouznika'] },
  Casablanca: { lat: 33.5731, lng: -7.5898, aliases: ['casablanca', 'casa'] },
  Mohammedia: { lat: 33.6835, lng: -7.3849, aliases: ['mohammedia'] },
  Kénitra: { lat: 34.261, lng: -6.5802, aliases: ['kenitra', 'kénitra'] },
  Tanger: { lat: 35.7595, lng: -5.834, aliases: ['tanger', 'tangier'] },
  Fès: { lat: 34.0181, lng: -5.0078, aliases: ['fes', 'fès', 'fez'] },
  Meknès: { lat: 33.8935, lng: -5.5473, aliases: ['meknes', 'meknès'] },
  Marrakech: { lat: 31.6295, lng: -7.9811, aliases: ['marrakech', 'marrakesh'] },
  Agadir: { lat: 30.4278, lng: -9.5981, aliases: ['agadir'] },
  Oujda: { lat: 34.6814, lng: -1.9086, aliases: ['oujda'] },
  Tétouan: { lat: 35.5785, lng: -5.3684, aliases: ['tetouan', 'tétouan'] },
  'Beni Mellal': { lat: 32.3373, lng: -6.3498, aliases: ['beni mellal', 'beni melal', 'bni mellal'] },
  'El Jadida': { lat: 33.2316, lng: -8.5007, aliases: ['el jadida', 'jadida'] },
  Safi: { lat: 32.2994, lng: -9.2372, aliases: ['safi'] },
  Morocco: { lat: 31.7917, lng: -7.0926, aliases: ['morocco', 'maroc', 'morocco remote', 'maroc remote'] },
}

const palette = [
  '#7c3aed',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#14b8a6',
  '#ec4899',
  '#0ea5e9',
  '#84cc16',
]

function normalize(value: any) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[_,-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function text(row: Row | null | undefined, keys: string[], fallback = '') {
  if (!row) return fallback

  for (const key of keys) {
    const value = row?.[key]
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim()
    }
  }

  return fallback
}

function findCity(raw: string) {
  const value = normalize(raw)

  if (!value) return null

  for (const [city, config] of Object.entries(CITY_COORDS)) {
    const aliases = [city, ...config.aliases].map(normalize)
    if (aliases.some((alias) => value === alias || value.includes(alias))) {
      return { city, ...config }
    }
  }

  return null
}

function cityFromRow(row: Row, mode: Mode) {
  if (mode === 'interviews') {
    return text(row, ['city', 'location_city', 'interview_city', 'meeting_city', 'location', 'meeting_location', 'address'], '')
  }

  if (mode === 'candidates') {
    return text(row, ['city', 'location', 'address', 'candidate_city', 'current_city', 'preferred_location'], '')
  }

  return text(row, ['city', 'location', 'job_location', 'work_location', 'office_city', 'department_city'], '')
}

function statusOf(row: Row) {
  return normalize(text(row, ['status', 'interview_status', 'pipeline_stage', 'stage'], 'active'))
}

function isPending(row: Row) {
  const status = statusOf(row)
  return status.includes('pending') || status.includes('wait') || status.includes('screening')
}

function isRisk(row: Row) {
  const status = statusOf(row)
  return status.includes('reject') || status.includes('cancel') || status.includes('risk') || status.includes('blocked')
}

function labelForMode(mode: Mode) {
  if (mode === 'candidates') return 'Candidates'
  if (mode === 'interviews') return 'Interviews'
  return 'Requisitions'
}

export default function RecruitmentLiveGeoMapPanel({
  candidates,
  openings,
  interviews,
}: {
  candidates: Row[]
  openings: Row[]
  interviews: Row[]
}) {
  const [mode, setMode] = useState<Mode>('requisitions')
  const [selectedCity, setSelectedCity] = useState('')

  const sourceRows = mode === 'candidates' ? candidates : mode === 'interviews' ? interviews : openings

  const points = useMemo(() => {
    const grouped = new Map<string, any>()

    sourceRows.forEach((row) => {
      const found = findCity(cityFromRow(row, mode))
      if (!found) return

      if (!grouped.has(found.city)) {
        grouped.set(found.city, {
          city: found.city,
          lat: found.lat,
          lng: found.lng,
          count: 0,
          active: 0,
          pending: 0,
          risk: 0,
          items: [],
          color: palette[grouped.size % palette.length],
        })
      }

      const bucket = grouped.get(found.city)
      bucket.count += 1
      bucket.pending += isPending(row) ? 1 : 0
      bucket.risk += isRisk(row) ? 1 : 0
      bucket.active += !isPending(row) && !isRisk(row) ? 1 : 0
      bucket.items.push(row)
    })

    return Array.from(grouped.values()).sort((a, b) => b.count - a.count)
  }, [sourceRows, mode])

  const selected = points.find((point) => point.city === selectedCity) || points[0]
  const unmapped = sourceRows.length - points.reduce((total, point) => total + point.count, 0)

  return (
    <section className="w-full max-w-none overflow-hidden rounded-[38px] border border-white/80 bg-white shadow-[0_26px_90px_rgba(15,23,42,0.09)] ring-1 ring-slate-100">
      <div className="border-b border-slate-200 bg-gradient-to-r from-white via-cyan-50/50 to-violet-50/40 px-6 py-6 lg:px-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
                Live synced map
              </span>
              <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-violet-700">
                Recruitment geography
              </span>
            </div>

            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 lg:text-4xl">
              Recruitment Distribution by Location
            </h2>

            <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-500">
              Interactive OpenStreetMap zoning for recruitment requisitions, candidates and interviews.
              Counts update from live synced page records and remain open for future data additions.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-4 xl:min-w-[620px]">
            {[
              ['Total records', sourceRows.length, Radio, 'border-violet-100 bg-violet-50 text-violet-700'],
              ['City zones', points.length, MapPin, 'border-cyan-100 bg-cyan-50 text-cyan-700'],
              ['Pending', points.reduce((t, p) => t + p.pending, 0), CalendarClock, 'border-amber-100 bg-amber-50 text-amber-700'],
              ['Unmapped', unmapped, Sparkles, 'border-rose-100 bg-rose-50 text-rose-700'],
            ].map(([label, value, Icon, tone]: any) => (
              <div key={label} className={`rounded-[24px] border p-4 shadow-sm ${tone}`}>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">{label}</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-3xl font-black text-slate-950">{value}</p>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {([
            ['requisitions', 'Requisitions', BriefcaseBusiness],
            ['candidates', 'Candidates', Users],
            ['interviews', 'Interviews', CalendarClock],
          ] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setMode(key)
                setSelectedCity('')
              }}
              className={
                mode === key
                  ? 'rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200'
                  : 'rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-violet-200 hover:bg-violet-50'
              }
            >
              <Icon className="mr-2 inline h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_430px]">
        <div className="h-[640px] min-h-[640px] w-full overflow-hidden rounded-[34px] border border-slate-200 bg-slate-100 shadow-inner">
          <RecruitmentGeoLeafletMap
            points={points}
            selectedCity={selected?.city || ''}
            onSelectCity={setSelectedCity}
          />
        </div>

        <aside className="rounded-[34px] border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            {labelForMode(mode)} city intelligence
          </p>

          <h3 className="mt-2 text-2xl font-black text-slate-950">
            {selected?.city || 'No mapped city'}
          </h3>

          <p className="mt-1 text-sm font-bold text-slate-500">
            {selected ? `${selected.count} live record(s)` : 'No records mapped yet.'}
          </p>

          {selected ? (
            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-white p-3 text-center ring-1 ring-slate-100">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Active</p>
                <p className="mt-1 text-2xl font-black text-emerald-700">{selected.active}</p>
              </div>
              <div className="rounded-2xl bg-white p-3 text-center ring-1 ring-slate-100">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Pending</p>
                <p className="mt-1 text-2xl font-black text-amber-700">{selected.pending}</p>
              </div>
              <div className="rounded-2xl bg-white p-3 text-center ring-1 ring-slate-100">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Risk</p>
                <p className="mt-1 text-2xl font-black text-rose-700">{selected.risk}</p>
              </div>
            </div>
          ) : null}

          <div className="mt-5 max-h-[320px] overflow-y-auto pr-1">
            <div className="space-y-2">
              {points.map((point) => (
                <button
                  key={point.city}
                  type="button"
                  onClick={() => setSelectedCity(point.city)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    selected?.city === point.city
                      ? 'border-violet-200 bg-violet-50 text-violet-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-violet-200 hover:bg-violet-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-black">{point.city}</span>
                    <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-black text-slate-700">
                      {point.count}
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${Math.max(6, Math.min(100, point.count * 12))}%`,
                        backgroundColor: point.color,
                      }}
                    />
                  </div>
                </button>
              ))}

              {!points.length ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center">
                  <p className="font-black text-slate-900">No mapped recruitment location</p>
                  <p className="mt-2 text-sm font-bold text-slate-500">
                    Add city/location fields to candidates, openings or interviews.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
