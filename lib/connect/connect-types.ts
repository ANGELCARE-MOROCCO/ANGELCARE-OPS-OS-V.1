export type ConnectConversationType = 'direct' | 'room' | 'broadcast' | 'context'
export type ConnectPrivacyLevel = 'private' | 'department' | 'executive' | 'module' | 'public_readonly'
export type ConnectPriority = 'normal' | 'important' | 'urgent'

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
}

export type ConnectMember = {
  id: string
  conversation_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  muted: boolean
  pinned: boolean
  last_read_at?: string | null
}

export type ConnectMessage = {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  message_type: 'text' | 'system' | 'task' | 'approval' | 'call' | 'file'
  priority: ConnectPriority
  confidential: boolean
  metadata?: Record<string, unknown>
  created_at: string
}
