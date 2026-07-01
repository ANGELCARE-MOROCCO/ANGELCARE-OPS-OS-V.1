import TrainingHubShell from '@/components/traininghub/TrainingHubShell'
import TrainingHubCommercialEnterpriseWorkspace from '@/components/traininghub/TrainingHubCommercialEnterpriseWorkspace'
import { requireTrainingHubPageContext } from '../traininghub-page-context'
import { createTrainingHubUserClient } from '@/lib/traininghub/supabase'

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

export default async function TrainingHubCommercialPage() {
  const context = await requireTrainingHubPageContext()
  const supabase = await createTrainingHubUserClient()

  const [
    organizations,
    sites,
    courses,
    proposals,
    proposalItems,
    orders,
    orderItems,
    invoices,
    invoiceItems,
    payments,
    accounts,
    subscriptions,
    credits,
    sessions,
    participants,
    certificates,
    profiles,
    memberships,
    roleAssignments,
    roles,
  ] = await Promise.all([
    listOrEmpty<any>(
      supabase
        .from('core_organizations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000),
    ),
    listOrEmpty<any>(
      supabase
        .from('core_organization_sites')
        .select('*')
        .limit(2000),
    ),
    listOrEmpty<any>(
      supabase
        .from('trn_courses')
        .select('id, category_id, ref, title, short_description, onsite_entry_price_minor, refresh_entry_price_minor, currency_code, starter_min_participants, starter_max_participants, min_hours, max_hours, status, publication_status')
        .order('ref', { ascending: true })
        .limit(700),
    ),
    listOrEmpty<any>(
      supabase
        .from('bill_proposals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1500),
    ),
    listOrEmpty<any>(
      supabase
        .from('bill_proposal_items')
        .select('*')
        .limit(4000),
    ),
    listOrEmpty<any>(
      supabase
        .from('bill_orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1500),
    ),
    listOrEmpty<any>(
      supabase
        .from('bill_order_items')
        .select('*')
        .limit(4000),
    ),
    listOrEmpty<any>(
      supabase
        .from('bill_invoices')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1500),
    ),
    listOrEmpty<any>(
      supabase
        .from('bill_invoice_items')
        .select('*')
        .limit(4000),
    ),
    listOrEmpty<any>(
      supabase
        .from('bill_payments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1500),
    ),
    listOrEmpty<any>(
      supabase
        .from('bill_accounts')
        .select('*')
        .limit(1500),
    ),
    listOrEmpty<any>(
      supabase
        .from('bill_subscriptions')
        .select('*')
        .limit(1500),
    ),
    listOrEmpty<any>(
      supabase
        .from('bill_training_credits')
        .select('*')
        .limit(2000),
    ),
    listOrEmpty<any>(
      supabase
        .from('trn_sessions')
        .select('id, organization_id, site_id, course_id, session_code, status, delivery_mode, city, planned_participant_count, actual_participant_count, planned_hours, scheduled_start_at, delivered_at, closed_at, created_at')
        .order('created_at', { ascending: false })
        .limit(2500),
    ),
    listOrEmpty<any>(
      supabase
        .from('trn_session_participants')
        .select('id, organization_id, site_id, session_id, full_name, email, job_title, attendance_status, certificate_status, refresh_access_status, created_at')
        .order('created_at', { ascending: false })
        .limit(3500),
    ),
    listOrEmpty<any>(
      supabase
        .from('trn_certificates')
        .select('id, organization_id, site_id, session_id, course_id, participant_id, certificate_number, status, issued_at, expires_at')
        .order('issued_at', { ascending: false, nullsFirst: false })
        .limit(2500),
    ),
    listOrEmpty<any>(
      supabase
        .from('core_user_profiles')
        .select('id, auth_user_id, full_name, email, job_title, status, preferred_language, metadata, created_at')
        .order('created_at', { ascending: false })
        .limit(2500),
    ),
    listOrEmpty<any>(
      supabase
        .from('core_memberships')
        .select('*')
        .limit(3500),
    ),
    listOrEmpty<any>(
      supabase
        .from('authz_user_role_assignments')
        .select('id, user_id, organization_id, site_id, role_id, status')
        .limit(3500),
    ),
    listOrEmpty<any>(
      supabase
        .from('authz_roles')
        .select('id, code, name, scope, status')
        .limit(400),
    ),
  ])

  const queryWarnings = [
    organizations,
    sites,
    courses,
    proposals,
    proposalItems,
    orders,
    orderItems,
    invoices,
    invoiceItems,
    payments,
    accounts,
    subscriptions,
    credits,
    sessions,
    participants,
    certificates,
    profiles,
    memberships,
    roleAssignments,
    roles,
  ]
    .map((result) => result.error)
    .filter(Boolean) as string[]

  return (
    <TrainingHubShell
      context={context}
      active="commercial"
      eyebrow="ANGELCARE TRAININGHUB • REVENUS & PARTENAIRES"
      title="Centre Commercial & Dossiers Partenaires"
      subtitle="Pilotez chaque partenaire comme un compte stratégique complet : cycle commercial, utilisateurs, services, formation, facturation, crédits, opérations et prochaines actions."
    >
      <TrainingHubCommercialEnterpriseWorkspace
        organizations={organizations.data}
        sites={sites.data}
        courses={courses.data}
        proposals={proposals.data}
        proposalItems={proposalItems.data}
        orders={orders.data}
        orderItems={orderItems.data}
        invoices={invoices.data}
        invoiceItems={invoiceItems.data}
        payments={payments.data}
        accounts={accounts.data}
        subscriptions={subscriptions.data}
        credits={credits.data}
        sessions={sessions.data}
        participants={participants.data}
        certificates={certificates.data}
        profiles={profiles.data}
        memberships={memberships.data}
        roleAssignments={roleAssignments.data}
        roles={roles.data}
        queryWarnings={queryWarnings}
      />
    </TrainingHubShell>
  )
}
