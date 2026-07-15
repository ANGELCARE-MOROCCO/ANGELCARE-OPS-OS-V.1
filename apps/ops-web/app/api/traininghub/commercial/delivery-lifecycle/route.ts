import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  getTrainingHubContext,
  requireTrainingHubPermission,
  trainingHubErrorResponse,
  TrainingHubHttpError,
} from '@/lib/traininghub/auth'

export const dynamic = 'force-dynamic'

type JsonRecord = Record<string, any>

const WRITE_PERMISSIONS = ['training.delivery.manage', 'training.access.manage', 'training.proposal.create']

function clean(value: unknown) {
  return String(value || '').trim()
}

function n(value: unknown) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalize(value: unknown) {
  return clean(value).toLowerCase()
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE

  if (!url || !serviceKey) {
    throw new TrainingHubHttpError(
      'Configuration serveur manquante: SUPABASE_SERVICE_ROLE_KEY requis pour le delivery TrainingHub.',
      500,
      'TRAININGHUB_SERVICE_ROLE_MISSING',
    )
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }) as any
}

function missingSchemaColumn(error: any) {
  const text = String(error?.message || error?.details || '')
  const match = text.match(/Could not find the '([^']+)' column/i)
  return match?.[1] || null
}

function notNullColumn(error: any) {
  const text = String(error?.message || error?.details || '')
  const match = text.match(/null value in column "([^"]+)"/i)
  return match?.[1] || null
}

function defaultValueForRequiredColumn(table: string, column: string, payload: JsonRecord) {
  const now = new Date().toISOString()
  const key = `${table}.${column}`
  const code = Date.now().toString(36).toUpperCase()

  const defaults: Record<string, any> = {
    'trn_sessions.session_code': `TH-SES-${code}`,
    'trn_sessions.status': 'planned',
    'trn_sessions.delivery_mode': 'onsite',
    'trn_session_participants.full_name': 'Participant TrainingHub',
    'trn_session_participants.participant_name': 'Participant TrainingHub',
    'trn_session_participants.email': `participant-${code.toLowerCase()}@example.com`,
    'trn_session_participants.attendance_status': 'present',
    'trn_session_participants.certificate_status': 'eligible',
    'trn_session_participants.refresh_access_status': 'active',
    'trn_session_participants.status': 'active',
    'trn_session_participants.participant_type': 'staff',
    'trn_certificates.certificate_number': `TH-CERT-${code}`,
    'trn_certificates.status': 'issued',
    'trn_certificates.issued_at': now,
    'trn_certificates.expires_at': new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    'trn_certificates.certificate_type': 'training_completion',
    'trn_certificates.source_type': 'session',
  }

  if (Object.prototype.hasOwnProperty.call(defaults, key)) return defaults[key]

  if (column.endsWith('_code') || column.endsWith('_number')) return `TH-${column.replace(/_/g, '-').toUpperCase()}-${code}`
  if (column.includes('status')) return 'active'
  if (column.includes('type')) return 'training'
  if (column.includes('name') || column.includes('title')) return 'TrainingHub'
  if (column.includes('email')) return `traininghub-${code.toLowerCase()}@example.com`
  if (column.endsWith('_at') || column.includes('date')) return now
  if (column.includes('count') || column.includes('total') || column.includes('hours') || column.includes('score')) return 0
  if (column === 'metadata' || column === 'payload') return {}

  return payload[column] ?? undefined
}

async function insertFirst(admin: any, table: string, payloads: JsonRecord[], code: string, message: string) {
  let lastError: any = null

  for (const payload of payloads) {
    let safePayload: JsonRecord = { ...payload }

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const { data, error } = await admin.from(table).insert(safePayload).select('*').maybeSingle()
      if (!error && data) return data

      lastError = error

      const missingColumn = missingSchemaColumn(error)
      if (missingColumn && Object.prototype.hasOwnProperty.call(safePayload, missingColumn)) {
        const { [missingColumn]: _removed, ...nextPayload } = safePayload
        safePayload = nextPayload
        continue
      }

      const requiredColumn = notNullColumn(error)
      const defaultValue = requiredColumn ? defaultValueForRequiredColumn(table, requiredColumn, safePayload) : undefined
      if (requiredColumn && defaultValue !== undefined) {
        safePayload = { ...safePayload, [requiredColumn]: defaultValue }
        continue
      }

      break
    }
  }

  throw new TrainingHubHttpError(lastError?.message || message, 500, code)
}

