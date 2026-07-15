import { createClient } from '@/lib/supabase/server'
import type { AcademyTrainerPayload } from './types'

const TRAINER_COLUMNS = `
  id, reference_number, full_name, email, mobile, professional_title, gender, city, base_location,
  languages, employment_type, status, seniority_level, main_specialty, secondary_specialties,
  readiness_score, dispatch_score, utilization_percent, availability_status, weekly_capacity_hours,
  current_load_hours, max_hours_per_day, programs_qualified, regions_covered, delivery_formats,
  preferred_slots, availability_days, base_rate_type, base_rate_dhs, hourly_rate_dhs, travel_fee_dhs,
  accommodation, payment_method, session_rating, completion_rate, punctuality_score, incident_count,
  documents_verified, contract_signed, compliance_clear, internal_remarks, profile_photo_url,
  created_at, updated_at
`

function ref() {
  return `TRN-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 89999)}`
}

function arr(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean)
  return []
}

function num(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function clean(input: AcademyTrainerPayload) {
  return {
    reference_number: input.reference_number || ref(),
    full_name: String(input.full_name || '').trim(),
    email: input.email || null,
    mobile: input.mobile || null,
    professional_title: input.professional_title || 'Registered Trainer',
    gender: input.gender || null,
    city: input.city || null,
    base_location: input.base_location || null,
    languages: arr(input.languages),
    employment_type: input.employment_type || 'internal',
    status: input.status || 'available',
    seniority_level: input.seniority_level || 'senior',
    main_specialty: input.main_specialty || 'General Training',
    secondary_specialties: arr(input.secondary_specialties),
    readiness_score: num(input.readiness_score, 0),
    dispatch_score: num(input.dispatch_score, 0),
    utilization_percent: num(input.utilization_percent, 0),
    availability_status: input.availability_status || 'available',
    weekly_capacity_hours: num(input.weekly_capacity_hours, 40),
    current_load_hours: num(input.current_load_hours, 0),
    max_hours_per_day: num(input.max_hours_per_day, 6),
    programs_qualified: num(input.programs_qualified, 0),
    regions_covered: arr(input.regions_covered),
    delivery_formats: arr(input.delivery_formats),
    preferred_slots: input.preferred_slots || null,
    availability_days: arr(input.availability_days).length ? arr(input.availability_days) : ['Mon','Tue','Wed','Thu','Fri'],
    base_rate_type: input.base_rate_type || 'per_day',
    base_rate_dhs: num(input.base_rate_dhs, 0),
    hourly_rate_dhs: num(input.hourly_rate_dhs, 0),
    travel_fee_dhs: num(input.travel_fee_dhs, 0),
    accommodation: input.accommodation || null,
    payment_method: input.payment_method || null,
    session_rating: num(input.session_rating, 0),
    completion_rate: num(input.completion_rate, 0),
    punctuality_score: num(input.punctuality_score, 0),
    incident_count: num(input.incident_count, 0),
    documents_verified: Boolean(input.documents_verified),
    contract_signed: Boolean(input.contract_signed),
    compliance_clear: Boolean(input.compliance_clear),
    internal_remarks: input.internal_remarks || null,
    profile_photo_url: input.profile_photo_url || null,
  }
}

async function hydrate(trainers: any[]) {
  if (!trainers.length) return trainers
  const supabase = await createClient()
  const ids = trainers.map((t) => t.id)
  const [{ data: assignments }, { data: certifications }, { data: documents }] = await Promise.all([
    supabase.from('academy_trainer_assignments').select('*').in('trainer_id', ids).order('assignment_date', { ascending: true }),
    supabase.from('academy_trainer_certifications').select('*').in('trainer_id', ids).order('expiry_date', { ascending: true }),
    supabase.from('academy_trainer_documents').select('*').in('trainer_id', ids),
  ])
  return trainers.map((trainer) => ({
    ...trainer,
    assignments: (assignments || []).filter((row: any) => row.trainer_id === trainer.id),
    certifications: (certifications || []).filter((row: any) => row.trainer_id === trainer.id),
    documents: (documents || []).filter((row: any) => row.trainer_id === trainer.id),
  }))
}

export async function listAcademyTrainers() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('academy_trainers')
    .select(TRAINER_COLUMNS)
    .order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return hydrate(data || [])
}

export async function getAcademyTrainer(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('academy_trainers').select(TRAINER_COLUMNS).eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  const [trainer] = await hydrate([data])
  return trainer
}

export async function createAcademyTrainer(input: AcademyTrainerPayload) {
  const payload = clean(input)
  if (!payload.full_name) throw new Error('Trainer full name is required')
  const supabase = await createClient()
  const { data, error } = await supabase.from('academy_trainers').insert(payload).select(TRAINER_COLUMNS).single()
  if (error) throw new Error(error.message)
  const [trainer] = await hydrate([data])
  return trainer
}

export async function updateAcademyTrainer(id: string, input: AcademyTrainerPayload) {
  const payload = clean({ ...input, full_name: input.full_name || 'Unnamed Trainer' })
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('academy_trainers')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(TRAINER_COLUMNS)
    .single()
  if (error) throw new Error(error.message)
  const [trainer] = await hydrate([data])
  return trainer
}

export async function createTrainerAssignment(input: any) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('academy_trainer_assignments')
    .insert({
      trainer_id: input.trainer_id,
      title: input.title || 'Manual trainer assignment',
      cohort_label: input.cohort_label || null,
      program_label: input.program_label || null,
      assignment_date: input.assignment_date || new Date().toISOString().slice(0, 10),
      start_time: input.start_time || null,
      end_time: input.end_time || null,
      location: input.location || null,
      delivery_mode: input.delivery_mode || 'onsite',
      status: input.status || 'planned',
      priority: input.priority || 'normal',
      notes: input.notes || null,
    })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  await supabase.from('academy_trainers').update({ status: 'in_session', availability_status: 'assigned', updated_at: new Date().toISOString() }).eq('id', input.trainer_id)
  return data
}
