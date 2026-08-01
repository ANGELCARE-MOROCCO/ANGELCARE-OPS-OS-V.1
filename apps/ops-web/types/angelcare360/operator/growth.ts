export type GrowthMode =
  | 'command'
  | 'markets'
  | 'pipeline'
  | 'offers'
  | 'contracts'
  | 'portfolio'
  | 'health'
  | 'performance'

export type GrowthSourceState = 'complete' | 'partial' | 'unavailable'
export type GrowthCaseType = 'support_ticket' | 'complaint' | 'service_request' | 'incident' | 'product_problem' | 'billing_complaint' | 'relationship_complaint' | 'implementation_issue'

export interface GrowthProspectRecord {
  id: string
  prospect_code: string
  organization_name: string
  organization_type: string
  status: string
  qualification_stage: string
  source?: string | null
  city?: string | null
  region?: string | null
  country?: string | null
  potential_mrr_mad: number | string
  estimated_students?: number | string | null
  institution_count?: number | string | null
  current_solution?: string | null
  pain_points: string[]
  product_fit: Record<string, unknown>
  owner_id?: string | null
  next_action?: string | null
  next_action_at?: string | null
  converted_client_id?: string | null
  notes?: string | null
  archived_at?: string | null
  created_at: string
  updated_at: string
}

export interface GrowthContactRecord {
  id: string
  client_id?: string | null
  prospect_id?: string | null
  full_name: string
  email?: string | null
  phone?: string | null
  role_type: string
  job_title?: string | null
  institution_name?: string | null
  influence_level: string
  decision_authority: string
  relationship_strength: string
  position: string
  is_primary: boolean
  communication_preferences: Record<string, unknown>
  last_interaction_at?: string | null
  next_engagement_at?: string | null
  status: string
  notes?: string | null
  archived_at?: string | null
  created_at: string
  updated_at: string
}

export interface GrowthInstitutionRecord {
  id: string
  client_id?: string | null
  prospect_id?: string | null
  institution_code: string
  name: string
  institution_type: string
  status: string
  city?: string | null
  region?: string | null
  country?: string | null
  address?: string | null
  estimated_students?: number | string | null
  estimated_staff?: number | string | null
  tenant_id?: string | null
  primary_contact_id?: string | null
  onboarding_state?: string | null
  service_health?: string | null
  metadata: Record<string, unknown>
  notes?: string | null
  archived_at?: string | null
  created_at: string
  updated_at: string
}

export interface GrowthOpportunityRecord {
  id: string
  opportunity_code: string
  client_id?: string | null
  prospect_id?: string | null
  name: string
  objective?: string | null
  stage: string
  status: string
  owner_id?: string | null
  sponsor_id?: string | null
  expected_mrr_mad: number | string
  expected_arr_mad: number | string
  probability: number | string
  expected_close_date?: string | null
  package_version_id?: string | null
  product_configuration: Record<string, unknown>
  competition?: string | null
  risks: string[]
  next_event?: string | null
  next_event_at?: string | null
  loss_reason?: string | null
  won_at?: string | null
  lost_at?: string | null
  archived_at?: string | null
  created_at: string
  updated_at: string
}