async function updateFirst(admin: any, table: string, id: string, payloads: JsonRecord[], code: string, message: string) {
  let lastError: any = null

  for (const payload of payloads) {
    let safePayload: JsonRecord = { ...payload }

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const { data, error } = await admin.from(table).update(safePayload).eq('id', id).select('*').maybeSingle()
      if (!error && data) return data

      lastError = error
      const missingColumn = missingSchemaColumn(error)
      if (missingColumn && Object.prototype.hasOwnProperty.call(safePayload, missingColumn)) {
        const { [missingColumn]: _removed, ...nextPayload } = safePayload
        safePayload = nextPayload
        continue
      }
      break
    }
  }

  throw new TrainingHubHttpError(lastError?.message || message, 500, code)
}

async function audit(admin: any, input: JsonRecord) {
  const payload = {
    organization_id: input.organization_id || null,
    actor_user_id: input.actor_user_id || null,
    entity_type: input.entity_type || 'traininghub_delivery_lifecycle',
    entity_id: input.entity_id || null,
    action: input.action || 'traininghub.delivery.action',
    severity: input.severity || 'info',
    message: input.message || input.action || 'Action TrainingHub',
    metadata: {
      source: 'traininghub_delivery_lifecycle',
      ...input.metadata,
    },
  }

  const attempts = [
    () => admin.from('audit_change_logs').insert(payload).select('*').maybeSingle(),
    () => admin.from('audit_security_logs').insert(payload).select('*').maybeSingle(),
    () =>
      admin.from('auto_events').insert({
        organization_id: payload.organization_id,
        event_type: payload.action,
        title: payload.message,
        status: 'open',
        payload: payload.metadata,
      }).select('*').maybeSingle(),
  ]

  for (const attempt of attempts) {
    try {
      const { data, error } = await attempt()
      if (!error && data) return data
    } catch {
      // best effort
    }
  }
  return null
}

async function getSession(admin: any, sessionId: string) {
  const { data, error } = await admin.from('trn_sessions').select('*').eq('id', sessionId).maybeSingle()
  if (error || !data?.id) throw new TrainingHubHttpError(error?.message || 'Session introuvable.', 404, 'TRAININGHUB_SESSION_NOT_FOUND')
  return data
}

async function getParticipants(admin: any, sessionId: string) {
  const { data } = await admin.from('trn_session_participants').select('*').eq('session_id', sessionId)
  return Array.isArray(data) ? data : []
}

async function createParticipants(admin: any, body: JsonRecord, actorId: string) {
  const sessionId = clean(body.session_id)
  if (!sessionId) throw new TrainingHubHttpError('Session requise.', 400, 'TRAININGHUB_SESSION_REQUIRED')

  const session = await getSession(admin, sessionId)
  const rawParticipants = Array.isArray(body.participants) && body.participants.length
    ? body.participants
    : Array.from({ length: Math.max(1, Math.min(60, Math.floor(n(body.count || session.planned_participant_count || 3)))) }).map((_, index) => ({
        full_name: `Participant ${index + 1}`,
        email: `participant-${index + 1}-${Date.now().toString(36)}@example.com`,
        job_title: 'Équipe partenaire',
      }))

  const created = []

  for (const raw of rawParticipants) {
    const fullName = clean(raw.full_name || raw.name || raw.participant_name) || 'Participant TrainingHub'
    const email = clean(raw.email) || `participant-${Date.now().toString(36)}@example.com`
    const participant = await insertFirst(
      admin,
      'trn_session_participants',
      [
        {
          organization_id: session.organization_id,
          site_id: session.site_id || null,
          session_id: session.id,
          full_name: fullName,
          participant_name: fullName,
          email,
          job_title: clean(raw.job_title) || 'Équipe partenaire',
          attendance_status: 'registered',
          certificate_status: 'pending',
          refresh_access_status: 'pending',
          status: 'active',
          participant_type: 'staff',
          metadata: {
            source: 'traininghub_delivery_lifecycle',
            created_by: actorId,
          },
        },
        {
          organization_id: session.organization_id,
          session_id: session.id,
          full_name: fullName,
          email,
          attendance_status: 'registered',
          certificate_status: 'pending',
          status: 'active',
        },
        {
          organization_id: session.organization_id,
          session_id: session.id,
          full_name: fullName,
          status: 'active',
        },
      ],
      'TRAININGHUB_PARTICIPANT_CREATE_FAILED',
      'Participant non créé.',
    )
    created.push(participant)
  }

  await audit(admin, {
    organization_id: session.organization_id,
    actor_user_id: actorId,
    entity_type: 'trn_session',
    entity_id: session.id,
    action: 'traininghub.participants.created',
    message: 'Participants ajoutés à la session',
    metadata: { session_id: session.id, participants: created.map((item) => item.id) },
  })

  return { session, participants: created }
}

