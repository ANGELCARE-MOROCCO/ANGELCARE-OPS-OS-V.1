import { writeOperatorAuditLog } from './audit'
import { requireAngelcare360OperatorPermission } from './access'
import { getOperatorBillingAccountById, getOperatorInvoiceById, getOperatorPaymentById } from './billing'
import { getOperatorClientById } from './clients'
import {
  buildAngelcare360InvoiceEmailDraft,
  buildAngelcare360OnboardingEmailDraft,
  buildAngelcare360ReceiptEmailDraft,
  buildAngelcare360ReminderEmailDraft,
  buildAngelcare360SupportFollowUpEmailDraft,
} from '@/lib/angelcare360/email/templates'
import { sendAngelcare360Email, getAngelcare360B2BMailboxEmail, isAngelcare360EmailBridgeAvailable } from '@/lib/angelcare360/email/email-os-bridge'
import type { Angelcare360EmailSendResult } from '@/types/angelcare360/email'

function money(value: number | string | null | undefined) {
  return Number(value || 0).toLocaleString('fr-FR')
}

function pickRecipient(primary?: string | null, fallback?: string | null) {
  return String(primary || fallback || '').trim()
}

async function logEmailAction(input: {
  module: string
  action: string
  clientId?: string | null
  tenantId?: string | null
  entityType: string
  entityId?: string | null
  metadata?: Record<string, unknown>
}) {
  await writeOperatorAuditLog({
    module: input.module,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId || null,
    clientId: input.clientId || null,
    tenantId: input.tenantId || null,
    severity: 'notice',
    metadata: {
      ...(input.metadata || {}),
      mailbox: getAngelcare360B2BMailboxEmail(),
      emailBridgeAvailable: isAngelcare360EmailBridgeAvailable(),
    },
  })
}

export async function sendOperatorInvoiceEmail(input: unknown): Promise<Angelcare360EmailSendResult & { record?: Record<string, unknown> | null }> {
  await requireAngelcare360OperatorPermission('operator.billing.update')
  const payload = input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
  const invoiceId = String(payload.id || payload.invoiceId || '').trim()
  if (!invoiceId) {
    return { ok: false, mailbox: getAngelcare360B2BMailboxEmail(), provider: 'email-os', error: 'La facture est requise.' }
  }
  const invoice = await getOperatorInvoiceById(invoiceId)
  if (!invoice) {
    return { ok: false, mailbox: getAngelcare360B2BMailboxEmail(), provider: 'email-os', error: 'La facture est introuvable.' }
  }
  const client = await getOperatorClientById(String(invoice.client_id))
  if (!client) {
    return { ok: false, mailbox: getAngelcare360B2BMailboxEmail(), provider: 'email-os', error: 'Le client est introuvable.' }
  }
  const billingAccount = invoice.billing_account_id ? await getOperatorBillingAccountById(String(invoice.billing_account_id)) : null
  const recipientEmail = pickRecipient(billingAccount?.billing_email || null, client.primary_contact_email || null)
  if (!recipientEmail) {
    return { ok: false, mailbox: getAngelcare360B2BMailboxEmail(), provider: 'email-os', error: 'Aucune adresse email de facturation n’est configurée.' }
  }
  const draft = buildAngelcare360InvoiceEmailDraft({
    clientName: String(client.display_name || client.legal_name || 'Client'),
    recipientEmail,
    invoiceNumber: String(invoice.invoice_number || invoice.id),
    amountMad: money(invoice.total_mad),
    dueDate: String(invoice.due_date || '—'),
    printHref: `/angelcare-360-operator/billing/invoices/${invoice.id}/print`,
  })
  const result = await sendAngelcare360Email(draft)
  await logEmailAction({
    module: 'billing',
    action: result.ok ? 'email.invoice.sent' : 'email.invoice.failed',
    clientId: String(invoice.client_id),
    entityType: 'angelcare360_operator_invoices',
    entityId: String(invoice.id),
    metadata: { templateKey: draft.templateKey, recipientEmail, subject: draft.subject, error: result.error || null },
  })
  return { ...result, record: { invoiceId: invoice.id, recipientEmail } }
}

