'use client'

import { useEffect, useMemo, useState } from 'react'
import * as ReactLeaflet from 'react-leaflet'

type AnyRecord = Record<string, any>

const MapContainer = ReactLeaflet.MapContainer as any
const TileLayer = ReactLeaflet.TileLayer as any
const Circle = ReactLeaflet.Circle as any
const CircleMarker = ReactLeaflet.CircleMarker as any
const Popup = ReactLeaflet.Popup as any
const Tooltip = ReactLeaflet.Tooltip as any
const useMap = ReactLeaflet.useMap as any


type Props = {
  missions?: AnyRecord[]
  cities?: AnyRecord[]
  selectedCity?: string
  setSelectedCity?: (value: string) => void
  onOpenMission?: (item: AnyRecord) => void
}

const MOROCCO_CENTER: [number, number] = [33.9716, -6.8498]

const CITY_COORDS: Record<string, { lat: number; lng: number; color: string }> = {
  RABAT: { lat: 34.0209, lng: -6.8416, color: '#2563eb' },
  TEMARA: { lat: 33.9287, lng: -6.9066, color: '#0ea5e9' },
  SALE: { lat: 34.0372, lng: -6.7985, color: '#06b6d4' },
  CASABLANCA: { lat: 33.5731, lng: -7.5898, color: '#8b5cf6' },
  MOHAMMEDIA: { lat: 33.6861, lng: -7.3829, color: '#a855f7' },
  KENITRA: { lat: 34.261, lng: -6.5802, color: '#14b8a6' },
  MARRAKECH: { lat: 31.6295, lng: -7.9811, color: '#f97316' },
  AGADIR: { lat: 30.4278, lng: -9.5981, color: '#fb7185' },
  TANGER: { lat: 35.7595, lng: -5.834, color: '#22c55e' },
  TANGIER: { lat: 35.7595, lng: -5.834, color: '#22c55e' },
  FES: { lat: 34.0331, lng: -5.0003, color: '#eab308' },
  MEKNES: { lat: 33.873, lng: -5.5407, color: '#84cc16' },
  'EL JADIDA': { lat: 33.2316, lng: -8.5007, color: '#ef4444' },
  OUJDA: { lat: 34.6814, lng: -1.9086, color: '#f43f5e' },
  TETOUAN: { lat: 35.5889, lng: -5.3626, color: '#38bdf8' },
  NADOR: { lat: 35.1681, lng: -2.9335, color: '#6366f1' },
  'BENI MELLAL': { lat: 32.3373, lng: -6.3498, color: '#65a30d' },
  KHOURIBGA: { lat: 32.8811, lng: -6.9063, color: '#0f766e' },
  SAFI: { lat: 32.2994, lng: -9.2372, color: '#be123c' },
}

function arr<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : []
}

function text(value: unknown, fallback = '') {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number') return String(value)
  return fallback
}

