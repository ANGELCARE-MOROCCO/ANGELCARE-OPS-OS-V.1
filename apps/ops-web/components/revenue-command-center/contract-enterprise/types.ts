export type ContractExperienceKey =
  | "contract-command"
  | "contract-portfolio"
  | "contract-studio"
  | "activation-command"
  | "activation-dossier"
  | "system-activation"

export type ContractContextType = "prospect" | "partnership" | "system"

export type ContractRecord = {
  id: string
  reference?: string | null
  title: string
  status: string
  contract_type?: string | null
  context_type?: ContractContextType | string | null
  prospect_id?: string | null
  account_id?: string | null
  contact_id?: string | null
  opportunity_id?: string | null
  proposal_id?: string | null
  proposal_version_id?: string | null
  commercial_outcome_id?: string | null
  contract_handoff_id?: string | null
  partnership_id?: string | null
  entity_name?: string | null
  account_name?: string | null
  opportunity_title?: string | null
  owner?: string | null
  currency?: string | null
  contract_value?: number | null
  signed_value?: number | null
  realized_value?: number | null
  review_status?: string | null
  approval_status?: string | null
  signature_status?: string | null
  effectiveness_status?: string | null
  payment_gate_status?: string | null
  activation_status?: string | null
  realization_status?: string | null
  effective_date?: string | null
  expiry_date?: string | null
  renewal_notice_date?: string | null
  next_action?: string | null
  active_version_id?: string | null
  version?: number | null
  last_activity_at?: string | null
  metadata?: Record<string, any> | null
  created_at?: string | null
  updated_at?: string | null
}

export type ContractPortfolio = {
  contracts: ContractRecord[]
  handoffs: Array<Record<string, any>>
  proposals: Array<Record<string, any>>
  versions: Array<Record<string, any>>
  sections: Array<Record<string, any>>
  reviews: Array<Record<string, any>>
  approvals: Array<Record<string, any>>
  signatories: Array<Record<string, any>>
  signatureEvents: Array<Record<string, any>>
  signatureEvidence: Array<Record<string, any>>
  conditions: Array<Record<string, any>>
  conditionEvidence: Array<Record<string, any>>
  obligations: Array<Record<string, any>>
  obligationEvents: Array<Record<string, any>>
  milestones: Array<Record<string, any>>
  paymentTerms: Array<Record<string, any>>
  paymentSchedules: Array<Record<string, any>>
  paymentRequirements: Array<Record<string, any>>
  paymentPromises: Array<Record<string, any>>
  promiseEvents: Array<Record<string, any>>
  collectionActions: Array<Record<string, any>>
  financeHandoffs: Array<Record<string, any>>
  paymentConfirmations: Array<Record<string, any>>
  activationGates: Array<Record<string, any>>
  activationDecisions: Array<Record<string, any>>
  operationalHandoffs: Array<Record<string, any>>
  realizationEvents: Array<Record<string, any>>
  risks: Array<Record<string, any>>
  statusHistory: Array<Record<string, any>>
  closures: Array<Record<string, any>>
  communications: Array<Record<string, any>>
  tasks: Array<Record<string, any>>
  summary: {
    total: number
    preparation: number
    review: number
    approval: number
    signaturePending: number
    fullySigned: number
    conditionsPending: number
    paymentBlocked: number
    activationReady: number
    active: number
    atRisk: number
    expiring: number
    contractValueMad: number
    paymentPendingMad: number
    paymentConfirmedMad: number
    realizableMad: number
    realizedMad: number
    overdueObligations: number
    brokenPromises: number
  }
  schema: Record<string, boolean>
  currentUser?: { id?: string | null; email?: string | null; role?: string | null }
  syncedAt: string
}

export type ContractModalKind =
  | "create-contract"
  | "add-section"
  | "add-clause"
  | "commercial-term"
  | "add-obligation"
  | "add-milestone"
  | "create-version"
  | "compare-versions"
  | "request-review"
  | "review-decision"
  | "request-approval"
  | "approval-decision"
  | "add-signatory"
  | "signature-request"
  | "signature-evidence"
  | "signature-decline"
  | "signature-reminder"
  | "add-condition"
  | "verify-condition"
  | "payment-terms"
  | "payment-schedule"
  | "payment-requirement"
  | "payment-promise"
  | "promise-broken"
  | "collection-action"
  | "finance-handoff"
  | "finance-decision"
  | "payment-confirmation"
  | "payment-discrepancy"
  | "evaluate-effectiveness"
  | "evaluate-activation"
  | "activation-decision"
  | "activation-override"
  | "operational-handoff"
  | "handoff-acceptance"
  | "service-activation"
  | "suspend-activation"
  | "realization"
  | "reverse-realization"
  | "add-risk"
  | "resolve-risk"
  | "renewal-readiness"
  | "terminate-contract"
  | "close-contract"
  | "evidence-viewer"
  | "signature-history"
  | "payment-history"
  | "activation-audit"
  | "contract-audit"
