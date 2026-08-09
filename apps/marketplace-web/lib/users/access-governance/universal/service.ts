import 'server-only'

import { randomUUID } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { createAccessGovernanceAdminClient } from '../admin-client'
import type { GovernanceUserRow } from '../types'
import { actorIdentity, createCorrelationId } from './security'
import { inventoryUniversalDirectory, resolveUniversalScannerRoot } from './source-root'
import { analyzeUniversalSourceFile, inferUniversalAuthorityManifests } from './source-intelligence'
import { loadDatabaseAuthoritySnapshot, topologyFromDatabaseSnapshot } from './database-intelligence'
import {
  activateUniversalSourceAnalysis,
  claimUniversalInventoryItems,
  claimUniversalWorkItems,
  completeUniversalInventoryItem,
  completeUniversalWorkItem,
  createUniversalJob,
  enqueueUniversalInventoryDirectories,
  failUniversalInventoryItem,
  failUniversalWorkItem,
  loadUniversalJob,
  initializeUniversalInventory,
  loadUniversalScanGraph,
  persistUniversalAnalysis,
  refreshUniversalJobProgress,
  replaceUniversalFindings,
  replaceUniversalManifests,
  sourceFileFromWorkItem,
  storeUniversalWorkItems,
  universalInventoryProgress,
  updateUniversalJobState,
} from './repository'
import { buildUniversalReconciliationFindings } from './reconciliation'
import type { JsonObject, JsonValue, UniversalEvidence, UniversalScanChunkResult, UniversalScanJob, UniversalTopologyNode } from './types'

type AdminClient = ReturnType<typeof createAccessGovernanceAdminClient>
const execFileAsync = promisify(execFile)
export const UNIVERSAL_SCANNER_VERSION = '4.0.0'


function asJsonValue(value: unknown): JsonValue | undefined {
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value
  if (Array.isArray(value)) {
    const values: JsonValue[] = []
    for (const item of value) {
      const converted = asJsonValue(item)
      if (converted !== undefined) values.push(converted)
    }
    return values
  }
  if (typeof value === 'object') {
    const object: JsonObject = {}
    for (const [key, item] of Object.entries(value)) {
      const converted = asJsonValue(item)
      if (converted !== undefined) object[key] = converted
    }
    return object
  }
  return undefined
}

function asJsonObject(value: unknown): JsonObject {
  const converted = asJsonValue(value)
  return converted !== null && typeof converted === 'object' && !Array.isArray(converted) ? converted : {}
}

async function repositoryCommit(root: string) {
  try {
    const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: root, timeout: 15_000 })
    return stdout.trim() || null
  } catch {
    return null
  }
}

export async function startUniversalAuthorizationScan(
  client: AdminClient,
  actor: GovernanceUserRow,
  input: { mode?: UniversalScanJob['mode']; scope?: JsonObject; processImmediately?: boolean; chunkSize?: number },
) {
  const root = resolveUniversalScannerRoot()
  const actorInfo = actorIdentity(actor)
  const correlationId = createCorrelationId('authorization-scan')
  const job = await createUniversalJob(client, {
    mode: input.mode ?? 'full',
    sourceRoot: root,
    scope: input.scope ?? {},
    repositoryCommit: await repositoryCommit(root),
    scannerVersion: UNIVERSAL_SCANNER_VERSION,
    actorId: actorInfo.id,
    actorEmail: actorInfo.email,
    correlationId,
  })

  try {
    await initializeUniversalInventory(client, job.id)
    if (input.processImmediately === false) return { job: await loadUniversalJob(client, job.id), correlationId }
    const result = await continueUniversalAuthorizationScan(client, job.id, input.chunkSize ?? 20)
    return { job: result.job, chunk: result, correlationId }
  } catch (error) {
    await updateUniversalJobState(client, job.id, {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Scanner inventory failed.',
      completedAt: new Date().toISOString(),
    })
    throw error
  }
}

