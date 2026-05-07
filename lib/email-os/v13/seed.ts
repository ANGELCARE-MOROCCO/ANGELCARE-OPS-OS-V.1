import type { EmailOsSnapshot } from './types';

const now = () => new Date().toISOString();

export const emailOsV13Seed: EmailOsSnapshot = {
  configuration: {
    id: 'email-os-config-main',
    providerMode: 'mixed',
    defaultSlaMinutes: 240,
    retryLimit: 3,
    auditRetentionDays: 365,
    approvalPolicy: 'Restricted, Legal, CEO Office and failed-provider sends require approval.',
    routingEnabled: true,
    updatedAt: now(),
  },
  mailboxes: [
    { id: 'mbx-ops', name: 'Operations', address: 'operations@angelcare.ma', department: 'Operations', owner: 'Operations Lead', provider: 'microsoft', status: 'healthy', inboundHost: 'graph.microsoft.com', outboundHost: 'graph.microsoft.com', signature: 'AngelCare Operations', routingRule: 'Urgent care, scheduling and unresolved family cases', allowSend: true, requireApproval: false, createdAt: now(), updatedAt: now() },
    { id: 'mbx-family', name: 'Family Support', address: 'families@angelcare.ma', department: 'Care', owner: 'Care Experience', provider: 'google', status: 'healthy', inboundHost: 'imap.gmail.com', outboundHost: 'smtp.gmail.com', signature: 'AngelCare Family Support', routingRule: 'Family inquiries and care experience issues', allowSend: true, requireApproval: false, createdAt: now(), updatedAt: now() },
    { id: 'mbx-billing', name: 'Billing', address: 'billing@angelcare.ma', department: 'Finance', owner: 'Billing Manager', provider: 'smtp_imap', status: 'warning', inboundHost: 'imap.private-provider.ma', outboundHost: 'smtp.private-provider.ma', signature: 'AngelCare Billing', routingRule: 'Invoices, payment, refunds, disputes', allowSend: true, requireApproval: true, createdAt: now(), updatedAt: now() },
    { id: 'mbx-legal', name: 'Legal', address: 'legal@angelcare.ma', department: 'Legal', owner: 'Legal Admin', provider: 'smtp_imap', status: 'restricted', inboundHost: 'imap.private-provider.ma', outboundHost: 'smtp.private-provider.ma', signature: 'AngelCare Legal Notice', routingRule: 'Contracts, liability, claims', allowSend: false, requireApproval: true, createdAt: now(), updatedAt: now() },
    { id: 'mbx-sales', name: 'Sales', address: 'sales@angelcare.ma', department: 'Revenue', owner: 'Sales Director', provider: 'google', status: 'healthy', inboundHost: 'imap.gmail.com', outboundHost: 'smtp.gmail.com', signature: 'AngelCare Revenue Team', routingRule: 'Leads, deals, proposals', allowSend: true, requireApproval: false, createdAt: now(), updatedAt: now() },
    { id: 'mbx-marketing', name: 'Marketing', address: 'marketing@angelcare.ma', department: 'Marketing', owner: 'Marketing Lead', provider: 'alias', status: 'needs_setup', signature: 'AngelCare Marketing', routingRule: 'Campaign, ambassador, content and partnership requests', allowSend: false, requireApproval: true, createdAt: now(), updatedAt: now() },
  ],
  threads: [
    { id: 'THR-1001', subject: 'Urgent family care schedule change', fromName: 'Mme Benali', fromEmail: 'benali@example.com', mailboxId: 'mbx-family', owner: 'Care Experience', department: 'Care', status: 'escalated', priority: 'critical', slaMinutesLeft: 12, clientName: 'Benali Family', revenueLink: 'Contract AC-422', partnerLink: 'Care Plan CP-91', tags: ['schedule','caregiver','urgent'], lastMessage: 'Family requests immediate replacement for tomorrow morning visit.', internalNotes: ['Escalated to operations','Caregiver backup needed'], createdAt: now(), updatedAt: now() },
    { id: 'THR-1002', subject: 'Invoice correction request for March services', fromName: 'Accounts Payable', fromEmail: 'ap@example.com', mailboxId: 'mbx-billing', owner: 'Billing Manager', department: 'Finance', status: 'waiting_internal', priority: 'high', slaMinutesLeft: 135, clientName: 'Bennis Holding', revenueLink: 'Invoice INV-2039', tags: ['invoice','correction','finance'], lastMessage: 'The March invoice has a discrepancy on night shift hours.', internalNotes: ['Need timesheet proof'], createdAt: now(), updatedAt: now() },
    { id: 'THR-1003', subject: 'Corporate training proposal for caregivers', fromName: 'HR Director', fromEmail: 'hr-client@example.com', mailboxId: 'mbx-sales', owner: 'Sales Director', department: 'Revenue', status: 'assigned', priority: 'high', slaMinutesLeft: 330, clientName: 'Casablanca Senior Care', revenueLink: 'Opportunity OPP-774', partnerLink: 'Training Program TP-24', tags: ['academy','proposal','B2B'], lastMessage: 'Client requested a detailed training calendar and price structure.', internalNotes: ['Prepare commercial PDF'], createdAt: now(), updatedAt: now() },
  ],
  drafts: [],
  templates: [
    { id: 'tpl-family-schedule', name: 'Family schedule apology', category: 'Care', subject: 'Update regarding your care schedule', body: 'Hello {{family_name}},\n\nThank you for alerting us. We are coordinating the schedule update for {{visit_date}} and will confirm the replacement caregiver shortly.\n\nAngelCare Team', requiresApproval: false, variables: ['family_name','visit_date'], qualityScore: 94 },
    { id: 'tpl-billing-correction', name: 'Invoice correction response', category: 'Billing', subject: 'Invoice correction review {{invoice_id}}', body: 'Hello,\n\nWe received your correction request for {{invoice_id}}. Our billing team is validating the related timesheet and will respond with the corrected status.\n\nAngelCare Billing', requiresApproval: true, variables: ['invoice_id'], qualityScore: 91 },
    { id: 'tpl-legal-ack', name: 'Restricted legal acknowledgement', category: 'Legal', subject: 'Acknowledgement of legal request {{case_id}}', body: 'Hello,\n\nWe acknowledge receipt of your legal request {{case_id}}. This message requires approval before outbound delivery.\n\nAngelCare Legal', requiresApproval: true, variables: ['case_id'], qualityScore: 97 }
  ],
  permissions: [
    { id: 'perm-ops', user: 'Operations Lead', role: 'Manager', department: 'Operations', mailboxId: 'mbx-ops', canRead: true, canSend: true, canApprove: true, isAdmin: false },
    { id: 'perm-billing', user: 'Billing Manager', role: 'Manager', department: 'Finance', mailboxId: 'mbx-billing', canRead: true, canSend: true, canApprove: true, isAdmin: false },
    { id: 'perm-legal', user: 'Legal Admin', role: 'Restricted', department: 'Legal', mailboxId: 'mbx-legal', canRead: true, canSend: false, canApprove: false, isAdmin: false },
    { id: 'perm-ceo', user: 'CEO Office', role: 'Executive', department: 'Executive', mailboxId: 'mbx-legal', canRead: true, canSend: true, canApprove: true, isAdmin: true },
  ],
  queue: [
    { id: 'JOB-001', type: 'sync', mailboxId: 'mbx-ops', state: 'running', retryCount: 0, payload: { scope: 'inbox' }, createdAt: now(), updatedAt: now() },
    { id: 'JOB-002', type: 'provider_check', mailboxId: 'mbx-marketing', state: 'failed', retryCount: 3, payload: { reason: 'alias_not_connected' }, lastError: 'Marketing alias needs provider binding.', createdAt: now(), updatedAt: now() },
  ],
  audit: [
    { id: 'AUD-001', actor: 'System', action: 'Email OS V13 initialized', targetType: 'system', targetId: 'email-os-v13', result: 'ready', createdAt: now() },
  ],
};
