import { createTrainingHubUserClient } from './supabase'
import { TrainingHubHttpError, requireTrainingHubPermission } from './auth'
import type { JsonRecord, TrainingHubContext } from './types'

const MODULE_LIST_LIMIT_DEFAULT = 50
const MODULE_LIST_LIMIT_MAX = 200

function text(value: unknown) {
  return String(value || '').trim()
}

function nullableText(value: unknown) {
  const out = text(value)
  return out || null
}

function normalizeLimit(value: string | null) {
  const n = Number(value || '')
  if (!Number.isFinite(n) || n <= 0) return MODULE_LIST_LIMIT_DEFAULT
  return Math.min(Math.floor(n), MODULE_LIST_LIMIT_MAX)
}

function requireLearningManager(context: TrainingHubContext) {
  if (!context.isInternal && !context.isSuperAdmin) {
    throw new TrainingHubHttpError('Internal TrainingHub e-learning control required.', 403, 'TRAININGHUB_INTERNAL_ONLY')
  }
  requireTrainingHubPermission(context, ['elearning.module.assign', 'training.session.complete', 'training.catalogue.update'])
}

function contextCanAccessOrg(context: TrainingHubContext, organizationId: string) {
  return context.isInternal || context.isSuperAdmin || context.organizationIds.includes(organizationId)
}

function requireOrgAccess(context: TrainingHubContext, organizationId: string) {
  if (!contextCanAccessOrg(context, organizationId)) {
    throw new TrainingHubHttpError('Cannot access another TrainingHub organization.', 403, 'TRAININGHUB_ORG_FORBIDDEN')
  }
}

function normalizeModule(row: any) {
  return {
    ...row,
    course: row.trn_courses || row.course || null,
    course_version: row.trn_course_versions || row.course_version || null,
    lessons_count: Array.isArray(row.learn_lessons) ? row.learn_lessons.length : undefined,
    quizzes_count: Array.isArray(row.learn_quizzes) ? row.learn_quizzes.length : undefined,
    trn_courses: undefined,
    trn_course_versions: undefined,
    learn_lessons: undefined,
    learn_quizzes: undefined,
  }
}

async function writeEvent(
  eventType: string,
  context: TrainingHubContext,
  sourceType: string,
  sourceId: string,
  organizationId: string | null,
  siteId: string | null,
  payload: JsonRecord,
) {
  const supabase = await createTrainingHubUserClient()
  await supabase.from('auto_events').insert({
    event_type: eventType,
    organization_id: organizationId,
    site_id: siteId,
    actor_user_id: context.profile.id,
    source_type: sourceType,
    source_id: sourceId,
    payload,
    status: 'pending',
  })
}

