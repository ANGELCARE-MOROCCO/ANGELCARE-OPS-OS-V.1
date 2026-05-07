import { NextResponse } from 'next/server';
import { adapterFor } from '@/lib/email-os/v15/providers';
import { createQueueJob } from '@/lib/email-os/v15/store';
import { writeAuditLog } from '@/lib/email-os/v15/audit';

export async function POST(req: Request) {
  const body = await req.json();
  const adapter = adapterFor(body.provider || 'smtp_imap');
  const result = await adapter.syncMailbox(body.mailboxAddress || 'unknown');
  const queue = await createQueueJob(result.status === 'blocked' ? 'sync_blocked_waiting_credentials' : 'sync_mailbox', { mailboxAddress: body.mailboxAddress, provider: adapter.kind, result });
  await writeAuditLog({ actor: body.actor || 'current-user', action: 'mailbox.sync.request', targetType: 'mailbox', targetId: body.mailboxAddress, result: result.status, details: { result, queue } });
  return NextResponse.json({ result, queue });
}
