import { createContentCommandSupabaseServerClient } from '../db/supabase-server';

export async function recordContentCommandAudit(input: {
  actorId?: string;
  entityTable: string;
  entityId: string;
  action: string;
  payload?: Record<string, unknown>;
}) {
  const supabase = createContentCommandSupabaseServerClient();

  const { error } = await supabase.from('market_content_audit_log').insert({
    actor_id: input.actorId ?? null,
    entity_table: input.entityTable,
    entity_id: input.entityId,
    action: input.action,
    payload: input.payload ?? {},
  });

  if (error) throw new Error(`Audit write failed: ${error.message}`);
}