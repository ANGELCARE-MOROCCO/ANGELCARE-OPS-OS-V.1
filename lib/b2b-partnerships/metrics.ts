type QueryClient = {
  from: (table: string) => any
}

export async function getB2BDashboardMetrics(db: QueryClient) {
  const since = new Date()
  since.setDate(since.getDate() - 7)

  const [
    totalProspects,
    qualifiedProspects,
    hotelsPipeline,
    clinicsPipeline,
    decisionMakers,
    outreachWeek,
    callsWeek,
    positiveReplies,
    meetingsBooked,
    meetingsCompleted,
    proposalsSent,
    pilotsAgreed,
    signedPartners,
    overdueFollowups,
  ] = await Promise.all([
    db.from('b2b_prospects').select('id', { count: 'exact', head: true }).is('archived_at', null),
    db.from('b2b_prospects').select('id', { count: 'exact', head: true }).in('priority_score', ['A', 'B']).is('archived_at', null),
    db.from('b2b_prospects').select('id', { count: 'exact', head: true }).in('sector', ['Hotel', 'Resort', 'Family hotel', 'Boutique hotel', 'Event venue']).is('archived_at', null),
    db.from('b2b_prospects').select('id', { count: 'exact', head: true }).in('sector', ['Pediatric clinic', 'Pediatrician', 'Child development center', 'Orthophonist', 'Psychomotor specialist', 'Family wellness center']).is('archived_at', null),
    db.from('b2b_prospects').select('id', { count: 'exact', head: true }).not('decision_maker_name', 'is', null).is('archived_at', null),
    db.from('b2b_outreach_logs').select('id', { count: 'exact', head: true }).gte('sent_at', since.toISOString()),
    db.from('b2b_calls').select('id', { count: 'exact', head: true }).gte('created_at', since.toISOString()),
    db.from('b2b_outreach_logs').select('id', { count: 'exact', head: true }).eq('outcome', 'Positive reply'),
    db.from('b2b_meetings').select('id', { count: 'exact', head: true }).eq('status', 'Scheduled'),
    db.from('b2b_meetings').select('id', { count: 'exact', head: true }).eq('status', 'Completed'),
    db.from('b2b_proposals').select('id', { count: 'exact', head: true }).in('status', ['Sent', 'Viewed', 'Follow-up Needed', 'Negotiation']),
    db.from('b2b_prospects').select('id', { count: 'exact', head: true }).eq('status', 'Pilot Agreed'),
    db.from('b2b_prospects').select('id', { count: 'exact', head: true }).eq('status', 'Signed Partner'),
    db.from('b2b_prospects').select('id', { count: 'exact', head: true }).lt('next_follow_up_at', new Date().toISOString()).is('archived_at', null),
  ])

  const estimatedValues = await db
    .from('b2b_prospects')
    .select('estimated_monthly_value, estimated_annual_value')
    .is('archived_at', null)

  const rows = estimatedValues.data ?? []

  const estimatedMonthlyRevenue = rows.reduce(
    (sum: number, row: any) => sum + Number(row.estimated_monthly_value ?? 0),
    0
  )

  const estimatedAnnualPartnershipValue = rows.reduce(
    (sum: number, row: any) => sum + Number(row.estimated_annual_value ?? 0),
    0
  )

  const total = totalProspects.count ?? 0
  const signed = signedPartners.count ?? 0

  return {
    total_prospects: total,
    qualified_prospects: qualifiedProspects.count ?? 0,
    hotels_pipeline: hotelsPipeline.count ?? 0,
    pediatric_clinics_pipeline: clinicsPipeline.count ?? 0,
    decision_makers_identified: decisionMakers.count ?? 0,
    outreach_sent_this_week: outreachWeek.count ?? 0,
    calls_completed_this_week: callsWeek.count ?? 0,
    positive_replies: positiveReplies.count ?? 0,
    meetings_booked: meetingsBooked.count ?? 0,
    meetings_completed: meetingsCompleted.count ?? 0,
    proposals_sent: proposalsSent.count ?? 0,
    pilots_agreed: pilotsAgreed.count ?? 0,
    signed_partners: signed,
    estimated_monthly_revenue: estimatedMonthlyRevenue,
    estimated_annual_partnership_value: estimatedAnnualPartnershipValue,
    conversion_rate: total > 0 ? Number(((signed / total) * 100).toFixed(2)) : 0,
    overdue_followups: overdueFollowups.count ?? 0,
  }
}
