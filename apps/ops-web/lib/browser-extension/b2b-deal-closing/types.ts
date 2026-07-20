export type B2BDealCommandDefinition = {
  commandKey:string
  capabilityPermission:string
  requiredSubmodule:string
  mutating:boolean
  acceptanceId:string
}
export type MarginStatus = 'healthy'|'review'|'approval_required'|'critical'|'blocked'
