export type CampaignStage =
  | "brief"
  | "assets"
  | "approval"
  | "ready"
  | "live"
  | "optimization"
  | "post_mortem"

export type CampaignRisk = "low" | "medium" | "high" | "critical"
export type CampaignPriority = "normal" | "high" | "critical"
export type CampaignChannel = "Meta" | "Google" | "WhatsApp" | "SEO" | "Partnership" | "Ambassador" | "Multi-channel"
export type CampaignObjective = "Qualified leads" | "Bookings" | "Awareness" | "Recruitment" | "Partnership meetings" | "Referral growth"

export type CampaignTask = {
  id: string
  title: string
  owner: string
  due: string
  status: "todo" | "doing" | "blocked" | "done"
  department: "Strategy" | "Creative" | "Media" | "Sales" | "Compliance" | "Ambassadors" | "SEO"
  impact: string
}

export type CampaignAsset = {
  id: string
  name: string
  type: "Landing page" | "Ad creative" | "WhatsApp script" | "SEO article" | "Partner deck" | "Offer sheet" | "Proof asset"
  owner: string
  status: "missing" | "draft" | "review" | "approved"
}

export type CampaignMetric = {
  label: string
  value: number
  target: number
  suffix?: string
}

export type CampaignExperiment = {
  id: string
  name: string
  hypothesis: string
  variantA: string
  variantB: string
  decisionMetric: string
  status: "planned" | "running" | "winner" | "stopped"
}

export type ExecutiveCampaign = {
  id: string
  title: string
  strategy: string
  owner: string
  stage: CampaignStage
  risk: CampaignRisk
  priority: CampaignPriority
  objective: CampaignObjective
  audience: string
  persona: string
  offer: string
  serviceLine: string
  channel: CampaignChannel
  budgetMad: number
  spentMad: number
  launchDate: string
  endDate: string
  readiness: number
  confidence: number
  city: string
  funnelStage: string
  landingPath: string
  cta: string
  hook: string
  missingItems: string[]
  optimizationFocus: string
  expectedOutcome: string
  nextAction: string
  decisionNeeded: string
  complianceNote: string
  tasks: CampaignTask[]
  assets: CampaignAsset[]
  metrics: CampaignMetric[]
  experiments: CampaignExperiment[]
}

export const campaignStages: CampaignStage[] = ["brief", "assets", "approval", "ready", "live", "optimization", "post_mortem"]
export const campaignRisks: CampaignRisk[] = ["low", "medium", "high", "critical"]
export const campaignChannels: CampaignChannel[] = ["Meta", "Google", "WhatsApp", "SEO", "Partnership", "Ambassador", "Multi-channel"]

