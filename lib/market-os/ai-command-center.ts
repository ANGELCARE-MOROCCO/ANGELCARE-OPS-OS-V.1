export type CommandPriority = "P0" | "P1" | "P2" | "P3"
export type CommandImpact = "low" | "medium" | "high" | "critical"

export type AICommand = {
  id: string
  title: string
  priority: CommandPriority
  impact: CommandImpact
  source: string
  diagnosis: string
  command: string
  expectedImpact: string
  owner: string
  deadline: string
}

export const aiCommands: AICommand[] = [
  {
    id: "cmd-001",
    title: "FIX HIGH-INTENT LEAD LOSS",
    priority: "P0",
    impact: "critical",
    source: "Lead Intake + SLA",
    diagnosis: "High-intent leads are not contacted within SLA causing conversion loss.",
    command: "Activate escalation + assign senior agent + enforce 5-min response.",
    expectedImpact: "+15–25% conversion increase",
    owner: "Sales Manager",
    deadline: "Today",
  },
  {
    id: "cmd-002",
    title: "LAUNCH PREMIUM POSTPARTUM CAMPAIGN",
    priority: "P0",
    impact: "high",
    source: "Campaign Lifecycle",
    diagnosis: "Campaign ready but blocked by approval and compliance validation.",
    command: "Approve final version + deploy + monitor CAC within 24h.",
    expectedImpact: "+150k–300k MAD pipeline",
    owner: "CEO / Marketing Director",
    deadline: "Today",
  },
  {
    id: "cmd-003",
    title: "FIX ATTRIBUTION GAP",
    priority: "P1",
    impact: "high",
    source: "Data Pipeline",
    diagnosis: "WhatsApp and Meta attribution incomplete → weak ROI visibility.",
    command: "Force source capture + connect campaign ID to lead intake.",
    expectedImpact: "Accurate CAC + better scaling decisions",
    owner: "Tech / Marketing Ops",
    deadline: "48h",
  }
]
