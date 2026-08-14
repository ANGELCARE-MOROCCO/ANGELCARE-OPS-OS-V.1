export type RevenueAutonomyMode =
  | 'manual'
  | 'assisted'
  | 'controlled'
  | 'no_shift'
  | 'overflow'
  | 'campaign'
  | 'full'

export type ConversationAutomationMode =
  | 'manual'
  | 'assist'
  | 'selected_auto'
  | 'account_auto'
  | 'protected'

export type RevenueJourneyStage =
  | 'unknown'
  | 'aware'
  | 'curious'
  | 'engaged'
  | 'qualified'
  | 'solution_fit'
  | 'evaluating'
  | 'objection'
  | 'decision'
  | 'closing'
  | 'converted'
  | 'onboarding'
  | 'active_customer'
  | 'satisfaction'
  | 'expansion'
  | 'renewal'
  | 'recovery'
  | 'referral'

export type RevenueMaturityLevel = 'L0'|'L1'|'L2'|'L3'|'L4'|'L5'|'L6'

export type DoctrineNode = {
  id: string
  pack_id: string
  code: string
  title: string
  customer_type?: string | null
  service_line?: string | null
  journey_stage?: string | null
  intent_family?: string | null
  trigger_terms?: string[] | null
  trigger_regex?: string | null
  objective?: string | null
  tone_profile?: Record<string, unknown> | null
  emotional_strategy?: Record<string, unknown> | null
  commercial_intensity?: number | null
  action_type?: string | null
  response_guidance?: string | null
  response_variants?: string[] | null
  qualification_questions?: string[] | null
  objection_class?: string | null
  proof_options?: string[] | null
  next_actions?: Array<Record<string, unknown>> | null
  escalation_rules?: Record<string, unknown> | null
  exclusions?: Record<string, unknown> | null
  forbidden_claims?: string[] | null
  success_signals?: string[] | null
  failure_signals?: string[] | null
  cross_sell?: Record<string, unknown> | null
  follow_up_rules?: Record<string, unknown> | null
  priority: number
  maturity_weight: number
  status: string
}

export type DoctrinePack = {
  id: string
  code: string
  name: string
  description?: string | null
  service_line?: string | null
  customer_type?: string | null
  status: string
  maturity_level: RevenueMaturityLevel | string
  version: number
  source_kind: string
  applicability_score: number
  coverage_score: number
  commercial_priority: number
  default_goal?: string | null
  nodes?: DoctrineNode[]
}

export type ConversationRevenueState = {
  conversation_id: string
  mode: ConversationAutomationMode
  doctrine_pack_id?: string | null
  current_goal?: string | null
  journey_stage?: RevenueJourneyStage | string | null
  intent_family?: string | null
  relationship_temperature?: string | null
  momentum?: string | null
  emotional_signals?: Record<string, number | boolean | string> | null
  scores?: Record<string, number> | null
  opportunity?: Record<string, unknown> | null
  memory?: Record<string, unknown> | null
  maturity_level?: RevenueMaturityLevel | string | null
  last_decision_id?: string | null
  last_automation_at?: string | null
  takeover_reason?: string | null
  excluded?: boolean | null
}

export type RevenueContext = {
  conversation: any
  contact: any
  account: any
  messages: any[]
  latestInboundText: string
  customerType: string
  serviceLine: string
  source: string
  journeyStage: string
  intentFamily: string
  relationshipTemperature: string
  momentum: string
  emotionalSignals: Record<string, number>
  scores: Record<string, number>
  opportunity: Record<string, unknown>
  memory: Record<string, unknown>
}

export type RevenueDecision = {
  action: 'reply'|'suggest'|'wait'|'handoff'|'qualify'|'close'|'followup'|'protect'
  responseText?: string | null
  confidence: number
  commercialIntensity: number
  goal: string
  doctrineNodeIds: string[]
  packId?: string | null
  reasoning: Record<string, unknown>
  risk: Record<string, unknown>
  eligibility: 'green'|'blue'|'amber'|'red'
}

export type RevenueBootstrap = {
  settings: Array<Record<string, any>>
  packs: DoctrinePack[]
  imports: Array<Record<string, any>>
  maturity: Array<Record<string, any>>
  proposals: Array<Record<string, any>>
  simulations: Array<Record<string, any>>
  runtime: Array<Record<string, any>>
  states: Array<Record<string, any>>
  decisions: Array<Record<string, any>>
  campaigns: Array<Record<string, any>>
  counts: Record<string, number>
}
