import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { bulkRevenueAction, createRevenueRecord, executeRevenueAction, seedRevenueCommand, updateRevenueRecord } from './actions'

type WorkspaceKey = 'overview' | 'tasks' | 'prospects' | 'campaigns' | 'appointments' | 'follow-ups' | 'automation' | 'ai-scoring' | 'management' | 'control-tower' | 'partnerships' | 'market-mapping' | 'daily-desk' | 'strategy-room' | 'workload-balancer' | 'notifications' | 'business-development' | 'growth' | 'cockpit' | 'master-command' | 'team-performance' | 'overdue-heatmap' | 'system-activation' | 'meta-readiness' | 'elite-command' | 'b2c-workflow' | 'sdr-execution' | 'leads-impact' | 'predictive' | 'my-work' | 'executive-briefing'

type RevenueRecord = {
  id: string
  module_key: string
  title: string
  owner?: string | null
  priority?: string | null
  status?: string | null
  stage?: string | null
  health?: string | null
  value_mad?: number | null
  due_at?: string | null
  description?: string | null
  created_at?: string | null
  updated_at?: string | null
  metadata?: Record<string, unknown>
}

type RevenueActionLog = {
  action_type?: string | null
  note?: string | null
  related_type?: string | null
  created_at?: string | null
}

type WorkspaceConfig = {
  key: WorkspaceKey
  route: string
  title: string
  eyebrow: string
  mission: string
  visual: string
  tone: string
  dark: string
  modules: string[]
  primaryAction: string
  secondaryAction: string
  kpis: string[]
  stages: string[]
  playbooks: string[]
  controls: string[]
  subpages: { label: string; href: string; desc: string }[]
  fields: { label: string; key: keyof RevenueRecord | 'next_action' | 'score'; hint: string }[]
  scenarios: string[]
}

