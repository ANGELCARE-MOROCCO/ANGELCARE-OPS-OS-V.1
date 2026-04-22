'use server'

import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'

export async function createCheckin(formData: FormData) {
  const supabase = await createClient()

  const caregiver_id = Number(formData.get('caregiver_id') || 0)
  const mission_id_raw = String(formData.get('mission_id') || '')
  const city = String(formData.get('city') || '')
  const zone = String(formData.get('zone') || '')
  const event_type = String(formData.get('event_type') || '')
  const notes = String(formData.get('notes') || '')

  const mission_id = mission_id_raw ? Number(mission_id_raw) : null

  if (!caregiver_id || !city || !zone || !event_type) {
    throw new Error('Champs obligatoires manquants')
  }

  const { error } = await supabase.from('caregiver_checkins').insert([
    {
      caregiver_id,
      mission_id,
      city,
      zone,
      event_type,
      notes,
    },
  ])

  if (error) {
    throw new Error(error.message)
  }

  redirect('/pointage')
}