export async function sendOperatorReceiptEmail(input: unknown): Promise<Angelcare360EmailSendResult & { record?: Record<string, unknown> | null }> {
  await requireAngelcare360OperatorPermission('operator.billing.update')
  const payload = input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
  const paymentId = String(payload.id || payload.paymentId || '').trim()
  if (!paymentId) {
    return { ok: false, mailbox: getAngelcare360B2BMailboxEmail(), provider: 'email-os', error: 'Le paiement est requis.' }
  }
  const payment = await getOperatorPaymentById(paymentId)
  if (!payment) {
    return { ok: false, mailbox: getAngelcare360B2BMailboxEmail(), provider: 'email-os', error: 'Le paiement est introuvable.' }
  }
  const client = await getOperatorClientById(String(payment.client_id))
  if (!client) {
    return { ok: false, mailbox: getAngelcare360B2BMailboxEmail(), provider: 'email-os', error: 'Le client est introuvable.' }
  }
  const linkedInvoice = payment.invoice_id ? await getOperatorInvoiceById(String(payment.invoice_id)) : null
  const billingAccount = linkedInvoice?.billing_account_id ? await getOperatorBillingAccountById(String(linkedInvoice.billing_account_id)) : null
  const recipientEmail = pickRecipient(billingAccount?.billing_email || null, client.primary_contact_email || null)
  if (!recipientEmail) {
    return { ok: false, mailbox: getAngelcare360B2BMailboxEmail(), provider: 'email-os', error: 'Aucune adresse email de facturation n’est configurée.' }
  }
  const draft = buildAngelcare360ReceiptEmailDraft({
    clientName: String(client.display_name || client.legal_name || 'Client'),
    recipientEmail,
    paymentReference: String(payment.payment_reference || payment.id),
    amountMad: money(payment.amount_mad),
    printHref: `/angelcare-360-operator/billing/payments/${payment.id}/receipt-print`,
  })
  const result = await sendAngelcare360Email(draft)
  await logEmailAction({
    module: 'billing',
    action: result.ok ? 'email.receipt.sent' : 'email.receipt.failed',
    clientId: String(payment.client_id),
    entityType: 'angelcare360_operator_payments',
    entityId: String(payment.id),
    metadata: { templateKey: draft.templateKey, recipientEmail, subject: draft.subject, error: result.error || null },
  })
  return { ...result, record: { paymentId: payment.id, recipientEmail } }
}

export async function sendOperatorManualReminderEmail(input: unknown): Promise<Angelcare360EmailSendResult & { record?: Record<string, unknown> | null }> {
  await requireAngelcare360OperatorPermission('operator.billing.update')
  const payload = input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
  const invoiceId = String(payload.id || payload.invoiceId || '').trim()
  if (!invoiceId) {
    return { ok: false, mailbox: getAngelcare360B2BMailboxEmail(), provider: 'email-os', error: 'La facture est requise.' }
  }
  const invoice = await getOperatorInvoiceById(invoiceId)
  if (!invoice) {
    return { ok: false, mailbox: getAngelcare360B2BMailboxEmail(), provider: 'email-os', error: 'La facture est introuvable.' }
  }
  const client = await getOperatorClientById(String(invoice.client_id))
  if (!client) {
    return { ok: false, mailbox: getAngelcare360B2BMailboxEmail(), provider: 'email-os', error: 'Le client est introuvable.' }
  }
  const billingAccount = invoice.billing_account_id ? await getOperatorBillingAccountById(String(invoice.billing_account_id)) : null
  const recipientEmail = pickRecipient(billingAccount?.billing_email || null, client.primary_contact_email || null)
  if (!recipientEmail) {
    return { ok: false, mailbox: getAngelcare360B2BMailboxEmail(), provider: 'email-os', error: 'Aucune adresse email de facturation n’est configurée.' }
  }
  const draft = buildAngelcare360ReminderEmailDraft({
    clientName: String(client.display_name || client.legal_name || 'Client'),
    recipientEmail,
    invoiceNumber: String(invoice.invoice_number || invoice.id),
    amountMad: money(invoice.balance_due_mad),
    dueDate: String(invoice.due_date || '—'),
  })
  const result = await sendAngelcare360Email(draft)
  await logEmailAction({
    module: 'billing',
    action: result.ok ? 'email.reminder.sent' : 'email.reminder.failed',
    clientId: String(invoice.client_id),
    entityType: 'angelcare360_operator_invoices',
    entityId: String(invoice.id),
    metadata: { templateKey: draft.templateKey, recipientEmail, subject: draft.subject, error: result.error || null },
  })
  return { ...result, record: { invoiceId: invoice.id, recipientEmail } }
}

