import { createClient } from '@/lib/supabase/server'
import { getAngelcare360AccessContext, requireAngelcare360Permission } from './context'
import { recordAngelcare360AuditEventServer } from './audit'
import { getAngelcare360NotificationChannelReadiness } from './notifications'
import {
  angelcare360AnnouncementCreateSchema,
  angelcare360AnnouncementPublishInternalSchema,
  angelcare360AnnouncementUpdateSchema,
  angelcare360CommunicationAuditQueryFiltersSchema,
  angelcare360ConversationArchiveSchema,
  angelcare360ConversationCreateSchema,
  angelcare360InternalMessageCreateSchema,
  angelcare360MessageReadSchema,
  angelcare360MessageTemplateCreateSchema,
  angelcare360MessageTemplateUpdateSchema,
  type Angelcare360CommunicationAuditQueryFiltersInput,
  type Angelcare360ConversationArchiveInput,
  type Angelcare360ConversationCreateInput,
  type Angelcare360InternalMessageCreateInput,
  type Angelcare360MessageReadInput,
  type Angelcare360MessageTemplateCreateInput,
} from '@/lib/angelcare360/validation'
import type { Angelcare360AuditRecord } from '@/types/angelcare360/audit'
import type {
  Angelcare360AnnouncementRecord,
  Angelcare360AudienceReadinessRecord,
  Angelcare360ConversationParticipantRecord,
  Angelcare360ConversationRecord,
  Angelcare360MessageRecord,
  Angelcare360MessageRecipientRecord,
  Angelcare360MessageTemplateRecord,
  Angelcare360NotificationChannelReadinessRecord,
  Angelcare360NotificationRecord,
} from '@/types/angelcare360/communications'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>
type AccessContext = NonNullable<Awaited<ReturnType<typeof getAngelcare360AccessContext>>>
type SchoolAccessContext = Omit<AccessContext, 'school'> & {
  school: NonNullable<AccessContext['school']>
}
type Row = Record<string, any>

const MODULE = 'messaging'
const BLOCKED_EXTERNAL_CHANNEL_MESSAGE = 'L’envoi WhatsApp sera activé après configuration d’un fournisseur officiel.'
const BLOCKED_SMS_MESSAGE = 'L’envoi SMS nécessite une passerelle SMS configurée.'
const BLOCKED_EMAIL_MESSAGE = 'L’envoi email externe nécessite une infrastructure email validée.'
const BLOCKED_PUSH_MESSAGE = 'Les notifications push seront activées dans une phase dédiée.'

function asString(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value)
}

function asOptionalString(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  return typeof value === 'string' ? value.trim() : String(value)
}

function asOptionalStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
  }

  if (typeof value === 'string' && value.trim() !== '') {
    return value.split(',').map((item) => item.trim()).filter(Boolean)
  }

  return []
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

