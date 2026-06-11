export type CampaignStatus = 'Draft' | 'Scheduled' | 'Running' | 'Paused' | 'Completed' | 'Archived'

export const B2B_CAMPAIGN_STATUSES: CampaignStatus[] = ['Draft', 'Scheduled', 'Running', 'Paused', 'Completed', 'Archived']

export const B2B_CAMPAIGN_SEGMENTS = [
  { key: 'hospitality', label: 'Hôtels & Resorts', description: 'Hôtels, resorts, boutique hotels, event venues.' },
  { key: 'pediatric_health', label: 'Cliniques pédiatriques', description: 'Cliniques, pédiatres, centres de développement enfant.' },
  { key: 'education_childcare', label: 'Éducation & enfance', description: 'Crèches, écoles, centres éducatifs et périscolaires.' },
  { key: 'all', label: 'Tous segments', description: 'Toutes les opportunités B2B ANGELCARE.' },
]

export function normalizeCampaignStatus(value: unknown): CampaignStatus {
  return B2B_CAMPAIGN_STATUSES.includes(value as CampaignStatus) ? value as CampaignStatus : 'Draft'
}

export function renderSegmentLabel(segment?: string | null) {
  return B2B_CAMPAIGN_SEGMENTS.find((row) => row.key === segment)?.label || 'Tous segments'
}

export function calculateCampaignConversion(input: { target_count?: number | null; signed_partner_count?: number | null }) {
  const total = Number(input.target_count || 0)
  const signed = Number(input.signed_partner_count || 0)
  return total > 0 ? Number(((signed / total) * 100).toFixed(2)) : 0
}
