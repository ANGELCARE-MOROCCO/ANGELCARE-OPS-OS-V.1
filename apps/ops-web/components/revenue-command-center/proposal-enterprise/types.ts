export type ProposalExperienceKey =
  | "proposal-command"
  | "proposal-dossier"
  | "negotiation-command"
  | "negotiation-room"
  | "partnership-proposals"
  | "partnership-proposal-dossier"
  | "b2c-quotes"
  | "b2c-quote-dossier"

export type ProposalContextType = "prospect" | "partnership" | "b2c"

export type ProposalRecord = {
  id: string
  reference?: string | null
  title: string
  status: string
  proposal_type?: string | null
  context_type?: ProposalContextType | string | null
  prospect_id?: string | null
  account_id?: string | null
  contact_id?: string | null
  opportunity_id?: string | null
  partnership_id?: string | null
  b2c_case_id?: string | null
  entity_name?: string | null
  account_name?: string | null
  opportunity_title?: string | null
  primary_contact_name?: string | null
  owner?: string | null
  currency?: string | null
  gross_value?: number | null
  discount_value?: number | null
  discount_percent?: number | null
  net_value?: number | null
  estimated_cost?: number | null
  gross_margin?: number | null
  margin_percent?: number | null
  minimum_margin_percent?: number | null
  approval_status?: string | null
  recipient_status?: string | null
  negotiation_status?: string | null
  validity_until?: string | null
  accepted_at?: string | null
  rejected_at?: string | null
  last_activity_at?: string | null
  next_action?: string | null
  version?: number | null
  active_version_id?: string | null
  metadata?: Record<string, any> | null
  created_at?: string | null
  updated_at?: string | null
}

export type ProposalPortfolio = {
  proposals: ProposalRecord[]
  opportunities: Array<Record<string, any>>
  versions: Array<Record<string, any>>
  sections: Array<Record<string, any>>
  lineItems: Array<Record<string, any>>
  pricingScenarios: Array<Record<string, any>>
  approvals: Array<Record<string, any>>
  discountRequests: Array<Record<string, any>>
  marginExceptions: Array<Record<string, any>>
  recipients: Array<Record<string, any>>
  transmissions: Array<Record<string, any>>
  deliveryEvents: Array<Record<string, any>>
  responses: Array<Record<string, any>>
  negotiations: Array<Record<string, any>>
  rounds: Array<Record<string, any>>
  positions: Array<Record<string, any>>
  objections: Array<Record<string, any>>
  counteroffers: Array<Record<string, any>>
  concessions: Array<Record<string, any>>
  decisions: Array<Record<string, any>>
  statusHistory: Array<Record<string, any>>
  contractHandoffs: Array<Record<string, any>>
  communications: Array<Record<string, any>>
  tasks: Array<Record<string, any>>
  summary: {
    total: number
    draft: number
    approvalRequired: number
    approved: number
    readyToSend: number
    sent: number
    customerReview: number
    negotiation: number
    accepted: number
    rejected: number
    expiring: number
    valueMad: number
    weightedValueMad: number
    valueAtRiskMad: number
    averageMarginPercent: number
    discountExposureMad: number
    pendingConcessions: number
    openObjections: number
    stalledNegotiations: number
    contractReady: number
  }
  schema: Record<string, boolean>
  currentUser?: { id?: string | null; email?: string | null; role?: string | null }
  syncedAt: string
}

export type ProposalModalKind =
  | "create-proposal"
  | "select-opportunity"
  | "add-line"
  | "edit-line"
  | "optional-line"
  | "add-term"
  | "pricing-scenario"
  | "discount"
  | "pricing-approval"
  | "margin-exception"
  | "approve-proposal"
  | "reject-proposal"
  | "return-correction"
  | "version"
  | "compare-versions"
  | "generate-preview"
  | "generate-document"
  | "transmission"
  | "send-proposal"
  | "response"
  | "revision-request"
  | "open-negotiation"
  | "objection"
  | "resolve-objection"
  | "counteroffer"
  | "concession"
  | "approve-concession"
  | "reject-concession"
  | "negotiation-position"
  | "decision"
  | "accept-negotiated"
  | "reject-outcome"
  | "withdraw-proposal"
  | "extend-validity"
  | "supersede-proposal"
  | "evidence-viewer"
  | "approval-history"
  | "commercial-audit"