async function continueUniversalInventory(client: AdminClient, job: UniversalScanJob, chunkSize: number) {
  const workerToken = randomUUID()
  const claimed = await claimUniversalInventoryItems(client, job.id, workerToken, Math.max(1, Math.min(chunkSize, 40)))
  let processed = 0
  const warningRows = [...job.warnings]
  for (const item of claimed) {
    try {
      await updateUniversalJobState(client, job.id, { currentItem: item.relative_directory || '.' })
      const inventory = await inventoryUniversalDirectory(job.sourceRoot, item.relative_directory)
      await enqueueUniversalInventoryDirectories(client, job.id, inventory.directories)
      await storeUniversalWorkItems(client, job.id, inventory.files)
      warningRows.push(...inventory.warnings)
      await completeUniversalInventoryItem(client, item.id, {
        directories: inventory.directories.length,
        files: inventory.files.length,
        warnings: inventory.warnings.length,
      })
      processed += 1
    } catch (error) {
      await failUniversalInventoryItem(client, item.id, error instanceof Error ? error.message : 'Directory inventory failed.')
    }
  }
  if (warningRows.length !== job.warnings.length) await updateUniversalJobState(client, job.id, { warnings: warningRows.slice(-1000) })
  const progress = await universalInventoryProgress(client, job.id)
  if (progress.pending + progress.claimed > 0) {
    const current = await loadUniversalJob(client, job.id)
    if (!current) throw new Error('Scanner job disappeared during inventory.')
    return { job: current, processed, remaining: progress.pending + progress.claimed, completed: false }
  }
  const activated = await activateUniversalSourceAnalysis(client, job.id)
  return { job: activated, processed, remaining: activated.totalWorkItems, completed: activated.totalWorkItems === 0 }
}

export async function continueUniversalAuthorizationScan(client: AdminClient, jobId: string, chunkSize = 20): Promise<UniversalScanChunkResult> {
  const job = await loadUniversalJob(client, jobId)
  if (!job) throw new Error('Scanner job was not found.')
  if (job.status === 'paused') return { job, processed: 0, remaining: Math.max(0, job.totalWorkItems - job.completedWorkItems - job.failedWorkItems), completed: false }
  if (job.status === 'cancelled' || job.status === 'completed' || job.status === 'failed') {
    return { job, processed: 0, remaining: Math.max(0, job.totalWorkItems - job.completedWorkItems - job.failedWorkItems), completed: job.status === 'completed' }
  }

  if (job.status === 'inventorying' || job.stage === 'repository_inventory') {
    const inventoryResult = await continueUniversalInventory(client, job, chunkSize)
    if (inventoryResult.job.status !== 'running') return inventoryResult
    if (inventoryResult.job.totalWorkItems === 0) {
      const finalized = await finalizeUniversalAuthorizationScan(client, jobId)
      return { job: finalized, processed: inventoryResult.processed, remaining: 0, completed: true }
    }
  }

  const activeJob = await loadUniversalJob(client, jobId)
  if (!activeJob) throw new Error('Scanner job was not found after inventory.')
  const workerToken = randomUUID()
  const claimed = await claimUniversalWorkItems(client, jobId, workerToken, chunkSize)
  let processed = 0
  for (const item of claimed) {
    try {
      await refreshUniversalJobProgress(client, jobId, item.relative_path)
      const result = await analyzeUniversalSourceFile(jobId, sourceFileFromWorkItem(item))
      await persistUniversalAnalysis(client, result)
      await completeUniversalWorkItem(client, item.id, {
        evidence: result.evidence.length,
        nodes: result.nodes.length,
        edges: result.edges.length,
      })
      processed += 1
    } catch (error) {
      await failUniversalWorkItem(client, item.id, error instanceof Error ? error.message : 'Source analysis failed.')
    }
  }

  const refreshed = await refreshUniversalJobProgress(client, jobId, null)
  const remaining = Math.max(0, refreshed.totalWorkItems - refreshed.completedWorkItems - refreshed.failedWorkItems)
  if (remaining === 0) {
    const finalized = await finalizeUniversalAuthorizationScan(client, jobId)
    return { job: finalized, processed, remaining: 0, completed: true }
  }
  return { job: refreshed, processed, remaining, completed: false }
}

