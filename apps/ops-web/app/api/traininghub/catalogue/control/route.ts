import { NextRequest, NextResponse } from 'next/server'
import { getTrainingHubContext, requireTrainingHubPermission, trainingHubErrorResponse, TrainingHubHttpError } from '@/lib/traininghub/auth'
import { createTrainingHubUserClient } from '@/lib/traininghub/supabase'

export const dynamic = 'force-dynamic'

type JsonRecord = Record<string, any>

const categoryFields = new Set(['code', 'name', 'subtitle', 'description', 'owner_promise', 'market_risk', 'display_order', 'status'])
const courseFields = new Set([
  'category_id',
  'ref',
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
])

function asObject(value: unknown): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TrainingHubHttpError('Requête catalogue invalide.', 400, 'TRAININGHUB_CATALOGUE_CONTROL_INVALID_BODY')
  }
  return value as JsonRecord
}

function cleanText(value: unknown) {
  return String(value || '').trim()
}

function nullableText(value: unknown) {
  const text = cleanText(value)
  return text || null
}

function intOrNull(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  return Math.max(0, Math.floor(n))
}

function boolValue(value: unknown) {
  return value === true || value === 'true' || value === 'on' || value === '1'
}

function moneyMinor(value: unknown) {
  if (value === null || value === undefined || value === '') return 0
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.round(n * 100))
}

function parseTags(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => cleanText(item)).filter(Boolean)
  return cleanText(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function sanitizeCategory(payload: JsonRecord, mode: 'create' | 'update') {
  const patch: JsonRecord = {}
  for (const [key, value] of Object.entries(payload || {})) {
    if (!categoryFields.has(key)) continue
    if (key === 'code') patch.code = cleanText(value).toUpperCase()
    else if (key === 'display_order') patch.display_order = intOrNull(value)
    else if (key === 'status') patch.status = cleanText(value) || 'active'
    else patch[key] = nullableText(value)
  }
  if (mode === 'create') {
    if (!patch.code) throw new TrainingHubHttpError('Code catégorie requis.', 400, 'TRAININGHUB_CATEGORY_CODE_REQUIRED')
    if (!patch.name) throw new TrainingHubHttpError('Nom catégorie requis.', 400, 'TRAININGHUB_CATEGORY_NAME_REQUIRED')
    patch.status = patch.status || 'active'
  }
  if (!Object.keys(patch).length) throw new TrainingHubHttpError('Aucune donnée catégorie à enregistrer.', 400, 'TRAININGHUB_CATEGORY_EMPTY_PATCH')
  return patch
}

function sanitizeCourse(payload: JsonRecord, mode: 'create' | 'update') {
  const patch: JsonRecord = {}
  for (const [key, value] of Object.entries(payload || {})) {
    if (!courseFields.has(key)) continue
    if (key === 'ref') patch.ref = cleanText(value).toUpperCase()
    else if (key === 'category_id') patch.category_id = cleanText(value)
    else if (key === 'positioning_tags') patch.positioning_tags = parseTags(value)
    else if (['onsite_entry_price_minor', 'refresh_entry_price_minor'].includes(key)) patch[key] = moneyMinor(value)
    else if (['starter_min_participants', 'starter_max_participants', 'min_hours', 'max_hours'].includes(key)) patch[key] = intOrNull(value)
    else if (key === 'has_refresh_module') patch.has_refresh_module = boolValue(value)
    else if (key === 'currency_code') patch.currency_code = cleanText(value).toUpperCase() || 'MAD'
    else if (['status', 'publication_status'].includes(key)) patch[key] = cleanText(value) || (key === 'status' ? 'draft' : 'draft')
    else patch[key] = nullableText(value)
  }

  if (mode === 'create') {
    if (!patch.category_id) throw new TrainingHubHttpError('Catégorie requise.', 400, 'TRAININGHUB_COURSE_CATEGORY_REQUIRED')
    if (!patch.ref) throw new TrainingHubHttpError('Référence formation requise.', 400, 'TRAININGHUB_COURSE_REF_REQUIRED')
    if (!patch.title) throw new TrainingHubHttpError('Titre formation requis.', 400, 'TRAININGHUB_COURSE_TITLE_REQUIRED')
    patch.status = patch.status || 'draft'
    patch.publication_status = patch.publication_status || 'draft'
    patch.currency_code = patch.currency_code || 'MAD'
    patch.starter_min_participants = patch.starter_min_participants || 3
    patch.starter_max_participants = patch.starter_max_participants || 8
    patch.min_hours = patch.min_hours || 6
    patch.max_hours = patch.max_hours || 15
  }

  if (!Object.keys(patch).length) throw new TrainingHubHttpError('Aucune donnée formation à enregistrer.', 400, 'TRAININGHUB_COURSE_EMPTY_PATCH')
  return patch
}

async function safeCount(table: string, field: string, value: string) {
  const supabase = await createTrainingHubUserClient()
  try {
    const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true }).eq(field, value)
    if (error) return 0
    return count || 0
  } catch {
    return 0
  }
}

