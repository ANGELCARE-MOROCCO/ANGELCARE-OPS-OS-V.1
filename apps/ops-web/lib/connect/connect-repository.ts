import { randomUUID } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import {
  canAccessConnectDepartment,
  canCreateDepartmentRoom,
  canCreateExecutiveBroadcast,
  isCeoUser,
  canUseConnectAdminActions,
  type MinimalAppUser,
} from '@/lib/connect/connect-access'
import type {
  ConnectAction,
  ConnectAppUser,
  ConnectAttachment,
  ConnectCallSession,
  ConnectConversation,
  ConnectConversationType,
  ConnectMessage,
  ConnectNotification,
  ConnectPrivacyLevel,
  ConnectPriority,
} from '@/lib/connect/connect-types'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

type ConversationPayload = {
  title?: string
  type?: ConnectConversationType
  privacy_level?: ConnectPrivacyLevel
  department?: string | null
  module_key?: string | null
  memberIds?: string[]
  directUserId?: string | null
}

type MessagePayload = {
  conversationId?: string
  roomId?: string
  body?: string
  message_type?: ConnectMessage['message_type']
  priority?: ConnectPriority
  confidential?: boolean
  metadata?: Record<string, unknown>
}

const CONNECT_ATTACHMENTS_BUCKET = 'connect-attachments'
const CONNECT_MISSED_CALL_MS = 60_000

type AttachmentPayload = {
  conversationId: string
  messageId?: string | null
  storagePath: string
  filename: string
  contentType?: string | null
  sizeBytes?: number | null
}

function userId(user: MinimalAppUser) {
  return String(user.id || '')
}

function cleanText(value: unknown, fallback = '') {
  const text = String(value || '').trim()
  return text || fallback
}

function userName(user: Record<string, unknown>) {
  return cleanText(user.full_name, cleanText(user.username, cleanText(user.email, 'AngelCare User')))
}

function userDepartment(user: Record<string, unknown>) {
  return (user.department || null) as string | null
}

function assertSupabaseOk(error: { message?: string } | null | undefined, label: string): void {
  if (error) throw new Error(`${label}: ${error.message || 'Supabase error'}`)
}

function normalizeIds(ids: Array<string | null | undefined>) {
  return Array.from(new Set(ids.map((id) => String(id || '').trim()).filter(Boolean)))
}

function isActiveStaff(row: Record<string, unknown>) {
  const status = String(row.status || '').toLowerCase().trim()
  return !['deleted', 'archived', 'disabled', 'blocked', 'inactive'].includes(status)
}

async function getUsersByIds(supabase: SupabaseClient, ids: string[]) {
  if (!ids.length) return new Map<string, ConnectAppUser>()
  const { data, error } = await supabase.from('app_users').select('id, full_name, username, email, role, department, job_title, status').in('id', ids)
  assertSupabaseOk(error, 'Load Connect users')
  const map = new Map<string, ConnectAppUser>()
  for (const row of (data || []) as Array<Record<string, unknown>>) {
    const id = String(row.id)
    map.set(id, {
      id,
      name: userName(row),
      full_name: (row.full_name || row.username || null) as string | null,
      email: (row.email || null) as string | null,
      role: (row.job_title || row.role || null) as string | null,
      department: userDepartment(row),
      status: 'offline',
    })
  }
  return map
}

async function isConversationMember(supabase: SupabaseClient, conversationId: string, currentUserId: string) {
  const { data, error } = await supabase
    .from('connect_conversation_members')
    .select('id, role')
    .eq('conversation_id', conversationId)
    .eq('user_id', currentUserId)
    .maybeSingle()
  assertSupabaseOk(error, 'Check Connect membership')
  return data as { id: string; role: string } | null
}

async function getConversationMemberRows(supabase: SupabaseClient, conversationId: string) {
  const { data, error } = await supabase
    .from('connect_conversation_members')
    .select('*')
    .eq('conversation_id', conversationId)
  assertSupabaseOk(error, 'Load Connect conversation recipients')
  return (data || []) as any[]
}

async function getConversationTitle(supabase: SupabaseClient, conversationId: string) {
  const { data, error } = await supabase
    .from('connect_conversations')
    .select('title, type')
    .eq('id', conversationId)
    .maybeSingle()
  assertSupabaseOk(error, 'Load Connect conversation title')
  return cleanText((data as any)?.title, 'AngelCare Connect')
}

async function createRecipientNotifications(
  supabase: SupabaseClient,
  rows: Array<Record<string, unknown>>,
  label: string,
) {
  if (!rows.length) return
  const { error } = await supabase.from('connect_notifications').insert(rows)
  assertSupabaseOk(error, label)
}

export function toConnectUser(user: Record<string, unknown>): ConnectAppUser {
  return {
    id: String(user.id),
    name: userName(user),
    full_name: (user.full_name || user.username || null) as string | null,
    email: (user.email || null) as string | null,
    role: (user.job_title || user.role || null) as string | null,
    department: userDepartment(user),
    status: 'online',
  }
}

