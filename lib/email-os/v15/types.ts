export type EmailProviderKind = 'google' | 'microsoft' | 'smtp_imap' | 'shared_alias';
export type ExecutionStatus = 'ok' | 'blocked' | 'error';

export type EmailOsResult<T = unknown> = {
  status: ExecutionStatus;
  data?: T;
  blockedReason?: string;
  error?: string;
  message: string;
};

export type EmailOsMailbox = {
  id: string;
  name: string;
  address: string;
  provider: EmailProviderKind;
  department: string;
  owner: string;
  status: string;
  restricted?: boolean;
  routingRule?: string;
  signature?: string;
};

export type EmailOsThread = {
  id: string;
  subject: string;
  sender?: string;
  mailboxId?: string;
  clientName?: string;
  owner?: string;
  status: string;
  priority: string;
  revenueLink?: string;
  partnerLink?: string;
  tags: string[];
  lastMessagePreview?: string;
};

export type EmailOsDraft = {
  id: string;
  threadId?: string;
  mailboxId?: string;
  subject: string;
  body: string;
  toAddresses: string[];
  ccAddresses: string[];
  status: 'draft' | 'approval_requested' | 'queued' | 'sent' | 'blocked';
  approvalStatus: 'not_required' | 'pending' | 'approved' | 'rejected';
};

export type EmailOsPermission = {
  userKey: string;
  mailboxId: string;
  canRead: boolean;
  canSend: boolean;
  canApprove: boolean;
  canAdmin: boolean;
};
