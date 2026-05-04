'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMarketOSStore } from '../_lib/store';
import { generateDirectives, integrationTargets, scoreDominance } from '../_lib/operating-logic';
import type { MarketEntityKind, MarketRecord, MOSPriority, MOSStatus } from '../_lib/types';

const nav: { label: string; href: string; zone: string }[] = [
  { label: 'Command', href: '/market-os', zone: 'CEO' },
  { label: 'CEO Board', href: '/market-os/manager', zone: 'Decision' },
  { label: 'Agent Desk', href: '/market-os/agent', zone: 'Execution' },
  { label: 'Strategy', href: '/market-os/strategy', zone: 'Direction' },
  { label: 'Workforce', href: '/market-os/workforce', zone: 'People' },
  { label: 'Funnels', href: '/market-os/funnels', zone: 'Acquisition' },
  { label: 'Offers', href: '/market-os/offers', zone: 'Product' },
  { label: 'Pricing', href: '/market-os/pricing', zone: 'Revenue' },
  { label: 'Content Bank', href: '/market-os/content', zone: 'Assets' },
  { label: 'Scripts', href: '/market-os/scripts', zone: 'Message' },
  { label: 'Expansion', href: '/market-os/expansion', zone: 'Scale' },
  { label: 'AI Director', href: '/market-os/ai-director', zone: 'Control' },
  { label: 'SEO', href: '/market-os/seo', zone: 'Visibility' },
  { label: 'PR', href: '/market-os/pr', zone: 'Authority' },
  { label: 'Ambassadors', href: '/market-os/ambassadors', zone: 'Trust' },
  { label: 'Partners', href: '/market-os/partnerships', zone: 'B2B' },
];

const labels: Record<MarketEntityKind, string> = {
  strategy: 'Strategy Engine', mission: 'Workforce Missions', task: 'Agent Execution Desk', funnel: 'Funnel Builder', offer: 'Offer Engineering', pricing: 'Pricing Engine', asset: 'Content Bank', script: 'Scripts & Messaging', expansion: 'Expansion Engine', alert: 'AI Alerts', ambassador: 'Ambassador Network', seo: 'SEO System', pr: 'PR & Blog', partnership: 'Partnership Engine'
};

const moduleTools: Record<MarketEntityKind, string[]> = {
  strategy: ['Strategy builder', 'KPI map', 'Market thesis', 'Decision gate', 'Mission generator', 'Board approval queue'],
  mission: ['Mission planner', 'SLA tracker', 'Owner reassignment', 'Blocker escalation', 'Quality checklist', 'Execution audit'],
  task: ['My task queue', 'Submit proof', 'Request review', 'Raise blocker', 'Script access', 'Drive attachment'],
  funnel: ['Stage builder', 'Leakage detector', 'Offer linker', 'Script linker', 'Conversion diagnosis', 'Corrective action'],
  offer: ['Offer builder', 'Bundle designer', 'Segment positioning', 'Proof pack', 'Approval versioning', 'Sales enablement'],
  pricing: ['Price ladder', 'Promo rule creator', 'City pricing', 'Segment pricing', 'Margin risk signal', 'Launch calendar'],
  asset: ['Drive linker', 'Asset tagging', 'Proof library', 'Version notes', 'Campaign pack', 'Approval bank'],
  script: ['Script writer', 'Objection handler', 'Version board', 'Approval flow', 'Usage mapping', 'Agent briefing'],
  expansion: ['City launch kit', 'Readiness score', 'Replication checklist', 'Local owners', 'Risk gates', 'Launch approval'],
  alert: ['Risk radar', 'Opportunity queue', 'Alert-to-task', 'Severity control', 'Escalation', 'Decision log'],
  ambassador: ['Ambassador CRM', 'Mission packs', 'Referral tracking', 'Content packs', 'Incentive notes', 'Trust score'],
  seo: ['Keyword backlog', 'Cluster planner', 'Page tracker', 'Brief generator', 'Authority map', 'Ranking actions'],
  pr: ['Editorial pipeline', 'Press brief', 'Distribution list', 'Authority narrative', 'Partner comms', 'Publication proof'],
  partnership: ['Partner pipeline', 'Pitch script', 'Agreement tracker', 'Activation missions', 'Referral funnel', 'Outcome review']
};

