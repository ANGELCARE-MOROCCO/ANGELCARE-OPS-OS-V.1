export type ContractPaymentStatus =
  | 'draft'
  | 'contract_ready'
  | 'signature_pending'
  | 'signed'
  | 'payment_promised'
  | 'payment_partial'
  | 'payment_confirmed'
  | 'release_blocked'
  | 'released_to_activation'

export type EnforcementRisk = 'low' | 'medium' | 'high' | 'critical'

export interface ContractPaymentCase {
  id: string
  deal_id: string
  client_name: string
  offer_name: string
  contract_status: ContractPaymentStatus
  payment_status: ContractPaymentStatus
  amount_due: number
  amount_paid: number
  promised_at?: string
  deadline_at?: string
  risk: EnforcementRisk
  owner: string
  next_action: string
}

export interface ContractReleaseGate {
  deal_id: string
  contract_signed: boolean
  payment_confirmed: boolean
  documents_verified: boolean
  manager_override: boolean
  release_allowed: boolean
}