async function auditCommunicationEvent(input: {
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
    category: 'communication',
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

function mapConversation(row: Row, extras?: { participantCount?: number; messageCount?: number; unreadCount?: number }) {
  const conversation: Angelcare360ConversationRecord & { participant_count: number; message_count: number; unread_count: number } = {
    id: asString(row.id),
    school_id: asString(row.school_id),
    conversation_code: asString(row.conversation_code),
    subject: asString(row.subject),
    status: asString(row.status),
    last_message_at: row.last_message_at ? asString(row.last_message_at) : null,
    archived_at: row.archived_at ? asString(row.archived_at) : null,
    participant_count: extras?.participantCount || 0,
    message_count: extras?.messageCount || 0,
    unread_count: extras?.unreadCount || 0,
  }
  return conversation
}

function mapParticipant(row: Row): Angelcare360ConversationParticipantRecord {
  return {
    id: asString(row.id),
    school_id: asString(row.school_id),
    conversation_id: asString(row.conversation_id),
    participant_app_user_id: row.participant_app_user_id ? asString(row.participant_app_user_id) : null,
    participant_student_id: row.participant_student_id ? asString(row.participant_student_id) : null,
    participant_parent_id: row.participant_parent_id ? asString(row.participant_parent_id) : null,
    participant_staff_id: row.participant_staff_id ? asString(row.participant_staff_id) : null,
    participant_role: row.participant_role ? asString(row.participant_role) : null,
    read_at: row.read_at ? asString(row.read_at) : null,
    status: asString(row.status),
  }
}

function mapMessage(row: Row, extras?: { recipientCount?: number; readCount?: number }) {
  const message: Angelcare360MessageRecord & { recipient_count: number; read_count: number } = {
    id: asString(row.id),
    school_id: asString(row.school_id),
    message_code: asString(row.message_code),
    conversation_id: row.conversation_id ? asString(row.conversation_id) : null,
    subject: asString(row.subject),
    body: asString(row.body),
    status: asString(row.status),
    sender_app_user_id: row.sender_app_user_id ? asString(row.sender_app_user_id) : null,
    sent_at: row.sent_at ? asString(row.sent_at) : null,
    recipient_count: extras?.recipientCount || 0,
    read_count: extras?.readCount || 0,
  }
  return message
}

function mapAnnouncement(row: Row): Angelcare360AnnouncementRecord {
  return {
    id: asString(row.id),
    school_id: asString(row.school_id),
    announcement_code: asString(row.announcement_code),
    academic_year_id: row.academic_year_id ? asString(row.academic_year_id) : null,
    title: asString(row.title),
    body: asString(row.body),
    audience: row.audience ? asString(row.audience) : null,
    published_at: row.published_at ? asString(row.published_at) : null,
    expires_at: row.expires_at ? asString(row.expires_at) : null,
    status: asString(row.status),
  }
}

function mapTemplate(row: Row): Angelcare360MessageTemplateRecord {
  return {
    id: asString(row.id),
    school_id: asString(row.school_id),
    template_code: asString(row.template_code),
    channel: asString(row.channel),
    name: asString(row.name),
    content: asString(row.content),
    audience_type: row.audience_type ? asString(row.audience_type) : null,
    status: asString(row.status),
  }
}

async function getSchoolCounts(client: SupabaseClient, schoolId: string) {
  const [
    parents,
    teachers,
    staff,
    students,
    classes,
    sections,
    selectedAudiences,
  ] = await Promise.all([
    client.from('angelcare360_parents').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('status', 'active'),
    client.from('angelcare360_staff').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('status', 'active').in('staff_type', ['enseignant', 'teacher']),
    client.from('angelcare360_staff').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('staff_type', 'personnel').eq('status', 'active'),
    client.from('angelcare360_students').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('status', 'active'),
    client.from('angelcare360_classes').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('status', 'active'),
    client.from('angelcare360_sections').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('status', 'active'),
    client.from('angelcare360_announcements').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('status', 'published_internal'),
  ])

  return {
    parents: parents.count || 0,
    teachers: teachers.count || 0,
    staff: staff.count || 0,
    students: students.count || 0,
    classes: classes.count || 0,
    sections: sections.count || 0,
    selectedAudiences: selectedAudiences.count || 0,
  }
}

async function buildConversationCounts(client: SupabaseClient, conversationIds: string[]) {
  if (!conversationIds.length) return new Map<string, { participantCount: number; messageCount: number; unreadCount: number }>()

  const [participants, messages, recipients] = await Promise.all([
    client.from('angelcare360_conversation_participants').select('conversation_id,id,status').in('conversation_id', conversationIds),
    client.from('angelcare360_messages').select('id,conversation_id').in('conversation_id', conversationIds),
    client.from('angelcare360_message_recipients').select('message_id,delivery_status,read_at,status').in('message_id', (await client.from('angelcare360_messages').select('id').in('conversation_id', conversationIds)).data?.map((row) => row.id) || []),
  ])

  const messageConversationMap = new Map<string, string>()
  ;(messages.data || []).forEach((row) => {
    messageConversationMap.set(String(row.id), String(row.conversation_id))
  })

  const counts = new Map<string, { participantCount: number; messageCount: number; unreadCount: number }>()
  for (const conversationId of conversationIds) {
    counts.set(conversationId, { participantCount: 0, messageCount: 0, unreadCount: 0 })
  }

  for (const row of participants.data || []) {
    const conversationId = String(row.conversation_id)
    const bucket = counts.get(conversationId)
    if (bucket) bucket.participantCount += 1
  }

  for (const row of messages.data || []) {
    const conversationId = String(row.conversation_id)
    const bucket = counts.get(conversationId)
    if (bucket) bucket.messageCount += 1
  }

  for (const row of recipients.data || []) {
    const messageId = String(row.message_id)
    const conversationId = messageConversationMap.get(messageId)
    if (!conversationId) continue
    const bucket = counts.get(conversationId)
    if (bucket && !row.read_at && row.status !== 'archived') bucket.unreadCount += 1
  }

  return counts
}

export async function getAngelcare360CommunicationOverview(options?: { schoolId?: string | null }) {
  const context = await getContextOrThrow('messagerie.view', options?.schoolId)
  const supabase = await createClient()
  const schoolId = context.school.id
  const [conversations, messages, notifications, announcements, templates, audit, counts] = await Promise.all([
    supabase.from('angelcare360_conversations').select('id').eq('school_id', schoolId),
    supabase.from('angelcare360_messages').select('id, status').eq('school_id', schoolId),
    supabase.from('angelcare360_notifications').select('id, status').eq('school_id', schoolId),
    supabase.from('angelcare360_announcements').select('id, status').eq('school_id', schoolId),
    supabase.from('angelcare360_message_templates').select('id').eq('school_id', schoolId),
    supabase.from('angelcare360_audit_logs').select('id').eq('school_id', schoolId).in('module', ['messaging', 'communication']).order('created_at', { ascending: false }).limit(20),
    getSchoolCounts(supabase, schoolId),
  ])

  const lockedChannels = await getAngelcare360NotificationChannelReadiness({ schoolId })

  return {
    schoolId,
    schoolName: context.school.name,
    conversationsCount: conversations.data?.length || 0,
    messagesCount: messages.data?.length || 0,
    unreadCount: (messages.data || []).filter((row) => row.status !== 'archived').length,
    announcementsDraftCount: (announcements.data || []).filter((row) => row.status === 'draft').length,
    announcementsPublishedCount: (announcements.data || []).filter((row) => row.status === 'published_internal' || row.status === 'published').length,
    templatesCount: templates.data?.length || 0,
    audienceReadiness: {
      schoolId,
      totalParents: counts.parents,
      totalTeachers: counts.teachers,
      totalStaff: counts.staff,
      totalStudents: counts.students,
      totalClasses: counts.classes,
      totalSections: counts.sections,
      totalSelectedAudiences: counts.selectedAudiences,
      readyGroups: [counts.parents ? 'parents' : '', counts.teachers ? 'teachers' : '', counts.staff ? 'staff' : '', counts.students ? 'students' : ''].filter(Boolean),
      blockedGroups: [!counts.parents ? 'parents' : '', !counts.students ? 'students' : '', !counts.staff ? 'staff' : ''].filter(Boolean),
    } satisfies Angelcare360AudienceReadinessRecord,
    notificationChannels: lockedChannels,
    risks: [
      counts.parents === 0 ? 'Aucune audience parent n’est disponible.' : null,
      counts.students === 0 ? 'Aucun élève actif n’est disponible.' : null,
      templates.data?.length ? null : 'Aucun modèle de message n’est configuré.',
      !(notifications.data || []).some((row) => row.status === 'read' || row.status === 'delivered_internal') ? null : null,
    ].filter(Boolean) as string[],
    recentAudit: (audit.data || []) as Angelcare360AuditRecord[],
  }
}

export async function listAngelcare360Conversations(options?: { schoolId?: string | null }) {
  const context = await getContextOrThrow('messagerie.view', options?.schoolId)
  const supabase = await createClient()
  const { data, error } = await supabase.from('angelcare360_conversations').select('*').eq('school_id', context.school.id).order('last_message_at', { ascending: false, nullsFirst: false }).limit(100)
  if (error) throw new Error(error.message)
  const rows = data || []
  const counts = await buildConversationCounts(supabase, rows.map((row) => String(row.id)))
  return rows.map((row) => mapConversation(row, counts.get(String(row.id))))
}

export async function getAngelcare360ConversationById(id: string, options?: { schoolId?: string | null }) {
  const context = await getContextOrThrow('messagerie.view', options?.schoolId)
  const supabase = await createClient()
  const { data: conversation, error } = await supabase.from('angelcare360_conversations').select('*').eq('school_id', context.school.id).eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  if (!conversation) return null

  const [participantsResult, messagesResult] = await Promise.all([
    supabase.from('angelcare360_conversation_participants').select('*').eq('conversation_id', id).order('created_at', { ascending: true }),
    supabase.from('angelcare360_messages').select('*').eq('conversation_id', id).order('created_at', { ascending: true }),
  ])

  const messages = messagesResult.data || []
  const recipientCounts = messages.length
    ? await supabase.from('angelcare360_message_recipients').select('message_id, read_at, status').in('message_id', messages.map((row) => row.id))
    : { data: [] as Row[] }

  const recipientMap = new Map<string, { recipientCount: number; readCount: number }>()
  for (const message of messages) recipientMap.set(String(message.id), { recipientCount: 0, readCount: 0 })
  for (const recipient of recipientCounts.data || []) {
    const messageId = String(recipient.message_id)
    const bucket = recipientMap.get(messageId)
    if (bucket) {
      bucket.recipientCount += 1
      if (recipient.read_at) bucket.readCount += 1
    }
  }

  return {
    ...mapConversation(conversation, {
      participantCount: participantsResult.data?.length || 0,
      messageCount: messages.length,
      unreadCount: (recipientCounts.data || []).filter((row) => !row.read_at && row.status !== 'archived').length,
    }),
    participants: (participantsResult.data || []).map(mapParticipant),
    messages: messages.map((row) => mapMessage(row, recipientMap.get(String(row.id)))),
  }
}

export async function createAngelcare360Conversation(input: Record<string, unknown>) {
  const parsed = angelcare360ConversationCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'La conversation est invalide.' }
  const context = await getContextOrThrow('messagerie.create', parsed.data.schoolId)
  const supabase = await createClient()
  const existingId = typeof input.id === 'string' && input.id.trim() ? input.id.trim() : null
  const payload = {
    school_id: context.school.id,
    conversation_code: parsed.data.conversationCode,
    subject: parsed.data.subject,
    conversation_type: 'internal',
    status: parsed.data.status || 'open',
    metadata_json: {
      participantAppUserIds: parsed.data.participantAppUserIds,
      participantStudentIds: parsed.data.participantStudentIds,
      participantParentIds: parsed.data.participantParentIds,
      participantStaffIds: parsed.data.participantStaffIds,
    },
  }

  const { data: conversation, error } = existingId
    ? await supabase.from('angelcare360_conversations').update(payload).eq('id', existingId).eq('school_id', context.school.id).select('*').maybeSingle()
    : await supabase.from('angelcare360_conversations').insert(payload).select('*').maybeSingle()

  if (error || !conversation) return { ok: false, error: error?.message || 'Impossible de créer la conversation.' }

  const participantRows = [
    ...parsed.data.participantAppUserIds.map((participantId) => ({ school_id: context.school.id, conversation_id: conversation.id, participant_app_user_id: participantId, participant_role: 'app_user', status: 'active' })),
    ...parsed.data.participantStudentIds.map((participantId) => ({ school_id: context.school.id, conversation_id: conversation.id, participant_student_id: participantId, participant_role: 'student', status: 'active' })),
    ...parsed.data.participantParentIds.map((participantId) => ({ school_id: context.school.id, conversation_id: conversation.id, participant_parent_id: participantId, participant_role: 'parent', status: 'active' })),
    ...parsed.data.participantStaffIds.map((participantId) => ({ school_id: context.school.id, conversation_id: conversation.id, participant_staff_id: participantId, participant_role: 'staff', status: 'active' })),
  ]

  if (participantRows.length) {
    await supabase.from('angelcare360_conversation_participants').insert(participantRows)
  }

  await auditCommunicationEvent({
    action: 'conversation.created',
    schoolId: context.school.id,
    entityType: 'angelcare360_conversations',
    entityId: conversation.id,
    afterData: conversation,
    metadata: { participantCount: participantRows.length },
  })

  return { ok: true, data: mapConversation(conversation, { participantCount: participantRows.length, messageCount: 0, unreadCount: 0 }) }
}

export async function listAngelcare360Messages(options?: { schoolId?: string | null; conversationId?: string | null }) {
  const context = await getContextOrThrow('messagerie.view', options?.schoolId)
  const supabase = await createClient()
  let query = supabase.from('angelcare360_messages').select('*').eq('school_id', context.school.id)
  if (options?.conversationId) query = query.eq('conversation_id', options.conversationId)
  const { data, error } = await query.order('created_at', { ascending: false }).limit(200)
  if (error) throw new Error(error.message)
  const rows = data || []
  const recipientIds = rows.map((row) => row.id)
  const recipients = recipientIds.length
    ? await supabase.from('angelcare360_message_recipients').select('message_id, read_at, status').in('message_id', recipientIds)
    : { data: [] as Row[] }
  const recipientMap = new Map<string, { recipientCount: number; readCount: number }>()
  for (const row of rows) recipientMap.set(String(row.id), { recipientCount: 0, readCount: 0 })
  for (const row of recipients.data || []) {
    const bucket = recipientMap.get(String(row.message_id))
    if (bucket) {
      bucket.recipientCount += 1
      if (row.read_at) bucket.readCount += 1
    }
  }
  return rows.map((row) => mapMessage(row, recipientMap.get(String(row.id))))
}

export async function createAngelcare360InternalMessage(input: Record<string, unknown>) {
  const parsed = angelcare360InternalMessageCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Le message interne est invalide.' }
  const context = await getContextOrThrow('messagerie.create', parsed.data.schoolId)
  const supabase = await createClient()

  const { data: conversation, error: conversationError } = await supabase.from('angelcare360_conversations').select('*').eq('school_id', context.school.id).eq('id', parsed.data.conversationId).maybeSingle()
  if (conversationError || !conversation) return { ok: false, error: conversationError?.message || 'Conversation introuvable.' }

  const { data: participants } = await supabase.from('angelcare360_conversation_participants').select('*').eq('conversation_id', parsed.data.conversationId).eq('status', 'active')
  const participantRows = participants || []

  const messagePayload = {
    school_id: context.school.id,
    conversation_id: parsed.data.conversationId,
    message_code: parsed.data.messageCode,
    sender_app_user_id: context.user.id,
    sender_role: context.primaryRoleKey || context.access.accessLevel,
    subject: parsed.data.subject || conversation.subject,
    body: parsed.data.body,
    message_type: 'internal',
    sent_at: nowIso(),
    status: parsed.data.status || 'sent_internal',
    metadata_json: {
      source: 'communication_phase_12',
    },
  }

  const { data: message, error } = await supabase.from('angelcare360_messages').insert(messagePayload).select('*').maybeSingle()
  if (error || !message) return { ok: false, error: error?.message || 'Impossible de créer le message.' }

  const recipients = [
    ...parsed.data.recipientAppUserIds.map((recipientAppUserId) => ({ school_id: context.school.id, message_id: message.id, recipient_app_user_id: recipientAppUserId, delivery_status: 'delivered_internal', status: 'active' })),
    ...parsed.data.recipientStudentIds.map((recipientStudentId) => ({ school_id: context.school.id, message_id: message.id, recipient_student_id: recipientStudentId, delivery_status: 'delivered_internal', status: 'active' })),
    ...parsed.data.recipientParentIds.map((recipientParentId) => ({ school_id: context.school.id, message_id: message.id, recipient_parent_id: recipientParentId, delivery_status: 'delivered_internal', status: 'active' })),
    ...parsed.data.recipientStaffIds.map((recipientStaffId) => ({ school_id: context.school.id, message_id: message.id, recipient_staff_id: recipientStaffId, delivery_status: 'delivered_internal', status: 'active' })),
  ]

  if (recipients.length) {
    await supabase.from('angelcare360_message_recipients').insert(recipients)
  } else if (participantRows.length) {
    await supabase.from('angelcare360_message_recipients').insert(
      participantRows
        .map((participant) => ({
          school_id: context.school.id,
          message_id: message.id,
          recipient_app_user_id: participant.participant_app_user_id || null,
          recipient_student_id: participant.participant_student_id || null,
          recipient_parent_id: participant.participant_parent_id || null,
          recipient_staff_id: participant.participant_staff_id || null,
          delivery_status: 'delivered_internal',
          status: 'active',
        })),
    )
  }

  await supabase.from('angelcare360_conversations').update({ last_message_at: nowIso(), status: 'open' }).eq('id', parsed.data.conversationId).eq('school_id', context.school.id)

  await auditCommunicationEvent({
    action: 'internal_message.created',
    schoolId: context.school.id,
    entityType: 'angelcare360_messages',
    entityId: message.id,
    afterData: message,
    metadata: { conversationId: parsed.data.conversationId },
  })

  return { ok: true, data: mapMessage(message, { recipientCount: recipients.length || participantRows.length, readCount: 0 }) }
}

export async function markAngelcare360MessageRead(input: Record<string, unknown>) {
  const parsed = angelcare360MessageReadSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'La lecture du message est invalide.' }
  const context = await getContextOrThrow('messagerie.update', parsed.data.schoolId)
  const supabase = await createClient()
  const recipientAppUserId = parsed.data.recipientAppUserId || context.user.id
  const { data: recipients, error } = await supabase
    .from('angelcare360_message_recipients')
    .update({ read_at: nowIso(), delivery_status: 'read' })
    .eq('message_id', parsed.data.messageId)
    .eq('recipient_app_user_id', recipientAppUserId)
    .select('*')

  if (error) return { ok: false, error: error.message }

  await auditCommunicationEvent({
    action: 'message.read',
    schoolId: context.school.id,
    entityType: 'angelcare360_messages',
    entityId: parsed.data.messageId,
    afterData: { recipientAppUserId, readCount: recipients?.length || 0 },
  })

  return { ok: true, data: recipients || [] }
}