const rolePlaybooks = {
  ceo: ['Approve or kill strategic priorities', 'Shift resources between markets', 'Authorize launch gates', 'Review market dominance index'],
  manager: ['Assign and reassign owners', 'Clear approvals', 'Resolve blocked work', 'Convert alerts to execution tasks'],
  agent: ['Execute assigned queue', 'Attach proof links', 'Submit for review', 'Report blockers with proposed fixes']
};

function cx(...items: (string | false | undefined)[]) { return items.filter(Boolean).join(' '); }

function Badge({ value }: { value: string }) {
  return <span className={cx('mos-badge', value)}>{value}</span>;
}

function pct(n?: number) {
  return `${Math.max(0, Math.min(100, Number(n || 0)))}%`;
}

function makeRecord(kind: MarketEntityKind, title: string, owner: string, driveUrl: string, note: string): MarketRecord {
  const base = { id: `${kind}-${Date.now()}`, kind, title, owner, status: 'draft' as const, priority: 'medium' as const, createdAt: '', updatedAt: '', driveUrl, notes: note, city: 'Rabat', segment: 'Premium families', score: 50, nextAction: 'Assign owner and move to active workflow.' };
  if (kind === 'strategy') return { ...base, kind, type: 'market', objective: note || 'New board-level market objective', kpis: ['Market signal', 'Execution velocity', 'Conversion quality'] };
  if (kind === 'mission') return { ...base, kind, team: [owner], slaHours: 48 };
  if (kind === 'task') return { ...base, kind, assignee: owner, dueDate: new Date().toISOString().slice(0, 10) };
  if (kind === 'funnel') return { ...base, kind, stages: [{ name: 'Signal', target: 100, actual: 0 }, { name: 'Consultation', target: 30, actual: 0 }, { name: 'Booking', target: 10, actual: 0 }], scriptIds: [] };
  if (kind === 'offer') return { ...base, kind, service: 'AngelCare Service', positioning: note || 'Premium trust-based support', components: ['Diagnostic', 'Matching', 'Supervision'], targetSegment: 'Families' };
  if (kind === 'pricing') return { ...base, kind, basePriceMad: 390, effectiveFrom: new Date().toISOString().slice(0, 10), promoRule: note || 'Launch incentive to validate demand.' };
  if (kind === 'asset') return { ...base, kind, assetType: 'folder', tags: ['drive', 'brand', 'proof'] };
  if (kind === 'script') return { ...base, kind, scriptType: 'call', version: 'v1.0', content: note || 'New script draft.' };
  if (kind === 'expansion') return { ...base, kind, readinessScore: 50, checklist: [{ label: 'Offer localized', done: false }, { label: 'Assets ready', done: false }, { label: 'Owner assigned', done: true }] };
  if (kind === 'alert') return { ...base, kind, severity: 'high', source: 'strategy', actionRequired: note || 'Review and assign corrective action.' };
  return { ...base, kind, category: labels[kind], channel: 'Workspace', impact: note || 'Operational impact to be defined.' };
}

