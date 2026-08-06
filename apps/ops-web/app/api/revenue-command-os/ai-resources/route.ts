import crypto from 'node:crypto'
import { NextRequest } from 'next/server'
import { resolveRevenueOsActor } from '@/lib/revenue-command-os/access'
import { RevenueOsError } from '@/lib/revenue-command-os/errors'
import { revenueOsErrorResponse, revenueOsSuccess } from '@/lib/revenue-command-os/http'
import { createServiceClient } from '@/lib/supabase/server'
import { writeRevenueOsAuditEvent } from '@/lib/revenue-command-os/repository'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function text(value: unknown, fallback = '') { return typeof value === 'string' ? value.trim() : value == null ? fallback : String(value).trim() }
function object(value: unknown): Record<string, unknown> { return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {} }
function code(value: unknown) { return text(value).toUpperCase().replace(/[^A-Z0-9._:-]+/g, '-').replace(/^-+|-+$/g, '') || `AI-RESOURCE-${Date.now()}` }
function hash(content: unknown) { return crypto.createHash('sha256').update(JSON.stringify(content)).digest('hex') }

export async function GET(request: NextRequest) {
  try {
    const actor = await resolveRevenueOsActor()
    const client = await createServiceClient() as any
    const q = text(request.nextUrl.searchParams.get('q')).toLowerCase()
    const result = await client.from('revenue_os_registry_entries').select('*').eq('tenant_id', actor.tenantUuid).eq('registry', 'gemini-resource').order('updated_at', { ascending: false }).limit(1000)
    if (result.error) throw result.error
    const resources = (result.data || []).filter((row: any) => !q || `${row.code} ${row.purpose} ${row.content?.name || ''} ${row.content?.resourceType || ''}`.toLowerCase().includes(q))
    return revenueOsSuccess({ resources, generatedAt: new Date().toISOString() }, { meta: { mode: 'live' } })
  } catch (error) { return revenueOsErrorResponse(error) }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({})) as Record<string, unknown>
    const action = text(body.action)
    const payload = object(body.payload)
    const actor = await resolveRevenueOsActor(undefined, { payload })
    const client = await createServiceClient() as any
    const now = new Date().toISOString()
    const id = text(payload.id || body.id)

    if (action === 'create') {
      const resourceCode = code(payload.code)
      const name = text(payload.name)
      const resourceType = text(payload.resourceType)
      if (!name || !resourceType) throw new RevenueOsError('AI_RESOURCE_FIELDS_REQUIRED', 'Nom et type de ressource sont requis.', { status: 422 })
      const content = { name, resourceType, description: text(payload.description), domain: text(payload.domain), provider: text(payload.provider, 'gemini'), modelName: text(payload.modelName), promptVersion: text(payload.promptVersion, '1.0'), contentReference: text(payload.contentReference), contextAdapter: text(payload.contextAdapter), toolName: text(payload.toolName), inputSchema: object(payload.inputSchema), outputSchema: object(payload.outputSchema), timeoutSeconds: Number(payload.timeoutSeconds || 240), maxTokens: Number(payload.maxTokens || 12000), temperature: Number(payload.temperature ?? 0.2), enabled: true, tags: Array.isArray(payload.tags) ? payload.tags.map(String) : [] }
      const row = { tenant_id: actor.tenantUuid, registry: 'gemini-resource', code: resourceCode, version: text(payload.version, '1.0'), status: 'active', purpose: text(payload.description, name), content_hash: hash(content), content, cost_profile: object(payload.costProfile), allowed_data_class: text(payload.allowedDataClass, 'internal'), activated_at: now, metadata: { createdBy: actor.id, createdByLabel: actor.displayName, trustedOperatorLive: true }, updated_at: now }
      const result = await client.from('revenue_os_registry_entries').insert(row).select('*').single()
      if (result.error) throw result.error
      await writeRevenueOsAuditEvent({ action: 'ai.resource_created', actorId: actor.id, actorLabel: actor.displayName, actorType: 'user', resourceType: 'revenue_os_gemini_resource', resourceId: result.data.id, outcome: 'success', summary: `Ressource ${resourceCode} créée.`, metadata: { resourceType } }, client)
      return revenueOsSuccess(result.data, { status: 201, meta: { mode: 'live' } })
    }

    if (!id) throw new RevenueOsError('AI_RESOURCE_ID_REQUIRED', 'Sélectionnez une ressource.', { status: 422 })
    const currentResult = await client.from('revenue_os_registry_entries').select('*').eq('tenant_id', actor.tenantUuid).eq('registry', 'gemini-resource').eq('id', id).maybeSingle()
    if (currentResult.error) throw currentResult.error
    if (!currentResult.data) throw new RevenueOsError('AI_RESOURCE_NOT_FOUND', 'Ressource introuvable.', { status: 404 })
    const current = currentResult.data

    if (action === 'update') {
      const nextContent = { ...object(current.content), ...object(payload.content), ...Object.fromEntries(['name','resourceType','description','domain','provider','modelName','promptVersion','contentReference','contextAdapter','toolName','inputSchema','outputSchema','timeoutSeconds','maxTokens','temperature','tags'].filter((key) => payload[key] !== undefined).map((key) => [key, payload[key]])) }
      const result = await client.from('revenue_os_registry_entries').update({ purpose: payload.description !== undefined ? text(payload.description) : current.purpose, content: nextContent, content_hash: hash(nextContent), version: payload.version !== undefined ? text(payload.version) : current.version, allowed_data_class: payload.allowedDataClass !== undefined ? text(payload.allowedDataClass) : current.allowed_data_class, updated_at: now, metadata: { ...object(current.metadata), updatedBy: actor.id, updatedByLabel: actor.displayName } }).eq('tenant_id', actor.tenantUuid).eq('registry', 'gemini-resource').eq('id', id).select('*').single()
      if (result.error) throw result.error
      await writeRevenueOsAuditEvent({
        action: 'ai.resource_updated',
        actorId: actor.id,
        actorLabel: actor.displayName,
        actorType: 'user',
        resourceType: 'revenue_os_gemini_resource',
        resourceId: id,
        outcome: 'success',
        summary: `Ressource ${current.code} mise à jour.`,
        metadata: { version: result.data.version },
      }, client)
      return revenueOsSuccess(result.data, { meta: { mode: 'live' } })
    }

    if (action === 'duplicate') {
      const copyContent = { ...object(current.content), name: `${text(object(current.content).name, current.purpose)} — copie` }
      const row = { ...current, id: crypto.randomUUID(), code: code(`${current.code}-COPY-${Date.now()}`), content: copyContent, content_hash: hash(copyContent), status: 'active', activated_at: now, retired_at: null, created_at: now, updated_at: now, metadata: { ...object(current.metadata), duplicatedFrom: id, duplicatedBy: actor.id } }
      const result = await client.from('revenue_os_registry_entries').insert(row).select('*').single()
      if (result.error) throw result.error
      await writeRevenueOsAuditEvent({
        action: 'ai.resource_duplicated',
        actorId: actor.id,
        actorLabel: actor.displayName,
        actorType: 'user',
        resourceType: 'revenue_os_gemini_resource',
        resourceId: result.data.id,
        outcome: 'success',
        summary: `Ressource ${current.code} dupliquée.`,
        metadata: { duplicatedFrom: id, code: result.data.code },
      }, client)
      return revenueOsSuccess(result.data, { status: 201, meta: { mode: 'live' } })
    }

    if (['activate','deactivate','archive'].includes(action)) {
      const status = action === 'activate' ? 'active' : action === 'deactivate' ? 'inactive' : 'archived'
      const result = await client.from('revenue_os_registry_entries').update({ status, activated_at: action === 'activate' ? now : current.activated_at, retired_at: action === 'archive' ? now : null, updated_at: now }).eq('tenant_id', actor.tenantUuid).eq('registry', 'gemini-resource').eq('id', id).select('*').single()
      if (result.error) throw result.error
      await writeRevenueOsAuditEvent({
        action: `ai.resource_${action}`,
        actorId: actor.id,
        actorLabel: actor.displayName,
        actorType: 'user',
        resourceType: 'revenue_os_gemini_resource',
        resourceId: id,
        outcome: 'success',
        summary: `Ressource ${current.code} : ${status}.`,
        metadata: { previousStatus: current.status, status },
      }, client)
      return revenueOsSuccess(result.data, { meta: { mode: 'live' } })
    }

    if (action === 'test') {
      const content = object(current.content)
      const checks = [
        { key: 'name', passed: Boolean(text(content.name)), label: 'Nom exploitable' },
        { key: 'resourceType', passed: Boolean(text(content.resourceType)), label: 'Type défini' },
        { key: 'description', passed: Boolean(text(content.description || current.purpose)), label: 'Description disponible' },
        { key: 'schemas', passed: Boolean(Object.keys(object(content.inputSchema)).length || Object.keys(object(content.outputSchema)).length || text(content.contentReference)), label: 'Schéma ou référence disponible' },
      ]
      const result = { id, code: current.code, valid: checks.every((item) => item.passed), checks, testedAt: now }
      await writeRevenueOsAuditEvent({ action: 'ai.resource_tested', actorId: actor.id, actorLabel: actor.displayName, actorType: 'user', resourceType: 'revenue_os_gemini_resource', resourceId: id, outcome: result.valid ? 'success' : 'failure', summary: `Ressource ${current.code} testée.`, metadata: result }, client)
      return revenueOsSuccess(result, { meta: { mode: 'live' } })
    }

    if (action === 'delete') {
      const result = await client.from('revenue_os_registry_entries').delete().eq('tenant_id', actor.tenantUuid).eq('registry', 'gemini-resource').eq('id', id)
      if (result.error) throw result.error
      await writeRevenueOsAuditEvent({
        action: 'ai.resource_deleted',
        actorId: actor.id,
        actorLabel: actor.displayName,
        actorType: 'user',
        resourceType: 'revenue_os_gemini_resource',
        resourceId: id,
        outcome: 'success',
        summary: `Ressource ${current.code} supprimée.`,
        metadata: { code: current.code },
      }, client)
      return revenueOsSuccess({ deleted: true, id }, { meta: { mode: 'live' } })
    }

    throw new RevenueOsError('AI_RESOURCE_ACTION_NOT_SUPPORTED', 'Action de ressource non supportée.', { status: 405, context: { action } })
  } catch (error) { return revenueOsErrorResponse(error) }
}
