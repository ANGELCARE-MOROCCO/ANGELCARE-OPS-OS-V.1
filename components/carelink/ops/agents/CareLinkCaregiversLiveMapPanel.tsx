'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type AnyRow = Record<string, any>

declare global {
  interface Window {
    L?: any
  }
}

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'

const CITY_PALETTE = [
  '#2563eb',
  '#7c3aed',
  '#0ea5e9',
  '#14b8a6',
  '#22c55e',
  '#f59e0b',
  '#f97316',
  '#ef4444',
  '#ec4899',
  '#06b6d4',
]

function loadLeaflet(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('Window unavailable'))
    if (window.L) return resolve(window.L)

    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = LEAFLET_CSS
      document.head.appendChild(link)
    }

    const existing = document.querySelector(`script[src="${LEAFLET_JS}"]`) as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve(window.L))
      existing.addEventListener('error', reject)
      return
    }

    const script = document.createElement('script')
    script.src = LEAFLET_JS
    script.async = true
    script.onload = () => resolve(window.L)
    script.onerror = reject
    document.body.appendChild(script)
  })
}

function hashCity(city: string) {
  let hash = 0
  for (let i = 0; i < city.length; i += 1) {
    hash = city.charCodeAt(i) + ((hash << 5) - hash)
    hash |= 0
  }
  return Math.abs(hash)
}

function cityColor(city: string) {
  return CITY_PALETTE[hashCity(city || 'city') % CITY_PALETTE.length]
}

function riskColor(marker: AnyRow) {
  if (Number(marker.risk || 0) > 0) return '#ef4444'
  if (Number(marker.pending || 0) > 0) return '#f59e0b'
  return '#22c55e'
}

function caregiverColor(caregiver: AnyRow) {
  if (caregiver.risk) return '#ef4444'
  if (caregiver.pending) return '#f59e0b'
  if (caregiver.active) return '#22c55e'
  return '#64748b'
}

