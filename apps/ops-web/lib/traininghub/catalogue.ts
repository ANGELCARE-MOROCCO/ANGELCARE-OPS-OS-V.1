import { createTrainingHubUserClient } from './supabase'
import type {
  JsonRecord,
  TrainingHubCatalogueSummary,
  TrainingHubCategory,
  TrainingHubContext,
  TrainingHubCourse,
  TrainingHubCourseReadiness,
  TrainingHubCourseReadinessItem,
  TrainingHubCourseVersion,
} from './types'
import { TrainingHubHttpError, requireTrainingHubPermission } from './auth'

const COURSE_UPDATE_FIELDS = new Set([
  'title',
  'short_description',
  'commercial_description',
  'owner_alert',
  'positioning_tags',
  'onsite_entry_price_minor',
  'refresh_entry_price_minor',
  'currency_code',
  'starter_min_participants',
  'starter_max_participants',
  'min_hours',
  'max_hours',
  'has_refresh_module',
  'publication_status',
  'status',
  'metadata',
])

function normalizeLimit(value: string | null, fallback = 100, max = 500) {
  const parsed = Number(value || '')
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.min(Math.floor(parsed), max)
}

function normalizeSearch(value: string | null) {
  return String(value || '').trim()
}

function normalizeRef(ref: string) {
  const value = String(ref || '').trim().toUpperCase()
  if (!value) throw new TrainingHubHttpError('Missing course reference.', 400, 'TRAININGHUB_MISSING_COURSE_REF')
  return value
}

function normalizeCategoryCode(code: string) {
  const value = String(code || '').trim().toUpperCase()
  if (!value) throw new TrainingHubHttpError('Missing category code.', 400, 'TRAININGHUB_MISSING_CATEGORY_CODE')
  return value
}

function normalizeCourse(row: any): TrainingHubCourse {
  return {
    ...row,
    category: row.trn_categories || row.category || null,
    trn_categories: undefined,
  } as TrainingHubCourse
}

function requireInternalCatalogueControl(context: TrainingHubContext, permission: string) {
  if (!context.isInternal && !context.isSuperAdmin) {
    throw new TrainingHubHttpError('Internal TrainingHub catalogue control required.', 403, 'TRAININGHUB_INTERNAL_ONLY')
  }
  requireTrainingHubPermission(context, permission)
}

function withCatalogueVisibility<T extends { publication_status?: string | null; status?: string | null }>(rows: T[], context: TrainingHubContext) {
  if (context.isInternal) return rows
  return rows.filter((row) => row.status === 'active' && row.publication_status === 'published')
}

function sanitizeCoursePatch(body: unknown) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new TrainingHubHttpError('Invalid course update payload.', 400, 'TRAININGHUB_INVALID_PATCH')
  }

  const source = body as JsonRecord
  const patch: JsonRecord = {}

  for (const [key, value] of Object.entries(source)) {
    if (!COURSE_UPDATE_FIELDS.has(key)) continue
    patch[key] = value
  }

  if (!Object.keys(patch).length) {
    throw new TrainingHubHttpError('No allowed course fields provided.', 400, 'TRAININGHUB_EMPTY_PATCH')
  }

  patch.updated_at = new Date().toISOString()
  return patch
}

async function getCourseOrThrow(context: TrainingHubContext, ref: string) {
  const supabase = await createTrainingHubUserClient()
  const courseRef = normalizeRef(ref)

  const { data, error } = await supabase
    .from('trn_courses')
    .select(`
      *,
      trn_categories(id, code, name, subtitle, description, owner_promise, market_risk, display_order, status)
    `)
    .eq('ref', courseRef)
    .maybeSingle()

  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_COURSE_LOAD_FAILED')
  if (!data) throw new TrainingHubHttpError('TrainingHub course not found.', 404, 'TRAININGHUB_COURSE_NOT_FOUND')

  const course = normalizeCourse(data)

  if (!context.isInternal && (course.status !== 'active' || course.publication_status !== 'published')) {
    throw new TrainingHubHttpError('TrainingHub course not available.', 404, 'TRAININGHUB_COURSE_NOT_AVAILABLE')
  }

  return course
}

