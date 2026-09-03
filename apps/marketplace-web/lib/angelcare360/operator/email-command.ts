/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { listEmailOSMultiMailboxes, listEmailOSMultiMailboxesFromDb, mailboxIdFromEmail } from '@/lib/email-os-core/multi-mailbox-resolver'
import { sendEmailOSDirect } from '@/lib/email-os-core/send-mail'
import { requireAngelcare360OperatorPermission } from './access'
import { writeOperatorAuditLog } from './audit'
import { asString, asStringArray, getOperatorClient, safeList, toRecord } from './shared'
import type { EmailCommandSnapshot } from '@/types/angelcare360/operator/email-command'
import { assertExternalSideEffectAllowed } from '@/lib/sanila-demo/safety'

const RULE_TABLE = 'angelcare360_operator_email_automation_rules'
const RULE_VERSION_TABLE = 'angelcare360_operator_email_automation_rule_versions'
const EXECUTION_TABLE = 'angelcare360_operator_email_automation_executions'
const MESSAGE_TABLE = 'angelcare360_operator_email_messages'
const DELIVERY_TABLE = 'angelcare360_operator_email_delivery_events'
const LINK_TABLE = 'angelcare360_operator_email_relationship_links'
const MATCH_TABLE = 'angelcare360_operator_email_inbound_matches'
const ASSIGNMENT_TABLE = 'angelcare360_operator_email_thread_assignments'
const TEMPLATE_TABLE = 'angelcare360_operator_email_templates'
const APPROVAL_TABLE = 'angelcare360_operator_email_approvals'
const SUPPRESSION_TABLE = 'angelcare360_operator_email_suppressions'
const COMMITMENT_TABLE = 'angelcare360_operator_email_business_commitments'

type ResolvedRecipient = {
  email: string
  contactId?: string | null
  source: string
  confidence: 'confirmed' | 'high' | 'suggested'
}

function now() { return new Date().toISOString() }
function idRef(prefix: string) { return `${prefix}-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${crypto.randomUUID().slice(0,8).toUpperCase()}` }
function normalizeEmail(value: unknown) { return asString(value).trim().toLowerCase() }
function isEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) }
function bool(value: unknown, fallback = false) { return value === undefined || value === null ? fallback : Boolean(value) }
function iso(value: unknown) { const raw = asString(value); if (!raw) return null; const date = new Date(raw); return Number.isNaN(date.getTime()) ? null : date.toISOString() }
function numberValue(value: unknown, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback }

function renderTemplate(value: string, context: Record<string, unknown>) {
  return String(value || '').replace(/{{\s*([\w.]+)\s*}}/g, (_match, path: string) => {
    const resolved = path.split('.').reduce<unknown>((current, key) => current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined, context)
    return resolved === null || resolved === undefined ? '' : String(resolved)
  })
}

async function audit(action: string, entityType: string, entityId: string | null, metadata: Record<string, unknown>, beforeData?: unknown, afterData?: unknown) {
  await writeOperatorAuditLog({ module: 'email-command', action, entityType, entityId, severity: action.includes('failed') ? 'warning' : 'notice', beforeData: beforeData as Record<string, unknown> | null, afterData: afterData as Record<string, unknown> | null, metadata })
}

async function mailboxSnapshot() {
  const dbRows = await listEmailOSMultiMailboxesFromDb().catch(() => [])
  const rows = dbRows.length ? dbRows : listEmailOSMultiMailboxes()
  const bridgeEnabled = Boolean(process.env.EMAIL_OS_BRIDGE_URL)
  return rows.map((row) => ({
    key: row.key,
    label: row.label,
    email: row.email,
    source: row.source,
    smtp_host: row.smtp.host,
    smtp_port: row.smtp.port,
    inbound_host: row.incoming.host,
    inbound_port: row.incoming.port,
    configured: Boolean(row.smtp.host && row.smtp.port && row.smtp.user && row.smtp.pass),
    bridge_enabled: bridgeEnabled,
  }))
}

export async function loadEmailCommandSnapshot(filters?: { clientId?: string | null; limit?: number }): Promise<EmailCommandSnapshot> {
  await requireAngelcare360OperatorPermission('operator.platform.view')
  const clientFilter = filters?.clientId ? [['client_id', 'eq', filters.clientId] as const] : []
  const limit = Math.max(50, Math.min(1000, filters?.limit || 400))
  const [rules, templates, messages, approvals, deliveryEvents, relationshipLinks, inboundMatches, assignments, suppressions, commitments, executions, clients, contacts, tenants, mailboxes] = await Promise.all([
    safeList(RULE_TABLE, '*', [], ['updated_at', { ascending: false }], 300),
    safeList(TEMPLATE_TABLE, '*', [], ['updated_at', { ascending: false }], 300),
    safeList(MESSAGE_TABLE, '*', clientFilter as any, ['created_at', { ascending: false }], limit),
    safeList(APPROVAL_TABLE, '*', [], ['requested_at', { ascending: false }], 300),
    safeList(DELIVERY_TABLE, '*', [], ['occurred_at', { ascending: false }], 1000),
    safeList(LINK_TABLE, '*', [], ['linked_at', { ascending: false }], 1000),
    safeList(MATCH_TABLE, '*', [], ['created_at', { ascending: false }], 500),
    safeList(ASSIGNMENT_TABLE, '*', [], ['updated_at', { ascending: false }], 500),
    safeList(SUPPRESSION_TABLE, '*', [], ['created_at', { ascending: false }], 500),
    safeList(COMMITMENT_TABLE, '*', clientFilter as any, ['due_at', { ascending: true }], 500),
    safeList(EXECUTION_TABLE, '*', [], ['created_at', { ascending: false }], 500),
    safeList('angelcare360_operator_clients', 'id,client_code,display_name,legal_name,status,primary_contact_email,client_type,city', filters?.clientId ? [['id','eq',filters.clientId]] as any : [], ['display_name', { ascending: true }], 1000),
    safeList('angelcare360_operator_growth_contacts', 'id,client_id,prospect_id,full_name,email,role_type,job_title,institution_name,status,is_primary,communication_preferences', filters?.clientId ? [['client_id','eq',filters.clientId]] as any : [], ['full_name', { ascending: true }], 2000),
    safeList('angelcare360_operator_tenants', 'id,client_id,tenant_slug,status,provisioning_status,school_id', filters?.clientId ? [['client_id','eq',filters.clientId]] as any : [], ['tenant_slug', { ascending: true }], 1000),
    mailboxSnapshot(),
  ])
  const typedMessages = messages as any[]
  const metrics = {
    queued: typedMessages.filter((item) => ['scheduled','queued','bridge_processing','retry_scheduled'].includes(String(item.status))).length,
    awaitingApproval: typedMessages.filter((item) => item.status === 'awaiting_approval').length + (approvals as any[]).filter((item) => ['requested','pending'].includes(String(item.status))).length,
    failed: typedMessages.filter((item) => ['failed','permanently_failed'].includes(String(item.status))).length,
    inboundUnmatched: typedMessages.filter((item) => item.direction === 'inbound' && !item.client_id).length,
    awaitingAngelcare: typedMessages.filter((item) => item.direction === 'inbound' && item.requires_response && !item.resolved_at).length,
    awaitingCustomer: typedMessages.filter((item) => item.direction === 'outbound' && item.requires_response && !item.replied_at).length,
    replied: typedMessages.filter((item) => Boolean(item.replied_at) || item.status === 'replied').length,
    activeRules: (rules as any[]).filter((item) => item.status === 'active').length,
    mailboxConfigured: mailboxes.filter((item) => item.configured).length,
  }
  return { rules: rules as any, templates: templates as any, messages: messages as any, approvals: approvals as any, deliveryEvents, relationshipLinks, inboundMatches, assignments, suppressions, commitments, executions, clients, contacts, tenants, mailboxes, metrics }
}

