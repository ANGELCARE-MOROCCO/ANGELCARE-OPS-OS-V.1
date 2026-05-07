export type EmailV12Mode = 'command' | 'inbox' | 'threads' | 'composer' | 'access' | 'engine' | 'analytics' | 'configuration' | 'mailboxes' | 'audit' | 'outbox' | 'approvals';

export type ProviderKind = 'google_workspace' | 'microsoft_365' | 'smtp_imap' | 'shared_alias';
export type MailboxStatus = 'healthy' | 'needs_setup' | 'warning' | 'restricted' | 'disabled';
export type ThreadStatus = 'unassigned' | 'assigned' | 'waiting_client' | 'waiting_internal' | 'resolved' | 'escalated' | 'archived';
export type ThreadPriority = 'low' | 'normal' | 'high' | 'critical';
export type DraftStatus = 'draft' | 'approval_required' | 'approved' | 'queued' | 'sent' | 'blocked' | 'failed';
export type QueueState = 'queued' | 'running' | 'failed' | 'completed' | 'paused';

export type EmailMailbox = {
  id: string;
  name: string;
  address: string;
  department: string;
  owner: string;
  provider: ProviderKind;
  status: MailboxStatus;
  inbound_count: number;
  outbound_count: number;
  unresolved_count: number;
  sla_risk_count: number;
  restricted: boolean;
  signature: string | null;
  routing_rule: string | null;
  created_at?: string;
  updated_at?: string;
};

export type EmailThread = {
  id: string;
  mailbox_id: string;
  subject: string;
  from_name: string;
  from_email: string;
  client_name: string | null;
  department: string | null;
  owner: string | null;
  status: ThreadStatus;
  priority: ThreadPriority;
  sla_minutes_left: number | null;
  revenue_link: string | null;
  partner_link: string | null;
  tags: string[];
  last_message: string | null;
  last_message_at: string | null;
  created_at?: string;
  updated_at?: string;
};

export type EmailMessage = {
  id: string;
  thread_id: string;
  mailbox_id: string;
  direction: 'inbound' | 'outbound' | 'internal_note';
  from_name: string | null;
  from_email: string | null;
  to_emails: string[];
  cc_emails: string[];
  subject: string;
  body: string;
  html_body: string | null;
  attachments: Array<{ name: string; size?: number; url?: string }>;
  created_at: string;
};

export type EmailDraft = {
  id: string;
  mailbox_id: string;
  thread_id: string | null;
  to_email: string;
  cc_emails: string[];
  subject: string;
  body: string;
  status: DraftStatus;
  approval_reason: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type EmailPermission = {
  id: string;
  user_label: string;
  role: string;
  department: string;
  mailbox_id: string;
  can_read: boolean;
  can_send: boolean;
  can_approve: boolean;
  can_admin: boolean;
  temporary_until: string | null;
};

export type EmailQueueJob = {
  id: string;
  type: string;
  mailbox_id: string | null;
  thread_id: string | null;
  draft_id: string | null;
  state: QueueState;
  retry_count: number;
  last_error: string | null;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type EmailAuditLog = {
  id: string;
  actor: string;
  action: string;
  target_type: string;
  target_id: string | null;
  result: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type EmailConfiguration = {
  id: string;
  provider_mode: 'mixed' | 'google_workspace' | 'microsoft_365' | 'smtp_imap';
  default_sla_minutes: number;
  retry_limit: number;
  audit_retention_days: number;
  approval_policy: string;
  routing_enabled: boolean;
  updated_at: string;
};

export type EmailSnapshot = {
  mailboxes: EmailMailbox[];
  threads: EmailThread[];
  drafts: EmailDraft[];
  permissions: EmailPermission[];
  queue: EmailQueueJob[];
  audit: EmailAuditLog[];
  configuration: EmailConfiguration | null;
  providerReady: boolean;
  databaseReady: boolean;
  blockers: string[];
};
