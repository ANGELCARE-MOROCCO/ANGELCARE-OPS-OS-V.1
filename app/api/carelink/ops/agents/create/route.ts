import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type AnyRecord = Record<string, any>

function text(value: unknown, fallback = '') {
  if (value === null || value === undefined || value === '') return fallback
  return String(value).trim()
}

function arr(value: unknown) {
  if (Array.isArray(value)) return value.map((x) => text(x)).filter(Boolean)
  return text(value).split(',').map((x) => x.trim()).filter(Boolean)
}

function compact(row: AnyRecord) {
  return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined && value !== null && value !== ''))
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = await createClient()
    const fullName = text(body.full_name || body.fullName || body.name)

    if (!fullName) return NextResponse.json({ ok: false, error: 'Full name is required.' }, { status: 400 })

    const summary = [
      'Created from CareLink Ops Agent Command Center.',
      `Skills: ${arr(body.skills).join(', ') || 'not configured'}`,
      `Languages: ${arr(body.languages).join(', ') || 'not configured'}`,
      `Mission types: ${arr(body.mission_types || body.missionTypes).join(', ') || 'not configured'}`,
      `Roster: ${text(body.roster_notes || body.rosterNotes) || 'not configured'}`,
      `Payment: ${text(body.payment_mode || body.paymentMode, 'monthly')} / ${text(body.hourly_rate || body.hourlyRate || 0)} MAD/h`,
    ].join('\n')

    const candidates = [
      compact({
        full_name: fullName,
        name: fullName,
        display_name: fullName,
        phone: text(body.phone),
        mobile: text(body.phone),
        email: text(body.email),
        city: text(body.city, 'Rabat'),
        zone: text(body.zone),
        status: text(body.status, 'available'),
        current_status: text(body.status, 'available'),
        availability_status: text(body.status, 'available'),
        role: text(body.role, 'Caregiver'),
        notes: summary,
        summary,
        skill_tags: arr(body.skills),
        skills: arr(body.skills),
        languages: arr(body.languages),
        mission_types: arr(body.mission_types || body.missionTypes),
        academy_certified: Boolean(body.academy_certified || body.academyCertified),
        special_needs_capable: Boolean(body.special_needs_capable || body.specialNeedsCapable),
        reliability_score: Number(body.reliability_score || body.readiness_score || 20),
        readiness_score: Number(body.readiness_score || body.reliability_score || 20),
      }),
      compact({
        full_name: fullName,
        phone: text(body.phone),
        email: text(body.email),
        city: text(body.city, 'Rabat'),
        zone: text(body.zone),
        status: text(body.status, 'available'),
        notes: summary,
      }),
      compact({ name: fullName, phone: text(body.phone), city: text(body.city, 'Rabat'), zone: text(body.zone), status: text(body.status, 'available') }),
      compact({ full_name: fullName }),
    ]

    let lastError = ''
    for (const row of candidates) {
      const { data, error } = await supabase.from('caregivers').insert(row).select('*').single()
      if (!error) return NextResponse.json({ ok: true, caregiver: data })
      lastError = error.message
    }

    return NextResponse.json({ ok: false, error: lastError || 'Unable to create caregiver.' }, { status: 500 })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unable to create caregiver.' }, { status: 500 })
  }
}
