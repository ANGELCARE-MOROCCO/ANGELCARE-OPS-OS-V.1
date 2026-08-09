export type EmailCommandMode =
  | 'command'
  | 'automation'
  | 'outbound'
  | 'inbound'
  | 'conversations'
  | 'templates'
  | 'approvals'
  | 'deliverability'

export type EmailDirection = 'outbound' | 'inbound'

export interface EmailCommandMessageRecord {
  id: string
  message_reference: string
  direction: EmailDirection
  thread_key?: string | null
  mailbox_key?: string | null
  mailbox_email?: string | null
  provider_message_id?: string | null
  in_reply_to?: string | null
  subject: string
  body_text?: string | null
  body_html?: string | null
  sender_email: string
  sender_name?: string | null
  recipient_emails: string[]
  cc_emails: string[]
  bcc_emails: string[]
  status: string
  delivery_state?: string | null
  automation_rule_id?: string | null
  template_id?: string | null
  client_id?: string | null
  contact_id?: string | null
  institution_id?: string | null
  tenant_id?: string | null
  related_entity_type?: string | null
  related_entity_id?: string | null
  owner_id?: string | null
  assigned_team?: string | null
  classification?: string | null
  confidence?: string | null
  requires_response: boolean
  response_due_at?: string | null
  scheduled_at?: string | null
  sent_at?: string | null
  received_at?: string | null
  opened_at?: string | null
  clicked_at?: string | null
  replied_at?: string | null
  resolved_at?: string | null
  attachments: Array<Record<string, unknown>>
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface EmailAutomationRuleRecord {
  id: string
  rule_code: string
  name: string
  description?: string | null
  status: string
  trigger_event: string
  conditions: Record<string, unknown>
  actions: Record<string, unknown>
  recipient_policy: Record<string, unknown>
  mailbox_key?: string | null
  template_id?: string | null
  approval_policy: Record<string, unknown>
  suppression_policy: Record<string, unknown>
  frequency_policy: Record<string, unknown>
  quiet_hours: Record<string, unknown>
  effective_from?: string | null
  effective_to?: string | null
  version_number: number | string
  last_evaluated_at?: string | null
  last_executed_at?: string | null
  execution_count: number | string
  failure_count: number | string
  created_at: string
  updated_at: string
}

export interface EmailTemplateRecord {
  id: string
  template_code: string
  name: string
  purpose: string
  language: string
  status: string
  mailbox_key?: string | null
  subject_template: string
  html_template?: string | null
  text_template: string
  variable_schema: Record<string, unknown>
  approval_required: boolean
  version_number: number | string
  effective_from?: string | null
  effective_to?: string | null
  created_at: string
  updated_at: string
}

export interface EmailApprovalRecord {
  id: string
  message_id?: string | null
  automation_rule_id?: string | null
  status: string
  approval_type: string
  requested_by?: string | null
  approver_id?: string | null
  reason?: string | null
  risk_summary?: string | null
  requested_at: string
  decided_at?: string | null
  decision_note?: string | null
  created_at: string
  updated_at: string
}

export interface EmailMailboxHealthRecord {
  key: string
  label: string
  email: string
  source?: string
  smtp_host?: string
  smtp_port?: number
  inbound_host?: string
  inbound_port?: number
  configured: boolean
  bridge_enabled: boolean
}

export interface EmailCommandSnapshot {
  rules: EmailAutomationRuleRecord[]
  templates: EmailTemplateRecord[]
  messages: EmailCommandMessageRecord[]
  approvals: EmailApprovalRecord[]
  deliveryEvents: Array<Record<string, unknown>>
  relationshipLinks: Array<Record<string, unknown>>
  inboundMatches: Array<Record<string, unknown>>
  assignments: Array<Record<string, unknown>>
  suppressions: Array<Record<string, unknown>>
  commitments: Array<Record<string, unknown>>
  executions: Array<Record<string, unknown>>
  clients: Array<Record<string, unknown>>
  contacts: Array<Record<string, unknown>>
  tenants: Array<Record<string, unknown>>
  mailboxes: EmailMailboxHealthRecord[]
  metrics: {
    queued: number
    awaitingApproval: number
    failed: number
    inboundUnmatched: number
    awaitingAngelcare: number
    awaitingCustomer: number
    replied: number
    activeRules: number
    mailboxConfigured: number
  }
}
