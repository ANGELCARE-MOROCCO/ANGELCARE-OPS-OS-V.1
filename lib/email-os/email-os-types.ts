export type EmailContext = 'sales'|'family_support'|'mission_operation'|'caregiver_coordination'|'contract'|'billing'|'incident'|'hr'|'academy'|'partnership'|'internal_admin'|'marketing'
export type EmailPriority = 'normal'|'important'|'urgent'|'critical'
export type EmailStatus = 'received'|'draft'|'queued'|'sent'|'failed'|'archived'

export const EMAIL_CONTEXTS: EmailContext[] = ['sales','family_support','mission_operation','caregiver_coordination','contract','billing','incident','hr','academy','partnership','internal_admin','marketing']
export const EMAIL_PRIORITIES: EmailPriority[] = ['normal','important','urgent','critical']

export const EMAIL_NAV = [
  ['/email-os','Command'], ['/email-os/inbox','Inbox'], ['/email-os/composer','Composer'], ['/email-os/templates','Templates'],
  ['/email-os/automation','Automation'], ['/email-os/approvals','Approvals'], ['/email-os/follow-ups','Follow-ups'],
  ['/email-os/client-threads','Families'], ['/email-os/staff-threads','Caregivers'], ['/email-os/mission-mail','Missions'],
  ['/email-os/contracts-mail','Contracts'], ['/email-os/billing-mail','Billing'], ['/email-os/incidents-mail','Incidents'],
  ['/email-os/hr-mail','HR'], ['/email-os/academy-mail','Academy'], ['/email-os/campaigns','Campaigns'], ['/email-os/settings','Settings'], ['/email-os/audit','Audit']
] as const

export const DEFAULT_TEMPLATES = [
  { key:'family_welcome', category:'Family', title:'Family welcome & service intake', context:'family_support', subject:'Bienvenue chez AngelCare — prochaines étapes', approval:false },
  { key:'mission_confirmation_family', category:'Mission', title:'Mission confirmation to family', context:'mission_operation', subject:'Confirmation de votre mission AngelCare', approval:false },
  { key:'caregiver_assignment', category:'Caregiver', title:'Caregiver assignment notice', context:'caregiver_coordination', subject:'Nouvelle mission assignée — détails opérationnels', approval:false },
  { key:'contract_signature', category:'Contract', title:'Contract signature reminder', context:'contract', subject:'Signature de votre contrat AngelCare', approval:true },
  { key:'billing_reminder_l1', category:'Billing', title:'Payment reminder level 1', context:'billing', subject:'Rappel de paiement — facture AngelCare', approval:false },
  { key:'billing_escalation', category:'Billing', title:'Payment escalation', context:'billing', subject:'Action requise — paiement en attente', approval:true },
  { key:'incident_acknowledgement', category:'Incident', title:'Incident acknowledgement', context:'incident', subject:'Suivi qualité AngelCare — accusé de réception', approval:true },
  { key:'incident_resolution', category:'Incident', title:'Incident resolution confirmation', context:'incident', subject:'Confirmation de résolution — dossier qualité', approval:true },
  { key:'hr_document_request', category:'HR', title:'Caregiver document request', context:'hr', subject:'Document requis pour votre dossier AngelCare', approval:false },
  { key:'academy_certificate', category:'Academy', title:'Academy certificate email', context:'academy', subject:'Certification AngelCare Academy', approval:false },
  { key:'partner_intro', category:'Partnership', title:'Partner introduction', context:'partnership', subject:'Collaboration AngelCare — opportunité de partenariat', approval:true },
  { key:'satisfaction_survey', category:'Family', title:'Satisfaction survey after mission', context:'family_support', subject:'Votre avis compte pour AngelCare', approval:false },
]
