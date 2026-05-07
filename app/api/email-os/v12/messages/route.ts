import { blockerResponse, getSupabaseAdmin } from '@/lib/email-os/v12/server';

export async function GET(req: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return blockerResponse();
  const threadId = new URL(req.url).searchParams.get('threadId');
  if (!threadId) return Response.json({ error: 'threadId is required' }, { status: 400 });
  const { data, error } = await supabase.from('email_os_messages').select('*').eq('thread_id', threadId).order('created_at', { ascending: true });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ messages: data || [] });
}
