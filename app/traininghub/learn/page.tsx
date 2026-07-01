import TrainingHubLearnerWorkspace from '@/components/traininghub/TrainingHubLearnerWorkspace'
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

export default async function TrainingHubLearnerSpacePage() {
  const context = await requireTrainingHubExperiencePageContext('learner')
  const supabase = await createTrainingHubUserClient()
  const adminPreview = context.isInternal || context.isSuperAdmin
  const organizationIds = context.organizationIds
  const userEmail = String(context.profile.email || '').trim().toLowerCase()

  const [assignments, progress, certificates, reminders, entitlements, participantRecords, resources] = await Promise.all([
    listOrEmpty<any>(
      supabase
        .from('learn_assignments')
        .select('id, organization_id, site_id, module_id, user_id, assigned_at, due_at, status, completion_status, completed_at, metadata, learn_modules(id, module_code, title, summary, estimated_minutes, status, course_id, trn_courses(ref, title, trn_categories(code, name)))')
        .eq('user_id', context.profile.id)
        .order('assigned_at', { ascending: false })
        .limit(80),
    ),
    listOrEmpty<any>(
      supabase
        .from('learn_progress')
        .select('id, organization_id, site_id, module_id, lesson_id, user_id, progress_status, progress_percent, last_accessed_at, completed_at, score_percent, metadata, learn_modules(id, module_code, title, estimated_minutes, trn_courses(ref, title))')
        .eq('user_id', context.profile.id)
        .order('last_accessed_at', { ascending: false, nullsFirst: false })
        .limit(120),
    ),
    listOrEmpty<any>(
      supabase
        .from('learn_certificates')
        .select('id, organization_id, site_id, module_id, user_id, certificate_number, certificate_url, status, issued_at, expires_at, learn_modules(id, module_code, title, trn_courses(ref, title))')
        .eq('user_id', context.profile.id)
        .order('issued_at', { ascending: false, nullsFirst: false })
        .limit(80),
    ),
    listOrEmpty<any>(
      supabase
        .from('learn_refresh_reminders')
        .select('id, organization_id, site_id, module_id, user_id, reminder_type, reminder_status, due_at, sent_at, completed_at, metadata, learn_modules(module_code, title)')
        .eq('user_id', context.profile.id)
        .order('due_at', { ascending: true, nullsFirst: false })
        .limit(80),
    ),
    organizationIds.length
      ? listOrEmpty<any>(
          supabase
            .from('learn_entitlements')
            .select('id, organization_id, site_id, course_id, module_id, status, access_policy, unlocked_at, valid_until, learn_modules(id, module_code, title, estimated_minutes, status, trn_courses(ref, title))')
            .in('organization_id', organizationIds)
            .order('unlocked_at', { ascending: false, nullsFirst: false })
            .limit(80),
        )
      : Promise.resolve({ data: [], error: null }),
    userEmail
      ? listOrEmpty<any>(
          supabase
            .from('trn_session_participants')
            .select('id, organization_id, site_id, session_id, user_id, full_name, email, job_title, attendance_status, certificate_status, refresh_access_status, trn_sessions(session_code, status, scheduled_start_at, trn_courses(ref, title))')
            .eq('email', userEmail)
            .order('created_at', { ascending: false })
            .limit(80),
        )
      : Promise.resolve({ data: [], error: null }),
    listOrEmpty<any>(
      supabase
        .from('trn_course_resources')
        .select('id, course_id, resource_title, resource_type, visibility_scope, status, trn_courses(ref, title)')
        .in('visibility_scope', ['public', 'partner', 'participant', 'staff'])
        .order('created_at', { ascending: false })
        .limit(80),
    ),
  ])

  const queryWarnings = [assignments, progress, certificates, reminders, entitlements, participantRecords, resources]
    .map((result) => result.error)
    .filter(Boolean) as string[]

  return (
    <TrainingHubLearnerWorkspace
      context={context}
      assignments={assignments.data}
      progress={progress.data}
      certificates={certificates.data}
      reminders={reminders.data}
      entitlements={entitlements.data}
      participantRecords={participantRecords.data}
      resources={resources.data}
      queryWarnings={queryWarnings}
      adminPreview={adminPreview}
    />
  )
}