export async function archiveAngelcare360Conversation(input: Record<string, unknown>) {
  const parsed = angelcare360ConversationArchiveSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'L’archivage de conversation est invalide.' }
  const context = await getContextOrThrow('messagerie.update', parsed.data.schoolId)
  const supabase = await createClient()
  const { data: before } = await supabase.from('angelcare360_conversations').select('*').eq('id', parsed.data.id).eq('school_id', context.school.id).maybeSingle()
  const { data: conversation, error } = await supabase.from('angelcare360_conversations').update({ status: 'archived', archived_at: nowIso() }).eq('id', parsed.data.id).eq('school_id', context.school.id).select('*').maybeSingle()
  if (error || !conversation) return { ok: false, error: error?.message || 'Conversation introuvable.' }
  await supabase.from('angelcare360_conversation_participants').update({ status: 'archived' }).eq('conversation_id', parsed.data.id).eq('school_id', context.school.id)

  await auditCommunicationEvent({
    action: 'conversation.archived',
    severity: 'warning',
    schoolId: context.school.id,
    entityType: 'angelcare360_conversations',
    entityId: parsed.data.id,
    beforeData: before || {},
    afterData: conversation,
    metadata: { reason: parsed.data.reason || null },
  })

  return { ok: true, data: mapConversation(conversation) }
}

