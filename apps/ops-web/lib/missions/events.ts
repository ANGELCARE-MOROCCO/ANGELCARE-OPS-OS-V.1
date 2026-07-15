import { createClient } from '@/lib/supabase/server'

export async function recordMissionEvent(args: {
  missionId: number
  eventType: string
  content: string
  metadata?: Record<string, unknown>
  source?: string
  createdBy?: string | null
}) {
  const supabase = await createClient()
  const row = {
    mission_id: args.missionId,
    event_type: args.eventType,
    content: args.content,
    metadata: args.metadata || {},
    source: args.source || 'missions_engine',
    created_by: args.createdBy || null,
  }
  const { error } = await supabase.from('mission_events').insert([row])
  if (error) throw new Error(error.message)
  return row
}
