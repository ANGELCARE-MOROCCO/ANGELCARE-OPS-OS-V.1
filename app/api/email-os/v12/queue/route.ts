import { audit, blockerResponse, getSupabaseAdmin } from '@/lib/email-os/v12/server';

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return blockerResponse();
  const body = await req.json();
  const jobIds: string[] = body.jobIds || (body.jobId ? [body.jobId] : []);
  const action = body.action || 'retry';
  if (!jobIds.length) return Response.json({ error: 'jobIds is required' }, { status: 400 });
  const update = action === 'pause' ? { state: 'paused' } : action === 'complete' ? { state: 'completed' } : { state: 'queued', last_error: null };
  const { error } = await supabase.from('email_os_queue').update({ ...update, updated_at: new Date().toISOString() }).in('id', jobIds);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  await audit('queue_' + action, 'queue', jobIds.join(','), 'completed');
  return Response.json({ ok: true });
}
