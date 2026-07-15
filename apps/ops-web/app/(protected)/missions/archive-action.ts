'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function archiveMission(formData: FormData) {
  const supabase = await createClient()

  const missionId = Number(formData.get('mission_id'))
  if (!missionId) throw new Error('Mission ID manquant')

  const { error } = await supabase
    .from('missions')
    .update({
      is_archived: true,
      archived_at: new Date().toISOString(),
    })
    .eq('id', missionId)

  if (error) throw new Error(error.message)

  redirect('/missions')
}