export async function listTrainingHubLearningModules(context: TrainingHubContext, url: URL) {
  const supabase = await createTrainingHubUserClient()
  const limit = normalizeLimit(url.searchParams.get('limit'))
  const q = text(url.searchParams.get('q'))
  const status = text(url.searchParams.get('status') || 'active')
  const courseRef = text(url.searchParams.get('course_ref') || url.searchParams.get('courseRef')).toUpperCase()

  let query = supabase
    .from('learn_modules')
    .select(`
      id,
      course_id,
      course_version_id,
      module_code,
      title,
      description,
      module_type,
      estimated_minutes,
      status,
      created_at,
      updated_at,
      metadata,
      trn_courses(id, ref, title, category_id, status, publication_status),
      trn_course_versions(id, version_label, is_current, status),
      learn_lessons(id),
      learn_quizzes(id)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status) query = query.eq('status', status)
  if (q) query = query.or(`title.ilike.%${q}%,module_code.ilike.%${q}%,description.ilike.%${q}%`)

  if (courseRef) {
    const { data: course, error: courseError } = await supabase.from('trn_courses').select('id').eq('ref', courseRef).single()
    if (courseError || !course?.id) throw new TrainingHubHttpError('TrainingHub course not found.', 404, 'TRAININGHUB_COURSE_NOT_FOUND')
    query = query.eq('course_id', course.id)
  }

  const { data, error } = await query
  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_LEARNING_MODULES_LIST_FAILED')
  return (data || []).map(normalizeModule)
}

export async function getTrainingHubLearningModuleById(context: TrainingHubContext, id: string) {
  const moduleId = text(id)
  if (!moduleId) throw new TrainingHubHttpError('Missing e-learning module id.', 400, 'TRAININGHUB_MODULE_ID_REQUIRED')
  const supabase = await createTrainingHubUserClient()

  const { data, error } = await supabase
    .from('learn_modules')
    .select(`
      *,
      trn_courses(id, ref, title, category_id, status, publication_status),
      trn_course_versions(id, version_label, is_current, status)
    `)
    .eq('id', moduleId)
    .single()

  if (error || !data) throw new TrainingHubHttpError('TrainingHub e-learning module not found.', 404, 'TRAININGHUB_MODULE_NOT_FOUND')

  const [{ data: lessons, error: lessonsError }, { data: quizzes, error: quizzesError }, { data: assignments, error: assignmentsError }] = await Promise.all([
    supabase.from('learn_lessons').select('*').eq('module_id', moduleId).order('display_order', { ascending: true }),
    supabase.from('learn_quizzes').select('*').eq('module_id', moduleId).order('created_at', { ascending: true }),
    supabase.from('learn_assignments').select('*').eq('module_id', moduleId).order('assigned_at', { ascending: false }).limit(200),
  ])

  if (lessonsError) throw new TrainingHubHttpError(lessonsError.message, 500, 'TRAININGHUB_LESSONS_LOAD_FAILED')
  if (quizzesError) throw new TrainingHubHttpError(quizzesError.message, 500, 'TRAININGHUB_QUIZZES_LOAD_FAILED')
  if (assignmentsError && (context.isInternal || context.isSuperAdmin)) {
    throw new TrainingHubHttpError(assignmentsError.message, 500, 'TRAININGHUB_ASSIGNMENTS_LOAD_FAILED')
  }

  return {
    ...normalizeModule(data),
    lessons: lessons || [],
    quizzes: quizzes || [],
    assignments: assignments || [],
  }
}

export async function listTrainingHubLearningEntitlements(context: TrainingHubContext, url: URL) {
  const supabase = await createTrainingHubUserClient()
  const organizationId = text(url.searchParams.get('organization_id') || url.searchParams.get('organizationId'))
  const status = text(url.searchParams.get('status'))
  const limit = normalizeLimit(url.searchParams.get('limit'))

  if (organizationId) requireOrgAccess(context, organizationId)

  let query = supabase
    .from('learn_entitlements')
    .select(`
      id,
      organization_id,
      site_id,
      course_id,
      module_id,
      source_session_id,
      source_order_item_id,
      status,
      unlocked_at,
      valid_until,
      access_policy,
      metadata,
      core_organizations(id, name, organization_type, status),
      trn_courses(id, ref, title),
      learn_modules(id, module_code, title, module_type, status)
    `)
    .order('unlocked_at', { ascending: false })
    .limit(limit)

  if (organizationId) query = query.eq('organization_id', organizationId)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_LEARNING_ENTITLEMENTS_LIST_FAILED')
  return data || []
}

export async function assignTrainingHubLearningModule(context: TrainingHubContext, moduleId: string, body: any) {
  requireLearningManager(context)
  const id = text(moduleId)
  if (!id) throw new TrainingHubHttpError('Missing e-learning module id.', 400, 'TRAININGHUB_MODULE_ID_REQUIRED')

  const userIds = Array.isArray(body?.user_ids || body?.userIds)
    ? (body.user_ids || body.userIds).map((item: unknown) => text(item)).filter(Boolean)
    : [text(body?.user_id || body?.userId)].filter(Boolean)

  if (!userIds.length) throw new TrainingHubHttpError('At least one TrainingHub user_id is required.', 400, 'TRAININGHUB_ASSIGNMENT_USERS_REQUIRED')

  const organizationId = text(body?.organization_id || body?.organizationId)
  if (!organizationId) throw new TrainingHubHttpError('organization_id is required.', 400, 'TRAININGHUB_ASSIGNMENT_ORG_REQUIRED')
  requireOrgAccess(context, organizationId)

  const supabase = await createTrainingHubUserClient()
  const { data: module, error: moduleError } = await supabase.from('learn_modules').select('id, course_id, module_code, title').eq('id', id).single()
  if (moduleError || !module?.id) throw new TrainingHubHttpError('TrainingHub e-learning module not found.', 404, 'TRAININGHUB_MODULE_NOT_FOUND')

  const dueAt = nullableText(body?.due_at || body?.dueAt)
  const rows = userIds.map((userId: string) => ({
    organization_id: organizationId,
    module_id: id,
    user_id: userId,
    assigned_by: context.profile.id,
    assigned_at: new Date().toISOString(),
    due_at: dueAt,
    status: 'assigned',
    metadata: (body?.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)) ? body.metadata as JsonRecord : {},
  }))

  const { data, error } = await supabase.from('learn_assignments').insert(rows).select('*')
  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_LEARNING_ASSIGNMENT_FAILED')

  await writeEvent('elearning.assigned', context, 'learn_modules', id, organizationId, nullableText(body?.site_id || body?.siteId), {
    module_id: id,
    module_code: module.module_code,
    assigned_user_count: rows.length,
  })

  return data || []
}

export async function updateTrainingHubLearningProgress(context: TrainingHubContext, body: any) {
  const supabase = await createTrainingHubUserClient()
  const assignmentId = text(body?.assignment_id || body?.assignmentId)
  const moduleId = text(body?.module_id || body?.moduleId)
  const userId = text(body?.user_id || body?.userId || context.profile.id)

  if (!moduleId && !assignmentId) {
    throw new TrainingHubHttpError('module_id or assignment_id is required.', 400, 'TRAININGHUB_PROGRESS_TARGET_REQUIRED')
  }

  if (userId !== context.profile.id && !context.isInternal && !context.isSuperAdmin) {
    throw new TrainingHubHttpError('Cannot update another participant e-learning progress.', 403, 'TRAININGHUB_PROGRESS_USER_FORBIDDEN')
  }

  const progressPercentRaw = Number(body?.progress_percent ?? body?.progressPercent ?? 0)
  const progressPercent = Math.max(0, Math.min(100, Number.isFinite(progressPercentRaw) ? progressPercentRaw : 0))
  const status = text(body?.status || (progressPercent >= 100 ? 'completed' : progressPercent > 0 ? 'in_progress' : 'assigned'))
  const now = new Date().toISOString()

  const payload: JsonRecord = {
    assignment_id: assignmentId || null,
    module_id: moduleId || null,
    user_id: userId,
    progress_percent: progressPercent,
    status,
    last_activity_at: now,
    metadata: (body?.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)) ? body.metadata as JsonRecord : {},
  }
  if (status === 'in_progress' || progressPercent > 0) payload.started_at = body?.started_at || body?.startedAt || now
  if (status === 'completed' || progressPercent >= 100) payload.completed_at = body?.completed_at || body?.completedAt || now

  const { data, error } = await supabase
    .from('learn_progress')
    .upsert(payload, assignmentId ? { onConflict: 'assignment_id,user_id' } : { onConflict: 'module_id,user_id' })
    .select('*')
    .single()

  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_PROGRESS_UPDATE_FAILED')
  return data
}

export async function listTrainingHubCertificates(context: TrainingHubContext, url: URL) {
  const supabase = await createTrainingHubUserClient()
  const organizationId = text(url.searchParams.get('organization_id') || url.searchParams.get('organizationId'))
  const userId = text(url.searchParams.get('user_id') || url.searchParams.get('userId'))
  const limit = normalizeLimit(url.searchParams.get('limit'))

  if (organizationId) requireOrgAccess(context, organizationId)
  if (userId && userId !== context.profile.id && !context.isInternal && !context.isSuperAdmin) {
    throw new TrainingHubHttpError('Cannot access another user certificates.', 403, 'TRAININGHUB_CERTIFICATES_USER_FORBIDDEN')
  }

  const trainingQuery = supabase
    .from('trn_certificates')
    .select(`
      id,
      organization_id,
      session_id,
      participant_id,
      course_id,
      certificate_number,
      certificate_url,
      issued_at,
      issued_by,
      status,
      metadata,
      trn_courses(id, ref, title),
      trn_session_participants(id, full_name, email, user_id)
    `)
    .order('issued_at', { ascending: false })
    .limit(limit)

  if (organizationId) trainingQuery.eq('organization_id', organizationId)

  const learningQuery = supabase
    .from('learn_certificates')
    .select(`
      id,
      organization_id,
      module_id,
      user_id,
      certificate_number,
      certificate_url,
      issued_at,
      status,
      metadata,
      learn_modules(id, module_code, title)
    `)
    .order('issued_at', { ascending: false })
    .limit(limit)

  if (organizationId) learningQuery.eq('organization_id', organizationId)
  if (userId) learningQuery.eq('user_id', userId)

  const [{ data: training, error: trainingError }, { data: learning, error: learningError }] = await Promise.all([trainingQuery, learningQuery])
  if (trainingError) throw new TrainingHubHttpError(trainingError.message, 500, 'TRAININGHUB_TRAINING_CERTIFICATES_LIST_FAILED')
  if (learningError) throw new TrainingHubHttpError(learningError.message, 500, 'TRAININGHUB_LEARNING_CERTIFICATES_LIST_FAILED')

  return {
    training: training || [],
    learning: learning || [],
  }
}
