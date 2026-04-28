'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function archiveLead(formData: FormData) {
  const leadId = Number(formData.get('lead_id'))
  const supabase = await createClient()

  if (!leadId) {
    throw new Error('Lead ID manquant')
  }

  const { error } = await supabase
    .from('leads')
    .update({
      is_archived: true,
      archived_at: new Date().toISOString(),
    })
    .eq('id', leadId)

  if (error) {
    throw new Error(error.message)
  }

  redirect('/leads')
}