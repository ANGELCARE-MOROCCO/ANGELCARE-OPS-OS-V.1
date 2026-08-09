export type ProspectEnterpriseMode =
  | "acquisition"
  | "directory"
  | "executive"
  | "pipeline"
  | "qualification"
  | "decision-map"
  | "appointments"
  | "proposals"
  | "negotiation"
  | "recovery"
  | "analytics"
  | "performance"
  | "high-value"
  | "risk"
  | "new"

export type ProspectEnterpriseRow = {
  prospect_id: string
  prospect_name: string
  company?: string | null
  city?: string | null
  prospect_stage?: string | null
  priority?: string | null
  score?: number | null
  prospect_value_mad?: number | null
  prospect_probability?: number | null
  owner?: string | null
  contact_name?: string | null
  email?: string | null
  phone?: string | null
  next_action_at?: string | null
  last_activity_at?: string | null
  prospect_status?: string | null
  account_id?: string | null
  account_name?: string | null
  legal_name?: string | null
  account_type?: string | null
  account_segment?: string | null
  lifecycle_stage?: string | null
  industry?: string | null
  website?: string | null
  domain?: string | null
  account_status?: string | null
  contact_id?: string | null
  primary_contact_name?: string | null
  primary_contact_role?: string | null
  primary_contact_decision_role?: string | null
  primary_contact_influence?: string | null
  opportunity_count?: number | null
  open_opportunity_value_mad?: number | null
  weighted_pipeline_mad?: number | null
  open_task_count?: number | null
  overdue_task_count?: number | null
  upcoming_meeting_count?: number | null
  open_risk_count?: number | null
  decision_member_count?: number | null
  updated_at?: string | null
  [key: string]: unknown
}

export type ProspectEnterpriseSummary = {
  prospectCount: number
  accountCount: number
  opportunityCount: number
  openOpportunityCount: number
  pipelineValueMad: number
  weightedPipelineMad: number
  wonValueMad: number
  overdueTaskCount: number
  openRiskCount: number
  decisionMemberCount: number
  qualifiedCount: number
  highValueThresholdMad: number
  stages: Record<string, number>
}

export type ProspectEnterprisePayload = {
  view: string
  summary: ProspectEnterpriseSummary
  prospects: ProspectEnterpriseRow[]
  accounts: any[]
  opportunities: any[]
  qualifications: any[]
  risks: any[]
  decisionMapMembers: any[]
  schema: Record<string, boolean>
  generatedAt: string
  source: string
}

export type ProspectDossierPayload = {
  dossier: {
    prospect: any
    account: any | null
    primaryContact: any | null
    contacts: any[]
    opportunities: any[]
    tasks: any[]
    appointments: any[]
    activities: any[]
    decisionMap: any[]
    qualifications: any[]
    accountRisks: any[]
    accountPlans: any[]
    opportunityStageHistory: any[]
    opportunityParticipants: any[]
    opportunityRisks: any[]
    competitors: any[]
  }
  schema: Record<string, boolean>
  source: string
  generatedAt: string
}
