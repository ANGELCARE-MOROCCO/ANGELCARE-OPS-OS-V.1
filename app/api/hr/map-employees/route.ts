import { NextResponse } from 'next/server'
import { getHRDashboardData } from '@/lib/hr-production/repository'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Row = Record<string, any>

const CITY_COORDS: Record<string, { lat: number; lng: number; aliases: string[] }> = {
  Rabat: { lat: 34.0209, lng: -6.8416, aliases: ['rabat'] },
  Salé: { lat: 34.0531, lng: -6.7985, aliases: ['sale', 'salé'] },
  Temara: { lat: 33.9287, lng: -6.9067, aliases: ['temara', 'témara'] },
  Skhirat: { lat: 33.8527, lng: -7.0317, aliases: ['skhirat'] },

  Tiflet: { lat: 33.8947, lng: -6.3065, aliases: ['tiflet', 'tifelet', 'tifelt'] },
  Bouznika: { lat: 33.7894, lng: -7.1597, aliases: ['bouznika', 'buznika'] },
  Benslimane: { lat: 33.6189, lng: -7.1214, aliases: ['benslimane', 'ben slimane'] },

  Casablanca: { lat: 33.5731, lng: -7.5898, aliases: ['casablanca', 'casa'] },
  Mohammedia: { lat: 33.6835, lng: -7.3849, aliases: ['mohammedia'] },
  Bouskoura: { lat: 33.4489, lng: -7.6486, aliases: ['bouskoura'] },
  Nouaceur: { lat: 33.3670, lng: -7.5870, aliases: ['nouaceur'] },
  Settat: { lat: 33.0010, lng: -7.6166, aliases: ['settat'] },
  Berrechid: { lat: 33.2655, lng: -7.5875, aliases: ['berrechid'] },

  Khouribga: { lat: 32.8860, lng: -6.9063, aliases: ['khouribga'] },
  'Beni Mellal': { lat: 32.3373, lng: -6.3498, aliases: ['beni mellal', 'béni mellal', 'beni melal', 'beni mélal', 'beni-mellal', 'bni mellal'] },

  Marrakech: { lat: 31.6295, lng: -7.9811, aliases: ['marrakech', 'marrakesh'] },
  Agadir: { lat: 30.4278, lng: -9.5981, aliases: ['agadir'] },
  Tanger: { lat: 35.7595, lng: -5.8340, aliases: ['tanger', 'tangier'] },
  Tétouan: { lat: 35.5785, lng: -5.3684, aliases: ['tetouan', 'tétouan'] },
  'Fès': { lat: 34.0331, lng: -5.0003, aliases: ['fes', 'fès', 'fez'] },
  Meknès: { lat: 33.8935, lng: -5.5473, aliases: ['meknes', 'meknès'] },
  Kénitra: { lat: 34.2610, lng: -6.5802, aliases: ['kenitra', 'kénitra'] },
  Oujda: { lat: 34.6814, lng: -1.9086, aliases: ['oujda'] },
  Taza: { lat: 34.2133, lng: -4.0083, aliases: ['taza'] },
  Safi: { lat: 32.2994, lng: -9.2372, aliases: ['safi'] },
  Essaouira: { lat: 31.5085, lng: -9.7595, aliases: ['essaouira'] },
  'El Jadida': { lat: 33.2316, lng: -8.5007, aliases: ['el jadida', 'jadida'] },
  Ouarzazate: { lat: 30.9335, lng: -6.9370, aliases: ['ouarzazate'] },
  Errachidia: { lat: 31.9314, lng: -4.4244, aliases: ['errachidia'] },
  Dakhla: { lat: 23.6848, lng: -15.9570, aliases: ['dakhla'] },
  Laayoune: { lat: 27.1536, lng: -13.2033, aliases: ['laayoune', 'laâyoune', 'el aaiun'] },
}

function text(value: unknown) {
  return String(value || '').trim()
}