export async function listAngelcare360Announcements(options?: { schoolId?: string | null }) {
  const context = await getContextOrThrow('messagerie.view', options?.schoolId)
  const supabase = await createClient()
  const { data, error } = await supabase.from('angelcare360_announcements').select('*').eq('school_id', context.school.id).order('created_at', { ascending: false }).limit(100)
  if (error) throw new Error(error.message)
  return (data || []).map(mapAnnouncement)
}

export async function createAngelcare360Announcement(input: Record<string, unknown>) {
  const parsed = angelcare360AnnouncementCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'L’annonce est invalide.' }
  const context = await getContextOrThrow('messagerie.create', parsed.data.schoolId)
  const supabase = await createClient()
  const { data, error } = await supabase.from('angelcare360_announcements').insert({
    school_id: context.school.id,
    academic_year_id: parsed.data.academicYearId || null,
    announcement_code: parsed.data.announcementCode,
    title: parsed.data.title,
    body: parsed.data.body,
    audience: parsed.data.audience,
    status: parsed.data.status || 'draft',
    metadata_json: { source: 'phase12' },
  }).select('*').maybeSingle()
  if (error || !data) return { ok: false, error: error?.message || 'Impossible de créer l’annonce.' }
  await auditCommunicationEvent({
    action: 'announcement.created',
    schoolId: context.school.id,
    entityType: 'angelcare360_announcements',
    entityId: data.id,
    afterData: data,
  })
  return { ok: true, data: mapAnnouncement(data) }
}