export async function getTrainingHubCatalogueSummary(context: TrainingHubContext): Promise<TrainingHubCatalogueSummary> {
  const supabase = await createTrainingHubUserClient()

  const [categoriesRes, coursesRes, modulesRes, resourcesRes, kitsRes, checksRes] = await Promise.all([
    supabase.from('trn_categories').select('id, code, name, subtitle, description, owner_promise, market_risk, display_order, status').order('display_order', { ascending: true }).order('code', { ascending: true }),
    supabase.from('trn_courses').select('id, category_id, publication_status, status'),
    supabase.from('learn_modules').select('id'),
    supabase.from('trn_course_resources').select('id'),
    supabase.from('trn_course_kits').select('id'),
    supabase.from('trn_course_publication_checklist').select('id'),
  ])

  for (const result of [categoriesRes, coursesRes, modulesRes, resourcesRes, kitsRes, checksRes]) {
    if (result.error) throw new TrainingHubHttpError(result.error.message, 500, 'TRAININGHUB_CATALOGUE_SUMMARY_FAILED')
  }

  const categories = (categoriesRes.data || []) as TrainingHubCategory[]
  const courses = withCatalogueVisibility((coursesRes.data || []) as Array<{ id: string; category_id: string; publication_status: string | null; status: string | null }>, context)
  const byCategory = categories.map((category) => {
    const rows = courses.filter((course) => course.category_id === category.id)
    return {
      ...category,
      course_count: rows.length,
      published_count: rows.filter((course) => course.publication_status === 'published').length,
      draft_count: rows.filter((course) => course.publication_status === 'draft').length,
      archived_count: rows.filter((course) => course.status === 'archived' || course.publication_status === 'archived').length,
    }
  })

  return {
    categories: categories.length,
    courses: courses.length,
    publishedCourses: courses.filter((course) => course.publication_status === 'published').length,
    draftCourses: courses.filter((course) => course.publication_status === 'draft').length,
    archivedCourses: courses.filter((course) => course.status === 'archived' || course.publication_status === 'archived').length,
    refreshModules: modulesRes.data?.length || 0,
    resources: resourcesRes.data?.length || 0,
    kits: kitsRes.data?.length || 0,
    publicationChecks: checksRes.data?.length || 0,
    byCategory,
  }
}

export async function getTrainingHubCategories(context: TrainingHubContext) {
  const supabase = await createTrainingHubUserClient()
  let query = supabase
    .from('trn_categories')
    .select('id, code, name, subtitle, description, owner_promise, market_risk, display_order, status')
    .order('display_order', { ascending: true })
    .order('code', { ascending: true })

  if (!context.isInternal) query = query.eq('status', 'active')

  const { data, error } = await query
  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_CATEGORIES_LOAD_FAILED')

  return (data || []) as TrainingHubCategory[]
}

export async function getTrainingHubCategoryByCode(context: TrainingHubContext, code: string) {
  const supabase = await createTrainingHubUserClient()
  const categoryCode = normalizeCategoryCode(code)

  const { data: category, error: categoryError } = await supabase
    .from('trn_categories')
    .select('id, code, name, subtitle, description, owner_promise, market_risk, display_order, status')
    .eq('code', categoryCode)
    .maybeSingle()

  if (categoryError) throw new TrainingHubHttpError(categoryError.message, 500, 'TRAININGHUB_CATEGORY_LOAD_FAILED')
  if (!category) throw new TrainingHubHttpError('TrainingHub category not found.', 404, 'TRAININGHUB_CATEGORY_NOT_FOUND')
  if (!context.isInternal && category.status !== 'active') {
    throw new TrainingHubHttpError('TrainingHub category not available.', 404, 'TRAININGHUB_CATEGORY_NOT_AVAILABLE')
  }

  let courseQuery = supabase
    .from('trn_courses')
    .select(`
      id,
      category_id,
      ref,
      title,
      short_description,
      commercial_description,
      owner_alert,
      positioning_tags,
      onsite_entry_price_minor,
      refresh_entry_price_minor,
      currency_code,
      starter_min_participants,
      starter_max_participants,
      min_hours,
      max_hours,
      has_refresh_module,
      publication_status,
      status,
      trn_categories(id, code, name, subtitle, display_order, status)
    `)
    .eq('category_id', category.id)
    .order('ref', { ascending: true })

  if (!context.isInternal) courseQuery = courseQuery.eq('status', 'active').eq('publication_status', 'published')

  const { data: courses, error: coursesError } = await courseQuery
  if (coursesError) throw new TrainingHubHttpError(coursesError.message, 500, 'TRAININGHUB_CATEGORY_COURSES_LOAD_FAILED')

  return {
    category: category as TrainingHubCategory,
    courses: (courses || []).map(normalizeCourse),
  }
}

