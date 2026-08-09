import 'server-only'
import crypto from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { writeRevenueOsAuditEvent } from '../repository'
import type { OperationalDepthInput, OperationalEntityType, OperationalNoteKind } from './types'

type Row = Record<string, any>

const tableOf: Record<OperationalEntityType, string> = {
  objective: 'revenue_os_objectives',
  strategy: 'revenue_os_strategies',
  program: 'revenue_os_programs',
  mission: 'revenue_os_missions',
  task: 'revenue_os_mission_tasks',
  exception: 'revenue_os_operational_exceptions',
}

const childOf: Partial<Record<OperationalEntityType, OperationalEntityType>> = {
  objective: 'strategy',
  strategy: 'program',
  program: 'mission',
  mission: 'task',
  exception: 'task',
}

const noteKinds = new Set<OperationalNoteKind>(['comment', 'evidence', 'milestone', 'kpi', 'account', 'result', 'checklist', 'recovery', 'decision'])
const noteStatuses = new Set(['draft', 'active', 'running', 'completed', 'failed', 'cancelled', 'archived'])
const outcomeStatuses = new Set(['draft', 'observed', 'confirmed', 'disputed', 'archived'])

function numberValue(value: unknown, fallback = 0) {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function boundedNumber(value: unknown, minimum: number, maximum: number, fallback: number) {
  return Math.min(maximum, Math.max(minimum, numberValue(value, fallback)))
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : value == null ? fallback : String(value).trim()
}

function codeValue(value: unknown, prefix: string) {
  const normalized = stringValue(value).toUpperCase().replace(/[^A-Z0-9._:-]+/g, '-').replace(/^-+|-+$/g, '')
  return normalized || `${prefix}-${Date.now()}`
}

function tenantQuery(client: any, entityType: OperationalEntityType, tenantId: string) {
  const query = client.from(tableOf[entityType]).select('*')
  return entityType === 'objective' ? query : query.eq('tenant_id', tenantId)
}

async function loadEntity(client: any, tenantId: string, entityType: OperationalEntityType, entityId: string) {
  let query = tenantQuery(client, entityType, tenantId).eq('id', entityId)
  const result = await query.maybeSingle()
  if (result.error) throw result.error
  if (!result.data) throw new Error(`${entityType.toUpperCase()}_NOT_FOUND`)
  return result.data as Row
}

function relationSelector(entityType: OperationalEntityType, entityId: string) {
  return `and(from_type.eq.${entityType},from_id.eq.${entityId}),and(to_type.eq.${entityType},to_id.eq.${entityId})`
}

function titleOf(row: Row) {
  const payload = objectValue(row.payload)
  const metadata = objectValue(row.metadata)
  return stringValue(row.title || payload.title || metadata.title || row.code, 'Dossier Revenue OS')
}

async function childRows(client: any, tenantId: string, entityType: OperationalEntityType, entityId: string, row: Row) {
  const childType = childOf[entityType]
  if (!childType) return []
  const table = tableOf[childType]
  let query = client.from(table).select('*').order('updated_at', { ascending: false }).limit(200)
  if (childType !== 'objective') query = query.eq('tenant_id', tenantId)
  const parentKeys = entityType === 'objective'
    ? ['objectiveId', 'objective_id']
    : entityType === 'strategy'
      ? ['strategyId', 'strategy_id']
      : entityType === 'program'
        ? ['programId', 'program_id']
        : entityType === 'mission'
          ? ['missionId', 'mission_id']
          : ['exceptionId', 'exception_id']
  const result = await query
  if (result.error) throw result.error
  return (result.data || []).filter((candidate: Row) => {
    if (entityType === 'objective' && String(candidate.objective_id || '') === entityId) return true
    if (entityType === 'strategy' && String(candidate.strategy_id || '') === entityId) return true
    const payload = objectValue(candidate.payload)
    return parentKeys.some((key) => String(payload[key] || '') === entityId)
  })
}

export async function readOperationalDepth(input: { tenantId: string; entityType: OperationalEntityType; entityId: string }) {
  const client = await createServiceClient() as any
  const entity = await loadEntity(client, input.tenantId, input.entityType, input.entityId)
  const [relationsResult, notesResult, auditResult, children] = await Promise.all([
    client.from('revenue_os_entity_relations').select('*').eq('tenant_id', input.tenantId).or(relationSelector(input.entityType, input.entityId)).order('created_at', { ascending: false }).limit(200),
    client.from('revenue_os_entity_notes').select('*').eq('tenant_id', input.tenantId).eq('entity_type', input.entityType).eq('entity_id', input.entityId).order('created_at', { ascending: false }).limit(300),
    client.from('revenue_os_audit_events').select('*').eq('resource_id', input.entityId).order('created_at', { ascending: false }).limit(100),
    childRows(client, input.tenantId, input.entityType, input.entityId, entity),
  ])
  if (relationsResult.error) throw relationsResult.error
  if (notesResult.error) throw notesResult.error
  return {
    entityType: input.entityType,
    entity,
    title: titleOf(entity),
    relations: relationsResult.data || [],
    notes: notesResult.data || [],
    audit: auditResult.error ? [] : auditResult.data || [],
    childType: childOf[input.entityType] || null,
    children,
    generatedAt: new Date().toISOString(),
  }
}

function commonPayload(row: Row, payload: Record<string, unknown>, input: OperationalDepthInput) {
  const now = new Date().toISOString()
  return {
    ...objectValue(row.payload),
    ...objectValue(row.metadata),
    ...payload,
    updatedAt: now,
    updatedBy: input.actorId,
    updatedByLabel: input.actorLabel,
    trustedOperatorLive: true,
  }
}

async function updateFields(client: any, input: OperationalDepthInput) {
  if (!input.entityType || !input.entityId) throw new Error('ENTITY_REQUIRED')
  const row = await loadEntity(client, input.tenantId, input.entityType, input.entityId)
  const payload = objectValue(input.payload)
  const now = new Date().toISOString()
  const nextPayload = commonPayload(row, payload, input)
  const update: Row = { updated_at: now }
  if (input.entityType === 'objective') {
    update.metadata = nextPayload
    if (payload.title !== undefined) {
      const title = stringValue(payload.title)
      if (title.length < 8) throw new Error('OBJECTIVE_TITLE_TOO_SHORT')
      update.title = title
    }
    if (payload.mandate !== undefined || payload.description !== undefined) {
      const mandate = stringValue(payload.mandate ?? payload.description)
      if (mandate.length < 20) throw new Error('OBJECTIVE_MANDATE_TOO_SHORT')
      update.mandate = mandate
    }
    if (payload.businessUnit !== undefined) update.business_unit = stringValue(payload.businessUnit)
    if (payload.targetMarket !== undefined) update.target_market = stringValue(payload.targetMarket)
    if (payload.horizon !== undefined) update.horizon = stringValue(payload.horizon)
    if (payload.priority !== undefined) update.priority = stringValue(payload.priority)
    if (payload.status !== undefined) update.status = stringValue(payload.status)
    if (payload.ownerLabel !== undefined) update.owner_label = stringValue(payload.ownerLabel)
    update.execution_mode = 'live'
  } else if (input.entityType === 'exception') {
    update.payload = nextPayload
    if (payload.title) update.title = payload.title
    if (payload.status) update.status = payload.status
    if (payload.severity) update.severity = payload.severity
    if (payload.ownerId) update.owner_id = payload.ownerId
    if (payload.dueAt !== undefined) update.due_at = payload.dueAt || null
    if (payload.revenueImpactDh !== undefined) update.revenue_impact_dh = Number(payload.revenueImpactDh || 0)
  } else {
    update.payload = nextPayload
    if (payload.status) update.status = payload.status
  }
  let query = client.from(tableOf[input.entityType]).update(update).eq('id', input.entityId)
  if (input.entityType !== 'objective') query = query.eq('tenant_id', input.tenantId)
  const result = await query.select('*').single()
  if (result.error) throw result.error
  await writeRevenueOsAuditEvent({ action: `${input.entityType}.operational_dossier_updated`, actorId: input.actorId, actorLabel: input.actorLabel, actorType: 'user', resourceType: `revenue_os_${input.entityType}`, resourceId: input.entityId, outcome: 'success', summary: 'Dossier opérationnel mis à jour.', metadata: payload }, client)
  return result.data
}

async function duplicateEntity(client: any, input: OperationalDepthInput) {
  if (!input.entityType || !input.entityId) throw new Error('ENTITY_REQUIRED')
  const source = await loadEntity(client, input.tenantId, input.entityType, input.entityId)
  const now = new Date().toISOString()
  const id = crypto.randomUUID()
  const copy: Row = { ...source, id, created_at: now, updated_at: now }
  delete copy.created_by
  if ('code' in source) copy.code = codeValue(`${source.code || input.entityType}-COPY-${Date.now()}`, input.entityType.toUpperCase())
  if ('title' in source) copy.title = `${titleOf(source)} — copie`
  if (input.entityType === 'objective') {
    copy.source = 'manual'
    copy.execution_mode = 'live'
    copy.metadata = { ...objectValue(source.metadata), duplicatedFrom: input.entityId, duplicatedAt: now, duplicatedBy: input.actorId }
  } else {
    copy.tenant_id = input.tenantId
    copy.payload = { ...objectValue(source.payload), title: `${titleOf(source)} — copie`, duplicatedFrom: input.entityId, duplicatedAt: now, duplicatedBy: input.actorId }
  }
  const result = await client.from(tableOf[input.entityType]).insert(copy).select('*').single()
  if (result.error) throw result.error
  await writeRevenueOsAuditEvent({ action: `${input.entityType}.duplicated`, actorId: input.actorId, actorLabel: input.actorLabel, actorType: 'user', resourceType: `revenue_os_${input.entityType}`, resourceId: id, outcome: 'success', summary: 'Dossier dupliqué.', metadata: { sourceId: input.entityId } }, client)
  return result.data
}

async function createChild(client: any, input: OperationalDepthInput) {
  if (!input.entityType || !input.entityId) throw new Error('PARENT_REQUIRED')
  const parent = await loadEntity(client, input.tenantId, input.entityType, input.entityId)
  const childType = childOf[input.entityType]
  if (!childType) throw new Error('CHILD_TYPE_UNAVAILABLE')
  const payload = objectValue(input.payload)
  const now = new Date().toISOString()
  const id = crypto.randomUUID()
  const title = stringValue(payload.title, `${childType} lié à ${titleOf(parent)}`)
  const code = codeValue(payload.code, childType.toUpperCase())
  const parentPayload = objectValue(parent.payload)
  const strategyId = stringValue(parent.strategy_id || parentPayload.strategyId || (input.entityType === 'strategy' ? input.entityId : payload.strategyId))
  const compilationRunId = stringValue(parent.compilation_run_id || parentPayload.compilationRunId || payload.compilationRunId)
  let row: Row
  if (childType === 'strategy') {
    row = { id, tenant_id: input.tenantId, objective_id: input.entityId, status: 'active', payload: { ...payload, id, code, title, objectiveId: input.entityId, ownerId: input.actorId, ownerLabel: input.actorLabel, createdAt: now, updatedAt: now }, version: 1, created_at: now, updated_at: now }
  } else if (childType === 'task' && input.entityType === 'exception') {
    row = { id, tenant_id: input.tenantId, compilation_run_id: compilationRunId || null, strategy_id: strategyId || null, strategy_version: stringValue(parent.strategy_version || parentPayload.strategyVersion, '1.0.0'), code, status: 'active', external_actions: 0, payload: { ...payload, id, code, title, exceptionId: input.entityId, ownerId: stringValue(payload.ownerId, input.actorId), ownerLabel: stringValue(payload.ownerLabel, input.actorLabel), createdAt: now, updatedAt: now }, created_at: now, updated_at: now }
  } else {
    const parentField = input.entityType === 'program' ? 'programId' : input.entityType === 'mission' ? 'missionId' : 'strategyId'
    row = { id, tenant_id: input.tenantId, compilation_run_id: compilationRunId || null, strategy_id: strategyId || (input.entityType === 'strategy' ? input.entityId : null), strategy_version: stringValue(parent.strategy_version || parentPayload.strategyVersion, '1.0.0'), code, status, external_actions: 0, payload: { ...payload, id, code, title, [parentField]: input.entityId, ownerId: stringValue(payload.ownerId, input.actorId), ownerLabel: stringValue(payload.ownerLabel, input.actorLabel), createdAt: now, updatedAt: now }, created_at: now, updated_at: now }
  }
  const result = await client.from(tableOf[childType]).insert(row).select('*').single()
  if (result.error) throw result.error
  await client.from('revenue_os_entity_relations').upsert({ tenant_id: input.tenantId, from_type: input.entityType, from_id: input.entityId, to_type: childType, to_id: id, relation_kind: 'contains', metadata: { createdBy: input.actorId }, created_by: input.actorId, created_at: now, updated_at: now }, { onConflict: 'tenant_id,from_type,from_id,to_type,to_id,relation_kind' })
  await writeRevenueOsAuditEvent({ action: `${childType}.created_from_${input.entityType}`, actorId: input.actorId, actorLabel: input.actorLabel, actorType: 'user', resourceType: `revenue_os_${childType}`, resourceId: id, outcome: 'success', summary: `${childType} créé depuis ${input.entityType}.`, metadata: { parentId: input.entityId, payload } }, client)
  return result.data
}

async function addNote(client: any, input: OperationalDepthInput) {
  if (!input.entityType || !input.entityId) throw new Error('ENTITY_REQUIRED')
  const payload = objectValue(input.payload)
  const requestedKind = stringValue(payload.kind, 'comment') as OperationalNoteKind
  const kind: OperationalNoteKind = noteKinds.has(requestedKind) ? requestedKind : 'comment'
  const requestedStatus = stringValue(payload.status, 'active')
  const status = noteStatuses.has(requestedStatus) ? requestedStatus : 'active'
  const row = {
    id: crypto.randomUUID(), tenant_id: input.tenantId, entity_type: input.entityType, entity_id: input.entityId,
    note_kind: kind, title: stringValue(payload.title, kind), body: stringValue(payload.body), status,
    owner_id: stringValue(payload.ownerId, input.actorId), due_at: payload.dueAt || null,
    value_numeric: payload.valueNumeric == null || payload.valueNumeric === '' ? null : Number(payload.valueNumeric),
    payload: { ...payload, createdByLabel: input.actorLabel }, created_by: input.actorId,
  }
  const result = await client.from('revenue_os_entity_notes').insert(row).select('*').single()
  if (result.error) throw result.error
  await writeRevenueOsAuditEvent({ action: `${input.entityType}.${kind}_added`, actorId: input.actorId, actorLabel: input.actorLabel, actorType: 'user', resourceType: `revenue_os_${input.entityType}`, resourceId: input.entityId, outcome: 'success', summary: `${kind} ajouté au dossier.`, metadata: { noteId: row.id, title: row.title } }, client)
  return result.data
}

async function updateNote(client: any, input: OperationalDepthInput) {
  const payload = objectValue(input.payload)
  const noteId = stringValue(payload.noteId)
  if (!noteId) throw new Error('NOTE_ID_REQUIRED')
  const update = { title: payload.title, body: payload.body, status: payload.status, owner_id: payload.ownerId, due_at: payload.dueAt === undefined ? undefined : payload.dueAt || null, value_numeric: payload.valueNumeric === undefined ? undefined : Number(payload.valueNumeric || 0), payload, updated_at: new Date().toISOString() }
  const clean = Object.fromEntries(Object.entries(update).filter(([, value]) => value !== undefined))
  const result = await client.from('revenue_os_entity_notes').update(clean).eq('tenant_id', input.tenantId).eq('id', noteId).select('*').single()
  if (result.error) throw result.error
  await writeRevenueOsAuditEvent({ action: 'operational_note.updated', actorId: input.actorId, actorLabel: input.actorLabel, actorType: 'user', resourceType: `revenue_os_${input.entityType || 'entity'}`, resourceId: input.entityId || noteId, outcome: 'success', summary: 'Élément du dossier mis à jour.', metadata: { noteId, changes: clean } }, client)
  return result.data
}

async function deleteNote(client: any, input: OperationalDepthInput) {
  const noteId = stringValue(objectValue(input.payload).noteId)
  if (!noteId) throw new Error('NOTE_ID_REQUIRED')
  const result = await client.from('revenue_os_entity_notes').delete().eq('tenant_id', input.tenantId).eq('id', noteId)
  if (result.error) throw result.error
  await writeRevenueOsAuditEvent({ action: 'operational_note.deleted', actorId: input.actorId, actorLabel: input.actorLabel, actorType: 'user', resourceType: `revenue_os_${input.entityType || 'entity'}`, resourceId: input.entityId || noteId, outcome: 'success', summary: 'Élément du dossier supprimé.', metadata: { noteId } }, client)
  return { deleted: true, noteId }
}

async function linkEntity(client: any, input: OperationalDepthInput) {
  if (!input.entityType || !input.entityId) throw new Error('ENTITY_REQUIRED')
  const payload = objectValue(input.payload)
  const toType = stringValue(payload.toType) as OperationalEntityType
  const toId = stringValue(payload.toId)
  const relationKind = stringValue(payload.relationKind, 'related')
  if (!tableOf[toType] || !toId) throw new Error('RELATED_ENTITY_REQUIRED')
  await loadEntity(client, input.tenantId, toType, toId)
  const row = { tenant_id: input.tenantId, from_type: input.entityType, from_id: input.entityId, to_type: toType, to_id: toId, relation_kind: relationKind, metadata: payload.metadata || {}, created_by: input.actorId, updated_at: new Date().toISOString() }
  const result = await client.from('revenue_os_entity_relations').upsert(row, { onConflict: 'tenant_id,from_type,from_id,to_type,to_id,relation_kind' }).select('*').single()
  if (result.error) throw result.error
  await writeRevenueOsAuditEvent({ action: `${input.entityType}.relation_linked`, actorId: input.actorId, actorLabel: input.actorLabel, actorType: 'user', resourceType: `revenue_os_${input.entityType}`, resourceId: input.entityId, outcome: 'success', summary: 'Dossier relié à une autre entité Revenue OS.', metadata: { relationId: result.data.id, toType, toId, relationKind } }, client)
  return result.data
}

async function unlinkEntity(client: any, input: OperationalDepthInput) {
  const relationId = stringValue(objectValue(input.payload).relationId)
  if (!relationId) throw new Error('RELATION_ID_REQUIRED')
  const result = await client.from('revenue_os_entity_relations').delete().eq('tenant_id', input.tenantId).eq('id', relationId)
  if (result.error) throw result.error
  await writeRevenueOsAuditEvent({ action: `${input.entityType || 'entity'}.relation_unlinked`, actorId: input.actorId, actorLabel: input.actorLabel, actorType: 'user', resourceType: `revenue_os_${input.entityType || 'entity'}`, resourceId: input.entityId || relationId, outcome: 'success', summary: 'Relation supprimée du dossier.', metadata: { relationId } }, client)
  return { deleted: true, relationId }
}

async function recordOutcome(client: any, input: OperationalDepthInput) {
  if (!input.entityType || !input.entityId) throw new Error('ENTITY_REQUIRED')
  const payload = objectValue(input.payload)
  const requestedStatus = stringValue(payload.status, 'confirmed')
  const row = { id: crypto.randomUUID(), tenant_id: input.tenantId, entity_type: input.entityType, entity_id: input.entityId, outcome_type: stringValue(payload.outcomeType, 'commercial_result'), status: outcomeStatuses.has(requestedStatus) ? requestedStatus : 'confirmed', revenue_value_dh: numberValue(payload.revenueValueDh), margin_value_dh: numberValue(payload.marginValueDh), confidence: boundedNumber(payload.confidence, 0, 1, 1), payload, recorded_by: input.actorId, observed_at: payload.observedAt || new Date().toISOString() }
  const result = await client.from('revenue_os_outcome_records').insert(row).select('*').single()
  if (result.error) throw result.error
  await writeRevenueOsAuditEvent({ action: `${input.entityType}.outcome_recorded`, actorId: input.actorId, actorLabel: input.actorLabel, actorType: 'user', resourceType: `revenue_os_${input.entityType}`, resourceId: input.entityId, outcome: 'success', summary: 'Résultat commercial enregistré.', metadata: { outcomeId: row.id, revenueValueDh: row.revenue_value_dh } }, client)
  return result.data
}

export async function executeOperationalDepth(input: OperationalDepthInput) {
  const client = await createServiceClient() as any
  switch (input.action) {
    case 'update_fields': return updateFields(client, input)
    case 'duplicate': return duplicateEntity(client, input)
    case 'create_child': return createChild(client, input)
    case 'add_note': return addNote(client, input)
    case 'update_note': return updateNote(client, input)
    case 'delete_note': return deleteNote(client, input)
    case 'link_entity': return linkEntity(client, input)
    case 'unlink_entity': return unlinkEntity(client, input)
    case 'record_outcome': return recordOutcome(client, input)
    case 'create_saved_view': {
      const payload = objectValue(input.payload)
      const result = await client.from('revenue_os_saved_views').upsert({ id: stringValue(payload.id) || crypto.randomUUID(), tenant_id: input.tenantId, workspace_key: stringValue(payload.workspaceKey), name: stringValue(payload.name, 'Vue personnalisée'), filters: payload.filters || {}, sort: payload.sort || {}, columns: payload.columns || [], density: stringValue(payload.density, 'comfortable'), created_by: input.actorId, updated_at: new Date().toISOString() }, { onConflict: 'tenant_id,workspace_key,name' }).select('*').single()
      if (result.error) throw result.error
      await writeRevenueOsAuditEvent({ action: 'workspace.saved_view_created', actorId: input.actorId, actorLabel: input.actorLabel, actorType: 'user', resourceType: 'revenue_os_saved_view', resourceId: result.data.id, outcome: 'success', summary: 'Vue opérationnelle enregistrée.', metadata: { workspaceKey: payload.workspaceKey, name: payload.name } }, client)
      return result.data
    }
    case 'delete_saved_view': {
      const viewId = stringValue(objectValue(input.payload).viewId)
      const result = await client.from('revenue_os_saved_views').delete().eq('tenant_id', input.tenantId).eq('id', viewId)
      if (result.error) throw result.error
      await writeRevenueOsAuditEvent({ action: 'workspace.saved_view_deleted', actorId: input.actorId, actorLabel: input.actorLabel, actorType: 'user', resourceType: 'revenue_os_saved_view', resourceId: viewId, outcome: 'success', summary: 'Vue opérationnelle supprimée.', metadata: {} }, client)
      return { deleted: true, viewId }
    }
    default: throw new Error(`UNSUPPORTED_OPERATIONAL_DEPTH_ACTION:${input.action}`)
  }
}