export async function touchConnectPresence(user: MinimalAppUser, currentRoute?: string | null) {
  const supabase = await createClient()
  const payload = {
    user_id: userId(user),
    status: 'online',
    current_route: currentRoute || null,
    last_seen_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  const { error } = await supabase.from('connect_presence').upsert(payload, { onConflict: 'user_id' })
  assertSupabaseOk(error, 'Update Connect presence')
  return payload
}

export async function getConnectStaff(currentUser: MinimalAppUser, query?: string | null): Promise<ConnectAppUser[]> {
  const supabase = await createClient()
  let usersQuery = supabase
    .from('app_users')
    .select('id, full_name, username, email, role, department, job_title, status, created_at')
    .order('full_name', { ascending: true })
    .limit(750)

  const cleanQuery = String(query || '').trim()
  if (cleanQuery) {
    const safe = cleanQuery.replaceAll('%', '').replaceAll(',', ' ')
    usersQuery = usersQuery.or(`full_name.ilike.%${safe}%,username.ilike.%${safe}%,email.ilike.%${safe}%,role.ilike.%${safe}%,department.ilike.%${safe}%,job_title.ilike.%${safe}%`)
  }

  const { data: users, error } = await usersQuery
  assertSupabaseOk(error, 'Load Connect staff')

  const visibleUsers = ((users || []) as Array<Record<string, unknown>>)
    .filter(isActiveStaff)
    .filter((row) => canAccessConnectDepartment(currentUser, userDepartment(row)) || String(row.id) === userId(currentUser))

  const ids = visibleUsers.map((row) => String(row.id))
  const { data: presence, error: presenceError } = ids.length
    ? await supabase.from('connect_presence').select('*').in('user_id', ids)
    : { data: [], error: null }
  assertSupabaseOk(presenceError, 'Load Connect presence')
  const presenceMap = new Map((presence || []).map((row: any) => [String(row.user_id), row]))

  return visibleUsers.map((row) => {
    const live = presenceMap.get(String(row.id))
    return {
      ...toConnectUser(row),
      status: (live?.status || 'offline') as ConnectAppUser['status'],
      last_seen_at: live?.last_seen_at || null,
      current_route: live?.current_route || null,
    }
  })
}

async function getConversationMembers(supabase: SupabaseClient, conversationIds: string[]) {
  if (!conversationIds.length) return { members: [] as any[], users: new Map<string, ConnectAppUser>() }
  const { data: members, error } = await supabase.from('connect_conversation_members').select('*').in('conversation_id', conversationIds)
  assertSupabaseOk(error, 'Load Connect members')
  const users = await getUsersByIds(supabase, normalizeIds(((members || []) as any[]).map((member) => member.user_id)))
  return { members: (members || []) as any[], users }
}

function buildConversationOutput(conversation: any, members: any[], users: Map<string, ConnectAppUser>, myMembership?: any, latest?: any, unreadCount = 0): ConnectConversation {
  const memberUsers = members.map((member) => users.get(String(member.user_id))).filter(Boolean) as ConnectAppUser[]
  let title = cleanText(conversation.title, 'AngelCare Connect')
  if (conversation.type === 'direct' && memberUsers.length) {
    const other = memberUsers.find((member) => String(member.id) !== String(myMembership?.user_id))
    if (other?.name) title = other.name
  }
  return {
    ...(conversation as ConnectConversation),
    title,
    members: memberUsers,
    member_count: memberUsers.length,
    last_message: latest?.body || null,
    last_message_at: latest?.created_at || conversation.updated_at || conversation.created_at || null,
    unread_count: unreadCount,
    pinned: Boolean(myMembership?.pinned),
    muted: Boolean(myMembership?.muted),
    my_role: myMembership?.role || 'member',
  }
}

export async function getMyConversations(currentUser: MinimalAppUser): Promise<ConnectConversation[]> {
  const supabase = await createClient()
  const currentUserId = userId(currentUser)
  const { data: memberships, error: memberError } = await supabase
    .from('connect_conversation_members')
    .select('*')
    .eq('user_id', currentUserId)
    .order('pinned', { ascending: false })
  assertSupabaseOk(memberError, 'Load my Connect memberships')

  const conversationIds = ((memberships || []) as any[]).map((member) => String(member.conversation_id))
  if (!conversationIds.length) return []

  const { data: conversations, error: conversationError } = await supabase
    .from('connect_conversations')
    .select('*')
    .in('id', conversationIds)
    .eq('is_archived', false)
    .order('updated_at', { ascending: false })
  assertSupabaseOk(conversationError, 'Load my Connect conversations')

  const { members: allMembers, users } = await getConversationMembers(supabase, conversationIds)

  const { data: latestMessages, error: latestError } = await supabase
    .from('connect_messages')
    .select('*')
    .in('conversation_id', conversationIds)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1500)
  assertSupabaseOk(latestError, 'Load Connect latest messages')

  const latestByConversation = new Map<string, any>()
  for (const message of (latestMessages || []) as any[]) {
    const key = String(message.conversation_id)
    if (!latestByConversation.has(key)) latestByConversation.set(key, message)
  }

  const membershipsByConversation = new Map<string, any[]>()
  for (const member of allMembers) {
    const key = String(member.conversation_id)
    membershipsByConversation.set(key, [...(membershipsByConversation.get(key) || []), member])
  }

  const myMembershipMap = new Map(((memberships || []) as any[]).map((member) => [String(member.conversation_id), member]))

  return ((conversations || []) as any[])
    .filter((conversation) => {
      if (conversation.privacy_level === 'executive' && !canCreateExecutiveBroadcast(currentUser)) return false
      if (conversation.privacy_level === 'department' && !canAccessConnectDepartment(currentUser, conversation.department)) return false
      return true
    })
    .map((conversation) => {
      const myMembership = myMembershipMap.get(String(conversation.id))
      const lastRead = myMembership?.last_read_at ? new Date(myMembership.last_read_at).getTime() : 0
      const unreadCount = ((latestMessages || []) as any[]).filter((message) => String(message.conversation_id) === String(conversation.id)
        && String(message.sender_id) !== currentUserId
        && new Date(message.created_at).getTime() > lastRead).length
      return buildConversationOutput(conversation, membershipsByConversation.get(String(conversation.id)) || [], users, myMembership, latestByConversation.get(String(conversation.id)), unreadCount)
    })
    .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || new Date(b.last_message_at || b.updated_at || 0).getTime() - new Date(a.last_message_at || a.updated_at || 0).getTime())
}

async function hydrateSingleConversation(supabase: SupabaseClient, currentUser: MinimalAppUser, conversation: any): Promise<ConnectConversation> {
  const { members, users } = await getConversationMembers(supabase, [String(conversation.id)])
  const myMembership = members.find((member) => String(member.user_id) === userId(currentUser))
  return buildConversationOutput(conversation, members, users, myMembership)
}

async function getDepartmentUserIds(supabase: SupabaseClient, department?: string | null) {
  if (!department) return []
  const { data, error } = await supabase
    .from('app_users')
    .select('id, status')
    .eq('department', department)
    .limit(300)
  assertSupabaseOk(error, 'Load department staff')
  return ((data || []) as any[]).filter(isActiveStaff).map((row) => String(row.id))
}

async function getAllActiveUserIds(supabase: SupabaseClient) {
  const { data, error } = await supabase.from('app_users').select('id, status').limit(1000)
  assertSupabaseOk(error, 'Load active staff')
  return ((data || []) as any[]).filter(isActiveStaff).map((row) => String(row.id))
}

