
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAccess } from '@/lib/auth/requireAccess'
import { ACADEMY_MODULES, getAcademyModule, type AcademyModuleKey } from './_lib/config'

function clean(value: FormDataEntryValue | null) {
  const text = String(value || '').trim()
  return text.length ? text : null
}

function normalizeNumber(value: FormDataEntryValue | null) {
  const text = clean(value)
  if (!text) return null
  const n = Number(text)
  return Number.isFinite(n) ? n : null
}

function normalizeDateTime(value: FormDataEntryValue | null) {
  const text = clean(value)
  if (!text) return null
  const d = new Date(text)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

function certificateHash(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return `ACAD-${hash.toString(16).toUpperCase().padStart(8, '0')}`
}

export async function createAcademyRecord(formData: FormData) {
  await requireAccess('academy.view')
  const moduleKey = String(formData.get('moduleKey') || '') as AcademyModuleKey
  const module = getAcademyModule(moduleKey)
  const supabase = await createClient()
  const now = new Date().toISOString()

  let payload: Record<string, any> = {}

  for (const field of module.fields) {
    if (field.type === 'number') payload[field.name] = normalizeNumber(formData.get(field.name))
    else if (field.type === 'datetime-local') payload[field.name] = normalizeDateTime(formData.get(field.name))
    else payload[field.name] = clean(formData.get(field.name))
  }

  if (module.key === 'trainees' || module.key === 'eligibility') {
    payload.serial_number = payload.serial_number || `ACAD-TR-${Date.now()}`
    payload.status = payload.status || (module.key === 'eligibility' ? 'candidate' : 'prospect')
  }

  if (module.key === 'certificates') {
    payload.certificate_number = payload.certificate_number || `AC-CERT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`
    payload.verification_hash = payload.verification_hash || certificateHash(`${payload.certificate_number}-${payload.trainee_id || 'trainee'}-${now}`)
  }

  if (module.key === 'calendar') {
    payload = {
      group_id: payload.group_id,
      title: payload.title,
      starts_at: payload.starts_at,
      ends_at: payload.ends_at,
      status: payload.status || 'planned',
      notes: payload.notes,
    }
  }

  const { error } = await supabase.from(module.table).insert(payload)
  if (error) throw new Error(error.message)

  revalidatePath('/academy')
  revalidatePath(`/academy/${module.key}`)
}

export async function updateAcademyStatus(formData: FormData) {
  await requireAccess('academy.view')
  const moduleKey = String(formData.get('moduleKey') || '') as AcademyModuleKey
  const id = clean(formData.get('id'))
  const status = clean(formData.get('status'))
  if (!id || !status) return
  const module = getAcademyModule(moduleKey)
  const supabase = await createClient()
  const { error } = await supabase.from(module.table).update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/academy')
  revalidatePath(`/academy/${module.key}`)
}

export async function createAcademyAlert(formData: FormData) {
  await requireAccess('academy.view')
  const supabase = await createClient()
  const title = clean(formData.get('title'))
  if (!title) throw new Error('Alert title is required')
  const { error } = await supabase.from('academy_alerts').insert({
    title,
    message: clean(formData.get('message')),
    severity: clean(formData.get('severity')) || 'normal',
    status: 'open',
    due_at: normalizeDateTime(formData.get('due_at')),
  })
  if (error) throw new Error(error.message)
  revalidatePath('/academy')
}

export async function seedAcademyDemoData() {
  await requireAccess('academy.view')
  const supabase = await createClient()
  const serial = `ACAD-SEED-${Date.now()}`
  await supabase.from('academy_trainees').insert({ serial_number: serial, full_name: 'Demo Trainee AngelCare', city: 'Rabat', source: 'Academy Event', status: 'candidate', eligibility_status: 'prequalified', notes: 'Seed file for validating Academy V3 flows.' })
  await supabase.from('academy_courses').insert({ title: 'Elite Childcare Foundations', category: 'Childcare', level: 'foundation', duration_hours: 24, price: 2500, status: 'active', description: 'Operational baseline for AngelCare Academy childcare missions.' })
  await supabase.from('academy_alerts').insert({ title: 'Validate Academy V3 data model', message: 'Confirm trainees, groups, payments, attendance and certificates are active.', severity: 'high', status: 'open' })
  revalidatePath('/academy')
}