export interface GrowthStakeholderRecord {
  id: string
  opportunity_id: string
  contact_id: string
  stakeholder_role: string
  influence_level: string
  decision_position: string
  engagement_state: string
  required_for_close: boolean
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface GrowthOfferRecord {
  id: string
  offer_code: string
  opportunity_id?: string | null
  client_id?: string | null
  prospect_id?: string | null
  name: string
  status: string
  package_version_id?: string | null
  configuration_snapshot: Record<string, unknown>
  price_book_id?: string | null
  monthly_price_mad: number | string
  annual_price_mad: number | string
  setup_fee_mad: number | string
  discount_mad: number | string
  contract_value_mad: number | string
  contract_duration_months: number | string
  payment_schedule?: string | null
  validity_date?: string | null
  approval_status: string
  value_case: Record<string, unknown>
  submitted_at?: string | null
  accepted_at?: string | null
  rejected_at?: string | null
  converted_contract_id?: string | null
  notes?: string | null
  archived_at?: string | null
  created_at: string
  updated_at: string
}

export interface GrowthOfferVersionRecord {
  id: string
  offer_id: string
  version_number: number | string
  status: string
  configuration_snapshot: Record<string, unknown>
  pricing_snapshot: Record<string, unknown>
  value_case_snapshot: Record<string, unknown>
  change_summary?: string | null
  created_by?: string | null
  created_at: string
}

export interface GrowthNegotiationRecord {
  id: string
  opportunity_id?: string | null
  offer_id?: string | null
  client_id?: string | null
  event_type: string
  occurred_at: string
  customer_position?: string | null
  angelcare_position?: string | null
  objection?: string | null
  requested_concession?: string | null
  approved_boundary?: string | null
  financial_impact_mad: number | string
  decision_due_at?: string | null
  next_meeting_at?: string | null
  outcome?: string | null
  notes?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
}

export interface GrowthInteractionRecord {
  id: string
  client_id?: string | null
  prospect_id?: string | null
  opportunity_id?: string | null
  contact_id?: string | null
  interaction_type: string
  subject: string
  summary?: string | null
  occurred_at: string
  outcome?: string | null
  next_action?: string | null
  next_action_at?: string | null
  created_by?: string | null
  created_at: string
}

export interface GrowthExpansionRecord {
  id: string
  client_id: string
  tenant_id?: string | null
  subscription_id?: string | null
  opportunity_type: string
  title: string
  status: string
  expected_mrr_mad: number | string
  evidence: Record<string, unknown>
  recommended_package_version_id?: string | null
  owner_id?: string | null
  next_action?: string | null
  next_action_at?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface GrowthInterventionRecord {
  id: string
  client_id: string
  intervention_type: string
  title: string
  status: string
  priority: string
  diagnosis?: string | null
  business_risk?: string | null
  financial_exposure_mad: number | string
  service_impact?: string | null
  owner_id?: string | null
  sponsor_id?: string | null
  action_plan: Array<Record<string, unknown>>
  due_date?: string | null
  expected_outcome?: string | null
  outcome_status?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface GrowthCustomerCaseRecord {
  id: string
  case_reference: string
  case_type: GrowthCaseType
  source_channel: string
  client_id: string
  institution_id?: string | null
  tenant_id?: string | null
  subscription_id?: string | null
  related_module_key?: string | null
  subject: string
  description?: string | null
  status: string
  severity: string
  priority: string
  business_impact?: string | null
  customer_sentiment?: string | null
  owner_id?: string | null
  team?: string | null
  sla_policy?: string | null
  due_at?: string | null
  escalated_at?: string | null
  root_cause?: string | null
  resolution_summary?: string | null
  customer_confirmation?: string | null
  outcome_status?: string | null
  source_ticket_id?: string | null
  source_incident_id?: string | null
  reopened_count: number | string
  archived_at?: string | null
  created_at: string
  updated_at: string
}

export interface GrowthCaseEventRecord {
  id: string
  case_id: string
  event_type: string
  summary: string
  visibility: string
  actor_id?: string | null
  occurred_at: string
  metadata: Record<string, unknown>
  created_at: string
}

export interface GrowthCommercialFindingRecord {
  id: string
  finding_type: string
  severity: string
  entity_type: string
  entity_id?: string | null
  client_id?: string | null
  title: string
  explanation: string
  evidence: Record<string, unknown>
  recommended_action?: string | null
  status: string
  detected_at: string
  resolved_at?: string | null
}


export interface GrowthAccountPlanRecord {
  id: string
  client_id: string
  title: string
  status: string
  horizon_months: number | string
  ambition_mad: number | string
  current_footprint: Record<string, unknown>
  potential_footprint: Record<string, unknown>
  strategic_priorities: string[]
  whitespace_opportunities: string[]
  competitive_position?: string | null
  stakeholder_strategy: Record<string, unknown>
  milestones: Array<Record<string, unknown>>
  owner_id?: string | null
  executive_sponsor_id?: string | null
  next_review_at?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface GrowthRelationshipCoverageRecord {
  id: string
  client_id: string
  status: string
  executive_sponsor_score: number | string
  economic_buyer_score: number | string
  contract_authority_score: number | string
  operational_champion_score: number | string
  relationship_recency_score: number | string
  single_contact_dependency: boolean
  missing_roles: string[]
  risk_signals: string[]
  evidence: Record<string, unknown>
  assessed_at: string
  assessed_by?: string | null
  created_at: string
  updated_at: string
}

export interface GrowthForecastRecord {
  id: string
  opportunity_id: string
  owner_id?: string | null
  period_key: string
  forecast_category: string
  seller_amount_mad: number | string
  manager_amount_mad: number | string
  confidence: number | string
  adjustment_reason?: string | null
  snapshot_at: string
  locked_at?: string | null
  created_at: string
  updated_at: string
}

export interface GrowthApprovalRecord {
  id: string
  client_id?: string | null
  opportunity_id?: string | null
  offer_id?: string | null
  approval_type: string
  status: string
  requested_value: Record<string, unknown>
  policy_limit: Record<string, unknown>
  financial_impact_mad: number | string
  required_authority: string
  approver_id?: string | null
  decision_reason?: string | null
  due_at?: string | null
  decided_at?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
}

export interface GrowthChangeOrderRecord {
  id: string
  client_id: string
  contract_id?: string | null
  subscription_id?: string | null
  change_order_code: string
  change_type: string
  status: string
  current_state: Record<string, unknown>
  proposed_state: Record<string, unknown>
  billing_effect: Record<string, unknown>
  entitlement_effect: Record<string, unknown>
  effective_at?: string | null
  approval_id?: string | null
  customer_communication_required: boolean
  reason?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
}

export interface GrowthSuccessPlanRecord {
  id: string
  client_id: string
  title: string
  status: string
  objective: string
  baseline_value?: string | null
  target_value?: string | null
  current_value?: string | null
  success_metrics: Array<Record<string, unknown>>
  product_capabilities: string[]
  milestones: Array<Record<string, unknown>>
  customer_owner?: string | null
  angelcare_owner_id?: string | null
  next_review_at?: string | null
  outcome_status?: string | null
  evidence: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface GrowthHealthModelRecord {
  id: string
  name: string
  status: string
  is_default: boolean
  dimensions: Array<Record<string, unknown>>
  thresholds: Record<string, unknown>
  refresh_cadence: string
  recovery_playbooks: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface GrowthSupportEntitlementRecord {
  id: string
  client_id: string
  contract_id?: string | null
  subscription_id?: string | null
  support_tier: string
  status: string
  covered_modules: string[]
  covered_institutions: string[]
  included_hours: number | string
  consumed_hours: number | string
  response_target_minutes: number | string
  resolution_target_minutes: number | string
  support_channels: string[]
  escalation_level: string
  business_calendar: Record<string, unknown>
  out_of_scope_policy: string
  effective_from?: string | null
  effective_to?: string | null
  created_at: string
  updated_at: string
}

export interface GrowthEscalationRecord {
  id: string
  client_id: string
  case_id?: string | null
  escalation_type: string
  status: string
  severity: string
  title: string
  revenue_exposure_mad: number | string
  relationship_exposure: string
  owner_id?: string | null
  executive_sponsor_id?: string | null
  command_team: string[]
  review_cadence: string
  exit_criteria: string[]
  next_checkpoint_at?: string | null
  resolved_at?: string | null
  created_at: string
  updated_at: string
}

export interface GrowthMetric {
  key: string
  label: string
  value: string
  detail: string
  tone?: 'neutral' | 'good' | 'warning' | 'critical'
}

export interface GrowthSourceReport {
  key: string
  label: string
  state: GrowthSourceState
  count: number
  message?: string | null
}

export interface GrowthProductOption {
  id: string
  type: 'package' | 'module' | 'addon' | 'meter'
  name: string
  status: string
  priceMad: number
  detail: string
}

export interface GrowthWorkspaceSnapshot {
  generatedAt: string
  sourceState: GrowthSourceState
  sources: GrowthSourceReport[]
  metrics: GrowthMetric[]
  clients: Array<Record<string, unknown>>
  prospects: GrowthProspectRecord[]
  contacts: GrowthContactRecord[]
  institutions: GrowthInstitutionRecord[]
  opportunities: GrowthOpportunityRecord[]
  stakeholders: GrowthStakeholderRecord[]
  offers: GrowthOfferRecord[]
  offerVersions: GrowthOfferVersionRecord[]
  negotiations: GrowthNegotiationRecord[]
  interactions: GrowthInteractionRecord[]
  expansion: GrowthExpansionRecord[]
  interventions: GrowthInterventionRecord[]
  cases: GrowthCustomerCaseRecord[]
  caseEvents: GrowthCaseEventRecord[]
  findings: GrowthCommercialFindingRecord[]
  accountPlans: GrowthAccountPlanRecord[]
  relationshipCoverage: GrowthRelationshipCoverageRecord[]
  forecasts: GrowthForecastRecord[]
  approvals: GrowthApprovalRecord[]
  changeOrders: GrowthChangeOrderRecord[]
  successPlans: GrowthSuccessPlanRecord[]
  healthModels: GrowthHealthModelRecord[]
  supportEntitlements: GrowthSupportEntitlementRecord[]
  escalations: GrowthEscalationRecord[]
  contracts: Array<Record<string, unknown>>
  renewals: Array<Record<string, unknown>>
  subscriptions: Array<Record<string, unknown>>
  plans: Array<Record<string, unknown>>
  tenants: Array<Record<string, unknown>>
  invoices: Array<Record<string, unknown>>
  payments: Array<Record<string, unknown>>
  tickets: Array<Record<string, unknown>>
  incidents: Array<Record<string, unknown>>
  onboarding: Array<Record<string, unknown>>
  products: GrowthProductOption[]
}
