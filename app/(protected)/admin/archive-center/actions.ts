'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function restoreArchivedRecord(formData: FormData) {
  const table = String(formData.get('table') || '')
  const recordId = Number(formData.get('record_id'))

  if (!table) {
    throw new Error('Table manquante')
  }

  if (!recordId) {
    throw new Error('Record ID manquant')
  }

  const allowedTables = ['missions', 'caregivers', 'leads', 'families', 'incidents']

  if (!allowedTables.includes(table)) {
    throw new Error('Table non autorisée')
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from(table)
    .update({
      is_archived: false,
      archived_at: null,
    })
    .eq('id', recordId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/archive-center')
  revalidatePath('/missions')
  revalidatePath('/caregivers')
  revalidatePath('/leads')
  revalidatePath('/families')
  revalidatePath('/incidents')
}