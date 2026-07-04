import TrainingHubPartnerPortalWorkspace from '@/components/traininghub/TrainingHubPartnerPortalWorkspace'
import { createTrainingHubUserClient } from '@/lib/traininghub/supabase'
import { requireTrainingHubExperiencePageContext } from '../traininghub-page-context'
const TrainingHubPartnerPortalWorkspaceAny = TrainingHubPartnerPortalWorkspace as any

export const dynamic = 'force-dynamic'

type QueryResult<T> = { data: T[]; error: string | null }

async function listOrEmpty<T>(query: PromiseLike<{ data: T[] | null; error: any }>): Promise<QueryResult<T>> {
  try {
    const { data, error } = await query
    return { data: Array.isArray(data) ? data : [], error: error?.message || null }
  } catch (error) {
    return { data: [], error: error instanceof Error ? error.message : String(error || 'Unknown query error') }
  }
}

export default async function TrainingHubPartnerPortalPage() {
  const context = await requireTrainingHubExperiencePageContext('partner')
  const supabase = await createTrainingHubUserClient()
  const organizationIds = context.organizationIds
  const siteIds = context.siteIds

  const [sessions, proposals, entitlements, certificates, participants, assignments, resources, sites] = await Promise.all([
    organizationIds.length
      ? listOrEmpty(
          supabase
            .from('trn_sessions')
            .select(
              'id, organization_id, site_id, session_code, status, delivery_mode, city, planned_participant_count, actual_participant_count, planned_hours, scheduled_start_at, scheduled_end_at, delivered_at, course_id, trn_courses(ref, title, positioning_tags, category_id, trn_categories(code, name))',
            )
            .in('organization_id', organizationIds)
            .order('created_at', { ascending: false })
            .limit(40),
        )
      : Promise.resolve({ data: [], error: null }),
    organizationIds.length
      ? listOrEmpty(
          supabase
            .from('bill_proposals')
            .select('id, organization_id, proposal_number, status, title, currency_code, grand_total_minor, valid_until, sent_at, accepted_at, created_at')
            .in('organization_id', organizationIds)
            .order('created_at', { ascending: false })
            .limit(30),
        )
      : Promise.resolve({ data: [], error: null }),
    organizationIds.length
      ? listOrEmpty(
          supabase
            .from('learn_entitlements')
            .select('id, organization_id, site_id, status, unlocked_at, valid_until, access_policy, course_id, module_id, learn_modules(id, module_code, title, estimated_minutes, status, trn_courses(ref, title))')
            .in('organization_id', organizationIds)
            .order('unlocked_at', { ascending: false })
            .limit(50),
        )
      : Promise.resolve({ data: [], error: null }),
    organizationIds.length
      ? listOrEmpty(
          supabase
            .from('trn_certificates')
            .select('id, organization_id, certificate_number, certificate_url, issued_at, status, course_id, trn_courses(ref, title), trn_session_participants(full_name, job_title)')
            .in('organization_id', organizationIds)
            .order('issued_at', { ascending: false })
            .limit(40),
        )
      : Promise.resolve({ data: [], error: null }),
    organizationIds.length
      ? listOrEmpty(
          supabase
            .from('trn_session_participants')
            .select('id, organization_id, site_id, full_name, email, phone, job_title, attendance_status, certificate_status, refresh_access_status, session_id')
            .in('organization_id', organizationIds)
            .order('created_at', { ascending: false })
            .limit(80),
        )
      : Promise.resolve({ data: [], error: null }),
    listOrEmpty(
      supabase
        .from('learn_assignments')
        .select('id, organization_id, module_id, user_id, assigned_at, due_at, status, learn_modules(module_code, title, estimated_minutes)')
        .eq('user_id', context.profile.id)
        .order('assigned_at', { ascending: false })
        .limit(40),
    ),
    listOrEmpty(
      supabase
        .from('trn_course_resources')
        .select('id, course_id, resource_title, resource_type, visibility_scope, status, trn_courses(ref, title)')
        .order('created_at', { ascending: false })
        .limit(60),
    ),
    organizationIds.length
      ? listOrEmpty(
          siteIds.length
            ? supabase
                .from('core_organization_sites')
                .select('id, organization_id, site_name, city, school_type, staff_count, capacity_children, active_children_count, status')
                .in('id', siteIds)
                .limit(20)
            : supabase
                .from('core_organization_sites')
                .select('id, organization_id, site_name, city, school_type, staff_count, capacity_children, active_children_count, status')
                .in('organization_id', organizationIds)
                .limit(20),
        )
      : Promise.resolve({ data: [], error: null }),
  ])

  const queryWarnings = [sessions, proposals, entitlements, certificates, participants, assignments, resources, sites]
    .map((result) => result.error)
    .filter(Boolean) as string[]

  return (
    <TrainingHubPartnerPortalWorkspaceAny
      context={context}
      sessions={sessions.data as any[]}
      proposals={proposals.data as any[]}
      entitlements={entitlements.data as any[]}
      certificates={certificates.data as any[]}
      participants={participants.data as any[]}
      assignments={assignments.data as any[]}
      resources={resources.data as any[]}
      sites={sites.data as any[]}
      queryWarnings={queryWarnings}
      adminPreview={context.isInternal || context.isSuperAdmin}
    />
  )
}
