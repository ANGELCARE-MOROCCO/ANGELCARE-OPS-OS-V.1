export type QuoteCRMStatus =
  | 'new_request'
  | 'to_qualify'
  | 'contacted'
  | 'need_confirmed'
  | 'quote_preparation'
  | 'quote_sent'
  | 'followup_scheduled'
  | 'accepted'
  | 'lost'
  | 'archived'

export const QUOTE_CRM_STATUS_LABELS: Record<QuoteCRMStatus, string> = {
  new_request: 'Nouveau',
  to_qualify: 'À qualifier',
  contacted: 'Contacté',
  need_confirmed: 'Besoin confirmé',
  quote_preparation: 'Devis en préparation',
  quote_sent: 'Devis envoyé',
  followup_scheduled: 'Relance prévue',
  accepted: 'Accepté',
  lost: 'Perdu',
  archived: 'Archivé',
}

export const QUOTE_CRM_STATUSES = Object.keys(QUOTE_CRM_STATUS_LABELS) as QuoteCRMStatus[]
