import { createTrainingHubUserClient } from './supabase'
import { TrainingHubHttpError, requireTrainingHubPermission } from './auth'
import type { JsonRecord, TrainingHubContext } from './types'

const RESOURCE_LIST_LIMIT_DEFAULT = 50
const RESOURCE_LIST_LIMIT_MAX = 200

function text(value: unknown) {
  return String(value || '').trim()
}

function normalizeLimit(value: string | null) {
  const n = Number(value || '')
  if (!Number.isFinite(n) || n <= 0) return RESOURCE_LIST_LIMIT_DEFAULT
  return Math.min(Math.floor(n), RESOURCE_LIST_LIMIT_MAX)
}

function canManageResources(context: TrainingHubContext) {
  return context.isSuperAdmin || context.isInternal
}

function requireResourceManager(context: TrainingHubContext) {
  if (!canManageResources(context)) {
    throw new TrainingHubHttpError('Internal TrainingHub resource control required.', 403, 'TRAININGHUB_INTERNAL_ONLY')
  }
  requireTrainingHubPermission(context, ['training.catalogue.update', 'training.catalogue.publish', 'elearning.module.assign'])
}

function normalizeResource(row: any) {
  return {
    ...row,
    course: row.trn_courses || row.course || null,
    course_version: row.trn_course_versions || row.course_version || null,
    trn_courses: undefined,
    trn_course_versions: undefined,
  }
}

export async function listTrainingHubResources(context: TrainingHubContext, url: URL) {
  const supabase = await createTrainingHubUserClient()
  const limit = normalizeLimit(url.searchParams.get('limit'))
  const q = text(url.searchParams.get('q'))
  const visibility = text(url.searchParams.get('visibility'))
  const resourceType = text(url.searchParams.get('type'))
  const courseRef = text(url.searchParams.get('course_ref') || url.searchParams.get('courseRef'))
  const status = text(url.searchParams.get('status') || 'active')

  let query = supabase
    .from('trn_course_resources')
    .select(`
      id,
      course_id,
      course_version_id,
      resource_title,
      resource_type,
      file_url,
      visibility_scope,
      requires_entitlement,
      status,
      created_at,
      metadata,
      trn_courses(id, ref, title, category_id, status, publication_status),
      trn_course_versions(id, version_label, is_current, status)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status) query = query.eq('status', status)
  if (visibility) query = query.eq('visibility_scope', visibility)
  if (resourceType) query = query.eq('resource_type', resourceType)
  if (q) query = query.ilike('resource_title', `%${q}%`)

  if (courseRef) {
    const { data: course, error: courseError } = await supabase
      .from('trn_courses')
      .select('id')
      .eq('ref', courseRef)
      .single()
    if (courseError || !course?.id) throw new TrainingHubHttpError('TrainingHub course not found.', 404, 'TRAININGHUB_COURSE_NOT_FOUND')
    query = query.eq('course_id', course.id)
  }

  const { data, error } = await query
  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_RESOURCES_LIST_FAILED')

  return (data || []).map(normalizeResource)
}

export async function listTrainingHubCourseResources(context: TrainingHubContext, ref: string) {
  const courseRef = text(ref).toUpperCase()
  if (!courseRef) throw new TrainingHubHttpError('Missing course reference.', 400, 'TRAININGHUB_COURSE_REF_REQUIRED')

  const supabase = await createTrainingHubUserClient()
  const { data: course, error: courseError } = await supabase
    .from('trn_courses')
    .select('id, ref, title, category_id, status, publication_status')
    .eq('ref', courseRef)
    .single()

  if (courseError || !course?.id) throw new TrainingHubHttpError('TrainingHub course not found.', 404, 'TRAININGHUB_COURSE_NOT_FOUND')

  const { data, error } = await supabase
    .from('trn_course_resources')
    .select(`
      id,
      course_id,
      course_version_id,
      resource_title,
      resource_type,
      file_url,
      visibility_scope,
      requires_entitlement,
      status,
      created_at,
      metadata,
      trn_course_versions(id, version_label, is_current, status)
    `)
    .eq('course_id', course.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_COURSE_RESOURCES_LIST_FAILED')

  return {
    course,
    resources: (data || []).map((row: any) => ({
      ...row,
      course,
      course_version: row.trn_course_versions || null,
      trn_course_versions: undefined,
    })),
  }
}

export async function createTrainingHubCourseResource(context: TrainingHubContext, body: any) {
  requireResourceManager(context)
  const supabase = await createTrainingHubUserClient()
  const courseRef = text(body?.course_ref || body?.courseRef).toUpperCase()
  const courseIdInput = text(body?.course_id || body?.courseId)
  const title = text(body?.resource_title || body?.resourceTitle || body?.title)

  if (!title) throw new TrainingHubHttpError('Resource title is required.', 400, 'TRAININGHUB_RESOURCE_TITLE_REQUIRED')

  let courseId = courseIdInput || null
  if (!courseId && courseRef) {
    const { data: course, error } = await supabase.from('trn_courses').select('id').eq('ref', courseRef).single()
    if (error || !course?.id) throw new TrainingHubHttpError('TrainingHub course not found.', 404, 'TRAININGHUB_COURSE_NOT_FOUND')
    courseId = course.id
  }
  if (!courseId) throw new TrainingHubHttpError('course_id or course_ref is required.', 400, 'TRAININGHUB_RESOURCE_COURSE_REQUIRED')

  const payload = {
    course_id: courseId,
    course_version_id: text(body?.course_version_id || body?.courseVersionId) || null,
    resource_title: title,
    resource_type: text(body?.resource_type || body?.resourceType || 'document') || 'document',
    file_url: text(body?.file_url || body?.fileUrl) || null,
    visibility_scope: text(body?.visibility_scope || body?.visibilityScope || 'partner_owner') || 'partner_owner',
    requires_entitlement: body?.requires_entitlement ?? body?.requiresEntitlement ?? true,
    status: text(body?.status || 'active') || 'active',
    metadata: (body?.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)) ? body.metadata as JsonRecord : {},
  }

  const { data, error } = await supabase.from('trn_course_resources').insert(payload).select('*').single()
  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_RESOURCE_CREATE_FAILED')
  return data
}
