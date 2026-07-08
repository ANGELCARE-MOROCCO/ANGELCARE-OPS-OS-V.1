import { createClient } from '@/lib/supabase/server'
import { getAngelcare360AccessContext, requireAngelcare360Permission } from './context'
import { recordAngelcare360AuditEventServer } from './audit'
import {
  angelcare360InternalNotificationCreateSchema,
  angelcare360NotificationArchiveSchema,
  angelcare360NotificationAuditQueryFiltersSchema,
  angelcare360NotificationReadSchema,
} from '@/lib/angelcare360/validation'
import type { Angelcare360AuditRecord } from '@/types/angelcare360/audit'
import type {
  Angelcare360NotificationChannelReadinessRecord,
  Angelcare360NotificationRecord,
} from '@/types/angelcare360/communications'
import type {
  Angelcare360InternalNotificationCreateInput,
  Angelcare360NotificationAuditQueryFiltersInput,
} from '@/lib/angelcare360/validation'

type Row = Record<string, any>
type AccessContext = NonNullable<Awaited<ReturnType<typeof getAngelcare360AccessContext>>>
type SchoolAccessContext = Omit<AccessContext, 'school'> & {
  school: NonNullable<AccessContext['school']>
}

const MODULE = 'notifications'
const WHATSAPP_LOCK = 'L’envoi WhatsApp sera activé après configuration d’un fournisseur officiel.'
const SMS_LOCK = 'L’envoi SMS nécessite une passerelle SMS configurée.'
const EMAIL_LOCK = 'L’envoi email externe nécessite une infrastructure email validée.'
const PUSH_LOCK = 'Les notifications push seront activées dans une phase dédiée.'

function asString(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value)
}

function nowIso() {
  return new Date().toISOString()
}

async function getContextOrThrow(permissionKey: string, schoolId?: string | null): Promise<SchoolAccessContext> {
  const context = await requireAngelcare360Permission(permissionKey, { schoolId })
  if (!context || !context.school) {
    throw new Error('Aucun établissement actif n’est disponible.')
  }
  return context as SchoolAccessContext
}

async function auditNotificationEvent(input: {
  action: string
  severity?: 'debug' | 'info' | 'notice' | 'warning' | 'critical'
  schoolId: string
  entityType: string
  entityId: string
  beforeData?: Record<string, unknown>
  afterData?: Record<string, unknown>
  metadata?: Record<string, unknown>
}) {
  return recordAngelcare360AuditEventServer({
    category: 'notifications',
    module: MODULE,
    action: input.action,
    schoolId: input.schoolId,
    entityType: input.entityType,
    entityId: input.entityId,
    severity: input.severity || 'info',
    beforeData: input.beforeData,
    afterData: input.afterData,
    metadata: input.metadata,
  })
}

function mapNotification(row: Row): Angelcare360NotificationRecord {
  return {
    id: asString(row.id),
    school_id: asString(row.school_id),
    notification_code: asString(row.notification_code),
    recipient_app_user_id: row.recipient_app_user_id ? asString(row.recipient_app_user_id) : null,
    recipient_role: row.recipient_role ? asString(row.recipient_role) : null,
    channel: row.channel ? asString(row.channel) : null,
    title: asString(row.title),
    body: asString(row.body),
    action_href: row.action_href ? asString(row.action_href) : null,
    scheduled_for: row.scheduled_for ? asString(row.scheduled_for) : null,
    sent_at: row.sent_at ? asString(row.sent_at) : null,
    read_at: row.read_at ? asString(row.read_at) : null,
    status: asString(row.status),
  }
}