async function markAttendance(admin: any, body: JsonRecord, actorId: string) {
  const sessionId = clean(body.session_id)
  if (!sessionId) throw new TrainingHubHttpError('Session requise.', 400, 'TRAININGHUB_SESSION_REQUIRED')

  const session = await getSession(admin, sessionId)
  const participants = await getParticipants(admin, sessionId)
  const updated = []

  for (const participant of participants) {
    const row = await updateFirst(
      admin,
      'trn_session_participants',
      participant.id,
      [
        {
          attendance_status: 'present',
          certificate_status: 'eligible',
          refresh_access_status: 'active',
          status: 'active',
          metadata: {
            ...(participant.metadata || {}),
            attendance_marked_by: actorId,
            attendance_marked_at: new Date().toISOString(),
          },
        },
        {
          attendance_status: 'present',
          certificate_status: 'eligible',
          status: 'active',
        },
        {
          status: 'active',
        },
      ],
      'TRAININGHUB_ATTENDANCE_UPDATE_FAILED',
      'Présence non validée.',
    )
    updated.push(row)
  }

  await updateFirst(
    admin,
    'trn_sessions',
    session.id,
    [
      {
        status: 'delivered',
        delivered_at: new Date().toISOString(),
        actual_participant_count: updated.length,
        metadata: {
          ...(session.metadata || {}),
          delivered_by: actorId,
        },
      },
      { status: 'delivered', actual_participant_count: updated.length },
      { status: 'delivered' },
    ],
    'TRAININGHUB_SESSION_DELIVERED_FAILED',
    'Session non marquée livrée.',
  )

  await audit(admin, {
    organization_id: session.organization_id,
    actor_user_id: actorId,
    entity_type: 'trn_session',
    entity_id: session.id,
    action: 'traininghub.attendance.validated',
    message: 'Présences validées',
    metadata: { session_id: session.id, participant_count: updated.length },
  })

  return { session, participants: updated }
}

async function issueCertificates(admin: any, body: JsonRecord, actorId: string) {
  const sessionId = clean(body.session_id)
  if (!sessionId) throw new TrainingHubHttpError('Session requise.', 400, 'TRAININGHUB_SESSION_REQUIRED')

  const session = await getSession(admin, sessionId)
  let participants = await getParticipants(admin, sessionId)

  if (!participants.length) {
    const created = await createParticipants(admin, { session_id: sessionId, count: session.planned_participant_count || 1 }, actorId)
    participants = created.participants
  }

  const eligible = participants.filter((participant) =>
    ['present', 'eligible', 'completed', 'active'].includes(normalize(participant.attendance_status || participant.certificate_status || participant.status)),
  )
  const targetParticipants = eligible.length ? eligible : participants
  const certificates = []

  for (const participant of targetParticipants) {
    const certificateNumber = `TH-CERT-${Date.now().toString(36).toUpperCase()}-${String(certificates.length + 1).padStart(2, '0')}`
    const cert = await insertFirst(
      admin,
      'trn_certificates',
      [
        {
          organization_id: session.organization_id,
          site_id: session.site_id || null,
          session_id: session.id,
          course_id: session.course_id || null,
          participant_id: participant.id,
          certificate_number: certificateNumber,
          status: 'issued',
          issued_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          certificate_type: 'training_completion',
          source_type: 'session',
          metadata: {
            source: 'traininghub_delivery_lifecycle',
            participant_name: participant.full_name || participant.participant_name,
            issued_by: actorId,
          },
        },
        {
          organization_id: session.organization_id,
          session_id: session.id,
          participant_id: participant.id,
          certificate_number: certificateNumber,
          status: 'issued',
          issued_at: new Date().toISOString(),
        },
        {
          organization_id: session.organization_id,
          session_id: session.id,
          certificate_number: certificateNumber,
          status: 'issued',
        },
      ],
      'TRAININGHUB_CERTIFICATE_CREATE_FAILED',
      'Certificat non créé.',
    )
    certificates.push(cert)

    try {
      await admin.from('trn_session_participants').update({ certificate_status: 'issued' }).eq('id', participant.id)
    } catch {
      // best effort only
    }
  }

  await updateFirst(
    admin,
    'trn_sessions',
    session.id,
    [
      {
        status: 'closed',
        closed_at: new Date().toISOString(),
        actual_participant_count: participants.length,
      },
      { status: 'closed' },
    ],
    'TRAININGHUB_SESSION_CLOSE_FAILED',
    'Session non clôturée.',
  )

  await audit(admin, {
    organization_id: session.organization_id,
    actor_user_id: actorId,
    entity_type: 'trn_session',
    entity_id: session.id,
    action: 'traininghub.certificates.issued',
    message: 'Certificats émis',
    metadata: { session_id: session.id, certificate_count: certificates.length },
  })

  return { session, certificates }
}