async function courseImpact(courseId: string) {
  const [sessions, proposalItems, orderItems, certificates, modules, resources, kits, versions, entitlements] = await Promise.all([
    safeCount('trn_sessions', 'course_id', courseId),
    safeCount('bill_proposal_items', 'course_id', courseId),
    safeCount('bill_order_items', 'course_id', courseId),
    safeCount('trn_certificates', 'course_id', courseId),
    safeCount('learn_modules', 'course_id', courseId),
    safeCount('trn_course_resources', 'course_id', courseId),
    safeCount('trn_course_kits', 'course_id', courseId),
    safeCount('trn_course_versions', 'course_id', courseId),
    safeCount('learn_entitlements', 'course_id', courseId),
  ])

  const total = sessions + proposalItems + orderItems + certificates + modules + resources + kits + versions + entitlements
  return {
    entity: 'course',
    courseId,
    safeToDelete: total === 0,
    recommendation: total === 0 ? 'Suppression possible' : 'Archivage recommandé',
    dependencies: { sessions, proposalItems, orderItems, certificates, modules, resources, kits, versions, entitlements },
    total,
  }
}

async function categoryImpact(categoryId: string) {
  const courses = await safeCount('trn_courses', 'category_id', categoryId)
  return {
    entity: 'category',
    categoryId,
    safeToDelete: courses === 0,
    recommendation: courses === 0 ? 'Suppression possible' : 'Archivage recommandé',
    dependencies: { courses },
    total: courses,
  }
}

async function createCourseVersion(courseId: string, actorId: string) {
  const supabase = await createTrainingHubUserClient()

  await supabase.from('trn_course_versions').update({ is_current: false }).eq('course_id', courseId)

  const versionLabel = `v${new Date().toISOString().slice(0, 10)}`
  const attempts = [
    {
      course_id: courseId,
      version_label: versionLabel,
      status: 'draft',
      is_current: true,
      valid_from: new Date().toISOString(),
      metadata: { source: 'catalogue_strategique', created_by: actorId },
    },
    {
      course_id: courseId,
      version_label: versionLabel,
      status: 'draft',
      is_current: true,
    },
    {
      course_id: courseId,
      version_label: versionLabel,
      status: 'draft',
    },
  ]

  let lastError: any = null
  for (const payload of attempts) {
    const { data, error } = await supabase.from('trn_course_versions').insert(payload as any).select('*').maybeSingle()
    if (!error && data) return data
    lastError = error
  }

  throw new TrainingHubHttpError(lastError?.message || 'Création de version impossible.', 500, 'TRAININGHUB_VERSION_CREATE_FAILED')
}

