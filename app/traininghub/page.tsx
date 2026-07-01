import TrainingHubShell from '@/components/traininghub/TrainingHubShell'
import TrainingHubCommandCenterWorkspace from '@/components/traininghub/TrainingHubCommandCenterWorkspace'
import { requireTrainingHubPageContext } from './traininghub-page-context'
import { createTrainingHubUserClient } from '@/lib/traininghub/supabase'
import { getTrainingHubDashboardData } from '@/lib/traininghub/ui'

export const dynamic = 'force-dynamic'

type QueryResult<T> = { data: T[]; error: string | null }

async function listOrEmpty<T>(query: PromiseLike<{ data: T[] | null; error: any }>): Promise<QueryResult<T>> {
  try {
    const { data, error } = await query
    return { data: Array.isArray(data) ? data : [], error: error?.message || null }
  } catch (error) {
    return { data: [], error: error instanceof Error ? error.message : String(error || 'Erreur inconnue') }
  }
}

export default async function TrainingHubCommandCenterPage() {
  const context = await requireTrainingHubPageContext()
  const supabase = await createTrainingHubUserClient()
  const dashboard = await getTrainingHubDashboardData()

  const organizationsResult = await listOrEmpty<any>(
    supabase
      .from('core_organizations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500),
  )

  const partnerOrganizations = organizationsResult.data.filter((org: any) => {
    const type = String(org.organization_type || '').toLowerCase()
    return type.includes('partner') || type.includes('school') || type.includes('creche') || type.includes('crèche')
  })

  const partners = partnerOrganizations.length
    ? partnerOrganizations
    : organizationsResult.data.filter((org: any) => String(org.organization_type || '').toLowerCase() !== 'angelcare_internal')

  const partnerIds = partners.map((partner: any) => partner.id).filter(Boolean)

  const [sitesResult, accountsResult, subscriptionsResult, sessionsResult, proposalsResult, participantsResult] = await Promise.all([
    partnerIds.length
      ? listOrEmpty<any>(
          supabase
            .from('core_organization_sites')
            .select('*')
            .in('organization_id', partnerIds)
            .limit(1000),
        )
      : Promise.resolve({ data: [], error: null }),
    listOrEmpty<any>(
      supabase
        .from('bill_accounts')
        .select('*')
        .limit(1000),
    ),
    listOrEmpty<any>(
      supabase
        .from('bill_subscriptions')
        .select('*')
        .limit(1000),
    ),
    partnerIds.length
      ? listOrEmpty<any>(
          supabase
            .from('trn_sessions')
            .select('id, organization_id, site_id, session_code, status, delivery_mode, city, planned_participant_count, actual_participant_count, scheduled_start_at, delivered_at, created_at')
            .in('organization_id', partnerIds)
            .order('created_at', { ascending: false })
            .limit(1000),
        )
      : Promise.resolve({ data: [], error: null }),
    partnerIds.length
      ? listOrEmpty<any>(
          supabase
            .from('bill_proposals')
            .select('id, organization_id, proposal_number, status, title, grand_total_minor, currency_code, valid_until, created_at')
            .in('organization_id', partnerIds)
            .order('created_at', { ascending: false })
            .limit(1000),
        )
      : Promise.resolve({ data: [], error: null }),
    partnerIds.length
      ? listOrEmpty<any>(
          supabase
            .from('trn_session_participants')
            .select('id, organization_id, site_id, session_id, full_name, email, job_title, attendance_status, certificate_status, refresh_access_status, created_at')
            .in('organization_id', partnerIds)
            .order('created_at', { ascending: false })
            .limit(1500),
        )
      : Promise.resolve({ data: [], error: null }),
  ])

  const queryWarnings = [
    organizationsResult,
    sitesResult,
    accountsResult,
    subscriptionsResult,
    sessionsResult,
    proposalsResult,
    participantsResult,
  ]
    .map((result) => result.error)
    .filter(Boolean) as string[]

  return (
    <TrainingHubShell
      context={context}
      active="dashboard"
      eyebrow="ANGELCARE TRAININGHUB • PILOTAGE PARTENAIRES"
      title="Tableau de bord partenaires formation"
      subtitle="Vue direction pour suivre les crèches et écoles partenaires, leurs comptes actifs, leurs villes, leurs sessions, leurs équipes formées et leur dynamique de progression."
    >
      <TrainingHubCommandCenterWorkspace
        partners={partners}
        sites={sitesResult.data}
        accounts={accountsResult.data}
        subscriptions={subscriptionsResult.data}
        sessions={sessionsResult.data}
        proposals={proposalsResult.data}
        participants={participantsResult.data}
        counts={dashboard.counts}
        recentCourses={dashboard.recentCourses}
        queryWarnings={queryWarnings}
      />
    </TrainingHubShell>
  )
}
