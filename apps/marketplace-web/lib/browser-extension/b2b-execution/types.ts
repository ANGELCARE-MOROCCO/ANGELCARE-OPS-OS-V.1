export type B2BExecutionCommandDefinition = {
  commandKey: string
  capabilityPermission: string
  requiredSubmodule: string
  adapterKeys?: string[]
  mutating: boolean
  acceptanceId: string
}

export type B2BExecutionStage =
  | 'new_target'
  | 'research'
  | 'qualified'
  | 'initial_contact'
  | 'discovery'
  | 'meeting_scheduled'
  | 'needs_confirmed'
  | 'solution_design'
  | 'proposal_preparation'
  | 'proposal_sent'
  | 'negotiation'
  | 'commercial_agreement'
  | 'contract_pending'
  | 'payment_pending'
  | 'activation_preparation'
  | 'won'
  | 'lost'
  | 'nurture'

export type StageFacts = {
  hasContact?: boolean
  hasDecisionMaker?: boolean
  hasNeed?: boolean
  hasMeeting?: boolean
  hasMeetingOutcome?: boolean
  hasScope?: boolean
  hasProposal?: boolean
  hasCommercialAgreement?: boolean
  hasContract?: boolean
  hasPayment?: boolean
  activationReady?: boolean
  reason?: string | null
}