const configs: Record<string, WorkspaceConfig> = {
  overview: {
    key: 'overview', route: '/revenue-command-center', title: 'Revenue Command HQ', eyebrow: 'Executive command layer', visual: 'ðŸ›ï¸', tone: '#4f46e5', dark: '#111827',
    mission: 'Unify revenue tasks, prospects, campaigns, appointments, partnerships, automation, and management into one accountable command system.',
    modules: ['tasks','prospects','campaigns','appointments','follow-ups','partnerships','automation','ai-scoring','management','control-tower'], primaryAction: 'Create command record', secondaryAction: 'Seed operating system',
    kpis: ['Total active command records','At-risk revenue value','Overdue execution points','Owner coverage','SLA recovery rate','Closed-won momentum'], stages: ['intake','qualification','execution','intervention','recovery_plan','manager_review','closed_won'],
    playbooks: ['Daily revenue war-room','Ownerless record sweep','High-value risk recovery','Weekly executive briefing','Pipeline hygiene enforcement','No-delay follow-up discipline'],
    controls: ['Assign owner','Escalate critical item','Create next action','Archive dead work','Launch recovery plan','Open audit trail'],
    subpages: [
      { label:'Control Tower', href:'/revenue-command-center/control-tower', desc:'Executive risk, SLA, value, workload, and intervention command.' },
      { label:'Tasks', href:'/revenue-command-center/tasks', desc:'Deep execution, subtasks, owners, deadlines, status, and activity.' },
      { label:'Prospects', href:'/revenue-command-center/prospects', desc:'Qualification, scoring, decision maps, follow-ups, and stage movement.' },
      { label:'Automation', href:'/revenue-command-center/automation', desc:'Rules, triggers, alerts, playbooks, and test execution.' },
    ],
    fields: [ { label:'Owner', key:'owner', hint:'Every revenue item must have one accountable person.' }, { label:'Stage', key:'stage', hint:'Where this item lives in the production flow.' }, { label:'Value MAD', key:'value_mad', hint:'Commercial exposure or opportunity size.' } ],
    scenarios: ['New lead without owner','Critical overdue callback','Campaign underperforming','Manager approval needed','Appointment no-show recovery','Partnership negotiation stalled']
  },
  'control-tower': {
    key:'control-tower', route:'/revenue-command-center/control-tower', title:'Control Tower', eyebrow:'Executive intervention room', visual:'ðŸ›¡ï¸', tone:'#dc2626', dark:'#7f1d1d',
    mission:'Expose the riskiest revenue bottlenecks and give leadership immediate intervention controls before money, trust, or client momentum is lost.',
    modules:['tasks','prospects','appointments','follow-ups','campaigns','partnerships','management'], primaryAction:'Open intervention', secondaryAction:'Escalate risk',
    kpis:['Critical risks','SLA breaches','Revenue at risk','Unassigned work','Manager interventions','Recovered items'], stages:['risk_scan','triage','intervention','owner_assignment','recovery_plan','executive_review','closed'],
    playbooks:['Red flag triage','Ownerless item intervention','VIP revenue rescue','Overdue heatmap command','SLA breach response','Executive override log'],
    controls:['Create fix-now task','Assign executive owner','Freeze stalled workflow','Open manager override','Trigger recovery plan','Review audit trail'],
    subpages:[{label:'Risk',href:'/revenue-command-center/control-tower/risk',desc:'Risk heatmap and high-value blockers.'},{label:'SLA',href:'/revenue-command-center/control-tower/sla',desc:'Deadline breaches and recovery actions.'},{label:'Performance',href:'/revenue-command-center/control-tower/performance',desc:'Execution velocity and owner delivery.'},{label:'Interventions',href:'/revenue-command-center/control-tower/interventions',desc:'Leadership actions and override history.'}],
    fields:[{label:'Health',key:'health',hint:'Risk state requiring leadership attention.'},{label:'Owner',key:'owner',hint:'Escalation owner.'},{label:'Next action',key:'next_action',hint:'Immediate command move.'}], scenarios:['Critical client lead idle','No owner after intake','VIP appointment unconfirmed','Campaign spend without return','Partnership stuck in legal','SDR backlog expanding']
  },
  tasks: {
    key:'tasks', route:'/revenue-command-center/tasks', title:'Tasks Command Engine', eyebrow:'Execution discipline', visual:'âœ…', tone:'#2563eb', dark:'#1e3a8a',
    mission:'Turn every revenue action into an owned, measurable, deadline-bound execution object with subtasks, activity, escalation, and completion discipline.',
    modules:['tasks'], primaryAction:'Create task', secondaryAction:'Seed tasks', kpis:['Open tasks','Critical tasks','Due today','Completed actions','Owner coverage','Blocked execution'], stages:['intake','assigned','in_progress','blocked','manager_review','completed','archived'],
    playbooks:['Daily owner commitment','Subtask decomposition','Priority reset','Blocked task recovery','Manager review queue','Completion audit'],
    controls:['Create task','Assign owner','Add subtask','Mark complete','Escalate','Archive'],
    subpages:[{label:'New Task',href:'/revenue-command-center/tasks/new',desc:'Create a fully owned execution task.'},{label:'Board',href:'/revenue-command-center/tasks/board',desc:'Kanban execution board.'},{label:'Depth',href:'/revenue-command-center/tasks/seed1/depth',desc:'Deep task breakdown and activity.'},{label:'My Work',href:'/revenue-command-center/my-work',desc:'Personal workload cockpit.'}],
    fields:[{label:'Priority',key:'priority',hint:'Urgency and escalation state.'},{label:'Due date',key:'due_at',hint:'Mandatory deadline.'},{label:'Stage',key:'stage',hint:'Execution position.'}], scenarios:['Owner has too many critical tasks','Task overdue before client callback','Subtasks missing for large objective','Blocked task needs manager decision','Completed task needs audit','Task must become prospect follow-up']
  },
  prospects: {
    key:'prospects', route:'/revenue-command-center/prospects', title:'Prospects Pipeline Command', eyebrow:'Business development domination', visual:'ðŸŽ¯', tone:'#059669', dark:'#064e3b',
    mission:'Manage every prospect from discovery to qualification, decision-map, appointment, proposal, negotiation, and won/lost outcome with clear next action discipline.',
    modules:['prospects'], primaryAction:'Create prospect', secondaryAction:'Qualify pipeline', kpis:['Active prospects','Qualified opportunities','Revenue MAD','Decision makers mapped','Follow-ups due','Won momentum'], stages:['discovery','qualification','decision_map','appointment','proposal','negotiation','closed_won','closed_lost'],
    playbooks:['MEDDIC-style qualification','Decision-maker map','Next best action','No-response recovery','Proposal control','Win/loss review'],
    controls:['Qualify','Move stage','Assign closer','Create follow-up','Schedule appointment','Mark won/lost'],
    subpages:[{label:'New Prospect',href:'/revenue-command-center/prospects/new',desc:'Create a high-quality BD opportunity.'},{label:'Pipeline',href:'/revenue-command-center/prospects/pipeline',desc:'Pipeline board by sales stage.'},{label:'Qualification',href:'/revenue-command-center/prospects/seed1/qualification',desc:'Qualification and fit assessment.'},{label:'Decision Map',href:'/revenue-command-center/prospects/seed1/decision-map',desc:'Stakeholders, influence, and blockers.'}],
    fields:[{label:'Value MAD',key:'value_mad',hint:'Opportunity size.'},{label:'Stage',key:'stage',hint:'Pipeline stage.'},{label:'Score',key:'score',hint:'Priority score for conversion.'}], scenarios:['High-value lead without decision maker','Proposal stalled','Prospect needs appointment','Closer assignment missing','Lost reason not captured','Follow-up overdue after discovery']
  },
  campaigns: {
    key:'campaigns', route:'/revenue-command-center/campaigns', title:'Campaign Revenue Command', eyebrow:'Revenue campaigns execution', visual:'ðŸ“£', tone:'#ea580c', dark:'#7c2d12', mission:'Operate campaigns as revenue production systems: launch, assets, tasks, leads, ROI, risk, owners, and improvement loops.',
    modules:['campaigns'], primaryAction:'Launch campaign', secondaryAction:'Create checklist', kpis:['Active campaigns','Campaign ROI','Leads generated','Tasks open','Spend efficiency','Revenue influenced'], stages:['planning','asset_ready','launch','optimization','lead_handoff','roi_review','closed'], playbooks:['Launch checklist','Creative asset control','Lead handoff SLA','ROI rescue','Campaign pause decision','Post-campaign learning'], controls:['Launch','Pause','Create assets','Assign tasks','Review ROI','Create lead handoff'], subpages:[{label:'New Campaign',href:'/revenue-command-center/campaigns/new',desc:'Build a revenue campaign.'},{label:'Board',href:'/revenue-command-center/campaigns/board',desc:'Campaign board.'},{label:'Execution',href:'/revenue-command-center/campaigns/seed1/execution',desc:'Execution checklist.'},{label:'Performance',href:'/revenue-command-center/campaigns/seed1/performance',desc:'ROI and lead performance.'}], fields:[{label:'Value MAD',key:'value_mad',hint:'Revenue target.'},{label:'Stage',key:'stage',hint:'Campaign lifecycle.'},{label:'Owner',key:'owner',hint:'Campaign commander.'}], scenarios:['Campaign launched without assets','Leads not handed to SDR','Low ROI after spend','No owner on checklist','Creative missing approval','Campaign needs pause']
  },
  appointments: {
    key:'appointments', route:'/revenue-command-center/appointments', title:'Appointments Conversion Desk', eyebrow:'Meeting and conversion discipline', visual:'ðŸ“…', tone:'#7c3aed', dark:'#4c1d95', mission:'Control consultations, confirmations, no-shows, reschedules, next steps, and conversion outcomes with zero lost appointment discipline.', modules:['appointments'], primaryAction:'Schedule appointment', secondaryAction:'Confirm queue', kpis:['Today appointments','Unconfirmed','No-show risks','Converted meetings','Reschedules','Next steps created'], stages:['requested','scheduled','confirmed','completed','no_show','rescheduled','converted'], playbooks:['Confirmation cadence','No-show recovery','VIP prep sheet','Post-call next action','Reschedule control','Conversion debrief'], controls:['Schedule','Confirm','Reschedule','Mark no-show','Create next follow-up','Convert'], subpages:[{label:'New Appointment',href:'/revenue-command-center/appointments/new',desc:'Schedule appointment.'},{label:'Command',href:'/revenue-command-center/appointments/command',desc:'Appointment command queue.'},{label:'Details',href:'/revenue-command-center/appointments/seed1',desc:'Appointment detail room.'},{label:'Overdue Follow-ups',href:'/revenue-command-center/follow-ups/overdue',desc:'Missed next steps.'}], fields:[{label:'Due date',key:'due_at',hint:'Meeting date.'},{label:'Owner',key:'owner',hint:'Coordinator or closer.'},{label:'Stage',key:'stage',hint:'Appointment state.'}], scenarios:['VIP consultation unconfirmed','No-show requires recovery','Closer lacks preparation','Appointment has no next step','Reschedule not confirmed','Family decision maker absent']
  },
  'follow-ups': {
    key:'follow-ups', route:'/revenue-command-center/follow-ups', title:'Follow-up Discipline Center', eyebrow:'No lead left behind', visual:'ðŸ”', tone:'#0891b2', dark:'#164e63', mission:'Prevent revenue leakage by enforcing every callback, promise, answer, proposal follow-up, and post-meeting next step.', modules:['follow-ups'], primaryAction:'Create follow-up', secondaryAction:'Recover overdue', kpis:['Open follow-ups','Overdue','Due today','Recovered','Ownerless','High-value callbacks'], stages:['created','due_today','overdue','contacted','rescheduled','completed','archived'], playbooks:['Overdue recovery block','High-value callback sprint','No-answer cadence','Proposal chase','Post-appointment next action','Manager recovery review'], controls:['Create follow-up','Mark contacted','Reschedule','Escalate overdue','Complete','Archive'], subpages:[{label:'Overdue',href:'/revenue-command-center/follow-ups/overdue',desc:'Overdue callbacks.'},{label:'Heatmap',href:'/revenue-command-center/overdue-heatmap',desc:'Follow-up heatmap.'},{label:'My Work',href:'/revenue-command-center/my-work',desc:'Owner-specific queue.'},{label:'Notifications',href:'/revenue-command-center/notifications',desc:'Alert center.'}], fields:[{label:'Priority',key:'priority',hint:'Recovery urgency.'},{label:'Due date',key:'due_at',hint:'When follow-up is due.'},{label:'Value MAD',key:'value_mad',hint:'Revenue exposure.'}], scenarios:['Prospect ignored after proposal','Callback due today','Owner forgot next step','High-value lead aging','Family asked for answer','Post-appointment follow-up missing']
  },
  automation: {
    key:'automation', route:'/revenue-command-center/automation', title:'Automation Rule Factory', eyebrow:'Workflow control system', visual:'âš™ï¸', tone:'#475569', dark:'#0f172a', mission:'Build, test, and operate rules that assign owners, escalate risk, create follow-ups, notify managers, and prevent revenue leakage automatically.', modules:['automation'], primaryAction:'Create automation rule', secondaryAction:'Test workflow', kpis:['Active rules','Triggered today','Failed automations','Recovered risks','Alerts created','Manual overrides'], stages:['draft','testing','active','paused','failed','review','retired'], playbooks:['No-owner auto-assign','Overdue escalation','High-value alert','Campaign handoff workflow','No-show recovery automation','Daily digest'], controls:['Create rule','Activate','Pause','Test','Review failures','Open playbook'], subpages:[{label:'Rules',href:'/revenue-command-center/automation/rules',desc:'Automation rules.'},{label:'Workflows',href:'/revenue-command-center/automation/workflows',desc:'Workflow builder.'},{label:'Alerts',href:'/revenue-command-center/automation/alerts',desc:'Alert center.'},{label:'Playbooks',href:'/revenue-command-center/automation/playbooks',desc:'Operational playbooks.'}], fields:[{label:'Stage',key:'stage',hint:'Rule lifecycle.'},{label:'Health',key:'health',hint:'Rule reliability.'},{label:'Owner',key:'owner',hint:'System owner.'}], scenarios:['Task has no owner','Follow-up overdue 24h','Prospect value above threshold','Campaign lead not handed off','Appointment no-show','Manager approval needed']
  },
  'ai-scoring': {
    key:'ai-scoring', route:'/revenue-command-center/ai-scoring', title:'AI Revenue Scoring Lab', eyebrow:'Prioritization intelligence', visual:'ðŸ§ ', tone:'#9333ea', dark:'#581c87', mission:'Prioritize prospects, tasks, risk, and next actions using scoring logic so teams focus on the highest impact revenue moves first.', modules:['ai-scoring','prospects','tasks'], primaryAction:'Score item', secondaryAction:'Generate recommendation', kpis:['High-score prospects','Risk predictions','Next actions','Stale opportunities','Recovered by AI','Score coverage'], stages:['data_check','scoring','recommendation','human_review','approved','actioned','learning'], playbooks:['Prospect priority model','Risk alert model','Next-best-action model','Stale opportunity detection','Owner workload scoring','Win probability review'], controls:['Score prospect','Flag risk','Recommend action','Send to manager','Approve recommendation','Create task'], subpages:[{label:'Prospect Scores',href:'/revenue-command-center/ai-scoring/prospects',desc:'Opportunity scoring.'},{label:'Task Scores',href:'/revenue-command-center/ai-scoring/tasks',desc:'Execution priority.'},{label:'Risk',href:'/revenue-command-center/ai-scoring/risk',desc:'Risk detection.'},{label:'Recommendations',href:'/revenue-command-center/ai-scoring/recommendations',desc:'Next best actions.'}], fields:[{label:'Score',key:'score',hint:'Commercial priority.'},{label:'Health',key:'health',hint:'Risk signal.'},{label:'Next action',key:'next_action',hint:'Recommended move.'}], scenarios:['High-value low-activity prospect','Task risk before deadline','Campaign weak performance','Owner overloaded','Opportunity aging','Follow-up likely to convert']
  },
  management: {
    key:'management', route:'/revenue-command-center/management', title:'Revenue Management Office', eyebrow:'People, workload, permission, audit', visual:'ðŸ‘”', tone:'#0f766e', dark:'#134e4a', mission:'Give managers control over team workload, ownership, access, approvals, audit, performance, and accountable production routines.', modules:['management','tasks','prospects','appointments'], primaryAction:'Assign workload', secondaryAction:'Review performance', kpis:['Team workload','Overloaded owners','Approvals pending','Audit events','Performance gaps','Recovered blockers'], stages:['review','assignment','approval','coaching','audit','escalation','closed'], playbooks:['Daily capacity check','Manager approval queue','Owner performance review','Permission review','Escalation committee','Audit sampling'], controls:['Assign owner','Approve','Reject','Rebalance workload','Open audit','Coach owner'], subpages:[{label:'Team',href:'/revenue-command-center/management/team',desc:'Team control.'},{label:'Workload',href:'/revenue-command-center/management/workload',desc:'Workload balance.'},{label:'Permissions',href:'/revenue-command-center/management/permissions',desc:'Access control.'},{label:'Audit',href:'/revenue-command-center/management/audit',desc:'Audit trail.'}], fields:[{label:'Owner',key:'owner',hint:'Responsible person.'},{label:'Stage',key:'stage',hint:'Manager workflow.'},{label:'Health',key:'health',hint:'Execution risk.'}], scenarios:['Owner overloaded','Approval queue blocked','Repeated overdue task pattern','Unauthorized action risk','Manager override needed','Team productivity gap']
  },
  partnerships: { key:'partnerships', route:'/revenue-command-center/partnerships', title:'Partnership Revenue Desk', eyebrow:'Strategic relationships', visual:'ðŸ¤', tone:'#be123c', dark:'#881337', mission:'Control referral, institutional, clinic, and corporate partnerships from identification to agreement, activation, referrals, and performance.', modules:['partnerships'], primaryAction:'Create partnership opportunity', secondaryAction:'Review pipeline', kpis:['Active partners','Negotiations','Referral value','Activation gaps','Agreement risks','Won partners'], stages:['identified','contacted','qualification','negotiation','agreement','activation','performance'], playbooks:['Partner fit assessment','Referral economics','Agreement checklist','Activation launch','Partner review cadence','Risk recovery'], controls:['Qualify partner','Assign owner','Create agreement task','Activate','Review performance','Archive'], subpages:[{label:'Pipeline',href:'/revenue-command-center/partnerships/pipeline',desc:'Partnership pipeline.'},{label:'New',href:'/revenue-command-center/partnerships/new',desc:'Create partner opportunity.'},{label:'Activation',href:'/revenue-command-center/partnerships/seed1/activation',desc:'Activation room.'},{label:'Performance',href:'/revenue-command-center/partnerships/seed1/performance',desc:'Referral and revenue.'}], fields:[{label:'Value MAD',key:'value_mad',hint:'Expected referral value.'},{label:'Stage',key:'stage',hint:'Partnership lifecycle.'},{label:'Owner',key:'owner',hint:'Relationship owner.'}], scenarios:['Clinic referral inactive','Agreement blocked','Partner needs training','No referral after activation','Strategic partner risk','Partner ROI review due'] },
  'market-mapping': { key:'market-mapping', route:'/revenue-command-center/market-mapping', title:'Market Mapping War Room', eyebrow:'Territory and opportunity coverage', visual:'ðŸ—ºï¸', tone:'#16a34a', dark:'#14532d', mission:'Map city, segment, competitor, partner, and client opportunity coverage so business development attacks the right areas first.', modules:['market-mapping','prospects','partnerships'], primaryAction:'Create coverage record', secondaryAction:'Review gaps', kpis:['Coverage zones','White spaces','Competitor risks','Partner gaps','Prospect clusters','Expansion moves'], stages:['research','mapped','prioritized','assigned','activated','measured','expanded'], playbooks:['Territory segmentation','Competitor scan','Partner density map','Prospect cluster attack','Coverage gap review','Expansion decision'], controls:['Assign zone','Create prospect batch','Flag competitor','Create partner lead','Review coverage','Archive zone'], subpages:[{label:'Coverage',href:'/revenue-command-center/market-mapping/coverage',desc:'Coverage dashboard.'},{label:'Prospect Clusters',href:'/revenue-command-center/prospects',desc:'Mapped prospect clusters.'},{label:'Partnership Gaps',href:'/revenue-command-center/partnerships',desc:'Partner coverage.'},{label:'Strategy Room',href:'/revenue-command-center/strategy-room',desc:'Strategic attack plan.'}], fields:[{label:'Stage',key:'stage',hint:'Coverage workflow.'},{label:'Owner',key:'owner',hint:'Zone owner.'},{label:'Value MAD',key:'value_mad',hint:'Estimated market potential.'}], scenarios:['Uncovered premium area','Competitor stronghold','No clinic partner in zone','Family demand cluster','Expansion candidate','Coverage action stale'] }
}

