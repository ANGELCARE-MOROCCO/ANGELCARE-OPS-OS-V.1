
export type ActivationDeal = {
  client: string
  service: string
  amount: string
  start: string
  status: 'Ready' | 'Review' | 'Blocked'
  blocker: string
  nextAction: string
}

export const activationDeals: ActivationDeal[] = [
  { client: 'Famille Benali', service: 'Nurse care - 30 days', amount: '18,000 MAD', start: 'Tomorrow 10:00', status: 'Review', blocker: 'Urgent start + caregiver profile promise', nextAction: 'Manager validates scope then ops receives handoff' },
  { client: 'Clinique partner lead', service: 'Post-surgery home care', amount: '24,500 MAD', start: 'Monday 09:00', status: 'Ready', blocker: 'None', nextAction: 'Assign ops owner and confirm first visit' },
  { client: 'Parent care case', service: 'Night assistance', amount: '9,800 MAD', start: 'Tonight', status: 'Blocked', blocker: 'Payment proof missing', nextAction: 'Collect proof or approve exception before activation' },
]

export const readinessMatrix = [
  { area: 'Payment', ready: 'Proof verified', warning: 'Promise only', blocked: 'No proof / unclear payer' },
  { area: 'Scope', ready: 'Need, schedule and service locked', warning: 'Some preferences unclear', blocked: 'Client expectation undefined' },
  { area: 'Ops feasibility', ready: 'Zone and timing realistic', warning: 'Urgent but possible', blocked: 'Impossible profile or timing' },
  { area: 'Documents', ready: 'Contract or written confirmation done', warning: 'Waiting signature', blocked: 'No written confirmation' },
  { area: 'Risk', ready: 'No special promise', warning: 'Custom condition', blocked: 'Overpromise or manager exception needed' },
]

export const wonDealAuditRules = [
  'No won deal can move to fulfillment without a locked client promise.',
  'Every discount must show reason, approver, margin risk and payment deadline.',
  'Every urgent start must include operational feasibility confirmation.',
  'Every caregiver profile promise must be written as preference, not guarantee, unless manager-approved.',
  'Every payment promise must have owner, due time, proof status and recovery action.',
]
