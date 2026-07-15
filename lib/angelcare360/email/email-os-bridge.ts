import { mailboxIdFromEmail, resolveEmailOSMailboxIdentity } from '@/lib/email-os-core/multi-mailbox-resolver'
import { sendEmailOSDirect } from '@/lib/email-os-core/send-mail'
import type { Angelcare360EmailDraft, Angelcare360EmailSendResult } from '@/types/angelcare360/email'

const B2B_EMAIL = 'b2b@angelcarehub.ma'

export function getAngelcare360B2BMailboxEmail() {
  return String(process.env.B2B_EMAIL || B2B_EMAIL).trim() || B2B_EMAIL
}

export function isAngelcare360EmailBridgeAvailable() {
  const email = getAngelcare360B2BMailboxEmail()
  const identity = resolveEmailOSMailboxIdentity({ fromEmail: email, mailboxId: mailboxIdFromEmail(email) })
  return Boolean(identity && identity.smtp && identity.smtp.host && identity.smtp.port && identity.smtp.user && identity.smtp.pass)
}

function normalizeEmailError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || 'Envoi email impossible.')
  if (/smtp is not configured/i.test(message)) {
    return 'Boîte email B2B verrouillée : identifiants SMTP manquants.'
  }
  if (/recipient is required/i.test(message)) {
    return 'Le destinataire est requis.'
  }
  return 'Envoi email impossible pour le moment.'
}

export async function sendAngelcare360Email(draft: Angelcare360EmailDraft): Promise<Angelcare360EmailSendResult> {
  const mailbox = getAngelcare360B2BMailboxEmail()
  try {
    const result = await sendEmailOSDirect({
      mailboxId: mailboxIdFromEmail(mailbox),
      fromEmail: mailbox,
      toEmail: draft.toEmail,
      subject: draft.subject,
      body: draft.body,
      headers: draft.replyTo ? { 'Reply-To': draft.replyTo } : undefined,
    })

    return {
      ok: true,
      mailbox,
      provider: 'email-os',
      emailId: result?.info?.messageId || null,
    }
  } catch (error) {
    return {
      ok: false,
      mailbox,
      provider: 'email-os',
      error: normalizeEmailError(error),
    }
  }
}
