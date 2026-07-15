export function computeCampaignMetrics(campaign: any, prospects: any[] = []) {
  const spend = Number(campaign.spend || 0)
  const clicks = Number(campaign.clicks || 0)
  const leads = Number(campaign.leads || 0) || prospects.length
  const influenced = prospects.reduce((sum, p) => sum + Number(p.estimated_value || 0), 0)

  const cpl = leads ? spend / leads : 0
  const ctrProxy = Number(campaign.impressions || 0) ? (clicks / Number(campaign.impressions || 0)) * 100 : 0
  const leadToValue = spend ? influenced / spend : 0
  const qualityScore = Math.min(100, Math.round(
    (leads ? 25 : 0) +
    Math.min(leadToValue * 10, 35) +
    Math.min(ctrProxy * 5, 20) +
    (cpl && cpl < 80 ? 20 : cpl && cpl < 150 ? 12 : 5)
  ))

  let recommendation = 'Maintain campaign and keep qualifying leads.'
  if (!leads) recommendation = 'Campaign needs lead generation validation.'
  else if (qualityScore >= 80) recommendation = 'Scale carefully and create sales follow-up sequence.'
  else if (qualityScore < 45) recommendation = 'Review offer, targeting, and creative angle before scaling.'
  else if (cpl > 150) recommendation = 'Cost per lead is high; test new creative or audience.'

  return {
    leads,
    cpl,
    ctrProxy,
    influenced,
    leadToValue,
    qualityScore,
    recommendation,
  }
}

export function scoreProspectAttribution(prospect: any) {
  let score = 0
  if (prospect.source_platform) score += 15
  if (prospect.source_channel) score += 15
  if (prospect.utm_campaign) score += 20
  if (prospect.campaign_id) score += 25
  if (Number(prospect.estimated_value || 0) > 0) score += 15
  if (prospect.lead_quality && prospect.lead_quality !== 'unknown') score += 10
  return Math.min(100, score)
}

export function sourceLabel(prospect: any) {
  return [prospect.source_platform, prospect.source_channel, prospect.utm_campaign].filter(Boolean).join(' / ') || 'Unattributed'
}
