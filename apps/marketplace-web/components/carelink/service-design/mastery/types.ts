export type MasteryDomain =
  | 'planning_request'
  | 'planning_plan'
  | 'commercial_request'
  | 'commercial_scenario'
  | 'offer'
  | 'bundle'
  | 'sellable'
  | 'handoff'
  | 'handoff_amendment'
  | 'customer_case'
  | 'incident'
  | 'quality_signal'
  | 'improvement'

export interface MasteryPayload {
  domain: MasteryDomain
  label: string
  record: Record<string, any>
  related: Record<string, any>
  editableFields: string[]
  deletableStatuses: string[]
}