const alias: Record<string, string> = {
  'daily-desk':'tasks', 'strategy-room':'overview', 'workload-balancer':'management', notifications:'follow-ups', 'business-development':'prospects', growth:'campaigns', cockpit:'overview', 'master-command':'overview', 'team-performance':'management', 'overdue-heatmap':'follow-ups', 'system-activation':'automation', 'meta-readiness':'ai-scoring', 'elite-command':'control-tower', 'b2c-workflow':'campaigns', 'sdr-execution':'follow-ups', 'leads-impact':'prospects', predictive:'ai-scoring', 'my-work':'tasks', 'executive-briefing':'control-tower'
}

function cfg(key: string): WorkspaceConfig { return configs[key] || configs[alias[key]] || configs.overview }
function money(v?: number | null) { return new Intl.NumberFormat('fr-MA', { style:'currency', currency:'MAD', maximumFractionDigits:0 }).format(Number(v || 0)) }
function fmt(date?: string | null) { if (!date) return 'No date'; try { return new Intl.DateTimeFormat('fr-FR', { dateStyle:'medium', timeStyle:'short' }).format(new Date(date)) } catch { return 'Invalid date' } }
function priorityTone(p?: string | null) { if (p === 'critical') return '#dc2626'; if (p === 'high') return '#ea580c'; if (p === 'medium') return '#2563eb'; return '#64748b' }

