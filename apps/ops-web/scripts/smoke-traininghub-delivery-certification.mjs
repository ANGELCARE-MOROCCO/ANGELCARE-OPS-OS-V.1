import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function missingSchemaColumn(error) {
  const text = String(error?.message || error?.details || '')
  const match = text.match(/Could not find the '([^']+)' column/i)
  return match?.[1] || null
}

function notNullColumn(error) {
  const text = String(error?.message || error?.details || '')
  const match = text.match(/null value in column "([^"]+)"/i)
  return match?.[1] || null
}

function defaultValueForRequiredColumn(table, column, payload) {
  const code = Date.now().toString(36).toUpperCase()
  const now = new Date().toISOString()
  const defaults = {
    'trn_session_participants.full_name': 'Smoke Participant',
    'trn_session_participants.participant_name': 'Smoke Participant',
    'trn_session_participants.email': `smoke-participant-${code.toLowerCase()}@example.com`,
    'trn_session_participants.attendance_status': 'present',
    'trn_session_participants.certificate_status': 'eligible',
    'trn_session_participants.refresh_access_status': 'active',
    'trn_session_participants.status': 'active',
    'trn_session_participants.participant_type': 'staff',
    'trn_certificates.certificate_number': `SMOKE-CERT-${code}`,
    'trn_certificates.status': 'issued',
    'trn_certificates.issued_at': now,
    'trn_certificates.certificate_type': 'training_completion',
    'trn_certificates.source_type': 'session',
  }
  if (Object.prototype.hasOwnProperty.call(defaults, `${table}.${column}`)) return defaults[`${table}.${column}`]
  if (column.includes('status')) return 'active'
  if (column.includes('type')) return 'training'
  if (column.includes('name')) return 'Smoke TrainingHub'
  if (column.includes('email')) return `smoke-${code.toLowerCase()}@example.com`
  if (column.endsWith('_at')) return now
  if (column.includes('count') || column.includes('total') || column.includes('score')) return 0
  if (column === 'metadata') return {}
  return payload[column]
}

async function insertFirst(table, payloads) {
  let lastError = null
  for (const payload of payloads) {
    let safePayload = { ...payload }
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const { data, error } = await supabase.from(table).insert(safePayload).select('*').maybeSingle()
      if (!error && data) return data
      lastError = error

      const missingColumn = missingSchemaColumn(error)
      if (missingColumn && Object.prototype.hasOwnProperty.call(safePayload, missingColumn)) {
        delete safePayload[missingColumn]
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
  throw lastError || new Error(`Insert failed: ${table}`)
}

async function updateAdaptive(table, id, payloads) {
  let lastError = null
  for (const payload of payloads) {
    let safePayload = { ...payload }
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const { data, error } = await supabase.from(table).update(safePayload).eq('id', id).select('*').maybeSingle()
      if (!error && data) return data
      lastError = error
      const missingColumn = missingSchemaColumn(error)
      if (missingColumn && Object.prototype.hasOwnProperty.call(safePayload, missingColumn)) {
        delete safePayload[missingColumn]
        continue
      }
      break
    }
  }
  throw lastError || new Error(`Update failed: ${table}`)
}

const { data: sessions, error: sessionError } = await supabase
  .from('trn_sessions')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(1)

if (sessionError) throw sessionError
const session = sessions?.[0]
if (!session?.id) {
  throw new Error('No trn_sessions row found. Run smoke-traininghub-revenue-lifecycle first.')
}

const createdParticipants = []
for (let i = 1; i <= 3; i += 1) {
  const participant = await insertFirst('trn_session_participants', [
    {
      organization_id: session.organization_id,
      session_id: session.id,
      full_name: `Smoke Participant ${i}`,
      participant_name: `Smoke Participant ${i}`,
      email: `smoke-participant-${i}-${Date.now().toString(36)}@example.com`,
      job_title: 'Équipe partenaire',
      attendance_status: 'present',
      certificate_status: 'eligible',
      refresh_access_status: 'active',
      status: 'active',
      participant_type: 'staff',
    },
    {
      organization_id: session.organization_id,
      session_id: session.id,
      full_name: `Smoke Participant ${i}`,
      attendance_status: 'present',
      certificate_status: 'eligible',
      status: 'active',
    },
    {
      organization_id: session.organization_id,
      session_id: session.id,
      full_name: `Smoke Participant ${i}`,
      status: 'active',
    },
  ])
  createdParticipants.push(participant)
}

const certificates = []
for (const participant of createdParticipants) {
  const cert = await insertFirst('trn_certificates', [
    {
      organization_id: session.organization_id,
      session_id: session.id,
      course_id: session.course_id || null,
      participant_id: participant.id,
      certificate_number: `SMOKE-CERT-${Date.now().toString(36).toUpperCase()}-${certificates.length + 1}`,
      status: 'issued',
      issued_at: new Date().toISOString(),
      certificate_type: 'training_completion',
      source_type: 'session',
    },
    {
      organization_id: session.organization_id,
      session_id: session.id,
      participant_id: participant.id,
      certificate_number: `SMOKE-CERT-${Date.now().toString(36).toUpperCase()}-${certificates.length + 1}`,
      status: 'issued',
    },
  ])
  certificates.push(cert)
}

await updateAdaptive('trn_sessions', session.id, [
  { status: 'closed', actual_participant_count: createdParticipants.length, closed_at: new Date().toISOString() },
  { status: 'closed' },
])

console.log('Smoke delivery certification created:')
console.table([
  {
    session: session.id,
    participants: createdParticipants.length,
    certificates: certificates.length,
  },
])
