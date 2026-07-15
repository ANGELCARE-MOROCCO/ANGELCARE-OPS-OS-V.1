import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
  missionId?: string
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

const CITY_COORDS: Record<string, [number, number]> = {
  casablanca: [33.5731, -7.5898],
  rabat: [34.0209, -6.8416],
  temara: [33.9287, -6.9067],
  sale: [34.0337, -6.7708],
  salé: [34.0337, -6.7708],
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
  meknès: [33.8935, -5.5473],
}

const COLORS = ['#2563eb', '#16a34a', '#f97316', '#7c3aed', '#dc2626', '#0891b2']

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

function num(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function norm(value: unknown) {
  return String(value || '').trim().toLowerCase()
}

function firstValue(row: Record<string, any>, keys: string[]) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key]
  }
  return null
}

function isMoroccoLatLng(lat: number | null, lng: number | null) {
  if (lat === null || lng === null) return false
  return lat >= 21 && lat <= 36.5 && lng >= -17.5 && lng <= -0.5
}

function normalizeMoroccoPair(lat: number | null, lng: number | null) {
  if (isMoroccoLatLng(lat, lng)) return { lat: lat as number, lng: lng as number }
  if (isMoroccoLatLng(lng, lat)) return { lat: lng as number, lng: lat as number }
  return null
}

function samePoint(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  return Math.abs(a.lat - b.lat) < 0.0001 && Math.abs(a.lng - b.lng) < 0.0001
}

function cityCenter(row: Record<string, any>) {
  const rawCity = firstValue(row, ['city', 'mission_city', 'service_city', 'client_city', 'zone_city'])
  const city = norm(rawCity)
  if (CITY_COORDS[city]) return CITY_COORDS[city]

  const rawZone = norm(firstValue(row, ['zone', 'mission_zone', 'service_zone']))
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (city.includes(key) || rawZone.includes(key)) return coords
  }

  return CITY_COORDS.casablanca
}

function fallbackPointPair(row: Record<string, any>, index: number) {
  const [cityLat, cityLng] = cityCenter(row)

  // Small deterministic offsets so A and B are never identical.
  const offset = 0.018 + (index % 5) * 0.006

  return {
    departure: {
      lat: cityLat - offset,
      lng: cityLng - offset,
    },
    arrival: {
      lat: cityLat + offset,
      lng: cityLng + offset,
    },
  }
}

function normalizeRoute(row: Record<string, any>, index: number): LiveRoute | null {
  const depLat = num(firstValue(row, ['departure_lat', 'departure_latitude', 'dep_lat', 'start_lat', 'origin_lat']))
  const depLng = num(firstValue(row, ['departure_lng', 'departure_longitude', 'dep_lng', 'start_lng', 'origin_lng', 'departure_lon']))
  const arrLat = num(firstValue(row, ['arrival_lat', 'arrival_latitude', 'arr_lat', 'end_lat', 'destination_lat']))
  const arrLng = num(firstValue(row, ['arrival_lng', 'arrival_longitude', 'arr_lng', 'end_lng', 'destination_lng', 'arrival_lon']))

  let departurePair = normalizeMoroccoPair(depLat, depLng)
  let arrivalPair = normalizeMoroccoPair(arrLat, arrLng)

  if (!departurePair || !arrivalPair || samePoint(departurePair, arrivalPair)) {
    const fallback = fallbackPointPair(row, index)
    departurePair = fallback.departure
    arrivalPair = fallback.arrival
  }

  const missionId = String(firstValue(row, ['mission_id', 'id', 'dossier_id']) || `mission-${index + 1}`)
  const missionCode = String(firstValue(row, ['mission_code', 'missionCode', 'code', 'mission_ref']) || missionId)
  const routeCode = String(firstValue(row, ['route_code', 'routeCode', 'route_id', 'routeId']) || missionCode)

  const rawTransits =
    firstValue(row, ['transits', 'transit_points', 'stops', 'waypoints', 'route_transits']) || []

  const transits = Array.isArray(rawTransits)
    ? rawTransits
        .map((point: any, pointIndex: number) => {
          const lat = num(firstValue(point, ['lat', 'latitude', 'transit_lat']))
          const lng = num(firstValue(point, ['lng', 'longitude', 'lon', 'transit_lng']))
          const transitPair = normalizeMoroccoPair(lat, lng)
          if (!transitPair) return null

          return {
            label: `POINT T-TRT ${pointIndex + 1}`,
            type: 'transit' as const,
            lat: transitPair.lat,
            lng: transitPair.lng,
            scheduledTime: firstValue(point, ['scheduled_time', 'time', 'scheduledTime']),
            address: firstValue(point, ['address', 'label', 'name']),
          }
        })
        .filter(Boolean) as RoutePoint[]
    : []

  return {
    id: String(firstValue(row, ['route_id', 'routeId', 'id']) || routeCode),
    missionId,
    missionCode,
    routeCode,
    status: String(firstValue(row, ['status', 'route_status', 'stage']) || 'active'),
    color: String(firstValue(row, ['color', 'route_color']) || COLORS[index % COLORS.length]),
    scheduledDeparture: firstValue(row, ['scheduled_departure', 'departure_time', 'start_time', 'scheduled_start', 'start_date']),
    scheduledArrival: firstValue(row, ['scheduled_arrival', 'arrival_time', 'end_time', 'scheduled_end', 'end_date']),
    departure: {
      label: 'POINT A-DEP',
      type: 'departure',
      lat: departurePair.lat,
      lng: departurePair.lng,
      scheduledTime: firstValue(row, ['scheduled_departure', 'departure_time', 'start_time', 'scheduled_start', 'start_date']),
      address: firstValue(row, ['departure_address', 'origin_address', 'start_address', 'city', 'mission_city']),
    },
    arrival: {
      label: 'POINT B-ARR',
      type: 'arrival',
      lat: arrivalPair.lat,
      lng: arrivalPair.lng,
      scheduledTime: firstValue(row, ['scheduled_arrival', 'arrival_time', 'end_time', 'scheduled_end', 'end_date']),
      address: firstValue(row, ['arrival_address', 'destination_address', 'end_address', 'city', 'mission_city']),
    },
    transits,
  }
}

async function readFirstWorkingTable(supabase: any) {
  const candidateTables = [
    'mission_routes',
    'carelink_mission_routes',
    'carelink_routes',
    'routes',
    'carelink_missions',
    'missions',
    'mission_dossiers',
    'carelink_mission_dossiers',
  ]

  for (const table of candidateTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(120)

      if (error || !Array.isArray(data)) continue

      const routes = data
        .map((row, index) => normalizeRoute(row as Record<string, any>, index))
        .filter(Boolean) as LiveRoute[]

      if (routes.length > 0) {
        return { source: table, routes }
      }
    } catch {
      // Try next possible table.
    }
  }

  return { source: 'no_route_or_mission_table_found', routes: [] as LiveRoute[] }
}

export async function GET() {
  const supabase = supabaseAdmin()

  if (!supabase) {
    return NextResponse.json({
      ok: true,
      source: 'supabase_not_configured',
      routes: [],
      generatedAt: new Date().toISOString(),
    })
  }

  const result = await readFirstWorkingTable(supabase)

  return NextResponse.json({
    ok: true,
    source: result.source,
    routes: result.routes,
    message:
      result.routes.length > 0
        ? 'Routes loaded. Missing GPS rows are temporarily projected from mission city until exact coordinates are stored.'
        : 'No mission or route rows found.',
    generatedAt: new Date().toISOString(),
  })
}
