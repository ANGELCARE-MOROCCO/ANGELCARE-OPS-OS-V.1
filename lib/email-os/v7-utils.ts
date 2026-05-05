import { EmailCommandStats, MailboxControl } from './v7-types';

export function computeMailboxSignal(mailbox: MailboxControl): 'online' | 'warning' | 'critical' | 'unknown' {
  if (!mailbox.health_status) return 'unknown';
  const s = String(mailbox.health_status).toLowerCase();
  if (['online', 'healthy', 'success', 'ok'].includes(s)) return 'online';
  if (['warning', 'degraded', 'retrying'].includes(s)) return 'warning';
  if (['critical', 'failed', 'offline', 'error'].includes(s)) return 'critical';
  return 'unknown';
}

export function buildStats(mailboxes: MailboxControl[] = [], queue: any[] = [], threads: any[] = []): EmailCommandStats {
  const online = mailboxes.filter((m) => computeMailboxSignal(m) === 'online').length;
  const failed = queue.filter((q) => ['failed', 'error'].includes(String(q.execution_status || q.status))).length;
  const approvals = queue.filter((q) => String(q.status || '').includes('approval')).length;
  const queued = queue.filter((q) => ['queued', 'retrying', 'pending'].includes(String(q.execution_status || q.status))).length;
  const healthScore = mailboxes.length ? Math.round((online / mailboxes.length) * 100) : 0;
  return { totalMailboxes: mailboxes.length, onlineMailboxes: online, queued, failed, approvals, threads: threads.length, healthScore };
}