async function upsertRule(input: unknown) {
  const actor = await requireAngelcare360OperatorPermission('operator.platform.update')
  const payload = toRecord(input)
  const db = await getOperatorClient()
  const id = asString(payload.id)
  const name = asString(payload.name).trim()
  const triggerEvent = asString(payload.triggerEvent || payload.trigger_event).trim()
  if (!name || !triggerEvent) return { ok: false, error: 'Nom et événement déclencheur sont requis.' }
  let before: any = null
  if (id) before = (await db.from(RULE_TABLE).select('*').eq('id', id).maybeSingle()).data
  const row = {
    rule_code: asString(payload.ruleCode || payload.rule_code) || before?.rule_code || idRef('AUT'),
    name,
    description: asString(payload.description) || null,
    status: asString(payload.status, before?.status || 'draft'),
    trigger_event: triggerEvent,
    conditions: toRecord(payload.conditions),
    actions: toRecord(payload.actions),
    recipient_policy: toRecord(payload.recipientPolicy || payload.recipient_policy),
    mailbox_key: asString(payload.mailboxKey || payload.mailbox_key) || null,
    template_id: asString(payload.templateId || payload.template_id) || null,
    approval_policy: toRecord(payload.approvalPolicy || payload.approval_policy),
    suppression_policy: toRecord(payload.suppressionPolicy || payload.suppression_policy),
    frequency_policy: toRecord(payload.frequencyPolicy || payload.frequency_policy),
    quiet_hours: toRecord(payload.quietHours || payload.quiet_hours),
    effective_from: iso(payload.effectiveFrom || payload.effective_from),
    effective_to: iso(payload.effectiveTo || payload.effective_to),
    version_number: id ? numberValue(before?.version_number, 1) + 1 : 1,
    updated_by: actor.user.id,
  }
  const result = id
    ? await db.from(RULE_TABLE).update(row).eq('id', id).select('*').single()
    : await db.from(RULE_TABLE).insert({ ...row, created_by: actor.user.id }).select('*').single()
  if (result.error) return { ok: false, error: result.error.message }
  await db.from(RULE_VERSION_TABLE).insert({ automation_rule_id: result.data.id, version_number: result.data.version_number, snapshot: result.data, change_summary: asString(payload.changeSummary || payload.change_summary, id ? 'Mise à jour de règle' : 'Création de règle'), created_by: actor.user.id })
  await audit(id ? 'automation_rule.updated' : 'automation_rule.created', RULE_TABLE, result.data.id, { trigger_event: triggerEvent }, before, result.data)
  return { ok: true, record: result.data }
}

