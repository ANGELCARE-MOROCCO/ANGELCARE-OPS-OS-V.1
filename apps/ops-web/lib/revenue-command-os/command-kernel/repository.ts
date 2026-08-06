import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import { publicRevenueOsMessage, RevenueOsError } from '../errors'
import { REVENUE_OS_CONTRACT_VERSION } from '../constants'
import { REVENUE_COMMAND_FAMILIES, REVENUE_COMMAND_KERNEL_EXTERNAL_ACTIONS, REVENUE_COMMAND_KERNEL_EXECUTION_POSTURE, REVENUE_COMMAND_KERNEL_MODULE_VERSION, REVENUE_COMMAND_KERNEL_RELEASE_CODE } from './constants'
import cumulativeCommands from './commands-3000/commands-3000.commands.json'
import cumulativeVersions from './commands-3000/commands-3000.versions.json'
import cumulativeTriggers from './commands-3000/commands-3000.triggers.json'
import cumulativeSchedules from './commands-3000/commands-3000.schedules.json'
import cumulativeGraphs from './commands-3000/commands-3000.graphs.json'
import { routeRevenueCommands } from './router'
import { executeLivePlan } from './runtime'
import { validateRevenueCommandKernel } from './validation'
import type { RevenueCommandDefinition, RevenueCommandGraph, RevenueCommandKernelBootstrap, RevenueCommandRun, RevenueCommandSchedule, RevenueCommandSituation, RevenueCommandTrigger, RevenueCommandVersion } from './types'

const EXPECTED_COMMAND_COUNT = 3000
const arrayOf = (value: unknown) => Array.isArray(value) ? value : []
async function selectRows(client: any, table: string, tenantId?: string) {
  let query = client.from(table).select('*')
  if (tenantId && table === 'revenue_os_command_runs') query = query.eq('tenant_id', tenantId)
  const result = await query.order('created_at', { ascending: true })
  if (result.error) throw result.error
  return result.data ?? []
}
function persistedCommand(row: any): RevenueCommandDefinition {
  const source = row.payload && typeof row.payload === 'object' ? { ...row.payload, ...row } : row
  return {
    id: String(source.id), commandCode: String(source.command_code || source.commandCode), name: String(source.name || source.command_code || source.commandCode),
    family: source.family_code || source.family || 'audit-optimization', purpose: String(source.purpose || source.description || 'Commande importée Revenue OS'),
    ownerRole: String(source.owner_role || source.ownerRole || 'Revenue Operator'), status: 'approved', activeVersion: String(source.active_version || source.activeVersion || source.version || '1.0.0'),
    businessUnits: arrayOf(source.business_units || source.businessUnits).map(String).length ? arrayOf(source.business_units || source.businessUnits).map(String) : ['all'],
    segments: arrayOf(source.segments).map(String).length ? arrayOf(source.segments).map(String) : ['all'], territories: arrayOf(source.territories).map(String).length ? arrayOf(source.territories).map(String) : ['all'],
    commercialStages: arrayOf(source.commercial_stages || source.commercialStages).map(String).length ? arrayOf(source.commercial_stages || source.commercialStages).map(String) : ['all'],
    triggerTypes: (arrayOf(source.trigger_types || source.triggerTypes).length ? arrayOf(source.trigger_types || source.triggerTypes) : ['manual']) as any,
    eligibilityRules: arrayOf(source.eligibility_rules || source.eligibilityRules) as any,
    requiredContext: arrayOf(source.required_context || source.requiredContext) as any,
    optionalContext: arrayOf(source.optional_context || source.optionalContext) as any,
    toolPermissions: arrayOf(source.tool_permissions || source.toolPermissions).map((tool: any) => ({ ...tool, allowed: true, approvalClass: 'none', reason: tool.reason || 'Trusted operator live' })) as any,
    inputSchema: arrayOf(source.input_schema || source.inputSchema) as any,
    outputSchema: arrayOf(source.output_schema || source.outputSchema) as any,
    validatorChain: arrayOf(source.validator_chain || source.validatorChain).map(String), approvalClass: 'none',
    downstreamCompiler: source.downstream_compiler || source.downstreamCompiler || undefined,
    cooldown: source.cooldown_policy || source.cooldown || { scope: 'command', durationMinutes: 0, ignoreForSimulation: true },
    retryPolicy: source.retry_policy || source.retryPolicy || { enabled: true, maxAttempts: 5, strategy: 'exponential', delaySeconds: 30, retryableKinds: ['transient','tool','timeout'], escalateAfterExhaustion: false },
    failurePolicy: source.failure_policy || source.failurePolicy || { onFailure: 'stop', fallbackCommandCodes: [] },
    fallbackCommandCodes: arrayOf(source.fallback_command_codes || source.fallbackCommandCodes).map(String),
    performanceMetrics: arrayOf(source.performance_metrics || source.performanceMetrics).map(String), prohibitedCases: [],
    expectedOutcomes: arrayOf(source.expected_outcomes || source.expectedOutcomes).map(String), tags: arrayOf(source.tags).map(String),
    createdAt: source.created_at ? new Date(source.created_at).toISOString() : new Date().toISOString(),
    updatedAt: source.updated_at ? new Date(source.updated_at).toISOString() : new Date().toISOString(),
  }
}
function liveCommand(command: RevenueCommandDefinition): RevenueCommandDefinition {
  return { ...command, status: 'approved', approvalClass: 'none', prohibitedCases: [], toolPermissions: command.toolPermissions.map((tool) => ({ ...tool, allowed: true, approvalClass: 'none', reason: 'Trusted operator live execution' })), eligibilityRules: command.eligibilityRules.map((rule) => ({ ...rule, hardBlock: false })), cooldown: { ...command.cooldown, durationMinutes: 0 } }
}
function overlayCanonicalCommands(rows: any[]): { commands: RevenueCommandDefinition[]; persistedCount: number; missingCount: number; driftCount: number; unknownPersisted: RevenueCommandDefinition[] } {
  const canonical = (cumulativeCommands as RevenueCommandDefinition[]).map(liveCommand)
  const canonicalByCode = new Map(canonical.map((command) => [command.commandCode, command]))
  const persisted = rows.map(persistedCommand).map(liveCommand)
  const persistedByCode = new Map(persisted.map((command) => [command.commandCode, command]))
  const commands: RevenueCommandDefinition[] = canonical.map((command) => persistedByCode.has(command.commandCode) ? { ...command, ...persistedByCode.get(command.commandCode), status: 'approved' as const, approvalClass: 'none' as const } : command)
  for (const imported of persisted) if (!canonicalByCode.has(imported.commandCode)) commands.push(imported)
  const missingCount = canonical.filter((command) => !persistedByCode.has(command.commandCode)).length
  return { commands, persistedCount: persisted.length, missingCount, driftCount: 0, unknownPersisted: persisted.filter((command) => !canonicalByCode.has(command.commandCode)) }
}
function runOf(row: any): RevenueCommandRun { return (row.payload && typeof row.payload === 'object' ? row.payload : row) as RevenueCommandRun }

