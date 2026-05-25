export type ConnectConversationType = 'direct' | 'room' | 'broadcast' | 'context'
export type ConnectPrivacyLevel = 'private' | 'department' | 'executive' | 'module' | 'public_readonly'
export type ConnectPriority = 'normal' | 'important' | 'urgent'
export type ConnectPresenceStatus = 'online' | 'busy' | 'away' | 'offline'

export type ConnectAppUser = {
  id: string
  name: string
  full_name?: string | null
  email?: string | null
  role?: string | null
  department?: string | null
  status?: ConnectPresenceStatus
  last_seen_at?: string | null
  current_route?: string | null
}

export type ConnectConversation = {
  id: string
  title: string
  type: ConnectConversationType
  privacy_level: ConnectPrivacyLevel
  department?: string | null
  module_key?: string | null
  created_by?: string | null
  is_archived?: boolean
  created_at?: string
  updated_at?: string
  member_count?: number
  members?: ConnectAppUser[]
  last_message?: string | null
  last_message_at?: string | null
  unread_count?: number
  pinned?: boolean
  muted?: boolean
  my_role?: 'owner' | 'admin' | 'member' | 'viewer'
}

export type ConnectMember = {
  id: string
  conversation_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  muted: boolean
  pinned: boolean
  last_read_at?: string | null
  joined_at?: string
}

export type ConnectMessage = {
  id: string
  conversation_id: string
  sender_id: string
  sender_name?: string
  sender_role?: string | null
  body: string
  message_type: 'text' | 'system' | 'task' | 'approval' | 'call' | 'file'
  priority: ConnectPriority
  confidential: boolean
  metadata?: Record<string, unknown>
  created_at: string
  edited_at?: string | null
  deleted_at?: string | null
  read_count?: number
}

export type ConnectNotification = {
  id: string
  user_id?: string | null
  audience: string
  title: string
  body?: string | null
  priority: ConnectPriority
  read: boolean
  created_by?: string | null
  created_at: string
}

export type ConnectActionAssignee = {
  id?: string
  action_id?: string
  user_id: string
  assigned_by?: string | null
  assigned_at?: string
  completed_at?: string | null
  user?: ConnectAppUser | null
}

export type ConnectAction = {
  id: string
  source: string
  source_message_id?: string | null
  conversation_id?: string | null
  title: string
  description?: string | null
  owner_id?: string | null
  status: 'open' | 'in_progress' | 'blocked' | 'done' | 'cancelled' | string
  priority: ConnectPriority
  due_at?: string | null
  created_by?: string | null
  created_at: string
  completed_at?: string | null
  assignee_ids?: string[]
  assignees?: ConnectActionAssignee[]
}

export type ConnectCallSession = {
  id: string
  conversation_id?: string | null
  room_name: string
  call_type: 'audio' | 'video'
  status: 'ringing' | 'active' | 'missed' | 'ended' | 'rejected' | 'created'
  started_by?: string | null
  receiver_id?: string | null
  started_at?: string
  ended_at?: string | null
  metadata?: Record<string, unknown>
}