async function setRuleStatus(input: unknown) {
  const actor = await requireAngelcare360OperatorPermission('operator.platform.update')
  const payload = toRecord(input)
  const id = asString(payload.id)
  const status = asString(payload.status)
  if (!id || !['draft','active','paused','retired','archived'].includes(status)) return { ok: false, error: 'Règle et statut valides requis.' }
  const db = await getOperatorClient()
  const { data: before } = await db.from(RULE_TABLE).select('*').eq('id', id).maybeSingle()
  if (!before) return { ok: false, error: 'Règle introuvable.' }
  const { data, error } = await db.from(RULE_TABLE).update({ status, updated_by: actor.user.id }).eq('id', id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await audit(`automation_rule.${status}`, RULE_TABLE, id, { reason: asString(payload.reason) }, before, data)
  return { ok: true, record: data }
}

async function upsertTemplate(input: unknown) {
  const actor = await requireAngelcare360OperatorPermission('operator.platform.update')
  const payload = toRecord(input)
  const db = await getOperatorClient()
  const id = asString(payload.id)
  const name = asString(payload.name).trim()
  const subject = asString(payload.subjectTemplate || payload.subject_template).trim()
  const textTemplate = asString(payload.textTemplate || payload.text_template).trim()
  if (!name || !subject || !textTemplate) return { ok: false, error: 'Nom, objet et contenu texte sont requis.' }
  let before: any = null
  if (id) before = (await db.from(TEMPLATE_TABLE).select('*').eq('id', id).maybeSingle()).data
  const row = {
    template_code: asString(payload.templateCode || payload.template_code) || before?.template_code || idRef('TPL'),
    name,
    purpose: asString(payload.purpose, 'general_correspondence'),
    language: asString(payload.language, 'fr'),
    status: asString(payload.status, before?.status || 'draft'),
    mailbox_key: asString(payload.mailboxKey || payload.mailbox_key) || null,
    subject_template: subject,
    html_template: asString(payload.htmlTemplate || payload.html_template) || null,
    text_template: textTemplate,
    variable_schema: toRecord(payload.variableSchema || payload.variable_schema),
    approval_required: bool(payload.approvalRequired || payload.approval_required),
    version_number: id ? numberValue(before?.version_number, 1) + 1 : 1,
    effective_from: iso(payload.effectiveFrom || payload.effective_from),
    effective_to: iso(payload.effectiveTo || payload.effective_to),
    updated_by: actor.user.id,
  }
  const result = id ? await db.from(TEMPLATE_TABLE).update(row).eq('id', id).select('*').single() : await db.from(TEMPLATE_TABLE).insert({ ...row, created_by: actor.user.id }).select('*').single()
  if (result.error) return { ok: false, error: result.error.message }
  await audit(id ? 'template.updated' : 'template.created', TEMPLATE_TABLE, result.data.id, { purpose: row.purpose }, before, result.data)
  return { ok: true, record: result.data }
}

async function composeMessage(input: unknown) {
  const actor = await requireAngelcare360OperatorPermission('operator.platform.update')
  const payload = toRecord(input)
  const db = await getOperatorClient()
  const recipients = asStringArray(payload.recipientEmails || payload.recipient_emails || payload.toEmail)
  if (!recipients.length || recipients.some((email) => !isEmail(email))) return { ok: false, error: 'Au moins un destinataire email valide est requis.' }
  const subject = asString(payload.subject).trim()
  const bodyText = asString(payload.bodyText || payload.body_text).trim()
  if (!subject || !bodyText) return { ok: false, error: 'Objet et contenu du message sont requis.' }
  const approvalRequired = bool(payload.approvalRequired || payload.approval_required)
  const scheduledAt = iso(payload.scheduledAt || payload.scheduled_at)
  const status = approvalRequired ? 'awaiting_approval' : scheduledAt && new Date(scheduledAt).getTime() > Date.now() ? 'scheduled' : 'queued'
  const { data, error } = await db.from(MESSAGE_TABLE).insert({
    message_reference: idRef('EML'), direction: 'outbound', thread_key: asString(payload.threadKey || payload.thread_key) || null,
    mailbox_key: asString(payload.mailboxKey || payload.mailbox_key, 'B2B'), mailbox_email: asString(payload.mailboxEmail || payload.mailbox_email) || null,
    subject, body_text: bodyText, body_html: asString(payload.bodyHtml || payload.body_html) || null,
    sender_email: asString(payload.mailboxEmail || payload.mailbox_email) || '', recipient_emails: recipients,
    cc_emails: asStringArray(payload.ccEmails || payload.cc_emails), bcc_emails: asStringArray(payload.bccEmails || payload.bcc_emails),
    status, delivery_state: status, automation_rule_id: asString(payload.automationRuleId || payload.automation_rule_id) || null,
    template_id: asString(payload.templateId || payload.template_id) || null, client_id: asString(payload.clientId || payload.client_id) || null,
    contact_id: asString(payload.contactId || payload.contact_id) || null, institution_id: asString(payload.institutionId || payload.institution_id) || null,
    tenant_id: asString(payload.tenantId || payload.tenant_id) || null, related_entity_type: asString(payload.relatedEntityType || payload.related_entity_type) || null,
    related_entity_id: asString(payload.relatedEntityId || payload.related_entity_id) || null, owner_id: actor.user.id,
    assigned_team: asString(payload.assignedTeam || payload.assigned_team, 'communications'), classification: asString(payload.classification, 'general_correspondence'),
    confidence: 'confirmed', requires_response: bool(payload.requiresResponse || payload.requires_response), response_due_at: iso(payload.responseDueAt || payload.response_due_at),
    scheduled_at: scheduledAt, attachments: Array.isArray(payload.attachments) ? payload.attachments : [], metadata: toRecord(payload.metadata), created_by: actor.user.id,
  }).select('*').single()
  if (error) return { ok: false, error: error.message }
  if (approvalRequired) await db.from(APPROVAL_TABLE).insert({ message_id: data.id, automation_rule_id: data.automation_rule_id, status: 'requested', approval_type: 'email_send', requested_by: actor.user.id, reason: asString(payload.approvalReason || payload.approval_reason), risk_summary: asString(payload.riskSummary || payload.risk_summary), requested_at: now() })
  await linkMessageContext(db, data.id, payload, actor.user.id)
  await audit('message.composed', MESSAGE_TABLE, data.id, { status, recipients }, null, data)
  return { ok: true, record: data }
}

async function linkMessageContext(db: any, messageId: string, payload: Record<string, unknown>, actorId?: string | null) {
  const pairs = [
    ['client', payload.clientId || payload.client_id], ['contact', payload.contactId || payload.contact_id],
    ['institution', payload.institutionId || payload.institution_id], ['tenant', payload.tenantId || payload.tenant_id],
    [asString(payload.relatedEntityType || payload.related_entity_type), payload.relatedEntityId || payload.related_entity_id],
  ].filter(([type, id]) => asString(type) && asString(id))
  if (!pairs.length) return
  await db.from(LINK_TABLE).insert(pairs.map(([type, id]) => ({ message_id: messageId, entity_type: asString(type), entity_id: asString(id), relationship_type: 'context', confidence: 'confirmed', source: 'operator', linked_by: actorId || null })))
}

async function appendDeliveryEvent(db: any, messageId: string, eventType: string, evidence: Record<string, unknown> = {}) {
  await db.from(DELIVERY_TABLE).insert({ message_id: messageId, event_type: eventType, provider: 'email-os', occurred_at: now(), evidence })
}

async function sendMessage(input: unknown) {
  const actor = await requireAngelcare360OperatorPermission('operator.platform.update')
  const payload = toRecord(input)
  const id = asString(payload.id || payload.messageId)
  const db = await getOperatorClient()
  const { data: message } = await db.from(MESSAGE_TABLE).select('*').eq('id', id).maybeSingle()
  if (!message) return { ok: false, error: 'Message introuvable.' }
  if (!['queued','approved','scheduled','failed','retry_scheduled'].includes(message.status)) return { ok: false, error: `Le message ${message.status} ne peut pas être envoyé.` }
  if (message.status === 'scheduled' && message.scheduled_at && new Date(message.scheduled_at).getTime() > Date.now() && !bool(payload.force)) return { ok: false, error: 'Le message est planifié pour une date future.' }
  const suppressed = await findSuppressedRecipient(db, message.recipient_emails || [])
  if (suppressed) return { ok: false, error: `Destinataire supprimé: ${suppressed.email}.` }
  const demoSafety = await assertExternalSideEffectAllowed({ channel: 'email', operation: 'email.send', tenantId: message.tenant_id, actorUserId: actor.user.id, metadata: { operator_message_id: id } })
  if (!demoSafety.allowed) {
    const { data } = await db.from(MESSAGE_TABLE).update({ status: 'smtp_accepted', delivery_state: 'simulated_demo_safe', provider_message_id: `demo-simulated:${id}`, sent_at: now(), updated_by: actor.user.id }).eq('id', id).select('*').single()
    await appendDeliveryEvent(db, id, 'simulated_demo_safe', { code: demoSafety.code })
    return { ok: true, simulated: true, code: demoSafety.code, record: data }
  }
  const mailboxes = [...await listEmailOSMultiMailboxesFromDb().catch(() => []), ...listEmailOSMultiMailboxes()]
  const mailbox = mailboxes.find((item) => item.key === message.mailbox_key || item.email === message.mailbox_email) || mailboxes.find((item) => item.key === 'B2B') || mailboxes[0]
  if (!mailbox) return { ok: false, error: 'Aucune boîte Email OS configurée.' }
  await db.from(MESSAGE_TABLE).update({ status: 'bridge_processing', delivery_state: 'bridge_processing', attempt_count: numberValue(message.attempt_count) + 1, last_attempt_at: now(), updated_by: actor.user.id }).eq('id', id)
  await appendDeliveryEvent(db, id, 'bridge_processing', { mailbox: mailbox.email })
  try {
    const result = await sendEmailOSDirect({
      mailboxId: mailbox.mailboxId || mailboxIdFromEmail(mailbox.email), fromEmail: mailbox.email,
      toEmail: (message.recipient_emails || []).join(','), ccEmail: (message.cc_emails || []).join(',') || null,
      bccEmail: (message.bcc_emails || []).join(',') || null, subject: message.subject, body: message.body_text || '',
      bodyText: message.body_text || '', bodyHtml: message.body_html || null,
      headers: message.thread_key ? { 'X-AngelCare-Thread': message.thread_key } : undefined,
      attachments: message.attachments || [],
    })
    const providerMessageId = result.info?.messageId || null
    const { data } = await db.from(MESSAGE_TABLE).update({ status: 'smtp_accepted', delivery_state: 'smtp_accepted', provider_message_id: providerMessageId, mailbox_email: mailbox.email, sent_at: now(), updated_by: actor.user.id }).eq('id', id).select('*').single()
    await appendDeliveryEvent(db, id, 'smtp_accepted', { provider_message_id: providerMessageId, accepted: result.info?.accepted || [], rejected: result.info?.rejected || [], bridge: Boolean(result.info?.bridge) })
    await audit('message.sent', MESSAGE_TABLE, id, { provider_message_id: providerMessageId, mailbox: mailbox.email }, message, data)
    return { ok: true, record: data }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Email OS send failed.'
    const attempt = numberValue(message.attempt_count) + 1
    const permanent = attempt >= Math.max(1, numberValue(toRecord(message.metadata).max_attempts, 3))
    const status = permanent ? 'permanently_failed' : 'retry_scheduled'
    const nextRetry = permanent ? null : new Date(Date.now() + Math.min(3600000, attempt * 5 * 60000)).toISOString()
    const { data } = await db.from(MESSAGE_TABLE).update({ status, delivery_state: 'failed', failure_reason: errorMessage, next_retry_at: nextRetry, updated_by: actor.user.id }).eq('id', id).select('*').single()
    await appendDeliveryEvent(db, id, 'failed', { error: errorMessage, attempt, next_retry_at: nextRetry })
    await audit('message.failed', MESSAGE_TABLE, id, { error: errorMessage, attempt }, message, data)
    return { ok: false, error: errorMessage, record: data }
  }
}

async function findSuppressedRecipient(db: any, recipients: string[]) {
  if (!recipients.length) return null
  const { data } = await db.from(SUPPRESSION_TABLE).select('*').in('email', recipients.map((item) => normalizeEmail(item))).eq('status', 'active').limit(1)
  return data?.[0] || null
}

async function updateMessage(input: unknown) {
  const actor = await requireAngelcare360OperatorPermission('operator.platform.update')
  const payload = toRecord(input)
  const id = asString(payload.id || payload.messageId)
  const action = asString(payload.action)
  const db = await getOperatorClient()
  const { data: before } = await db.from(MESSAGE_TABLE).select('*').eq('id', id).maybeSingle()
  if (!before) return { ok: false, error: 'Message introuvable.' }
  const patch: Record<string, unknown> = { updated_by: actor.user.id }
  if (action === 'cancel') Object.assign(patch, { status: 'cancelled', delivery_state: 'cancelled' })
  else if (action === 'assign') Object.assign(patch, { owner_id: asString(payload.ownerId || payload.owner_id) || actor.user.id, assigned_team: asString(payload.team || payload.assigned_team, before.assigned_team) })
  else if (action === 'classify') Object.assign(patch, { classification: asString(payload.classification), confidence: 'confirmed' })
  else if (action === 'resolve') Object.assign(patch, { status: 'resolved', resolved_at: now(), requires_response: false })
  else if (action === 'reopen') Object.assign(patch, { status: before.direction === 'inbound' ? 'received' : 'queued', resolved_at: null })
  else if (action === 'snooze') Object.assign(patch, { status: 'snoozed', response_due_at: iso(payload.until) })
  else if (action === 'reschedule') Object.assign(patch, { status: 'scheduled', scheduled_at: iso(payload.scheduledAt || payload.scheduled_at) })
  else return { ok: false, error: 'Action message inconnue.' }
  const { data, error } = await db.from(MESSAGE_TABLE).update(patch).eq('id', id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await appendDeliveryEvent(db, id, `operator.${action}`, { reason: asString(payload.reason), actor: actor.user.id })
  await audit(`message.${action}`, MESSAGE_TABLE, id, { reason: asString(payload.reason) }, before, data)
  return { ok: true, record: data }
}

async function decideApproval(input: unknown) {
  const actor = await requireAngelcare360OperatorPermission('operator.platform.update')
  const payload = toRecord(input)
  const id = asString(payload.id || payload.approvalId)
  const decision = asString(payload.decision)
  if (!['approved','rejected','cancelled'].includes(decision)) return { ok: false, error: 'Décision invalide.' }
  const db = await getOperatorClient()
  const { data: before } = await db.from(APPROVAL_TABLE).select('*').eq('id', id).maybeSingle()
  if (!before) return { ok: false, error: 'Approbation introuvable.' }
  const { data, error } = await db.from(APPROVAL_TABLE).update({ status: decision, approver_id: actor.user.id, decided_at: now(), decision_note: asString(payload.note) }).eq('id', id).select('*').single()
  if (error) return { ok: false, error: error.message }
  if (before.message_id) await db.from(MESSAGE_TABLE).update({ status: decision === 'approved' ? 'approved' : 'cancelled', delivery_state: decision }).eq('id', before.message_id)
  await audit(`approval.${decision}`, APPROVAL_TABLE, id, { note: asString(payload.note) }, before, data)
  return { ok: true, record: data }
}

async function publishBusinessEvent(input: unknown) {
  const actor = await requireAngelcare360OperatorPermission('operator.platform.update')
  return evaluateBusinessEvent({ ...toRecord(input), actorId: actor.user.id })
}

export async function evaluateBusinessEvent(input: Record<string, unknown>) {
  const db = await createServiceClient()
  const eventType = asString(input.eventType || input.event_type)
  if (!eventType) return { ok: false, error: 'Événement métier requis.' }
  const { data: rules, error } = await db.from(RULE_TABLE).select('*').eq('trigger_event', eventType).eq('status', 'active')
  if (error) return { ok: false, error: error.message }
  const outcomes: Array<Record<string, unknown>> = []
  for (const rule of rules || []) {
    const context = await buildEventContext(db, input)
    const recipients = await resolveRecipients(db, rule.recipient_policy || {}, context, input)
    const template = rule.template_id ? (await db.from(TEMPLATE_TABLE).select('*').eq('id', rule.template_id).maybeSingle()).data : null
    const executionBase = { automation_rule_id: rule.id, event_type: eventType, event_payload: input, client_id: asString(input.clientId || input.client_id) || null, status: 'evaluating', started_at: now(), created_by: asString(input.actorId) || null }
    const { data: execution } = await db.from(EXECUTION_TABLE).insert(executionBase).select('*').single()
    if (!recipients.length || !template) {
      if (execution) await db.from(EXECUTION_TABLE).update({ status: 'skipped', completed_at: now(), outcome: { reason: !template ? 'missing_template' : 'missing_recipient' } }).eq('id', execution.id)
      outcomes.push({ ruleId: rule.id, status: 'skipped', reason: !template ? 'missing_template' : 'missing_recipient' })
      continue
    }
    const approvalRequired = bool(toRecord(rule.approval_policy).required) || Boolean(template.approval_required)
    const messageResult = await db.from(MESSAGE_TABLE).insert({
      message_reference: idRef('EML'), direction: 'outbound', mailbox_key: rule.mailbox_key || template.mailbox_key || 'B2B',
      subject: renderTemplate(template.subject_template, context), body_text: renderTemplate(template.text_template, context), body_html: template.html_template ? renderTemplate(template.html_template, context) : null,
      sender_email: '', recipient_emails: recipients.map((item) => item.email), cc_emails: [], bcc_emails: [],
      status: approvalRequired ? 'awaiting_approval' : 'queued', delivery_state: approvalRequired ? 'awaiting_approval' : 'queued',
      automation_rule_id: rule.id, template_id: template.id, client_id: asString(input.clientId || input.client_id) || null,
      contact_id: recipients[0]?.contactId || null, institution_id: asString(input.institutionId || input.institution_id) || null,
      tenant_id: asString(input.tenantId || input.tenant_id) || null, related_entity_type: asString(input.entityType || input.entity_type) || null,
      related_entity_id: asString(input.entityId || input.entity_id) || null, classification: asString(toRecord(rule.actions).classification, 'general_correspondence'),
      confidence: 'confirmed', requires_response: bool(toRecord(rule.actions).requires_response), metadata: { event_type: eventType, execution_id: execution?.id || null, recipient_evidence: recipients }, created_by: asString(input.actorId) || null,
    }).select('*').single()
    if (messageResult.error) {
      if (execution) await db.from(EXECUTION_TABLE).update({ status: 'failed', completed_at: now(), error_message: messageResult.error.message }).eq('id', execution.id)
      outcomes.push({ ruleId: rule.id, status: 'failed', error: messageResult.error.message })
      continue
    }
    await linkMessageContext(db, messageResult.data.id, input, asString(input.actorId) || null)
    if (approvalRequired) await db.from(APPROVAL_TABLE).insert({ message_id: messageResult.data.id, automation_rule_id: rule.id, status: 'requested', approval_type: 'automation_send', requested_by: asString(input.actorId) || null, reason: `Automation ${rule.name}`, risk_summary: asString(toRecord(rule.approval_policy).risk_summary), requested_at: now() })
    if (execution) await db.from(EXECUTION_TABLE).update({ status: 'completed', completed_at: now(), message_id: messageResult.data.id, outcome: { recipients: recipients.length, approval_required: approvalRequired } }).eq('id', execution.id)
    await db.from(RULE_TABLE).update({ last_evaluated_at: now(), last_executed_at: now(), execution_count: numberValue(rule.execution_count) + 1 }).eq('id', rule.id)
    outcomes.push({ ruleId: rule.id, status: 'queued', messageId: messageResult.data.id, recipients: recipients.length })
  }
  return { ok: true, eventType, outcomes }
}

async function buildEventContext(db: any, input: Record<string, unknown>) {
  const clientId = asString(input.clientId || input.client_id)
  const tenantId = asString(input.tenantId || input.tenant_id)
  const client = clientId ? (await db.from('angelcare360_operator_clients').select('*').eq('id', clientId).maybeSingle()).data : null
  const tenant = tenantId ? (await db.from('angelcare360_operator_tenants').select('*').eq('id', tenantId).maybeSingle()).data : null
  return { event: input, client: client || {}, tenant: tenant || {}, current: input, now: now() }
}

async function resolveRecipients(db: any, policy: Record<string, unknown>, context: Record<string, unknown>, input: Record<string, unknown>): Promise<ResolvedRecipient[]> {
  const explicit: ResolvedRecipient[] = asStringArray(input.recipientEmails || input.recipient_emails).filter(isEmail).map((email) => ({ email, source: 'event', confidence: 'confirmed' }))
  if (explicit.length) return explicit
  const clientId = asString(input.clientId || input.client_id)
  if (!clientId) return []
  const roleTypes = asStringArray(policy.role_types || policy.roles)
  let query = db.from('angelcare360_operator_growth_contacts').select('id,email,full_name,role_type,is_primary,status').eq('client_id', clientId).eq('status', 'active')
  if (roleTypes.length) query = query.in('role_type', roleTypes)
  const { data } = await query
  const contacts = (data || []).filter((item: any) => isEmail(normalizeEmail(item.email)))
  if (!contacts.length && (context.client as any)?.primary_contact_email) return [{ email: normalizeEmail((context.client as any).primary_contact_email), source: 'client.primary_contact', confidence: 'high' }]
  return contacts.map((item: any) => ({ email: normalizeEmail(item.email), contactId: item.id, source: `contact.${item.role_type}`, confidence: 'confirmed' }))
}

export async function ingestInboundEmail(input: unknown) {
  const payload = toRecord(input)
  const senderEmail = normalizeEmail(payload.senderEmail || payload.sender_email || payload.from)
  const recipients = asStringArray(payload.recipientEmails || payload.recipient_emails || payload.to)
  const subject = asString(payload.subject).trim() || '(Sans objet)'
  if (!isEmail(senderEmail) || !recipients.length) return { ok: false, error: 'Expéditeur et destinataire inbound valides requis.' }
  const db = await createServiceClient()
  const providerMessageId = asString(payload.providerMessageId || payload.provider_message_id || payload.messageId)
  if (providerMessageId) {
    const existing = await db.from(MESSAGE_TABLE).select('id,message_reference').eq('provider_message_id', providerMessageId).eq('direction', 'inbound').maybeSingle()
    if (existing.data) return { ok: true, duplicate: true, record: existing.data }
  }
  const match = await matchInboundSender(db, senderEmail, asString(payload.threadKey || payload.thread_key), asString(payload.inReplyTo || payload.in_reply_to))
  const threadKey = asString(payload.threadKey || payload.thread_key) || match.threadKey || crypto.createHash('sha256').update(`${senderEmail}|${subject.toLowerCase()}`).digest('hex').slice(0, 24)
  const classification = classifyInbound({ subject, body: asString(payload.bodyText || payload.body_text || payload.body), recipients })
  const receivedAt = iso(payload.receivedAt || payload.received_at) || now()
  const { data, error } = await db.from(MESSAGE_TABLE).insert({
    message_reference: idRef('INB'), direction: 'inbound', thread_key: threadKey, mailbox_key: asString(payload.mailboxKey || payload.mailbox_key) || null,
    mailbox_email: recipients[0] || null, provider_message_id: providerMessageId || null, in_reply_to: asString(payload.inReplyTo || payload.in_reply_to) || null,
    subject, body_text: asString(payload.bodyText || payload.body_text || payload.body) || null, body_html: asString(payload.bodyHtml || payload.body_html) || null,
    sender_email: senderEmail, sender_name: asString(payload.senderName || payload.sender_name) || null, recipient_emails: recipients,
    cc_emails: asStringArray(payload.ccEmails || payload.cc_emails), bcc_emails: [], status: 'received', delivery_state: 'received',
    client_id: match.clientId, contact_id: match.contactId, institution_id: match.institutionId, tenant_id: match.tenantId,
    classification: classification.category, confidence: match.confidence, requires_response: classification.requiresResponse,
    response_due_at: classification.requiresResponse ? new Date(new Date(receivedAt).getTime() + classification.responseHours * 3600000).toISOString() : null,
    received_at: receivedAt, attachments: Array.isArray(payload.attachments) ? payload.attachments : [], metadata: { ...toRecord(payload.metadata), match_evidence: match.evidence, classification_evidence: classification.evidence },
  }).select('*').single()
  if (error) return { ok: false, error: error.message }
  await appendDeliveryEvent(db, data.id, 'received', { mailbox: recipients[0], provider_message_id: providerMessageId || null })
  await db.from(MATCH_TABLE).insert({ message_id: data.id, sender_email: senderEmail, client_id: match.clientId, contact_id: match.contactId, institution_id: match.institutionId, tenant_id: match.tenantId, confidence: match.confidence, evidence: match.evidence, status: match.clientId ? 'matched' : 'unmatched' })
  if (match.clientId) await linkMessageContext(db, data.id, { clientId: match.clientId, contactId: match.contactId, institutionId: match.institutionId, tenantId: match.tenantId }, null)
  if (match.replyToMessageId) {
    await db.from(MESSAGE_TABLE).update({ status: 'replied', replied_at: receivedAt }).eq('id', match.replyToMessageId)
    await appendDeliveryEvent(db, match.replyToMessageId, 'customer_replied', { inbound_message_id: data.id })
  }
  return { ok: true, record: data, match, classification }
}

async function matchInboundSender(db: any, senderEmail: string, threadKey: string, inReplyTo: string) {
  if (inReplyTo) {
    const { data } = await db.from(MESSAGE_TABLE).select('*').eq('provider_message_id', inReplyTo).maybeSingle()
    if (data) return { clientId: data.client_id || null, contactId: data.contact_id || null, institutionId: data.institution_id || null, tenantId: data.tenant_id || null, confidence: 'confirmed', evidence: ['in_reply_to'], threadKey: data.thread_key || null, replyToMessageId: data.id }
  }
  if (threadKey) {
    const { data } = await db.from(MESSAGE_TABLE).select('*').eq('thread_key', threadKey).order('created_at', { ascending: false }).limit(1)
    if (data?.[0]) return { clientId: data[0].client_id || null, contactId: data[0].contact_id || null, institutionId: data[0].institution_id || null, tenantId: data[0].tenant_id || null, confidence: 'confirmed', evidence: ['thread_key'], threadKey, replyToMessageId: data[0].direction === 'outbound' ? data[0].id : null }
  }
  const contact = await db.from('angelcare360_operator_growth_contacts').select('id,client_id,institution_name,email').ilike('email', senderEmail).eq('status','active').limit(2)
  if (contact.data?.length === 1) return { clientId: contact.data[0].client_id || null, contactId: contact.data[0].id, institutionId: null, tenantId: null, confidence: 'confirmed', evidence: ['exact_contact_email'], threadKey: null, replyToMessageId: null }
  const access = await db.from('angelcare360_operator_tenant_access_accounts').select('id,client_id,tenant_id,email').ilike('email', senderEmail).limit(2)
  if (access.data?.length === 1) return { clientId: access.data[0].client_id || null, contactId: null, institutionId: null, tenantId: access.data[0].tenant_id || null, confidence: 'confirmed', evidence: ['tenant_administrator_email'], threadKey: null, replyToMessageId: null }
  const domain = senderEmail.split('@')[1]
  if (domain) {
    const links = await db.from(MATCH_TABLE).select('client_id,contact_id,institution_id,tenant_id,sender_email').ilike('sender_email', `%@${domain}`).eq('status','matched').order('created_at',{ascending:false}).limit(5)
    const clients = [...new Set((links.data || []).map((item: any) => item.client_id).filter(Boolean))]
    if (clients.length === 1) return { clientId: clients[0], contactId: null, institutionId: null, tenantId: null, confidence: 'suggested', evidence: ['historical_domain_match'], threadKey: null, replyToMessageId: null }
  }
  return { clientId: null, contactId: null, institutionId: null, tenantId: null, confidence: 'unmatched', evidence: [], threadKey: null, replyToMessageId: null }
}

function classifyInbound(input: { subject: string; body: string; recipients: string[] }) {
  const corpus = `${input.subject} ${input.body}`.toLowerCase()
  const mailbox = input.recipients.join(' ').toLowerCase()
  const rules: Array<[string, RegExp, string[]]> = [
    ['complaint', /réclamation|plainte|mécontent|inadmissible|insatisfait|litige/, ['complaint_terms']],
    ['invoice_payment', /facture|paiement|virement|échéance|impayé|reçu/, ['finance_terms']],
    ['support_request', /support|aide|problème|erreur|bloqué|bug|incident/, ['support_terms']],
    ['tenant_access_request', /accès|mot de passe|connexion|invitation|mfa|authentification/, ['access_terms']],
    ['offer_response', /offre|proposition|devis|tarif|négociation/, ['commercial_terms']],
    ['contract_matter', /contrat|signature|avenant|clause/, ['contract_terms']],
    ['renewal', /renouvellement|reconduction|expiration/, ['renewal_terms']],
    ['training_request', /formation|academy|session|atelier/, ['training_terms']],
  ]
  for (const [category, pattern, evidence] of rules) if (pattern.test(corpus)) return { category, evidence, requiresResponse: category !== 'administrative_document', responseHours: ['complaint','support_request','tenant_access_request'].includes(category) ? 4 : 24 }
  if (mailbox.includes('support')) return { category: 'support_request', evidence: ['support_mailbox'], requiresResponse: true, responseHours: 4 }
  if (mailbox.includes('commercial') || mailbox.includes('b2b')) return { category: 'commercial_inquiry', evidence: ['commercial_mailbox'], requiresResponse: true, responseHours: 24 }
  return { category: 'general_correspondence', evidence: ['default'], requiresResponse: true, responseHours: 24 }
}

async function resolveInboundMatch(input: unknown) {
  const actor = await requireAngelcare360OperatorPermission('operator.platform.update')
  const payload = toRecord(input)
  const messageId = asString(payload.messageId || payload.id)
  const db = await getOperatorClient()
  const { data: before } = await db.from(MESSAGE_TABLE).select('*').eq('id', messageId).eq('direction','inbound').maybeSingle()
  if (!before) return { ok: false, error: 'Email inbound introuvable.' }
  const patch = { client_id: asString(payload.clientId || payload.client_id) || null, contact_id: asString(payload.contactId || payload.contact_id) || null, institution_id: asString(payload.institutionId || payload.institution_id) || null, tenant_id: asString(payload.tenantId || payload.tenant_id) || null, confidence: 'confirmed', updated_by: actor.user.id }
  const { data, error } = await db.from(MESSAGE_TABLE).update(patch).eq('id', messageId).select('*').single()
  if (error) return { ok: false, error: error.message }
  await db.from(MATCH_TABLE).update({ ...patch, status: 'matched', resolved_by: actor.user.id, resolved_at: now() }).eq('message_id', messageId)
  await linkMessageContext(db, messageId, payload, actor.user.id)
  await audit('inbound.match_resolved', MESSAGE_TABLE, messageId, { evidence: asString(payload.reason) }, before, data)
  return { ok: true, record: data }
}

async function addSuppression(input: unknown) {
  const actor = await requireAngelcare360OperatorPermission('operator.platform.update')
  const payload = toRecord(input)
  const email = normalizeEmail(payload.email)
  if (!isEmail(email)) return { ok: false, error: 'Email invalide.' }
  const db = await getOperatorClient()
  const { data, error } = await db.from(SUPPRESSION_TABLE).upsert({ email, scope: asString(payload.scope,'global'), client_id: asString(payload.clientId || payload.client_id) || null, reason: asString(payload.reason,'manual'), status: 'active', created_by: actor.user.id }, { onConflict: 'email,scope,client_id' }).select('*').single()
  if (error) return { ok: false, error: error.message }
  await audit('suppression.created', SUPPRESSION_TABLE, data.id, { email, reason: data.reason }, null, data)
  return { ok: true, record: data }
}

export async function executeEmailCommandOperation(operation: string, payload: Record<string, unknown>) {
  const handlers: Record<string, (value: unknown) => Promise<unknown>> = {
    'rule.upsert': upsertRule,
    'rule.status': setRuleStatus,
    'template.upsert': upsertTemplate,
    'message.compose': composeMessage,
    'message.send': sendMessage,
    'message.update': updateMessage,
    'approval.decide': decideApproval,
    'event.publish': publishBusinessEvent,
    'inbound.match': resolveInboundMatch,
    'suppression.create': addSuppression,
  }
  const handler = handlers[operation]
  if (!handler) return { ok: false, error: 'Opération Email Command inconnue.' }
  return handler(payload)
}

async function sendStoredMessageAsSystem(db: any, message: any) {
  const suppressed = await findSuppressedRecipient(db, message.recipient_emails || [])
  if (suppressed) {
    await db.from(MESSAGE_TABLE).update({ status: 'cancelled', delivery_state: 'suppressed', failure_reason: `Recipient suppressed: ${suppressed.email}` }).eq('id', message.id)
    await appendDeliveryEvent(db, message.id, 'suppressed', { email: suppressed.email, reason: suppressed.reason || null })
    return { ok: false, skipped: true, error: `Destinataire supprimé: ${suppressed.email}.` }
  }
  const demoSafety = await assertExternalSideEffectAllowed({ channel: 'email', operation: 'email.send.worker', tenantId: message.tenant_id, metadata: { operator_message_id: message.id } })
  if (!demoSafety.allowed) {
    const { data } = await db.from(MESSAGE_TABLE).update({ status: 'smtp_accepted', delivery_state: 'simulated_demo_safe', provider_message_id: `demo-simulated:${message.id}`, sent_at: now(), next_retry_at: null }).eq('id', message.id).select('*').single()
    await appendDeliveryEvent(db, message.id, 'worker.simulated_demo_safe', { code: demoSafety.code })
    return { ok: true, simulated: true, code: demoSafety.code, record: data }
  }
  const mailboxes = [...await listEmailOSMultiMailboxesFromDb().catch(() => []), ...listEmailOSMultiMailboxes()]
  const mailbox = mailboxes.find((item) => item.key === message.mailbox_key || item.email === message.mailbox_email) || mailboxes.find((item) => item.key === 'B2B') || mailboxes[0]
  if (!mailbox) return { ok: false, error: 'Aucune boîte Email OS configurée.' }
  const attempt = numberValue(message.attempt_count) + 1
  await db.from(MESSAGE_TABLE).update({ status: 'bridge_processing', delivery_state: 'bridge_processing', attempt_count: attempt, last_attempt_at: now() }).eq('id', message.id)
  await appendDeliveryEvent(db, message.id, 'worker.bridge_processing', { mailbox: mailbox.email, attempt })
  try {
    const result = await sendEmailOSDirect({
      mailboxId: mailbox.mailboxId || mailboxIdFromEmail(mailbox.email), fromEmail: mailbox.email,
      toEmail: (message.recipient_emails || []).join(','), ccEmail: (message.cc_emails || []).join(',') || null,
      bccEmail: (message.bcc_emails || []).join(',') || null, subject: message.subject, body: message.body_text || '',
      bodyText: message.body_text || '', bodyHtml: message.body_html || null,
      headers: message.thread_key ? { 'X-AngelCare-Thread': message.thread_key } : undefined,
      attachments: message.attachments || [],
    })
    const providerMessageId = result.info?.messageId || null
    const { data } = await db.from(MESSAGE_TABLE).update({ status: 'smtp_accepted', delivery_state: 'smtp_accepted', provider_message_id: providerMessageId, mailbox_email: mailbox.email, sent_at: now(), failure_reason: null, next_retry_at: null }).eq('id', message.id).select('*').single()
    await appendDeliveryEvent(db, message.id, 'worker.smtp_accepted', { provider_message_id: providerMessageId, accepted: result.info?.accepted || [], rejected: result.info?.rejected || [], bridge: Boolean(result.info?.bridge) })
    return { ok: true, record: data }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Email OS worker send failed.'
    const permanent = attempt >= Math.max(1, numberValue(toRecord(message.metadata).max_attempts, 3))
    const status = permanent ? 'permanently_failed' : 'retry_scheduled'
    const nextRetry = permanent ? null : new Date(Date.now() + Math.min(3600000, attempt * 5 * 60000)).toISOString()
    const { data } = await db.from(MESSAGE_TABLE).update({ status, delivery_state: 'failed', failure_reason: errorMessage, next_retry_at: nextRetry }).eq('id', message.id).select('*').single()
    await appendDeliveryEvent(db, message.id, 'worker.failed', { error: errorMessage, attempt, next_retry_at: nextRetry })
    return { ok: false, error: errorMessage, record: data }
  }
}

export async function dispatchDueEmailCommandMessages(limit = 100) {
  const db = await createServiceClient()
  const current = now()
  const batchLimit = Math.max(1, Math.min(250, Number(limit) || 100))
  const { data, error } = await db.from(MESSAGE_TABLE).select('*').in('status', ['queued','approved','scheduled','retry_scheduled']).or(`scheduled_at.is.null,scheduled_at.lte.${current}`).or(`next_retry_at.is.null,next_retry_at.lte.${current}`).order('created_at', { ascending: true }).limit(batchLimit)
  if (error) return { ok: false, error: error.message, outcomes: [] }
  const outcomes: Array<Record<string, unknown>> = []
  for (const message of data || []) outcomes.push({ messageId: message.id, ...(await sendStoredMessageAsSystem(db, message)) })
  return { ok: outcomes.every((item) => item.ok || item.skipped), processed: outcomes.length, outcomes }
}
