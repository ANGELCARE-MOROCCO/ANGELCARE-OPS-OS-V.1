'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { generateAcademySerial, generateCertificateNumber } from './_lib/academyWorkflow'
import { academyProductionSync } from './_lib/productionSync'

function v(fd: FormData, key: string) { const x = fd.get(key); return typeof x === 'string' && x.trim() ? x.trim() : null }
function n(fd: FormData, key: string) { const x = Number(fd.get(key)); return Number.isFinite(x) ? x : 0 }
async function audit(action: string, entity: string, entity_id?: string | null, note?: string | null) {
  const supabase = await createClient()
  await supabase.from('academy_audit_logs').insert({ action, entity, entity_id, note, created_at: new Date().toISOString() })
}
function refresh() { revalidatePath('/academy') }

export async function createTrainee(fd: FormData) {
  const supabase = await createClient()
  const city = v(fd, 'city')
  const payload = { serial_number: generateAcademySerial(city), full_name: v(fd, 'full_name'), phone: v(fd, 'phone'), email: v(fd, 'email'), city, source: v(fd, 'source'), status: v(fd, 'status') || 'prospect', eligibility_status: 'pending', notes: v(fd, 'notes') }
  const { data, error } = await supabase.from('academy_trainees').insert(payload).select('id').single()
  if (error) throw new Error(error.message)
  await audit('create', 'academy_trainees', data?.id, `Created trainee ${payload.full_name}`)
  await academyProductionSync({ event_key: 'trainee_created', entity: 'academy_trainees', entity_id: data?.id, title: `New Academy trainee: ${payload.full_name}`, note: 'New trainee requires eligibility validation and follow-up.', priority: 'high', payload: { trainee: payload, next_action: 'Validate eligibility and assign owner' } })
  revalidatePath('/academy/trainees'); refresh()
}