export async function updateAngelcare360Announcement(input: Record<string, unknown>) {
  const parsed = angelcare360AnnouncementUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'La mise à jour de l’annonce est invalide.' }
  const context = await getContextOrThrow('messagerie.update', parsed.data.schoolId)
  const supabase = await createClient()
  const { data: before } = await supabase.from('angelcare360_announcements').select('*').eq('id', parsed.data.id).eq('school_id', context.school.id).maybeSingle()
  const { data, error } = await supabase.from('angelcare360_announcements').update({
    academic_year_id: parsed.data.academicYearId || null,
    announcement_code: parsed.data.announcementCode,
    title: parsed.data.title,
    body: parsed.data.body,
    audience: parsed.data.audience,
    status: parsed.data.status || before?.status || 'draft',
  }).eq('id', parsed.data.id).eq('school_id', context.school.id).select('*').maybeSingle()
  if (error || !data) return { ok: false, error: error?.message || 'Annonce introuvable.' }
  await auditCommunicationEvent({
    action: 'announcement.updated',
    schoolId: context.school.id,
    entityType: 'angelcare360_announcements',
    entityId: data.id,
    beforeData: before || {},
    afterData: data,
  })
  return { ok: true, data: mapAnnouncement(data) }
}

export async function publishAngelcare360AnnouncementInternally(input: Record<string, unknown>) {
  const parsed = angelcare360AnnouncementPublishInternalSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'La publication de l’annonce est invalide.' }
  const context = await getContextOrThrow('messagerie.update', parsed.data.schoolId)
  const supabase = await createClient()
  const { data: before } = await supabase.from('angelcare360_announcements').select('*').eq('id', parsed.data.id).eq('school_id', context.school.id).maybeSingle()
  if (!before) return { ok: false, error: 'Annonce introuvable.' }
  if (!parsed.data.audience) return { ok: false, error: 'L’audience est obligatoire avant publication interne.' }
  const { data, error } = await supabase.from('angelcare360_announcements').update({
    status: 'published_internal',
    published_at: nowIso(),
    audience: parsed.data.audience,
  }).eq('id', parsed.data.id).eq('school_id', context.school.id).select('*').maybeSingle()
  if (error || !data) return { ok: false, error: error?.message || 'Publication impossible.' }
  await auditCommunicationEvent({
    action: 'announcement.published_internal',
    schoolId: context.school.id,
    entityType: 'angelcare360_announcements',
    entityId: data.id,
    beforeData: before || {},
    afterData: data,
  })
  return { ok: true, data: mapAnnouncement(data) }
}

