import { createServiceClient } from '@/lib/supabase/server'

const MESSAGE_TABLE = 'angelcare360_operator_email_messages'
const EVENT_TABLE = 'angelcare360_operator_email_delivery_events'
const LINK_TABLE = 'angelcare360_operator_email_relationship_links'

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function stringArray(value: unknown) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean)
  const text = clean(value)
  return text ? text.split(',').map((item) => item.trim()).filter(Boolean) : []
}

function reference(prefix: string) {
  return `${prefix}-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
}

export async function recordOutboundEmailCommand(input: {
  mailboxKey?: string | null
  mailboxEmail?: string | null
  providerMessageId?: string | null
  toEmail: string
  ccEmail?: string | null
  bccEmail?: string | null
  subject: string
  bodyText?: string | null
  bodyHtml?: string | null
  status: string
  deliveryState?: string | null
  templateCode?: string | null
  automationRuleId?: string | null
  clientId?: string | null
  contactId?: string | null
  institutionId?: string | null
  tenantId?: string | null
  relatedEntityType?: string | null
  relatedEntityId?: string | null
  metadata?: Record<string, unknown>
}) {
  try {
    const db = await createServiceClient()
    const now = new Date().toISOString()
    const { data, error } = await db.from(MESSAGE_TABLE).insert({
      message_reference: reference('EML'),
      direction: 'outbound',
      mailbox_key: input.mailboxKey || null,
      mailbox_email: input.mailboxEmail || null,
      provider_message_id: input.providerMessageId || null,
      subject: input.subject,
      body_text: input.bodyText || null,
      body_html: input.bodyHtml || null,
      sender_email: input.mailboxEmail || '',
      recipient_emails: stringArray(input.toEmail),
      cc_emails: stringArray(input.ccEmail),
      bcc_emails: stringArray(input.bccEmail),
      status: input.status,
      delivery_state: input.deliveryState || input.status,
      automation_rule_id: input.automationRuleId || null,
      client_id: input.clientId || null,
      contact_id: input.contactId || null,
      institution_id: input.institutionId || null,
      tenant_id: input.tenantId || null,
      related_entity_type: input.relatedEntityType || null,
      related_entity_id: input.relatedEntityId || null,
      requires_response: false,
      sent_at: ['smtp_accepted','sent','replied'].includes(input.status) ? now : null,
      metadata: { ...(input.metadata || {}), template_code: input.templateCode || null },
    }).select('id,message_reference').single()
    if (error || !data) return { ok: false, error: error?.message || 'Email ledger unavailable.' }

    await db.from(EVENT_TABLE).insert({
      message_id: data.id,
      event_type: input.deliveryState || input.status,
      provider: 'email-os',
      occurred_at: now,
      evidence: { provider_message_id: input.providerMessageId || null, status: input.status },
    })

    const links = [
      ['client', input.clientId], ['contact', input.contactId], ['institution', input.institutionId], ['tenant', input.tenantId],
      [input.relatedEntityType || '', input.relatedEntityId],
    ].filter((item) => item[0] && item[1]).map(([entityType, entityId]) => ({
      message_id: data.id,
      entity_type: entityType,
      entity_id: entityId,
      relationship_type: 'context',
      confidence: 'confirmed',
      source: 'system',
    }))
    if (links.length) await db.from(LINK_TABLE).insert(links)
    return { ok: true, messageId: data.id, messageReference: data.message_reference }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Email ledger unavailable.' }
  }
}