export async function updateTraineeStatus(fd: FormData) {
  const supabase = await createClient(); const id = v(fd, 'trainee_id')
  const { error } = await supabase.from('academy_trainees').update({ status: v(fd, 'status'), notes: v(fd, 'notes'), updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
  await audit('update_status', 'academy_trainees', id, `Status changed to ${v(fd, 'status')}`)
  revalidatePath('/academy/trainees'); refresh()
}

export async function validateEligibility(fd: FormData) {
  const supabase = await createClient(); const id = v(fd, 'trainee_id'); const status = v(fd, 'eligibility_status') || 'pending'
  const score = n(fd, 'score')
  const { error } = await supabase.from('academy_trainees').update({ eligibility_status: status, eligibility_score: score, eligibility_note: v(fd, 'note'), status: status === 'approved' ? 'eligible' : status === 'rejected' ? 'rejected' : 'prospect', updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
  await audit('eligibility_decision', 'academy_trainees', id, `${status} with score ${score}. ${v(fd, 'note') || ''}`)
  await academyProductionSync({ event_key: 'eligibility_decision', entity: 'academy_trainees', entity_id: id, title: `Eligibility ${status}`, note: v(fd, 'note'), priority: status === 'approved' ? 'high' : 'medium', payload: { status, score, next_action: status === 'approved' ? 'Create enrollment and payment plan' : 'Review trainee file' } })
  revalidatePath('/academy/eligibility'); revalidatePath('/academy/trainees'); refresh()
}

export async function createCourse(fd: FormData) {
  const supabase = await createClient()
  const payload = { title: v(fd, 'title'), category: v(fd, 'category'), level: v(fd, 'level'), duration_hours: n(fd, 'duration_hours'), price: n(fd, 'price'), status: v(fd, 'status') || 'active', description: v(fd, 'description') }
  const { data, error } = await supabase.from('academy_courses').insert(payload).select('id').single()
  if (error) throw new Error(error.message)
  await audit('create', 'academy_courses', data?.id, `Created course ${payload.title}`)
  revalidatePath('/academy/courses'); refresh()
}

export async function createTrainer(fd: FormData) {
  const supabase = await createClient()
  const payload = { full_name: v(fd, 'full_name'), phone: v(fd, 'phone'), email: v(fd, 'email'), specialty: v(fd, 'specialty'), status: v(fd, 'status') || 'active', notes: v(fd, 'notes') }
  const { data, error } = await supabase.from('academy_trainers').insert(payload).select('id').single()
  if (error) throw new Error(error.message)
  await audit('create', 'academy_trainers', data?.id, `Created trainer ${payload.full_name}`)
  revalidatePath('/academy/trainers'); refresh()
}

export async function createLocation(fd: FormData) {
  const supabase = await createClient()
  const payload = { name: v(fd, 'name'), city: v(fd, 'city'), address: v(fd, 'address'), capacity: n(fd, 'capacity'), type: v(fd, 'type') || 'internal', status: v(fd, 'status') || 'active' }
  const { data, error } = await supabase.from('academy_locations').insert(payload).select('id').single()
  if (error) throw new Error(error.message)
  await audit('create', 'academy_locations', data?.id, `Created location ${payload.name}`)
  revalidatePath('/academy/locations-groups'); refresh()
}

export async function createGroup(fd: FormData) {
  const supabase = await createClient()
  const payload = { name: v(fd, 'name'), course_id: v(fd, 'course_id'), trainer_id: v(fd, 'trainer_id'), location_id: v(fd, 'location_id'), location: v(fd, 'location'), start_date: v(fd, 'start_date'), end_date: v(fd, 'end_date'), status: v(fd, 'status') || 'planned', max_capacity: n(fd, 'max_capacity') || 20 }
  const { data, error } = await supabase.from('academy_groups').insert(payload).select('id').single()
  if (error) throw new Error(error.message)
  await audit('create', 'academy_groups', data?.id, `Created group ${payload.name}`)
  revalidatePath('/academy/locations-groups'); refresh()
}

export async function createEnrollment(fd: FormData) {
  const supabase = await createClient()
  const trainee_id = v(fd, 'trainee_id')
  if (!trainee_id) throw new Error('Approved trainee is required')

  const desiredStatus = v(fd, 'status') || 'enrolled'
  const basePayload = {
    trainee_id,
    course_id: v(fd, 'course_id'),
    group_id: v(fd, 'group_id'),
    note: v(fd, 'note'),
  }

  // Production-safe enrollment write:
  // A trainee must not receive a new active enrollment every time the manager saves.
  // We update the current operational enrollment when it exists, otherwise we insert once.
  const activeStatuses = ['pending', 'enrolled', 'active', 'ongoing', 'on_hold']
  const { data: existingEnrollment, error: lookupError } = await supabase
    .from('academy_enrollments')
    .select('id')
    .eq('trainee_id', trainee_id)
    .in('status', activeStatuses)
    .order('updated_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  if (lookupError) throw new Error(lookupError.message)

  let data: { id?: string } | null = existingEnrollment || null
  let writeError: string | null = null

  const productionPayload = {
    ...basePayload,
    status: desiredStatus,
    updated_at: new Date().toISOString(),
  }

  if (existingEnrollment?.id) {
    const update = await supabase
      .from('academy_enrollments')
      .update(productionPayload)
      .eq('id', existingEnrollment.id)
      .select('id')
      .single()
    if (update.error) throw new Error(update.error.message)
    data = update.data
  } else {
    const first = await supabase
      .from('academy_enrollments')
      .insert(productionPayload)
      .select('id')
      .single()

    if (first.error) {
      const missingStatus = String(first.error.message || '').toLowerCase().includes('status')
      if (!missingStatus) throw new Error(first.error.message)

      const fallback = await supabase
        .from('academy_enrollments')
        .insert(basePayload)
        .select('id')
        .single()

      if (fallback.error) throw new Error(fallback.error.message)
      data = fallback.data
      writeError = 'academy_enrollments.status is missing in database; fallback insert succeeded. Run the included status migration.'
    } else {
      data = first.data
    }
  }

  const traineeUpdate = await supabase
    .from('academy_trainees')
    .update({ status: 'enrolled', assigned_group_id: basePayload.group_id, updated_at: new Date().toISOString() })
    .eq('id', trainee_id)

  if (traineeUpdate.error) throw new Error(traineeUpdate.error.message)

  await audit(existingEnrollment?.id ? 'update' : 'create', 'academy_enrollments', data?.id, `${existingEnrollment?.id ? 'Enrollment updated' : 'Enrollment created'} for trainee ${trainee_id}${writeError ? ` (${writeError})` : ''}`)
  await academyProductionSync({
    event_key: existingEnrollment?.id ? 'enrollment_updated' : 'enrollment_created',
    entity: 'academy_enrollments',
    entity_id: data?.id,
    title: existingEnrollment?.id ? 'Academy enrollment updated' : 'Academy enrollment created',
    note: `${existingEnrollment?.id ? 'Enrollment updated' : 'Enrollment created'} for trainee ${trainee_id}`,
    priority: 'high',
    payload: { enrollment: { ...basePayload, status: desiredStatus }, next_action: 'Confirm payment and first attendance session' },
  })

  revalidatePath('/academy/enrollments')
  revalidatePath('/academy/trainees')
  refresh()
}

export async function addPayment(fd: FormData) {
  const supabase = await createClient()
  const payload = { trainee_id: v(fd, 'trainee_id'), enrollment_id: v(fd, 'enrollment_id'), amount: n(fd, 'amount'), method: v(fd, 'method'), status: v(fd, 'status') || 'pending', paid_at: v(fd, 'paid_at'), due_at: v(fd, 'due_at'), reference: v(fd, 'reference') }
  const { data, error } = await supabase.from('academy_payments').insert(payload).select('id').single()
  if (error) throw new Error(error.message)
  await audit('create', 'academy_payments', data?.id, `Payment ${payload.status} amount ${payload.amount}`)
  await academyProductionSync({ event_key: 'payment_recorded', entity: 'academy_payments', entity_id: data?.id, title: `Academy payment ${payload.status}`, note: `Payment amount ${payload.amount} MAD`, value_mad: payload.amount, priority: payload.status === 'paid' ? 'medium' : 'high', risk_level: payload.status === 'paid' ? 'low' : 'high', due_at: payload.due_at, payload: { payment: payload, next_action: payload.status === 'paid' ? 'Validate receipt' : 'Recover unpaid balance' } })
  revalidatePath('/academy/payments'); refresh()
}

export async function markAttendance(fd: FormData) {
  const supabase = await createClient()
  const payload = { trainee_id: v(fd, 'trainee_id'), group_id: v(fd, 'group_id'), session_date: v(fd, 'session_date') || new Date().toISOString().slice(0, 10), status: v(fd, 'status') || 'present', note: v(fd, 'note') }
  const { data, error } = await supabase.from('academy_attendance').insert(payload).select('id').single()
  if (error) throw new Error(error.message)
  await audit('create', 'academy_attendance', data?.id, `Attendance ${payload.status}`)
  await academyProductionSync({ event_key: 'attendance_marked', entity: 'academy_attendance', entity_id: data?.id, title: `Attendance ${payload.status}`, note: payload.note, priority: payload.status === 'absent' ? 'high' : 'low', risk_level: payload.status === 'absent' ? 'high' : 'low', payload: { attendance: payload, next_action: payload.status === 'absent' ? 'Call trainee and prevent dropout' : 'No action required' } })
  revalidatePath('/academy/attendance'); refresh()
}

export async function issueCertificate(fd: FormData) {
  const supabase = await createClient(); const trainee_id = v(fd, 'trainee_id'); const course_id = v(fd, 'course_id')
  const { data: trainee } = await supabase.from('academy_trainees').select('serial_number').eq('id', trainee_id).maybeSingle()
  const certificate_number = generateCertificateNumber(trainee?.serial_number)
  const payload = { trainee_id, course_id, certificate_number, serial_number: trainee?.serial_number, verification_hash: `VERIFY-${certificate_number}-${Date.now()}`, status: v(fd, 'status') || 'issued' }
  const { data, error } = await supabase.from('academy_certificates').insert(payload).select('id').single()
  if (error) throw new Error(error.message)
  await supabase.from('academy_trainees').update({ status: 'certified', updated_at: new Date().toISOString() }).eq('id', trainee_id)
  await audit('issue_certificate', 'academy_certificates', data?.id, certificate_number)
  revalidatePath('/academy/certificates'); revalidatePath('/academy/trainees'); refresh()
}

export async function createPartner(fd: FormData) {
  const supabase = await createClient()
  const payload = { name: v(fd, 'name'), type: v(fd, 'type'), city: v(fd, 'city'), contact_name: v(fd, 'contact_name'), phone: v(fd, 'phone'), email: v(fd, 'email'), status: v(fd, 'status') || 'active', notes: v(fd, 'notes') }
  const { data, error } = await supabase.from('academy_partners').insert(payload).select('id').single()
  if (error) throw new Error(error.message)
  await audit('create', 'academy_partners', data?.id, `Partner ${payload.name}`)
  revalidatePath('/academy/partners'); refresh()
}

export async function createGraduationFollowup(fd: FormData) {
  const supabase = await createClient()
  const payload = { trainee_id: v(fd, 'trainee_id'), certificate_id: v(fd, 'certificate_id'), partner_id: v(fd, 'partner_id'), opportunity_type: v(fd, 'opportunity_type'), status: v(fd, 'status') || 'open', next_action: v(fd, 'next_action'), next_action_at: v(fd, 'next_action_at'), notes: v(fd, 'notes') }
  const { data, error } = await supabase.from('academy_graduation_followups').insert(payload).select('id').single()
  if (error) throw new Error(error.message)
  await audit('create', 'academy_graduation_followups', data?.id, `Graduation follow-up ${payload.status}`)
  revalidatePath('/academy/graduation'); refresh()
}

export async function createAlert(fd: FormData) {
  const supabase = await createClient()
  const payload = { title: v(fd, 'title'), message: v(fd, 'message'), severity: v(fd, 'severity') || 'normal', status: v(fd, 'status') || 'open', due_at: v(fd, 'due_at'), related_trainee_id: v(fd, 'related_trainee_id') }
  const { data, error } = await supabase.from('academy_alerts').insert(payload).select('id').single()
  if (error) throw new Error(error.message)
  await audit('create', 'academy_alerts', data?.id, `Alert ${payload.title}`)
  revalidatePath('/academy/alerts-sales'); refresh()
}

const ACADEMY_EDITABLE_TABLES: Record<string, string[]> = {
  academy_trainees: ['full_name','phone','email','city','source','status','eligibility_status','eligibility_score','eligibility_note','assigned_group_id','notes'],
  academy_courses: ['title','category','level','duration_hours','price','status','description'],
  academy_trainers: ['full_name','phone','email','specialty','status','notes'],
  academy_locations: ['name','city','address','capacity','type','status'],
  academy_groups: ['name','course_id','trainer_id','location_id','location','start_date','end_date','status','max_capacity'],
  academy_enrollments: ['trainee_id','course_id','group_id','note'],
  academy_payments: ['trainee_id','enrollment_id','amount','method','status','paid_at','due_at','reference'],
  academy_attendance: ['trainee_id','group_id','session_date','status','note'],
  academy_certificates: ['trainee_id','course_id','certificate_number','serial_number','verification_hash','status'],
  academy_partners: ['name','type','city','contact_name','phone','email','status','notes'],
  academy_alerts: ['title','message','severity','status','due_at','related_trainee_id'],
  academy_graduation_followups: ['trainee_id','certificate_id','partner_id','opportunity_type','status','next_action','next_action_at','notes'],
}

const numericAcademyFields = new Set(['duration_hours','price','capacity','max_capacity','amount','eligibility_score'])

export async function updateAcademyRecord(fd: FormData) {
  const supabase = await createClient()
  const table = v(fd, 'table') || ''
  const id = v(fd, 'id')
  const path = v(fd, 'path') || '/academy'
  const allowed = ACADEMY_EDITABLE_TABLES[table]
  if (!allowed || !id) throw new Error('Invalid Academy update request')
  const payload: Record<string, any> = {}
  for (const key of allowed) {
    if (!fd.has(key)) continue
    const raw = fd.get(key)
    if (raw === null) continue
    const value = typeof raw === 'string' && raw.trim() === '' ? null : raw
    payload[key] = numericAcademyFields.has(key) ? Number(value || 0) : value
  }
  const { error } = await supabase.from(table).update(payload).eq('id', id)
  if (error) throw new Error(error.message)
  await audit('production_update', table, id, `Updated ${Object.keys(payload).join(', ')}`)
  revalidatePath(path); refresh()
}

export async function deleteAcademyRecord(fd: FormData) {
  const supabase = await createClient()
  const table = v(fd, 'table') || ''
  const id = v(fd, 'id')
  const path = v(fd, 'path') || '/academy'
  if (!ACADEMY_EDITABLE_TABLES[table] || !id) throw new Error('Invalid Academy delete request')
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw new Error(error.message)
  await audit('production_delete', table, id, `Deleted from ${table}`)
  revalidatePath(path); refresh()
}

export async function createAcademyAuditNote(fd: FormData) {
  const entity = v(fd, 'entity') || 'academy_operation'
  const entity_id = v(fd, 'entity_id')
  const note = v(fd, 'note')
  await audit('manager_note', entity, entity_id, note)
  revalidatePath(v(fd, 'path') || '/academy'); refresh()
}


export async function setAcademyTraineeDecision(fd: FormData) {
  const supabase = await createClient()
  const id = v(fd, 'trainee_id')
  const decision = v(fd, 'decision') || 'needs_review'
  const payload: Record<string, any> = {
    status: decision === 'approved' ? 'eligible' : decision === 'rejected' ? 'rejected' : decision,
    eligibility_status: decision,
    eligibility_note: v(fd, 'note'),
    updated_at: new Date().toISOString(),
  }
  if (fd.has('score')) payload.eligibility_score = n(fd, 'score')
  const { error } = await supabase.from('academy_trainees').update(payload).eq('id', id)
  if (error) throw new Error(error.message)
  await audit('academy_control_decision', 'academy_trainees', id, `Decision=${decision}. ${v(fd, 'note') || ''}`)
  revalidatePath(v(fd, 'path') || '/academy/action-control'); revalidatePath('/academy/trainees'); refresh()
}

export async function assignAcademyTraineeToGroup(fd: FormData) {
  const supabase = await createClient()
  const trainee_id = v(fd, 'trainee_id')
  const group_id = v(fd, 'group_id')
  const course_id = v(fd, 'course_id')
  const note = v(fd, 'note')
  if (!trainee_id || !group_id) throw new Error('Trainee and group are required')
  const { data: existing } = await supabase.from('academy_enrollments').select('id').eq('trainee_id', trainee_id).eq('group_id', group_id).maybeSingle()
  let enrollmentId = existing?.id
  if (!enrollmentId) {
    const { data, error } = await supabase.from('academy_enrollments').insert({ trainee_id, group_id, course_id, status: 'enrolled', note }).select('id').single()
    if (error) throw new Error(error.message)
    enrollmentId = data?.id
  }
  const { error: traineeError } = await supabase.from('academy_trainees').update({ status: 'enrolled', assigned_group_id: group_id, updated_at: new Date().toISOString() }).eq('id', trainee_id)
  if (traineeError) throw new Error(traineeError.message)
  await audit('academy_group_assignment', 'academy_enrollments', enrollmentId, `Assigned trainee ${trainee_id} to group ${group_id}. ${note || ''}`)
  revalidatePath(v(fd, 'path') || '/academy/action-control'); revalidatePath('/academy/enrollments'); revalidatePath('/academy/trainees'); refresh()
}

export async function updateAcademyEnrollmentStage(fd: FormData) {
  const supabase = await createClient()
  const id = v(fd, 'enrollment_id')
  const status = v(fd, 'status') || 'active'
  const note = v(fd, 'note')
  const { data: enrollment, error: readError } = await supabase.from('academy_enrollments').select('*').eq('id', id).maybeSingle()
  if (readError) throw new Error(readError.message)
  const { error } = await supabase.from('academy_enrollments').update({ status, note, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
  if (enrollment?.trainee_id && ['completed','graduated','certified','dropped'].includes(status)) {
    await supabase.from('academy_trainees').update({ status: status === 'certified' ? 'certified' : status, updated_at: new Date().toISOString() }).eq('id', enrollment.trainee_id)
  }
  await audit('academy_enrollment_stage', 'academy_enrollments', id, `Enrollment moved to ${status}. ${note || ''}`)
  revalidatePath(v(fd, 'path') || '/academy/action-control'); revalidatePath('/academy/enrollments'); revalidatePath('/academy/trainees'); refresh()
}

export async function reconcileAcademyPayment(fd: FormData) {
  const supabase = await createClient()
  const id = v(fd, 'payment_id')
  const status = v(fd, 'status') || 'paid'
  const amount = fd.has('amount') ? n(fd, 'amount') : null
  const reference = v(fd, 'reference')
  const method = v(fd, 'method')
  const payload: Record<string, any> = { status, updated_at: new Date().toISOString() }
  if (amount !== null) payload.amount = amount
  if (reference !== null) payload.reference = reference
  if (method !== null) payload.method = method
  if (status === 'paid' && !fd.has('paid_at')) payload.paid_at = new Date().toISOString().slice(0, 10)
  if (fd.has('paid_at')) payload.paid_at = v(fd, 'paid_at')
  const { error } = await supabase.from('academy_payments').update(payload).eq('id', id)
  if (error) throw new Error(error.message)
  await audit('academy_payment_reconciliation', 'academy_payments', id, `Payment moved to ${status}. Ref=${reference || '—'}`)
  revalidatePath(v(fd, 'path') || '/academy/action-control'); revalidatePath('/academy/payments'); refresh()
}

export async function runAcademyTrainerControl(fd: FormData) {
  const supabase = await createClient()
  const id = v(fd, 'trainer_id')
  const status = v(fd, 'status') || 'active'
  const notes = v(fd, 'notes')
  const { error } = await supabase.from('academy_trainers').update({ status, notes, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
  await audit('academy_trainer_control', 'academy_trainers', id, `Trainer status=${status}. ${notes || ''}`)
  revalidatePath(v(fd, 'path') || '/academy/action-control'); revalidatePath('/academy/trainers'); refresh()
}

export async function runAcademyGroupControl(fd: FormData) {
  const supabase = await createClient()
  const id = v(fd, 'group_id')
  const status = v(fd, 'status') || 'active'
  const note = v(fd, 'note')
  const { error } = await supabase.from('academy_groups').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
  await audit('academy_group_control', 'academy_groups', id, `Group status=${status}. ${note || ''}`)
  revalidatePath(v(fd, 'path') || '/academy/action-control'); revalidatePath('/academy/locations-groups'); revalidatePath('/academy/calendar'); refresh()
}

export async function runAcademyPartnerPipeline(fd: FormData) {
  const supabase = await createClient()
  const id = v(fd, 'partner_id')
  const status = v(fd, 'status') || 'active'
  const notes = v(fd, 'notes')
  const { error } = await supabase.from('academy_partners').update({ status, notes, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
  await audit('academy_partner_pipeline', 'academy_partners', id, `Partner pipeline status=${status}. ${notes || ''}`)
  revalidatePath(v(fd, 'path') || '/academy/action-control'); revalidatePath('/academy/partners'); refresh()
}

export async function resolveAcademyAlert(fd: FormData) {
  const supabase = await createClient()
  const id = v(fd, 'alert_id')
  const status = v(fd, 'status') || 'resolved'
  const note = v(fd, 'note')
  const { error } = await supabase.from('academy_alerts').update({ status, message: note || undefined, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
  await audit('academy_alert_resolution', 'academy_alerts', id, `Alert moved to ${status}. ${note || ''}`)
  revalidatePath(v(fd, 'path') || '/academy/action-control'); revalidatePath('/academy/alerts-sales'); refresh()
}

export async function governAcademyCertificate(fd: FormData) {
  const supabase = await createClient()
  const id = v(fd, 'certificate_id')
  const status = v(fd, 'status') || 'issued'
  const note = v(fd, 'note')
  const { error } = await supabase.from('academy_certificates').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
  await audit('academy_certificate_governance', 'academy_certificates', id, `Certificate status=${status}. ${note || ''}`)
  revalidatePath(v(fd, 'path') || '/academy/action-control'); revalidatePath('/academy/certificates'); refresh()
}

export async function createAcademyControlTicket(fd: FormData) {
  const supabase = await createClient()
  const title = v(fd, 'title') || 'Academy control ticket'
  const message = v(fd, 'message') || 'Production action required'
  const severity = v(fd, 'severity') || 'normal'
  const related_trainee_id = v(fd, 'related_trainee_id')
  const { data, error } = await supabase.from('academy_alerts').insert({ title, message, severity, status: 'open', due_at: v(fd, 'due_at'), related_trainee_id }).select('id').single()
  if (error) throw new Error(error.message)
  await audit('academy_control_ticket', 'academy_alerts', data?.id, `${title}: ${message}`)
  revalidatePath(v(fd, 'path') || '/academy/action-control'); revalidatePath('/academy/alerts-sales'); refresh()
}
