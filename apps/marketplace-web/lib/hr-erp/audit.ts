import { createClient } from '@/lib/supabase/server'
export async function writeHRAudit(action: string, input: { entityType?: string; entityId?: string; actorId?: string; before?: any; after?: any; payload?: any } = {}) {
  const supabase = await createClient()
  await supabase.from('hr_audit_log').insert({
    action, entity_type: input.entityType || null, entity_id: input.entityId || null, actor_id: input.actorId || null,
    before: input.before || null, after: input.after || null, payload: input.payload || {}, created_at: new Date().toISOString()
  })
}
