import { audit, blockerResponse, getSupabaseAdmin } from '@/lib/email-os/v12/server';

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return blockerResponse();
  const body = await req.json();
  const row = { id: 'email-os-config-main', provider_mode: body.providerMode || body.provider_mode || 'mixed', default_sla_minutes: Number(body.defaultSlaMinutes || body.default_sla_minutes || 240), retry_limit: Number(body.retryLimit || body.retry_limit || 3), audit_retention_days: Number(body.auditRetentionDays || body.audit_retention_days || 365), approval_policy: String(body.approvalPolicy || body.approval_policy || ''), routing_enabled: Boolean(body.routingEnabled ?? body.routing_enabled ?? true), updated_at: new Date().toISOString() };
  const { data, error } = await supabase.from('email_os_configuration').upsert(row).select('*').single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  await audit('save_configuration', 'configuration', row.id, 'completed');
  return Response.json({ configuration: data });
}