function FourZoneHeader({ kind, items, alerts }: { kind: MarketEntityKind; items: MarketRecord[]; alerts: MarketRecord[] }) {
  const blocked = items.filter(i => i.status === 'blocked').length;
  const review = items.filter(i => i.status === 'review').length;
  const approved = items.filter(i => i.status === 'approved').length;
  return <section className="mos-four-zone">
    <div className="mos-zone command"><span>01 · Command Zone</span><b>{items.length} objects controlled</b><p>Priority, ownership, approvals and board-level pressure for {labels[kind].toLowerCase()}.</p></div>
    <div className="mos-zone workflow"><span>02 · Workflow Zone</span><b>{review} in review · {blocked} blocked</b><p>Pipeline health, stage movement, SLA visibility and execution flow.</p></div>
    <div className="mos-zone action"><span>03 · Action Zone</span><b>{moduleTools[kind].length} tools available</b><p>Create, assign, approve, escalate, attach Drive proof, and convert signals into tasks.</p></div>
    <div className="mos-zone intel"><span>04 · Intelligence Zone</span><b>{alerts.length} active signals · {approved} approved</b><p>Risks, opportunities, next-best-actions and market/system diagnosis.</p></div>
  </section>;
}

function ToolGrid({ kind }: { kind: MarketEntityKind }) {
  return <div className="mos-tool-grid">
    {moduleTools[kind].map((tool, index) => <button className="mos-tool" key={tool} type="button"><b>{String(index + 1).padStart(2, '0')}</b><span>{tool}</span><em>Open tool</em></button>)}
  </div>;
}

function RecordCard({ item, onStatus, onPriority, onDrive, onNotes, onAction, onRemove }: {
  item: MarketRecord;
  onStatus: (s: MOSStatus) => void;
  onPriority: (p: MOSPriority) => void;
  onDrive: () => void;
  onNotes: () => void;
  onAction: () => void;
  onRemove: () => void;
}) {
  return <article className="mos-record-card">
    <div className="mos-record-top">
      <div><b>{item.title}</b><span>{item.kind} · {item.owner} · {item.city || 'Global'} · {item.segment || 'All segments'}</span></div>
      <Badge value={item.status} />
    </div>
    <div className="mos-meter"><i style={{ width: pct(item.score) }} /></div>
    <p>{item.notes || item.nextAction || 'No operational notes yet.'}</p>
    {'stages' in item && <div className="mos-mini-pipeline">{item.stages.map(s => <span key={s.name}>{s.name}<b>{s.actual}/{s.target}</b></span>)}</div>}
    {'components' in item && <div className="mos-tags">{item.components.map(c => <span key={c}>{c}</span>)}</div>}
    {'checklist' in item && <div className="mos-tags">{item.checklist.map(c => <span key={c.label}>{c.done ? '✓' : '○'} {c.label}</span>)}</div>}
    <div className="mos-next"><strong>Next action:</strong> {item.nextAction || 'Define next action.'}</div>
    <div className="mos-actions">
      {(['active','review','approved','blocked'] as MOSStatus[]).map(s => <button key={s} onClick={onStatus.bind(null, s)}>{s}</button>)}
      {(['critical','high','medium','low'] as MOSPriority[]).map(p => <button key={p} onClick={onPriority.bind(null, p)}>{p}</button>)}
      <button onClick={onDrive}>{item.driveUrl ? 'Update Drive' : 'Attach Drive'}</button>
      <button onClick={onNotes}>Notes</button>
      <button onClick={onAction}>Next action</button>
      <button className="danger" onClick={onRemove}>Archive</button>
    </div>
  </article>;
}

function WorkspaceRolePanel({ role }: { role: 'ceo' | 'manager' | 'agent' }) {
  return <section className="mos-role-panel">
    <div><span>{role.toUpperCase()} WORKSPACE</span><h3>{role === 'ceo' ? 'Decision control' : role === 'manager' ? 'Execution orchestration' : 'Agent action desk'}</h3></div>
    <div className="mos-role-list">{rolePlaybooks[role].map(action => <p key={action}>→ {action}</p>)}</div>
  </section>;
}

