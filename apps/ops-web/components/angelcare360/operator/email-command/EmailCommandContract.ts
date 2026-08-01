import type { EmailCommandMode } from '@/types/angelcare360/operator/email-command'

export const EMAIL_COMMAND_MODES: Array<{ key: EmailCommandMode; label: string; signal: string }> = [
  { key: 'command', label: 'Command Center', signal: 'Flux, décisions & urgence' },
  { key: 'automation', label: 'Automation Studio', signal: 'Règles, événements & parcours' },
  { key: 'outbound', label: 'Outbound Operations', signal: 'Queue, approbations & livraison' },
  { key: 'inbound', label: 'Inbound Intelligence', signal: 'Matching, triage & attribution' },
  { key: 'conversations', label: 'Customer Conversations', signal: 'Threads, engagements & réponse' },
  { key: 'templates', label: 'Templates & Journeys', signal: 'Contenu, variables & versions' },
  { key: 'approvals', label: 'Approvals & Governance', signal: 'Autorité, risque & conformité' },
  { key: 'deliverability', label: 'Deliverability & Audit', signal: 'Bridge, SMTP, POP3 & preuve' },
]

export const EMAIL_EVENT_CATALOGUE = [
  'tenant.admin.invited', 'tenant.admin.activation_pending', 'tenant.admin.activated', 'tenant.admin.invitation_expiring',
  'invoice.issued', 'invoice.due_soon', 'invoice.overdue', 'payment.received', 'payment.promise_due',
  'ticket.created', 'ticket.assigned', 'ticket.sla_at_risk', 'ticket.resolution_proposed', 'complaint.registered', 'complaint.escalated',
  'offer.submitted', 'offer.expiring', 'contract.signature_requested', 'contract.activated', 'subscription.activated',
  'renewal.approaching', 'capacity.threshold_reached', 'customer.health_at_risk', 'customer.executive_review_due',
] as const

export const EMAIL_CLASSIFICATIONS = [
  'commercial_inquiry', 'offer_response', 'contract_matter', 'invoice_payment', 'support_request', 'complaint',
  'incident', 'implementation_issue', 'training_request', 'tenant_access_request', 'renewal', 'expansion',
  'administrative_document', 'general_correspondence', 'spam',
] as const

export const OUTBOUND_STATES = ['draft','scheduled','awaiting_approval','approved','queued','bridge_processing','smtp_accepted','sent','replied','failed','retry_scheduled','permanently_failed','cancelled'] as const

export function normalizeEmailCommandMode(value: string | null | undefined): EmailCommandMode {
  return EMAIL_COMMAND_MODES.some((item) => item.key === value) ? value as EmailCommandMode : 'command'
}

export function emailCommandHref(mode: EmailCommandMode) {
  return `/angelcare-360-operator/email-command?view=${mode}`
}
