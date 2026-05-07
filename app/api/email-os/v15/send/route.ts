import { NextResponse } from 'next/server';
import { adapterFor } from '@/lib/email-os/v15/providers';
import { createQueueJob } from '@/lib/email-os/v15/store';
import { writeAuditLog } from '@/lib/email-os/v15/audit';

export async function POST(req: Request) {
  const body = await req.json();
  const provider = body.provider || 'smtp_imap';
  const adapter = adapterFor(provider);
  const sendResult = await adapter.sendDraft(body.draft);
  const queueResult = sendResult.status === 'blocked'
    ? await createQueueJob('send_blocked_waiting_credentials', { provider, draftId: body.draft?.id, reason: sendResult.blockedReason })
    : await createQueueJob('send_email', { provider, draftId: body.draft?.id });
  await writeAuditLog({ actor: body.actor || 'current-user', action: 'draft.send.request', targetType: 'draft', targetId: body.draft?.id, result: sendResult.status, details: { sendResult, queueResult } });
  return NextResponse.json({ sendResult, queueResult });
}
