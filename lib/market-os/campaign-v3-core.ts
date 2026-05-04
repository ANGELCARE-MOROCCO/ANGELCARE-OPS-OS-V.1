import { fallbackCampaigns, fallbackTasks, calculateCampaignHealth, campaignActionPlaybook, type CampaignV2 } from '@/lib/market-os/campaign-v2'

export type CampaignWorkspaceKind = 'tasks' | 'budget' | 'approvals' | 'analytics' | 'automation' | 'calendar' | 'links' | 'new'

export const campaignV3Workspaces = {
  tasks: {
    title: 'Campaign Task Orchestration',
    eyebrow: 'Execution cockpit',
    description: 'Control owners, dependencies, proof requirements, workstreams, daily delivery rhythm and blocked work.',
    accent: 'from-indigo-950 via-slate-950 to-fuchsia-950',
    primaryAction: 'Create execution task',
  },
  budget: {
    title: 'Campaign Budget Control',
    eyebrow: 'Spend governance',
    description: 'Track budget burn, CPL, ROI, channel allocation, approval thresholds and finance-safe scaling decisions.',
    accent: 'from-emerald-950 via-slate-950 to-cyan-950',
    primaryAction: 'Register spend decision',
  },
  approvals: {
    title: 'Campaign Approval Center',
    eyebrow: 'Decision gates',
    description: 'Approve launches, creative assets, budget changes, scaling moves and risk exceptions with an auditable trail.',
    accent: 'from-amber-950 via-slate-950 to-rose-950',
    primaryAction: 'Request approval',
  },
  analytics: {
    title: 'Campaign Performance Intelligence',
    eyebrow: 'Growth command',
    description: 'Monitor ROI, CPL, conversion, readiness, risk, budget burn and next best actions per campaign.',
    accent: 'from-blue-950 via-slate-950 to-violet-950',
    primaryAction: 'Generate insight report',
  },
  automation: {
    title: 'Campaign Automation Rules',
    eyebrow: 'Autopilot guardrails',
    description: 'Configure safe rules for alerts, pauses, optimizations, owner escalation, calendar reminders and spend locks.',
    accent: 'from-purple-950 via-slate-950 to-sky-950',
    primaryAction: 'Create automation rule',
  },
  calendar: {
    title: 'Campaign Launch Calendar',
    eyebrow: 'Planning rhythm',
    description: 'Coordinate launch windows, content drops, partner activations, ambassador missions, review meetings and closure reports.',
    accent: 'from-rose-950 via-slate-950 to-orange-950',
    primaryAction: 'Schedule milestone',
  },
  links: {
    title: 'Cross-Module Campaign Sync',
    eyebrow: 'Market-OS nervous system',
    description: 'Connect campaigns to content, SEO, ambassadors, partners, Meta, WhatsApp, landing pages and revenue follow-up.',
    accent: 'from-cyan-950 via-slate-950 to-indigo-950',
    primaryAction: 'Create module link',
  },
  new: {
    title: 'New Campaign Factory',
    eyebrow: 'Scenario builder',
    description: 'Create a campaign from proven AngelCare playbooks with strategy, targeting, budget, channels and execution checklists.',
    accent: 'from-slate-950 via-slate-900 to-emerald-950',
    primaryAction: 'Build campaign draft',
  },
} as const

export const v3Campaigns: CampaignV2[] = fallbackCampaigns
export const v3Tasks = fallbackTasks

export const approvalQueue = [
  { id: 'ap-launch', campaign: 'Rabat Childcare Lead Capture', gate: 'Launch gate', owner: 'Marketing Manager', status: 'Ready for decision', risk: 'Low', sla: 'Today 16:00' },
  { id: 'ap-budget', campaign: 'Senior Care Trust Authority', gate: 'Budget exception', owner: 'Finance/Admin', status: 'Needs evidence', risk: 'High', sla: 'Tomorrow 11:00' },
  { id: 'ap-creative', campaign: 'Rabat Childcare Lead Capture', gate: 'Creative validation', owner: 'Brand Lead', status: 'In review', risk: 'Medium', sla: 'Today 18:00' },
]

export const automationRules = [
  { id: 'rule-risk', name: 'Risk score escalation', trigger: 'Risk score above 55', action: 'Notify manager and lock scale action', status: 'Active' },
  { id: 'rule-cpl', name: 'CPL guardrail', trigger: 'CPL above 120 MAD', action: 'Open optimization task', status: 'Active' },
  { id: 'rule-readiness', name: 'Launch readiness gate', trigger: 'Readiness below 80', action: 'Block launch approval', status: 'Draft' },
  { id: 'rule-proof', name: 'Proof required reminder', trigger: 'Proof task due within 24h', action: 'Notify owner', status: 'Active' },
]

export const calendarMilestones = [
  { date: '2026-05-06', title: 'Childcare content drop', type: 'Content', owner: 'Content Officer' },
  { date: '2026-05-07', title: 'Partner briefing window', type: 'Partners', owner: 'Partner Manager' },
  { date: '2026-05-08', title: 'Ambassador field missions', type: 'Ambassadors', owner: 'Ambassador Manager' },
  { date: '2026-05-10', title: 'Performance review and scale decision', type: 'Governance', owner: 'Marketing Lead' },
]

export const moduleLinks = [
  { module: 'Content Command Center', relation: 'Creative assets, copy, approval proofs', health: 88, status: 'Connected' },
  { module: 'SEO Blog Workspace', relation: 'Support articles, meta title, meta description', health: 76, status: 'Needs update' },
  { module: 'Ambassador Program', relation: 'Local missions and referral proof', health: 82, status: 'Connected' },
  { module: 'Partners Network', relation: 'Pharmacy and clinic lead sources', health: 61, status: 'Risk review' },
  { module: 'Revenue Command Center', relation: 'Lead handoff, conversion and ROI close-loop', health: 79, status: 'Connected' },
]

export function portfolioMetrics() {
  const campaigns = v3Campaigns
  const totalBudget = campaigns.reduce((s, c) => s + c.budget, 0)
  const totalSpent = campaigns.reduce((s, c) => s + c.spent, 0)
  const totalLeads = campaigns.reduce((s, c) => s + c.leads, 0)
  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0)
  const roi = totalSpent > 0 ? Math.round(((totalRevenue - totalSpent) / totalSpent) * 100) : 0
  const cpl = totalLeads > 0 ? Math.round(totalSpent / totalLeads) : 0
  const risk = Math.round(campaigns.reduce((s, c) => s + c.risk_score, 0) / Math.max(1, campaigns.length))
  return { totalBudget, totalSpent, totalLeads, totalRevenue, roi, cpl, risk }
}

export function campaignDecisionCards() {
  return v3Campaigns.map((campaign) => ({ campaign, health: calculateCampaignHealth(campaign), playbook: campaignActionPlaybook(campaign) }))
}
