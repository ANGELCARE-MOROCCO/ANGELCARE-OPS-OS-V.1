import { createClient } from '@/lib/supabase/server'
export async function queueHRNotification(input: { title: string; body?: string; severity?: string; audienceRole?: string; userId?: string; payload?: any }) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('hr_notifications').insert({
    title: input.title, body: input.body || null, severity: input.severity || 'info', audience_role: input.audienceRole || null,
    user_id: input.userId || null, payload: input.payload || {}, status: 'queued'
  }).select('*').single()
  if (error) throw new Error(error.message)
  return data
}
