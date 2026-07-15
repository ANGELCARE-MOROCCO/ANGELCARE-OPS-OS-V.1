import { createClient } from '@/lib/supabase/server'

export type AcademySyncEvent = {
  event_key: string
  entity: string
  entity_id?: string | null
  target_modules?: string[]
  title?: string | null
  note?: string | null
  value_mad?: number
  priority?: string
  risk_level?: string
  due_at?: string | null
  payload?: Record<string, any>
}

export async function academyProductionSync(event: AcademySyncEvent) {
  const supabase = await createClient()
  const targetModules = event.target_modules?.length ? event.target_modules : ['market-os', 'revenue-command-center', 'email-os', 'hr', 'service-os']
  await supabase.from('academy_command_records').insert({
    module_key: 'academy',
    page_key: event.entity,
    record_type: event.event_key,
    title: event.title || event.event_key.replaceAll('_', ' '),
    description: event.note || null,
    department: 'Academy',
    status: 'open',
    priority: event.priority || 'medium',
    risk_level: event.risk_level || 'low',
    value_mad: Number(event.value_mad || 0),
    due_at: event.due_at || null,
    next_action: event.payload?.next_action || 'Review and execute from Academy Command Center',
    stage: 'queued',
    source_entity: event.entity,
    source_entity_id: event.entity_id || null,
    metadata: { ...event.payload, synced_by: 'academyProductionSync' },
  })
  await supabase.from('academy_notification_queue').insert({
    channel: event.payload?.channel || 'internal',
    recipient: event.payload?.recipient || null,
    subject: event.title || `Academy ${event.event_key}`,
    body: event.note || 'Academy production event queued.',
    entity: event.entity,
    entity_id: event.entity_id || null,
    status: 'queued',
    metadata: { event_key: event.event_key, target_modules: targetModules, payload: event.payload || {} },
  })
  await supabase.from('academy_integration_events').insert(targetModules.map((target_module: any) => ({
    target_module,
    event_key: event.event_key,
    entity: event.entity,
    entity_id: event.entity_id || null,
    status: 'queued',
    payload: event.payload || {},
  })))
}
