'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

function s(formData: FormData, key: string, fallback = ''): string {
  const out = String(formData.get(key) || '').trim()
  return out || fallback
}

export async function createAutomationTrigger(formData: FormData) {
  const supabase = await createClient()
  const payload = {
    title: s(formData, 'title'),
    module_key: s(formData, 'module_key', 'global'),
    trigger_type: s(formData, 'trigger_type', 'manual'),
    condition_label: s(formData, 'condition_label', 'manual review'),
    action_label: s(formData, 'action_label', 'create briefing'),
    status: s(formData, 'status', 'active'),
    route: s(formData, 'route', '/automation-command'),
  }
  const { error } = await supabase.from('opsos_automation_triggers').insert([payload])
  if (error) throw new Error(error.message)
  await supabase.from('opsos_automation_runs').insert([{ trigger_title: payload.title, status: 'created', summary: `Trigger created for ${payload.module_key}` }])
  revalidatePath('/automation-command')
  revalidatePath('/automation-command/triggers')
}

export async function createAutomationBriefing(formData: FormData) {
  const supabase = await createClient()
  const payload = {
    title: s(formData, 'title'),
    module_key: s(formData, 'module_key', 'global'),
    severity: s(formData, 'severity', 'medium'),
    summary: s(formData, 'summary'),
    recommendation: s(formData, 'recommendation'),
    route: s(formData, 'route', '/executive-cockpit'),
    status: 'open',
  }
  const { error } = await supabase.from('opsos_intelligence_briefings').insert([payload])
  if (error) throw new Error(error.message)
  revalidatePath('/automation-command')
  revalidatePath('/automation-command/briefings')
}