export async function POST(request: NextRequest) {
  try {
    const context = await getTrainingHubContext()
    if (!context.isInternal && !context.isSuperAdmin) {
      throw new TrainingHubHttpError('Accès direction requis.', 403, 'TRAININGHUB_CATALOGUE_INTERNAL_ONLY')
    }

    requireTrainingHubPermission(context, ['training.catalogue.update', 'training.catalogue.publish'])

    const body = asObject(await request.json())
    const entity = cleanText(body.entity)
    const action = cleanText(body.action)
    const id = cleanText(body.id)
    const payload = asObject(body.payload || {})

    const supabase = await createTrainingHubUserClient()

    if (entity === 'category') {
      if (action === 'impact') return NextResponse.json({ ok: true, data: await categoryImpact(id) })

      if (action === 'create') {
        const { data, error } = await supabase.from('trn_categories').insert(sanitizeCategory(payload, 'create')).select('*').maybeSingle()
        if (error || !data) throw new TrainingHubHttpError(error?.message || 'Catégorie non créée.', 500, 'TRAININGHUB_CATEGORY_CREATE_FAILED')
        return NextResponse.json({ ok: true, data })
      }

      if (!id) throw new TrainingHubHttpError('Identifiant catégorie requis.', 400, 'TRAININGHUB_CATEGORY_ID_REQUIRED')

      if (action === 'update') {
        const { data, error } = await supabase.from('trn_categories').update(sanitizeCategory(payload, 'update')).eq('id', id).select('*').maybeSingle()
        if (error || !data) throw new TrainingHubHttpError(error?.message || 'Catégorie non modifiée.', 500, 'TRAININGHUB_CATEGORY_UPDATE_FAILED')
        return NextResponse.json({ ok: true, data })
      }

      if (action === 'disable' || action === 'archive') {
        const status = action === 'archive' ? 'archived' : 'inactive'
        const { data, error } = await supabase.from('trn_categories').update({ status }).eq('id', id).select('*').maybeSingle()
        if (error || !data) throw new TrainingHubHttpError(error?.message || 'Statut catégorie non modifié.', 500, 'TRAININGHUB_CATEGORY_STATUS_FAILED')
        return NextResponse.json({ ok: true, data, impact: await categoryImpact(id) })
      }

      if (action === 'delete') {
        const impact = await categoryImpact(id)
        if (!impact.safeToDelete) {
          return NextResponse.json({ ok: false, blocked: true, impact }, { status: 409 })
        }
        const { error } = await supabase.from('trn_categories').delete().eq('id', id)
        if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_CATEGORY_DELETE_FAILED')
        return NextResponse.json({ ok: true, deleted: true, impact })
      }
    }

    if (entity === 'course') {
      if (action === 'impact') return NextResponse.json({ ok: true, data: await courseImpact(id) })

      if (action === 'create') {
        const { data, error } = await supabase.from('trn_courses').insert(sanitizeCourse(payload, 'create')).select('*').maybeSingle()
        if (error || !data) throw new TrainingHubHttpError(error?.message || 'Formation non créée.', 500, 'TRAININGHUB_COURSE_CREATE_FAILED')
        return NextResponse.json({ ok: true, data })
      }

      if (!id) throw new TrainingHubHttpError('Identifiant formation requis.', 400, 'TRAININGHUB_COURSE_ID_REQUIRED')

      if (action === 'update') {
        const { data, error } = await supabase.from('trn_courses').update(sanitizeCourse(payload, 'update')).eq('id', id).select('*').maybeSingle()
        if (error || !data) throw new TrainingHubHttpError(error?.message || 'Formation non modifiée.', 500, 'TRAININGHUB_COURSE_UPDATE_FAILED')
        return NextResponse.json({ ok: true, data })
      }

      if (action === 'publish' || action === 'unpublish' || action === 'disable' || action === 'archive') {
        const patch =
          action === 'publish'
            ? { status: 'active', publication_status: 'published' }
            : action === 'unpublish'
              ? { publication_status: 'draft' }
              : action === 'disable'
                ? { status: 'inactive', publication_status: 'disabled' }
                : { status: 'archived', publication_status: 'archived' }

        const { data, error } = await supabase.from('trn_courses').update(patch).eq('id', id).select('*').maybeSingle()
        if (error || !data) throw new TrainingHubHttpError(error?.message || 'Statut formation non modifié.', 500, 'TRAININGHUB_COURSE_STATUS_FAILED')
        return NextResponse.json({ ok: true, data, impact: await courseImpact(id) })
      }

      if (action === 'version') {
        const data = await createCourseVersion(id, context.profile.id)
        return NextResponse.json({ ok: true, data, impact: await courseImpact(id) })
      }

      if (action === 'delete') {
        const impact = await courseImpact(id)
        if (!impact.safeToDelete) {
          return NextResponse.json({ ok: false, blocked: true, impact }, { status: 409 })
        }
        const { error } = await supabase.from('trn_courses').delete().eq('id', id)
        if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_COURSE_DELETE_FAILED')
        return NextResponse.json({ ok: true, deleted: true, impact })
      }
    }

    throw new TrainingHubHttpError('Action catalogue inconnue.', 400, 'TRAININGHUB_CATALOGUE_UNKNOWN_ACTION')
  } catch (error) {
    return trainingHubErrorResponse(error)
  }
}