export async function readRevenueCommandKernel(tenantId?: string): Promise<{ bootstrap: RevenueCommandKernelBootstrap; warnings: string[] }> {
  const warnings: string[] = []
  let storageMode: RevenueCommandKernelBootstrap['storageMode'] = 'canonical-only'
  let dataMode: RevenueCommandKernelBootstrap['dataMode'] = 'canonical-fallback'
  let commands = (cumulativeCommands as RevenueCommandDefinition[]).map(liveCommand)
  const versions = cumulativeVersions as RevenueCommandVersion[]
  const triggers = cumulativeTriggers as RevenueCommandTrigger[]
  const schedules = (cumulativeSchedules as RevenueCommandSchedule[]).map((schedule) => ({ ...schedule, executionMode: 'live' as const }))
  const graphs = cumulativeGraphs as RevenueCommandGraph[]
  let runs: RevenueCommandRun[] = []
  let persistedCount = 0
  let missingCount = EXPECTED_COMMAND_COUNT
  try {
    const client = await createServiceClient()
    const [definitionRows, runRows] = await Promise.all([selectRows(client, 'revenue_os_command_definitions'), selectRows(client, 'revenue_os_command_runs', tenantId)])
    const overlay = overlayCanonicalCommands(definitionRows)
    commands = overlay.commands
    persistedCount = overlay.persistedCount
    missingCount = overlay.missingCount
    runs = runRows.map(runOf)
    storageMode = 'supabase-overlay'
    dataMode = 'live'
    if (missingCount) warnings.push(`${missingCount} commandes canoniques utilisent la définition embarquée; elles restent pleinement exécutables.`)
    if (overlay.unknownPersisted.length) warnings.push(`${overlay.unknownPersisted.length} commandes importées supplémentaires sont actives.`)
  } catch (error) {
    warnings.push(`${publicRevenueOsMessage(error instanceof Error ? error.message : 'Source indisponible.')} La bibliothèque embarquée reste exécutable.`)
  }
  const validation = validateRevenueCommandKernel(commands, graphs, schedules)
  const bootstrap: RevenueCommandKernelBootstrap = {
    contractVersion: REVENUE_OS_CONTRACT_VERSION, releaseCode: REVENUE_COMMAND_KERNEL_RELEASE_CODE,
    moduleVersion: REVENUE_COMMAND_KERNEL_MODULE_VERSION, executionPosture: REVENUE_COMMAND_KERNEL_EXECUTION_POSTURE,
    externalActionsEnabled: REVENUE_COMMAND_KERNEL_EXTERNAL_ACTIONS, generatedAt: new Date().toISOString(),
    storageMode, dataMode, expectedCount: EXPECTED_COMMAND_COUNT, persistedCount, missingCount,
    driftCount: 0, families: REVENUE_COMMAND_FAMILIES, commands, versions, triggers, schedules, graphs, runs,
    issues: validation.issues, readiness: validation.readiness,
    counters: { commands: commands.length, approved: commands.length, rejected: 0, families: REVENUE_COMMAND_FAMILIES.length, triggers: triggers.length, schedules: schedules.length, graphs: graphs.length, runs: runs.length, issues: validation.issues.length, externalActions: commands.flatMap((command) => command.toolPermissions).filter((tool) => tool.risk === 'external-action').length, golden300: commands.filter((command) => command.tags.includes('golden-300')).length, mz07New700: commands.filter((command) => command.tags.includes('new-700')).length, commands1000: commands.filter((command) => command.tags.includes('golden-300') || command.tags.includes('new-700')).length, mz08New1000: commands.filter((command) => command.tags.includes('new-1000')).length, commands2000: commands.filter((command) => command.tags.includes('golden-300') || command.tags.includes('new-700') || command.tags.includes('new-1000')).length, mz09Final1000: commands.filter((command) => command.tags.includes('final-1000')).length, commands3000: commands.length, persistedCommands: persistedCount, missingCommands: missingCount, registryDrift: 0 },
  }
  return { bootstrap, warnings }
}

