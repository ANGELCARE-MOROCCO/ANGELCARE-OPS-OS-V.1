import { mailboxIdFromEmail, resolveEmailOSMailboxIdentity } from '@/lib/email-os-core/multi-mailbox-resolver'
import { sendEmailOSDirect } from '@/lib/email-os-core/send-mail'
import { recordOutboundEmailCommand } from '@/lib/angelcare360/email/correspondence-ledger'
import type { Angelcare360EmailDraft, Angelcare360EmailSendResult } from '@/types/angelcare360/email'
import { renderAngelcare360BrandedEmail } from '@/lib/angelcare360/branding/email-template'
import { assertExternalSideEffectAllowed } from '@/lib/sanila-demo/safety'

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
  const metadata = draft.metadata || {}
  const safety = await assertExternalSideEffectAllowed({ channel: 'email', operation: 'email.send', tenantId: typeof metadata.tenantId === 'string' ? metadata.tenantId : null, schoolId: typeof metadata.schoolId === 'string' ? metadata.schoolId : null, metadata: { recipient_domain: String(draft.toEmail).split('@')[1] || null } })
  if (!safety.allowed) return { ok: true, locked: true, mailbox, provider: 'email-os', emailId: `demo-simulated:${safety.context.configId}`, reason: `${safety.code} · SIMULATED / DEMO SAFE` }
  try {
    const branded = await renderAngelcare360BrandedEmail({ subject: draft.subject, body: draft.body, bodyHtml: draft.bodyHtml, clientId: typeof metadata.clientId === 'string' ? metadata.clientId : null, tenantId: typeof metadata.tenantId === 'string' ? metadata.tenantId : null })
    const result = await sendEmailOSDirect({
      mailboxId: mailboxIdFromEmail(mailbox),
      fromEmail: mailbox,
      toEmail: draft.toEmail,
      subject: draft.subject,
      body: draft.body,
      bodyHtml: branded.html,
      bodyText: draft.body,
      fromDisplayName: branded.runtime?.emailFromName || undefined,
      headers: draft.replyTo ? { 'Reply-To': draft.replyTo } : undefined,
    })

    await recordOutboundEmailCommand({
      mailboxKey: String(metadata.mailboxKey || 'B2B'),
      mailboxEmail: mailbox,
      providerMessageId: result?.info?.messageId || null,
      toEmail: draft.toEmail,
      subject: draft.subject,
      bodyText: draft.body,
      status: 'smtp_accepted',
      deliveryState: 'smtp_accepted',
      templateCode: draft.templateKey,
      clientId: typeof metadata.clientId === 'string' ? metadata.clientId : null,
      contactId: typeof metadata.contactId === 'string' ? metadata.contactId : null,
      institutionId: typeof metadata.institutionId === 'string' ? metadata.institutionId : null,
      tenantId: typeof metadata.tenantId === 'string' ? metadata.tenantId : null,
      relatedEntityType: typeof metadata.entityType === 'string' ? metadata.entityType : null,
      relatedEntityId: typeof metadata.entityId === 'string' ? metadata.entityId : null,
      metadata,
    })

    return {
      ok: true,
      mailbox,
      provider: 'email-os',
      emailId: result?.info?.messageId || null,
    }
  } catch (error) {
    const metadata = draft.metadata || {}
    await recordOutboundEmailCommand({
      mailboxKey: String(metadata.mailboxKey || 'B2B'),
      mailboxEmail: mailbox,
      toEmail: draft.toEmail,
      subject: draft.subject,
      bodyText: draft.body,
      status: 'failed',
      deliveryState: 'failed',
      templateCode: draft.templateKey,
      clientId: typeof metadata.clientId === 'string' ? metadata.clientId : null,
      contactId: typeof metadata.contactId === 'string' ? metadata.contactId : null,
      institutionId: typeof metadata.institutionId === 'string' ? metadata.institutionId : null,
      tenantId: typeof metadata.tenantId === 'string' ? metadata.tenantId : null,
      relatedEntityType: typeof metadata.entityType === 'string' ? metadata.entityType : null,
      relatedEntityId: typeof metadata.entityId === 'string' ? metadata.entityId : null,
      metadata: { ...metadata, error: normalizeEmailError(error) },
    })
    return {
      ok: false,
      mailbox,
      provider: 'email-os',
      error: normalizeEmailError(error),
    }
  }
}
