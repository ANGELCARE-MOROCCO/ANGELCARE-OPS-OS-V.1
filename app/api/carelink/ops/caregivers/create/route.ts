import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Payload = Record<string, any>

function text(value: unknown, fallback = '') {
  if (value === null || value === undefined || value === '') return fallback
  return String(value).trim()
}

function bool(value: unknown) {
  return value === true || value === 'true' || value === 1 || value === '1' || value === 'yes'
}

function compact<T extends Payload>(input: T) {
  const output: Payload = {}
  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') output[key] = value
  })
  return output
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const paymentRecords = Array.isArray(body.payment_records) ? body.payment_records : []
    const supabase = await createClient()

    const fullName = text(body.full_name || body.fullName || body.name)
    const phone = text(body.phone)
    const email = text(body.email)
    const city = text(body.city)
    const zone = text(body.zone)
    const status = text(body.status, 'available')

    if (!fullName) {
      return NextResponse.json({ ok: false, error: 'Caregiver full name is required' }, { status: 400 })
    }

    const operationalSummary = [
      `Caregiver created from CareLink Ops Agents Command.`,
      `Skills: ${text(body.skills) || 'not specified'}`,
      `Languages: ${text(body.languages) || 'not specified'}`,
      `Mission types: ${text(body.mission_types || body.missionTypes) || 'not specified'}`,
      `Mobile access: ${bool(body.mobile_access || body.mobileAccess) ? 'enabled' : 'not enabled'}`,
      `Roster preferences: ${text(body.roster_preferences || body.rosterPreferences) || 'not specified'}`,
      `Honoraires: ${text(body.hourly_rate || body.hourlyRate) || 'not specified'} MAD/h`,
      `Payment mode: ${text(body.payment_mode || body.paymentMode) || 'not specified'}`,
      `Training path: ${text(body.training_path || body.trainingPath) || 'not specified'}`,
      `Emergency contact: ${text(body.emergency_contact || body.emergencyContact) || 'not specified'}`,
    ].join('\n')

    const candidates = [
      compact({
        full_name: fullName,
        name: fullName,
        display_name: fullName,
        phone,
        mobile: phone,
        email,
        city,
        zone,
        current_status: status,
        status,
        role: text(body.role, 'Caregiver'),
        function: text(body.function, 'Caregiver'),
        notes: operationalSummary,
        summary: operationalSummary,
        skill_tags: text(body.skills)
          ? text(body.skills).split(',').map((x) => x.trim()).filter(Boolean)
          : undefined,
        skills: text(body.skills)
          ? text(body.skills).split(',').map((x) => x.trim()).filter(Boolean)
          : undefined,
        languages: text(body.languages)
          ? text(body.languages).split(',').map((x) => x.trim()).filter(Boolean)
          : undefined,
        mission_types: text(body.mission_types || body.missionTypes)
          ? text(body.mission_types || body.missionTypes).split(',').map((x) => x.trim()).filter(Boolean)
          : undefined,
        academy_certified: bool(body.academy_certified || body.academyCertified),
        special_needs_capable: bool(body.special_needs_capable || body.specialNeedsCapable),
        reliability_score: Number(body.reliability_score || body.reliabilityScore || 20),
        readiness_score: Number(body.readiness_score || body.readinessScore || 20),
        hourly_rate: Number(body.hourly_rate || body.hourlyRate || 0),
        payment_mode: text(body.payment_mode || body.paymentMode),
        mobile_access: bool(body.mobile_access || body.mobileAccess),
        carelink_mobile_enabled: bool(body.mobile_access || body.mobileAccess),
        roster_preferences: text(body.roster_preferences || body.rosterPreferences),
        training_path: text(body.training_path || body.trainingPath),
      }),
      compact({
        full_name: fullName,
        phone,
        email,
        city,
        zone,
        current_status: status,
        status,
        role: text(body.role, 'Caregiver'),
        notes: operationalSummary,
        summary: operationalSummary,
        academy_certified: bool(body.academy_certified || body.academyCertified),
        special_needs_capable: bool(body.special_needs_capable || body.specialNeedsCapable),
        reliability_score: Number(body.reliability_score || body.reliabilityScore || 20),
      }),
      compact({
        full_name: fullName,
        phone,
        email,
        city,
        zone,
        status,
        notes: operationalSummary,
      }),
      compact({
        name: fullName,
        phone,
        email,
        city,
        zone,
        status,
        notes: operationalSummary,
      }),
      compact({
        full_name: fullName,
      }),
    ]

    let lastError: string | null = null

    for (const row of candidates) {
      const { data, error } = await supabase
        .from('caregivers')
        .insert(row)
        .select('*')
        .single()

      if (!error) {
        let savedPaymentRecords: any[] = []

        if (paymentRecords.length && data?.id) {
          const paymentRows = paymentRecords.map((line: any) => ({
            caregiver_id: data.id,
            label: text(line.label || line.title || 'Caregiver payment record'),
            amount: Number(line.amount || 0),
            currency: text(line.currency, 'MAD'),
            status: text(line.status, 'draft'),
            validation_type: text(line.validation_type || line.validationType, 'manual'),
            period_start: line.period_start || line.periodStart || null,
            period_end: line.period_end || line.periodEnd || null,
            notes: text(line.notes || line.description || ''),
          }))

          const { data: paymentData, error: paymentError } = await supabase
            .from('carelink_agent_payment_validations')
            .insert(paymentRows)
            .select('*')

          if (!paymentError && paymentData) {
            savedPaymentRecords = paymentData
          }
        }

        return NextResponse.json({
          ok: true,
          caregiver: data,
          savedPayload: row,
          paymentRecords: savedPaymentRecords,
        })
      }

      lastError = error.message
    }

    return NextResponse.json({
      ok: false,
      error: lastError || 'Unable to create caregiver',
    }, { status: 500 })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to create caregiver',
    }, { status: 500 })
  }
}