export async function listAngelcare360MessageTemplates(options?: { schoolId?: string | null }) {
  const context = await getContextOrThrow('messagerie.view', options?.schoolId)
  const supabase = await createClient()
  const { data, error } = await supabase.from('angelcare360_message_templates').select('*').eq('school_id', context.school.id).order('created_at', { ascending: false }).limit(100)
  if (error) throw new Error(error.message)
  return (data || []).map(mapTemplate)
}

export async function createAngelcare360MessageTemplate(input: Record<string, unknown>) {
  const parsed = angelcare360MessageTemplateCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Le modèle est invalide.' }
  const context = await getContextOrThrow('messagerie.create', parsed.data.schoolId)
  const supabase = await createClient()
  const { data, error } = await supabase.from('angelcare360_message_templates').insert({
    school_id: context.school.id,
    template_code: parsed.data.templateCode,
    channel: parsed.data.channel,
    name: parsed.data.name,
    content: parsed.data.content,
    audience_type: parsed.data.audienceType || 'all',
    status: parsed.data.status || 'draft',
    metadata_json: { source: 'phase12' },
  }).select('*').maybeSingle()
  if (error || !data) return { ok: false, error: error?.message || 'Impossible de créer le modèle.' }
  await auditCommunicationEvent({
    action: 'template.created',
    schoolId: context.school.id,
    entityType: 'angelcare360_message_templates',
    entityId: data.id,
    afterData: data,
  })
  return { ok: true, data: mapTemplate(data) }
}

