'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function archiveFamily(formData: FormData) {
  const familyId = Number(formData.get('family_id'))
  const supabase = await createClient()

  if (!familyId) {
    throw new Error('Family ID manquant')
  }

  const { error } = await supabase
    .from('families')
    .update({
      is_archived: true,
      archived_at: new Date().toISOString(),
    })
    .eq('id', familyId)

  if (error) {
    throw new Error(error.message)
  }

  redirect('/families')
}