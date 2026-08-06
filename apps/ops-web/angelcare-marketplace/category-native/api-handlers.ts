import type { MarketplacePermission } from '../domain/types'
import { requireMarketplaceApiContext } from '../auth/context'
import { writeMarketplaceAudit } from '../audit/write-audit'
import { apiFailure, apiSuccess, parseJsonObject, requestId } from '../server/request'
import { MarketplaceError } from '../server/errors'
import {
  categoryNativeStudioData,
  createImportPreview,
  executeImportJob,
  getExperienceSchema,
  getImportJob,
  listCategoryNativeImports,
  listExperienceSchemas,
  listHomepageBlocks,
  reorderSchemaFields,
  rollbackImportJob,
  saveExperienceSchema,
  saveSchemaField,
  schemaAction,
} from './repository'
import { categoryNativeCsvTemplate } from './validation'

function permission(mutation: boolean, area: 'schema' | 'import' | 'homepage'): MarketplacePermission {
  if (area === 'import') return mutation ? 'marketplace.category_native_import.manage' : 'marketplace.category_native_import.view'
  if (area === 'homepage') return mutation ? 'marketplace.homepage.manage' : 'marketplace.homepage.view'
  return mutation ? 'marketplace.experience_schema.manage' : 'marketplace.experience_schema.view'
}

export async function handleCategoryNativeSummary(request: Request): Promise<Response> {
  const rid = requestId(request)
  try {
    await requireMarketplaceApiContext('marketplace.experience_schema.view')
    return apiSuccess(await categoryNativeStudioData(), { requestId: rid })
  } catch (error) { return apiFailure(error, rid) }
}

export async function handleExperienceSchemas(request: Request): Promise<Response> {
  const rid = requestId(request)
  try {
    const context = await requireMarketplaceApiContext(permission(request.method !== 'GET', 'schema'))
    if (request.method === 'GET') return apiSuccess(await listExperienceSchemas(), { requestId: rid })
    if (request.method !== 'POST') throw new MarketplaceError('VALIDATION_ERROR', 'Méthode non prise en charge.')
    const body = await parseJsonObject(request)
    const record = await saveExperienceSchema(body, context)
    await writeMarketplaceAudit({ context, requestId: rid, action: 'marketplace.category_native.schema.created', objectType: 'experience_schema', objectId: record.id, afterValue: record, source: 'category-native-mz1', request })
    return apiSuccess({ record }, { requestId: rid, status: 201 })
  } catch (error) { return apiFailure(error, rid) }
}

export async function handleExperienceSchema(request: Request, params: Promise<{ schemaKey: string }>): Promise<Response> {
  const rid = requestId(request)
  try {
    const { schemaKey } = await params
    const context = await requireMarketplaceApiContext(permission(request.method !== 'GET', 'schema'))
    if (request.method === 'GET') {
      const record = await getExperienceSchema(schemaKey)
      if (!record) throw new MarketplaceError('NOT_FOUND', 'Schéma d’expérience introuvable.')
      return apiSuccess(record, { requestId: rid })
    }
    if (request.method !== 'PATCH') throw new MarketplaceError('VALIDATION_ERROR', 'Méthode non prise en charge.')
    const body = await parseJsonObject(request)
    const record = await saveExperienceSchema({ ...body, schema_key: schemaKey }, context)
    await writeMarketplaceAudit({ context, requestId: rid, action: 'marketplace.category_native.schema.updated', objectType: 'experience_schema', objectId: record.id, afterValue: record, source: 'category-native-mz1', request })
    return apiSuccess({ record }, { requestId: rid })
  } catch (error) { return apiFailure(error, rid) }
}

export async function handleExperienceSchemaAction(request: Request, params: Promise<{ schemaKey: string; action: string }>): Promise<Response> {
  const rid = requestId(request)
  try {
    const { schemaKey, action } = await params
    const context = await requireMarketplaceApiContext('marketplace.experience_schema.manage')
    const body = request.method === 'POST' ? await parseJsonObject(request).catch(() => ({})) : {}
    const record = await schemaAction(schemaKey, action as 'publish' | 'pause' | 'duplicate' | 'restore', body, context)
    await writeMarketplaceAudit({ context, requestId: rid, action: `marketplace.category_native.schema.${action}`, objectType: 'experience_schema', objectId: record.id, afterValue: record, source: 'category-native-mz1', request })
    return apiSuccess({ record }, { requestId: rid })
  } catch (error) { return apiFailure(error, rid) }
}

export async function handleSchemaFields(request: Request, params: Promise<{ schemaKey: string }>): Promise<Response> {
  const rid = requestId(request)
  try {
    const { schemaKey } = await params
    const context = await requireMarketplaceApiContext(permission(request.method !== 'GET', 'schema'))
    const schema = await getExperienceSchema(schemaKey)
    if (!schema) throw new MarketplaceError('NOT_FOUND', 'Schéma introuvable.')
    if (request.method === 'GET') return apiSuccess(schema.fields, { requestId: rid })
    if (request.method !== 'POST') throw new MarketplaceError('VALIDATION_ERROR', 'Méthode non prise en charge.')
    const body = await parseJsonObject(request)
    const record = await saveSchemaField(schemaKey, body, context)
    return apiSuccess({ record }, { requestId: rid, status: 201 })
  } catch (error) { return apiFailure(error, rid) }
}

