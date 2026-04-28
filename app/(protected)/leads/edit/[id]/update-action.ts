'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function updateLead(formData: FormData) {
  const supabase = await createClient()

  const id = Number(formData.get('id'))
  if (!id) throw new Error('Lead ID manquant')

  const parent_name = String(formData.get('parent_name') || '')
  const phone = String(formData.get('phone') || '')
  const city = String(formData.get('city') || '')
  const source = String(formData.get('source') || '')
  const urgency = String(formData.get('urgency') || 'normal')
  const status = String(formData.get('status') || 'new')
  const children_count = Number(formData.get('children_count') || 0)
  const children_ages = String(formData.get('children_ages') || '')
  const preferred_schedule = String(formData.get('preferred_schedule') || '')
  const service_needed = String(formData.get('service_needed') || '')
  const special_needs = String(formData.get('special_needs') || '')
  const timeline_note = String(formData.get('timeline_note') || '')

  const service_interests = formData
    .getAll('service_interests')
    .map((value) => String(value))
    .filter(Boolean)

  const { error } = await supabase
    .from('leads')
    .update({
      parent_name,
      phone,
      city,
      source,
      urgency,
      status,
      children_count,
      children_ages,
      preferred_schedule,
      service_needed,
      special_needs,
      timeline_note,
      service_interests,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  redirect(`/leads/${id}`)
}