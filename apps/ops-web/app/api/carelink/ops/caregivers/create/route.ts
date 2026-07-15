import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type AnyRecord = Record<string, any>

function text(value: unknown, fallback = '') {
  if (value === null || value === undefined || value === '') return fallback
  return String(value).trim()
}

function list(value: unknown) {
  if (Array.isArray(value)) return value.map((x) => text(x)).filter(Boolean)
  return text(value).split(',').map((x) => x.trim()).filter(Boolean)
}

function bool(value: unknown) {
  return value === true || value === 'true' || value === 1 || value === '1' || value === 'yes'
}

function num(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function compact(row: AnyRecord) {
  return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined && value !== null && value !== ''))
}

function buildCaregiverRow(body: AnyRecord) {
  const fullName = text(body.full_name || body.fullName || body.name)
  const phone = text(body.phone || body.mobile || body.mobile_phone)
  const email = text(body.email || body.work_email || body.mobile_email || body.login_email)
  const city = text(body.city, 'Rabat')
  const zone = text(body.zone)
  const status = text(body.status || body.current_status, 'available')
  const role = text(body.role || body.agent_role || body.caregiver_type, 'Caregiver')
  const skills = list(body.skills || body.skill_tags || body.competencies)
  const languages = list(body.languages || body.language_tags || body.spoken_languages)
  const missionTypes = list(body.mission_types || body.missionTypes || body.service_types)
  const readiness = num(body.readiness_score || body.readinessScore, 20)
  const reliability = num(body.reliability_score || body.reliabilityScore || readiness, readiness)
  const paymentMode = text(body.payment_mode || body.paymentMode, 'monthly')
  const hourlyRate = body.hourly_rate || body.hourlyRate ? num(body.hourly_rate || body.hourlyRate, 0) : null

  const operationalSummary = [
    'Caregiver created from CareLink Ops Agents Command.',
    `Phone: ${phone || 'missing'}`,
    `Email: ${email || 'missing'}`,
    `City / zone: ${city || 'missing'} / ${zone || 'missing'}`,
    `Skills: ${skills.join(', ') || 'not specified'}`,
    `Languages: ${languages.join(', ') || 'not specified'}`,
    `Mission types: ${missionTypes.join(', ') || 'not specified'}`,
    `Mobile access: ${bool(body.mobile_access || body.mobileAccess || body.mobile_enabled || body.mobileEnabled) ? 'enabled' : 'not enabled'}`,
    `Roster preferences: ${text(body.roster_preferences || body.rosterPreferences || body.roster_notes || body.rosterNotes) || 'not specified'}`,
    `Honoraires: ${hourlyRate ?? 0} MAD/h`,
    `Payment mode: ${paymentMode}`,
    `Training path: ${text(body.training_path || body.trainingPath) || 'not specified'}`,
    `Emergency contact: ${text(body.emergency_contact || body.emergencyContact) || 'not specified'}`,
  ].join('\n')

  const payload = {
    source: 'carelink_ops_caregivers_create',
    captured_at: new Date().toISOString(),
    identity: { full_name: fullName, phone, email, city, zone, status, role, skills, languages, mission_types: missionTypes },
    access: {
      email: text(body.login_email || body.loginEmail || email),
      mobile_enabled: bool(body.mobile_access || body.mobileAccess || body.mobile_enabled || body.mobileEnabled),
      access_status: text(body.access_status || body.accessStatus, 'active'),
      access_level: text(body.access_level || body.accessLevel, 'carelink_mobile_agent'),
    },
    roster: body.roster_preferences || body.rosterPreferences || body.roster_notes || body.rosterNotes || null,
    finance: { payment_mode: paymentMode, hourly_rate: hourlyRate },
    training: { training_path: text(body.training_path || body.trainingPath) },
    raw: body,
  }

  return compact({
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
    availability_status: status,
    role,
    notes: operationalSummary,
    summary: operationalSummary,
    skills_summary: skills.join(', '),
    skill_tags: skills,
    languages,
    language_tags: languages,
    mission_types: missionTypes,
    academy_certified: bool(body.academy_certified || body.academyCertified),
    special_needs_capable: bool(body.special_needs_capable || body.specialNeedsCapable),
    reliability_score: reliability,
    readiness_score: readiness,
    payment_mode: paymentMode,
    hourly_rate: hourlyRate,
    carelink_ops_payload: payload,
    updated_at: new Date().toISOString(),
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const paymentRecords = Array.isArray(body.payment_records) ? body.payment_records : []
    const supabase = await createClient()
    const fullName = text(body.full_name || body.fullName || body.name)

    if (!fullName) {
      return NextResponse.json({ ok: false, error: 'Caregiver full name is required' }, { status: 400 })
    }

    const row = buildCaregiverRow(body)
    const { data, error } = await supabase.from('caregivers').insert(row).select('*').single()

    if (error) {
      return NextResponse.json({
        ok: false,
        error: `Caregiver schema/save failed: ${error.message}. Run migration 20260628_carelink_caregiver_profile_schema_recovery.sql before creating caregivers.`,
      }, { status: 500 })
    }

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

      const { data: paymentData } = await supabase.from('carelink_agent_payment_validations').insert(paymentRows).select('*')
      if (paymentData) savedPaymentRecords = paymentData
    }

    return NextResponse.json({ ok: true, caregiver: data, savedPayload: row, paymentRecords: savedPaymentRecords })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to create caregiver',
    }, { status: 500 })
  }
}
