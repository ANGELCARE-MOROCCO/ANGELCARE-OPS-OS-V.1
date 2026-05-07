import { promises as fs } from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { emailOsV13Seed } from './seed';
import type { EmailAuditLog, EmailConfiguration, EmailDraft, EmailMailbox, EmailOsSnapshot, EmailQueueJob, EmailThread } from './types';

export const runtime = 'nodejs';

const STORE_FILE = path.join(process.cwd(), '.email-os-v13-store.json');
const now = () => new Date().toISOString();
const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function readJsonStore(): Promise<EmailOsSnapshot> {
  try {
    const raw = await fs.readFile(STORE_FILE, 'utf8');
    return JSON.parse(raw) as EmailOsSnapshot;
  } catch {
    await writeJsonStore(emailOsV13Seed);
    return structuredClone(emailOsV13Seed);
  }
}

async function writeJsonStore(snapshot: EmailOsSnapshot) {
  await fs.writeFile(STORE_FILE, JSON.stringify(snapshot, null, 2), 'utf8');
}

export async function getEmailOsSnapshot(): Promise<EmailOsSnapshot> {
  const supabase = getSupabase();
  if (!supabase) return readJsonStore();
  const [mailboxes, threads, drafts, templates, permissions, queue, audit, configuration] = await Promise.all([
    supabase.from('email_os_mailboxes').select('*').order('updated_at', { ascending: false }),
    supabase.from('email_os_threads').select('*').order('updated_at', { ascending: false }),
    supabase.from('email_os_drafts').select('*').order('updated_at', { ascending: false }),
    supabase.from('email_os_templates').select('*'),
    supabase.from('email_os_permissions').select('*'),
    supabase.from('email_os_queue').select('*').order('updated_at', { ascending: false }),
    supabase.from('email_os_audit').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('email_os_configuration').select('*').eq('id', 'email-os-config-main').maybeSingle(),
  ]);
  if (mailboxes.error || threads.error) return readJsonStore();
  const snap = await readJsonStore();
  return {
    mailboxes: (mailboxes.data as any[])?.map(fromDbMailbox) || snap.mailboxes,
    threads: (threads.data as any[])?.map(fromDbThread) || snap.threads,
    drafts: (drafts.data as any[])?.map(fromDbDraft) || [],
    templates: (templates.data as any[])?.map(fromDbTemplate) || snap.templates,
    permissions: (permissions.data as any[])?.map(fromDbPermission) || snap.permissions,
    queue: (queue.data as any[])?.map(fromDbQueue) || snap.queue,
    audit: (audit.data as any[])?.map(fromDbAudit) || snap.audit,
    configuration: configuration.data ? fromDbConfiguration(configuration.data as any) : snap.configuration,
  };
}

export async function logEmailAudit(actor: string, action: string, targetType: string, targetId: string, result: string, metadata?: Record<string, unknown>) {
  const row: EmailAuditLog = { id: uid('AUD'), actor, action, targetType, targetId, result, metadata, createdAt: now() };
  const supabase = getSupabase();
  if (supabase) await supabase.from('email_os_audit').insert(toDbAudit(row));
  const snap = await readJsonStore();
  snap.audit = [row, ...snap.audit].slice(0, 250);
  await writeJsonStore(snap);
  return row;
}

export async function upsertMailbox(input: Partial<EmailMailbox> & { id?: string }) {
  const snap = await readJsonStore();
  const current = input.id ? snap.mailboxes.find(m => m.id === input.id) : undefined;
  const mailbox: EmailMailbox = { ...current, id: input.id || uid('mbx'), name: input.name || current?.name || 'New Mailbox', address: input.address || current?.address || 'new@angelcare.ma', department: input.department || current?.department || 'General', owner: input.owner || current?.owner || 'Unassigned', provider: input.provider || current?.provider || 'smtp_imap', status: input.status || current?.status || 'needs_setup', inboundHost: input.inboundHost ?? current?.inboundHost, outboundHost: input.outboundHost ?? current?.outboundHost, signature: input.signature || current?.signature || 'AngelCare', routingRule: input.routingRule || current?.routingRule || 'Manual triage', allowSend: input.allowSend ?? current?.allowSend ?? false, requireApproval: input.requireApproval ?? current?.requireApproval ?? true, createdAt: current?.createdAt || now(), updatedAt: now() };
  snap.mailboxes = [mailbox, ...snap.mailboxes.filter(m => m.id !== mailbox.id)];
  await writeJsonStore(snap);
  const supabase = getSupabase();
  if (supabase) await supabase.from('email_os_mailboxes').upsert(toDbMailbox(mailbox));
  await logEmailAudit('Email OS', current ? 'Mailbox updated' : 'Mailbox created', 'mailbox', mailbox.id, 'completed', { address: mailbox.address });
  return mailbox;
}