function plain(value: unknown) {
  return text(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[,;|/()_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function directNumber(value: unknown) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function titleCase(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function canonicalCityFromRaw(value: unknown) {
  const raw = plain(value)
  if (!raw) return ''

  for (const [city, meta] of Object.entries(CITY_COORDS)) {
    const aliases = [city, ...meta.aliases].map(plain)
    if (aliases.some((alias) => raw === alias || raw.includes(alias))) return city
  }

  return titleCase(raw)
}

function cityFor(row: Row) {
  const candidates = [
    row.city,
    row.work_city,
    row.location_city,
    row.base_city,
    row.home_city,
    row.current_city,
    row.employee_city,
    row.staff_city,
    row.mission_city,
    row.assignment_city,
    row.office_city,
    row.address_city,
    row.location,
    row.work_location,
    row.base_location,
    row.region,
    row.address,
    row.metadata?.city,
    row.metadata?.work_city,
    row.metadata?.location_city,
    row.metadata?.base_city,
    row.metadata?.address,
    row.data?.city,
    row.data?.work_city,
    row.data?.location_city,
    row.data?.base_city,
    row.data?.address,
  ]

  for (const candidate of candidates) {
    const city = canonicalCityFromRaw(candidate)
    if (city) return city
  }

  return 'Location missing'
}

function hash(value: string) {
  let h = 0
  for (let i = 0; i < value.length; i += 1) {
    h = value.charCodeAt(i) + ((h << 5) - h)
    h |= 0
  }
  return Math.abs(h)
}

function coordsFor(row: Row, city: string) {
  const directLat = directNumber(row.lat ?? row.latitude ?? row.location_lat ?? row.metadata?.lat ?? row.data?.lat)
  const directLng = directNumber(row.lng ?? row.longitude ?? row.location_lng ?? row.metadata?.lng ?? row.data?.lng)

  if (directLat !== null && directLng !== null) {
    return { lat: directLat, lng: directLng, precise: true }
  }

  const known = CITY_COORDS[city]
  if (known) return { lat: known.lat, lng: known.lng, precise: false }

  // Unknown future city: keep it visible, but never collapse every city into Rabat.
  const cityHash = hash(city || 'unknown')
  const angle = ((cityHash % 360) * Math.PI) / 180
  const radius = 0.42 + (cityHash % 12) * 0.065

  return {
    lat: CITY_COORDS.Rabat.lat + Math.sin(angle) * radius,
    lng: CITY_COORDS.Rabat.lng + Math.cos(angle) * radius,
    precise: false,
  }
}

function statusFor(row: Row) {
  return plain(row.employment_status || row.status || row.state || row.hr_status)
}

function isActive(row: Row) {
  const s = statusFor(row)
  return !['inactive', 'terminated', 'archived', 'deleted', 'offboarded', 'left', 'resigned'].includes(s)
}

function isPending(row: Row) {
  const s = statusFor(row)
  return ['pending', 'draft', 'invited', 'onboarding', 'probation', 'in review', 'in_review'].some((k) => s.includes(k))
}

function isRisk(row: Row) {
  const s = statusFor(row)
  const r = plain(row.risk_level || row.hr_risk || row.compliance_status || row.document_status)
  return ['risk', 'at risk', 'at_risk', 'blocked', 'expired', 'missing', 'suspended'].some((k) => s.includes(k) || r.includes(k))
}

function employeeName(row: Row) {
  return text(row.full_name || row.name || row.employee_name || row.staff_name || `${text(row.first_name)} ${text(row.last_name)}`.trim()) || 'Unnamed employee'
}

function employeeRole(row: Row) {
  return text(row.position_title || row.position || row.role || row.job_title || row.function_title) || 'Role not specified'
}

function employeeDepartment(row: Row) {
  return text(row.department_name || row.department || row.team_name || row.team || row.business_unit) || 'Department not specified'
}

export async function GET() {
  try {
    const data = await getHRDashboardData()
    const staff = Array.isArray(data.staff) ? (data.staff as Row[]) : []

    const employees = staff.map((row, index) => {
      const city = cityFor(row)
      const coords = coordsFor(row, city)

      return {
        id: text(row.id || row.employee_id || row.staff_id || `employee-${index}`),
        name: employeeName(row),
        role: employeeRole(row),
        department: employeeDepartment(row),
        status: text(row.employment_status || row.status || row.state || 'unknown'),
        city,
        lat: coords.lat,
        lng: coords.lng,
        precise_location: coords.precise,
        active: isActive(row),
        pending: isPending(row),
        risk: isRisk(row),
      }
    })

    const cityMap = new Map<string, any>()

    for (const employee of employees) {
      const current = cityMap.get(employee.city) || {
        city: employee.city,
        lat: employee.lat,
        lng: employee.lng,
        count: 0,
        active: 0,
        pending: 0,
        risk: 0,
        precise_count: 0,
        employees: [],
      }

      current.count += 1
      if (employee.active) current.active += 1
      if (employee.pending) current.pending += 1
      if (employee.risk) current.risk += 1
      if (employee.precise_location) current.precise_count += 1
      current.employees.push(employee)

      cityMap.set(employee.city, current)
    }

    const cities = [...cityMap.values()].sort((a, b) => b.count - a.count || a.city.localeCompare(b.city))

    return NextResponse.json({
      ok: true,
      data: {
        employees,
        cities,
        total: employees.length,
        city_count: cities.length,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || 'Unable to load HR employee map data',
        data: { employees: [], cities: [], total: 0, city_count: 0 },
      },
      { status: 200 },
    )
  }
}
