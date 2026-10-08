export type SanilaChannel = 'internal' | 'email' | 'whatsapp' | 'sms' | 'push' | 'omnichannel'
export type SanilaThreadPriority = 'low' | 'normal' | 'high' | 'urgent'
export type SanilaThreadStatus = 'open' | 'pending' | 'resolved' | 'closed' | 'archived'
export type SanilaCampaignStatus = 'draft' | 'scheduled' | 'queued' | 'dispatching' | 'sent' | 'partially_sent' | 'failed' | 'cancelled' | 'archived'

export type SanilaChannelReadiness = {
  channel: SanilaChannel
  state: 'ready_internal' | 'configured_external' | 'not_configured' | 'degraded' | 'locked_external'
  label: string
  detail: string
  connectorId?: string | null
}

export type SanilaCommunicationThread = {
  id: string
  org_id: string
  campus_id?: string | null
  thread_code: string
  thread_type: string
  subject: string
  status: SanilaThreadStatus | string
  priority: SanilaThreadPriority | string
  guardian_id?: string | null
  student_id?: string | null
  assigned_staff_id?: string | null
  opened_by?: string | null
  closed_by?: string | null
  opened_at: string
  closed_at?: string | null
  last_message_at?: string | null
  created_at: string
  updated_at: string
  guardian_name?: string | null
  student_name?: string | null
  assigned_staff_name?: string | null
  campus_name?: string | null
  message_count: number
  latest_message?: string | null
  latest_sender_type?: string | null
  latest_channel?: string | null
}

export type SanilaThreadMessage = {
  id: string
  org_id: string
  thread_id: string
  message_code: string
  sender_type: string
  sender_id?: string | null
  channel: SanilaChannel | string
  body: string
  status: string
  attachments_json: Array<Record<string, unknown>>
  metadata_json: Record<string, unknown>
  created_at: string
  sender_label?: string | null
}

export type SanilaCampaign = {
  id: string
  org_id: string
  campus_id?: string | null
  template_id?: string | null
  message_id?: string | null
  segment_id?: string | null
  campaign_code: string
  campaign_type: string
  channel: SanilaChannel | string
  audience_type: string
  title: string
  subject?: string | null
  body: string
  status: SanilaCampaignStatus | string
  scheduled_at?: string | null
  queued_at?: string | null
  sent_at?: string | null
  recipient_count: number
  queued_count: number
  dispatched_count: number
  delivered_count: number
  failed_count: number
  read_count: number
  created_at: string
  updated_at: string
  campus_name?: string | null
  template_label?: string | null
  segment_label?: string | null
}

export type SanilaCampaignRecipient = {
  id: string
  campaign_id: string
  recipient_type: string
  display_name?: string | null
  channel: string
  contact_value?: string | null
  preference_status: string
  status: string
  queued_at: string
  dispatched_at?: string | null
  delivered_at?: string | null
  failed_at?: string | null
  read_at?: string | null
  last_error?: string | null
}

export type SanilaTemplate = {
  id: string
  org_id: string
  campus_id?: string | null
  template_key: string
  label: string
  template_type: string
  channel: string
  audience_type: string
  language_code: string
  subject_template?: string | null
  body_template: string
  variables_schema_json: Record<string, unknown>
  status: string
  published_at?: string | null
  created_at: string
  updated_at: string
  version_count: number
  latest_version?: number | null
}

export type SanilaTemplateVersion = {
  id: string
  template_id: string
  version_number: number
  subject_template?: string | null
  body_template: string
  variables_schema_json: Record<string, unknown>
  status: string
  created_at: string
}

export type SanilaAudienceSegment = {
  id: string
  org_id: string
  campus_id?: string | null
  segment_key: string
  label: string
  audience_type: string
  filter_json: Record<string, unknown>
  status: string
  created_at: string
  updated_at: string
  member_count: number
  active_member_count: number
  sample_members: SanilaAudienceMember[]
}

export type SanilaAudienceMember = {
  id: string
  segment_id: string
  member_type: string
  member_id?: string | null
  display_name?: string | null
  contact_channel?: string | null
  contact_value?: string | null
  status: string
}

export type SanilaCommunicationAlert = {
  id: string
  org_id: string
  campus_id?: string | null
  campaign_id?: string | null
  thread_id?: string | null
  alert_key: string
  alert_type: string
  severity: string
  title: string
  description?: string | null
  status: string
  resolved_at?: string | null
  resolution_note?: string | null
  created_at: string
  updated_at: string
}

export type SanilaDeliveryJob = {
  id: string
  campaign_id?: string | null
  job_code: string
  channel: string
  provider_key: string
  status: string
  attempted_count: number
  succeeded_count: number
  failed_count: number
  started_at?: string | null
  completed_at?: string | null
  created_at: string
}

export type SanilaDeliveryEvent = {
  id: string
  campaign_id?: string | null
  recipient_id?: string | null
  delivery_job_id?: string | null
  event_type: string
  provider_key: string
  provider_message_id?: string | null
  error_message?: string | null
  created_at: string
}

export type SanilaCommunicationPreference = {
  id: string
  campus_id?: string | null
  recipient_type: string
  recipient_id?: string | null
  channel: string
  is_enabled: boolean
  consent_status: string
  quiet_hours_json: Record<string, unknown>
  language_code: string
  created_at: string
  updated_at: string
  recipient_label?: string | null
}

export type SanilaReferencePerson = { id: string; label: string; secondary?: string | null; campus_id?: string | null }
export type SanilaReferenceClass = { id: string; label: string; secondary?: string | null; campus_id?: string | null }
export type SanilaDocumentReference = { id: string; title: string; document_type: string; file_name?: string | null; mime_type?: string | null; status: string }

export type SanilaCommunicationDashboard = {
  orgId: string
  schoolId: string
  schoolName: string
  orgName?: string | null
  dashboard: Record<string, any>
  channelReadiness: SanilaChannelReadiness[]
  latestThreads: SanilaCommunicationThread[]
  latestCampaigns: SanilaCampaign[]
  latestAlerts: SanilaCommunicationAlert[]
  legacyArchive: { conversations: number; messages: number; announcements: number; templates: number }
}