export async function createConversation(currentUser: MinimalAppUser, payload: ConversationPayload): Promise<ConnectConversation> {
  const supabase = await createClient()
  const currentUserId = userId(currentUser)
  const type = payload.type || (payload.directUserId ? 'direct' : 'room')
  const privacyLevel = type === 'room' ? 'private' : (payload.privacy_level || (type === 'direct' ? 'private' : 'department'))

  if (type === 'room' && !isCeoUser(currentUser)) throw new Error(`Only the CEO can create AngelCare Connect rooms. Current account role received: ${String(currentUser.role || 'empty')}`)
  if (privacyLevel === 'executive' && !canCreateExecutiveBroadcast(currentUser)) throw new Error('Executive Connect conversations are restricted to Direction/Admin users')
  if (type !== 'room' && privacyLevel === 'department' && !canCreateDepartmentRoom(currentUser, payload.department || currentUser.department)) throw new Error('You cannot create a room for this department')

  let memberIds = normalizeIds([currentUserId, payload.directUserId, ...(payload.memberIds || [])])
  if (type === 'room' && memberIds.length < 2) throw new Error('Select at least one staff member for this room')
  if (type !== 'room' && type !== 'direct' && privacyLevel === 'department') {
    memberIds = normalizeIds([...memberIds, ...(await getDepartmentUserIds(supabase, payload.department || currentUser.department))])
  }
  if (type === 'broadcast' && privacyLevel === 'public_readonly') {
    memberIds = normalizeIds([...memberIds, ...(await getAllActiveUserIds(supabase))])
  }

  if (type === 'direct' && payload.directUserId) {
    const targetId = String(payload.directUserId)
    const { data: myDirectMemberships, error: myDirectError } = await supabase
      .from('connect_conversation_members')
      .select('conversation_id')
      .eq('user_id', currentUserId)
    assertSupabaseOk(myDirectError, 'Load direct membership candidates')
    const ids = (myDirectMemberships || []).map((row: any) => String(row.conversation_id))
    if (ids.length) {
      const { data: targetMemberships, error: targetError } = await supabase
        .from('connect_conversation_members')
        .select('conversation_id')
        .eq('user_id', targetId)
        .in('conversation_id', ids)
      assertSupabaseOk(targetError, 'Find existing direct conversation')
      const sharedIds = (targetMemberships || []).map((row: any) => String(row.conversation_id))
      if (sharedIds.length) {
        const { data: existing, error: existingError } = await supabase
          .from('connect_conversations')
          .select('*')
          .in('id', sharedIds)
          .eq('type', 'direct')
          .eq('is_archived', false)
          .limit(1)
          .maybeSingle()
        assertSupabaseOk(existingError, 'Load existing direct conversation')
        if (existing) return hydrateSingleConversation(supabase, currentUser, existing)
      }
    }
  }

  const title = cleanText(payload.title, type === 'direct' ? 'Private conversation' : `${payload.department || currentUser.department || 'AngelCare'} Room`)
  const { data: conversation, error } = await supabase
    .from('connect_conversations')
    .insert({
      title,
      type,
      privacy_level: privacyLevel,
      department: payload.department || currentUser.department || null,
      module_key: payload.module_key || null,
      created_by: currentUserId,
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single()
  assertSupabaseOk(error, 'Create Connect conversation')

  const rows = memberIds.map((memberId) => ({ conversation_id: conversation.id, user_id: memberId, role: memberId === currentUserId ? 'owner' : 'member' }))
  const { error: memberError } = await supabase.from('connect_conversation_members').upsert(rows, { onConflict: 'conversation_id,user_id' })
  assertSupabaseOk(memberError, 'Create Connect members')

  await sendSystemMessage(supabase, String(conversation.id), currentUserId, userName(currentUser as any), `Conversation created: ${title}`)
  return hydrateSingleConversation(supabase, currentUser, conversation)
}

async function sendSystemMessage(supabase: SupabaseClient, conversationId: string, senderId: string, senderName: string, body: string) {
  const { error } = await supabase.from('connect_messages').insert({
    conversation_id: conversationId,
    sender_id: senderId,
    sender_name: senderName,
    body,
    message_type: 'system',
    priority: 'normal',
    confidential: false,
    metadata: {},
  })
  assertSupabaseOk(error, 'Create Connect system message')
}

export async function getConversationMessages(currentUser: MinimalAppUser, conversationId: string): Promise<ConnectMessage[]> {
  const supabase = await createClient()
  const currentUserId = userId(currentUser)
  const membership = await isConversationMember(supabase, conversationId, currentUserId)
  if (!membership) throw new Error('Private conversation: current user is not a member')

  const { data: messages, error } = await supabase
    .from('connect_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(600)
  assertSupabaseOk(error, 'Load Connect messages')

  const messageRows = (messages || []) as any[]
  const senders = await getUsersByIds(supabase, normalizeIds(messageRows.map((message) => message.sender_id)))
  const memberRows = await getConversationMemberRows(supabase, conversationId)
  const memberCount = memberRows.length
  const { data: readRows, error: readError } = messageRows.length
    ? await supabase
      .from('connect_message_reads')
      .select('*')
      .in('message_id', messageRows.map((message) => String(message.id)))
    : { data: [], error: null }
  assertSupabaseOk(readError, 'Load Connect read receipts')

  const readUsers = await getUsersByIds(supabase, normalizeIds(((readRows || []) as any[]).map((row) => row.user_id)))
  const readsByMessage = new Map<string, any[]>()
  for (const row of (readRows || []) as any[]) {
    const key = String(row.message_id)
    readsByMessage.set(key, [...(readsByMessage.get(key) || []), row])
  }

  return await Promise.all(messageRows.map(async (message) => {
    const sender = senders.get(String(message.sender_id))
    const reads = (readsByMessage.get(String(message.id)) || [])
      .filter((row) => String(row.user_id) !== String(message.sender_id))
      .map((row) => ({
        user_id: String(row.user_id),
        name: readUsers.get(String(row.user_id))?.name || null,
        read_at: String(row.read_at),
      }))
    const myRead = (readsByMessage.get(String(message.id)) || []).find((row) => String(row.user_id) === currentUserId)
    const metadata = { ...((message.metadata || {}) as Record<string, unknown>) }
    const storagePath = cleanText(metadata.storage_path)
    if ((message.message_type === 'file' || storagePath) && storagePath) {
      const signed = await supabase.storage.from(CONNECT_ATTACHMENTS_BUCKET).createSignedUrl(storagePath, 60 * 60)
      if (signed.data?.signedUrl) metadata.signed_url = signed.data.signedUrl
    }
    return {
      ...(message as ConnectMessage),
      metadata,
      sender_name: message.sender_name && message.sender_name !== 'Unknown' ? message.sender_name : sender?.name || 'AngelCare User',
      sender_role: sender?.role || null,
      read_count: reads.length,
      read_by: reads,
      my_read_at: myRead?.read_at || null,
      delivered_count: Math.max(0, memberCount - 1),
      delivery_state: reads.length > 0 ? 'read' : memberCount > 1 ? 'delivered' : 'sent',
    } satisfies ConnectMessage
  }))
}

export async function markConversationRead(currentUser: MinimalAppUser, conversationId: string) {
  const supabase = await createClient()
  const currentUserId = userId(currentUser)
  const membership = await isConversationMember(supabase, conversationId, currentUserId)
  if (!membership) throw new Error('Cannot mark a private conversation read')
  const { error } = await supabase
    .from('connect_conversation_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', currentUserId)
  assertSupabaseOk(error, 'Mark Connect conversation read')
  const { data: unreadMessages, error: unreadError } = await supabase
    .from('connect_messages')
    .select('id')
    .eq('conversation_id', conversationId)
    .neq('sender_id', currentUserId)
    .is('deleted_at', null)
    .limit(1000)
  assertSupabaseOk(unreadError, 'Load Connect messages for read receipts')
  const now = new Date().toISOString()
  const receiptRows = ((unreadMessages || []) as any[]).map((message) => ({
    message_id: String(message.id),
    conversation_id: conversationId,
    user_id: currentUserId,
    read_at: now,
  }))
  if (receiptRows.length) {
    const { error: receiptError } = await supabase
      .from('connect_message_reads')
      .upsert(receiptRows, { onConflict: 'message_id,user_id' })
    assertSupabaseOk(receiptError, 'Save Connect read receipts')
  }
  return { ok: true }
}

export async function sendMessage(currentUser: MinimalAppUser, payload: MessagePayload): Promise<ConnectMessage> {
  const supabase = await createClient()
  const currentUserId = userId(currentUser)
  const conversationId = cleanText(payload.conversationId || payload.roomId)
  const body = cleanText(payload.body)
  if (!conversationId) throw new Error('conversationId required')
  if (!body) throw new Error('Message body required')
  const membership = await isConversationMember(supabase, conversationId, currentUserId)
  if (!membership) throw new Error('Private conversation: current user is not a member')

  const sender = userName(currentUser as any)
  const { data: message, error } = await supabase
    .from('connect_messages')
    .insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      sender_name: sender,
      body,
      message_type: payload.message_type || 'text',
      priority: payload.priority || 'normal',
      confidential: Boolean(payload.confidential),
      metadata: payload.metadata || {},
    })
    .select('*')
    .single()
  assertSupabaseOk(error, 'Send Connect message')

  await supabase.from('connect_conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId)
  await markConversationRead(currentUser, conversationId)
  if ((payload.message_type || 'text') !== 'system') {
    const [conversationTitle, members] = await Promise.all([
      getConversationTitle(supabase, conversationId),
      getConversationMemberRows(supabase, conversationId),
    ])
    const notificationRows = members
      .filter((member) => String(member.user_id) !== currentUserId && !member.muted)
      .map((member) => ({
        user_id: String(member.user_id),
        audience: 'selected',
        title: payload.message_type === 'task' ? `Connect task update · ${conversationTitle}` : `New Connect message · ${conversationTitle}`,
        body: body.slice(0, 240),
        priority: payload.priority || 'normal',
        read: false,
        created_by: currentUserId,
        source_type: 'message',
        source_id: String((message as any).id),
        metadata: { conversation_id: conversationId, message_type: payload.message_type || 'text' },
      }))
    await createRecipientNotifications(supabase, notificationRows, 'Create Connect message notifications')
  }
  return {
    ...(message as ConnectMessage),
    sender_name: sender,
    delivered_count: 0,
    read_count: 0,
    read_by: [],
    delivery_state: 'sent',
  }
}


export async function pinConversation(currentUser: MinimalAppUser, conversationId: string, pinned: boolean) {
  const supabase = await createClient()
  const currentUserId = userId(currentUser)
  const membership = await isConversationMember(supabase, conversationId, currentUserId)
  if (!membership) throw new Error('Cannot update this private conversation')
  const { error } = await supabase
    .from('connect_conversation_members')
    .update({ pinned })
    .eq('conversation_id', conversationId)
    .eq('user_id', currentUserId)
  assertSupabaseOk(error, 'Update Connect conversation pin')
  return { ok: true, pinned }
}

export async function emptyConversation(currentUser: MinimalAppUser, conversationId: string) {
  const supabase = await createClient()
  const currentUserId = userId(currentUser)
  const membership = await isConversationMember(supabase, conversationId, currentUserId)
  if (!membership) throw new Error('Cannot empty this private conversation')
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('connect_messages')
    .update({ deleted_at: now })
    .eq('conversation_id', conversationId)
    .is('deleted_at', null)
  assertSupabaseOk(error, 'Empty Connect conversation')
  await supabase.from('connect_conversations').update({ updated_at: now }).eq('id', conversationId)
  return { ok: true, emptied_at: now }
}

export async function deleteConversationForCurrentUser(currentUser: MinimalAppUser, conversationId: string) {
  const supabase = await createClient()
  const currentUserId = userId(currentUser)
  const membership = await isConversationMember(supabase, conversationId, currentUserId)
  if (!membership) throw new Error('Cannot delete this private conversation')

  const { data: conversation, error: conversationError } = await supabase
    .from('connect_conversations')
    .select('*')
    .eq('id', conversationId)
    .maybeSingle()
  assertSupabaseOk(conversationError, 'Load Connect conversation for delete')

  const canArchiveForEveryone = isCeoUser(currentUser) || membership.role === 'owner' || membership.role === 'admin'
  if (canArchiveForEveryone && conversation?.type === 'room') {
    const { error } = await supabase
      .from('connect_conversations')
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .eq('id', conversationId)
    assertSupabaseOk(error, 'Archive Connect room')
    return { ok: true, archived: true }
  }

  const { error } = await supabase
    .from('connect_conversation_members')
    .delete()
    .eq('conversation_id', conversationId)
    .eq('user_id', currentUserId)
  assertSupabaseOk(error, 'Remove Connect conversation from user')
  return { ok: true, removed: true }
}

export async function getNotifications(currentUser: MinimalAppUser): Promise<ConnectNotification[]> {
  const supabase = await createClient()
  const currentUserId = userId(currentUser)
  const department = cleanText(currentUser.department)
  const orTerms = [`user_id.eq.${currentUserId}`, 'audience.eq.all', 'audience.eq.selected']
  if (department) orTerms.push(`audience.eq.${department}`)
  const { data, error } = await supabase.from('connect_notifications').select('*').or(orTerms.join(',')).order('created_at', { ascending: false }).limit(150)
  assertSupabaseOk(error, 'Load Connect notifications')
  return (data || []) as ConnectNotification[]
}

export async function createNotification(currentUser: MinimalAppUser, payload: Partial<ConnectNotification>) {
  if (!canUseConnectAdminActions(currentUser) && payload.audience === 'all') throw new Error('Company-wide Connect notifications are restricted')
  const supabase = await createClient()
  const { data, error } = await supabase.from('connect_notifications').insert({
    user_id: payload.user_id || null,
    audience: payload.audience || 'selected',
    title: cleanText(payload.title, 'Connect notification'),
    body: cleanText(payload.body),
    priority: payload.priority || 'normal',
    read: false,
    created_by: userId(currentUser),
    source_type: payload.source_type || null,
    source_id: payload.source_id || null,
    metadata: payload.metadata || {},
  }).select('*').single()
  assertSupabaseOk(error, 'Create Connect notification')
  return data as ConnectNotification
}


// CONNECT_ACTION_ASSIGNEE_RESILIENCE_PATCH
async function attachActionAssignees(supabase: SupabaseClient, actions: any[]): Promise<ConnectAction[]> {
  if (!actions.length) return []
  const actionIds = actions.map((action) => String(action.id))

  let assigneeRows: any[] = []
  try {
    const { data: rows, error } = await supabase
      .from('connect_action_assignees')
      .select('*')
      .in('action_id', actionIds)
    assertSupabaseOk(error, 'Load Connect task assignees')
    assigneeRows = (rows || []) as any[]
  } catch (error) {
    console.warn('[Connect] Task assignee load failed; returning actions without assignee hydration', error)
    return actions.map((action) => ({
      ...(action as ConnectAction),
      assignees: [],
      assignee_ids: [],
    }))
  }

  const users = await getUsersByIds(supabase, normalizeIds(assigneeRows.map((row) => row.user_id)))
  const grouped = new Map<string, any[]>()
  for (const row of assigneeRows) {
    const key = String(row.action_id)
    grouped.set(key, [...(grouped.get(key) || []), { ...row, user: users.get(String(row.user_id)) || null }])
  }
  return actions.map((action) => {
    const assignees = grouped.get(String(action.id)) || []
    return {
      ...(action as ConnectAction),
      assignees,
      assignee_ids: assignees.map((assignee) => String(assignee.user_id)),
    }
  })
}

async function canSeeAction(supabase: SupabaseClient, currentUserId: string, actionId: string) {
  const { data: action, error } = await supabase
    .from('connect_actions')
    .select('id, created_by, owner_id')
    .eq('id', actionId)
    .maybeSingle()
  assertSupabaseOk(error, 'Load Connect task')
  if (!action) return null
  if (String(action.created_by || '') === currentUserId || String(action.owner_id || '') === currentUserId) return action
  const { data: assignee, error: assigneeError } = await supabase
    .from('connect_action_assignees')
    .select('id')
    .eq('action_id', actionId)
    .eq('user_id', currentUserId)
    .maybeSingle()
  assertSupabaseOk(assigneeError, 'Check Connect task assignment')
  return assignee ? action : null
}

// CONNECT_GET_ACTIONS_RESILIENCE_PATCH
export async function getActions(currentUser: MinimalAppUser): Promise<ConnectAction[]> {
  const supabase = await createClient()
  const currentUserId = userId(currentUser)

  let assignedIds: string[] = []
  try {
    const { data: assignedRows, error: assignedError } = await supabase
      .from('connect_action_assignees')
      .select('action_id')
      .eq('user_id', currentUserId)
    assertSupabaseOk(assignedError, 'Load assigned Connect tasks')
    assignedIds = normalizeIds(((assignedRows || []) as any[]).map((row) => row.action_id))
  } catch (error) {
    console.warn('[Connect] Assigned task lookup failed; continuing with owned/created tasks only', error)
  }

  const orTerms = [`owner_id.eq.${currentUserId}`, `created_by.eq.${currentUserId}`]
  if (assignedIds.length) orTerms.push(`id.in.(${assignedIds.join(',')})`)

  const { data, error } = await supabase
    .from('connect_actions')
    .select('*')
    .or(orTerms.join(','))
    .order('created_at', { ascending: false })
    .limit(250)
  assertSupabaseOk(error, 'Load Connect tasks')
  return attachActionAssignees(supabase, (data || []) as any[])
}

export async function createAction(currentUser: MinimalAppUser, payload: Partial<ConnectAction> & { assigneeIds?: string[]; assignee_ids?: string[] }) {
  const supabase = await createClient()
  const currentUserId = userId(currentUser)
  const assigneeIds = normalizeIds([...(payload.assigneeIds || []), ...(payload.assignee_ids || []), payload.owner_id || null])
  const finalAssigneeIds = assigneeIds.length ? assigneeIds : [currentUserId]
  const ownerId = finalAssigneeIds[0] || currentUserId

  const conversationId = cleanText((payload as any).conversation_id)
  if (conversationId) {
    const membership = await isConversationMember(supabase, conversationId, currentUserId)
    if (!membership) throw new Error('Cannot create a task from a private conversation you cannot access')
  }

  const { data, error } = await supabase.from('connect_actions').insert({
    source: 'connect',
    source_message_id: payload.source_message_id || null,
    conversation_id: conversationId || null,
    title: cleanText(payload.title, 'Connect follow-up'),
    description: cleanText((payload as any).description),
    owner_id: ownerId,
    status: payload.status || 'open',
    priority: payload.priority || 'normal',
    due_at: payload.due_at || null,
    created_by: currentUserId,
  }).select('*').single()
  assertSupabaseOk(error, 'Create Connect task')
  const action = data as any

  const assignmentRows = finalAssigneeIds.map((assignedUserId) => ({
    action_id: action.id,
    user_id: assignedUserId,
    assigned_by: currentUserId,
  }))
  if (assignmentRows.length) {
    const { error: assignError } = await supabase
      .from('connect_action_assignees')
      .upsert(assignmentRows, { onConflict: 'action_id,user_id' })
    assertSupabaseOk(assignError, 'Assign Connect task')
  }

  for (const assignedUserId of finalAssigneeIds) {
    if (String(assignedUserId) === currentUserId) continue
    await supabase.from('connect_notifications').insert({
      user_id: assignedUserId,
      audience: 'selected',
      title: `New Connect task · ${cleanText(payload.title, 'Connect follow-up')}`,
      body: cleanText((payload as any).description, 'A Connect task was assigned to you.'),
      priority: payload.priority || 'normal',
      read: false,
      created_by: currentUserId,
      source_type: 'action',
      source_id: String(action.id),
      metadata: { action_id: String(action.id), conversation_id: conversationId || null },
    })
  }

  if (conversationId) {
    await sendMessage(currentUser, {
      conversationId,
      body: `Task created: ${cleanText(payload.title, 'Connect follow-up')}`,
      message_type: 'task',
      priority: payload.priority || 'normal',
      confidential: true,
      metadata: { action_id: action.id, assignee_ids: finalAssigneeIds },
    })
  }

  const [withAssignees] = await attachActionAssignees(supabase, [action])
  return withAssignees
}

export async function updateAction(currentUser: MinimalAppUser, actionId: string, payload: Partial<ConnectAction> & { assigneeIds?: string[]; assignee_ids?: string[] }) {
  const supabase = await createClient()
  const currentUserId = userId(currentUser)
  const visible = await canSeeAction(supabase, currentUserId, actionId)
  if (!visible) throw new Error('Cannot edit a Connect task you cannot access')

  const updates: Record<string, unknown> = {}
  if (payload.title !== undefined) updates.title = cleanText(payload.title, 'Connect follow-up')
  if ((payload as any).description !== undefined) updates.description = cleanText((payload as any).description)
  if (payload.priority !== undefined) updates.priority = payload.priority
  if (payload.status !== undefined) updates.status = payload.status
  if (payload.due_at !== undefined) updates.due_at = payload.due_at || null
  if (payload.status === 'done') updates.completed_at = new Date().toISOString()
  if (Object.keys(updates).length) {
    const { error } = await supabase.from('connect_actions').update(updates).eq('id', actionId)
    assertSupabaseOk(error, 'Update Connect task')
  }

  const idsSupplied = payload.assigneeIds !== undefined || payload.assignee_ids !== undefined
  if (idsSupplied) {
    const nextAssignees = normalizeIds([...(payload.assigneeIds || []), ...(payload.assignee_ids || [])])
    if (!nextAssignees.length) throw new Error('Select at least one assignee for this Connect task')
    const { data: previousRows } = await supabase.from('connect_action_assignees').select('user_id').eq('action_id', actionId)
    const previous = new Set(((previousRows || []) as any[]).map((row) => String(row.user_id)))
    const { error: deleteError } = await supabase.from('connect_action_assignees').delete().eq('action_id', actionId)
    assertSupabaseOk(deleteError, 'Refresh Connect task assignees')
    const { error: insertError } = await supabase.from('connect_action_assignees').insert(nextAssignees.map((assignedUserId) => ({ action_id: actionId, user_id: assignedUserId, assigned_by: currentUserId })))
    assertSupabaseOk(insertError, 'Save Connect task assignees')
    await supabase.from('connect_actions').update({ owner_id: nextAssignees[0] }).eq('id', actionId)
    const title = cleanText(payload.title, 'Updated Connect task')
    for (const assignedUserId of nextAssignees) {
      if (previous.has(String(assignedUserId)) || String(assignedUserId) === currentUserId) continue
      await supabase.from('connect_notifications').insert({
        user_id: assignedUserId,
        audience: 'selected',
        title: `Connect task assigned · ${title}`,
        body: cleanText((payload as any).description, 'A Connect task is now visible in your task manager.'),
        priority: payload.priority || 'normal',
        read: false,
        created_by: currentUserId,
        source_type: 'action',
        source_id: actionId,
        metadata: { action_id: actionId },
      })
    }
  }

  const { data, error } = await supabase.from('connect_actions').select('*').eq('id', actionId).single()
  assertSupabaseOk(error, 'Reload Connect task')
  const [withAssignees] = await attachActionAssignees(supabase, [data as any])
  return withAssignees
}

export async function deleteAction(currentUser: MinimalAppUser, actionId: string) {
  const supabase = await createClient()
  const currentUserId = userId(currentUser)
  const visible = await canSeeAction(supabase, currentUserId, actionId)
  if (!visible) throw new Error('Cannot delete a Connect task you cannot access')
  const { error: assigneeError } = await supabase.from('connect_action_assignees').delete().eq('action_id', actionId)
  assertSupabaseOk(assigneeError, 'Delete Connect task assignments')
  const { error } = await supabase.from('connect_actions').delete().eq('id', actionId)
  assertSupabaseOk(error, 'Delete Connect task')
  return { ok: true, deleted: true }
}

export async function getConnectRooms(currentUser: MinimalAppUser) {
  const conversations = await getMyConversations(currentUser)
  return conversations.filter((conversation) => conversation.type !== 'direct')
}

export async function createBroadcast(currentUser: MinimalAppUser, payload: { title?: string; body?: string; priority?: ConnectPriority; audience?: string; department?: string | null }) {
  if (!canCreateExecutiveBroadcast(currentUser)) throw new Error('Broadcasts are restricted to Direction/Admin users')
  const audience = payload.audience || 'all'
  const conversation = await createConversation(currentUser, {
    title: payload.title || 'AngelCare broadcast',
    type: 'broadcast',
    privacy_level: audience === 'all' ? 'public_readonly' : 'executive',
    department: payload.department || null,
    memberIds: [],
  })
  const message = await sendMessage(currentUser, {
    conversationId: conversation.id,
    body: payload.body || payload.title || 'Broadcast',
    priority: payload.priority || 'important',
    confidential: conversation.privacy_level === 'executive',
    metadata: { audience },
  })
  const notification = await createNotification(currentUser, {
    audience,
    title: payload.title || 'AngelCare broadcast',
    body: payload.body || '',
    priority: payload.priority || 'important',
  })
  return { conversation, message, notification }
}



export async function updateMessage(currentUser: MinimalAppUser, messageId: string, payload: Partial<ConnectMessage>) {
  const supabase = await createClient()
  const currentUserId = userId(currentUser)
  const { data: existing, error: existingError } = await supabase
    .from('connect_messages')
    .select('id, conversation_id, sender_id, message_type')
    .eq('id', messageId)
    .is('deleted_at', null)
    .maybeSingle()
  assertSupabaseOk(existingError, 'Load Connect message')
  if (!existing) throw new Error('Connect message not found')
  if (String((existing as any).sender_id) !== currentUserId) throw new Error('Cannot edit another user message')
  const membership = await isConversationMember(supabase, String((existing as any).conversation_id), currentUserId)
  if (!membership) throw new Error('Private conversation: current user is not a member')
  const updates: Record<string, unknown> = { edited_at: new Date().toISOString() }
  if (payload.body !== undefined) updates.body = cleanText(payload.body, 'Updated Connect message')
  if (payload.priority !== undefined) updates.priority = payload.priority
  if (payload.confidential !== undefined) updates.confidential = Boolean(payload.confidential)
  if (payload.metadata !== undefined) updates.metadata = payload.metadata || {}
  const { data, error } = await supabase.from('connect_messages').update(updates).eq('id', messageId).select('*').single()
  assertSupabaseOk(error, 'Update Connect message')
  await supabase.from('connect_conversations').update({ updated_at: new Date().toISOString() }).eq('id', String((existing as any).conversation_id))
  return data as ConnectMessage
}

export async function deleteMessage(currentUser: MinimalAppUser, messageId: string) {
  const supabase = await createClient()
  const currentUserId = userId(currentUser)
  const { data: existing, error: existingError } = await supabase
    .from('connect_messages')
    .select('id, conversation_id, sender_id, message_type')
    .eq('id', messageId)
    .is('deleted_at', null)
    .maybeSingle()
  assertSupabaseOk(existingError, 'Load Connect message')
  if (!existing) throw new Error('Connect message not found')
  const membership = await isConversationMember(supabase, String((existing as any).conversation_id), currentUserId)
  if (!membership) throw new Error('Private conversation: current user is not a member')
  const ownsMessage = String((existing as any).sender_id) === currentUserId
  const canAdminDelete = ['owner', 'admin'].includes(String(membership.role || '')) || canUseConnectAdminActions(currentUser)
  if (!ownsMessage && !canAdminDelete) throw new Error('Cannot delete this Connect message')
  const { error } = await supabase.from('connect_messages').update({ deleted_at: new Date().toISOString() }).eq('id', messageId)
  assertSupabaseOk(error, 'Delete Connect message')
  return { ok: true, deleted: true }
}

export async function createAttachmentRecord(currentUser: MinimalAppUser, payload: AttachmentPayload): Promise<ConnectAttachment> {
  const supabase = await createClient()
  const currentUserId = userId(currentUser)
  const conversationId = cleanText(payload.conversationId)
  if (!conversationId) throw new Error('conversationId required')
  const membership = await isConversationMember(supabase, conversationId, currentUserId)
  if (!membership) throw new Error('Private conversation: current user is not a member')
  const { data, error } = await supabase
    .from('connect_attachments')
    .insert({
      conversation_id: conversationId,
      message_id: payload.messageId || null,
      storage_bucket: CONNECT_ATTACHMENTS_BUCKET,
      storage_path: payload.storagePath,
      filename: payload.filename,
      content_type: payload.contentType || 'application/octet-stream',
      size_bytes: payload.sizeBytes || 0,
      uploaded_by: currentUserId,
    })
    .select('*')
    .single()
  assertSupabaseOk(error, 'Create Connect attachment metadata')
  return data as ConnectAttachment
}

export async function attachMessageToAttachment(currentUser: MinimalAppUser, attachmentId: string, messageId: string) {
  const supabase = await createClient()
  const currentUserId = userId(currentUser)
  const { data: attachment, error: loadError } = await supabase
    .from('connect_attachments')
    .select('id, conversation_id, uploaded_by')
    .eq('id', attachmentId)
    .maybeSingle()
  assertSupabaseOk(loadError, 'Load Connect attachment')
  if (!attachment) throw new Error('Connect attachment not found')
  const membership = await isConversationMember(supabase, String((attachment as any).conversation_id), currentUserId)
  if (!membership || String((attachment as any).uploaded_by || '') !== currentUserId) throw new Error('Cannot update this Connect attachment')
  const { error } = await supabase
    .from('connect_attachments')
    .update({ message_id: messageId })
    .eq('id', attachmentId)
  assertSupabaseOk(error, 'Link Connect attachment message')
  return { ok: true }
}

export async function getAttachments(currentUser: MinimalAppUser, conversationId: string): Promise<ConnectAttachment[]> {
  const supabase = await createClient()
  const currentUserId = userId(currentUser)
  const membership = await isConversationMember(supabase, conversationId, currentUserId)
  if (!membership) throw new Error('Private conversation: current user is not a member')
  const { data, error } = await supabase
    .from('connect_attachments')
    .select('*')
    .eq('conversation_id', conversationId)
    .is('deleted_at', null)
    .order('uploaded_at', { ascending: false })
    .limit(250)
  assertSupabaseOk(error, 'Load Connect attachments')
  const rows = (data || []) as any[]
  const users = await getUsersByIds(supabase, normalizeIds(rows.map((row) => row.uploaded_by)))
  return await Promise.all(rows.map(async (row) => {
    const signed = await supabase.storage.from(CONNECT_ATTACHMENTS_BUCKET).createSignedUrl(String(row.storage_path), 60 * 60)
    return {
      ...(row as ConnectAttachment),
      signed_url: signed.data?.signedUrl || null,
      uploader_name: users.get(String(row.uploaded_by))?.name || null,
    }
  }))
}

export async function deleteAttachment(currentUser: MinimalAppUser, params: { attachmentId?: string | null; messageId?: string | null }) {
  const supabase = await createClient()
  const currentUserId = userId(currentUser)
  const attachmentId = cleanText(params.attachmentId)
  const messageId = cleanText(params.messageId)
  if (!attachmentId && !messageId) throw new Error('attachmentId or messageId required')

  let attachment: any | null = null
  if (attachmentId) {
    const { data, error } = await supabase
      .from('connect_attachments')
      .select('*')
      .eq('id', attachmentId)
      .is('deleted_at', null)
      .maybeSingle()
    assertSupabaseOk(error, 'Load Connect attachment')
    attachment = data
  } else if (messageId) {
    const { data, error } = await supabase
      .from('connect_attachments')
      .select('*')
      .eq('message_id', messageId)
      .is('deleted_at', null)
      .maybeSingle()
    assertSupabaseOk(error, 'Load Connect attachment from message')
    attachment = data
  }

  if (!attachment && messageId) {
    const { data: message, error } = await supabase
      .from('connect_messages')
      .select('id, conversation_id, sender_id, metadata')
      .eq('id', messageId)
      .is('deleted_at', null)
      .maybeSingle()
    assertSupabaseOk(error, 'Load Connect file message')
    if (!message) throw new Error('Connect attachment not found')
    const metadata = ((message as any).metadata || {}) as Record<string, unknown>
    attachment = {
      id: null,
      message_id: String((message as any).id),
      conversation_id: String((message as any).conversation_id),
      uploaded_by: String((message as any).sender_id),
      storage_path: cleanText(metadata.storage_path),
    }
  }

  if (!attachment) throw new Error('Connect attachment not found')
  const membership = await isConversationMember(supabase, String(attachment.conversation_id), currentUserId)
  if (!membership) throw new Error('Private conversation: current user is not a member')
  const ownsAttachment = String(attachment.uploaded_by || '') === currentUserId
  const canAdminDelete = ['owner', 'admin'].includes(String(membership.role || '')) || canUseConnectAdminActions(currentUser)
  if (!ownsAttachment && !canAdminDelete) throw new Error('Cannot delete this Connect attachment')

  if (attachment.storage_path) {
    const removed = await supabase.storage.from(CONNECT_ATTACHMENTS_BUCKET).remove([String(attachment.storage_path)])
    if (removed.error) throw new Error(`Delete Connect storage object: ${removed.error.message}`)
  }

  const now = new Date().toISOString()
  if (attachment.id) {
    const { error } = await supabase
      .from('connect_attachments')
      .update({ deleted_at: now })
      .eq('id', String(attachment.id))
    assertSupabaseOk(error, 'Soft-delete Connect attachment metadata')
  }
  if (attachment.message_id) {
    const { error } = await supabase
      .from('connect_messages')
      .update({ deleted_at: now })
      .eq('id', String(attachment.message_id))
    assertSupabaseOk(error, 'Soft-delete Connect attachment message')
  }
  await supabase.from('connect_conversations').update({ updated_at: now }).eq('id', String(attachment.conversation_id))
  return { ok: true, deleted: true }
}

export async function markNotificationsRead(currentUser: MinimalAppUser, notificationIds?: string[]) {
  const supabase = await createClient()
  const currentUserId = userId(currentUser)
  let query = supabase.from('connect_notifications').update({ read: true, read_at: new Date().toISOString() }).eq('user_id', currentUserId)
  if (notificationIds?.length) query = query.in('id', normalizeIds(notificationIds))
  const { error } = await query
  assertSupabaseOk(error, 'Mark Connect notifications read')
  return { ok: true }
}

export async function muteConversation(currentUser: MinimalAppUser, conversationId: string, muted: boolean) {
  const supabase = await createClient()
  const currentUserId = userId(currentUser)
  const membership = await isConversationMember(supabase, conversationId, currentUserId)
  if (!membership) throw new Error('Cannot update this private conversation')
  const { error } = await supabase
    .from('connect_conversation_members')
    .update({ muted })
    .eq('conversation_id', conversationId)
    .eq('user_id', currentUserId)
  assertSupabaseOk(error, 'Update Connect conversation mute')
  return { ok: true, muted }
}

function normalizeCallStatus(status: unknown): ConnectCallSession['status'] {
  const value = String(status || '').trim().toLowerCase()
  if (value === 'active') return 'connected'
  if (value === 'created') return 'ringing'
  if (['ringing', 'answered', 'connected', 'rejected', 'ended', 'missed'].includes(value)) return value as ConnectCallSession['status']
  return 'ringing'
}

function terminalCallStatus(status: unknown) {
  return ['rejected', 'ended', 'missed'].includes(String(status || '').trim().toLowerCase())
}

async function getCallParticipantRows(supabase: SupabaseClient, callIds: string[]) {
  if (!callIds.length) return [] as any[]
  const { data, error } = await supabase
    .from('connect_call_participants')
    .select('*')
    .in('call_id', callIds)
  assertSupabaseOk(error, 'Load Connect call participants')
  return (data || []) as any[]
}

async function canAccessCall(supabase: SupabaseClient, call: any, currentUserId: string) {
  if (String(call.started_by || '') === currentUserId || String(call.receiver_id || '') === currentUserId) return true
  const { data, error } = await supabase
    .from('connect_call_participants')
    .select('id')
    .eq('call_id', String(call.id))
    .eq('user_id', currentUserId)
    .maybeSingle()
  assertSupabaseOk(error, 'Check Connect call participant')
  return Boolean(data)
}

async function sendCallEventMessage(supabase: SupabaseClient, call: any, actorId: string, body: string) {
  if (!call.conversation_id) return
  const { error } = await supabase.from('connect_messages').insert({
    conversation_id: String(call.conversation_id),
    sender_id: actorId,
    sender_name: 'AngelCare Connect',
    body,
    message_type: 'call',
    priority: 'important',
    confidential: false,
    metadata: {
      call_id: String(call.id),
      room_name: call.room_name,
      call_type: call.call_type,
      status: call.status,
    },
  })
  assertSupabaseOk(error, 'Create Connect call history message')
  await supabase.from('connect_conversations').update({ updated_at: new Date().toISOString() }).eq('id', String(call.conversation_id))
}

async function hydrateCalls(supabase: SupabaseClient, calls: any[]): Promise<ConnectCallSession[]> {
  const participantRows = await getCallParticipantRows(supabase, calls.map((call) => String(call.id)))
  const participantIdsByCall = new Map<string, string[]>()
  for (const row of participantRows) {
    const key = String(row.call_id)
    participantIdsByCall.set(key, [...(participantIdsByCall.get(key) || []), String(row.user_id)])
  }
  const users = await getUsersByIds(supabase, normalizeIds(calls.map((call) => call.started_by)))
  return calls.map((call) => ({
    ...(call as ConnectCallSession),
    status: normalizeCallStatus(call.status),
    started_by_name: users.get(String(call.started_by))?.name || null,
    participant_ids: participantIdsByCall.get(String(call.id)) || [],
  }))
}

async function markStaleRingingCallsMissed(supabase: SupabaseClient, calls: any[], currentUserId: string) {
  const cutoff = Date.now() - CONNECT_MISSED_CALL_MS
  const stale = calls.filter((call) => normalizeCallStatus(call.status) === 'ringing' && new Date(call.started_at || 0).getTime() < cutoff)
  if (!stale.length) return
  const now = new Date().toISOString()
  for (const call of stale) {
    const { data: updated, error } = await supabase
      .from('connect_call_sessions')
      .update({ status: 'missed', ended_at: now, updated_at: now })
      .eq('id', String(call.id))
      .eq('status', 'ringing')
      .select('*')
      .maybeSingle()
    assertSupabaseOk(error, 'Mark stale Connect call missed')
    if (!updated) continue
    const participantRows = await getCallParticipantRows(supabase, [String(call.id)])
    const targetIds = normalizeIds(participantRows
      .map((row) => row.user_id)
      .filter((id) => String(id) !== String(call.started_by)))
    await createRecipientNotifications(supabase, targetIds.map((targetId) => ({
      user_id: targetId,
      audience: 'selected',
      title: 'Missed Connect call',
      body: `Missed ${call.call_type || 'audio'} call from ${cleanText(call.started_by_name, 'AngelCare Connect')}.`,
      priority: 'important',
      read: false,
      created_by: currentUserId,
      source_type: 'call',
      source_id: String(call.id),
      metadata: { call_id: String(call.id), conversation_id: call.conversation_id || null, status: 'missed' },
    })), 'Create Connect missed call notifications')
    await sendCallEventMessage(supabase, { ...call, status: 'missed' }, currentUserId, `${call.call_type === 'video' ? 'Video' : 'Audio'} call missed.`)
  }
}

export async function updateCall(currentUser: MinimalAppUser, callId: string, payload: Partial<ConnectCallSession>) {
  const supabase = await createClient()
  const currentUserId = userId(currentUser)
  const { data: existing, error: existingError } = await supabase
    .from('connect_call_sessions')
    .select('*')
    .eq('id', callId)
    .maybeSingle()
  assertSupabaseOk(existingError, 'Load Connect call')
  if (!existing) throw new Error('Connect call not found')
  const canUpdate = await canAccessCall(supabase, existing, currentUserId)
  if (!canUpdate) throw new Error('Cannot update this Connect call')
  if (terminalCallStatus((existing as any).status)) throw new Error('Connect call is already closed')
  const nextStatus = payload.status ? normalizeCallStatus(payload.status) : normalizeCallStatus((existing as any).status)
  if (nextStatus === 'ringing') throw new Error('Use call create to start a ringing Connect call')
  const updates: Record<string, unknown> = {}
  const now = new Date().toISOString()
  updates.status = nextStatus
  updates.updated_at = now
  if (nextStatus === 'answered') updates.answered_at = now
  if (nextStatus === 'connected') {
    updates.answered_at = (existing as any).answered_at || now
    updates.connected_at = (existing as any).connected_at || now
  }
  if (terminalCallStatus(nextStatus)) updates.ended_at = now
  if (payload.metadata) updates.metadata = payload.metadata
  const { data, error } = await supabase.from('connect_call_sessions').update(updates).eq('id', callId).select('*').single()
  assertSupabaseOk(error, 'Update Connect call')

  await supabase
    .from('connect_call_participants')
    .upsert({
      call_id: callId,
      user_id: currentUserId,
      status: nextStatus,
      joined_at: nextStatus === 'answered' || nextStatus === 'connected' ? now : null,
      left_at: terminalCallStatus(nextStatus) ? now : null,
    }, { onConflict: 'call_id,user_id' })

  const call = data as any
  if (nextStatus === 'connected' || nextStatus === 'answered') {
    await createRecipientNotifications(supabase, [{
      user_id: String(call.started_by),
      audience: 'selected',
      title: 'Connect call answered',
      body: `${userName(currentUser as any)} answered the ${call.call_type || 'audio'} call.`,
      priority: 'important',
      read: false,
      created_by: currentUserId,
      source_type: 'call',
      source_id: callId,
      metadata: { call_id: callId, conversation_id: call.conversation_id || null, status: nextStatus },
    }].filter((row) => String(row.user_id) !== currentUserId), 'Create Connect answered call notification')
    await sendCallEventMessage(supabase, call, currentUserId, `${call.call_type === 'video' ? 'Video' : 'Audio'} call connected.`)
  }
  if (nextStatus === 'rejected') {
    await createRecipientNotifications(supabase, [{
      user_id: String(call.started_by),
      audience: 'selected',
      title: 'Connect call rejected',
      body: `${userName(currentUser as any)} rejected the ${call.call_type || 'audio'} call.`,
      priority: 'important',
      read: false,
      created_by: currentUserId,
      source_type: 'call',
      source_id: callId,
      metadata: { call_id: callId, conversation_id: call.conversation_id || null, status: 'rejected' },
    }].filter((row) => String(row.user_id) !== currentUserId), 'Create Connect rejected call notification')
    await sendCallEventMessage(supabase, call, currentUserId, `${call.call_type === 'video' ? 'Video' : 'Audio'} call rejected.`)
  }
  if (nextStatus === 'ended') {
    await sendCallEventMessage(supabase, call, currentUserId, `${call.call_type === 'video' ? 'Video' : 'Audio'} call ended.`)
  }
  const [hydrated] = await hydrateCalls(supabase, [call])
  return hydrated
}

export async function getCalls(currentUser: MinimalAppUser): Promise<ConnectCallSession[]> {
  const supabase = await createClient()
  const currentUserId = userId(currentUser)
  const { data: participantRows, error: participantError } = await supabase
    .from('connect_call_participants')
    .select('call_id')
    .eq('user_id', currentUserId)
  assertSupabaseOk(participantError, 'Load my Connect call participants')
  const participantCallIds = normalizeIds(((participantRows || []) as any[]).map((row) => row.call_id))
  const orTerms = [`started_by.eq.${currentUserId}`, `receiver_id.eq.${currentUserId}`]
  if (participantCallIds.length) orTerms.push(`id.in.(${participantCallIds.join(',')})`)
  const { data, error } = await supabase
    .from('connect_call_sessions')
    .select('*')
    .or(orTerms.join(','))
    .order('started_at', { ascending: false })
    .limit(100)
  assertSupabaseOk(error, 'Load Connect calls')
  await markStaleRingingCallsMissed(supabase, (data || []) as any[], currentUserId)
  const { data: refreshed, error: refreshError } = await supabase
    .from('connect_call_sessions')
    .select('*')
    .or(orTerms.join(','))
    .order('started_at', { ascending: false })
    .limit(100)
  assertSupabaseOk(refreshError, 'Reload Connect calls')
  return hydrateCalls(supabase, (refreshed || []) as any[])
}

export async function createCall(currentUser: MinimalAppUser, payload: Partial<ConnectCallSession>) {
  const supabase = await createClient()
  const currentUserId = userId(currentUser)
  const conversationId = payload.conversation_id || null
  let memberRows: any[] = []
  if (conversationId) {
    const membership = await isConversationMember(supabase, conversationId, currentUserId)
    if (!membership) throw new Error('Cannot start call in a private conversation')
    memberRows = await getConversationMemberRows(supabase, conversationId)
  }
  const targetIds = normalizeIds([
    payload.receiver_id || null,
    ...memberRows.map((member) => member.user_id).filter((id) => String(id) !== currentUserId),
  ])
  if (!targetIds.length) throw new Error('Select at least one Connect call recipient')
  const roomName = payload.room_name || `angelcare-connect-${randomUUID()}`
  const status = normalizeCallStatus(payload.status || 'ringing')
  const { data, error } = await supabase.from('connect_call_sessions').insert({
    conversation_id: conversationId,
    room_name: roomName,
    call_type: payload.call_type || 'audio',
    status,
    started_by: currentUserId,
    receiver_id: payload.receiver_id || targetIds[0] || null,
    metadata: { ...(payload.metadata || {}), participant_ids: targetIds },
  }).select('*').single()
  assertSupabaseOk(error, 'Create Connect call')
  const call = data as any
  const participantRows = normalizeIds([currentUserId, ...targetIds]).map((participantId) => ({
    call_id: String(call.id),
    user_id: participantId,
    role: participantId === currentUserId ? 'caller' : 'receiver',
    status: participantId === currentUserId ? 'ringing' : 'ringing',
  }))
  const { error: participantError } = await supabase
    .from('connect_call_participants')
    .upsert(participantRows, { onConflict: 'call_id,user_id' })
  assertSupabaseOk(participantError, 'Create Connect call participants')
  const title = conversationId ? await getConversationTitle(supabase, String(conversationId)) : 'AngelCare Connect'
  await createRecipientNotifications(supabase, targetIds.map((targetId) => ({
    user_id: targetId,
    audience: 'selected',
    title: `Incoming Connect ${call.call_type} call`,
    body: `${userName(currentUser as any)} is calling in ${title}.`,
    priority: 'urgent',
    read: false,
    created_by: currentUserId,
    source_type: 'call',
    source_id: String(call.id),
    metadata: { call_id: String(call.id), conversation_id: conversationId, status: 'ringing', room_name: roomName },
  })), 'Create Connect incoming call notifications')
  await sendCallEventMessage(supabase, call, currentUserId, `${call.call_type === 'video' ? 'Video' : 'Audio'} call ringing.`)
  const [hydrated] = await hydrateCalls(supabase, [call])
  return hydrated
}