async function seedRevenueCommandFormAction() {
  "use server"
  await seedRevenueCommand()
}

async function createRevenueRecordFormAction(formData: FormData) {
  "use server"
  await createRevenueRecord(formData)
}

async function bulkRevenueActionFormAction(formData: FormData) {
  "use server"
  await bulkRevenueAction(formData)
}

async function executeRevenueActionFormAction(formData: FormData) {
  "use server"
  await executeRevenueAction(formData)
}

async function updateRevenueRecordFormAction(formData: FormData) {
  "use server"
  await updateRevenueRecord(formData)
}

function healthTone(h?: string | null) { if (h === 'risk') return '#dc2626'; if (h === 'recovery') return '#d97706'; if (h === 'on_track') return '#16a34a'; return '#64748b' }

async function loadRecords(config: WorkspaceConfig, detailId?: string) {
  try {
    const supabase = await createClient()
    if (detailId && detailId !== 'seed1') {
      const { data } = await supabase.from('revenue_command_records').select('*').eq('id', detailId).maybeSingle()
      if (data) return { records: [data as RevenueRecord], selected: data as RevenueRecord, logs: [] as RevenueActionLog[] }
    }
    const { data } = await supabase.from('revenue_command_records').select('*').in('module_key', config.modules).neq('status','archived').order('created_at', { ascending:false }).limit(80)
    const records = (data || []) as RevenueRecord[]
    const selected = records[0]
    let logs: RevenueActionLog[] = []
    try { const q = await supabase.from('revenue_command_action_logs').select('*').order('created_at', { ascending:false }).limit(20); logs = q.data || [] } catch {}
    return { records, selected, logs }
  } catch { return { records: [] as RevenueRecord[], selected: undefined as RevenueRecord | undefined, logs: [] as RevenueActionLog[] } }
}

