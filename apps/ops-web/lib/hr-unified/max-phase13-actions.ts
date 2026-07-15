'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

function s(formData: FormData, key: string, fallback = ''): string {
  return String(formData.get(key) || fallback)
}

export async function createHRLaunchCheckPhase13(formData: FormData) {
  const supabase = await createClient()
  const payload = {
    title: s(formData, 'title'),
    area: s(formData, 'area', 'general'),
    priority: s(formData, 'priority', 'medium'),
    status: s(formData, 'status', 'open'),
    owner: s(formData, 'owner'),
    evidence: s(formData, 'evidence'),
    notes: s(formData, 'notes'),
  }
  const { error } = await supabase.from('hr_launch_checks').insert([payload])
  if (error) throw new Error(error.message)
  revalidatePath('/hr/launch-center')
}

export async function updateHRLaunchCheckPhase13(formData: FormData) {
  const supabase = await createClient()
  const id = s(formData, 'id')
  const status = s(formData, 'status', 'ready')
  const { error } = await supabase.from('hr_launch_checks').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/hr/launch-center')
}

export async function createHRAdoptionItemPhase13(formData: FormData) {
  const supabase = await createClient()
  const payload = {
    title: s(formData, 'title'),
    audience: s(formData, 'audience', 'hr'),
    adoption_stage: s(formData, 'adoption_stage', 'planned'),
    status: s(formData, 'status', 'open'),
    success_metric: s(formData, 'success_metric'),
    notes: s(formData, 'notes'),
  }
  const { error } = await supabase.from('hr_adoption_tracker').insert([payload])
  if (error) throw new Error(error.message)
  revalidatePath('/hr/adoption-tracker')
}
