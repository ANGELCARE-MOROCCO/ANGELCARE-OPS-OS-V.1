'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createHrAction(formData: FormData) {
  const supabase = await createClient()
  const module = String(formData.get('module') || 'hr-os')
  const payload = {
    module,
    title: String(formData.get('title') || '').trim(),
    owner: String(formData.get('owner') || '').trim(),
    priority: String(formData.get('priority') || 'medium'),
    status: String(formData.get('status') || 'open'),
    notes: String(formData.get('notes') || '').trim(),
    due_at: String(formData.get('due_at') || '') || null,
  }
  if (!payload.title) return
  await supabase.from('hr_os_actions').insert(payload)
  revalidatePath('/hr-os')
  revalidatePath(`/hr-os/${module}`)
}

export async function updateHrActionStatus(formData: FormData) {
  const supabase = await createClient()
  const id = String(formData.get('id') || '')
  const status = String(formData.get('status') || 'open')
  const module = String(formData.get('module') || 'hr-os')
  if (!id) return
  await supabase.from('hr_os_actions').update({ status }).eq('id', id)
  revalidatePath('/hr-os')
  revalidatePath(`/hr-os/${module}`)
}