export async function sendOperatorOnboardingEmail(input: unknown): Promise<Angelcare360EmailSendResult & { record?: Record<string, unknown> | null }> {
  await requireAngelcare360OperatorPermission('operator.onboarding.update')
  const payload = input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
  const clientId = String(payload.clientId || payload.id || '').trim()
  if (!clientId) {
    return { ok: false, mailbox: getAngelcare360B2BMailboxEmail(), provider: 'email-os', error: 'Le client est requis.' }
  }
  const client = await getOperatorClientById(clientId)
  if (!client) {
    return { ok: false, mailbox: getAngelcare360B2BMailboxEmail(), provider: 'email-os', error: 'Le client est introuvable.' }
  }
  const recipientEmail = pickRecipient(client.primary_contact_email || null, null)
  if (!recipientEmail) {
    return { ok: false, mailbox: getAngelcare360B2BMailboxEmail(), provider: 'email-os', error: 'Aucune adresse email de contact n’est configurée.' }
  }
  const draft = buildAngelcare360OnboardingEmailDraft({
    clientName: String(client.display_name || client.legal_name || 'Client'),
    recipientEmail,
    subjectHint: String(payload.subject || `Onboarding AngelCare 360 — ${client.display_name || client.client_code}`),
    bodyHint: String(payload.body || 'Le suivi d’onboarding AngelCare 360 a été mis à jour.'),
  })
  const result = await sendAngelcare360Email(draft)
  await logEmailAction({
    module: 'onboarding',
    action: result.ok ? 'email.onboarding.sent' : 'email.onboarding.failed',
    clientId: String(client.id),
    entityType: 'angelcare360_operator_clients',
    entityId: String(client.id),
    metadata: { templateKey: draft.templateKey, recipientEmail, subject: draft.subject, error: result.error || null },
  })
  return { ...result, record: { clientId: client.id, recipientEmail } }
}

export async function sendOperatorSupportFollowUpEmail(input: unknown): Promise<Angelcare360EmailSendResult & { record?: Record<string, unknown> | null }> {
  await requireAngelcare360OperatorPermission('operator.support.update')
  const payload = input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
  const clientId = String(payload.clientId || payload.id || '').trim()
  if (!clientId) {
    return { ok: false, mailbox: getAngelcare360B2BMailboxEmail(), provider: 'email-os', error: 'Le client est requis.' }
  }
  const client = await getOperatorClientById(clientId)
  if (!client) {
    return { ok: false, mailbox: getAngelcare360B2BMailboxEmail(), provider: 'email-os', error: 'Le client est introuvable.' }
  }
  const recipientEmail = pickRecipient(client.primary_contact_email || null, null)
  if (!recipientEmail) {
    return { ok: false, mailbox: getAngelcare360B2BMailboxEmail(), provider: 'email-os', error: 'Aucune adresse email de contact n’est configurée.' }
  }
  const draft = buildAngelcare360SupportFollowUpEmailDraft({
    clientName: String(client.display_name || client.legal_name || 'Client'),
    recipientEmail,
    subjectHint: String(payload.subject || `Suivi support AngelCare 360 — ${client.display_name || client.client_code}`),
    bodyHint: String(payload.body || 'Votre demande support AngelCare 360 fait l’objet d’un suivi.'),
  })
  const result = await sendAngelcare360Email(draft)
  await logEmailAction({
    module: 'support',
    action: result.ok ? 'email.support_follow_up.sent' : 'email.support_follow_up.failed',
    clientId: String(client.id),
    entityType: 'angelcare360_operator_clients',
    entityId: String(client.id),
    metadata: { templateKey: draft.templateKey, recipientEmail, subject: draft.subject, error: result.error || null },
  })
  return { ...result, record: { clientId: client.id, recipientEmail } }
}
