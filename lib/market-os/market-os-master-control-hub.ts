export type HubRisk = "low" | "medium" | "high" | "critical"
export type HubStatus = "ready" | "active" | "watch" | "blocked"

export type MarketOsEngine = {
  id: string
  title: string
  route: string
  status: HubStatus
  risk: HubRisk
  layer: string
  purpose: string
  nextAction: string
  owner: string
}

export const marketOsEngines: MarketOsEngine[] = [
  {
    id: "engine-001",
    title: "Strategy Growth Control Room",
    route: "/market-os/strategy-growth-control-room",
    status: "active",
    risk: "medium",
    layer: "Strategy",
    purpose: "Controls strategic objectives, pillars, owners, KPIs and growth roadmap.",
    nextAction: "Validate active strategic priorities and link them to execution tasks.",
    owner: "Marketing Director",
  },
  {
    id: "engine-002",
    title: "Strategy Execution Engine",
    route: "/market-os/strategy-execution-engine",
    status: "active",
    risk: "medium",
    layer: "Execution",
    purpose: "Turns strategy into tasks, owners, deadlines, blockers and proof requirements.",
    nextAction: "Clear blocked P0 tasks and submit pending work for review.",
    owner: "Marketing Team",
  },
  {
    id: "engine-003",
    title: "Approval, SLA & Escalation Engine",
    route: "/market-os/approval-sla-escalation",
    status: "watch",
    risk: "high",
    layer: "Control",
    purpose: "Controls approval, SLA, delay detection, proof validation and escalation.",
    nextAction: "Resolve CEO-level approval bottlenecks before launch delays occur.",
    owner: "CEO / Manager",
  },
  {
    id: "engine-004",
    title: "KPI, ROI & Financial Impact Engine",
    route: "/market-os/kpi-roi-impact",
    status: "active",
    risk: "medium",
    layer: "Finance",
    purpose: "Connects marketing work to CAC, conversion, budget, revenue and ROI.",
    nextAction: "Correct campaigns with CAC above target and conversion below target.",
    owner: "Marketing Director",
  },
  {
    id: "engine-005",
    title: "Risk, Signals & AI Recommendation Engine",
    route: "/market-os/risk-signals-ai",
    status: "active",
    risk: "high",
    layer: "Anticipation",
    purpose: "Detects weak signals, classifies risks and recommends corrective actions.",
    nextAction: "Convert high-risk signals into corrective execution tasks.",
    owner: "AI Director",
  },
  {
    id: "engine-006",
    title: "Campaign Lifecycle Operating Engine",
    route: "/market-os/campaign-lifecycle",
    status: "watch",
    risk: "medium",
    layer: "Campaigns",
    purpose: "Manages briefs, audience, offer, assets, budget, launch and optimization.",
    nextAction: "Raise campaign readiness before approving active launches.",
    owner: "Campaign Owner",
  },
  {
    id: "engine-007",
    title: "Content Production & Brand Governance",
    route: "/market-os/content-brand-governance",
    status: "watch",
    risk: "high",
    layer: "Brand",
    purpose: "Controls content production, brand review, compliance and publishing readiness.",
    nextAction: "Resolve missing brand/compliance items before publishing.",
    owner: "Content & Branding",
  },
  {
    id: "engine-008",
    title: "Market Research & Competitive Intelligence",
    route: "/market-os/research-competitive-intelligence",
    status: "active",
    risk: "medium",
    layer: "Research",
    purpose: "Tracks competitors, customer pains, pricing, city opportunities and service gaps.",
    nextAction: "Convert validated market signals into strategy tasks.",
    owner: "Research Desk",
  },
  {
    id: "engine-009",
    title: "Offer Engineering & Pricing Control",
    route: "/market-os/offer-pricing-control",
    status: "active",
    risk: "medium",
    layer: "Offers",
    purpose: "Controls offer design, pricing, margins, approval and revenue potential.",
    nextAction: "Approve margin guardrails and discount rules.",
    owner: "Marketing Director",
  },
  {
    id: "engine-010",
    title: "Sales Enablement & Scripts",
    route: "/market-os/sales-enablement-scripts",
    status: "active",
    risk: "medium",
    layer: "Conversion",
    purpose: "Controls scripts, objections, agent usage, conversion feedback and improvements.",
    nextAction: "Improve weak objection coverage for high-value offers.",
    owner: "Sales Enablement",
  },
  {
    id: "engine-011",
    title: "Partnership, Ambassador & Referral Growth",
    route: "/market-os/partnership-referral-growth",
    status: "active",
    risk: "low",
    layer: "External Growth",
    purpose: "Controls clinics, ambassadors, corporate partners, referrals and revenue impact.",
    nextAction: "Activate high-trust partner pipeline with clear follow-up ownership.",
    owner: "Partnership Lead",
  },
  {
    id: "engine-012",
    title: "SEO, Authority & Organic Growth",
    route: "/market-os/seo-authority-growth",
    status: "watch",
    risk: "medium",
    layer: "Organic",
    purpose: "Controls keyword clusters, authority pages, ranking signals and organic leads.",
    nextAction: "Produce missing authority pages and connect internal links.",
    owner: "SEO / Content",
  },
  {
    id: "engine-013",
    title: "PR, Reputation & Authority Pipeline",
    route: "/market-os/pr-reputation-authority",
    status: "active",
    risk: "medium",
    layer: "Reputation",
    purpose: "Controls PR targets, pitches, outreach, publications and trust impact.",
    nextAction: "Finalize expert-safe pitch angles and begin outreach follow-up.",
    owner: "PR Owner",
  },
  {
    id: "engine-014",
    title: "Marketing Workforce & Capacity Command",
    route: "/market-os/workforce-capacity-command",
    status: "watch",
    risk: "high",
    layer: "Team",
    purpose: "Controls workload, skill fit, overload risk, productivity and redistribution.",
    nextAction: "Redistribute overloaded content tasks and protect strategic production.",
    owner: "Manager",
  },
  {
    id: "engine-015",
    title: "CEO / Investor Marketing Command Center",
    route: "/market-os/investor-command-center",
    status: "active",
    risk: "medium",
    layer: "Executive",
    purpose: "Consolidates KPIs, risks, decisions, financial impact and investor readiness.",
    nextAction: "Approve pending executive decisions and generate investor-ready view.",
    owner: "CEO",
  },
  {
    id: "engine-016",
    title: "Audit, Playbook & Learning Memory",
    route: "/market-os/audit-playbook-memory",
    status: "ready",
    risk: "low",
    layer: "Memory",
    purpose: "Transforms decisions, mistakes and wins into reusable playbooks.",
    nextAction: "Convert validated lessons into mandatory operating rules.",
    owner: "Operations / Marketing",
  }
]

export function statusLabel(status: HubStatus) {
  const map: Record<HubStatus, string> = {
    ready: "Ready",
    active: "Active",
    watch: "Watch",
    blocked: "Blocked",
  }
  return map[status]
}