export async function handleSchemaField(request: Request, params: Promise<{ schemaKey: string; fieldId: string }>): Promise<Response> {
  const rid = requestId(request)
  try {
    const { schemaKey, fieldId } = await params
    const context = await requireMarketplaceApiContext('marketplace.experience_schema.manage')
    const schema = await getExperienceSchema(schemaKey)
    if (!schema) throw new MarketplaceError('NOT_FOUND', 'Schéma introuvable.')
    if (request.method !== 'PATCH') throw new MarketplaceError('VALIDATION_ERROR', 'Méthode non prise en charge.')
    const existingField = schema.fields.find((field) => field.id === fieldId)
    if (!existingField) throw new MarketplaceError('NOT_FOUND', 'Champ de schéma introuvable.')
    const record = await saveSchemaField(schemaKey, { ...existingField, ...(await parseJsonObject(request)), field_key: existingField.field_key }, context)
    return apiSuccess({ record }, { requestId: rid })
  } catch (error) { return apiFailure(error, rid) }
}

export async function handleSchemaFieldReorder(request: Request, params: Promise<{ schemaKey: string }>): Promise<Response> {
  const rid = requestId(request)
  try {
    const { schemaKey } = await params
    const context = await requireMarketplaceApiContext('marketplace.experience_schema.manage')
    const body = await parseJsonObject(request)
    const ordered = Array.isArray(body.ordered_ids) ? body.ordered_ids.map(String) : []
    if (!ordered.length) throw new MarketplaceError('VALIDATION_ERROR', 'Une séquence de champs est requise.')
    const record = await reorderSchemaFields(schemaKey, ordered, context)
    return apiSuccess({ record }, { requestId: rid })
  } catch (error) { return apiFailure(error, rid) }
}

export async function handleCsvTemplate(request: Request, params: Promise<{ schemaKey: string }>): Promise<Response> {
  const rid = requestId(request)
  try {
    const { schemaKey } = await params
    await requireMarketplaceApiContext('marketplace.category_native_import.view')
    const schema = await getExperienceSchema(schemaKey)
    if (!schema) throw new MarketplaceError('NOT_FOUND', 'Schéma introuvable.')
    const document = categoryNativeCsvTemplate({ ...schema, fields: schema.fields, variant_groups: schema.variant_groups })
    const url = new URL(request.url)
    if (url.searchParams.get('format') === 'json') return apiSuccess(document, { requestId: rid })
    return new Response(document.csv, {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="${document.fileName}"`,
        'x-request-id': rid,
      },
    })
  } catch (error) { return apiFailure(error, rid) }
}

export async function handleCategoryNativeImports(request: Request): Promise<Response> {
  const rid = requestId(request)
  try {
    const context = await requireMarketplaceApiContext(permission(request.method !== 'GET', 'import'))
    if (request.method === 'GET') return apiSuccess(await listCategoryNativeImports(), { requestId: rid })
    if (request.method !== 'POST') throw new MarketplaceError('VALIDATION_ERROR', 'Méthode non prise en charge.')
    const form = await request.formData()
    const file = form.get('file')
    const schemaKey = String(form.get('schema_key') || '')
    const mode = String(form.get('mode') || 'upsert') as 'dry_run' | 'create' | 'update' | 'upsert'
    if (!(file instanceof File)) throw new MarketplaceError('VALIDATION_ERROR', 'Un fichier CSV est requis.')
    if (file.size > 20 * 1024 * 1024) throw new MarketplaceError('VALIDATION_ERROR', 'Le CSV doit être inférieur à 20 Mo.')
    const source = await file.text()
    if (!source.trim()) throw new MarketplaceError('VALIDATION_ERROR', 'Le CSV ne contient aucune ligne exploitable.')
    const job = await createImportPreview({ schemaKey, sourceFileName: file.name, mode, source, context })
    await writeMarketplaceAudit({ context, requestId: rid, action: 'marketplace.category_native.import.validated', objectType: 'category_native_import', objectId: job.id, afterValue: job, source: 'category-native-mz1', request })
    return apiSuccess({ job }, { requestId: rid, status: 201 })
  } catch (error) { return apiFailure(error, rid) }
}

export async function handleCategoryNativeImport(request: Request, params: Promise<{ jobId: string }>): Promise<Response> {
  const rid = requestId(request)
  try {
    const { jobId } = await params
    await requireMarketplaceApiContext('marketplace.category_native_import.view')
    const job = await getImportJob(jobId)
    if (!job) throw new MarketplaceError('NOT_FOUND', 'Import introuvable.')
    return apiSuccess(job, { requestId: rid })
  } catch (error) { return apiFailure(error, rid) }
}

export async function handleCategoryNativeImportAction(request: Request, params: Promise<{ jobId: string; action: string }>): Promise<Response> {
  const rid = requestId(request)
  try {
    const { jobId, action } = await params
    const context = await requireMarketplaceApiContext('marketplace.category_native_import.manage')
    const job = action === 'execute'
      ? await executeImportJob(jobId, context)
      : action === 'rollback'
        ? await rollbackImportJob(jobId, context)
        : null
    if (!job) throw new MarketplaceError('VALIDATION_ERROR', 'Action d’import inconnue.')
    await writeMarketplaceAudit({ context, requestId: rid, action: `marketplace.category_native.import.${action}`, objectType: 'category_native_import', objectId: job.id, afterValue: job, source: 'category-native-mz1', request })
    return apiSuccess({ job }, { requestId: rid })
  } catch (error) { return apiFailure(error, rid) }
}

export async function handleHomepageBlocks(request: Request): Promise<Response> {
  const rid = requestId(request)
  try {
    await requireMarketplaceApiContext(permission(false, 'homepage'))
    return apiSuccess(await listHomepageBlocks(), { requestId: rid })
  } catch (error) { return apiFailure(error, rid) }
}
