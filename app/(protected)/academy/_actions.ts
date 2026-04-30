'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { generateAcademySerial, generateCertificateNumber } from './_lib/academyWorkflow'

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
  const supabase = await createClient(); const trainee_id = v(fd, 'trainee_id')
  const payload = { trainee_id, course_id: v(fd, 'course_id'), group_id: v(fd, 'group_id'), status: v(fd, 'status') || 'enrolled', note: v(fd, 'note') }
  const { data, error } = await supabase.from('academy_enrollments').insert(payload).select('id').single()
  if (error) throw new Error(error.message)
  await supabase.from('academy_trainees').update({ status: 'enrolled', assigned_group_id: payload.group_id, updated_at: new Date().toISOString() }).eq('id', trainee_id)
  await audit('create', 'academy_enrollments', data?.id, `Enrollment created for trainee ${trainee_id}`)
  revalidatePath('/academy/enrollments'); revalidatePath('/academy/trainees'); refresh()
}

export async function addPayment(fd: FormData) {
  const supabase = await createClient()
  const payload = { trainee_id: v(fd, 'trainee_id'), enrollment_id: v(fd, 'enrollment_id'), amount: n(fd, 'amount'), method: v(fd, 'method'), status: v(fd, 'status') || 'pending', paid_at: v(fd, 'paid_at'), due_at: v(fd, 'due_at'), reference: v(fd, 'reference') }
  const { data, error } = await supabase.from('academy_payments').insert(payload).select('id').single()
  if (error) throw new Error(error.message)
  await audit('create', 'academy_payments', data?.id, `Payment ${payload.status} amount ${payload.amount}`)
  revalidatePath('/academy/payments'); refresh()
}

export async function markAttendance(fd: FormData) {
  const supabase = await createClient()
  const payload = { trainee_id: v(fd, 'trainee_id'), group_id: v(fd, 'group_id'), session_date: v(fd, 'session_date') || new Date().toISOString().slice(0, 10), status: v(fd, 'status') || 'present', note: v(fd, 'note') }
  const { data, error } = await supabase.from('academy_attendance').insert(payload).select('id').single()
  if (error) throw new Error(error.message)
  await audit('create', 'academy_attendance', data?.id, `Attendance ${payload.status}`)
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