function norm(value: unknown) {
  return text(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

function dateFrom(value: unknown): Date | null {
  if (!value) return null
  const d = new Date(String(value))
  return Number.isNaN(d.getTime()) ? null : d
}

function missionDate(m: AnyRecord) {
  return (
    dateFrom(m.scheduled_at) ||
    dateFrom(m.scheduled_date) ||
    dateFrom(m.scheduledDate) ||
    dateFrom(m.date) ||
    dateFrom(m.start_at) ||
    dateFrom(m.startAt) ||
    dateFrom(m.mission_date) ||
    dateFrom(m.created_at)
  )
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function startOfWeek(date: Date) {
  const d = startOfDay(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

function endOfWeek(date: Date) {
  const d = startOfWeek(date)
  d.setDate(d.getDate() + 6)
  d.setHours(23, 59, 59, 999)
  return d
}

function sameDay(a: Date, b: Date) {
  return startOfDay(a).getTime() === startOfDay(b).getTime()
}

function inWindow(m: AnyRecord, ref: Date, range: 'day' | 'week') {
  const d = missionDate(m)
  if (!d) return false
  if (range === 'day') return sameDay(d, ref)
  return d >= startOfWeek(ref) && d <= endOfWeek(ref)
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatRange(date: Date, range: 'day' | 'week') {
  if (range === 'day') return formatDate(date)
  const s = startOfWeek(date)
  const e = endOfWeek(date)
  return `${s.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} → ${e.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
}

function missionCity(m: AnyRecord) {
  return (
    text(m.city) ||
    text(m.city_name) ||
    text(m.location_city) ||
    text(m.family_city) ||
    text(m.client_city) ||
    text(m.zone_city) ||
    text(m.zone) ||
    'RABAT'
  )
}

function missionZone(m: AnyRecord) {
  return text(m.zone) || text(m.family_zone) || text(m.location_zone) || '—'
}

function missionTitle(m: AnyRecord) {
  return text(m.code) || text(m.reference) || text(m.title) || `Mission #${text(m.id, '?')}`
}

function missionService(m: AnyRecord) {
  return text(m.service_type) || text(m.serviceType) || text(m.mission_type) || 'Mission'
}

function missionClient(m: AnyRecord) {
  return (
    text(m.family_name) ||
    text(m.familyName) ||
    text(m.client_name) ||
    text(m.clientName) ||
    (m.family_id != null ? `Family #${m.family_id}` : 'Unassigned family')
  )
}

function missionCaregiver(m: AnyRecord) {
  return (
    text(m.caregiver_name) ||
    text(m.caregiverName) ||
    text(m.agent_name) ||
    text(m.agentName) ||
    (m.caregiver_id != null ? `Agent #${m.caregiver_id}` : 'Unassigned')
  )
}

function missionStatus(m: AnyRecord): 'upcoming' | 'active' | 'cancelled' {
  const raw = [
    m.status,
    m.lifecycle_stage,
    m.lifecycleStage,
    m.dispatch_status,
    m.dispatchStatus,
    m.scheduled_status,
  ]
    .map((v) => text(v))
    .join(' ')
    .toLowerCase()

  if (raw.includes('cancel')) return 'cancelled'
  if (
    raw.includes('progress') ||
    raw.includes('active') ||
    raw.includes('started') ||
    raw.includes('route') ||
    raw.includes('site') ||
    raw.includes('accepted')
  ) {
    return 'active'
  }

  return 'upcoming'
}

function statusTone(status: 'upcoming' | 'active' | 'cancelled') {
  if (status === 'active') return { dot: '#16a34a', halo: '#22c55e', label: 'Active live' }
  if (status === 'cancelled') return { dot: '#dc2626', halo: '#ef4444', label: 'Cancelled' }
  return { dot: '#f59e0b', halo: '#fbbf24', label: 'Upcoming / not started' }
}

function pointForCity(city: string, index: number) {
  const base = CITY_COORDS[norm(city)] || CITY_COORDS.RABAT
  const angle = (index * 47 * Math.PI) / 180
  const ring = Math.floor(index / 7) + 1
  const offset = 0.045 * ring

  return {
    base,
    lat: base.lat + Math.sin(angle) * offset,
    lng: base.lng + Math.cos(angle) * offset,
  }
}

function FitMap({ points }: { points: { lat: number; lng: number }[] }) {
  const map = useMap()

  useEffect(() => {
    if (!points.length) {
      map.setView(MOROCCO_CENTER, 6)
      return
    }

    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 10)
      return
    }

    map.fitBounds(points.map((p) => [p.lat, p.lng] as [number, number]), {
      padding: [44, 44],
    })
  }, [map, points])

  return null
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3">
      <span className="inline-flex h-4 w-4 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-sm font-bold text-slate-700">{label}</span>
    </div>
  )
}

export function CareLinkOpsMissionRadarMapClient({
  missions = [],
  cities = [],
  selectedCity = '',
  setSelectedCity,
  onOpenMission,
}: Props) {
  const [range, setRange] = useState<'day' | 'week'>('day')
  const [offset, setOffset] = useState(0)
  const [internalCity, setInternalCity] = useState('')
  const [selectedMission, setSelectedMission] = useState<AnyRecord | null>(null)

  const cityValue = selectedCity || internalCity
  const setCityValue = setSelectedCity || setInternalCity

  const referenceDate = useMemo(() => {
    return range === 'day' ? addDays(new Date(), offset) : addDays(new Date(), offset * 7)
  }, [offset, range])

  const prepared = useMemo(() => {
    const counters: Record<string, number> = {}

    return arr(missions)
      .map((mission) => {
        const city = missionCity(mission)
        const key = norm(city)
        const index = counters[key] || 0
        counters[key] = index + 1

        const plotted = pointForCity(city, index)
        const status = missionStatus(mission)
        const tone = statusTone(status)

        return {
          raw: mission,
          city,
          key,
          status,
          tone,
          cityColor: plotted.base.color,
          lat: plotted.base.lat,
          lng: plotted.base.lng,
          plotLat: plotted.lat,
          plotLng: plotted.lng,
          date: missionDate(mission),
        }
      })
      .filter((item) => !!item.date)
  }, [missions])

  const filtered = useMemo(() => {
    const cityKey = norm(cityValue)

    return prepared.filter((item) => {
      if (!item.date) return false
      if (cityKey && item.key !== cityKey) return false
      return inWindow(item.raw, referenceDate, range)
    })
  }, [prepared, cityValue, referenceDate, range])

  useEffect(() => {
    if (!selectedMission) return
    const exists = filtered.some((item) => String(item.raw?.id) === String(selectedMission.id))
    if (!exists) setSelectedMission(null)
  }, [filtered, selectedMission])

  const counts = useMemo(() => {
    return {
      total: filtered.length,
      upcoming: filtered.filter((m) => m.status === 'upcoming').length,
      active: filtered.filter((m) => m.status === 'active').length,
      cancelled: filtered.filter((m) => m.status === 'cancelled').length,
      cities: new Set(filtered.map((m) => m.key)).size,
    }
  }, [filtered])

  const cityOptions = useMemo(() => {
    const fromMissions = prepared.map((m) => m.city)
    const fromCities = arr(cities)
      .map((c) => text(c.name) || text(c.city) || text(c.label))
      .filter(Boolean)

    return [...new Set([...fromMissions, ...fromCities])].sort()
  }, [prepared, cities])

  const selectMission = (mission: AnyRecord) => {
    setSelectedMission(mission)
    onOpenMission?.(mission)
  }

  return (
    <div className="carelink-radar-map space-y-4">
      <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.26em] text-blue-600">
                Live mission radar
              </div>
              <div className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">
                {formatRange(referenceDate, range)}
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-500">
                Click any mission point to open its synced premium mission card.
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setRange('day')
                  setOffset(0)
                }}
                className={`rounded-2xl px-4 py-2 text-sm font-black ${range === 'day' ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}
              >
                Day
              </button>
              <button
                onClick={() => {
                  setRange('week')
                  setOffset(0)
                }}
                className={`rounded-2xl px-4 py-2 text-sm font-black ${range === 'week' ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}
              >
                Week
              </button>
              <button onClick={() => setOffset((v) => v - 1)} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700">
                Previous
              </button>
              <button onClick={() => setOffset(0)} className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-black text-white">
                Today
              </button>
              <button onClick={() => setOffset((v) => v + 1)} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700">
                Next
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <MiniStat label="Visible missions" value={counts.total} tone="blue" />
            <MiniStat label="Upcoming" value={counts.upcoming} tone="amber" />
            <MiniStat label="Active live" value={counts.active} tone="emerald" />
            <MiniStat label="Cancelled" value={counts.cancelled} tone="rose" />
            <MiniStat label="Cities covered" value={counts.cities} tone="violet" />
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4 shadow-sm">
          <div className="text-[11px] font-black uppercase tracking-[0.26em] text-slate-500">
            Filters & legend
          </div>

          <label className="mt-4 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            City
          </label>
          <select
            value={cityValue}
            onChange={(e) => setCityValue(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none"
          >
            <option value="">All cities</option>
            {cityOptions.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          <div className="mt-4 space-y-3">
            <LegendRow color="#f59e0b" label="Upcoming today / not started" />
            <LegendRow color="#16a34a" label="Active live started mission" />
            <LegendRow color="#dc2626" label="Cancelled mission" />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
        <div className="h-[540px] w-full">
          <MapContainer
            center={MOROCCO_CENTER}
            zoom={6}
            minZoom={5}
            scrollWheelZoom={true}
            zoomControl={true}
            className="h-full w-full"
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <FitMap points={filtered.map((item) => ({ lat: item.plotLat, lng: item.plotLng }))} />

            {filtered.map((item, idx) => (
              <Circle
                key={`halo-${item.raw?.id || idx}`}
                center={[item.lat, item.lng]}
                radius={item.status === 'active' ? 14000 : item.status === 'cancelled' ? 9500 : 11500}
                interactive={false}
                bubblingMouseEvents={false}
                pathOptions={{
                  color: item.cityColor,
                  weight: 2,
                  fillColor: item.tone.halo,
                  fillOpacity: item.status === 'cancelled' ? 0.1 : 0.16,
                }}
              />
            ))}

            {filtered.map((item, idx) => (
              <CircleMarker
                key={`point-${item.raw?.id || idx}`}
                center={[item.plotLat, item.plotLng]}
                radius={13}
                interactive={true}
                bubblingMouseEvents={false}
                pathOptions={{
                  color: '#ffffff',
                  weight: 3,
                  fillColor: item.tone.dot,
                  fillOpacity: 1,
                }}
                eventHandlers={{
                  mouseover: (event: any) => event?.target?.bringToFront?.(),
                  click: (event: any) => {
                    event?.originalEvent?.preventDefault?.()
                    event?.originalEvent?.stopPropagation?.()
                    event?.target?.bringToFront?.()
                    selectMission(item.raw)
                  },
                }}
              >
                <Tooltip direction="top" offset={[0, -8]}>
                  {missionTitle(item.raw)} · {item.city}
                </Tooltip>

                <Popup>
                  <div className="min-w-[260px] space-y-2">
                    <div className="text-sm font-black text-slate-950">{missionTitle(item.raw)}</div>
                    <div className="text-xs font-bold text-slate-500">{missionService(item.raw)}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl bg-slate-50 p-2">
                        <b>City</b>
                        <div>{item.city}</div>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-2">
                        <b>Zone</b>
                        <div>{missionZone(item.raw)}</div>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-2">
                        <b>Client</b>
                        <div>{missionClient(item.raw)}</div>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-2">
                        <b>Caregiver</b>
                        <div>{missionCaregiver(item.raw)}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => selectMission(item.raw)}
                      className="w-full rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white"
                    >
                      Open premium card
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-xs font-bold text-slate-500">
            Scroll to zoom. Click any colored mission point to open the synced live card.
          </div>
          <div className="rounded-full bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm">
            {filtered.length} clickable point(s)
          </div>
        </div>
      </div>

      {selectedMission && (
        <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-blue-700">
                Premium live mission card
              </div>
              <h3 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-950">
                {missionTitle(selectedMission)}
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {missionClient(selectedMission)}
              </p>
            </div>
            <div
              className="rounded-full px-4 py-2 text-xs font-black text-white shadow-sm"
              style={{ background: statusTone(missionStatus(selectedMission)).dot }}
            >
              {statusTone(missionStatus(selectedMission)).label}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-8">
            <Detail label="City" value={missionCity(selectedMission)} />
            <Detail label="Zone" value={missionZone(selectedMission)} />
            <Detail label="Date" value={missionDate(selectedMission) ? formatDate(missionDate(selectedMission) as Date) : 'Not scheduled'} />
            <Detail label="Start time" value={missionTimeValue(selectedMission, 'start')} />
            <Detail label="End time" value={missionTimeValue(selectedMission, 'end')} />
            <Detail label="Caregiver" value={missionCaregiver(selectedMission)} />
            <Detail label="Service" value={missionService(selectedMission)} />
            <Detail label="Mission ID" value={text(selectedMission.id, '—')} />
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_56px_1fr]">
            <div className="rounded-[22px] border border-slate-200 bg-white p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Pickup / Departure</div>
              <div className="mt-2 text-sm font-black leading-6 text-slate-900">{missionPickup(selectedMission)}</div>
            </div>
            <div className="grid place-items-center text-3xl font-black text-blue-600">→</div>
            <div className="rounded-[22px] border border-slate-200 bg-white p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Drop-off / Destination</div>
              <div className="mt-2 text-sm font-black leading-6 text-slate-900">{missionDropoff(selectedMission)}</div>
            </div>
          </div>

          <div className="mt-4 rounded-[22px] border border-blue-100 bg-blue-50/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-700">Transport route details</div>
                <div className="mt-2 text-sm font-black leading-6 text-slate-900">{missionRouteSummary(selectedMission)}</div>
              </div>
              <div className="rounded-full bg-white px-4 py-2 text-xs font-black text-blue-700 shadow-sm">
                {missionTransportMode(selectedMission)}
              </div>
            </div>
            <div className="mt-3 rounded-2xl bg-white/80 p-3 text-sm font-semibold leading-6 text-slate-600">
              {missionRouteNotes(selectedMission)}
            </div>
          </div>

          <div className="mt-4 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
              Operational notes
            </div>
            <div className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              {text(selectedMission.notes || selectedMission.instructions || selectedMission.special_instructions || selectedMission.description, 'No mission notes loaded yet.')}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onOpenMission?.(selectedMission)}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(37,99,235,0.24)] hover:bg-blue-700"
            >
              Open full mission dossier
            </button>
            <button
              type="button"
              onClick={() => onOpenMission?.({ ...selectedMission, __openMode: 'edit' })}
              className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black text-blue-700"
            >
              Edit mission dossier
            </button>
            <button
              type="button"
              onClick={() => printMissionOrderA4(selectedMission)}
              className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700"
            >
              Print ordre mission A4
            </button>
            <button
              type="button"
              onClick={() => setSelectedMission(null)}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone: 'blue' | 'amber' | 'emerald' | 'rose' | 'violet' }) {
  const toneClass = {
    blue: 'border-blue-100 bg-blue-50 text-blue-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    rose: 'border-rose-100 bg-rose-50 text-rose-700',
    violet: 'border-violet-100 bg-violet-50 text-violet-700',
  }[tone]

  return (
    <div className={`rounded-2xl border p-3 ${toneClass}`}>
      <div className="text-[11px] font-black uppercase tracking-[0.22em]">{label}</div>
      <div className="mt-1 text-2xl font-black text-slate-950">{value}</div>
    </div>
  )
}


function missionTimeValue(m: AnyRecord, kind: 'start' | 'end') {
  const raw =
    kind === 'start'
      ? m.start_time || m.startTime || m.scheduled_start_time || m.scheduledStartTime || m.starts_at || m.start_at || m.scheduled_at || m.scheduledStart
      : m.end_time || m.endTime || m.scheduled_end_time || m.scheduledEndTime || m.ends_at || m.end_at || m.scheduled_end || m.scheduledEnd

  if (!raw) return '—'

  if (typeof raw === 'string' && /^\d{1,2}:\d{2}/.test(raw)) {
    return raw.slice(0, 5)
  }

  const d = dateFrom(raw)
  if (!d) return text(raw, '—')

  return d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function missionTransportMode(m: AnyRecord) {
  return (
    text(m.transport_mode) ||
    text(m.transportMode) ||
    text(m.transport) ||
    text(m.route_transport) ||
    text(m.transport_type) ||
    'Non renseigné'
  )
}

function missionPickup(m: AnyRecord) {
  return (
    text(m.pickup_address) ||
    text(m.pickupAddress) ||
    text(m.pickup_location) ||
    text(m.pickupLocation) ||
    text(m.departure_address) ||
    text(m.departureAddress) ||
    text(m.route_from) ||
    text(m.from) ||
    'Non renseigné'
  )
}

function missionDropoff(m: AnyRecord) {
  return (
    text(m.dropoff_address) ||
    text(m.dropoffAddress) ||
    text(m.dropoff_location) ||
    text(m.dropoffLocation) ||
    text(m.arrival_address) ||
    text(m.arrivalAddress) ||
    text(m.route_to) ||
    text(m.to) ||
    text(m.destination) ||
    'Non renseigné'
  )
}

function missionRouteNotes(m: AnyRecord) {
  return (
    text(m.transport_notes) ||
    text(m.transportNotes) ||
    text(m.route_notes) ||
    text(m.routeNotes) ||
    text(m.route_detail) ||
    text(m.routeDetails) ||
    text(m.transport_instructions) ||
    text(m.transportInstructions) ||
    text(m.notes_transport) ||
    'Aucune instruction transport renseignée.'
  )
}

function missionRouteSummary(m: AnyRecord) {
  const pickup = missionPickup(m)
  const dropoff = missionDropoff(m)

  if (pickup === 'Non renseigné' && dropoff === 'Non renseigné') {
    return 'Aucun itinéraire transport renseigné.'
  }

  return `${pickup} → ${dropoff}`
}

function missionReference(m: AnyRecord) {
  return text(m.reference) || text(m.code) || (m.id != null ? `M-${m.id}` : 'MISSION')
}

function escapeHtml(value: unknown) {
  return text(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function printMissionOrderA4(mission: AnyRecord) {
  const ref = missionReference(mission)
  const status = statusTone(missionStatus(mission)).label
  const date = missionDate(mission) ? formatDate(missionDate(mission) as Date) : 'Non planifiée'
  const start = missionTimeValue(mission, 'start')
  const end = missionTimeValue(mission, 'end')

  const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Ordre de Mission ${escapeHtml(ref)}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, Arial, sans-serif;
      color: #0f172a;
      background: white;
    }
    .page {
      min-height: 267mm;
      border: 1px solid #dbe3ef;
      border-radius: 22px;
      overflow: hidden;
    }
    .hero {
      padding: 28px;
      background: linear-gradient(135deg, #0f172a, #1d4ed8);
      color: white;
    }
    .eyebrow {
      font-size: 10px;
      letter-spacing: 0.34em;
      text-transform: uppercase;
      font-weight: 900;
      opacity: .82;
    }
    h1 {
      margin: 10px 0 0;
      font-size: 30px;
      letter-spacing: -0.04em;
      line-height: 1;
    }
    .ref {
      margin-top: 16px;
      display: inline-block;
      border: 1px solid rgba(255,255,255,.25);
      border-radius: 999px;
      padding: 9px 14px;
      font-size: 12px;
      font-weight: 900;
      background: rgba(255,255,255,.12);
    }
    .content { padding: 24px; }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    .card {
      border: 1px solid #dbe3ef;
      border-radius: 18px;
      padding: 14px;
      min-height: 78px;
      background: #fbfdff;
    }
    .label {
      font-size: 9px;
      letter-spacing: .24em;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 900;
    }
    .value {
      margin-top: 7px;
      font-size: 14px;
      line-height: 1.35;
      font-weight: 900;
      color: #0f172a;
      word-break: break-word;
    }
    .section {
      margin-top: 18px;
      border: 1px solid #dbe3ef;
      border-radius: 20px;
      padding: 18px;
    }
    .section h2 {
      margin: 0 0 12px;
      font-size: 14px;
      letter-spacing: .18em;
      text-transform: uppercase;
      color: #0f172a;
    }
    .route {
      display: grid;
      grid-template-columns: 1fr 40px 1fr;
      gap: 12px;
      align-items: center;
    }
    .arrow {
      text-align: center;
      font-size: 24px;
      font-weight: 900;
      color: #2563eb;
    }
    .notes {
      margin-top: 12px;
      padding: 14px;
      border-radius: 16px;
      background: #f8fafc;
      color: #334155;
      font-size: 13px;
      line-height: 1.6;
      font-weight: 700;
    }
    .footer {
      margin-top: 20px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    .signature {
      height: 82px;
      border: 1px dashed #cbd5e1;
      border-radius: 18px;
      padding: 12px;
      font-size: 11px;
      font-weight: 900;
      color: #64748b;
    }
    .stamp {
      margin-top: 18px;
      font-size: 10px;
      color: #64748b;
      font-weight: 800;
      text-align: right;
    }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <main class="page">
    <section class="hero">
      <div class="eyebrow">AngelCare Ops · Ordre de Mission</div>
      <h1>Ordre de Mission Terrain</h1>
      <div class="ref">Référence : ${escapeHtml(ref)} · Statut : ${escapeHtml(status)}</div>
    </section>

    <section class="content">
      <div class="grid">
        <div class="card"><div class="label">Service</div><div class="value">${escapeHtml(missionService(mission))}</div></div>
        <div class="card"><div class="label">Client / Famille</div><div class="value">${escapeHtml(missionClient(mission))}</div></div>
        <div class="card"><div class="label">Caregiver / Agent</div><div class="value">${escapeHtml(missionCaregiver(mission))}</div></div>
        <div class="card"><div class="label">Ville</div><div class="value">${escapeHtml(missionCity(mission))}</div></div>
        <div class="card"><div class="label">Zone</div><div class="value">${escapeHtml(missionZone(mission))}</div></div>
        <div class="card"><div class="label">Date</div><div class="value">${escapeHtml(date)}</div></div>
        <div class="card"><div class="label">Heure début</div><div class="value">${escapeHtml(start)}</div></div>
        <div class="card"><div class="label">Heure fin</div><div class="value">${escapeHtml(end)}</div></div>
        <div class="card"><div class="label">Transport</div><div class="value">${escapeHtml(missionTransportMode(mission))}</div></div>
      </div>

      <section class="section">
        <h2>Itinéraire & Transport</h2>
        <div class="route">
          <div class="card"><div class="label">Départ / Pickup</div><div class="value">${escapeHtml(missionPickup(mission))}</div></div>
          <div class="arrow">→</div>
          <div class="card"><div class="label">Arrivée / Destination</div><div class="value">${escapeHtml(missionDropoff(mission))}</div></div>
        </div>
        <div class="notes">${escapeHtml(missionRouteNotes(mission))}</div>
      </section>

      <section class="section">
        <h2>Instructions opérationnelles</h2>
        <div class="notes">
          ${escapeHtml(mission.notes || mission.instructions || mission.special_instructions || mission.description || 'Aucune instruction opérationnelle supplémentaire renseignée.')}
        </div>
      </section>

      <div class="footer">
        <div class="signature">Signature Agent / Caregiver</div>
        <div class="signature">Validation Dispatch / AngelCare Ops</div>
      </div>

      <div class="stamp">
        Document généré depuis AngelCare Ops · Données synchronisées live · ${new Date().toLocaleString('fr-FR')}
      </div>
    </section>
  </main>
  <script>
    window.onload = function () {
      window.focus();
      window.print();
    };
  </script>
</body>
</html>
`

  const win = window.open('', '_blank', 'width=980,height=1200')
  if (!win) return
  win.document.open()
  win.document.write(html)
  win.document.close()
}


function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-black text-slate-900">{value}</div>
    </div>
  )
}
