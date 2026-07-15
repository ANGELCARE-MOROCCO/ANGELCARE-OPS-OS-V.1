import TrainingHubTrainerCockpitWorkspace from '@/components/traininghub/TrainingHubTrainerCockpitWorkspace'
import { createTrainingHubUserClient } from '@/lib/traininghub/supabase'
import { requireTrainingHubExperiencePageContext } from '../traininghub-page-context'

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

export default async function TrainingHubTrainerCockpitPage() {
  const context = await requireTrainingHubExperiencePageContext('trainer')
  const supabase = await createTrainingHubUserClient()
  const adminPreview = context.isInternal || context.isSuperAdmin

  const assignedLinkResult = adminPreview
    ? { data: [], error: null }
    : await listOrEmpty<any>(
        supabase
          .from('trn_session_trainers')
          .select('id, session_id, trainer_id, role, status, assignment_status, metadata')
          .eq('trainer_id', context.profile.id)
          .limit(80),
      )

  const assignedSessionIds = Array.from(new Set((assignedLinkResult.data || []).map((row: any) => row.session_id).filter(Boolean)))

  const baseSessionQuery = supabase
    .from('trn_sessions')
    .select(
      'id, organization_id, site_id, session_code, status, delivery_mode, city, location_address, planned_participant_count, actual_participant_count, planned_hours, scheduled_start_at, scheduled_end_at, delivered_at, closed_at, trainer_owner_id, academy_owner_id, course_id, trn_courses(ref, title, short_description, positioning_tags, category_id, trn_categories(code, name)), core_organizations(name, legal_name, city, organization_type)',
    )
    .order('scheduled_start_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(80)

  const sessions = await listOrEmpty<any>(
    adminPreview
      ? baseSessionQuery
      : assignedSessionIds.length
        ? baseSessionQuery.in('id', assignedSessionIds)
        : baseSessionQuery.or(`trainer_owner_id.eq.${context.profile.id},academy_owner_id.eq.${context.profile.id}`),
  )

  const sessionIds = sessions.data.map((session: any) => session.id).filter(Boolean)

  const [participants, attendance, resources, dates, checklists, certificates] = await Promise.all([
    sessionIds.length
      ? listOrEmpty<any>(
          supabase
            .from('trn_session_participants')
            .select('id, session_id, organization_id, site_id, full_name, email, phone, job_title, attendance_status, certificate_status, refresh_access_status, created_at')
            .in('session_id', sessionIds)
            .order('created_at', { ascending: false })
            .limit(200),
        )
      : Promise.resolve({ data: [], error: null }),
    sessionIds.length
      ? listOrEmpty<any>(
          supabase
            .from('trn_attendance_records')
            .select('id, session_id, participant_id, attendance_status, check_in_at, check_out_at, signature_url, validated_at, metadata')
            .in('session_id', sessionIds)
            .order('created_at', { ascending: false })
            .limit(200),
        )
      : Promise.resolve({ data: [], error: null }),
    sessionIds.length
      ? listOrEmpty<any>(
          supabase
            .from('trn_session_resources_allocated')
            .select('id, session_id, resource_id, allocated_quantity, status, notes, trn_course_resources(resource_title, resource_type, visibility_scope)')
            .in('session_id', sessionIds)
            .limit(120),
        )
      : Promise.resolve({ data: [], error: null }),
    sessionIds.length
      ? listOrEmpty<any>(
          supabase
            .from('trn_session_dates')
            .select('id, session_id, date_label, start_at, end_at, location_address, status, metadata')
            .in('session_id', sessionIds)
            .order('start_at', { ascending: true, nullsFirst: false })
            .limit(120),
        )
      : Promise.resolve({ data: [], error: null }),
    sessionIds.length
      ? listOrEmpty<any>(
          supabase
            .from('trn_delivery_checklists')
            .select('id, session_id, checklist_type, checklist_title, status, completed_at, metadata')
            .in('session_id', sessionIds)
            .order('created_at', { ascending: false })
            .limit(120),
        )
      : Promise.resolve({ data: [], error: null }),
    sessionIds.length
      ? listOrEmpty<any>(
          supabase
            .from('trn_certificates')
            .select('id, session_id, certificate_number, status, issued_at, certificate_url, participant_id')
            .in('session_id', sessionIds)
            .order('issued_at', { ascending: false, nullsFirst: false })
            .limit(120),
        )
      : Promise.resolve({ data: [], error: null }),
  ])

  const queryWarnings = [assignedLinkResult, sessions, participants, attendance, resources, dates, checklists, certificates]
    .map((result) => result.error)
    .filter(Boolean) as string[]

  return (
    <TrainingHubTrainerCockpitWorkspace
      context={context}
      sessions={sessions.data}
      participants={participants.data}
      attendance={attendance.data}
      resources={resources.data}
      dates={dates.data}
      checklists={checklists.data}
      certificates={certificates.data}
      queryWarnings={queryWarnings}
      adminPreview={adminPreview}
    />
  )
}
