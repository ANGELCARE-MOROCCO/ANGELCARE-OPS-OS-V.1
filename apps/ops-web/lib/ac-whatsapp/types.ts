export type AcWhatsAppPermission =
  | 'ac-whatsapp.view'
  | 'ac-whatsapp.inbox.view'
  | 'ac-whatsapp.message.send'
  | 'ac-whatsapp.message.delete'
  | 'ac-whatsapp.conversation.assign'
  | 'ac-whatsapp.conversation.close'
  | 'ac-whatsapp.contact.manage'
  | 'ac-whatsapp.campaign.view'
  | 'ac-whatsapp.campaign.manage'
  | 'ac-whatsapp.campaign.launch'
  | 'ac-whatsapp.account.manage'
  | 'ac-whatsapp.members.manage'
  | 'ac-whatsapp.templates.manage'
  | 'ac-whatsapp.automation.manage'
  | 'ac-whatsapp.analytics.view'
  | 'ac-whatsapp.quality.review'
  | 'ac-whatsapp.security.manage'
  | 'ac-whatsapp.audit.view'

export type AcWhatsAppAccountStatus =
  | 'draft' | 'starting' | 'authenticating' | 'qr_required' | 'pairing_required'
  | 'connected' | 'reconnecting' | 'degraded' | 'rate_limited' | 'disconnected'
  | 'authentication_lost' | 'paused' | 'suspended' | 'error'

export type AcWhatsAppConversationStatus =
  | 'new' | 'unassigned' | 'assigned' | 'in_progress' | 'waiting_customer'
  | 'waiting_internal' | 'scheduled_followup' | 'escalated' | 'resolved'
  | 'closed' | 'reopened' | 'archived'

export type AcWhatsAppMessageStatus =
  | 'draft' | 'scheduled' | 'queued' | 'processing' | 'accepted' | 'sent'
  | 'delivered' | 'read' | 'received' | 'failed' | 'cancelled' | 'expired' | 'revoked'

export type AcWhatsAppAccount = {
  id: string; code: string; name: string; phone_number_e164?: string | null; department?: string | null
  purpose?: string | null; openwa_session_id?: string | null; openwa_session_name?: string | null
  engine_type: 'whatsapp-web.js' | 'baileys'; status: AcWhatsAppAccountStatus; health_score: number
  outbound_enabled: boolean; campaigns_enabled: boolean; cold_prospecting_enabled: boolean
  bulk_messaging_enabled: boolean; runtime_metadata?: Record<string, unknown>; last_activity_at?: string | null
  last_error?: string | null; created_at: string; updated_at: string
}

export type AcWhatsAppQueue = {
  id: string; code: string; name: string; department?: string | null; description?: string | null
  color: string; priority: number; routing_mode: string; status: string
  sla_first_response_minutes: number; sla_resolution_minutes: number
}

export type AcWhatsAppContact = {
  id: string; whatsapp_id: string; phone_number_e164?: string | null; display_name?: string | null
  organization_name?: string | null; contact_type: string; preferred_language: string; city?: string | null
  lead_stage?: string | null; sentiment?: string | null; priority: string; tags: string[]
  last_contact_at?: string | null; last_response_at?: string | null
}

export type AcWhatsAppConversation = {
  id: string; account_id: string; contact_id: string; remote_chat_id: string; queue_id?: string | null
  assigned_user_id?: string | null; status: AcWhatsAppConversationStatus; priority: string; subject?: string | null
  summary?: string | null; sentiment?: string | null; intent?: string | null; unread_count: number
  message_count: number; last_message_preview?: string | null; last_message_direction?: string | null
  last_message_at?: string | null; sla_first_response_due_at?: string | null; sla_resolution_due_at?: string | null
  contact?: AcWhatsAppContact | null; account?: AcWhatsAppAccount | null; queue?: AcWhatsAppQueue | null
  assigned_user?: Record<string, unknown> | null; labels?: Array<{ label_id?: string; label?: Record<string, unknown> | null }>
  last_message_sender_display_name_snapshot?: string | null; last_message_sender_type?: string | null
  last_read_at?: string | null; last_read_by_user_id?: string | null; metadata?: Record<string, unknown>
}

export type AcWhatsAppMessage = {
  id: string; conversation_id: string; external_message_id?: string | null; client_message_id?: string | null
  direction: 'inbound' | 'outbound' | 'internal'; message_type: string; body?: string | null; caption?: string | null
  status: AcWhatsAppMessageStatus; sender_user_id?: string | null; error_message?: string | null
  sender_display_name_snapshot?: string | null; sender_role_snapshot?: string | null; sender_type?: string | null
  message_origin?: string | null; campaign_id?: string | null; campaign_name_snapshot?: string | null
  automation_name_snapshot?: string | null; responsible_user_id?: string | null
  sender_identity?: { display_name: string; role?: string | null; type: string; origin?: string | null }
  responsible_identity?: { display_name: string; role?: string | null } | null
  sent_at?: string | null; delivered_at?: string | null; read_at?: string | null; received_at?: string | null
  created_at: string; attachments?: Array<Record<string, unknown>>
}

export type AcWhatsAppCampaign = {
  id: string; code: string; name: string; campaign_type: string; objective?: string | null; department?: string | null
  owner_user_id?: string | null; account_id?: string | null; queue_id?: string | null; template_id?: string | null
  message_body?: string | null; status: string; total_recipients: number; queued_count: number; sent_count: number
  delivered_count: number; read_count: number; reply_count: number; positive_reply_count: number
  conversion_count: number; failed_count: number; scheduled_at?: string | null; started_at?: string | null
  completed_at?: string | null; created_at: string; account?: AcWhatsAppAccount | null
}

export type AcWhatsAppBootstrap = {
  actor: { id: string; name: string; role: string; permissions: string[] }
  accounts: AcWhatsAppAccount[]; queues: AcWhatsAppQueue[]; conversations: AcWhatsAppConversation[]
  campaigns: AcWhatsAppCampaign[]; contacts: AcWhatsAppContact[]; templates: Array<Record<string, unknown>>
  memberships: Array<Record<string, unknown>>; users: Array<Record<string, unknown>>; labelsCatalog: Array<Record<string, unknown>>; securityEvents: Array<Record<string, unknown>>
  auditEvents: Array<Record<string, unknown>>; presence: Array<Record<string, unknown>>
  counts: Record<string, number>; health: { configured: boolean; openwaReachable: boolean; error?: string }
}
