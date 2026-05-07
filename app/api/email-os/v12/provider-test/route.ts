import { audit, blockerResponse, getProviderState, getSupabaseAdmin } from '@/lib/email-os/v12/server';

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return blockerResponse();
  const body = await req.json();
  const provider = getProviderState();
  if (!provider.providerReady) {
    await audit('provider_test', 'mailbox', body.mailboxId || null, 'blocked', { blockers: provider.blockers });
    return Response.json({ ok: false, blockers: provider.blockers }, { status: 409 });
  }
  await audit('provider_test', 'mailbox', body.mailboxId || null, 'ready');
  return Response.json({ ok: true, message: 'Provider env exists. Implement live adapter handshake for your provider.' });
}