export async function updateThreadAction(threadIds: string[], action: 'assign' | 'resolve' | 'archive' | 'escalate' | 'note' | 'tag', value?: string) {
  const snap = await readJsonStore();
  snap.threads = snap.threads.map((thread) => {
    if (!threadIds.includes(thread.id)) return thread;
    const next: EmailThread = { ...thread, updatedAt: now() };
    if (action === 'assign') { next.owner = value || 'Operations Lead'; next.status = 'assigned'; }
    if (action === 'resolve') next.status = 'resolved';
    if (action === 'archive') next.status = 'archived';
    if (action === 'escalate') { next.status = 'escalated'; next.priority = 'critical'; }
    if (action === 'note' && value) next.internalNotes = [value, ...next.internalNotes];
    if (action === 'tag' && value && !next.tags.includes(value)) next.tags = [value, ...next.tags];
    return next;
  });
  await writeJsonStore(snap);
  const supabase = getSupabase();
  if (supabase) {
    for (const thread of snap.threads.filter(t => threadIds.includes(t.id))) await supabase.from('email_os_threads').upsert(toDbThread(thread));
  }
  await logEmailAudit('Email OS', `Thread action: ${action}`, 'thread', threadIds.join(','), 'completed', { value });
  return snap.threads.filter(t => threadIds.includes(t.id));
}

export async function saveDraft(input: Partial<EmailDraft>) {
  const snap = await readJsonStore();
  const current = input.id ? snap.drafts.find(d => d.id === input.id) : undefined;
  const mailbox = snap.mailboxes.find(m => m.id === (input.mailboxId || current?.mailboxId)) || snap.mailboxes[0];
  const requiresApproval = mailbox.requireApproval || !mailbox.allowSend;
  const draft: EmailDraft = { ...current, id: input.id || uid('DRF'), mailboxId: mailbox.id, threadId: input.threadId ?? current?.threadId, to: input.to || current?.to || '', cc: input.cc ?? current?.cc, bcc: input.bcc ?? current?.bcc, subject: input.subject || current?.subject || 'New AngelCare email', body: input.body || current?.body || '', status: requiresApproval ? 'approval_required' : (input.status || current?.status || 'draft'), approvalReason: requiresApproval ? 'Mailbox policy requires approval or provider send is disabled.' : undefined, createdBy: input.createdBy || current?.createdBy || 'Email OS User', createdAt: current?.createdAt || now(), updatedAt: now() };
  snap.drafts = [draft, ...snap.drafts.filter(d => d.id !== draft.id)];
  await writeJsonStore(snap);
  const supabase = getSupabase();
  if (supabase) await supabase.from('email_os_drafts').upsert(toDbDraft(draft));
  await logEmailAudit(draft.createdBy, 'Draft saved', 'draft', draft.id, draft.status, { mailboxId: draft.mailboxId });
  return draft;
}

export async function queueDraftSend(draftId: string) {
  const snap = await readJsonStore();
  const draft = snap.drafts.find(d => d.id === draftId);
  if (!draft) throw new Error('Draft not found');
  const mailbox = snap.mailboxes.find(m => m.id === draft.mailboxId);
  if (!mailbox?.allowSend || draft.status === 'approval_required') {
    await logEmailAudit('Email OS', 'Send blocked by approval/provider policy', 'draft', draftId, 'blocked');
    return { blocked: true, reason: 'Approval required or mailbox send disabled.' };
  }
  const job: EmailQueueJob = { id: uid('JOB'), type: 'send', mailboxId: draft.mailboxId, state: 'queued', retryCount: 0, payload: { draftId }, createdAt: now(), updatedAt: now() };
  snap.queue = [job, ...snap.queue];
  snap.drafts = snap.drafts.map(d => d.id === draftId ? { ...d, status: 'queued', updatedAt: now() } : d);
  await writeJsonStore(snap);
  await logEmailAudit('Email OS', 'Send queued', 'draft', draftId, 'queued');
  return { blocked: false, job };
}

export async function updateConfiguration(input: Partial<EmailConfiguration>) {
  const snap = await readJsonStore();
  snap.configuration = { ...snap.configuration, ...input, id: 'email-os-config-main', updatedAt: now() };
  await writeJsonStore(snap);
  const supabase = getSupabase();
  if (supabase) await supabase.from('email_os_configuration').upsert(toDbConfiguration(snap.configuration));
  await logEmailAudit('Email OS', 'Configuration updated', 'configuration', snap.configuration.id, 'completed');
  return snap.configuration;
}

export async function retryQueueJobs(ids: string[]) {
  const snap = await readJsonStore();
  snap.queue = snap.queue.map(j => ids.includes(j.id) ? { ...j, state: 'queued', retryCount: j.retryCount + 1, lastError: undefined, updatedAt: now() } : j);
  await writeJsonStore(snap);
  await logEmailAudit('Email OS', 'Queue retry requested', 'queue', ids.join(','), 'queued');
  return snap.queue.filter(j => ids.includes(j.id));
}