export default function MOSWorkspace({ kind = 'strategy', title, subtitle, role = 'manager' }: { kind?: MarketEntityKind; title: string; subtitle: string; role?: 'ceo' | 'manager' | 'agent' }) {
  const { records, get, addRecord, updateRecord, cloneRecord, bulkStatus, updateStatus, updatePriority, attachDrive, updateNotes, setNextAction, removeRecord, clearDemoData } = useMarketOSStore();
  const [form, setForm] = useState({ title: '', owner: 'Marketing Director', driveUrl: '', notes: '' });
  const [filter, setFilter] = useState<'all' | MOSStatus>('all');
  const [view, setView] = useState<'board' | 'cards' | 'command'>('board');
  const items = get(kind).filter(item => filter === 'all' ? true : item.status === filter);
  const alerts = get('alert');
  const critical = records.filter(r => r.priority === 'critical').length;
  const active = records.filter(r => r.status === 'active').length;
  const blocked = records.filter(r => r.status === 'blocked').length;
  const avgScore = useMemo(() => scoreDominance(records), [records]);
  const directives = useMemo(() => generateDirectives(records, kind), [records, kind]);

  function create() {
    if (!form.title.trim()) return;
    addRecord(makeRecord(kind, form.title, form.owner, form.driveUrl, form.notes));
    setForm({ title: '', owner: 'Marketing Director', driveUrl: '', notes: '' });
  }

  function promptText(label: string, current = '') {
    if (typeof window === 'undefined') return '';
    return window.prompt(label, current) || '';
  }

  return <main className="mos-page">
    <style jsx global>{`
      .mos-page{min-height:100vh;background:radial-gradient(circle at top left,#eef6ff 0,#f8fafc 34%,#eef2f7 100%);color:#0f172a;padding:26px 28px 42px;font-family:Inter,system-ui,Arial,sans-serif}.mos-hero{display:grid;grid-template-columns:1.2fr .8fr;gap:18px;align-items:stretch}.mos-hero-main{border:1px solid rgba(148,163,184,.35);border-radius:30px;padding:26px;background:linear-gradient(135deg,#0f172a,#18243b 56%,#26344f);color:white;box-shadow:0 24px 60px rgba(15,23,42,.18);position:relative;overflow:hidden}.mos-hero-main:after{content:"";position:absolute;right:-90px;top:-90px;width:240px;height:240px;border-radius:999px;background:rgba(59,130,246,.22)}.mos-kicker{font-size:11px;letter-spacing:.23em;text-transform:uppercase;color:#bfdbfe;font-weight:900}.mos-title{font-size:38px;line-height:1.02;margin:8px 0}.mos-sub{color:#dbeafe;max-width:930px;font-size:14px}.mos-nav{display:flex;gap:8px;flex-wrap:wrap;margin:20px 0}.mos-nav a{background:rgba(255,255,255,.82);backdrop-filter:blur(14px);border:1px solid #dbe3ef;border-radius:999px;padding:9px 12px;text-decoration:none;color:#0f172a;font-weight:800;font-size:12px}.mos-nav a:hover{background:#0f172a;color:white}.mos-nav small{display:block;color:#64748b;font-weight:700;font-size:9px}.mos-hero-side{display:grid;gap:12px}.mos-metric{background:white;border:1px solid #dbe3ef;border-radius:24px;padding:17px;box-shadow:0 14px 38px rgba(15,23,42,.06)}.mos-metric span{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:#64748b;font-weight:900}.mos-metric b{display:block;font-size:31px;margin-top:4px}.mos-four-zone{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:18px 0}.mos-zone{border-radius:24px;padding:17px;border:1px solid #dbe3ef;background:white;box-shadow:0 14px 38px rgba(15,23,42,.05)}.mos-zone span{font-size:10px;font-weight:950;letter-spacing:.15em;text-transform:uppercase;color:#64748b}.mos-zone b{display:block;font-size:18px;margin:8px 0}.mos-zone p{font-size:12px;line-height:1.45;color:#475569;margin:0}.mos-zone.command{border-top:5px solid #0f172a}.mos-zone.workflow{border-top:5px solid #2563eb}.mos-zone.action{border-top:5px solid #16a34a}.mos-zone.intel{border-top:5px solid #9333ea}.mos-layout{display:grid;grid-template-columns:340px 1fr 360px;gap:16px;align-items:start}.mos-panel{background:white;border:1px solid #dbe3ef;border-radius:26px;padding:18px;box-shadow:0 18px 44px rgba(15,23,42,.06)}.mos-panel h3{margin:0 0 10px;font-size:17px}.mos-panel p{color:#475569;font-size:13px;line-height:1.45}.mos-input,.mos-textarea,.mos-select{width:100%;border:1px solid #cbd5e1;border-radius:14px;padding:11px 12px;margin:6px 0;background:#f8fafc;color:#0f172a}.mos-textarea{min-height:78px;resize:vertical}.mos-primary,.mos-secondary{border:0;border-radius:14px;padding:11px 13px;font-weight:900;cursor:pointer}.mos-primary{background:#0f172a;color:white}.mos-secondary{background:#e2e8f0;color:#0f172a}.mos-danger{background:#fee2e2;color:#991b1b}.mos-tool-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.mos-tool{border:1px solid #dbe3ef;background:#f8fafc;border-radius:18px;padding:13px;text-align:left;cursor:pointer}.mos-tool b{display:block;color:#2563eb;font-size:11px}.mos-tool span{display:block;font-weight:900;margin:4px 0}.mos-tool em{font-size:11px;color:#64748b;font-style:normal}.mos-records{display:grid;gap:12px}.mos-record-card{background:white;border:1px solid #dbe3ef;border-radius:24px;padding:16px;box-shadow:0 14px 36px rgba(15,23,42,.05)}.mos-record-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.mos-record-top b{font-size:15px}.mos-record-top span{display:block;color:#64748b;font-size:12px;margin-top:3px}.mos-badge{border-radius:999px;padding:6px 9px;font-weight:950;font-size:10px;text-transform:uppercase;background:#e2e8f0;color:#334155}.mos-badge.active,.mos-badge.approved{background:#dcfce7;color:#166534}.mos-badge.review{background:#fef3c7;color:#92400e}.mos-badge.blocked{background:#fee2e2;color:#991b1b}.mos-badge.critical{background:#fee2e2;color:#991b1b}.mos-meter{height:9px;background:#e2e8f0;border-radius:999px;overflow:hidden;margin:12px 0}.mos-meter i{display:block;height:100%;background:linear-gradient(90deg,#2563eb,#16a34a);border-radius:999px}.mos-mini-pipeline,.mos-tags{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.mos-mini-pipeline span,.mos-tags span{border:1px solid #dbe3ef;background:#f8fafc;border-radius:999px;padding:6px 9px;font-size:11px;font-weight:800}.mos-mini-pipeline b{margin-left:6px;color:#2563eb}.mos-next{background:#f1f5f9;border-radius:14px;padding:10px;margin:10px 0;font-size:12px;color:#334155}.mos-actions{display:flex;gap:7px;flex-wrap:wrap}.mos-actions button{border:0;border-radius:999px;background:#e2e8f0;color:#0f172a;padding:7px 9px;font-size:11px;font-weight:900;cursor:pointer}.mos-actions button.danger{background:#fee2e2;color:#991b1b}.mos-role-panel{background:#0f172a;color:white;border-radius:24px;padding:18px;margin-bottom:12px}.mos-role-panel span{font-size:10px;letter-spacing:.18em;color:#bfdbfe;font-weight:950}.mos-role-panel h3{margin:5px 0 12px}.mos-role-list p{color:#e2e8f0;margin:7px 0;font-size:12px}.mos-command-list{display:grid;gap:10px}.mos-command-item{border-left:4px solid #ef4444;background:#fff7f7;border-radius:16px;padding:12px}.mos-command-item b{display:block}.mos-command-item span{font-size:12px;color:#64748b}.mos-filterbar{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 12px}.mos-filterbar button{border:0;border-radius:999px;padding:8px 10px;font-weight:900;background:#e2e8f0;color:#0f172a;cursor:pointer}.mos-filterbar button.active{background:#0f172a;color:white}.mos-board{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.mos-column{background:#f8fafc;border:1px solid #e2e8f0;border-radius:20px;padding:10px;min-height:260px}.mos-column h4{margin:0 0 10px;font-size:12px;text-transform:uppercase;letter-spacing:.12em;color:#64748b}.mos-column .mos-record-card{box-shadow:none;border-radius:18px;padding:12px;margin-bottom:10px}.mos-small{font-size:12px;color:#64748b}.mos-top-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}@media(max-width:1250px){.mos-layout{grid-template-columns:1fr}.mos-hero{grid-template-columns:1fr}.mos-four-zone{grid-template-columns:repeat(2,1fr)}}@media(max-width:760px){.mos-page{padding:18px}.mos-four-zone,.mos-board{grid-template-columns:1fr}.mos-tool-grid{grid-template-columns:1fr}.mos-title{font-size:28px}}
    `}</style>

    <section className="mos-hero">
      <div className="mos-hero-main">
        <div className="mos-kicker">AngelCare MOS · V7 Max Operational Layer</div>
        <h1 className="mos-title">{title}</h1>
        <p className="mos-sub">{subtitle}</p>
        <div className="mos-top-actions">
          <button className="mos-primary" onClick={() => addRecord(makeRecord('alert', 'Executive action required', 'AI Director', '', 'Review market risk and assign owner immediately.'))}>Generate executive alert</button>
          <button className="mos-secondary" onClick={() => setView(view === 'board' ? 'cards' : view === 'cards' ? 'command' : 'board')}>Switch view: {view}</button>
          <button className="mos-secondary" onClick={clearDemoData}>Reset demo state</button>
          <button className="mos-secondary" onClick={() => bulkStatus(kind, 'review', 'approved')}>Approve review queue</button>
        </div>
      </div>
      <div className="mos-hero-side">
        <div className="mos-metric"><span>Market system score</span><b>{avgScore}%</b><small>Average operational readiness</small></div>
        <div className="mos-metric"><span>Active execution</span><b>{active}</b><small>{critical} critical objects · {blocked} blocked</small></div>
      </div>
    </section>

    <nav className="mos-nav">{nav.map(item => <Link key={item.href} href={item.href}>{item.label}<small>{item.zone}</small></Link>)}</nav>

    <FourZoneHeader kind={kind} items={items} alerts={alerts} />

    <section className="mos-layout">
      <aside className="mos-panel">
        <h3>Create / command {labels[kind]}</h3>
        <input className="mos-input" placeholder="Title" value={form.title} onChange={e => setForm({...form, title:e.target.value})}/>
        <input className="mos-input" placeholder="Owner / agent" value={form.owner} onChange={e => setForm({...form, owner:e.target.value})}/>
        <input className="mos-input" placeholder="Google Drive URL / asset link" value={form.driveUrl} onChange={e => setForm({...form, driveUrl:e.target.value})}/>
        <textarea className="mos-textarea" placeholder="Operational brief, decision, blocker, offer thesis or task details" value={form.notes} onChange={e => setForm({...form, notes:e.target.value})}/>
        <button className="mos-primary" onClick={create}>Create {kind}</button>
        <p>Every section now has a real action surface: create, assign, approve, block, attach Drive proof, edit notes and define next actions.</p>
        <hr />
        <h3>Professional tools</h3>
        <ToolGrid kind={kind} />
        <hr />
        <h3>V7 Max controls</h3>
        <div className="mos-actions">
          <button onClick={() => items[0] && cloneRecord(items[0].id, { city: 'New Market', score: 45 })}>Duplicate first object</button>
          <button onClick={() => items[0] && updateRecord(items[0].id, { score: 90, nextAction: 'Board-ready after V7 readiness boost.' })}>Boost readiness</button>
        </div>
      </aside>

      <section className="mos-panel">
        <div className="mos-filterbar">
          {(['all','draft','active','review','approved','blocked'] as const).map(s => <button key={s} className={filter === s ? 'active' : ''} onClick={() => setFilter(s)}>{s}</button>)}
        </div>
        {view === 'board' && <div className="mos-board">{(['active','review','approved','blocked'] as MOSStatus[]).map(status => <div className="mos-column" key={status}><h4>{status}</h4>{items.filter(i => i.status === status).map(item => <RecordCard key={item.id} item={item} onStatus={(s) => updateStatus(item.id, s)} onPriority={(p) => updatePriority(item.id, p)} onDrive={() => attachDrive(item.id, promptText('Paste Google Drive URL', item.driveUrl || ''))} onNotes={() => updateNotes(item.id, promptText('Operational notes', item.notes || ''))} onAction={() => setNextAction(item.id, promptText('Next best action', item.nextAction || ''))} onRemove={() => updateStatus(item.id, 'archived')} />)}</div>)}</div>}
        {view === 'cards' && <div className="mos-records">{items.map(item => <RecordCard key={item.id} item={item} onStatus={(s) => updateStatus(item.id, s)} onPriority={(p) => updatePriority(item.id, p)} onDrive={() => attachDrive(item.id, promptText('Paste Google Drive URL', item.driveUrl || ''))} onNotes={() => updateNotes(item.id, promptText('Operational notes', item.notes || ''))} onAction={() => setNextAction(item.id, promptText('Next best action', item.nextAction || ''))} onRemove={() => removeRecord(item.id)} />)}</div>}
        {view === 'command' && <div className="mos-command-list">{records.filter(r => r.priority === 'critical' || r.status === 'blocked' || r.kind === 'alert').map(item => <div className="mos-command-item" key={item.id}><b>{item.title}</b><span>{item.kind} · {item.owner} · {item.nextAction || item.notes}</span><div className="mos-actions"><button onClick={() => updateStatus(item.id, 'active')}>activate</button><button onClick={() => updateStatus(item.id, 'review')}>review</button><button onClick={() => updateStatus(item.id, 'approved')}>approve</button></div></div>)}</div>}
      </section>

      <aside className="mos-panel">
        <WorkspaceRolePanel role={role} />
        <h3>AI Director · Intelligence Zone</h3>
        <div className="mos-command-list">
          {directives.map((d) => <div className="mos-command-item" key={d.title}><b>{d.title}</b><span>{d.severity} · {d.body}</span><div className="mos-actions"><button onClick={() => addRecord(makeRecord('task', d.title, 'Marketing Manager', '', d.body))}>Create task</button></div></div>)}
        </div>
        <hr />
        <h3>Native integration bridges</h3>
        <div className="mos-command-list">
          {integrationTargets.map((target) => <div className="mos-command-item" key={target.route}><b>{target.label}</b><span>{target.status} · {target.route}</span><div className="mos-actions"><Link href={target.route}>Open</Link></div></div>)}
        </div>
        <hr />
        <h3>AI Director · Active alerts</h3>
        <div className="mos-command-list">
          {alerts.slice(0, 5).map(alert => <div className="mos-command-item" key={alert.id}><b>{alert.title}</b><span>{'actionRequired' in alert ? alert.actionRequired : alert.nextAction}</span><div className="mos-actions"><button onClick={() => addRecord(makeRecord('task', `Corrective action: ${alert.title}`, 'Marketing Manager', '', alert.nextAction || 'Resolve alert'))}>Convert to task</button><button onClick={() => updateStatus(alert.id, 'review')}>Review</button></div></div>)}
        </div>
        <hr />
        <h3>System abilities in this section</h3>
        <p className="mos-small">4-zone layout, local-state workflow, Drive proof attachment, record creation, status movement, approval/rejection simulation, alert-to-task conversion, next-action control and role-specific workspace logic.</p>
      </aside>
    </section>
  </main>;
}
