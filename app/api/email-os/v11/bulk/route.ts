import { NextResponse } from 'next/server';
import { adminClient } from '../_supabase';

export async function POST(req: Request) {
  const body = await req.json();
  const action = body.action;
  const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
  if (!action || ids.length === 0) return NextResponse.json({ ok: false, error: 'action and ids are required' }, { status: 400 });

  const supabase = adminClient();
  let targetTable = body.table || 'email_threads';
  let patch: Record<string, any> = {};

  if (action === 'archive') patch = { status: 'archived' };
  if (action === 'resolve') patch = { status: 'resolved' };
  if (action === 'flag') patch = { priority: 'high' };
  if (action === 'assign') patch = { assigned_to: body.assigned_to || null };

  const { error } = await supabase.from(targetTable).update(patch).in('id', ids);
  await supabase.from('email_os_v11_command_actions').insert({ action_key: `bulk_${action}`, payload: { ids, table: targetTable, patch }, status: error ? 'failed' : 'completed', result: error ? { error: error.message } : { affected: ids.length } });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, affected: ids.length });
}