export async function getAngelcare360NotificationOverview(options?: { schoolId?: string | null }) {
  const context = await getContextOrThrow('notifications.view', options?.schoolId)
  const supabase = await createClient()
  const [records, unread, blocked, audit, channelReadiness] = await Promise.all([
    supabase.from('angelcare360_notifications').select('id,status,read_at').eq('school_id', context.school.id),
    supabase.from('angelcare360_notifications').select('id', { count: 'exact', head: true }).eq('school_id', context.school.id).eq('status', 'scheduled'),
    supabase.from('angelcare360_notifications').select('id', { count: 'exact', head: true }).eq('school_id', context.school.id).eq('status', 'blocked_external'),
    supabase.from('angelcare360_audit_logs').select('id').eq('school_id', context.school.id).eq('module', 'notifications').order('created_at', { ascending: false }).limit(20),
    getAngelcare360NotificationChannelReadiness({ schoolId: context.school.id }),
  ])

  return {
    schoolId: context.school.id,
    schoolName: context.school.name,
    totalNotifications: records.data?.length || 0,
    unreadNotifications: (records.data || []).filter((row) => !row.read_at && row.status !== 'archived').length,
    blockedExternalCount: blocked.count || 0,
    scheduledCount: unread.count || 0,
    channelReadiness,
    risks: [
      (records.data || []).some((row) => row.status === 'blocked_external') ? 'Des notifications externes sont bloquées.' : null,
      !(records.data || []).some((row) => !row.read_at) ? null : 'Des notifications internes restent non lues.',
      channelReadiness.email.status !== 'ready_later' ? null : 'Le canal email externe n’est pas configuré.',
    ].filter(Boolean) as string[],
    recentAudit: (audit.data || []) as Angelcare360AuditRecord[],
  }
}

export async function listAngelcare360InternalNotifications(options?: { schoolId?: string | null }) {
  const context = await getContextOrThrow('notifications.view', options?.schoolId)
  const supabase = await createClient()
  const { data, error } = await supabase.from('angelcare360_notifications').select('*').eq('school_id', context.school.id).order('created_at', { ascending: false }).limit(200)
  if (error) throw new Error(error.message)
  return (data || []).map(mapNotification)
}

export async function createAngelcare360InternalNotification(input: Record<string, unknown>) {
  const parsed = angelcare360InternalNotificationCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'La notification est invalide.' }
  const context = await getContextOrThrow('notifications.create', parsed.data.schoolId)
  const supabase = await createClient()
  const { data, error } = await supabase.from('angelcare360_notifications').insert({
    school_id: context.school.id,
    notification_code: parsed.data.notificationCode,
    recipient_app_user_id: parsed.data.recipientAppUserId || null,
    recipient_student_id: parsed.data.recipientStudentId || null,
    recipient_parent_id: parsed.data.recipientParentId || null,
    recipient_staff_id: parsed.data.recipientStaffId || null,
    recipient_role: parsed.data.recipientRole || null,
    channel: parsed.data.channel || 'in_app',
    title: parsed.data.title,
    body: parsed.data.body,
    action_href: parsed.data.actionHref || null,
    scheduled_for: parsed.data.scheduledFor || null,
    sent_at: parsed.data.status === 'pending' ? null : nowIso(),
    read_at: null,
    status: parsed.data.status || 'delivered_internal',
    metadata_json: { source: 'phase12' },
  }).select('*').maybeSingle()
  if (error || !data) return { ok: false, error: error?.message || 'Impossible de créer la notification.' }
  await auditNotificationEvent({
    action: 'notification.created_internal',
    schoolId: context.school.id,
    entityType: 'angelcare360_notifications',
    entityId: data.id,
    afterData: data,
  })
  return { ok: true, data: mapNotification(data) }
}

export async function markAngelcare360NotificationRead(input: Record<string, unknown>) {
  const parsed = angelcare360NotificationReadSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'La lecture de notification est invalide.' }
  const context = await getContextOrThrow('notifications.update', parsed.data.schoolId)
  const supabase = await createClient()
  const { data: before } = await supabase.from('angelcare360_notifications').select('*').eq('id', parsed.data.id).eq('school_id', context.school.id).maybeSingle()
  const { data, error } = await supabase.from('angelcare360_notifications').update({ status: 'read', read_at: nowIso() }).eq('id', parsed.data.id).eq('school_id', context.school.id).select('*').maybeSingle()
  if (error || !data) return { ok: false, error: error?.message || 'Notification introuvable.' }
  await auditNotificationEvent({
    action: 'notification.read',
    schoolId: context.school.id,
    entityType: 'angelcare360_notifications',
    entityId: data.id,
    beforeData: before || {},
    afterData: data,
  })
  return { ok: true, data: mapNotification(data) }
}

