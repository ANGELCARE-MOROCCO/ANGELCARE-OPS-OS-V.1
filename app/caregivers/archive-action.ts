'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function archiveCaregiver(formData: FormData) {
  const caregiverId = Number(formData.get('caregiver_id'))
  const supabase = await createClient()

  const { error } = await supabase
    .from('caregivers')
    .update({ is_archived: true })
    .eq('id', caregiverId)

  if (error) {
    throw new Error(error.message)
  }

  redirect('/caregivers')
}