export async function getTrainingHubCourses(context: TrainingHubContext, url: URL) {
  const supabase = await createTrainingHubUserClient()
  const category = normalizeSearch(url.searchParams.get('category'))
  const search = normalizeSearch(url.searchParams.get('q'))
  const limit = normalizeLimit(url.searchParams.get('limit'), 100, 300)

  let query = supabase
    .from('trn_courses')
    .select(`
      id,
      category_id,
      ref,
      title,
      short_description,
      commercial_description,
      owner_alert,
      positioning_tags,
      onsite_entry_price_minor,
      refresh_entry_price_minor,
      currency_code,
      starter_min_participants,
      starter_max_participants,
      min_hours,
      max_hours,
      has_refresh_module,
      publication_status,
      status,
      trn_categories(id, code, name, subtitle, display_order, status)
    `)
    .order('ref', { ascending: true })
    .limit(limit)

  if (!context.isInternal) query = query.eq('status', 'active').eq('publication_status', 'published')
  if (category) query = query.eq('trn_categories.code', category.toUpperCase())
  if (search) query = query.or(`ref.ilike.%${search}%,title.ilike.%${search}%,short_description.ilike.%${search}%`)

  const { data, error } = await query
  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_COURSES_LOAD_FAILED')

  return withCatalogueVisibility((data || []).map(normalizeCourse), context)
}

export async function getTrainingHubCourseByRef(context: TrainingHubContext, ref: string) {
  return getCourseOrThrow(context, ref)
}

export async function getTrainingHubCourseFullByRef(context: TrainingHubContext, ref: string) {
  const supabase = await createTrainingHubUserClient()
  const course = await getCourseOrThrow(context, ref)

  const [versionsRes, kitsRes, resourcesRes, refreshRes, checklistRes] = await Promise.all([
    supabase
      .from('trn_course_versions')
      .select('*')
      .eq('course_id', course.id)
      .order('is_current', { ascending: false })
      .order('valid_from', { ascending: false, nullsFirst: false }),
    supabase
      .from('trn_course_kits')
      .select('*')
      .eq('course_id', course.id)
      .order('display_order', { ascending: true }),
    supabase
      .from('trn_course_resources')
      .select('id, course_id, course_version_id, resource_title, resource_type, visibility_scope, requires_entitlement, status, metadata')
      .eq('course_id', course.id)
      .order('resource_title', { ascending: true }),
    supabase
      .from('learn_modules')
      .select('id, course_id, course_version_id, module_code, title, description, module_type, estimated_minutes, status, metadata')
      .eq('course_id', course.id)
      .order('module_code', { ascending: true }),
    supabase
      .from('trn_course_publication_checklist')
      .select('*')
      .eq('course_id', course.id)
      .maybeSingle(),
  ])

  for (const [code, result] of [
    ['TRAININGHUB_COURSE_VERSIONS_LOAD_FAILED', versionsRes],
    ['TRAININGHUB_COURSE_KITS_LOAD_FAILED', kitsRes],
    ['TRAININGHUB_COURSE_RESOURCES_LOAD_FAILED', resourcesRes],
    ['TRAININGHUB_COURSE_REFRESH_LOAD_FAILED', refreshRes],
    ['TRAININGHUB_COURSE_CHECKLIST_LOAD_FAILED', checklistRes],
  ] as const) {
    if (result.error) throw new TrainingHubHttpError(result.error.message, 500, code)
  }

  const versions = (versionsRes.data || []) as TrainingHubCourseVersion[]
  const currentVersion = versions.find((version) => version.is_current) || versions[0] || null

  let blocks: unknown[] = []
  if (currentVersion?.id) {
    const { data, error } = await supabase
      .from('trn_course_blocks')
      .select('*')
      .eq('course_version_id', currentVersion.id)
      .order('display_order', { ascending: true })

    if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_COURSE_BLOCKS_LOAD_FAILED')
    blocks = data || []
  }

  return {
    course,
    versions,
    currentVersion,
    blocks,
    kits: kitsRes.data || [],
    resources: resourcesRes.data || [],
    refreshModules: refreshRes.data || [],
    publicationChecklist: checklistRes.data || null,
  }
}

export async function updateTrainingHubCourseByRef(context: TrainingHubContext, ref: string, body: unknown) {
  requireInternalCatalogueControl(context, 'training.catalogue.update')
  const supabase = await createTrainingHubUserClient()
  const course = await getCourseOrThrow(context, ref)
  const patch = sanitizeCoursePatch(body)

  const { data, error } = await supabase
    .from('trn_courses')
    .update(patch)
    .eq('id', course.id)
    .select(`
      *,
      trn_categories(id, code, name, subtitle, description, owner_promise, market_risk, display_order, status)
    `)
    .maybeSingle()

  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_COURSE_UPDATE_FAILED')
  if (!data) throw new TrainingHubHttpError('TrainingHub course update returned no row.', 500, 'TRAININGHUB_COURSE_UPDATE_EMPTY')

  return normalizeCourse(data)
}