function fallback(config: WorkspaceConfig): RevenueRecord[] {
  return config.scenarios.map((s, i) => ({ id:`demo-${config.key}-${i+1}`, module_key:config.modules[0], title:s, owner:['Revenue Manager','BD Officer','SDR Lead','Ops Coordinator','Executive'][i%5], priority:i%3===0?'critical':i%2===0?'medium':'high', status:i%4===0?'active':'in_progress', stage:config.stages[i%config.stages.length], health:i%3===0?'risk':i%2===0?'recovery':'on_track', value_mad:(i+1)*25000, due_at:new Date(Date.now()+(i-2)*86400000).toISOString(), description:`Production scenario for ${config.title}: ${s}` }))
}

function ShellButton({ children }: { children: React.ReactNode }) { return <button style={btn}>{children}</button> }
function Badge({ children, tone = '#2563eb' }: { children: React.ReactNode; tone?: string }) { return <span style={{...badge, color:tone, borderColor:`${tone}55`, background:`${tone}12`}}>{children}</span> }
function Card({ children, title, subtitle }: { children: React.ReactNode; title?: string; subtitle?: string }) { return <section style={card}>{title ? <div style={{marginBottom:14}}><h2 style={h2}>{title}</h2>{subtitle ? <p style={sub}>{subtitle}</p> : null}</div> : null}{children}</section> }

