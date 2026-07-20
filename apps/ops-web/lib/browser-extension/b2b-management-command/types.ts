export type B2BManagementCommandDefinition = {
  commandKey: string
  capabilityPermission: string
  requiredSubmodule: string
  mutating: boolean
  approvalSensitive?: boolean
  highRisk?: boolean
  acceptanceId: string
}

export type TruthClassification =
  | 'verified_fact'
  | 'evidence_backed_inference'
  | 'commercial_hypothesis'
  | 'missing_information'
  | 'user_reported_statement'
  | 'client_reported_statement'
  | 'ai_recommendation'
  | 'approved_management_decision'

export type ForecastCategory = 'committed' | 'probable' | 'possible' | 'at_risk' | 'unqualified' | 'stale'
