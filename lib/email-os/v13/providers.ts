import type { EmailDraft, EmailMailbox } from './types';

export type ProviderTestResult = { ok: boolean; provider: string; mailboxId: string; message: string; missingEnv: string[] };

export function getProviderMissingEnv(mailbox: EmailMailbox) {
  if (mailbox.provider === 'google') return ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN'].filter(k => !process.env[k]);
  if (mailbox.provider === 'microsoft') return ['MICROSOFT_TENANT_ID', 'MICROSOFT_CLIENT_ID', 'MICROSOFT_CLIENT_SECRET'].filter(k => !process.env[k]);
  if (mailbox.provider === 'smtp_imap') return ['EMAIL_SMTP_USER', 'EMAIL_SMTP_PASSWORD'].filter(k => !process.env[k]);
  return [];
}

export async function testMailboxProvider(mailbox: EmailMailbox): Promise<ProviderTestResult> {
  const missingEnv = getProviderMissingEnv(mailbox);
  if (missingEnv.length) {
    return { ok: false, provider: mailbox.provider, mailboxId: mailbox.id, missingEnv, message: `Provider ${mailbox.provider} is structurally configured but missing environment credentials.` };
  }
  return { ok: true, provider: mailbox.provider, mailboxId: mailbox.id, missingEnv: [], message: `Provider ${mailbox.provider} credentials are present. Ready for real adapter call.` };
}

export async function sendDraftThroughProvider(mailbox: EmailMailbox, draft: EmailDraft) {
  const missingEnv = getProviderMissingEnv(mailbox);
  if (missingEnv.length) throw new Error(`Cannot send: missing ${missingEnv.join(', ')}`);
  // Safe production boundary: integrate Gmail API, Microsoft Graph or nodemailer here.
  // This function intentionally refuses to silently fake external delivery.
  return { provider: mailbox.provider, mailboxId: mailbox.id, draftId: draft.id, sent: false, boundary: 'Adapter credentials present; external provider call must be enabled by your final security policy.' };
}
