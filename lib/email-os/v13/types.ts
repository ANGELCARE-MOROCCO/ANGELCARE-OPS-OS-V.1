export type EmailV13Mode = 'command' | 'inbox' | 'threads' | 'composer' | 'access' | 'engine' | 'analytics' | 'configuration' | 'mailboxes' | 'templates' | 'automation' | 'audit' | 'approvals' | 'outbox';

export type EmailMailbox = {
  id: string;
  name: string;
  address: string;
  department: string;
  owner: string;
  provider: 'google' | 'microsoft' | 'smtp_imap' | 'alias';
  status: 'healthy' | 'warning' | 'restricted' | 'needs_setup';
  inboundHost?: string;
  outboundHost?: string;
  signature: string;
  routingRule: string;
  allowSend: boolean;
  requireApproval: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EmailThread = {
  id: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  mailboxId: string;
  owner: string;
  department: string;
  status: 'unassigned' | 'assigned' | 'waiting_client' | 'waiting_internal' | 'resolved' | 'escalated' | 'archived';
  priority: 'low' | 'normal' | 'high' | 'critical';
  slaMinutesLeft: number;
  clientName: string;
  revenueLink?: string;
  partnerLink?: string;
  tags: string[];
  lastMessage: string;
  internalNotes: string[];
  createdAt: string;
  updatedAt: string;
};

export type EmailDraft = {
  id: string;
  threadId?: string;
  mailboxId: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  status: 'draft' | 'approval_required' | 'approved' | 'queued' | 'sent' | 'failed';
  approvalReason?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type EmailTemplate = {
  id: string;
  name: string;
  category: string;
  subject: string;
  body: string;
  requiresApproval: boolean;
  variables: string[];
  qualityScore: number;
};

export type EmailPermission = {
  id: string;
  user: string;
  role: string;
  department: string;
  mailboxId: string;
  canRead: boolean;
  canSend: boolean;
  canApprove: boolean;
  isAdmin: boolean;
  temporaryUntil?: string;
};

export type EmailQueueJob = {
  id: string;
  type: 'sync' | 'send' | 'retry' | 'classify' | 'provider_check';
  mailboxId: string;
  state: 'queued' | 'running' | 'failed' | 'completed' | 'paused';
  retryCount: number;
  payload: Record<string, unknown>;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
};

export type EmailAuditLog = {
  id: string;
  actor: string;
  action: string;
  targetType: string;
  targetId: string;
  result: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type EmailConfiguration = {
  id: string;
  providerMode: 'google' | 'microsoft' | 'smtp_imap' | 'mixed';
  defaultSlaMinutes: number;
  retryLimit: number;
  auditRetentionDays: number;
  approvalPolicy: string;
  routingEnabled: boolean;
  updatedAt: string;
};

export type EmailOsSnapshot = {
  mailboxes: EmailMailbox[];
  threads: EmailThread[];
  drafts: EmailDraft[];
  templates: EmailTemplate[];
  permissions: EmailPermission[];
  queue: EmailQueueJob[];
  audit: EmailAuditLog[];
  configuration: EmailConfiguration;
};