export async function finalizeUniversalAuthorizationScan(client: AdminClient, jobId: string) {
  let job = await updateUniversalJobState(client, jobId, { status: 'finalizing', stage: 'database_introspection', currentItem: null })
  try {
    try {
      const databaseSnapshot = await loadDatabaseAuthoritySnapshot(client)
      const databaseTopology = topologyFromDatabaseSnapshot(jobId, databaseSnapshot)
      await persistUniversalAnalysis(client, databaseTopology)
    } catch (error) {
      const warning = `Database introspection unavailable: ${error instanceof Error ? error.message : 'unknown failure'}`
      job = await updateUniversalJobState(client, jobId, { warnings: [...job.warnings, warning] })
    }

    await updateUniversalJobState(client, jobId, { stage: 'topology_construction' })
    const graph = await loadUniversalScanGraph(client, jobId)
    const sourceNodes: UniversalTopologyNode[] = graph.nodes.map((row: Record<string, unknown>) => ({
      nodeKey: String(row.node_key),
      scanId: String(row.scan_id),
      nodeType: String(row.node_type) as UniversalTopologyNode['nodeType'],
      canonicalKey: String(row.canonical_key),
      displayName: String(row.display_name),
      applicationKey: row.application_key ? String(row.application_key) : null,
      moduleKey: row.module_key ? String(row.module_key) : null,
      workspaceKey: row.workspace_key ? String(row.workspace_key) : null,
      authorityModel: row.authority_model ? String(row.authority_model) as UniversalTopologyNode['authorityModel'] : null,
      riskLevel: String(row.risk_level) as UniversalTopologyNode['riskLevel'],
      confidence: String(row.confidence) as UniversalTopologyNode['confidence'],
      confidenceScore: Number(row.confidence_score),
      metadata: asJsonObject(row.metadata),
    }))
    const sourceEvidence: UniversalEvidence[] = graph.evidence.map((row: Record<string, unknown>) => ({
      evidenceKey: String(row.evidence_key),
      scanId: String(row.scan_id),
      kind: String(row.evidence_kind) as UniversalEvidence['kind'],
      subjectKey: String(row.subject_key),
      objectKey: row.object_key ? String(row.object_key) : null,
      filePath: row.file_path ? String(row.file_path) : null,
      lineStart: row.line_start === null ? null : Number(row.line_start),
      lineEnd: row.line_end === null ? null : Number(row.line_end),
      databaseObject: row.database_object ? String(row.database_object) : null,
      summary: String(row.summary),
      excerpt: row.excerpt ? String(row.excerpt) : null,
      confidence: String(row.confidence) as UniversalEvidence['confidence'],
      confidenceScore: Number(row.confidence_score),
      metadata: asJsonObject(row.metadata),
    }))

    await updateUniversalJobState(client, jobId, { stage: 'authority_inference' })
    const manifests = inferUniversalAuthorityManifests(jobId, sourceNodes, sourceEvidence)
    await replaceUniversalManifests(client, jobId, manifests)

    await updateUniversalJobState(client, jobId, { stage: 'reconciliation' })
    const findings = await buildUniversalReconciliationFindings(client, jobId, sourceNodes, sourceEvidence, manifests)
    await replaceUniversalFindings(client, jobId, findings)

    return updateUniversalJobState(client, jobId, {
      status: 'completed',
      stage: 'completed',
      completedAt: new Date().toISOString(),
      currentItem: null,
    })
  } catch (error) {
    return updateUniversalJobState(client, jobId, {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Scanner finalization failed.',
      completedAt: new Date().toISOString(),
    })
  }
}

export async function controlUniversalAuthorizationScan(
  client: AdminClient,
  jobId: string,
  action: 'pause' | 'resume' | 'cancel',
) {
  const job = await loadUniversalJob(client, jobId)
  if (!job) throw new Error('Scanner job was not found.')
  if (action === 'pause') return updateUniversalJobState(client, jobId, { status: 'paused', pausedAt: new Date().toISOString() })
  if (action === 'resume') return updateUniversalJobState(client, jobId, { status: job.stage === 'repository_inventory' ? 'inventorying' : 'running', pausedAt: null })
  return updateUniversalJobState(client, jobId, { status: 'cancelled', cancelledAt: new Date().toISOString(), completedAt: new Date().toISOString() })
}
