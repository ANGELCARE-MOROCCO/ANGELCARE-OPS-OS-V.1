import { createClient } from '@/lib/supabase/server'

export async function runAutomation() {
  const supabase = await createClient()

  const { data: prospects } = await supabase.from('bd_prospects').select('*').eq('is_archived', false)
  const now = Date.now()

  for (const p of prospects || []) {
    const last = p.last_interaction_at || p.updated_at || p.created_at
    const hours = last ? (now - new Date(last).getTime()) / 36e5 : 999

    // Rule 1: inactivity > 48h
    if (hours >= 48) {
      await supabase.from('bd_tasks').insert({
        title: 'Follow up inactive prospect',
        description: 'System generated task after inactivity',
        status: 'open',
        priority: 'high',
        related_type: 'prospect',
        related_id: p.id,
        assigned_to: p.owner_id
      })
    }

    // Rule 2: missing next action
    if (!p.next_action && !p.next_action_at) {
      await supabase.from('bd_tasks').insert({
        title: 'Define next action',
        description: 'System detected missing next action',
        status: 'open',
        priority: 'critical',
        related_type: 'prospect',
        related_id: p.id,
        assigned_to: p.owner_id
      })
    }
  }
}
