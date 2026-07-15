'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type Employee = {
  id: string
  name: string
  role: string
  department: string
  status: string
  city: string
  lat: number
  lng: number
  active: boolean
  pending: boolean
  risk: boolean
}

type CityMarker = {
  city: string
  lat: number
  lng: number
  count: number
  active: number
  pending: number
  risk: number
  employees?: Employee[]
}

type Props = {
  markers: CityMarker[]
  total: number
  approvals: number
  risks: number
}

declare global {
  interface Window {
    L?: any
  }
}

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'

const CITY_PALETTE = [
  '#7c3aed', // violet
  '#2563eb', // blue
  '#0ea5e9', // sky
  '#14b8a6', // teal
  '#22c55e', // green
  '#84cc16', // lime
  '#f59e0b', // amber
  '#f97316', // orange
  '#ef4444', // red
  '#ec4899', // pink
  '#8b5cf6', // indigo-violet
  '#06b6d4', // cyan
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

function jitter(index: number) {
  const angle = (index * 137.5 * Math.PI) / 180
  const radius = 0.012 + (index % 5) * 0.004
  return {
    lat: Math.sin(angle) * radius,
    lng: Math.cos(angle) * radius,
  }
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
  return CITY_PALETTE[hashCity(city) % CITY_PALETTE.length]
}

function riskColor(marker: CityMarker) {
  if (marker.risk > 0) return '#ef4444'
  if (marker.pending > 0) return '#f59e0b'
  return '#22c55e'
}

function employeeColor(employee: Employee) {
  if (employee.risk) return '#ef4444'
  if (employee.pending) return '#f59e0b'
  if (employee.active) return '#22c55e'
  return '#64748b'
}

export default function InteractiveMoroccoHRMap({ markers, total, approvals, risks }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const leafletMapRef = useRef<any>(null)
  const layerRef = useRef<any>(null)

  const [mode, setMode] = useState<'city' | 'employee' | 'risk'>('city')
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [liveCities, setLiveCities] = useState<CityMarker[]>(markers || [])
  const [employees, setEmployees] = useState<Employee[]>([])

  useEffect(() => {
    let alive = true

    async function loadEmployeeMap() {
      setLoading(true)
      try {
        const res = await fetch('/api/hr/map-employees', { cache: 'no-store' })
        const payload = await res.json().catch(() => null)
        if (!alive) return

        if (payload?.ok) {
          setLiveCities(Array.isArray(payload.data?.cities) ? payload.data.cities : [])
          setEmployees(Array.isArray(payload.data?.employees) ? payload.data.employees : [])
        }
      } catch {
        // fallback to server props
      } finally {
        if (alive) setLoading(false)
      }
    }

    loadEmployeeMap()
    return () => {
      alive = false
    }
  }, [])

  const safeCities = useMemo(
    () => liveCities.filter((marker) => Number.isFinite(marker.lat) && Number.isFinite(marker.lng) && marker.count > 0),
    [liveCities],
  )

  const safeEmployees = useMemo(
    () => employees.filter((employee) => Number.isFinite(employee.lat) && Number.isFinite(employee.lng)),
    [employees],
  )

  const totalEmployees = safeEmployees.length || total || safeCities.reduce((sum, city) => sum + city.count, 0)
  const totalRisks = safeCities.reduce((sum, city) => sum + city.risk, 0) || risks
  const totalPending = safeCities.reduce((sum, city) => sum + city.pending, 0) || approvals

  useEffect(() => {
    let cancelled = false

    async function init() {
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

        if (layerRef.current) {
          layerRef.current.clearLayers()
        } else {
          layerRef.current = L.layerGroup().addTo(leafletMapRef.current)
        }

        const bounds: any[] = []

        if (mode === 'employee') {
          safeEmployees.forEach((employee, index) => {
            const offset = jitter(index)
            const lat = employee.lat + offset.lat
            const lng = employee.lng + offset.lng
            const color = employeeColor(employee)

            const html = `
              <div style="
                width:18px;height:18px;border-radius:999px;
                background:${color};
                border:3px solid white;
                box-shadow:0 10px 22px rgba(15,23,42,.25);
              "></div>
            `

            const icon = L.divIcon({
              html,
              className: 'angelcare-hr-employee-pin',
              iconSize: [18, 18],
              iconAnchor: [9, 9],
            })

            const popup = `
              <div style="min-width:220px;font-family:Inter,system-ui,sans-serif">
                <strong style="font-size:15px;color:#0f172a">${employee.name}</strong>
                <div style="margin-top:8px;display:grid;gap:5px;font-size:12px;color:#334155">
                  <span>City: <b>${employee.city}</b></span>
                  <span>Role: <b>${employee.role}</b></span>
                  <span>Department: <b>${employee.department}</b></span>
                  <span>Status: <b>${employee.status || 'unknown'}</b></span>
                </div>
              </div>
            `

            L.marker([lat, lng], { icon }).bindPopup(popup).addTo(layerRef.current)
            bounds.push([lat, lng])
          })
        } else {
          safeCities.forEach((marker) => {
            const color = mode === 'risk' ? riskColor(marker) : cityColor(marker.city)
            const radius = Math.max(20, Math.min(38, 18 + marker.count * 2.2))

            const html = `
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
                  font-size:16px;
                  border:4px solid rgba(255,255,255,.96);
                  box-shadow:0 18px 40px rgba(15,23,42,.25);
                  line-height:1;
                ">
                  ${marker.count}
                </div>
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
                ">
                  ${marker.city}
                </div>
              </div>
            `

            const icon = L.divIcon({
              html,
              className: 'angelcare-hr-city-marker',
              iconSize: [radius * 2.5, radius * 3.3],
              iconAnchor: [radius * 1.25, radius * 1.15],
            })

            const employeeList = (marker.employees || [])
              .slice(0, 10)
              .map((employee) => `<li>${employee.name} — ${employee.role}</li>`)
              .join('')

            const popup = `
              <div style="min-width:240px;font-family:Inter,system-ui,sans-serif">
                <strong style="font-size:15px;color:#0f172a">${marker.city}</strong>
                <div style="margin-top:8px;display:grid;gap:5px;font-size:12px;color:#334155">
                  <span>Employee count: <b>${marker.count}</b></span>
                  <span>Active: <b style="color:#16a34a">${marker.active}</b></span>
                  <span>Pending: <b style="color:#d97706">${marker.pending}</b></span>
                  <span>Risk: <b style="color:#dc2626">${marker.risk}</b></span>
                </div>
                ${employeeList ? `<hr style="margin:10px 0;border:0;border-top:1px solid #e2e8f0"/><ul style="padding-left:16px;margin:0;font-size:12px;color:#334155">${employeeList}</ul>` : ''}
              </div>
            `

            L.marker([marker.lat, marker.lng], { icon }).bindPopup(popup).addTo(layerRef.current)

            L.circle([marker.lat, marker.lng], {
              radius: Math.max(7000, marker.count * 4500),
              color,
              fillColor: color,
              fillOpacity: mode === 'risk' ? 0.14 : 0.07,
              weight: 2,
            }).addTo(layerRef.current)

            bounds.push([marker.lat, marker.lng])
          })
        }

        if (bounds.length) {
          leafletMapRef.current.fitBounds(bounds, { padding: [54, 54], maxZoom: mode === 'employee' ? 9 : 8 })
        }

        setReady(true)
      } catch {
        setFailed(true)
      }
    }

    init()

    return () => {
      cancelled = true
    }
  }, [safeCities, safeEmployees, mode])

  return (
    <div className="relative h-[390px] overflow-hidden rounded-[30px] border border-violet-100 bg-white">
      <div className="absolute left-4 top-4 z-[500] rounded-2xl bg-white/95 p-3 text-[11px] font-black text-slate-700 shadow-xl ring-1 ring-slate-100 backdrop-blur">
        <p className="mb-1 text-violet-700">Employee city map</p>
        <p>{totalEmployees} employee profile(s)</p>
        <p>{safeCities.length} city zone(s) · {totalPending} pending · {totalRisks} risk</p>
      </div>

      <div className="absolute right-4 top-4 z-[500] flex gap-2 rounded-2xl bg-white/95 p-2 shadow-xl ring-1 ring-slate-100">
        {[
          ['city', 'City count'],
          ['employee', 'Employees'],
          ['risk', 'Risk'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setMode(key as 'city' | 'employee' | 'risk')}
            className={`rounded-xl px-3 py-2 text-[11px] font-black ${mode === key ? 'bg-violet-600 text-white' : 'bg-slate-50 text-slate-600'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {failed ? (
        <div className="grid h-full place-items-center bg-gradient-to-br from-violet-50 to-white p-6 text-center">
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
          <div className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-violet-700 shadow-xl">
            {loading ? 'Fetching employee location data…' : 'Loading live map…'}
          </div>
        </div>
      ) : null}
    </div>
  )
}
