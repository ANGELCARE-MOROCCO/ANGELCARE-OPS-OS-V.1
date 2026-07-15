type QueryClient = { from: (table: string) => any }
type CountResponse = { count?: number | null; data?: any[] | null; error?: unknown }

function value(result: PromiseSettledResult<CountResponse>, label: string): CountResponse {
  if (result.status === 'rejected') {
    console.error('[B2B_COMMAND_METRIC_REJECTED]', label, result.reason)
    return { count: 0, data: [], error: result.reason }
  }
  if (result.value?.error) console.error('[B2B_COMMAND_METRIC_ERROR]', label, result.value.error)
  return result.value || { count: 0, data: [] }
}

function count(row: CountResponse) {
  return row.error ? 0 : row.count ?? 0
}

export async function getB2BCommandMetrics(db: QueryClient) {
  const now = new Date()
  const week = new Date()
  week.setDate(now.getDate() - 7)
  const labels = [
    'totalProspects','hotels','clinics','priorityA','interested','negotiation','pilots','signed','overdue','outreachWeek','meetingsWeek','proposalsActive','tasksOpen','programs','values'
  ] as const
  const queries = [
    db.from('b2b_prospects').select('id', { count: 'exact', head: true }).is('archived_at', null),
    db.from('b2b_prospects').select('id', { count: 'exact', head: true }).in('sector', ['Hotel','Resort','Family hotel','Boutique hotel','Event venue']).is('archived_at', null),
    db.from('b2b_prospects').select('id', { count: 'exact', head: true }).in('sector', ['Pediatric clinic','Pediatrician','Child development center','Orthophonist','Psychomotor specialist','Family wellness center']).is('archived_at', null),
    db.from('b2b_prospects').select('id', { count: 'exact', head: true }).eq('priority_score', 'A').is('archived_at', null),
    db.from('b2b_prospects').select('id', { count: 'exact', head: true }).eq('status', 'Interested').is('archived_at', null),
    db.from('b2b_prospects').select('id', { count: 'exact', head: true }).eq('status', 'Negotiation').is('archived_at', null),
    db.from('b2b_prospects').select('id', { count: 'exact', head: true }).eq('status', 'Pilot Agreed').is('archived_at', null),
    db.from('b2b_prospects').select('id', { count: 'exact', head: true }).eq('status', 'Signed Partner').is('archived_at', null),
    db.from('b2b_prospects').select('id', { count: 'exact', head: true }).lt('next_follow_up_at', now.toISOString()).is('archived_at', null),
    db.from('b2b_outreach_logs').select('id', { count: 'exact', head: true }).gte('sent_at', week.toISOString()),
    db.from('b2b_meetings').select('id', { count: 'exact', head: true }).gte('scheduled_at', week.toISOString()),
    db.from('b2b_proposals').select('id', { count: 'exact', head: true }).in('status', ['Sent','Viewed','Follow-up Needed','Negotiation','Accepted']),
    db.from('b2b_tasks').select('id', { count: 'exact', head: true }).in('status', ['To Do','In Progress','Blocked','Overdue']),
    db.from('b2b_partner_programs').select('id', { count: 'exact', head: true }).eq('is_active', true),
    db.from('b2b_prospects').select('estimated_monthly_value, estimated_annual_value').is('archived_at', null),
  ]
  const settled = await Promise.allSettled(queries)
  const rows = Object.fromEntries(labels.map((label, i) => [label, value(settled[i], label)])) as Record<typeof labels[number], CountResponse>
  const values = Array.isArray(rows.values.data) ? rows.values.data : []
  const monthly = values.reduce((sum, item) => sum + Number(item.estimated_monthly_value || 0), 0)
  const annual = values.reduce((sum, item) => sum + Number(item.estimated_annual_value || 0), 0)
  const total = count(rows.totalProspects)
  const signed = count(rows.signed)
  return {
    total_prospects: total,
    hotels_pipeline: count(rows.hotels),
    pediatric_clinics_pipeline: count(rows.clinics),
    priority_a_opportunities: count(rows.priorityA),
    interested_prospects: count(rows.interested),
    negotiations: count(rows.negotiation),
    pilots_agreed: count(rows.pilots),
    signed_partners: signed,
    overdue_followups: count(rows.overdue),
    outreach_sent_this_week: count(rows.outreachWeek),
    meetings_this_week: count(rows.meetingsWeek),
    active_proposals: count(rows.proposalsActive),
    open_tasks: count(rows.tasksOpen),
    active_partner_programs: count(rows.programs),
    estimated_monthly_revenue: monthly,
    estimated_annual_partnership_value: annual,
    conversion_rate: total > 0 ? Number(((signed / total) * 100).toFixed(2)) : 0,
  }
}