export default async function RevenueCommandMaxWorkspace({ workspaceKey='overview', detailId, mode='workspace' }: { workspaceKey?: string; detailId?: string; mode?: string }) {
  const config = cfg(workspaceKey)
  const loaded = await loadRecords(config, detailId)
  const records = loaded.records.length ? loaded.records : fallback(config)
  const selected = loaded.selected || records[0]
  const active = records.filter(r => !['completed','won','lost','archived'].includes(String(r.status))).length
  const critical = records.filter(r => r.priority === 'critical' || r.health === 'risk').length
  const totalValue = records.reduce((s,r) => s + Number(r.value_mad || 0), 0)
  const overdue = records.filter(r => r.due_at && new Date(r.due_at).getTime() < Date.now() && !['completed','won','lost'].includes(String(r.status))).length
  const owners = new Set(records.map(r => r.owner).filter(Boolean)).size
  const ids = records.slice(0, 8).map(r => r.id).filter(id => !String(id).startsWith('demo-')).join(',')

  return <main style={page}>
    <section style={{...hero, background:`linear-gradient(135deg, ${config.dark}, ${config.tone})`}}>
      <div>
        <div style={eyebrow}><span>{config.visual}</span>{config.eyebrow}</div>
        <h1 style={h1}>{config.title}</h1>
        <p style={heroText}>{config.mission}</p>
        <div style={heroLinks}>{config.subpages.map(s => <Link key={s.href} href={s.href} style={heroLink}>{s.label}</Link>)}</div>
      </div>
<form action={seedRevenueCommandFormAction} style={heroPanel}>
        <strong>Production recovery mode</strong>
        <span>This workspace uses real revenue_command_records when available and shows operational scenarios only when the table is empty.</span>
        <ShellButton>{config.secondaryAction}</ShellButton>
      </form>
    </section>

    <section style={kpiGrid}>
      <div style={kpi}><span>Active</span><strong>{active}</strong><small>{config.kpis[0]}</small></div>
      <div style={kpi}><span>Critical</span><strong style={{color:'#dc2626'}}>{critical}</strong><small>{config.kpis[1]}</small></div>
      <div style={kpi}><span>Value</span><strong>{money(totalValue)}</strong><small>{config.kpis[2]}</small></div>
      <div style={kpi}><span>Overdue</span><strong style={{color: overdue ? '#dc2626' : '#16a34a'}}>{overdue}</strong><small>{config.kpis[3]}</small></div>
      <div style={kpi}><span>Owners</span><strong>{owners}</strong><small>{config.kpis[4]}</small></div>
      <div style={kpi}><span>Workspace</span><strong>{config.modules.length}</strong><small>Connected module keys</small></div>
    </section>

    <section style={grid2}>
      <Card title="Command creation panel" subtitle="Create a real database-backed record for this exact workspace, not a generic demo item.">
        <form action={createRevenueRecordFormAction} style={formGrid}>
          <input type="hidden" name="module_key" value={config.modules[0]} />
          <label style={label}>Title<input name="title" required placeholder={`${config.primaryAction} title`} style={input}/></label>
          <label style={label}>Owner<input name="owner" placeholder="Accountable owner" style={input}/></label>
          <label style={label}>Priority<select name="priority" style={input}><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label>
          <label style={label}>Status<select name="status" style={input}><option value="active">Active</option><option value="in_progress">In progress</option><option value="paused">Paused</option><option value="manager_review">Manager review</option></select></label>
          <label style={label}>Stage<select name="stage" style={input}>{config.stages.map(s => <option key={s} value={s}>{s.replaceAll('_',' ')}</option>)}</select></label>
          <label style={label}>Value MAD<input name="value_mad" type="number" placeholder="0" style={input}/></label>
          <label style={label}>Due date<input name="due_at" type="datetime-local" style={input}/></label>
          <label style={{...label, gridColumn:'1 / -1'}}>Description<textarea name="description" placeholder="Context, expected output, blockers, decision criteria" style={{...input, minHeight:90}}/></label>
          <div style={{gridColumn:'1 / -1'}}><ShellButton>{config.primaryAction}</ShellButton></div>
        </form>
      </Card>

      <Card title="Workspace playbooks" subtitle="Different operating routines per submodule so the page fits the real work environment.">
        <div style={playbookGrid}>{config.playbooks.map((p,i) => <div key={p} style={playbook}><b>{String(i+1).padStart(2,'0')}</b><span>{p}</span><small>{config.scenarios[i % config.scenarios.length]}</small></div>)}</div>
      </Card>
    </section>

    <section style={gridMain}>
      <Card title="Live execution board" subtitle="Records are grouped by priority, health, stage, owner, due date, and value.">
        <div style={toolbar}>
          <form action={bulkRevenueActionFormAction} style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <input type="hidden" name="module_key" value={config.modules[0]} /><input type="hidden" name="ids" value={ids} />
            <select name="action" style={inputSmall}><option value="escalate">Escalate selected</option><option value="complete">Complete selected</option><option value="archive">Archive selected</option></select>
            <ShellButton>Apply bulk action</ShellButton>
          </form>
          <Badge tone={config.tone}>{records.length} records</Badge>
        </div>
        <div style={tableWrap}><table style={table}><thead><tr><th>Record</th><th>Owner</th><th>Stage</th><th>Health</th><th>Value</th><th>Due</th><th>Actions</th></tr></thead><tbody>{records.map(r => <tr key={r.id}><td><b>{r.title}</b><p>{r.description}</p><div><Badge tone={priorityTone(r.priority)}>{r.priority || 'normal'}</Badge></div></td><td>{r.owner || 'Unassigned'}</td><td>{String(r.stage || 'intake').replaceAll('_',' ')}</td><td><Badge tone={healthTone(r.health)}>{r.health || 'unknown'}</Badge></td><td>{money(r.value_mad)}</td><td>{fmt(r.due_at)}</td><td><div style={actions}><form action={executeRevenueActionFormAction}><input type="hidden" name="id" value={r.id}/><input type="hidden" name="module_key" value={config.modules[0]}/><input type="hidden" name="action" value="escalate"/><button style={miniBtn}>Escalate</button></form><form action={executeRevenueActionFormAction}><input type="hidden" name="id" value={r.id}/><input type="hidden" name="module_key" value={config.modules[0]}/><input type="hidden" name="action" value="complete"/><button style={miniBtn}>Done</button></form><Link href={`${config.route}/${r.id}`} style={miniLink}>Open</Link></div></td></tr>)}</tbody></table></div>
      </Card>

      <aside style={{display:'grid',gap:18}}>
        <Card title="Control panel" subtitle="Fast actions designed for the current workspace.">
          <div style={controlGrid}>{config.controls.map((c,i) => <form key={c} action={executeRevenueActionFormAction} style={control}><input type="hidden" name="id" value={selected?.id || ''}/><input type="hidden" name="module_key" value={config.modules[0]}/><input type="hidden" name="action" value={i%2===0?'escalate':'recover'}/><strong>{c}</strong><span>{config.scenarios[i%config.scenarios.length]}</span><button style={miniBtn}>Execute</button></form>)}</div>
        </Card>
        <Card title="Subpages architecture" subtitle="Logical navigation for deeper execution.">
          <div style={subpageList}>{config.subpages.map(s => <Link href={s.href} key={s.href} style={subpage}><strong>{s.label}</strong><span>{s.desc}</span></Link>)}</div>
        </Card>
      </aside>
    </section>

    {mode === 'detail' ? <section style={grid2}>
      <Card title="Detail command room" subtitle="Edit the selected record and push the next operational movement.">
        <form action={updateRevenueRecordFormAction} style={formGrid}>
          <input type="hidden" name="id" value={selected?.id || ''}/><input type="hidden" name="module_key" value={config.modules[0]}/>
          <label style={label}>Title<input name="title" defaultValue={selected?.title || ''} style={input}/></label>
          <label style={label}>Owner<input name="owner" defaultValue={selected?.owner || ''} style={input}/></label>
          <label style={label}>Priority<select name="priority" defaultValue={selected?.priority || 'high'} style={input}><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label>
          <label style={label}>Stage<select name="stage" defaultValue={selected?.stage || config.stages[0]} style={input}>{config.stages.map(s => <option key={s} value={s}>{s.replaceAll('_',' ')}</option>)}</select></label>
          <label style={label}>Health<select name="health" defaultValue={selected?.health || 'on_track'} style={input}><option value="on_track">On track</option><option value="recovery">Recovery</option><option value="risk">Risk</option></select></label>
          <label style={label}>Value MAD<input name="value_mad" type="number" defaultValue={selected?.value_mad || 0} style={input}/></label>
          <label style={{...label, gridColumn:'1 / -1'}}>Description<textarea name="description" defaultValue={selected?.description || ''} style={{...input, minHeight:120}}/></label>
          <div style={{gridColumn:'1 / -1'}}><ShellButton>Save detail changes</ShellButton></div>
        </form>
      </Card>
      <Card title="Detail execution layers" subtitle="The workflow is intentionally different for each workspace.">
        <div style={stageGrid}>{config.stages.map((s,i) => <div key={s} style={stageCard}><b>{i+1}</b><strong>{s.replaceAll('_',' ')}</strong><span>{config.playbooks[i%config.playbooks.length]}</span></div>)}</div>
      </Card>
    </section> : null}

    <section style={grid2}>
      <Card title="Production scenarios" subtitle="Scenario library for real revenue control situations.">
        <div style={scenarioGrid}>{config.scenarios.map((s,i) => <div key={s} style={scenario}><strong>{s}</strong><span>Recommended response: {config.controls[i%config.controls.length]}</span><small>Stage: {config.stages[i%config.stages.length]}</small></div>)}</div>
      </Card>
      <Card title="Recent audit activity" subtitle="Real action log when table is available.">
        <div style={auditList}>{(loaded.logs.length ? loaded.logs : [{action_type:'workspace_loaded',note:'No audit rows yet. Execute actions to populate logs.',created_at:new Date().toISOString()}]).map((l: RevenueActionLog, i: number) => <div key={i} style={audit}><Badge tone={config.tone}>{l.action_type}</Badge><span>{l.note || l.related_type || 'Revenue command action'}</span><small>{fmt(l.created_at)}</small></div>)}</div>
      </Card>
    </section>
  </main>
}

