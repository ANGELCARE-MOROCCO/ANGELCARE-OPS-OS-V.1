export type MarketOSBigShotMode =
  | 'campaign-detail'
  | 'campaign-execution'
  | 'campaign-control-room'
  | 'content-create'
  | 'content-calendar'
  | 'content-approvals'
  | 'content-detail'
  | 'seo-performance'
  | 'seo-keywords'
  | 'seo-calendar'
  | 'seo-create'
  | 'seo-detail'
  | 'ambassador-programs'
  | 'ambassador-missions'
  | 'ambassador-payouts'
  | 'ambassador-detail'

export type MarketOSStatus = 'draft' | 'queued' | 'active' | 'review' | 'approved' | 'blocked' | 'completed'
export type MarketOSPriority = 'critical' | 'high' | 'medium' | 'low'

export type MarketOSExecutionItem = {
  id: string
  title: string
  owner: string
  status: MarketOSStatus
  priority: MarketOSPriority
  module: 'campaign' | 'content' | 'seo' | 'ambassador'
  due: string
  score: number
  impactMad: number
  nextAction: string
}

export type MarketOSScenario = {
  name: string
  trigger: string
  playbook: string[]
  risk: string
  approval: string
}

export const marketOSBigShotItems: MarketOSExecutionItem[] = [
  { id: 'cam-rabat-q2', title: 'Rabat authority campaign sprint', owner: 'Growth Lead', status: 'active', priority: 'critical', module: 'campaign', due: 'Today', score: 91, impactMad: 185000, nextAction: 'Approve final channel budget and unlock ambassador missions' },
  { id: 'cnt-family-proof', title: 'Family proof content pack', owner: 'Content Manager', status: 'review', priority: 'high', module: 'content', due: 'Tomorrow', score: 84, impactMad: 76000, nextAction: 'Legal tone review then schedule carousel + landing copy' },
  { id: 'seo-nurse-care', title: 'Nurse care Morocco SEO pillar', owner: 'SEO Officer', status: 'queued', priority: 'high', module: 'seo', due: 'Friday', score: 78, impactMad: 112000, nextAction: 'Lock keyword cluster and generate internal link map' },
  { id: 'amb-casa-micro', title: 'Casablanca micro ambassador wave', owner: 'Partnership Officer', status: 'active', priority: 'medium', module: 'ambassador', due: 'Next week', score: 73, impactMad: 52000, nextAction: 'Validate ambassador proof uploads and payout rules' },
]

export const marketOSBigShotScenarios: MarketOSScenario[] = [
  { name: 'Launch Campaign', trigger: 'Campaign has objective, channel, owner, budget and first content asset', playbook: ['Freeze brief', 'Assign launch owner', 'Generate content tasks', 'Open KPI tracker'], risk: 'Budget drift', approval: 'Marketing Manager' },
  { name: 'Pause Underperforming Campaign', trigger: 'CAC above target or conversion below threshold for 72h', playbook: ['Pause spend', 'Create diagnosis task', 'Move content to review', 'Notify revenue command'], risk: 'Lead loss', approval: 'Growth Lead' },
  { name: 'SEO Article Production', trigger: 'Keyword cluster approved with commercial intent', playbook: ['Create outline', 'Generate meta pack', 'Assign writer', 'Schedule editorial review'], risk: 'Thin content', approval: 'SEO Officer' },
  { name: 'Ambassador Activation', trigger: 'Ambassador has city, program, mission and reward rule', playbook: ['Assign mission', 'Open proof checklist', 'Track leads', 'Prepare payout review'], risk: 'Unverified attribution', approval: 'Partnership Officer' },
  { name: 'Content Compliance Review', trigger: 'Content mentions medical care, pricing, training, or employment promise', playbook: ['Run claim review', 'Check brand tone', 'Add approval gate', 'Log decision'], risk: 'Reputation exposure', approval: 'CEO / Manager' },
  { name: 'Scale Winning Asset', trigger: 'Asset conversion rate beats benchmark for 5 days', playbook: ['Clone asset', 'Create variants', 'Attach campaign', 'Schedule ambassador distribution'], risk: 'Creative fatigue', approval: 'Growth Lead' },
]

export function getModeMeta(mode: MarketOSBigShotMode) {
  const map: Record<MarketOSBigShotMode, { title: string; subtitle: string; module: string }> = {
    'campaign-detail': { title: 'Campaign Detail Command', subtitle: 'Edit, operate, approve and scale one campaign with linked content, SEO and ambassadors.', module: 'Campaign Life Cycle' },
    'campaign-execution': { title: 'Campaign Execution War Room', subtitle: 'Daily execution board for launch gates, owners, blockers and approvals.', module: 'Campaign Life Cycle' },
    'campaign-control-room': { title: 'Campaign Control Room', subtitle: 'Scenario control, budget pressure, channel readiness and governance.', module: 'Campaign Life Cycle' },
    'content-create': { title: 'Content Creation Factory', subtitle: 'Create structured content with campaign sync, approval gates and AI-ready briefs.', module: 'Content Command' },
    'content-calendar': { title: 'Content Calendar Control', subtitle: 'Plan production by campaign, channel, owner, deadline and publication window.', module: 'Content Command' },
    'content-approvals': { title: 'Content Approval Desk', subtitle: 'Approve, reject, escalate and protect brand governance before publication.', module: 'Content Command' },
    'content-detail': { title: 'Content Task Execution Detail', subtitle: 'Manage one content task from brief to review, publication and distribution.', module: 'Content Command' },
    'seo-performance': { title: 'SEO Performance Command', subtitle: 'Track rankings, traffic contribution, content decay and revenue influence.', module: 'SEO Blog' },
    'seo-keywords': { title: 'Keyword Intelligence Lab', subtitle: 'Build keyword clusters, intent maps, difficulty scoring and article briefs.', module: 'SEO Blog' },
    'seo-calendar': { title: 'SEO Editorial Calendar+', subtitle: 'Operational publishing calendar with review gates, article owners and campaign links.', module: 'SEO Blog' },
    'seo-create': { title: 'SEO Article Builder+', subtitle: 'Create SEO articles with metadata, scoring, internal links and approval state.', module: 'SEO Blog' },
    'seo-detail': { title: 'SEO Article Detail Command', subtitle: 'Edit one SEO asset, performance plan, metadata and distribution checklist.', module: 'SEO Blog' },
    'ambassador-programs': { title: 'Ambassador Program Designer', subtitle: 'Configure programs, missions, eligibility, regions, payout rules and proof controls.', module: 'Ambassadors' },
    'ambassador-missions': { title: 'Ambassador Mission Desk', subtitle: 'Assign, track, validate and close ambassador execution missions.', module: 'Ambassadors' },
    'ambassador-payouts': { title: 'Ambassador Payout Control', subtitle: 'Validate performance, attribution proof, commissions and payment approvals.', module: 'Ambassadors' },
    'ambassador-detail': { title: 'Ambassador Profile Command', subtitle: 'Operate one ambassador across missions, proof, reward, city and campaign impact.', module: 'Ambassadors' },
  }
  return map[mode]
}

export function simulateExecution(mode: MarketOSBigShotMode, action: string) {
  return {
    ok: true,
    mode,
    action,
    auditId: `mos-${mode}-${Date.now()}`,
    message: `Prepared ${action} for ${getModeMeta(mode).module}. Connect this bridge to Supabase/server actions for persistence.`,
  }
}
