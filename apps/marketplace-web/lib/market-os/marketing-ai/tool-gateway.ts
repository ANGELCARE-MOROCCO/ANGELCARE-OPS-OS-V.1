import { createHash } from 'node:crypto'
import { createCanonicalRecord, createSyncLink, findCanonicalRecordByIdempotencyKey, getToolExecutionByIdempotencyKey, saveToolExecution } from './phase3-repository'
import type { Phase3ToolName } from './phase3-types'

const EXTERNAL_TOOL_PATTERN = /^(email\.send|whatsapp\.send|social\.publish|ads\.activate|external\.|public_statement)/i
const ALLOWED_TOOLS = new Set<Phase3ToolName>([
  'campaign.prepare','brief.create','brief.update','content.create_draft','content.update_draft','task.create','task.assign','task.link_dependency','asset.requirement_create','asset.classify','asset.link','review.request','approval_package.prepare','schedule.propose','publishing_package.prepare','bridge.store','bridge.version','bridge.archive','learning.record',
])

const RECORD_TYPE: Record<Phase3ToolName, string> = {
  'campaign.prepare': 'campaign_plan', 'brief.create': 'content_brief', 'brief.update': 'content_brief', 'content.create_draft': 'content_draft', 'content.update_draft': 'content_draft',
  'task.create': 'content_task', 'task.assign': 'content_task', 'task.link_dependency': 'content_dependency', 'asset.requirement_create': 'asset_requirement', 'asset.classify': 'asset_classification',
  'asset.link': 'asset_link', 'review.request': 'content_review', 'approval_package.prepare': 'approval_package', 'schedule.propose': 'calendar_proposal', 'publishing_package.prepare': 'publishing_package',
  'bridge.store': 'bridge_object_request', 'bridge.version': 'bridge_version_request', 'bridge.archive': 'bridge_archive_request', 'learning.record': 'marketing_learning',
}

export function marketingToolRegistry() {
  return [...ALLOWED_TOOLS].map((name) => ({
    name,
    authority: name.includes('publishing') || name.includes('approval') ? 'prepare' : 'orchestrate_internal',
    external: false,
    requiresApproval: !['asset.classify','learning.record'].includes(name),
    description: `Outil interne gouverné SANILA: ${name}.`,
  }))
}

function clean(value: unknown, fallback = '') { return String(value ?? fallback).trim() }
function checksum(value: unknown) { return createHash('sha256').update(JSON.stringify(value)).digest('hex') }

export async function executeMarketingInternalTool(input: {
  toolName: string
  payload: Record<string, unknown>
  title: string
  description: string
  actor: { id: string; name: string }
  jobId?: string | null
  compilationItemId?: string | null
  idempotencyKey: string
}) {
  if (EXTERNAL_TOOL_PATTERN.test(input.toolName)) throw new Error('EXTERNAL_TOOL_BLOCKED')
  if (!ALLOWED_TOOLS.has(input.toolName as Phase3ToolName)) throw new Error(`TOOL_NOT_ALLOWED:${input.toolName}`)
  const toolName = input.toolName as Phase3ToolName
  const existingExecution = await getToolExecutionByIdempotencyKey(input.idempotencyKey)
  if (existingExecution?.status === 'completed') return (existingExecution.output || {}) as { ok: true; canonicalId: string; canonicalTable: string; recordType: string; mirrorState: string }
  const existingCanonical = await findCanonicalRecordByIdempotencyKey(input.idempotencyKey)
  if (existingCanonical?.id) {
    const canonicalId = String(existingCanonical.id)
    await createSyncLink({ sourceType: 'market_ai_compilation_item', sourceId: input.compilationItemId || input.idempotencyKey, targetType: 'market_os_records', targetId: canonicalId, strategy: 'promote', metadata: { toolName, recoveredByIdempotency: true }, actorId: input.actor.id })
    const output = { ok: true as const, canonicalId, canonicalTable: 'market_os_records', recordType: RECORD_TYPE[toolName], mirrorState: 'canonical_market_os_record_recovered' }
    await saveToolExecution({ jobId: input.jobId, compilationItemId: input.compilationItemId, toolName, actorId: input.actor.id, input: input.payload, status: 'completed', output, idempotencyKey: input.idempotencyKey })
    return output
  }
  const metadata = {
    ...input.payload,
    marketing_ai_tool: toolName,
    marketing_ai_job_id: input.jobId || null,
    marketing_ai_compilation_item_id: input.compilationItemId || null,
    marketing_ai_idempotency_key: input.idempotencyKey,
    checksum: checksum(input.payload),
    external_execution: false,
    human_external_authority_required: true,
  }
  await saveToolExecution({ jobId: input.jobId, compilationItemId: input.compilationItemId, toolName, actorId: input.actor.id, input: input.payload, status: 'running', idempotencyKey: input.idempotencyKey })
  try {
    const canonical = await createCanonicalRecord({
      recordType: RECORD_TYPE[toolName],
      title: clean(input.title, toolName),
      description: clean(input.description, 'Objet interne préparé par SANILA Marketing Operations Autopilot.'),
      status: toolName === 'review.request' ? 'open' : 'draft',
      priority: clean(input.payload.priority, 'high'),
      stage: toolName.includes('publishing') ? 'ready_for_human_operator' : toolName.includes('review') ? 'awaiting_review' : 'prepared',
      dueDate: clean(input.payload.dueDate || input.payload.due_date) || null,
      metadata,
      actorName: input.actor.name,
    })
    const canonicalId = String(canonical.id || '')
    await createSyncLink({ sourceType: 'market_ai_compilation_item', sourceId: input.compilationItemId || input.idempotencyKey, targetType: 'market_os_records', targetId: canonicalId, strategy: 'promote', metadata: { toolName, targetWorkspace: input.payload.targetWorkspace || null }, actorId: input.actor.id })
    const output = { ok: true, canonicalId, canonicalTable: 'market_os_records', recordType: RECORD_TYPE[toolName], mirrorState: 'canonical_market_os_record_created' }
    await saveToolExecution({ jobId: input.jobId, compilationItemId: input.compilationItemId, toolName, actorId: input.actor.id, input: input.payload, status: 'completed', output, idempotencyKey: input.idempotencyKey })
    return output
  } catch (error) {
    const message = error instanceof Error ? error.message : 'TOOL_EXECUTION_FAILED'
    await saveToolExecution({ jobId: input.jobId, compilationItemId: input.compilationItemId, toolName, actorId: input.actor.id, input: input.payload, status: 'failed', error: message, idempotencyKey: input.idempotencyKey })
    throw error
  }
}
