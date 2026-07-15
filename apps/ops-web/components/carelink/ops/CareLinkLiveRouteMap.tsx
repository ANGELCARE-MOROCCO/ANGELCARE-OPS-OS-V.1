'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type RoutePoint = {
  label: string
  type: 'departure' | 'arrival' | 'transit'
  lat: number
  lng: number
  scheduledTime?: string | null
  address?: string | null
}

type LiveRoute = {
  id: string
  missionCode: string
  routeCode: string
  status: string
  color: string
  departure: RoutePoint
  arrival: RoutePoint
  transits: RoutePoint[]
  scheduledDeparture?: string | null
  scheduledArrival?: string | null
}

type OperatedCity = {
  id: string
  name: string
  status: 'operated' | 'suspended'
  lat: number
  lng: number
  radiusKm: number
}

type RouteMetric = {
  latLngs: [number, number][]
  distanceKm: number
  durationMin: number
}

declare global {
  interface Window {
    L?: any
  }
}

const DEFAULT_CENTER: [number, number] = [33.5899, -7.6039]

const CITY_COORDS: Record<string, [number, number]> = {
  casablanca: [33.5731, -7.5898],
  rabat: [34.0209, -6.8416],
  temara: [33.9287, -6.9067],
  salé: [34.0337, -6.7708],
  sale: [34.0337, -6.7708],
  mohammadia: [33.6861, -7.3829],
  bouskoura: [33.4498, -7.6525],
  marrakech: [31.6295, -7.9811],
  fes: [34.0181, -5.0078],
  fès: [34.0181, -5.0078],
  tangier: [35.7595, -5.834],
  tanger: [35.7595, -5.834],
  agadir: [30.4278, -9.5981],
  kenitra: [34.261, -6.5802],
  kénitra: [34.261, -6.5802],
  tetouan: [35.5785, -5.3684],
  tétouan: [35.5785, -5.3684],
  meknes: [33.8935, -5.5473],
}

const DEFAULT_CITIES: OperatedCity[] = [
  { id: 'city-casablanca', name: 'Casablanca', status: 'operated', lat: 33.5731, lng: -7.5898, radiusKm: 12 },
  { id: 'city-rabat', name: 'Rabat', status: 'operated', lat: 34.0209, lng: -6.8416, radiusKm: 10 },
  { id: 'city-temara', name: 'Temara', status: 'operated', lat: 33.9287, lng: -6.9067, radiusKm: 8 },
]

function normalizeCityKey(value: string) {
  return value.trim().toLowerCase()
}

function formatTime(value?: string | null) {
  if (!value) return 'Not scheduled'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('fr-MA', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function distanceKm(points: RoutePoint[]) {
  const toRad = (value: number) => (value * Math.PI) / 180
  let total = 0

  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]
    const b = points[i]
    const r = 6371
    const dLat = toRad(b.lat - a.lat)
    const dLng = toRad(b.lng - a.lng)
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2

    total += 2 * r * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
  }

  return total
}

function durationMin(km: number) {
  return Math.max(1, Math.round((km / 28) * 60))
}

