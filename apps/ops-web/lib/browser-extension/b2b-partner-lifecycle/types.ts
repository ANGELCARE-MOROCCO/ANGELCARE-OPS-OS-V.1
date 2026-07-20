export type B2BPartnerCommandDefinition = {
  commandKey: string
  capabilityPermission: string
  requiredSubmodule: string
  mutating: boolean
  approvalSensitive?: boolean
  acceptanceId: string
}

export type PartnerHealthLevel = 'healthy' | 'watch' | 'at_risk' | 'critical' | 'unknown'
