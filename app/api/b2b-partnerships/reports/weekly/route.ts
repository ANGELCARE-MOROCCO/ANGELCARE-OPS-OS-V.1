import { NextResponse } from 'next/server'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'

async function count(query: any) {
  const result = await query
  return result.count ?? 0
}

export async function GET() {
  try {
    const db = await getServerB2BDatabaseClient()
    const actor = await getCurrentB2BAppUser()
    if (!actor?.id) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })

    const permission = requireB2BPermission('read', { actorId: actor.id, actorRole: actor.role })
    if (!permission.ok) return NextResponse.json({ ok: false, error: permission.error }, { status: permission.status })

    const since = new Date()
    since.setDate(since.getDate() - 7)
    const sinceIso = since.toISOString()

    const [
      totalProposals,
      draftProposals,
      sentProposals,
      acceptedProposals,
      rejectedProposals,
      activePrograms,
      reportsGenerated,
      signedPartners,
      pilotsAgreed,
      followUpNeeded,
    ] = await Promise.all([
      count(db.from('b2b_proposals').select('id', { count: 'exact', head: true })),
      count(db.from('b2b_proposals').select('id', { count: 'exact', head: true }).eq('status', 'Draft')),
      count(db.from('b2b_proposals').select('id', { count: 'exact', head: true }).eq('status', 'Sent')),
      count(db.from('b2b_proposals').select('id', { count: 'exact', head: true }).eq('status', 'Accepted')),
      count(db.from('b2b_proposals').select('id', { count: 'exact', head: true }).eq('status', 'Rejected')),
      count(db.from('b2b_partner_programs').select('id', { count: 'exact', head: true }).eq('is_active', true)),
      count(db.from('b2b_reports').select('id', { count: 'exact', head: true }).gte('created_at', sinceIso)),
      count(db.from('b2b_prospects').select('id', { count: 'exact', head: true }).eq('status', 'Signed Partner')),
      count(db.from('b2b_prospects').select('id', { count: 'exact', head: true }).eq('status', 'Pilot Agreed')),
      count(db.from('b2b_proposals').select('id', { count: 'exact', head: true }).eq('status', 'Follow-up Needed')),
    ])

    const values = await db.from('b2b_proposals').select('estimated_monthly_value, estimated_annual_value')
    const rows = values.data ?? []
    const proposalPipelineValueMonthly = rows.reduce((sum: number, row: any) => sum + Number(row.estimated_monthly_value ?? 0), 0)
    const proposalPipelineValueAnnual = rows.reduce((sum: number, row: any) => sum + Number(row.estimated_annual_value ?? 0), 0)

    return NextResponse.json({
      ok: true,
      data: {
        total_proposals: totalProposals,
        draft_proposals: draftProposals,
        sent_proposals: sentProposals,
        accepted_proposals: acceptedProposals,
        rejected_proposals: rejectedProposals,
        proposal_pipeline_value_monthly: proposalPipelineValueMonthly,
        proposal_pipeline_value_annual: proposalPipelineValueAnnual,
        active_partner_programs: activePrograms,
        reports_generated: reportsGenerated,
        signed_partners: signedPartners,
        pilots_agreed: pilotsAgreed,
        conversion_rate: totalProposals > 0 ? Number(((acceptedProposals / totalProposals) * 100).toFixed(2)) : 0,
        follow_up_needed: followUpNeeded,
      },
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Unable to load B2B weekly metrics.' }, { status: 500 })
  }
}
