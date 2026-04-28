'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function archiveIncident(formData: FormData) {
  const incidentId = Number(formData.get('incident_id'))
  const supabase = await createClient()

  if (!incidentId) {
    throw new Error('Incident ID manquant')
  }

  const { error } = await supabase
    .from('incidents')
    .update({
      is_archived: true,
      archived_at: new Date().toISOString(),
    })
    .eq('id', incidentId)

  if (error) {
    throw new Error(error.message)
  }

  redirect('/incidents')
}