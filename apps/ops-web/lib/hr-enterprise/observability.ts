import { createClient } from '@/lib/supabase/server'
export async function recordHRSignal(eventName: string, payload: any = {}, severity = 'info') {
  const supabase = await createClient()
  await supabase.from('hr_observability_events').insert({ event_name: eventName, payload, severity, source: 'hr_enterprise' })
}