function readinessItem(key: string, label: string, passed: boolean, detail?: string): TrainingHubCourseReadinessItem {
  return { key, label, passed, detail }
}

export async function runTrainingHubCoursePublishCheck(context: TrainingHubContext, ref: string): Promise<TrainingHubCourseReadiness> {
  requireInternalCatalogueControl(context, 'training.catalogue.publish')
  const supabase = await createTrainingHubUserClient()
  const full = await getTrainingHubCourseFullByRef(context, ref)
  const course = full.course
  const hasCurrentVersion = Boolean(full.currentVersion?.id)
  const blockCount = Array.isArray(full.blocks) ? full.blocks.length : 0
  const kitCount = Array.isArray(full.kits) ? full.kits.length : 0
  const refreshCount = Array.isArray(full.refreshModules) ? full.refreshModules.length : 0

  const items = [
    readinessItem('reference_validated', 'Course reference and title exist', Boolean(course.ref && course.title), course.ref),
    readinessItem('price_validated', 'Onsite and refresh prices exist', Number(course.onsite_entry_price_minor || 0) > 0 && Number(course.refresh_entry_price_minor || 0) > 0),
    readinessItem('promise_validated', 'Commercial promise and owner alert exist', Boolean(course.commercial_description && course.owner_alert)),
    readinessItem('trainer_content_ready', 'Current version and training blocks exist', hasCurrentVersion && blockCount > 0, `${blockCount} blocks`),
    readinessItem('onsite_delivery_ready', 'Starter participants and hour rules are configured', Number(course.starter_min_participants || 0) >= 1 && Number(course.starter_max_participants || 0) >= Number(course.starter_min_participants || 0) && Number(course.min_hours || 0) > 0 && Number(course.max_hours || 0) >= Number(course.min_hours || 0)),
    readinessItem('refresh_ready', 'Refresh e-learning module exists when required', course.has_refresh_module === false || refreshCount > 0, `${refreshCount} refresh modules`),
    readinessItem('aftersales_ready', 'Kit/resources exist for delivery and aftersales', kitCount > 0, `${kitCount} kit items`),
  ]

  const ready = items.every((item) => item.passed)
  const status = ready ? 'ready' : 'pending'
  const existing = full.publicationChecklist as { id?: string } | null
  const payload = {
    course_id: course.id,
    reference_validated: Boolean(items.find((item) => item.key === 'reference_validated')?.passed),
    price_validated: Boolean(items.find((item) => item.key === 'price_validated')?.passed),
    promise_validated: Boolean(items.find((item) => item.key === 'promise_validated')?.passed),
    trainer_content_ready: Boolean(items.find((item) => item.key === 'trainer_content_ready')?.passed),
    onsite_delivery_ready: Boolean(items.find((item) => item.key === 'onsite_delivery_ready')?.passed),
    refresh_ready: Boolean(items.find((item) => item.key === 'refresh_ready')?.passed),
    aftersales_ready: Boolean(items.find((item) => item.key === 'aftersales_ready')?.passed),
    validated_by: ready ? context.profile.id : null,
    validated_at: ready ? new Date().toISOString() : null,
    status,
    metadata: { last_publish_check: new Date().toISOString(), items },
  }

  const save = existing?.id
    ? supabase.from('trn_course_publication_checklist').update(payload).eq('id', existing.id)
    : supabase.from('trn_course_publication_checklist').insert(payload)

  const { error } = await save
  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_PUBLISH_CHECK_SAVE_FAILED')

  return { courseRef: course.ref, courseId: course.id, ready, status, items }
}

export async function archiveTrainingHubCourseByRef(context: TrainingHubContext, ref: string) {
  requireInternalCatalogueControl(context, 'training.catalogue.update')
  const supabase = await createTrainingHubUserClient()
  const course = await getCourseOrThrow(context, ref)

  const { data, error } = await supabase
    .from('trn_courses')
    .update({ status: 'archived', publication_status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', course.id)
    .select(`
      *,
      trn_categories(id, code, name, subtitle, description, owner_promise, market_risk, display_order, status)
    `)
    .maybeSingle()

  if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_COURSE_ARCHIVE_FAILED')
  if (!data) throw new TrainingHubHttpError('TrainingHub course archive returned no row.', 500, 'TRAININGHUB_COURSE_ARCHIVE_EMPTY')

  return normalizeCourse(data)
}