async function verifyDelivery(admin: any, sessionId: string) {
  const session = await getSession(admin, sessionId)
  const participants = await getParticipants(admin, sessionId)
  const { data: certificates } = await admin.from('trn_certificates').select('*').eq('session_id', sessionId)
  const certRows = Array.isArray(certificates) ? certificates : []

  const score = Math.min(
    100,
    Math.round(
      25 +
        (participants.length ? 25 : 0) +
        (participants.some((item) => normalize(item.attendance_status) === 'present') ? 20 : 0) +
        (certRows.length ? 25 : 0) +
        (['closed', 'delivered'].includes(normalize(session.status)) ? 5 : 0),
    ),
  )

  return {
    session,
    score,
    counts: {
      participants: participants.length,
      certificates: certRows.length,
    },
    next_best_actions: [
      !participants.length ? 'Ajouter les participants' : null,
      participants.length && !participants.some((item) => normalize(item.attendance_status) === 'present') ? 'Valider les présences' : null,
      participants.length && !certRows.length ? 'Émettre les certificats' : null,
    ].filter(Boolean),
  }
}

export async function GET(request: NextRequest) {
  try {
    const context = await getTrainingHubContext()
    if (!context.isInternal && !context.isSuperAdmin) {
      throw new TrainingHubHttpError('Accès direction requis.', 403, 'TRAININGHUB_DELIVERY_INTERNAL_ONLY')
    }
    requireTrainingHubPermission(context, WRITE_PERMISSIONS)

    const sessionId = clean(request.nextUrl.searchParams.get('session_id'))
    if (!sessionId) throw new TrainingHubHttpError('Session requise.', 400, 'TRAININGHUB_SESSION_REQUIRED')

    const admin = getServiceClient()
    return NextResponse.json({ ok: true, data: await verifyDelivery(admin, sessionId) })
  } catch (error) {
    return trainingHubErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getTrainingHubContext()
    if (!context.isInternal && !context.isSuperAdmin) {
      throw new TrainingHubHttpError('Accès direction requis.', 403, 'TRAININGHUB_DELIVERY_INTERNAL_ONLY')
    }
    requireTrainingHubPermission(context, WRITE_PERMISSIONS)

    const body = (await request.json()) as JsonRecord
    const action = clean(body.action)
    const admin = getServiceClient()

    if (action === 'create_participants') {
      return NextResponse.json({ ok: true, data: await createParticipants(admin, body, context.profile.id) })
    }

    if (action === 'mark_attendance') {
      return NextResponse.json({ ok: true, data: await markAttendance(admin, body, context.profile.id) })
    }

    if (action === 'issue_certificates') {
      return NextResponse.json({ ok: true, data: await issueCertificates(admin, body, context.profile.id) })
    }

    if (action === 'run_full_delivery') {
      const sessionId = clean(body.session_id)
      await createParticipants(admin, { ...body, session_id: sessionId, count: body.count || 3 }, context.profile.id)
      await markAttendance(admin, { session_id: sessionId }, context.profile.id)
      const certificates = await issueCertificates(admin, { session_id: sessionId }, context.profile.id)
      return NextResponse.json({
        ok: true,
        data: {
          ...certificates,
          verification: await verifyDelivery(admin, sessionId),
        },
      })
    }

    if (action === 'verify_delivery') {
      return NextResponse.json({ ok: true, data: await verifyDelivery(admin, clean(body.session_id)) })
    }

    throw new TrainingHubHttpError('Action delivery inconnue.', 400, 'TRAININGHUB_DELIVERY_ACTION_UNKNOWN')
  } catch (error) {
    return trainingHubErrorResponse(error)
  }
}
