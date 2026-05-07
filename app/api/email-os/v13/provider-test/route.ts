import { NextRequest, NextResponse } from 'next/server';
import { getEmailOsSnapshot, logEmailAudit } from '@/lib/email-os/v13/store';
import { testMailboxProvider } from '@/lib/email-os/v13/providers';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  const { mailboxId } = await req.json();
  const s = await getEmailOsSnapshot();
  const mailbox = s.mailboxes.find(m => m.id === mailboxId) || s.mailboxes[0];
  const result = await testMailboxProvider(mailbox);
  await logEmailAudit('Email OS', 'Provider test', 'mailbox', mailbox.id, result.ok ? 'ready' : 'missing_credentials', { missingEnv: result.missingEnv });
  return NextResponse.json(result);
}
