import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Row = Record<string, any>

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  RABAT: { lat: 34.0209, lng: -6.8416 },
  CASABLANCA: { lat: 33.5731, lng: -7.5898 },
  KENITRA: { lat: 34.261, lng: -6.5802 },
  TEMARA: { lat: 33.9287, lng: -6.9066 },
  SALE: { lat: 34.0531, lng: -6.7985 },
  MARRAKECH: { lat: 31.6295, lng: -7.9811 },
  TANGER: { lat: 35.7595, lng: -5.834 },
  FES: { lat: 34.0331, lng: -5.0003 },
  MEKNES: { lat: 33.873, lng: -5.5407 },
  AGADIR: { lat: 30.4278, lng: -9.5981 },
  OUJDA: { lat: 34.6814, lng: -1.9086 },
  TETOUAN: { lat: 35.5889, lng: -5.3626 },
  NADOR: { lat: 35.1681, lng: -2.9335 },
  'BENI MELLAL': { lat: 32.3373, lng: -6.3498 },
  'EL JADIDA': { lat: 33.2316, lng: -8.5007 },
  SAFI: { lat: 32.2994, lng: -9.2372 },
  MOHAMMEDIA: { lat: 33.6861, lng: -7.3829 },
}

function text(value: unknown, fallback = '') {
  if (value === null || value === undefined || value === '') return fallback
  return String(value)
}

function normalizeCity(value: unknown) {
  return text(value, 'RABAT')
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase()
}

function hash(value: string) {
  let h = 0
  for (let i = 0; i < value.length; i += 1) {
    h = value.charCodeAt(i) + ((h << 5) - h)
    h |= 0
  }
  return Math.abs(h)
}

function coordFor(city: string) {
  const key = normalizeCity(city)
  if (CITY_COORDS[key]) return CITY_COORDS[key]

  const h = hash(key)
  return {
    lat: 33.7 + ((h % 140) - 70) / 100,
    lng: -6.7 + (((h / 11) % 160) - 80) / 100,
  }
}

function jitter(index: number) {
  const angle = (index * 137.5 * Math.PI) / 180
  const radius = 0.018 + (index % 6) * 0.004
  return {
    lat: Math.sin(angle) * radius,
    lng: Math.cos(angle) * radius,
  }
}

function nameOf(row: Row) {
  return text(row.full_name || row.name || row.display_name, `Caregiver #${row.id}`)
}

function cityOf(row: Row) {
  return text(row.city || row.location_city || row.base_city, 'Rabat')
}

function zoneOf(row: Row) {
  return text(row.zone || row.location_zone || row.base_zone, 'No zone')
}

function statusOf(row: Row) {
  return text(row.current_status || row.status || row.availability_status, 'available')
}

function numberOf(value: unknown) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function readinessOf(row: Row) {
  let score = numberOf(row.readiness_score || row.reliability_score || row.score)
  if (!score) score = 20
  if (text(row.phone || row.mobile || row.phone_number)) score += 10
  if (cityOf(row)) score += 10
  if (String(statusOf(row)).toLowerCase().includes('available')) score += 15
  if (row.academy_certified) score += 15
  return Math.max(0, Math.min(100, score))
}

function isActive(row: Row) {
  const status = statusOf(row).toLowerCase()
  return status.includes('available') || status.includes('active') || status.includes('validated')
}

function isPending(row: Row) {
  const status = statusOf(row).toLowerCase()
  return status.includes('pending') || status.includes('review') || readinessOf(row) < 80
}

function isRisk(row: Row) {
  const status = statusOf(row).toLowerCase()
  return status.includes('blocked') || status.includes('inactive') || status.includes('suspend') || readinessOf(row) < 55
}

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('caregivers')
      .select('*')
      .order('id', { ascending: false })
      .limit(300)

    if (error) {
      return NextResponse.json({ ok: false, error: error.message, data: null }, { status: 500 })
    }

    const rows = (data || []) as Row[]
    const grouped = new Map<string, Row[]>()

    rows.forEach((row) => {
      const city = cityOf(row)
      grouped.set(city, [...(grouped.get(city) || []), row])
    })

    const cities = Array.from(grouped.entries()).map(([city, items]) => {
      const coord = coordFor(city)
      return {
        city,
        lat: coord.lat,
        lng: coord.lng,
        count: items.length,
        active: items.filter(isActive).length,
        pending: items.filter(isPending).length,
        risk: items.filter(isRisk).length,
        caregivers: items.slice(0, 20).map((row, index) => {
          const offset = jitter(index)
          return {
            id: String(row.id),
            name: nameOf(row),
            role: text(row.role || row.function || row.position, 'Caregiver'),
            status: statusOf(row),
            city,
            zone: zoneOf(row),
            phone: text(row.phone || row.mobile || row.phone_number, '—'),
            readiness: readinessOf(row),
            lat: coord.lat + offset.lat,
            lng: coord.lng + offset.lng,
            active: isActive(row),
            pending: isPending(row),
            risk: isRisk(row),
          }
        }),
      }
    })

    const caregivers = cities.flatMap((city) => city.caregivers)

    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      data: {
        total: rows.length,
        city_count: cities.length,
        cities,
        caregivers,
        pending: caregivers.filter((x) => x.pending).length,
        risk: caregivers.filter((x) => x.risk).length,
      },
    })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to load caregivers map',
      data: null,
    }, { status: 500 })
  }
}
