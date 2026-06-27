import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type AnyRecord = Record<string, any>

function text(value: unknown, fallback = '') {
  if (value === null || value === undefined || value === '') return fallback
  return String(value).trim()
}

function number(value: unknown) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function bool(value: unknown) {
  return value === true || value === 'true' || value === 1 || value === '1' || value === 'yes'
}

function list(value: unknown) {
  if (Array.isArray(value)) return value.map((x) => text(x)).filter(Boolean)
  return text(value).split(',').map((x) => x.trim()).filter(Boolean)
}

function compact(row: AnyRecord) {
  const out: AnyRecord = {}
  Object.entries(row).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') out[key] = value
  })
  return out
}

async function safeOne(supabase: any, table: string, caregiverId: number) {
  try {
    const { data, error } = await supabase.from(table).select('*').eq('caregiver_id', caregiverId).order('id', { ascending: false }).limit(1).maybeSingle()
    if (error) return null
    return data || null
  } catch {
    return null
  }
}

async function safeMany(supabase: any, table: string, caregiverId: number) {
  try {
    const { data, error } = await supabase.from(table).select('*').eq('caregiver_id', caregiverId).order('id', { ascending: false }).limit(100)
    if (error || !Array.isArray(data)) return []
    return data
  } catch {
    return []
  }
}

async function saveOneByCaregiver(supabase: any, table: string, caregiverId: number, patch: AnyRecord) {
  const existing = await safeOne(supabase, table, caregiverId)
  const row = compact({ caregiver_id: caregiverId, ...patch, updated_at: new Date().toISOString() })

  if (existing?.id) {
    const { data, error } = await supabase.from(table).update(row).eq('id', existing.id).select('*').single()
    return { data, error }
  }

  const { data, error } = await supabase.from(table).insert(row).select('*').single()
  return { data, error }
}

async function logAgentAction(supabase: any, caregiverId: number, actionType: string, moduleType: string, payload: AnyRecord) {
  try {
    await supabase.from('carelink_agent_action_logs').insert({
      caregiver_id: caregiverId,
      action_type: actionType,
      module_type: moduleType,
      payload,
      created_by: text(payload.created_by, 'CareLink Ops'),
    })
  } catch {}
}

async function notifyAgentWorkflow(supabase: any, caregiverId: number, actionType: string, moduleType: string, payload: AnyRecord) {
  const caregiverName = text(payload.caregiver_name || payload.full_name || payload.name || 'Caregiver')
  const titleByAction: Record<string, string> = {
    save_profile: 'Caregiver profile updated',
    save_access: 'CareLink Mobile access updated',
    suspend_access: 'CareLink Mobile access suspended',
    restore_access: 'CareLink Mobile access restored',
    save_roster: 'Roster preferences updated',
    save_payment_config: 'Payment configuration updated',
    add_payment_validation: 'Payment validation captured',
    update_payment_validation: 'Payment validation updated',
    delete_payment_validation: 'Payment validation deleted',
    save_training: 'Training plan updated',
    delete_caregiver: 'Caregiver deleted',
  }

  const title = titleByAction[actionType] || `Agent workflow: ${actionType}`
  const rows: AnyRecord[] = [
    { audience_type: 'admin', caregiver_id: caregiverId, caregiver_name: caregiverName, title, body: `${caregiverName} · ${moduleType}`, action_type: actionType, priority: actionType.includes('delete') || actionType.includes('suspend') ? 'high' : 'normal', payload, created_by: text(payload.created_by, 'CareLink Ops') },
    { audience_type: 'supervisor', caregiver_id: caregiverId, caregiver_name: caregiverName, title, body: `${caregiverName} · ${moduleType}`, action_type: actionType, priority: actionType.includes('suspend') ? 'high' : 'normal', payload, created_by: text(payload.created_by, 'CareLink Ops') },
  ]

  if (['save_access', 'suspend_access', 'restore_access', 'save_roster', 'save_training', 'add_payment_validation', 'update_payment_validation'].includes(actionType)) {
    rows.push({ audience_type: 'carelink_mobile_agent', caregiver_id: caregiverId, caregiver_name: caregiverName, title, body: `${caregiverName} · ${moduleType}`, action_type: actionType, priority: actionType.includes('suspend') ? 'high' : 'normal', payload, created_by: text(payload.created_by, 'CareLink Ops') })
  }

  try {
    await supabase.from('carelink_agent_notifications').insert(rows)
  } catch {}
}