function toDbMailbox(m: EmailMailbox) { return { id: m.id, name: m.name, address: m.address, department: m.department, owner: m.owner, provider: m.provider, status: m.status, inbound_host: m.inboundHost, outbound_host: m.outboundHost, signature: m.signature, routing_rule: m.routingRule, allow_send: m.allowSend, require_approval: m.requireApproval, created_at: m.createdAt, updated_at: m.updatedAt }; }
function fromDbMailbox(r: any): EmailMailbox { return { id: r.id, name: r.name, address: r.address, department: r.department, owner: r.owner, provider: r.provider, status: r.status, inboundHost: r.inbound_host, outboundHost: r.outbound_host, signature: r.signature, routingRule: r.routing_rule, allowSend: r.allow_send, requireApproval: r.require_approval, createdAt: r.created_at, updatedAt: r.updated_at }; }
function toDbThread(t: EmailThread) { return { id: t.id, subject: t.subject, from_name: t.fromName, from_email: t.fromEmail, mailbox_id: t.mailboxId, owner: t.owner, department: t.department, status: t.status, priority: t.priority, sla_minutes_left: t.slaMinutesLeft, client_name: t.clientName, revenue_link: t.revenueLink, partner_link: t.partnerLink, tags: t.tags, last_message: t.lastMessage, internal_notes: t.internalNotes, created_at: t.createdAt, updated_at: t.updatedAt }; }
function fromDbThread(r: any): EmailThread { return { id: r.id, subject: r.subject, fromName: r.from_name, fromEmail: r.from_email, mailboxId: r.mailbox_id, owner: r.owner, department: r.department, status: r.status, priority: r.priority, slaMinutesLeft: r.sla_minutes_left, clientName: r.client_name, revenueLink: r.revenue_link, partnerLink: r.partner_link, tags: r.tags || [], lastMessage: r.last_message, internalNotes: r.internal_notes || [], createdAt: r.created_at, updatedAt: r.updated_at }; }
function toDbDraft(d: EmailDraft) { return { id: d.id, thread_id: d.threadId, mailbox_id: d.mailboxId, to_address: d.to, cc: d.cc, bcc: d.bcc, subject: d.subject, body: d.body, status: d.status, approval_reason: d.approvalReason, created_by: d.createdBy, created_at: d.createdAt, updated_at: d.updatedAt }; }
function fromDbDraft(r: any): EmailDraft { return { id: r.id, threadId: r.thread_id, mailboxId: r.mailbox_id, to: r.to_address, cc: r.cc, bcc: r.bcc, subject: r.subject, body: r.body, status: r.status, approvalReason: r.approval_reason, createdBy: r.created_by, createdAt: r.created_at, updatedAt: r.updated_at }; }
function fromDbTemplate(r: any) { return { id: r.id, name: r.name, category: r.category, subject: r.subject, body: r.body, requiresApproval: r.requires_approval, variables: r.variables || [], qualityScore: r.quality_score }; }
function fromDbPermission(r: any) { return { id: r.id, user: r.user_name, role: r.role, department: r.department, mailboxId: r.mailbox_id, canRead: r.can_read, canSend: r.can_send, canApprove: r.can_approve, isAdmin: r.is_admin, temporaryUntil: r.temporary_until }; }
function fromDbQueue(r: any) { return { id: r.id, type: r.type, mailboxId: r.mailbox_id, state: r.state, retryCount: r.retry_count, payload: r.payload || {}, lastError: r.last_error, createdAt: r.created_at, updatedAt: r.updated_at }; }
function toDbAudit(a: EmailAuditLog) { return { id: a.id, actor: a.actor, action: a.action, target_type: a.targetType, target_id: a.targetId, result: a.result, metadata: a.metadata || {}, created_at: a.createdAt }; }
function fromDbAudit(r: any): EmailAuditLog { return { id: r.id, actor: r.actor, action: r.action, targetType: r.target_type, targetId: r.target_id, result: r.result, metadata: r.metadata || {}, createdAt: r.created_at }; }
function toDbConfiguration(c: EmailConfiguration) { return { id: c.id, provider_mode: c.providerMode, default_sla_minutes: c.defaultSlaMinutes, retry_limit: c.retryLimit, audit_retention_days: c.auditRetentionDays, approval_policy: c.approvalPolicy, routing_enabled: c.routingEnabled, updated_at: c.updatedAt }; }
function fromDbConfiguration(r: any): EmailConfiguration { return { id: r.id, providerMode: r.provider_mode, defaultSlaMinutes: r.default_sla_minutes, retryLimit: r.retry_limit, auditRetentionDays: r.audit_retention_days, approvalPolicy: r.approval_policy, routingEnabled: r.routing_enabled, updatedAt: r.updated_at }; }
