export type EmailAccessLevel = 'viewer' | 'operator' | 'manager' | 'approver' | 'admin' | 'owner';
export type EmailSignal = 'online' | 'warning' | 'critical' | 'unknown';

export type MailboxControl = {
  id: string;
  label: string;
  email_address: string;
  display_name?: string;
  department?: string;
  business_context?: string;
  outbound_enabled?: boolean;
  inbound_enabled?: boolean;
  smtp_host?: string;
  smtp_port?: number;
  smtp_secure?: boolean;
  imap_host?: string;
  imap_port?: number;
  imap_secure?: boolean;
  health_status?: EmailSignal | string;
  last_health_check_at?: string;
};

export type EmailCommandStats = {
  totalMailboxes: number;
  onlineMailboxes: number;
  queued: number;
  failed: number;
  approvals: number;
  threads: number;
  healthScore: number;
};