export async function updateAngelcare360MessageTemplate(input: Record<string, unknown>) {
  const parsed = angelcare360MessageTemplateUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'La mise à jour du modèle est invalide.' }
  const context = await getContextOrThrow('messagerie.update', parsed.data.schoolId)
  const supabase = await createClient()
  const { data: before } = await supabase.from('angelcare360_message_templates').select('*').eq('id', parsed.data.id).eq('school_id', context.school.id).maybeSingle()
  const { data, error } = await supabase.from('angelcare360_message_templates').update({
    template_code: parsed.data.templateCode,
    channel: parsed.data.channel,
    name: parsed.data.name,
    content: parsed.data.content,
    audience_type: parsed.data.audienceType || 'all',
    status: parsed.data.status || before?.status || 'draft',
  }).eq('id', parsed.data.id).eq('school_id', context.school.id).select('*').maybeSingle()
  if (error || !data) return { ok: false, error: error?.message || 'Modèle introuvable.' }
  await auditCommunicationEvent({
    action: 'template.updated',
    schoolId: context.school.id,
    entityType: 'angelcare360_message_templates',
    entityId: data.id,
    beforeData: before || {},
    afterData: data,
  })
  return { ok: true, data: mapTemplate(data) }
}

export async function getAngelcare360AudienceReadiness(options?: { schoolId?: string | null }) {
  const context = await getContextOrThrow('messagerie.view', options?.schoolId)
  const supabase = await createClient()
  const counts = await getSchoolCounts(supabase, context.school.id)
  const readyGroups = [
    counts.parents ? 'parents' : '',
    counts.teachers ? 'teachers' : '',
    counts.staff ? 'staff' : '',
    counts.students ? 'students' : '',
    counts.classes ? 'classes' : '',
    counts.sections ? 'sections' : '',
  ].filter(Boolean)
  const blockedGroups = [
    !counts.parents ? 'parents' : '',
    !counts.students ? 'students' : '',
    !counts.sections ? 'sections' : '',
  ].filter(Boolean)
  const readiness: Angelcare360AudienceReadinessRecord = {
    schoolId: context.school.id,
    totalParents: counts.parents,
    totalTeachers: counts.teachers,
    totalStaff: counts.staff,
    totalStudents: counts.students,
    totalClasses: counts.classes,
    totalSections: counts.sections,
    totalSelectedAudiences: counts.selectedAudiences,
    readyGroups,
    blockedGroups,
  }
  await auditCommunicationEvent({
    action: 'audience.readiness_checked',
    severity: 'notice',
    schoolId: context.school.id,
    entityType: 'angelcare360_audiences',
    entityId: context.school.id,
    afterData: readiness as unknown as Record<string, unknown>,
  })
  return readiness
}

