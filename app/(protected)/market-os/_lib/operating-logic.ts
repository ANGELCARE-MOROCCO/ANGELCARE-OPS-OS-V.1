import type { MarketRecord, MarketEntityKind } from './types';

export function scoreDominance(records: MarketRecord[]) {
  const approved = records.filter(r => r.status === 'approved').length;
  const active = records.filter(r => r.status === 'active').length;
  const blocked = records.filter(r => r.status === 'blocked').length;
  const critical = records.filter(r => r.priority === 'critical').length;
  const avg = Math.round(records.reduce((s, r) => s + Number(r.score || 50), 0) / Math.max(records.length, 1));
  return Math.max(0, Math.min(100, avg + approved * 2 + active - blocked * 5 - critical * 2));
}

export function generateDirectives(records: MarketRecord[], kind: MarketEntityKind) {
  const module = records.filter(r => r.kind === kind);
  const blocked = module.filter(r => r.status === 'blocked');
  const review = module.filter(r => r.status === 'review');
  const lowScore = module.filter(r => Number(r.score || 0) < 55);
  const directives: {title:string; body:string; severity:'critical'|'high'|'medium'|'low'}[] = [];
  if (blocked.length) directives.push({ title: 'Execution blockage detected', body: `${blocked.length} ${kind} object(s) are blocked. Convert blockers into corrective tasks immediately.`, severity: 'critical' });
  if (review.length) directives.push({ title: 'Approval queue waiting', body: `${review.length} item(s) are in review. Approve, reject, or return with correction notes.`, severity: 'high' });
  if (lowScore.length) directives.push({ title: 'Quality/readiness under threshold', body: `${lowScore.length} item(s) score below 55%. Add owner, proof, next action, and Drive assets.`, severity: 'medium' });
  if (!directives.length) directives.push({ title: 'System stable', body: 'No immediate risk detected. Move one approved object toward expansion or revenue execution.', severity: 'low' });
  return directives;
}

export const integrationTargets = [
  { label: 'Create mission in existing Ops module', route: '/missions/new', status: 'bridge-ready' },
  { label: 'Review service/offer base', route: '/services', status: 'bridge-ready' },
  { label: 'Send funnel signal to revenue command center', route: '/revenue-command-center', status: 'bridge-ready' },
  { label: 'Assign owner from users', route: '/users', status: 'bridge-ready' },
];
