import { createClient } from '@/lib/supabase/server'
import type { AcademyCohortPayload, AcademyCohortRecord, AcademyCohortsDashboard } from './types'

function safeUuid(value: unknown) {
  const text = String(value || '').trim()
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text) ? text : null
}

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}
function generateReference() {
  const now = new Date()
  return `COH-${now.getFullYear()}-${String(now.getTime()).slice(-6)}`
}
function defaultChecklist() {
  return [
    { item_key: 'program_validated', label: 'Program validated', checked: false, sort_order: 0 },
    { item_key: 'trainer_assigned', label: 'Trainer assigned', checked: false, sort_order: 1 },
    { item_key: 'participants_confirmed', label: 'Participants confirmed', checked: false, sort_order: 2 },
    { item_key: 'schedule_ready', label: 'Schedule ready', checked: false, sort_order: 3 },
    { item_key: 'materials_shared', label: 'Program resources shared', checked: false, sort_order: 4 },
    { item_key: 'launch_approved', label: 'Launch approved', checked: false, sort_order: 5 },
  ]
}
function normalizePayload(input: AcademyCohortPayload) {
  return {
    reference_number: input.reference_number || generateReference(),
    title: String(input.title || '').trim(),
    program_id: input.program_id ? Number(input.program_id) : null,
    program_title: input.program_title || null,
    trainer_id: input.trainer_id ? String(input.trainer_id) : null,
    trainer_name: input.trainer_name || null,
    start_date: input.start_date || null,
    end_date: input.end_date || null,
    capacity: Math.max(0, toNumber(input.capacity, 0)),
    status: input.status || 'planned',
    readiness_score: Math.max(0, Math.min(100, toNumber(input.readiness_score, 0))),
    progression_percent: Math.max(0, Math.min(100, toNumber(input.progression_percent, 0))),
    attendance_health: Math.max(0, Math.min(100, toNumber(input.attendance_health, 0))),
    notes: input.notes || null,
  }
}
function normalizeCohort(row: any, related: { participants: any[]; checklist: any[] }): AcademyCohortRecord {
  return {
    id: row.id,
    reference_number: row.reference_number,
    title: row.title,
    program_id: row.program_id,
    program_title: row.program_title,
    trainer_id: row.trainer_id,
    trainer_name: row.trainer_name,
    start_date: row.start_date,
    end_date: row.end_date,
    capacity: toNumber(row.capacity),
    status: row.status,
    readiness_score: toNumber(row.readiness_score),
    progression_percent: toNumber(row.progression_percent),
    attendance_health: toNumber(row.attendance_health),
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    participants: related.participants.filter((x) => String(x.cohort_id) === String(row.id)).map((x) => ({ id: x.id, trainee_id: x.trainee_id, enrollment_id: x.enrollment_id, trainee_name: x.trainee_name, email: x.email, phone: x.phone, status: x.status, joined_at: x.joined_at })),
    checklist: related.checklist.filter((x) => String(x.cohort_id) === String(row.id)).map((x) => ({ id: x.id, item_key: x.item_key, label: x.label, checked: Boolean(x.checked), checked_at: x.checked_at, checked_by: x.checked_by, sort_order: x.sort_order })),
  }
}
async function replaceChildren(supabase: any, cohortId: string | number, input: AcademyCohortPayload, userId?: string | null) {
  await Promise.all([
    supabase.from('academy_cohort_participants').delete().eq('cohort_id', cohortId),
    supabase.from('academy_cohort_checklist').delete().eq('cohort_id', cohortId),
  ])
  const participants = (input.participants || []).filter((x) => x.trainee_name || x.trainee_id || x.enrollment_id).map((x) => ({
    cohort_id: cohortId,
    trainee_id: x.trainee_id ? String(x.trainee_id) : null,
    enrollment_id: x.enrollment_id ? String(x.enrollment_id) : null,
    trainee_name: x.trainee_name || 'Participant',
    email: x.email || null,
    phone: x.phone || null,
    status: x.status || 'assigned',
    joined_at: x.joined_at || new Date().toISOString(),
  }))
  const checklist = (input.checklist?.length ? input.checklist : defaultChecklist()).map((x, i) => ({
    cohort_id: cohortId,
    item_key: x.item_key || `item_${i}`,
    label: x.label || `Readiness item ${i + 1}`,
    checked: Boolean(x.checked),
    checked_at: x.checked ? ((x as any).checked_at || new Date().toISOString()) : null,
    checked_by: x.checked ? (safeUuid((x as any).checked_by) || safeUuid(userId)) : null,
    sort_order: i,
  }))
  const writes = []
  if (participants.length) writes.push(supabase.from('academy_cohort_participants').insert(participants))
  if (checklist.length) writes.push(supabase.from('academy_cohort_checklist').insert(checklist))
  const results = await Promise.all(writes)
  const error = results.find((x: any) => x.error)?.error
  if (error) throw new Error(error.message)
}

