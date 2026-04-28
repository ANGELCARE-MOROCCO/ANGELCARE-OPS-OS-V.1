'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createMission(formData: FormData) {
  const supabase = await createClient()

  const family_id_raw = String(formData.get('family_id') || '')
  const caregiver_id_raw = String(formData.get('caregiver_id') || '')
  const service_type = String(formData.get('service_type') || '')
  const mission_date = String(formData.get('mission_date') || '')
  const start_time = String(formData.get('start_time') || '')
  const end_time = String(formData.get('end_time') || '')
  const status = String(formData.get('status') || 'draft')
  const urgency = String(formData.get('urgency') || 'normal')
  const city = String(formData.get('city') || '')
  const zone = String(formData.get('zone') || '')
  const notes = String(formData.get('notes') || '')

  const family_id = family_id_raw ? Number(family_id_raw) : null
  const caregiver_id = caregiver_id_raw ? Number(caregiver_id_raw) : null

  if (!service_type || !mission_date) {
    throw new Error('Service et date sont obligatoires')
  }

  const { error } = await supabase.from('missions').insert([
    {
      family_id,
      caregiver_id,
      service_type,
      mission_date,
      start_time: start_time || null,
      end_time: end_time || null,
      status,
      urgency,
      city: city || null,
      zone: zone || null,
      notes,
    },
  ])

  if (error) {
    throw new Error(error.message)
  }

  redirect('/missions')
}
