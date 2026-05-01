'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createHrRealtimeAlert(formData: FormData) {
  const supabase = await createClient()

  const payload = {
    source: String(formData.get('source') || 'hr-os'),
    title: String(formData.get('title') || '').trim(),
    message: String(formData.get('message') || '').trim(),
    severity: String(formData.get('severity') || 'normal'),
    channel: String(formData.get('channel') || 'internal'),
    status: String(formData.get('status') || 'queued'),
    target_route: String(formData.get('target_route') || '/hr-os'),
  }

  if (!payload.title) return

  await supabase.from('hr_os_realtime_alerts').insert(payload)
  revalidatePath('/hr-os/realtime')
}

export async function updateHrRealtimeAlertStatus(formData: FormData) {
  const supabase = await createClient()
  const id = String(formData.get('id') || '')
  const status = String(formData.get('status') || 'acknowledged')
  if (!id) return

  await supabase.from('hr_os_realtime_alerts').update({ status }).eq('id', id)
  revalidatePath('/hr-os/realtime')
}