export async function getAcademyCohortsDashboard(): Promise<AcademyCohortsDashboard> {
  const supabase = await createClient()
  const [cohorts, programs, trainers, enrollments, trainees, participants, checklist] = await Promise.all([
    supabase.from('academy_cohorts').select('*').order('updated_at', { ascending: false }).limit(250),
    supabase.from('academy_programs').select('id,title,program_name,reference_number,duration_days,total_hours').order('title', { ascending: true }).limit(500),
    supabase.from('academy_trainers').select('id,full_name,specialty,status').order('full_name', { ascending: true }).limit(500),
    supabase.from('academy_enrollments').select('*').order('created_at', { ascending: false }).limit(500),
    supabase.from('academy_trainees').select('id,full_name,email,phone,status').limit(1000),
    supabase.from('academy_cohort_participants').select('*'),
    supabase.from('academy_cohort_checklist').select('*').order('sort_order', { ascending: true }),
  ])
  if (cohorts.error) throw new Error(cohorts.error.message)
  const traineeMap = new Map((trainees.data || []).map((t: any) => [t.id, t]))
  const approvedEnrollments = (enrollments.data || []).filter((e: any) => ['approved','enrolled','active','pending'].includes(String(e.status || 'approved'))).map((e: any) => {
    const t = traineeMap.get(e.trainee_id) as any
    return { id: String(e.id), trainee_id: e.trainee_id ? String(e.trainee_id) : null, trainee_name: t?.full_name || 'Approved trainee', program_id: e.program_id ? String(e.program_id) : null, course_id: e.course_id ? String(e.course_id) : null, status: e.status || 'approved', email: t?.email || null, phone: t?.phone || null }
  })
  const normalized = (cohorts.data || []).map((row: any) => normalizeCohort(row, { participants: participants.data || [], checklist: checklist.data || [] }))
  return {
    cohorts: normalized,
    programs: (programs.data || []).map((program: any) => ({ ...program, title: program.title || program.program_name || 'Untitled program' })),
    trainers: trainers.data || [],
    approvedEnrollments,
    stats: {
      totalCohorts: normalized.length,
      activeCohorts: normalized.filter((x) => x.status === 'active' || x.status === 'open').length,
      availableSeats: normalized.reduce((s, x) => s + Math.max(0, Number(x.capacity || 0) - (x.participants?.length || 0)), 0),
      totalParticipants: normalized.reduce((s, x) => s + (x.participants?.length || 0), 0),
    },
  }
}

export async function getAcademyCohortById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('academy_cohorts').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  const [participants, checklist] = await Promise.all([
    supabase.from('academy_cohort_participants').select('*').eq('cohort_id', id),
    supabase.from('academy_cohort_checklist').select('*').eq('cohort_id', id).order('sort_order', { ascending: true }),
  ])
  return normalizeCohort(data, { participants: participants.data || [], checklist: checklist.data || [] })
}

export async function createAcademyCohort(input: AcademyCohortPayload, userId?: string | null) {
  const supabase = await createClient()
  const actorId = safeUuid(userId)
  const payload = { ...normalizePayload(input), updated_at: new Date().toISOString(), created_by: actorId, updated_by: actorId }
  if (!payload.title) throw new Error('Cohort title is required')
  const { data, error } = await supabase.from('academy_cohorts').insert(payload).select('id').single()
  if (error) throw new Error(error.message)
  await replaceChildren(supabase, data.id, input, userId)
  return getAcademyCohortById(data.id)
}

export async function updateAcademyCohort(id: string, input: AcademyCohortPayload, userId?: string | null) {
  const supabase = await createClient()
  const payload = { ...normalizePayload(input), updated_at: new Date().toISOString(), updated_by: safeUuid(userId) }
  const { error } = await supabase.from('academy_cohorts').update(payload).eq('id', id)
  if (error) throw new Error(error.message)
  await replaceChildren(supabase, id, input, userId)
  return getAcademyCohortById(id)
}
