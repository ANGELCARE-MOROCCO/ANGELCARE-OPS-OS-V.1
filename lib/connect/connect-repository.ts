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

  const senders = await getUsersByIds(supabase, normalizeIds(((messages || []) as any[]).map((message) => message.sender_id)))
  return ((messages || []) as any[]).map((message) => ({
    ...(message as ConnectMessage),
    sender_name: message.sender_name && message.sender_name !== 'Unknown' ? message.sender_name : senders.get(String(message.sender_id))?.name || 'AngelCare User',
    sender_role: senders.get(String(message.sender_id))?.role || null,
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
  return { ...(message as ConnectMessage), sender_name: sender }
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
  }).select('*').single()
  assertSupabaseOk(error, 'Create Connect notification')
  return data as ConnectNotification
}


async function attachActionAssignees(supabase: SupabaseClient, actions: any[]): Promise<ConnectAction[]> {
  if (!actions.length) return []
  const actionIds = actions.map((action) => String(action.id))
  const { data: rows, error } = await supabase
    .from('connect_action_assignees')
    .select('*')
    .in('action_id', actionIds)
  assertSupabaseOk(error, 'Load Connect task assignees')
  const assigneeRows = (rows || []) as any[]
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

export async function getActions(currentUser: MinimalAppUser): Promise<ConnectAction[]> {
  const supabase = await createClient()
  const currentUserId = userId(currentUser)
  const { data: assignedRows, error: assignedError } = await supabase
    .from('connect_action_assignees')
    .select('action_id')
    .eq('user_id', currentUserId)
  assertSupabaseOk(assignedError, 'Load assigned Connect tasks')

  const assignedIds = normalizeIds(((assignedRows || []) as any[]).map((row) => row.action_id))
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
    }).catch(() => null)
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

export async function markNotificationsRead(currentUser: MinimalAppUser, notificationIds?: string[]) {
  const supabase = await createClient()
  const currentUserId = userId(currentUser)
  let query = supabase.from('connect_notifications').update({ read: true }).eq('user_id', currentUserId)
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
  const ownsCall = String((existing as any).started_by || '') === currentUserId || String((existing as any).receiver_id || '') === currentUserId
  if (!ownsCall) throw new Error('Cannot update this Connect call')
  const updates: Record<string, unknown> = {}
  if (payload.status) updates.status = payload.status
  if (payload.status === 'ended' || payload.status === 'rejected' || payload.status === 'missed') updates.ended_at = new Date().toISOString()
  if (payload.metadata) updates.metadata = payload.metadata
  const { data, error } = await supabase.from('connect_call_sessions').update(updates).eq('id', callId).select('*').single()
  assertSupabaseOk(error, 'Update Connect call')
  return data as ConnectCallSession
}

export async function getCalls(currentUser: MinimalAppUser): Promise<ConnectCallSession[]> {
  const supabase = await createClient()
  const currentUserId = userId(currentUser)
  const { data, error } = await supabase.from('connect_call_sessions').select('*').or(`started_by.eq.${currentUserId},receiver_id.eq.${currentUserId}`).order('started_at', { ascending: false }).limit(100)
  assertSupabaseOk(error, 'Load Connect calls')
  return (data || []) as ConnectCallSession[]
}

export async function createCall(currentUser: MinimalAppUser, payload: Partial<ConnectCallSession>) {
  const supabase = await createClient()
  const conversationId = payload.conversation_id || null
  if (conversationId) {
    const membership = await isConversationMember(supabase, conversationId, userId(currentUser))
    if (!membership) throw new Error('Cannot start call in a private conversation')
  }
  const { data, error } = await supabase.from('connect_call_sessions').insert({
    conversation_id: conversationId,
    room_name: payload.room_name || `angelcare-connect-${randomUUID()}`,
    call_type: payload.call_type || 'audio',
    status: payload.status || 'created',
    started_by: userId(currentUser),
    receiver_id: payload.receiver_id || null,
    metadata: payload.metadata || {},
  }).select('*').single()
  assertSupabaseOk(error, 'Create Connect call')
  return data as ConnectCallSession
}