export async function archiveAngelcare360Notification(input: Record<string, unknown>) {
  const parsed = angelcare360NotificationArchiveSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'L’archivage de notification est invalide.' }
  const context = await getContextOrThrow('notifications.update', parsed.data.schoolId)
  const supabase = await createClient()
  const { data: before } = await supabase.from('angelcare360_notifications').select('*').eq('id', parsed.data.id).eq('school_id', context.school.id).maybeSingle()
  const { data, error } = await supabase.from('angelcare360_notifications').update({ status: 'archived' }).eq('id', parsed.data.id).eq('school_id', context.school.id).select('*').maybeSingle()
  if (error || !data) return { ok: false, error: error?.message || 'Notification introuvable.' }
  await auditNotificationEvent({
    action: 'notification.archived',
    severity: 'warning',
    schoolId: context.school.id,
    entityType: 'angelcare360_notifications',
    entityId: data.id,
    beforeData: before || {},
    afterData: data,
  })
  return { ok: true, data: mapNotification(data) }
}

export async function getAngelcare360NotificationChannelReadiness(options?: { schoolId?: string | null }) {
  const context = await getContextOrThrow('notifications.view', options?.schoolId)
  const readiness: Angelcare360NotificationChannelReadinessRecord = {
    email: { status: 'not_configured', reason: EMAIL_LOCK },
    sms: { status: 'not_configured', reason: SMS_LOCK },
    whatsapp: { status: 'locked', reason: WHATSAPP_LOCK },
    push: { status: 'ready_later', reason: PUSH_LOCK },
  }
  await auditNotificationEvent({
    action: 'notification_channel.readiness_checked',
    severity: 'notice',
    schoolId: context.school.id,
    entityType: 'angelcare360_notifications',
    entityId: context.school.id,
    afterData: readiness as unknown as Record<string, unknown>,
  })
  return readiness
}

export async function listAngelcare360NotificationHistory(options?: { schoolId?: string | null }) {
  return listAngelcare360InternalNotifications(options)
}

export async function listAngelcare360NotificationAuditEvents(options?: { schoolId?: string | null; filters?: Partial<Angelcare360NotificationAuditQueryFiltersInput> }) {
  const context = await getContextOrThrow('audit.view', options?.schoolId)
  const parsed = angelcare360NotificationAuditQueryFiltersSchema.safeParse(options?.filters || {})
  if (!parsed.success) throw new Error(parsed.errors[0]?.message || 'Les filtres d’audit notifications sont invalides.')
  const supabase = await createClient()
  let query = supabase.from('angelcare360_audit_logs').select('*').eq('school_id', context.school.id).eq('module', 'notifications').order('created_at', { ascending: false }).limit(200)
  if (parsed.data.action) query = query.eq('action', parsed.data.action)
  if (parsed.data.severity) query = query.eq('severity', parsed.data.severity)
  if (parsed.data.entityType) query = query.eq('entity_type', parsed.data.entityType)
  if (parsed.data.entityId) query = query.eq('entity_id', parsed.data.entityId)
  if (parsed.data.actorUserId) query = query.eq('actor_user_id', parsed.data.actorUserId)
  if (parsed.data.recipientRole) query = query.eq('metadata->recipientRole', parsed.data.recipientRole)
  if (parsed.data.search) query = query.or(`module.ilike.%${parsed.data.search}%,action.ilike.%${parsed.data.search}%,entity_type.ilike.%${parsed.data.search}%`)
  if (parsed.data.from) query = query.gte('created_at', parsed.data.from)
  if (parsed.data.to) query = query.lte('created_at', parsed.data.to)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data || []) as Angelcare360AuditRecord[]
}

export async function blockAngelcare360NotificationExternalChannel(options?: { schoolId?: string | null; channel?: string | null; reason?: string | null }) {
  const context = await getContextOrThrow('notifications.view', options?.schoolId)
  await auditNotificationEvent({
    action: 'notification_external.blocked_not_configured',
    severity: 'warning',
    schoolId: context.school.id,
    entityType: 'angelcare360_notifications',
    entityId: context.school.id,
    metadata: {
      channel: options?.channel || 'external',
      reason: options?.reason || EMAIL_LOCK,
      whatsapp: WHATSAPP_LOCK,
      sms: SMS_LOCK,
      push: PUSH_LOCK,
    },
  })
  return { ok: true, blocked: true, reason: options?.reason || EMAIL_LOCK }
}