export async function listAngelcare360CommunicationAuditEvents(options?: { schoolId?: string | null; filters?: Partial<Angelcare360CommunicationAuditQueryFiltersInput> }) {
  const context = await getContextOrThrow('audit.view', options?.schoolId)
  const parsed = angelcare360CommunicationAuditQueryFiltersSchema.safeParse(options?.filters || {})
  if (!parsed.success) throw new Error(parsed.errors[0]?.message || 'Les filtres d’audit communication sont invalides.')
  const supabase = await createClient()
  let query = supabase.from('angelcare360_audit_logs').select('*').eq('school_id', context.school.id).in('module', ['messaging', 'communication']).order('created_at', { ascending: false }).limit(200)
  if (parsed.data.action) query = query.eq('action', parsed.data.action)
  if (parsed.data.severity) query = query.eq('severity', parsed.data.severity)
  if (parsed.data.entityType) query = query.eq('entity_type', parsed.data.entityType)
  if (parsed.data.entityId) query = query.eq('entity_id', parsed.data.entityId)
  if (parsed.data.actorUserId) query = query.eq('actor_user_id', parsed.data.actorUserId)
  if (parsed.data.search) query = query.or(`module.ilike.%${parsed.data.search}%,action.ilike.%${parsed.data.search}%,entity_type.ilike.%${parsed.data.search}%`)
  if (parsed.data.from) query = query.gte('created_at', parsed.data.from)
  if (parsed.data.to) query = query.lte('created_at', parsed.data.to)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data || []) as Angelcare360AuditRecord[]
}

export async function blockAngelcare360ExternalChannel(options?: { schoolId?: string | null; channel?: string | null; reason?: string | null }) {
  const context = await getContextOrThrow('messagerie.view', options?.schoolId)
  await auditCommunicationEvent({
    action: 'external_channel.blocked_not_configured',
    severity: 'warning',
    schoolId: context.school.id,
    entityType: 'channel',
    entityId: context.school.id,
    metadata: {
      channel: options?.channel || 'external',
      reason: options?.reason || BLOCKED_EXTERNAL_CHANNEL_MESSAGE,
      emailReason: BLOCKED_EMAIL_MESSAGE,
      smsReason: BLOCKED_SMS_MESSAGE,
      pushReason: BLOCKED_PUSH_MESSAGE,
    },
  })
  return {
    ok: true,
    blocked: true,
    reason: options?.reason || BLOCKED_EXTERNAL_CHANNEL_MESSAGE,
  }
}

export async function listAngelcare360AnnouncementsReadiness(options?: { schoolId?: string | null }) {
  return listAngelcare360Announcements(options)
}

export async function listAngelcare360MessagesReadiness(options?: { schoolId?: string | null; conversationId?: string | null }) {
  return listAngelcare360Messages(options)
}
