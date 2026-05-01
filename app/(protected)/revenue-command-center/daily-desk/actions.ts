'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'

function clean(value: FormDataEntryValue | null) {
  const text = String(value || '').trim()
  return text.length ? text : null
}

export async function saveDailyFocus(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user?.id) throw new Error('User session missing.')

  const focus = clean(formData.get('focus'))
  const blocker = clean(formData.get('blocker'))
  const managerNote = clean(formData.get('manager_note'))
  const today = new Date().toISOString().slice(0, 10)

  const { data: existing } = await supabase.from('bd_agent_daily_notes').select('id').eq('user_id', user.id).eq('note_date', today).maybeSingle()

  if (existing?.id) {
    const { error } = await supabase.from('bd_agent_daily_notes').update({ focus, blocker, manager_note: managerNote, updated_at: new Date().toISOString() }).eq('id', existing.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase.from('bd_agent_daily_notes').insert({ user_id: user.id, note_date: today, focus, blocker, manager_note: managerNote })
    if (error) throw new Error(error.message)
  }

  await supabase.from('bd_activity_logs').insert({ entity_type: 'agent_daily_desk', entity_id: user.id, action: 'daily_focus_saved', note: focus, actor_user_id: user.id })
  revalidatePath('/revenue-command-center/daily-desk')
}

export async function submitAgentCheckin(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user?.id) throw new Error('User session missing.')

  const checkinType = clean(formData.get('checkin_type')) || 'daily_start'
  const mood = clean(formData.get('mood'))
  const workloadLevel = clean(formData.get('workload_level'))
  const note = clean(formData.get('note'))

  const { error } = await supabase.from('bd_agent_checkins').insert({ user_id: user.id, checkin_type: checkinType, mood, workload_level: workloadLevel, note })
  if (error) throw new Error(error.message)

  await supabase.from('bd_activity_logs').insert({ entity_type: 'agent_daily_desk', entity_id: user.id, action: 'agent_checkin_submitted', note, actor_user_id: user.id, metadata: { mood, workload_level: workloadLevel, checkin_type: checkinType } })
  revalidatePath('/revenue-command-center/daily-desk')
}
