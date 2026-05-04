export type ExperimentStage = "hypothesis" | "designed" | "live" | "analysis" | "won" | "lost" | "iteration"
export type ExperimentRisk = "low" | "medium" | "high" | "critical"

export type GrowthExperiment = {
  id: string
  title: string
  linkedCampaign: string
  owner: string
  stage: ExperimentStage
  risk: ExperimentRisk
  hypothesis: string
  variantA: string
  variantB: string
  primaryKpi: string
  targetLift: number
  currentLift: number
  confidence: number
  sampleSize: number
  decision: string
  nextAction: string
}

export const experiments: GrowthExperiment[] = [
  {
    id: "exp-001",
    title: "Postpartum Trust-Proof CTA Test",
    linkedCampaign: "Premium Postpartum Reassurance Campaign",
    owner: "Marketing Director",
    stage: "live",
    risk: "medium",
    hypothesis: "A trust-proof CTA will convert better than a generic consultation CTA.",
    variantA: "Book a free consultation",
    variantB: "Speak with a trusted postpartum care advisor",
    primaryKpi: "WhatsApp qualified conversation rate",
    targetLift: 12,
    currentLift: 8,
    confidence: 71,
    sampleSize: 420,
    decision: "Continue until confidence reaches 85%.",
    nextAction: "Keep both variants live and monitor CAC movement.",
  },
  {
    id: "exp-002",
    title: "Academy Career Promise Test",
    linkedCampaign: "Academy Career Path Recruitment Push",
    owner: "Academy Marketing",
    stage: "designed",
    risk: "high",
    hypothesis: "Career pathway messaging will outperform generic training messaging.",
    variantA: "Join our caregiver training program",
    variantB: "Start your professional path in homecare",
    primaryKpi: "Qualified candidate form completion",
    targetLift: 20,
    currentLift: 0,
    confidence: 0,
    sampleSize: 0,
    decision: "Not launched yet.",
    nextAction: "Approve creative and launch controlled test.",
  },
  {
    id: "exp-003",
    title: "Clinic Partner Email Subject Test",
    linkedCampaign: "Clinic Partnership Authority Sprint",
    owner: "Partnership Lead",
    stage: "analysis",
    risk: "low",
    hypothesis: "Referral-benefit subject line will outperform generic collaboration subject line.",
    variantA: "Collaboration opportunity with AngelCare",
    variantB: "A referral pathway for your postpartum patients",
    primaryKpi: "Meeting booking rate",
    targetLift: 15,
    currentLift: 18,
    confidence: 87,
    sampleSize: 64,
    decision: "Variant B is winning and can be scaled.",
    nextAction: "Convert winning subject into clinic outreach playbook.",
  }
]

export function stageLabel(stage: ExperimentStage) {
  const map: Record<ExperimentStage, string> = {
    hypothesis: "Hypothesis",
    designed: "Designed",
    live: "Live",
    analysis: "Analysis",
    won: "Won",
    lost: "Lost",
    iteration: "Iteration",
  }
  return map[stage]
}
