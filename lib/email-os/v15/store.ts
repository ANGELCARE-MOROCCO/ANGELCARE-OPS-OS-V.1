import type { EmailOsDraft, EmailOsMailbox, EmailOsResult, EmailOsThread } from './types';
import { productionBlockers } from './env';

const mailboxes: EmailOsMailbox[] = [
  { id: 'mbx-ops', name: 'Operations', address: 'operations@angelcare.ma', provider: 'smtp_imap', department: 'Operations', owner: 'Operations Lead', status: 'needs_provider_binding', routingRule: 'Route unresolved care cases to operations board' },
  { id: 'mbx-sales', name: 'Sales', address: 'sales@angelcare.ma', provider: 'google', department: 'Revenue', owner: 'Sales Director', status: 'needs_provider_binding', routingRule: 'Lead, deal and proposal communications' },
  { id: 'mbx-legal', name: 'Legal', address: 'legal@angelcare.ma', provider: 'microsoft', department: 'Legal', owner: 'Legal Admin', status: 'restricted', restricted: true, routingRule: 'CEO approval before restricted sends' },
];
const threads: EmailOsThread[] = [
  { id: 'thr-001', subject: 'Urgent family schedule change', sender: 'Mme Benali', mailboxId: 'mbx-ops', clientName: 'Benali Family', owner: 'Operations Lead', status: 'escalated', priority: 'critical', revenueLink: 'Contract AC-422', tags: ['care','urgent'], lastMessagePreview: 'Immediate replacement requested.' },
  { id: 'thr-002', subject: 'Lead asking for home care package', sender: 'Prospect Family', mailboxId: 'mbx-sales', clientName: 'New Family Prospect', owner: 'Sales Director', status: 'assigned', priority: 'high', revenueLink: 'Lead L-889', tags: ['lead','pricing'], lastMessagePreview: 'Pricing request for 7-day Rabat support.' },
];
const drafts: EmailOsDraft[] = [];

function withProductionState<T>(data: T): EmailOsResult<T> {
  const blockers = productionBlockers();
  if (blockers.includes('database_not_configured')) {
    return { status: 'blocked', data, blockedReason: 'database_not_configured', message: 'Returned seeded in-memory data. Configure EMAIL_OS_DATABASE_URL for real persistence.' };
  }
  return { status: 'ok', data, message: 'Database boundary ready.' };
}

export async function listMailboxes() { return withProductionState(mailboxes); }
export async function listThreads() { return withProductionState(threads); }
export async function listDrafts() { return withProductionState(drafts); }

export async function createDraft(input: Omit<EmailOsDraft, 'id' | 'status' | 'approvalStatus'>): Promise<EmailOsResult<EmailOsDraft>> {
  const draft: EmailOsDraft = { id: `draft-${Date.now()}`, status: 'draft', approvalStatus: 'not_required', ...input };
  drafts.unshift(draft);
  return withProductionState(draft);
}

export async function updateThreadStatus(id: string, status: string): Promise<EmailOsResult<EmailOsThread | null>> {
  const thread = threads.find(t => t.id === id);
  if (!thread) return { status: 'error', error: 'thread_not_found', message: 'Thread not found.' };
  thread.status = status;
  return withProductionState(thread);
}

export async function createQueueJob(jobType: string, payload: Record<string, unknown>) {
  const job = { id: `job-${Date.now()}`, jobType, status: 'queued', payload, attempts: 0 };
  return withProductionState(job);
}
