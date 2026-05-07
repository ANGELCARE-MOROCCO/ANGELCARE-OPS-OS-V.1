import { audit, blockerResponse, getSupabaseAdmin } from '@/lib/email-os/v12/server';

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return blockerResponse();
  const body = await req.json();
  const threadIds: string[] = Array.isArray(body.threadIds) ? body.threadIds : body.threadId ? [body.threadId] : [];
  const action = String(body.action || '');
  const value = body.value;
  if (!threadIds.length || !action) return Response.json({ error: 'threadIds and action are required' }, { status: 400 });

  let update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (action === 'assign') update.owner = String(value || 'Operations Lead'), update.status = 'assigned';
  else if (action === 'resolve') update.status = 'resolved';
  else if (action === 'archive') update.status = 'archived';
  else if (action === 'escalate') update.status = 'escalated', update.priority = 'critical';
  else if (action === 'tag') {
    const { data: existing, error } = await supabase.from('email_os_threads').select('id,tags').in('id', threadIds);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    for (const t of existing || []) {
      const tags = Array.from(new Set([...(t.tags || []), String(value || 'reviewed')]));
      await supabase.from('email_os_threads').update({ tags, updated_at: new Date().toISOString() }).eq('id', t.id);
    }
    await audit('tag_thread', 'thread', threadIds.join(','), 'completed', { value });
    return Response.json({ ok: true });
  } else if (action === 'note') {
    for (const id of threadIds) {
      await supabase.from('email_os_messages').insert({
        thread_id: id,
        mailbox_id: body.mailboxId || null,
        direction: 'internal_note',
        from_name: 'Email OS Operator',
        from_email: null,
        to_emails: [],
        cc_emails: [],
        subject: 'Internal note',
        body: String(value || 'Operator note'),
        html_body: null,
        attachments: [],
      });
    }
    await audit('note_thread', 'thread', threadIds.join(','), 'completed', { value });
    return Response.json({ ok: true });
  } else return Response.json({ error: `Unsupported action: ${action}` }, { status: 400 });

  const { error } = await supabase.from('email_os_threads').update(update).in('id', threadIds);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  await audit(action + '_thread', 'thread', threadIds.join(','), 'completed', { value });
  return Response.json({ ok: true });
}
