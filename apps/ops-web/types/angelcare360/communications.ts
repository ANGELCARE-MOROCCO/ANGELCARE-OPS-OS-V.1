import type { Angelcare360UUID } from './database'
import type { Angelcare360AuditRecord } from './audit'

export type Angelcare360MessageStatus = 'draft' | 'sent_internal' | 'read' | 'archived' | 'external_locked'
export type Angelcare360AnnouncementStatus = 'draft' | 'published_internal' | 'archived' | 'external_locked'
export type Angelcare360NotificationStatus = 'pending' | 'delivered_internal' | 'read' | 'failed' | 'blocked_external' | 'archived'
export type Angelcare360NotificationChannelStatus = 'not_configured' | 'locked' | 'ready_later'
export type Angelcare360ClaimStatus = 'new' | 'in_review' | 'assigned' | 'waiting_parent' | 'waiting_internal' | 'resolved' | 'closed' | 'archived'
export type Angelcare360ClaimPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface Angelcare360CommunicationOverviewRecord {
  schoolId: Angelcare360UUID
  schoolName: string
  conversationsCount: number
  messagesCount: number
  unreadCount: number
  announcementsDraftCount: number
  announcementsPublishedCount: number
  templatesCount: number
  audienceReadiness: Angelcare360AudienceReadinessRecord
  notificationChannels: Angelcare360NotificationChannelReadinessRecord
  risks: string[]
  recentAudit: Angelcare360AuditRecord[]
}

export interface Angelcare360NotificationOverviewRecord {
  schoolId: Angelcare360UUID
  schoolName: string
  totalNotifications: number
  unreadNotifications: number
  blockedExternalCount: number
  scheduledCount: number
  channelReadiness: Angelcare360NotificationChannelReadinessRecord
  risks: string[]
  recentAudit: Angelcare360AuditRecord[]
}

export interface Angelcare360ClaimsOverviewRecord {
  schoolId: Angelcare360UUID
  schoolName: string
  totalTickets: number
  newTickets: number
  assignedTickets: number
  urgentTickets: number
  waitingParentTickets: number
  waitingInternalTickets: number
  resolvedTickets: number
  closedTickets: number
  unassignedTickets: number
  urgentOpenTickets: number
  risks: string[]
  recentAudit: Angelcare360AuditRecord[]
}

export interface Angelcare360ConversationRecord {
  id: Angelcare360UUID
  school_id: Angelcare360UUID
  conversation_code: string
  subject: string
  status: string
  last_message_at?: string | null
  archived_at?: string | null
}

export interface Angelcare360ConversationParticipantRecord {
  id: Angelcare360UUID
  school_id: Angelcare360UUID
  conversation_id: Angelcare360UUID
  participant_app_user_id?: Angelcare360UUID | null
  participant_student_id?: Angelcare360UUID | null
  participant_parent_id?: Angelcare360UUID | null
  participant_staff_id?: Angelcare360UUID | null
  participant_role?: string | null
  read_at?: string | null
  status: string
}

export interface Angelcare360MessageRecord {
  id: Angelcare360UUID
  school_id: Angelcare360UUID
  message_code: string
  conversation_id?: Angelcare360UUID | null
  subject: string
  body: string
  status: Angelcare360MessageStatus | string
  sender_app_user_id?: Angelcare360UUID | null
  sent_at?: string | null
}

export interface Angelcare360MessageRecipientRecord {
  id: Angelcare360UUID
  school_id: Angelcare360UUID
  message_id: Angelcare360UUID
  recipient_app_user_id?: Angelcare360UUID | null
  recipient_student_id?: Angelcare360UUID | null
  recipient_parent_id?: Angelcare360UUID | null
  recipient_staff_id?: Angelcare360UUID | null
  delivery_status: string
  read_at?: string | null
  status: string
}

export interface Angelcare360MessageTemplateRecord {
  id: Angelcare360UUID
  school_id: Angelcare360UUID
  template_code: string
  channel: string
  name: string
  content: string
  audience_type?: string | null
  status: string
}

export interface Angelcare360AudienceReadinessRecord {
  schoolId: Angelcare360UUID
  totalParents: number
  totalTeachers: number
  totalStaff: number
  totalStudents: number
  totalClasses: number
  totalSections: number
  totalSelectedAudiences: number
  readyGroups: string[]
  blockedGroups: string[]
}

export interface Angelcare360NotificationRecord {
  id: Angelcare360UUID
  school_id: Angelcare360UUID
  notification_code: string
  recipient_app_user_id?: Angelcare360UUID | null
  recipient_role?: string | null
  channel?: string | null
  title: string
  body: string
  action_href?: string | null
  scheduled_for?: string | null
  sent_at?: string | null
  read_at?: string | null
  status: Angelcare360NotificationStatus | string
}

export interface Angelcare360NotificationChannelReadinessRecord {
  email: { status: Angelcare360NotificationChannelStatus; reason: string }
  sms: { status: Angelcare360NotificationChannelStatus; reason: string }
  whatsapp: { status: Angelcare360NotificationChannelStatus; reason: string }
  push: { status: Angelcare360NotificationChannelStatus; reason: string }
}

export interface Angelcare360AnnouncementRecord {
  id: Angelcare360UUID
  school_id: Angelcare360UUID
  announcement_code: string
  academic_year_id?: Angelcare360UUID | null
  title: string
  body: string
  audience?: string | null
  published_at?: string | null
  expires_at?: string | null
  status: Angelcare360AnnouncementStatus | string
}

export interface Angelcare360ReclamationRecord {
  id: Angelcare360UUID
  school_id: Angelcare360UUID
  reclamation_code: string
  submitted_by_app_user_id?: Angelcare360UUID | null
  reporter_role?: string | null
  subject: string
  description: string
  related_entity_type?: string | null
  related_entity_id?: Angelcare360UUID | null
  category?: string | null
  priority: Angelcare360ClaimPriority | string
  status: Angelcare360ClaimStatus | string
  assigned_staff_id?: Angelcare360UUID | null
  resolution_notes?: string | null
  resolution_summary?: string | null
  status_history_json?: Array<Record<string, unknown>> | null
  internal_notes_json?: Array<Record<string, unknown>> | null
  resolved_at?: string | null
  closed_at?: string | null
}

export interface Angelcare360ClaimTicketRecord extends Angelcare360ReclamationRecord {
  requester_label?: string | null
  assigned_staff_label?: string | null
}
