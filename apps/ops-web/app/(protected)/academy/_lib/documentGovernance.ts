import { EXPORT_REASONS } from './documentCatalog'

export function validateExportReason(reason: string, note?: string) {
  if (!reason) return 'Export reason is required.'
  if (!(EXPORT_REASONS as readonly string[]).includes(reason)) return 'Invalid export reason.'
  if (reason === 'Other' && !note?.trim()) return 'A note is required when reason is Other.'
  return null
}

export function getConfidentialityLabel(level?: string | null) {
  const map: Record<string, string> = {
    internal: 'Internal use',
    restricted: 'Restricted',
    confidential: 'Confidential',
    board: 'Board / Executive',
  }
  return map[level || 'internal'] || 'Internal use'
}

export function getPurposeDescription(reason: string) {
  const map: Record<string, string> = {
    'Internal management review': 'Used for operational review, manager decision making and internal follow-up.',
    'Client / family communication': 'Shared with client/family stakeholders under controlled communication rules.',
    'Trainer follow-up': 'Used to align training delivery, trainer actions and trainee monitoring.',
    'Partner dispatch': 'Used to support placement, partner communication or external dispatch decisions.',
    'Compliance / audit': 'Used as controlled evidence for audit, ISO, internal control or compliance review.',
    'Financial control': 'Used for payment, revenue, collection, aging or finance monitoring.',
    'Certification proof': 'Used to prove certificate readiness, issuance or authenticity.',
    'Legal / administrative file': 'Used for administrative or legal evidence requirements.',
    'Board reporting': 'Used for executive review, strategic steering and governance.',
    Other: 'User-defined purpose captured in export note.',
  }
  return map[reason] || reason
}
