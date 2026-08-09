export interface AuditEventInput {
  actorId?: string;
  entityTable: string;
  entityId: string;
  action: string;
  payload?: Record<string, unknown>;
}

export async function recordContentCommandAuditEvent(_input: AuditEventInput): Promise<void> {
  // Wire this to market_content_audit_log after Supabase schema exists.
  // This must remain server-side in production.
}