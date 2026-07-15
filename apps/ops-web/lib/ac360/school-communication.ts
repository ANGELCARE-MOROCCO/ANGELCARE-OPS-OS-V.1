import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { buildAc360IdempotencyKey, runAc360WiredAction } from './action-wiring'
import { resolveAc360SchoolOpsContext } from './school-ops'

export type Ac360SchoolCommunicationPayload = Record<string, unknown>

type CommunicationWiringKey =
  | 'ac360.school_communication.template.upsert'
  | 'ac360.school_communication.template.render'
  | 'ac360.school_communication.campaign.create'
  | 'ac360.school_communication.campaign.enqueue'
  | 'ac360.school_communication.email.dispatch'
  | 'ac360.school_communication.whatsapp.dispatch'
  | 'ac360.school_communication.sms.dispatch'
  | 'ac360.school_communication.push.dispatch'
  | 'ac360.school_communication.delivery.record'
  | 'ac360.school_communication.preference.update'
  | 'ac360.school_communication.thread.open'
  | 'ac360.school_communication.thread.reply'
  | 'ac360.school_communication.notification.mark_read'
  | 'ac360.school_communication.alert.resolve'

function cleanMetadata(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function arr(value: unknown) {
  return Array.isArray(value) ? value : []
}

function text(value: unknown, fallback = '') {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

function num(value: unknown, fallback = 1) {
  const parsed = Number(value ?? fallback)
  return Number.isFinite(parsed) ? parsed : fallback
}

async function currentActorId() {
  const user = await getCurrentUser().catch(() => null) as any
  return user?.id || null
}

function channelDispatchWiring(channel: unknown): CommunicationWiringKey {
  const normalized = text(channel, 'email').toLowerCase()
  if (normalized === 'whatsapp') return 'ac360.school_communication.whatsapp.dispatch'
  if (normalized === 'sms') return 'ac360.school_communication.sms.dispatch'
  if (normalized === 'push' || normalized === 'internal') return 'ac360.school_communication.push.dispatch'
  return 'ac360.school_communication.email.dispatch'
}

async function executeCommunicationRpc(
  wiringKey: CommunicationWiringKey,
  body: Ac360SchoolCommunicationPayload,
  rpcName: string,
  rpcArgs: Record<string, unknown>,
  metadata: Record<string, unknown> = {},
  quantity = 1,
) {
  const resolved = await resolveAc360SchoolOpsContext(String(body.orgId || body.org_id || '') || undefined)
  if (!resolved.ok) return resolved

  const idempotencySeed = body.idempotencyKey || body.idempotency_key || `${resolved.orgId}:${wiringKey}:${body.templateKey || body.template_key || body.campaignId || body.campaign_id || body.recipientId || body.recipient_id || body.threadId || body.thread_id || body.notificationId || body.notification_id || body.alertId || body.alert_id || Date.now()}`

  const guarded = await runAc360WiredAction(wiringKey, async () => {
    const db = await createClient()
    const { data, error } = await db.rpc(rpcName, { ...rpcArgs, p_org_id: resolved.orgId } as any)
    if (error) return { ok: false, status: 500, error: error.message || `AC360 communication RPC failed: ${rpcName}` }
    return { ok: true, status: 200, data }
  }, {
    orgId: resolved.orgId,
    quantity: Math.max(1, Math.ceil(quantity || 1)),
    idempotencyKey: buildAc360IdempotencyKey(wiringKey, idempotencySeed),
    metadata: {
      source: 'lib.ac360.school-communication',
      phase: 'phase_2e_communication_messaging_notifications',
      uiBuildAllowed: false,
      rpcName,
      ...metadata,
    },
  })

  if (!guarded.ok) {
    return { ok: false, status: 402, error: guarded.error || guarded.guard.reason || 'AC360 guard blocked communication action.', ac360: { guard: guarded.guard, blocked: true } }
  }

  return { ...(guarded.data as any), ac360: { guard: guarded.guard, usage: guarded.usage } }
}

export async function getAc360SchoolCommunicationDashboard(orgId?: string, campusId?: string | null, asOfDate?: string | null) {
  const resolved = await resolveAc360SchoolOpsContext(orgId)
  if (!resolved.ok) return resolved
  const db = await createClient()
  const { data, error } = await db.rpc('ac360_school_communication_dashboard', {
    p_org_id: resolved.orgId,
    p_campus_id: campusId || null,
    p_as_of_date: asOfDate || null,
  } as any)
  if (error) return { ok: false as const, status: 500, error: error.message || 'Unable to load AC360 school communication dashboard.' }
  return { ok: true as const, context: resolved.context, dashboard: data }
}

export async function upsertAc360MessageTemplate(body: Ac360SchoolCommunicationPayload) {
  const actorId = await currentActorId()
  return executeCommunicationRpc('ac360.school_communication.template.upsert', body, 'ac360_school_upsert_message_template', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_template_key: body.templateKey || body.template_key || null,
    p_label: body.label || body.name || null,
    p_template_type: text(body.templateType || body.template_type, 'announcement'),
    p_channel: text(body.channel, 'email'),
    p_audience_type: text(body.audienceType || body.audience_type, 'parents'),
    p_language_code: text(body.languageCode || body.language_code, 'fr'),
    p_subject_template: body.subjectTemplate || body.subject_template || body.subject || null,
    p_body_template: body.bodyTemplate || body.body_template || body.body || null,
    p_status: text(body.status, 'draft'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { communicationAction: 'template.upsert' })
}

export async function renderAc360MessageTemplate(body: Ac360SchoolCommunicationPayload) {
  return executeCommunicationRpc('ac360.school_communication.template.render', body, 'ac360_school_render_message_template', {
    p_template_key: body.templateKey || body.template_key,
    p_variables: cleanMetadata(body.variables || body.variables_json),
  }, { communicationAction: 'template.render' })
}

export async function createAc360MessageCampaign(body: Ac360SchoolCommunicationPayload) {
  const actorId = await currentActorId()
  return executeCommunicationRpc('ac360.school_communication.campaign.create', body, 'ac360_school_create_message_campaign', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_template_key: body.templateKey || body.template_key || null,
    p_campaign_code: body.campaignCode || body.campaign_code || null,
    p_campaign_type: text(body.campaignType || body.campaign_type, 'announcement'),
    p_channel: text(body.channel, 'email'),
    p_audience_type: text(body.audienceType || body.audience_type, 'parents'),
    p_title: body.title || null,
    p_subject: body.subject || null,
    p_body: body.body || null,
    p_variables: cleanMetadata(body.variables || body.variables_json),
    p_scheduled_at: body.scheduledAt || body.scheduled_at || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { communicationAction: 'campaign.create' })
}

export async function enqueueAc360CampaignRecipients(body: Ac360SchoolCommunicationPayload) {
  const actorId = await currentActorId()
  const recipients = arr(body.recipients)
  const quantity = recipients.length || num(body.recipientCount || body.recipient_count || body.quantity, 1)
  return executeCommunicationRpc('ac360.school_communication.campaign.enqueue', body, 'ac360_school_enqueue_campaign_recipients', {
    p_campaign_id: body.campaignId || body.campaign_id,
    p_recipients: recipients,
    p_class_id: body.classId || body.class_id || null,
    p_student_id: body.studentId || body.student_id || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { communicationAction: 'campaign.enqueue', recipientCount: quantity }, quantity)
}

export async function dispatchAc360CampaignBatch(body: Ac360SchoolCommunicationPayload) {
  const actorId = await currentActorId()
  const limit = Math.max(1, Math.min(num(body.limit || body.batchLimit || body.batch_limit, 100), 1000))
  const wiringKey = channelDispatchWiring(body.channel)
  return executeCommunicationRpc(wiringKey, body, 'ac360_school_dispatch_campaign_batch', {
    p_campaign_id: body.campaignId || body.campaign_id,
    p_limit: limit,
    p_provider_key: text(body.providerKey || body.provider_key, 'internal_stub'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { communicationAction: 'campaign.dispatch', channel: text(body.channel, 'email'), batchLimit: limit }, num(body.quantity || body.recipientCount || body.recipient_count || limit, limit))
}

export async function recordAc360DeliveryEvent(body: Ac360SchoolCommunicationPayload) {
  return executeCommunicationRpc('ac360.school_communication.delivery.record', body, 'ac360_school_record_delivery_event', {
    p_recipient_id: body.recipientId || body.recipient_id,
    p_event_type: text(body.eventType || body.event_type, 'provider_callback'),
    p_provider_key: text(body.providerKey || body.provider_key, 'internal_stub'),
    p_provider_message_id: body.providerMessageId || body.provider_message_id || null,
    p_error_message: body.errorMessage || body.error_message || null,
    p_event_payload: cleanMetadata(body.eventPayload || body.event_payload || body.metadata || body.metadata_json),
  }, { communicationAction: 'delivery.record' })
}

export async function updateAc360NotificationPreference(body: Ac360SchoolCommunicationPayload) {
  const actorId = await currentActorId()
  return executeCommunicationRpc('ac360.school_communication.preference.update', body, 'ac360_school_update_notification_preference', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_recipient_type: text(body.recipientType || body.recipient_type, 'guardian'),
    p_recipient_id: body.recipientId || body.recipient_id || body.guardianId || body.guardian_id || null,
    p_channel: text(body.channel, 'whatsapp'),
    p_is_enabled: body.isEnabled ?? body.is_enabled ?? true,
    p_consent_status: text(body.consentStatus || body.consent_status, 'explicit'),
    p_language_code: text(body.languageCode || body.language_code, 'fr'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { communicationAction: 'preference.update' })
}

export async function openAc360CommunicationThread(body: Ac360SchoolCommunicationPayload) {
  const actorId = await currentActorId()
  return executeCommunicationRpc('ac360.school_communication.thread.open', body, 'ac360_school_open_communication_thread', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_thread_type: text(body.threadType || body.thread_type, 'parent_conversation'),
    p_subject: body.subject || body.title || null,
    p_guardian_id: body.guardianId || body.guardian_id || null,
    p_student_id: body.studentId || body.student_id || null,
    p_assigned_staff_id: body.assignedStaffId || body.assigned_staff_id || null,
    p_priority: text(body.priority, 'normal'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { communicationAction: 'thread.open' })
}

export async function postAc360ThreadMessage(body: Ac360SchoolCommunicationPayload) {
  const actorId = await currentActorId()
  return executeCommunicationRpc('ac360.school_communication.thread.reply', body, 'ac360_school_post_thread_message', {
    p_thread_id: body.threadId || body.thread_id,
    p_sender_type: text(body.senderType || body.sender_type, 'staff'),
    p_sender_id: body.senderId || body.sender_id || actorId,
    p_channel: text(body.channel, 'internal'),
    p_body: body.body || body.message || null,
    p_attachments: Array.isArray(body.attachments) ? body.attachments : [],
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { communicationAction: 'thread.reply' })
}

export async function markAc360ParentNotificationRead(body: Ac360SchoolCommunicationPayload) {
  return executeCommunicationRpc('ac360.school_communication.notification.mark_read', body, 'ac360_school_mark_parent_notification_read', {
    p_notification_id: body.notificationId || body.notification_id,
    p_acknowledge: body.acknowledge || body.acknowledged || false,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { communicationAction: 'notification.mark_read' })
}

export async function resolveAc360CommunicationAlert(body: Ac360SchoolCommunicationPayload) {
  const actorId = await currentActorId()
  return executeCommunicationRpc('ac360.school_communication.alert.resolve', body, 'ac360_school_resolve_communication_alert', {
    p_alert_id: body.alertId || body.alert_id,
    p_resolution_note: body.resolutionNote || body.resolution_note || body.note || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { communicationAction: 'alert.resolve' })
}
