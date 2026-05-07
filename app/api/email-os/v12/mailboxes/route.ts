import { audit, blockerResponse, getSupabaseAdmin } from '@/lib/email-os/v12/server';

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return blockerResponse();
  const body = await req.json();
  const action = body.action || 'create';
  if (action === 'delete') {
    if (!body.id) return Response.json({ error: 'id is required' }, { status: 400 });
    const { error } = await supabase.from('email_os_mailboxes').delete().eq('id', body.id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    await audit('delete_mailbox', 'mailbox', body.id, 'completed');
    return Response.json({ ok: true });
  }
  if (action === 'update') {
    if (!body.id) return Response.json({ error: 'id is required' }, { status: 400 });
    const update = { name: body.name, address: body.address, department: body.department, owner: body.owner, provider: body.provider, status: body.status, restricted: Boolean(body.restricted), signature: body.signature || null, routing_rule: body.routingRule || null, updated_at: new Date().toISOString() };
    const { data, error } = await supabase.from('email_os_mailboxes').update(update).eq('id', body.id).select('*').single();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    await audit('update_mailbox', 'mailbox', body.id, 'completed');
    return Response.json({ mailbox: data });
  }
  if (!body.name || !body.address) return Response.json({ error: 'name and address are required' }, { status: 400 });
  const row = { name: body.name, address: body.address, department: body.department || 'General', owner: body.owner || 'Unassigned', provider: body.provider || 'smtp_imap', status: body.status || 'needs_setup', inbound_count: 0, outbound_count: 0, unresolved_count: 0, sla_risk_count: 0, restricted: Boolean(body.restricted), signature: body.signature || null, routing_rule: body.routingRule || null };
  const { data, error } = await supabase.from('email_os_mailboxes').insert(row).select('*').single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  await audit('create_mailbox', 'mailbox', data.id, 'completed');
  return Response.json({ mailbox: data });
}
