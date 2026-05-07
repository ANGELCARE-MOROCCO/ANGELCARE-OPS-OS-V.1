import { db } from './supabase';
export async function auditEmailAction(input: {
  action: string;
  actor_user_id?: string | null;
  account_id?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  details?: Record<string, unknown>;
}) {
  const supabase = await db();
  await supabase.from('email_audit_logs').insert({
    action: input.action,
    actor_user_id: input.actor_user_id || null,
    account_id: input.account_id || null,
    entity_type: input.entity_type || null,
    entity_id: input.entity_id || null,
    details: input.details || {},
  });
}
