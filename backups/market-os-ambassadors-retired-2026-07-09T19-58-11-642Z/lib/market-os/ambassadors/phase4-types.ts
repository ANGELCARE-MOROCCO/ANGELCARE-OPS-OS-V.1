export type AmbassadorOperationalStatus = "active" | "watch" | "paused" | "blocked" | string
export type AmbassadorRiskLevel = "low" | "medium" | "high" | "critical" | string
export type PayoutRiskStatus = "clear" | "review" | "blocked" | string

export type AmbassadorCampaignAssignment = Record<string, any>
export type AmbassadorComplianceEscalation = Record<string, any>
export type AmbassadorPayoutRisk = Record<string, any>
export type AmbassadorRegionalSignal = Record<string, any>
export type AmbassadorHealthRecord = Record<string, any>
export type AmbassadorPhase4Record = Record<string, any>
export type CampaignAssignment = Record<string, any>
export type CompliancePayoutRecord = Record<string, any>
export type RegionalExecutionRecord = Record<string, any>
export type Phase4WorkspaceSnapshot = Record<string, any>