async function loadMissions(supabase: any, caregiverId: number, caregiverName: string) {
  const tables = ['carelink_missions', 'carelink_ops_missions', 'mission_dossiers', 'carelink_mission_dossiers', 'missions', 'carelink_submissions']
  const rows: AnyRecord[] = []

  for (const table of tables) {
    const attempts = [
      async () => await supabase.from(table).select('*').eq('caregiver_id', caregiverId).limit(50),
      async () => await supabase.from(table).select('*').eq('agent_id', caregiverId).limit(50),
      async () => await supabase.from(table).select('*').eq('assignee_id', caregiverId).limit(50),
      async () => await supabase.from(table).select('*').ilike('caregiver_name', `%${caregiverName}%`).limit(50),
      async () => await supabase.from(table).select('*').ilike('agent_name', `%${caregiverName}%`).limit(50),
    ]

    for (const attempt of attempts) {
      try {
        const { data, error } = await attempt()
        if (!error && Array.isArray(data) && data.length) {
          rows.push(...data.map((row: AnyRecord) => ({ ...row, __source_table: table })))
          break
        }
      } catch {}
    }
  }

  return rows.slice(0, 150)
}

async function loadCommand(supabase: any, caregiverId: number) {
  const { data: caregiver } = await supabase.from('caregivers').select('*').eq('id', caregiverId).maybeSingle()
  const caregiverName = text(caregiver?.full_name || caregiver?.name || caregiver?.display_name, `Caregiver #${caregiverId}`)

  const [access, roster, paymentConfig, paymentValidations, trainingPlan, missionHistory, notifications, actionLogs] = await Promise.all([
    safeOne(supabase, 'carelink_agent_app_access', caregiverId),
    safeOne(supabase, 'carelink_agent_roster_preferences', caregiverId),
    safeOne(supabase, 'carelink_agent_payment_configs', caregiverId),
    safeMany(supabase, 'carelink_agent_payment_validations', caregiverId),
    safeOne(supabase, 'carelink_agent_training_plans', caregiverId),
    loadMissions(supabase, caregiverId, caregiverName),
    safeMany(supabase, 'carelink_agent_notifications', caregiverId),
    safeMany(supabase, 'carelink_agent_action_logs', caregiverId),
  ])

  const readiness = {
    profile: caregiver ? 20 : 0,
    mobile: access?.mobile_enabled ? 20 : 0,
    roster: roster ? 15 : 0,
    payment: paymentConfig ? 15 : 0,
    training: trainingPlan ? 15 : 0,
    missions: missionHistory.length ? 15 : 0,
  }

  return { caregiver, access, roster, paymentConfig, paymentValidations, trainingPlan, missionHistory, notifications, actionLogs, readiness: { ...readiness, total: Object.values(readiness).reduce((a, b) => a + b, 0) } }
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const caregiverId = Number(params.id)
    if (!Number.isFinite(caregiverId) || !caregiverId) return NextResponse.json({ ok: false, error: 'Invalid caregiver id' }, { status: 400 })

    const supabase = await createClient()
    const command = await loadCommand(supabase as any, caregiverId)
    return NextResponse.json({ ok: true, caregiverId, command, generatedAt: new Date().toISOString() })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unable to load caregiver command' }, { status: 500 })
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const caregiverId = Number(params.id)
    if (!Number.isFinite(caregiverId) || !caregiverId) return NextResponse.json({ ok: false, error: 'Invalid caregiver id' }, { status: 400 })

    const body = await request.json()
    const action = text(body.action, 'save_profile')
    const moduleType = text(body.module_type, action.replace('save_', ''))
    const supabase = await createClient()
    const now = new Date().toISOString()
    let result: AnyRecord = {}

    if (action === 'save_profile') {
      const patchCandidates = [
        compact({ full_name: text(body.full_name || body.fullName || body.name), name: text(body.full_name || body.fullName || body.name), display_name: text(body.full_name || body.fullName || body.name), phone: text(body.phone), mobile: text(body.phone), email: text(body.email), city: text(body.city), zone: text(body.zone), current_status: text(body.status), status: text(body.status), role: text(body.role), skills: list(body.skills), skill_tags: list(body.skills), languages: list(body.languages), mission_types: list(body.mission_types || body.missionTypes), academy_certified: bool(body.academy_certified || body.academyCertified), special_needs_capable: bool(body.special_needs_capable || body.specialNeedsCapable), readiness_score: number(body.readiness_score || body.readinessScore), reliability_score: number(body.reliability_score || body.reliabilityScore || body.readiness_score), notes: text(body.notes), updated_at: now }),
        compact({ full_name: text(body.full_name || body.fullName || body.name), phone: text(body.phone), email: text(body.email), city: text(body.city), zone: text(body.zone), status: text(body.status), notes: text(body.notes) }),
        compact({ name: text(body.full_name || body.fullName || body.name), phone: text(body.phone), email: text(body.email), city: text(body.city), zone: text(body.zone), status: text(body.status), notes: text(body.notes) }),
      ]

      let lastError = ''
      for (const patch of patchCandidates) {
        const { data, error } = await (supabase as any).from('caregivers').update(patch).eq('id', caregiverId).select('*').single()
        if (!error) { result = { caregiver: data }; lastError = ''; break }
        lastError = error.message
      }
      if (lastError) return NextResponse.json({ ok: false, error: lastError }, { status: 500 })
    }

    if (action === 'save_access' || action === 'suspend_access' || action === 'restore_access') {
      const accessStatus = action === 'suspend_access' ? 'temporarily_suspended' : action === 'restore_access' ? 'active' : text(body.access_status, 'active')
      const mobileEnabled = action === 'suspend_access' ? false : action === 'restore_access' ? true : bool(body.mobile_enabled)
      const { data, error } = await saveOneByCaregiver(supabase as any, 'carelink_agent_app_access', caregiverId, { email: text(body.email), access_status: accessStatus, access_level: text(body.access_level, 'carelink_mobile_agent'), mobile_enabled: mobileEnabled, can_view_missions: bool(body.can_view_missions), can_accept_missions: bool(body.can_accept_missions), can_submit_reports: bool(body.can_submit_reports), can_view_payments: bool(body.can_view_payments), device_policy: text(body.device_policy), security_notes: text(body.security_notes), session_limit: Number(body.session_limit || 1), geo_fence_required: bool(body.geo_fence_required), pin_reset_required: bool(body.pin_reset_required), emergency_access_allowed: bool(body.emergency_access_allowed), suspension_reason: text(body.suspension_reason), shutdown_until: body.shutdown_until || null, notes: text(body.notes || body.security_notes) })
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
      result = { access: data }
    }

    if (action === 'save_roster') {
      const { data, error } = await saveOneByCaregiver(supabase as any, 'carelink_agent_roster_preferences', caregiverId, { preferred_days: list(body.preferred_days), preferred_time_blocks: list(body.preferred_time_blocks), preferred_zones: list(body.preferred_zones), excluded_zones: list(body.excluded_zones), blocked_days: list(body.blocked_days), max_daily_hours: body.max_daily_hours ? Number(body.max_daily_hours) : null, max_weekly_hours: body.max_weekly_hours ? Number(body.max_weekly_hours) : null, max_distance_km: body.max_distance_km ? Number(body.max_distance_km) : null, replacement_priority: text(body.replacement_priority), accepts_weekends: bool(body.accepts_weekends), accepts_night: bool(body.accepts_night), accepts_emergency_replacement: bool(body.accepts_emergency_replacement), transport_required: bool(body.transport_required), emergency_available: bool(body.emergency_available), notes: text(body.notes || body.roster_notes), roster_notes: text(body.roster_notes || body.notes), payload: body })
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
      result = { roster: data }
    }

    if (action === 'save_payment_config') {
      const { data, error } = await saveOneByCaregiver(supabase as any, 'carelink_agent_payment_configs', caregiverId, { hourly_rate: body.hourly_rate ? Number(body.hourly_rate) : null, hourly_rate_mad: body.hourly_rate_mad ? Number(body.hourly_rate_mad) : null, daily_rate: body.daily_rate ? Number(body.daily_rate) : null, mission_rate: body.mission_rate ? Number(body.mission_rate) : null, overtime_rate: body.overtime_rate ? Number(body.overtime_rate) : null, transport_allowance: body.transport_allowance ? Number(body.transport_allowance) : null, payment_mode: text(body.payment_mode, 'monthly'), payment_cycle: text(body.payment_cycle || body.payment_mode, 'monthly'), currency: text(body.currency, 'MAD'), allowance_rules: text(body.allowance_rules), bank_name: text(body.bank_name), bank_account: text(body.bank_account), wallet_phone: text(body.wallet_phone), bank_or_wallet: text(body.bank_or_wallet), finance_status: text(body.finance_status, 'draft'), finance_notes: text(body.finance_notes), notes: text(body.notes || body.finance_notes), payload: body })
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
      result = { paymentConfig: data }
    }

    if (action === 'add_payment_validation') {
      const { data, error } = await (supabase as any).from('carelink_agent_payment_validations').insert({ caregiver_id: caregiverId, mission_id: text(body.mission_id), label: text(body.label), amount: Number(body.amount || 0), currency: text(body.currency, 'MAD'), status: text(body.status, 'draft'), validation_type: text(body.validation_type, 'manual'), period_start: body.period_start || null, period_end: body.period_end || null, notes: text(body.notes), validated_at: text(body.status) === 'validated' ? now : null, validated_by: text(body.created_by, 'CareLink Ops'), payload: body }).select('*').single()
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
      result = { paymentValidation: data }
    }

    if (action === 'update_payment_validation') {
      const validationId = Number(body.payment_validation_id || body.id)
      if (!Number.isFinite(validationId) || !validationId) return NextResponse.json({ ok: false, error: 'Payment validation id is required' }, { status: 400 })
      const { data, error } = await (supabase as any).from('carelink_agent_payment_validations').update(compact({ label: text(body.label), amount: body.amount !== undefined ? Number(body.amount || 0) : undefined, currency: text(body.currency), status: text(body.status), period_start: body.period_start || undefined, period_end: body.period_end || undefined, notes: text(body.notes), validated_at: text(body.status) === 'validated' ? now : undefined, validated_by: text(body.created_by, 'CareLink Ops'), payload: body, updated_at: now })).eq('id', validationId).eq('caregiver_id', caregiverId).select('*').single()
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
      result = { paymentValidation: data }
    }

    if (action === 'delete_payment_validation') {
      const validationId = Number(body.payment_validation_id || body.id)
      if (!Number.isFinite(validationId) || !validationId) return NextResponse.json({ ok: false, error: 'Payment validation id is required' }, { status: 400 })
      const { error } = await (supabase as any).from('carelink_agent_payment_validations').delete().eq('id', validationId).eq('caregiver_id', caregiverId)
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
      result = { deletedPaymentValidation: validationId }
    }

    if (action === 'save_training') {
      const { data, error } = await saveOneByCaregiver(supabase as any, 'carelink_agent_training_plans', caregiverId, { training_path: text(body.training_path), required_tracks: list(body.required_tracks), completed_tracks: list(body.completed_tracks), training_status: text(body.training_status, 'draft'), onboarding_status: text(body.onboarding_status, 'pending'), certification_status: text(body.certification_status, 'pending'), compliance_status: text(body.compliance_status, 'pending'), next_training_date: body.next_training_date || null, trainer_name: text(body.trainer_name), learning_notes: text(body.learning_notes), notes: text(body.notes || body.learning_notes), payload: body })
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
      result = { trainingPlan: data }
    }

    await logAgentAction(supabase as any, caregiverId, action, moduleType, body)
    await notifyAgentWorkflow(supabase as any, caregiverId, action, moduleType, body)
    const command = await loadCommand(supabase as any, caregiverId)

    return NextResponse.json({ ok: true, action, result, command })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unable to sync caregiver command module' }, { status: 500 })
  }
}