const page: React.CSSProperties = { padding:'26px', background:'#f5f7fb', color:'#0f172a', minHeight:'100vh', display:'grid', gap:22 }
const hero: React.CSSProperties = { borderRadius:32, padding:30, color:'#fff', display:'grid', gridTemplateColumns:'minmax(0,1.5fr) 420px', gap:26, boxShadow:'0 24px 70px rgba(15,23,42,.22)' }
const eyebrow: React.CSSProperties = { display:'inline-flex', gap:10, alignItems:'center', padding:'9px 13px', border:'1px solid rgba(255,255,255,.25)', borderRadius:999, background:'rgba(255,255,255,.12)', fontWeight:900, textTransform:'uppercase', letterSpacing:'.08em', fontSize:12 }
const h1: React.CSSProperties = { margin:'18px 0 10px', fontSize:44, lineHeight:1, fontWeight:1000, color:'#fff' }
const heroText: React.CSSProperties = { fontSize:17, lineHeight:1.65, color:'rgba(255,255,255,.88)', maxWidth:900, fontWeight:650 }
const heroLinks: React.CSSProperties = { display:'flex', gap:10, flexWrap:'wrap', marginTop:20 }
const heroLink: React.CSSProperties = { color:'#fff', border:'1px solid rgba(255,255,255,.28)', background:'rgba(255,255,255,.12)', borderRadius:14, padding:'11px 13px', textDecoration:'none', fontWeight:900 }
const heroPanel: React.CSSProperties = { background:'rgba(255,255,255,.14)', border:'1px solid rgba(255,255,255,.22)', borderRadius:24, padding:20, display:'grid', gap:12, alignContent:'center', color:'#fff' }
const kpiGrid: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(6,minmax(0,1fr))', gap:14 }
const kpi: React.CSSProperties = { background:'#fff', border:'1px solid #e2e8f0', borderRadius:22, padding:16, display:'grid', gap:6, boxShadow:'0 14px 30px rgba(15,23,42,.05)' }
const card: React.CSSProperties = { background:'#fff', border:'1px solid #dbe3ee', borderRadius:26, padding:20, boxShadow:'0 18px 42px rgba(15,23,42,.06)' }
const h2: React.CSSProperties = { margin:0, fontSize:20, fontWeight:1000, color:'#0f172a' }
const sub: React.CSSProperties = { margin:'6px 0 0', color:'#64748b', fontWeight:700, lineHeight:1.5 }
const grid2: React.CSSProperties = { display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)', gap:18 }
const gridMain: React.CSSProperties = { display:'grid', gridTemplateColumns:'minmax(0,1fr) 390px', gap:18, alignItems:'start' }
const formGrid: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:12 }
const label: React.CSSProperties = { display:'grid', gap:6, fontSize:12, fontWeight:950, color:'#334155', textTransform:'uppercase', letterSpacing:'.04em' }
const input: React.CSSProperties = { border:'1px solid #cbd5e1', borderRadius:14, padding:'12px 13px', fontSize:14, color:'#0f172a', background:'#fff', fontWeight:700 }
const inputSmall: React.CSSProperties = { ...input, padding:'9px 10px' }
const btn: React.CSSProperties = { border:0, borderRadius:14, padding:'12px 15px', background:'#0f172a', color:'#fff', fontWeight:1000, cursor:'pointer' }
const miniBtn: React.CSSProperties = { border:'1px solid #cbd5e1', borderRadius:12, padding:'8px 10px', background:'#fff', color:'#0f172a', fontWeight:900, cursor:'pointer' }
const miniLink: React.CSSProperties = { ...miniBtn, textDecoration:'none', display:'inline-flex' }
const badge: React.CSSProperties = { display:'inline-flex', alignItems:'center', border:'1px solid', borderRadius:999, padding:'5px 8px', fontSize:11, fontWeight:1000, textTransform:'uppercase' }
const playbookGrid: React.CSSProperties = { display:'grid', gap:10 }
const playbook: React.CSSProperties = { display:'grid', gridTemplateColumns:'38px 1fr', gap:10, padding:12, border:'1px solid #e2e8f0', borderRadius:16, background:'#f8fafc' }
const toolbar: React.CSSProperties = { display:'flex', justifyContent:'space-between', gap:12, flexWrap:'wrap', marginBottom:12 }
const tableWrap: React.CSSProperties = { overflowX:'auto' }
const table: React.CSSProperties = { width:'100%', borderCollapse:'separate', borderSpacing:'0 10px' }
const actions: React.CSSProperties = { display:'flex', gap:7, flexWrap:'wrap' }
const controlGrid: React.CSSProperties = { display:'grid', gap:10 }
const control: React.CSSProperties = { border:'1px solid #e2e8f0', borderRadius:16, padding:12, background:'#f8fafc', display:'grid', gap:7 }
const subpageList: React.CSSProperties = { display:'grid', gap:10 }
const subpage: React.CSSProperties = { border:'1px solid #e2e8f0', borderRadius:16, padding:12, background:'#fff', color:'#0f172a', display:'grid', gap:5, textDecoration:'none' }
const stageGrid: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:10 }
const stageCard: React.CSSProperties = { border:'1px solid #e2e8f0', borderRadius:16, padding:12, background:'#f8fafc', display:'grid', gap:5 }
const scenarioGrid: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:10 }
const scenario: React.CSSProperties = { border:'1px solid #e2e8f0', borderRadius:16, padding:12, background:'#f8fafc', display:'grid', gap:6 }
const auditList: React.CSSProperties = { display:'grid', gap:10 }
const audit: React.CSSProperties = { display:'grid', gap:6, border:'1px solid #e2e8f0', borderRadius:16, padding:12, background:'#f8fafc' }