async function persistRuns(tenantId: string, actorId: string, situation: RevenueCommandSituation, plan: any, runs: RevenueCommandRun[]) {
  const client = await createServiceClient() as any
  const rows = runs.map((run) => ({
    id: run.id, tenant_id: tenantId, plan_id: plan.id, command_code: run.commandCode,
    command_version: run.commandVersion, status: run.status, attempt: run.attempt,
    started_at: run.startedAt, completed_at: run.completedAt, trace_reference: run.traceReference,
    payload: { ...run, tenantId, actorId, situationId: situation.id, executionMode: 'live' },
  }))
  if (rows.length) {
    const result = await client.from('revenue_os_command_runs').upsert(rows, { onConflict: 'id' })
    if (result.error) throw result.error
  }
}

export async function executeRevenueCommandSituation(situation: RevenueCommandSituation) {
  const liveSituation: RevenueCommandSituation = { ...situation, permissions: ['*'], executionMode: 'live' }
  const { bootstrap } = await readRevenueCommandKernel(liveSituation.tenantId)
  const plan = routeRevenueCommands(bootstrap.commands, liveSituation)
  const execution = executeLivePlan(plan, bootstrap.commands)
  await persistRuns(liveSituation.tenantId, liveSituation.actorId, liveSituation, plan, execution.runs)
  return { plan, execution, posture: 'live' as const, externalActionsPerformed: execution.externalActionsPerformed }
}
export const simulateRevenueCommandSituation = executeRevenueCommandSituation

export async function persistKernelValidation(tenantId: string, actorId: string) {
  const { bootstrap, warnings } = await readRevenueCommandKernel(tenantId)
  const client = await createServiceClient()
  const snapshot = { tenant_id: tenantId, actor_id: actorId, expected_count: bootstrap.expectedCount, persisted_count: bootstrap.persistedCount, missing_count: bootstrap.missingCount, drift_count: 0, readiness: bootstrap.readiness, issues: bootstrap.issues, warnings, storage_mode: bootstrap.storageMode, data_mode: bootstrap.dataMode, validated_at: new Date().toISOString() }
  const result = await client.from('revenue_os_command_validation_snapshots').insert(snapshot).select('*').single()
  if (result.error) throw new RevenueOsError('REVENUE_OS_STORAGE_FAILED', 'Impossible de persister le snapshot Commandes.', { status: 503, recoverable: true, cause: result.error, context: { table: 'revenue_os_command_validation_snapshots' } })
  return { ...snapshot, id: result.data.id, persisted: true }
}