export const executiveCampaigns: ExecutiveCampaign[] = [
  {
    id: "camp-001",
    title: "Premium Postpartum Reassurance Campaign",
    strategy: "Postpartum Growth System",
    owner: "Marketing Director",
    stage: "approval",
    risk: "high",
    priority: "critical",
    objective: "Bookings",
    audience: "New mothers and families seeking trusted postnatal support",
    persona: "New mother who needs calm, trusted, supervised help at home after delivery",
    offer: "Premium 7-day postpartum homecare starter package",
    serviceLine: "Postpartum care",
    channel: "Multi-channel",
    budgetMad: 42000,
    spentMad: 0,
    launchDate: "2026-05-08",
    endDate: "2026-06-04",
    readiness: 72,
    confidence: 77,
    city: "Rabat / Témara / Salé",
    funnelStage: "Lead capture → WhatsApp qualification → Booking consultation",
    landingPath: "/services/postpartum-care",
    cta: "Request callback",
    hook: "Recover with calm, supervised support while AngelCare organizes reliable help at home.",
    missingItems: ["CEO offer approval", "final WhatsApp objection script", "landing page proof check"],
    optimizationFocus: "Reduce CAC and increase high-intent WhatsApp conversations",
    expectedOutcome: "Generate 260 qualified leads and 34 premium client opportunities",
    nextAction: "Approve final campaign promise and validate launch checklist.",
    decisionNeeded: "Approve price promise and campaign claim before launch.",
    complianceNote: "Avoid medical claims. Focus on support, organization, reliability and supervision.",
    tasks: [
      { id: "t1", title: "Approve campaign promise", owner: "CEO", due: "2026-05-07", status: "blocked", department: "Strategy", impact: "Launch cannot start without final promise approval." },
      { id: "t2", title: "Finish WhatsApp objection bank", owner: "Sales Lead", due: "2026-05-07", status: "doing", department: "Sales", impact: "Improves qualification and reduces weak conversations." },
      { id: "t3", title: "Validate caregiver proof assets", owner: "Brand Lead", due: "2026-05-07", status: "todo", department: "Creative", impact: "Increases trust and lowers lead anxiety." },
      { id: "t4", title: "Configure launch budget guardrail", owner: "Media Buyer", due: "2026-05-08", status: "todo", department: "Media", impact: "Prevents overspend before conversion signal is validated." },
    ],
    assets: [
      { id: "a1", name: "Postpartum offer landing page", type: "Landing page", owner: "Growth Ops", status: "review" },
      { id: "a2", name: "3 reassurance video creatives", type: "Ad creative", owner: "Creative Lead", status: "draft" },
      { id: "a3", name: "WhatsApp qualification flow", type: "WhatsApp script", owner: "Sales Lead", status: "review" },
      { id: "a4", name: "Family trust proof carousel", type: "Proof asset", owner: "Brand Lead", status: "missing" },
    ],
    metrics: [
      { label: "Qualified leads", value: 0, target: 260 },
      { label: "Bookings", value: 0, target: 34 },
      { label: "CPL", value: 0, target: 162, suffix: " MAD" },
      { label: "WhatsApp conversion", value: 0, target: 18, suffix: "%" },
    ],
    experiments: [
      { id: "e1", name: "Trust-first vs urgency-first hook", hypothesis: "Trust-first creative will convert better for postpartum buyers.", variantA: "Trusted support at home", variantB: "Support when recovery cannot wait", decisionMetric: "Qualified WhatsApp conversion", status: "planned" },
      { id: "e2", name: "Callback CTA vs WhatsApp CTA", hypothesis: "Callback CTA produces higher intent for premium offer.", variantA: "Request callback", variantB: "Send WhatsApp message", decisionMetric: "Booking rate", status: "planned" },
    ],
  },
  {
    id: "camp-002",
    title: "Clinic Partnership Authority Sprint",
    strategy: "B2B Clinic Partnership Pipeline",
    owner: "Partnership Lead",
    stage: "assets",
    risk: "medium",
    priority: "high",
    objective: "Partnership meetings",
    audience: "Maternity clinics, gynecologists and clinic administrators",
    persona: "Clinic decision maker who wants reliable referral options without operational headaches",
    offer: "Referral partnership and priority homecare access program",
    serviceLine: "Clinic partnerships",
    channel: "Partnership",
    budgetMad: 18000,
    spentMad: 3000,
    launchDate: "2026-05-13",
    endDate: "2026-06-13",
    readiness: 48,
    confidence: 61,
    city: "Rabat / Salé",
    funnelStage: "Partner targeting → deck → meeting → referral agreement",
    landingPath: "/partners/clinic-referral",
    cta: "Book partner meeting",
    hook: "Give your patients a trusted homecare follow-up path after clinic discharge.",
    missingItems: ["partner prospectus", "clinic segmentation grid", "outreach follow-up calendar"],
    optimizationFocus: "Increase partner reply rate and meeting conversion",
    expectedOutcome: "Secure 8 partner meetings and 2 signed referral agreements",
    nextAction: "Finalize partner prospectus and outreach sequencing.",
    decisionNeeded: "Confirm partner incentive and referral governance.",
    complianceNote: "Keep partner communication transparent and avoid clinical superiority claims.",
    tasks: [
      { id: "t5", title: "Build clinic segmentation grid", owner: "Partnership Lead", due: "2026-05-09", status: "doing", department: "Strategy", impact: "Prioritizes outreach by potential referral volume." },
      { id: "t6", title: "Finalize partner prospectus", owner: "Brand Lead", due: "2026-05-10", status: "todo", department: "Creative", impact: "Gives clinic directors a clear reason to meet." },
      { id: "t7", title: "Create follow-up calendar", owner: "Growth Ops", due: "2026-05-11", status: "todo", department: "Sales", impact: "Protects reply rate and meeting conversion." },
    ],
    assets: [
      { id: "a5", name: "Clinic partner prospectus", type: "Partner deck", owner: "Brand Lead", status: "draft" },
      { id: "a6", name: "Referral terms sheet", type: "Offer sheet", owner: "Partnership Lead", status: "missing" },
      { id: "a7", name: "Partner landing path", type: "Landing page", owner: "Growth Ops", status: "draft" },
    ],
    metrics: [
      { label: "Clinics contacted", value: 0, target: 42 },
      { label: "Meetings booked", value: 0, target: 8 },
      { label: "Agreements", value: 0, target: 2 },
      { label: "Reply rate", value: 0, target: 22, suffix: "%" },
    ],
    experiments: [
      { id: "e3", name: "Authority deck vs operational deck", hypothesis: "Operational reliability proof will drive more meetings than brand authority only.", variantA: "Authority proof", variantB: "Operational reliability proof", decisionMetric: "Meeting booking rate", status: "planned" },
    ],
  },
  {
    id: "camp-003",
    title: "Academy Career Path Recruitment Push",
    strategy: "Caregiver Supply Brand Authority",
    owner: "Academy Marketing",
    stage: "brief",
    risk: "medium",
    priority: "normal",
    objective: "Recruitment",
    audience: "Young candidates in Rabat, Temara and Salé seeking professional training",
    persona: "Candidate who wants a serious training-to-career pathway with dignity and structure",
    offer: "Training-to-career pathway with certification and job access",
    serviceLine: "Academy recruitment",
    channel: "Ambassador",
    budgetMad: 16000,
    spentMad: 0,
    launchDate: "2026-05-18",
    endDate: "2026-06-18",
    readiness: 25,
    confidence: 44,
    city: "Rabat / Témara / Salé",
    funnelStage: "Awareness → application → qualification → academy intake",
    landingPath: "/academy/apply",
    cta: "Apply for training",
    hook: "Build a professional care career with training, certification and access to real opportunities.",
    missingItems: ["campaign brief", "creative direction", "candidate FAQ", "lead qualification form"],
    optimizationFocus: "Improve candidate quality and reduce weak applications",
    expectedOutcome: "Generate 180 qualified Academy candidate leads",
    nextAction: "Build full campaign brief and candidate qualification criteria.",
    decisionNeeded: "Approve intake criteria and disqualification rules.",
    complianceNote: "Do not promise employment. Explain training, evaluation and opportunity access clearly.",
    tasks: [
      { id: "t8", title: "Define candidate qualification criteria", owner: "Academy Lead", due: "2026-05-10", status: "todo", department: "Strategy", impact: "Prevents weak applications from entering the funnel." },
      { id: "t9", title: "Draft candidate FAQ", owner: "Content Lead", due: "2026-05-11", status: "todo", department: "Creative", impact: "Reduces repetitive questions and improves applicant confidence." },
      { id: "t10", title: "Recruit ambassador referral group", owner: "Ambassador Manager", due: "2026-05-12", status: "todo", department: "Ambassadors", impact: "Activates local community acquisition." },
    ],
    assets: [
      { id: "a8", name: "Candidate FAQ", type: "Proof asset", owner: "Content Lead", status: "missing" },
      { id: "a9", name: "Application qualification form", type: "Landing page", owner: "Growth Ops", status: "missing" },
      { id: "a10", name: "Ambassador recruitment script", type: "WhatsApp script", owner: "Ambassador Manager", status: "draft" },
    ],
    metrics: [
      { label: "Applications", value: 0, target: 180 },
      { label: "Qualified candidates", value: 0, target: 70 },
      { label: "Intake confirmations", value: 0, target: 28 },
      { label: "Qualification rate", value: 0, target: 39, suffix: "%" },
    ],
    experiments: [
      { id: "e4", name: "Career pride vs income pathway", hypothesis: "Career pride message will attract better qualified candidates.", variantA: "Professional care career", variantB: "Training that opens income", decisionMetric: "Qualified application rate", status: "planned" },
    ],
  },
]