export function CareLinkCaregiversLiveMapPanel({ initialTotal = 0 }: { initialTotal?: number }) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const leafletMapRef = useRef<any>(null)
  const layerRef = useRef<any>(null)

  const [mode, setMode] = useState<'city' | 'caregiver' | 'risk'>('city')
  const [payload, setPayload] = useState<any>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lastSync, setLastSync] = useState('')

  async function loadMapData() {
    try {
      setLoading(true)
      const res = await fetch('/api/carelink/ops/caregivers/map', { cache: 'no-store' })
      const json = await res.json()
      if (!json?.ok) throw new Error(json?.error || 'Map API returned invalid response')
      setPayload(json.data)
      setLastSync(new Date().toLocaleTimeString())
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMapData()
    const timer = window.setInterval(loadMapData, 45000)
    return () => window.clearInterval(timer)
  }, [])

  const cities = useMemo(() => {
    return Array.isArray(payload?.cities)
      ? payload.cities.filter((x: AnyRow) => Number.isFinite(Number(x.lat)) && Number.isFinite(Number(x.lng)) && Number(x.count || 0) > 0)
      : []
  }, [payload])

  const caregivers = useMemo(() => {
    return Array.isArray(payload?.caregivers)
      ? payload.caregivers.filter((x: AnyRow) => Number.isFinite(Number(x.lat)) && Number.isFinite(Number(x.lng)))
      : []
  }, [payload])

  const total = Number(payload?.total || initialTotal || 0)
  const pending = Number(payload?.pending || cities.reduce((sum: number, x: AnyRow) => sum + Number(x.pending || 0), 0))
  const risk = Number(payload?.risk || cities.reduce((sum: number, x: AnyRow) => sum + Number(x.risk || 0), 0))

  useEffect(() => {
    let cancelled = false

    async function initMap() {
      try {
        const L = await loadLeaflet()
        if (cancelled || !mapRef.current) return

        if (!leafletMapRef.current) {
          leafletMapRef.current = L.map(mapRef.current, {
            center: [31.7917, -7.0926],
            zoom: 5,
            minZoom: 4,
            maxZoom: 14,
            scrollWheelZoom: true,
            zoomControl: true,
          })

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors',
          }).addTo(leafletMapRef.current)
        }

        if (layerRef.current) layerRef.current.clearLayers()
        else layerRef.current = L.layerGroup().addTo(leafletMapRef.current)

        const bounds: any[] = []

        if (mode === 'caregiver') {
          caregivers.forEach((caregiver: AnyRow) => {
            const color = caregiverColor(caregiver)

            const icon = L.divIcon({
              html: `
                <div style="
                  width:20px;height:20px;border-radius:999px;
                  background:${color};
                  border:4px solid white;
                  box-shadow:0 12px 26px rgba(15,23,42,.28);
                "></div>
              `,
              className: 'angelcare-caregiver-pin',
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            })

            const popup = `
              <div style="min-width:245px;font-family:Inter,system-ui,sans-serif">
                <strong style="font-size:16px;color:#0f172a">${caregiver.name}</strong>
                <div style="margin-top:8px;display:grid;gap:6px;font-size:12px;color:#334155">
                  <span>City: <b>${caregiver.city}</b></span>
                  <span>Zone: <b>${caregiver.zone}</b></span>
                  <span>Phone: <b>${caregiver.phone}</b></span>
                  <span>Status: <b>${caregiver.status}</b></span>
                  <span>Readiness: <b>${caregiver.readiness}%</b></span>
                </div>
              </div>
            `

            L.marker([caregiver.lat, caregiver.lng], { icon }).bindPopup(popup).addTo(layerRef.current)
            bounds.push([caregiver.lat, caregiver.lng])
          })
        } else {
          cities.forEach((marker: AnyRow) => {
            const color = mode === 'risk' ? riskColor(marker) : cityColor(marker.city)
            const radius = Math.max(22, Math.min(42, 20 + Number(marker.count || 0) * 2.5))

            const icon = L.divIcon({
              html: `
                <div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-6px);">
                  <div style="
                    min-width:${radius * 2.1}px;
                    height:${radius * 2.1}px;
                    padding:0 10px;
                    border-radius:999px;
                    display:grid;
                    place-items:center;
                    background:${color};
                    color:white;
                    font-weight:900;
                    font-size:17px;
                    border:4px solid rgba(255,255,255,.96);
                    box-shadow:0 18px 42px rgba(15,23,42,.25);
                    line-height:1;
                  ">${marker.count}</div>
                  <div style="
                    margin-top:6px;
                    padding:4px 10px;
                    border-radius:999px;
                    background:rgba(255,255,255,.96);
                    color:#0f172a;
                    font-weight:900;
                    font-size:11px;
                    white-space:nowrap;
                    box-shadow:0 8px 20px rgba(15,23,42,.12);
                    border:1px solid rgba(226,232,240,1);
                  ">${marker.city}</div>
                </div>
              `,
              className: 'angelcare-caregiver-city-marker',
              iconSize: [radius * 2.5, radius * 3.3],
              iconAnchor: [radius * 1.25, radius * 1.15],
            })

            const list = (marker.caregivers || [])
              .slice(0, 10)
              .map((c: AnyRow) => `<li>${c.name} — ${c.status} — ${c.readiness}%</li>`)
              .join('')

            const popup = `
              <div style="min-width:260px;font-family:Inter,system-ui,sans-serif">
                <strong style="font-size:16px;color:#0f172a">${marker.city}</strong>
                <div style="margin-top:8px;display:grid;gap:6px;font-size:12px;color:#334155">
                  <span>Caregivers: <b>${marker.count}</b></span>
                  <span>Available / active: <b style="color:#16a34a">${marker.active}</b></span>
                  <span>Review signals: <b style="color:#d97706">${marker.pending}</b></span>
                  <span>Risk signals: <b style="color:#dc2626">${marker.risk}</b></span>
                </div>
                ${list ? `<hr style="margin:10px 0;border:0;border-top:1px solid #e2e8f0"/><ul style="padding-left:16px;margin:0;font-size:12px;color:#334155">${list}</ul>` : ''}
              </div>
            `

            L.marker([marker.lat, marker.lng], { icon }).bindPopup(popup).addTo(layerRef.current)

            L.circle([marker.lat, marker.lng], {
              radius: Math.max(7000, Number(marker.count || 0) * 4500),
              color,
              fillColor: color,
              fillOpacity: mode === 'risk' ? 0.14 : 0.07,
              weight: 2,
            }).addTo(layerRef.current)

            bounds.push([marker.lat, marker.lng])
          })
        }

        if (bounds.length) {
          leafletMapRef.current.fitBounds(bounds, { padding: [52, 52], maxZoom: mode === 'caregiver' ? 9 : 8 })
        }

        setReady(true)
      } catch {
        setFailed(true)
      }
    }

    initMap()

    return () => {
      cancelled = true
    }
  }, [cities, caregivers, mode])

  return (
    <div className="overflow-hidden rounded-[36px] border border-white/80 bg-white/95 shadow-[0_26px_80px_rgba(15,23,42,0.10)] ring-1 ring-slate-100">
      <div className="border-b border-slate-100 bg-gradient-to-br from-white via-cyan-50/70 to-blue-50/60 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-700">Live caregiver geography</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Caregivers Location Command Map</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
              Same HR live map logic applied to CareLink caregivers: city counts, caregiver pins, readiness risk and live operational coverage.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadMapData}
              className="rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-white shadow-lg transition hover:bg-blue-700"
            >
              {loading ? 'Syncing...' : 'Refresh map'}
            </button>
            <span className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-700">
              {lastSync ? `Synced ${lastSync}` : 'Live sync ready'}
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <MapStat label="City zones" value={cities.length} tone="blue" />
          <MapStat label="Caregivers mapped" value={total} tone="emerald" />
          <MapStat label="Review signals" value={pending} tone="amber" />
          <MapStat label="Risk signals" value={risk} tone="rose" />
        </div>
      </div>

      <div className="p-4">
        <div className="relative h-[390px] overflow-hidden rounded-[30px] border border-blue-100 bg-white">
          <div className="absolute left-4 top-4 z-[500] rounded-2xl bg-white/95 p-3 text-[11px] font-black text-slate-700 shadow-xl ring-1 ring-slate-100 backdrop-blur">
            <p className="mb-1 text-blue-700">CareLink caregiver map</p>
            <p>{total} caregiver profile(s)</p>
            <p>{cities.length} city zone(s) · {pending} review · {risk} risk</p>
          </div>

          <div className="absolute right-4 top-4 z-[500] flex gap-2 rounded-2xl bg-white/95 p-2 shadow-xl ring-1 ring-slate-100">
            {[
              ['city', 'City count'],
              ['caregiver', 'Caregivers'],
              ['risk', 'Risk'],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key as 'city' | 'caregiver' | 'risk')}
                className={`rounded-xl px-3 py-2 text-[11px] font-black ${mode === key ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {failed ? (
            <div className="grid h-full place-items-center bg-gradient-to-br from-blue-50 to-white p-6 text-center">
              <div>
                <b className="text-slate-950">Map engine unavailable</b>
                <p className="mt-2 text-sm font-bold text-slate-500">Leaflet/OpenStreetMap could not load. Check network/CSP, then reload.</p>
              </div>
            </div>
          ) : (
            <div ref={mapRef} className="h-full w-full" />
          )}

          {(loading || (!ready && !failed)) ? (
            <div className="absolute inset-0 z-[400] grid place-items-center bg-white/70 backdrop-blur-sm">
              <div className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-blue-700 shadow-xl">
                {loading ? 'Fetching caregiver location data…' : 'Loading live map…'}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function MapStat({ label, value, tone }: { label: string; value: number; tone: 'blue' | 'emerald' | 'amber' | 'rose' }) {
  const cls = {
    blue: 'border-blue-100 text-blue-700',
    emerald: 'border-emerald-100 text-emerald-700',
    amber: 'border-amber-100 text-amber-700',
    rose: 'border-rose-100 text-rose-700',
  }[tone]

  return (
    <div className={`rounded-2xl border bg-white px-3 py-2 text-xs font-black shadow-sm ${cls}`}>
      {label}
      <br />
      <span className="text-xl text-slate-950">{value}</span>
    </div>
  )
}

export default CareLinkCaregiversLiveMapPanel