async function fetchRoadRouteMetric(route: LiveRoute): Promise<RouteMetric | null> {
  const points = [route.departure, ...(route.transits || []), route.arrival]
  if (points.length < 2) return null

  const coordinates = points
    .map((point) => `${point.lng},${point.lat}`)
    .join(';')

  const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=false`

  try {
    const response = await fetch(url)
    const payload = await response.json().catch(() => null)
    const osrmRoute = payload?.routes?.[0]

    if (!response.ok || !osrmRoute?.geometry?.coordinates?.length) return null

    return {
      latLngs: osrmRoute.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]),
      distanceKm: Number(osrmRoute.distance || 0) / 1000,
      durationMin: Math.max(1, Math.round(Number(osrmRoute.duration || 0) / 60)),
    }
  } catch {
    return null
  }
}

function pointIcon(type: RoutePoint['type']) {
  if (type === 'departure') return 'A-DEP'
  if (type === 'arrival') return 'B-ARR'
  return 'T-TRT'
}

function loadStoredCities() {
  if (typeof window === 'undefined') return DEFAULT_CITIES

  try {
    const raw = window.localStorage.getItem('carelink.operatedCities')
    const parsed = raw ? JSON.parse(raw) : null
    if (Array.isArray(parsed) && parsed.length) return parsed as OperatedCity[]
  } catch {
    // Ignore broken local storage.
  }

  return DEFAULT_CITIES
}

function saveStoredCities(cities: OperatedCity[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem('carelink.operatedCities', JSON.stringify(cities))
}

export default function CareLinkLiveRouteMap() {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const leafletMapRef = useRef<any>(null)
  const routeLayerRef = useRef<any>(null)
  const cityLayerRef = useRef<any>(null)

  const [routes, setRoutes] = useState<LiveRoute[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedMissionCodes, setSelectedMissionCodes] = useState<string[]>([])
  const [selectedRouteCodes, setSelectedRouteCodes] = useState<string[]>([])
  const [routeMetrics, setRouteMetrics] = useState<Record<string, RouteMetric>>({})
  const [source, setSource] = useState('syncing')
  const [loading, setLoading] = useState(true)
  const [mapReady, setMapReady] = useState(false)

  const [cities, setCities] = useState<OperatedCity[]>(() => loadStoredCities())
  const [cityName, setCityName] = useState('')
  const [cityStatus, setCityStatus] = useState<'operated' | 'suspended'>('operated')
  const [cityRadius, setCityRadius] = useState(10)

  const selectedRoutes = useMemo(
    () => routes.filter((route) => selectedIds.includes(route.id)),
    [routes, selectedIds],
  )

  // carelink-road-route-osrm-sync
  useEffect(() => {
    let cancelled = false

    async function syncRoadRoutes() {
      const missing = selectedRoutes.filter((route) => !routeMetrics[route.id])
      if (!missing.length) return

      const resolved = await Promise.all(
        missing.map(async (route) => {
          const metric = await fetchRoadRouteMetric(route)
          return metric ? [route.id, metric] as const : null
        }),
      )

      if (cancelled) return

      const nextMetrics: Record<string, RouteMetric> = {}
      for (const item of resolved) {
        if (item) nextMetrics[item[0]] = item[1]
      }

      if (Object.keys(nextMetrics).length) {
        setRouteMetrics((current) => ({ ...current, ...nextMetrics }))
      }
    }

    void syncRoadRoutes()

    return () => {
      cancelled = true
    }
  }, [selectedRoutes, routeMetrics])

  async function loadRoutes() {
    setLoading(true)
    try {
      const response = await fetch('/api/carelink-ops/route-map', { cache: 'no-store' })
      const payload = await response.json().catch(() => null)
      const nextRoutes = Array.isArray(payload?.routes) ? payload.routes : []

      setRoutes(nextRoutes)
      setSource(payload?.source || 'unknown')

      setSelectedIds((current) => {
        const available = new Set(nextRoutes.map((route: LiveRoute) => route.id))
        const kept = current.filter((id) => available.has(id))

        const selectedByMission = nextRoutes
          .filter((route: LiveRoute) =>
            selectedMissionCodes.includes(route.missionCode) ||
            selectedRouteCodes.includes(route.routeCode) ||
            selectedRouteCodes.includes(route.id),
          )
          .map((route: LiveRoute) => route.id)

        if (selectedByMission.length) return selectedByMission
        return kept.length ? kept : nextRoutes.slice(0, 3).map((route: LiveRoute) => route.id)
      })
    } finally {
      setLoading(false)
    }
  }

  function ensureLeafletAssets() {
    return new Promise<void>((resolve) => {
      if (window.L) {
        resolve()
        return
      }

      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link')
        link.id = 'leaflet-css'
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }

      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = () => resolve()
      document.body.appendChild(script)
    })
  }

  useEffect(() => {
    void loadRoutes()
  }, [])

  useEffect(() => {
    function onMissionSelection(event: Event) {
      const detail = (event as CustomEvent).detail || {}
      const missionCodes = Array.isArray(detail.missionCodes) ? detail.missionCodes.map(String) : []
      const routeCodes = Array.isArray(detail.routeCodes) ? detail.routeCodes.map(String) : []

      setSelectedMissionCodes(missionCodes)
      setSelectedRouteCodes(routeCodes)

      if (!missionCodes.length && !routeCodes.length) return

      setSelectedIds(() => {
        const matched = routes
          .filter((route) =>
            missionCodes.includes(route.missionCode) ||
            routeCodes.includes(route.routeCode) ||
            routeCodes.includes(route.id),
          )
          .map((route) => route.id)

        return matched.length ? matched : []
      })
    }

    function onRefresh() {
      void loadRoutes()
    }

    window.addEventListener('carelink:selected-missions', onMissionSelection)
    window.addEventListener('carelink:refresh-route-map', onRefresh)

    return () => {
      window.removeEventListener('carelink:selected-missions', onMissionSelection)
      window.removeEventListener('carelink:refresh-route-map', onRefresh)
    }
  }, [routes])

  useEffect(() => {
    let mounted = true

    async function initMap() {
      await ensureLeafletAssets()
      if (!mounted || !mapRef.current || !window.L || leafletMapRef.current) return

      const L = window.L
      const map = L.map(mapRef.current, {
        center: DEFAULT_CENTER,
        zoom: 11,
        minZoom: 5,
        maxZoom: 19,
        zoomControl: false,
      })

      const streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 20,
        attribution: '&copy; OpenStreetMap',
      })

      const satellite = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 20,
          attribution: 'Tiles &copy; Esri',
        },
      )

      streets.addTo(map)

      L.control.zoom({ position: 'topright' }).addTo(map)
      L.control.layers(
        {
          'Street view': streets,
          'Satellite view': satellite,
        },
        {},
        { position: 'topright' },
      ).addTo(map)

      leafletMapRef.current = map
      setMapReady(true)
    }

    void initMap()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!mapReady || !window.L || !leafletMapRef.current) return

    const L = window.L
    const map = leafletMapRef.current

    if (cityLayerRef.current) cityLayerRef.current.remove()

    const group = L.layerGroup()

    cities.forEach((city) => {
      const color = city.status === 'suspended' ? '#f97316' : '#16a34a'
      const fill = city.status === 'suspended' ? '#fed7aa' : '#bbf7d0'

      L.circle([city.lat, city.lng], {
        radius: city.radiusKm * 1000,
        color,
        fillColor: fill,
        fillOpacity: 0.22,
        weight: 3,
        dashArray: city.status === 'suspended' ? '8 8' : undefined,
      })
        .bindPopup(`
          <div style="min-width:210px;font-family:Inter,system-ui,sans-serif;">
            <div style="font-size:10px;font-weight:900;letter-spacing:.16em;color:${color};text-transform:uppercase;">
              ${city.status === 'suspended' ? 'Suspended city' : 'Operated city'}
            </div>
            <div style="margin-top:6px;font-size:16px;font-weight:900;color:#020617;">
              ${city.name}
            </div>
            <div style="margin-top:6px;font-size:12px;color:#475569;">
              Coverage radius: <strong>${city.radiusKm} km</strong>
            </div>
          </div>
        `)
        .addTo(group)

      const icon = L.divIcon({
        className: '',
        html: `
          <div style="
            display:flex;
            align-items:center;
            gap:6px;
            padding:7px 10px;
            border-radius:999px;
            background:${color};
            color:white;
            font-size:11px;
            font-weight:900;
            border:3px solid white;
            box-shadow:0 12px 24px rgba(15,23,42,.22);
          ">
            ${city.status === 'suspended' ? 'SUSP' : 'OPS'} · ${city.name}
          </div>
        `,
        iconSize: [120, 34],
        iconAnchor: [60, 17],
      })

      L.marker([city.lat, city.lng], { icon }).addTo(group)
    })

    group.addTo(map)
    cityLayerRef.current = group
    saveStoredCities(cities)
  }, [cities, mapReady])

  useEffect(() => {
    if (!mapReady || !window.L || !leafletMapRef.current) return

    const L = window.L
    const map = leafletMapRef.current

    if (routeLayerRef.current) routeLayerRef.current.remove()

    const group = L.layerGroup()
    const bounds: any[] = []

    selectedRoutes.forEach((route) => {
      const points = [route.departure, ...(route.transits || []), route.arrival]
      const roadMetric = routeMetrics[route.id]
      const latLngs = roadMetric?.latLngs?.length
        ? roadMetric.latLngs
        : points.map((point) => [point.lat, point.lng] as [number, number])

      L.polyline(latLngs, {
        color: route.color || '#2563eb',
        weight: roadMetric?.latLngs?.length ? 7 : 4,
        opacity: roadMetric?.latLngs?.length ? 0.96 : 0.55,
        dashArray: roadMetric?.latLngs?.length ? undefined : '8 8',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(group)

      points.forEach((point) => {
        bounds.push([point.lat, point.lng])

        const label = pointIcon(point.type)
        const background =
          point.type === 'departure'
            ? '#2563eb'
            : point.type === 'arrival'
              ? '#16a34a'
              : '#f97316'

        const icon = L.divIcon({
          className: '',
          html: `
            <div style="
              display:flex;
              align-items:center;
              justify-content:center;
              min-width:58px;
              height:34px;
              padding:0 10px;
              border-radius:999px;
              background:${background};
              color:white;
              font-weight:900;
              font-size:11px;
              border:3px solid white;
              box-shadow:0 14px 30px rgba(15,23,42,.28);
              letter-spacing:.08em;
            ">${label}</div>
          `,
          iconSize: [58, 34],
          iconAnchor: [29, 17],
        })

        L.marker([point.lat, point.lng], { icon })
          .bindPopup(`
            <div style="min-width:230px;font-family:Inter,system-ui,sans-serif;">
              <div style="font-size:10px;font-weight:900;letter-spacing:.16em;color:#2563eb;text-transform:uppercase;">
                ${point.label}
              </div>
              <div style="margin-top:6px;font-size:16px;font-weight:900;color:#020617;">
                ${route.missionCode}
              </div>
              <div style="margin-top:4px;font-size:12px;color:#475569;">
                Route code: <strong>${route.routeCode}</strong>
              </div>
              <div style="margin-top:8px;font-size:12px;color:#475569;">
                Scheduled departure: <strong>${formatTime(route.scheduledDeparture)}</strong>
              </div>
              <div style="margin-top:4px;font-size:12px;color:#475569;">
                Scheduled arrival: <strong>${formatTime(route.scheduledArrival)}</strong>
              </div>
              <div style="margin-top:8px;font-size:12px;color:#475569;">
                ${point.address || 'No address label available.'}
              </div>
            </div>
          `)
          .addTo(group)
      })
    })

    group.addTo(map)
    routeLayerRef.current = group

    if (bounds.length >= 2) {
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 15 })
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 14)
    } else {
      const cityBounds = cities.map((city) => [city.lat, city.lng])
      if (cityBounds.length >= 2) map.fitBounds(cityBounds, { padding: [45, 45], maxZoom: 12 })
      else map.setView(DEFAULT_CENTER, 11)
    }
  }, [selectedRoutes, cities, mapReady])

  function toggleRoute(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    )
  }

  function addCity() {
    const name = cityName.trim()
    if (!name) return

    const known = CITY_COORDS[normalizeCityKey(name)]
    const [lat, lng] = known || DEFAULT_CENTER

    setCities((current) => [
      ...current.filter((city) => normalizeCityKey(city.name) !== normalizeCityKey(name)),
      {
        id: `city-${normalizeCityKey(name).replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
        name,
        status: cityStatus,
        lat,
        lng,
        radiusKm: cityRadius,
      },
    ])

    setCityName('')
  }

  function toggleCityStatus(id: string) {
    setCities((current) =>
      current.map((city) =>
        city.id === id
          ? { ...city, status: city.status === 'operated' ? 'suspended' : 'operated' }
          : city,
      ),
    )
  }

  function removeCity(id: string) {
    setCities((current) => current.filter((city) => city.id !== id))
  }

  const totalDistance = selectedRoutes.reduce((sum, route) => {
    const points = [route.departure, ...(route.transits || []), route.arrival]
    return sum + (routeMetrics[route.id]?.distanceKm ?? distanceKm(points))
  }, 0)

  const totalDuration = selectedRoutes.reduce((sum, route) => {
    const points = [route.departure, ...(route.transits || []), route.arrival]
    const fallbackKm = distanceKm(points)
    return sum + (routeMetrics[route.id]?.durationMin ?? durationMin(fallbackKm))
  }, 0)

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-700">
            Live Route & Territory Control
          </div>
          <h2 className="mt-2 text-2xl font-black text-slate-950">Route & Territory Overview</h2>
          <p className="mt-2 max-w-3xl text-sm font-medium text-slate-500">
            Select mission rows or route cards. Operated cities appear in green coverage radius; suspended cities appear in orange.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadRoutes()}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 shadow-sm hover:bg-slate-50"
          >
            {loading ? 'Syncing…' : 'Refresh routes'}
          </button>

          <button
            type="button"
            onClick={() => setSelectedIds(routes.map((route) => route.id))}
            className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-sm"
          >
            Show all
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[330px_1fr]">
        <aside className="grid gap-4">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                Route selector
              </div>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
                {selectedRoutes.length} visible
              </span>
            </div>

            <div className="mt-4 grid max-h-[360px] gap-3 overflow-y-auto pr-1">
              {routes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm font-semibold text-slate-500">
                  No valid GPS routes found. Add real Morocco latitude/longitude for departure and arrival.
                </div>
              ) : (
                routes.map((route) => {
                  const active = selectedIds.includes(route.id)
                  const points = [route.departure, ...(route.transits || []), route.arrival]
                  const roadMetric = routeMetrics[route.id]
                  const km = roadMetric?.distanceKm ?? distanceKm(points)
                  const eta = roadMetric?.durationMin ?? durationMin(km)

                  return (
                    <button
                      key={route.id}
                      type="button"
                      onClick={() => toggleRoute(route.id)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        active
                          ? 'border-blue-300 bg-white shadow-md'
                          : 'border-slate-200 bg-white/70 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-black text-slate-950">{route.routeCode}</div>
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ background: route.color || '#2563eb' }}
                        />
                      </div>
                      <div className="mt-1 text-xs font-bold text-slate-500">{route.missionCode}</div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-xl bg-slate-50 p-2">
                          <div className="font-black text-slate-400">DISTANCE</div>
                          <div className="font-black text-slate-950">{km.toFixed(1)} km</div>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-2">
                          <div className="font-black text-slate-400">ETA</div>
                          <div className="font-black text-slate-950">{eta} min</div>
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
              Operated city coverage
            </div>

            <div className="mt-3 grid gap-2">
              <input
                value={cityName}
                onChange={(event) => setCityName(event.target.value)}
                placeholder="City name e.g. Casablanca"
                className="rounded-2xl border border-slate-200 px-3 py-3 text-sm font-bold outline-none focus:border-blue-300"
              />

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={cityStatus}
                  onChange={(event) => setCityStatus(event.target.value as 'operated' | 'suspended')}
                  className="rounded-2xl border border-slate-200 px-3 py-3 text-sm font-bold outline-none"
                >
                  <option value="operated">Operated</option>
                  <option value="suspended">Suspended</option>
                </select>

                <input
                  type="number"
                  min={1}
                  max={80}
                  value={cityRadius}
                  onChange={(event) => setCityRadius(Math.max(1, Number(event.target.value || 10)))}
                  className="rounded-2xl border border-slate-200 px-3 py-3 text-sm font-bold outline-none"
                />
              </div>

              <button
                type="button"
                onClick={addCity}
                className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-blue-700"
              >
                Add / update city
              </button>
            </div>

            <div className="mt-4 grid max-h-[220px] gap-2 overflow-y-auto pr-1">
              {cities.map((city) => (
                <div key={city.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-black text-slate-950">{city.name}</div>
                      <div className="text-xs font-bold text-slate-500">
                        {city.status} · {city.radiusKm} km
                      </div>
                    </div>
                    <span
                      className={`h-3 w-3 rounded-full ${
                        city.status === 'suspended' ? 'bg-orange-500' : 'bg-emerald-600'
                      }`}
                    />
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => toggleCityStatus(city.id)}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700"
                    >
                      {city.status === 'suspended' ? 'Mark operated' : 'Suspend'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCity(city.id)}
                      className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-100 shadow-inner">
          <div ref={mapRef} className="h-[650px] w-full" />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        {[
          ['Selected routes', selectedRoutes.length],
          ['Total distance', `${totalDistance.toFixed(1)} km`],
          ['Estimated duration', `${totalDuration || durationMin(totalDistance)} min`],
          ['Operated cities', cities.filter((city) => city.status === 'operated').length],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">{label}</div>
            <div className="mt-2 text-lg font-black text-slate-950">{String(value)}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