export function stageLabel(stage: CampaignStage) {
  const map: Record<CampaignStage, string> = {
    brief: "Brief",
    assets: "Assets",
    approval: "Approval",
    ready: "Ready",
    live: "Live",
    optimization: "Optimization",
    post_mortem: "Post-Mortem",
  }
  return map[stage]
}

export function formatMad(value: number) {
  return new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(value)
}

export function campaignReadinessWarnings(campaign: ExecutiveCampaign) {
  const warnings = [...campaign.missingItems]
  if (campaign.readiness < 50) warnings.push("Readiness below launch threshold")
  if (campaign.risk === "critical" || campaign.risk === "high") warnings.push("Executive risk review required")
  if (!campaign.landingPath) warnings.push("No landing or conversion path")
  if (campaign.assets.some((asset) => asset.status === "missing")) warnings.push("Missing required assets")
  return Array.from(new Set(warnings))
}

export function calculateBudgetBurn(campaign: ExecutiveCampaign) {
  return campaign.budgetMad <= 0 ? 0 : Math.round((campaign.spentMad / campaign.budgetMad) * 100)
}

export function calculateTaskCompletion(campaign: ExecutiveCampaign) {
  if (!campaign.tasks.length) return 0
  return Math.round((campaign.tasks.filter((task) => task.status === "done").length / campaign.tasks.length) * 100)
}

export function campaignExecutiveScore(campaign: ExecutiveCampaign) {
  const budgetHealth = 100 - Math.min(100, calculateBudgetBurn(campaign))
  const taskHealth = calculateTaskCompletion(campaign)
  const riskPenalty = campaign.risk === "critical" ? 35 : campaign.risk === "high" ? 22 : campaign.risk === "medium" ? 10 : 0
  return Math.max(0, Math.round((campaign.readiness * 0.38) + (campaign.confidence * 0.24) + (budgetHealth * 0.16) + (taskHealth * 0.22) - riskPenalty))
}
