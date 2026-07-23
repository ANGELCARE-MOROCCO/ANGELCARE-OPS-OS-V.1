import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import { publicRevenueOsMessage, RevenueOsError } from '../errors'
import { REVENUE_OS_CONTRACT_VERSION } from '../constants'
import {
  REVENUE_COMMAND_FAMILIES,
  REVENUE_COMMAND_KERNEL_EXTERNAL_ACTIONS,
  REVENUE_COMMAND_KERNEL_EXECUTION_POSTURE,
  REVENUE_COMMAND_KERNEL_MODULE_VERSION,
  REVENUE_COMMAND_KERNEL_RELEASE_CODE,
} from './constants'
import cumulativeCommands from './commands-3000/commands-3000.commands.json'
import cumulativeVersions from './commands-3000/commands-3000.versions.json'
import cumulativeTriggers from './commands-3000/commands-3000.triggers.json'
import cumulativeSchedules from './commands-3000/commands-3000.schedules.json'
import cumulativeGraphs from './commands-3000/commands-3000.graphs.json'
import { routeRevenueCommands } from './router'
import { executeShadowPlan } from './runtime'
import { validateRevenueCommandKernel } from './validation'
import type {
  RevenueCommandDefinition,
  RevenueCommandGraph,
  RevenueCommandKernelBootstrap,
  RevenueCommandRun,
  RevenueCommandSchedule,
  RevenueCommandSituation,
  RevenueCommandTrigger,
  RevenueCommandVersion,
} from './types'

const EXPECTED_COMMAND_COUNT = 3000
const arrayOf = (value: unknown) => (Array.isArray(value) ? value : [])

async function selectRows(client: any, table: string, tenantId?: string) {
  let query = client.from(table).select('*')
  if (tenantId && table === 'revenue_os_command_runs') query = query.eq('tenant_id', tenantId)
  const result = await query.order('created_at', { ascending: true })
  if (result.error) throw result.error
  return result.data ?? []
}

function persistedCommand(row: any): RevenueCommandDefinition {
  return {
    id: String(row.id),
    commandCode: String(row.command_code),
    name: String(row.name),
    family: row.family_code,
    purpose: String(row.purpose),
    ownerRole: String(row.owner_role),
    status: row.status,
    activeVersion: String(row.active_version),
    businessUnits: arrayOf(row.business_units).map(String),
    segments: arrayOf(row.segments).map(String),
    territories: arrayOf(row.territories).map(String),
    commercialStages: arrayOf(row.commercial_stages).map(String),
    triggerTypes: arrayOf(row.trigger_types) as any,
    eligibilityRules: arrayOf(row.eligibility_rules) as any,
    requiredContext: arrayOf(row.required_context) as any,
    optionalContext: arrayOf(row.optional_context) as any,
    toolPermissions: arrayOf(row.tool_permissions) as any,
    inputSchema: arrayOf(row.input_schema) as any,
    outputSchema: arrayOf(row.output_schema) as any,
    validatorChain: arrayOf(row.validator_chain).map(String),
    approvalClass: row.approval_class,
    downstreamCompiler: row.downstream_compiler ? String(row.downstream_compiler) : undefined,
    cooldown: row.cooldown_policy,
    retryPolicy: row.retry_policy,
    failurePolicy: row.failure_policy,
    fallbackCommandCodes: arrayOf(row.fallback_command_codes).map(String),
    performanceMetrics: arrayOf(row.performance_metrics).map(String),
    prohibitedCases: arrayOf(row.prohibited_cases).map(String),
    expectedOutcomes: arrayOf(row.expected_outcomes).map(String),
    tags: arrayOf(row.tags).map(String),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

function overlayCanonicalCommands(rows: any[]) {
  const canonical = cumulativeCommands as RevenueCommandDefinition[]
  const canonicalByCode = new Map(canonical.map((item) => [item.commandCode, item]))
  const persisted = rows.map(persistedCommand)
  const persistedByCode = new Map(persisted.map((item) => [item.commandCode, item]))
  const unknownPersisted = persisted.filter((item) => !canonicalByCode.has(item.commandCode))
  const missing = canonical.filter((item) => !persistedByCode.has(item.commandCode))
  let driftCount = unknownPersisted.length

  const commands = canonical.map((item) => {
    const override = persistedByCode.get(item.commandCode)
    if (!override) return item
    if (
      override.name !== item.name ||
      override.family !== item.family ||
      override.activeVersion !== item.activeVersion ||
      override.status !== item.status
    ) {
      driftCount += 1
    }
    return {
      ...item,
      id: override.id || item.id,
      status: override.status || item.status,
      activeVersion: override.activeVersion || item.activeVersion,
      updatedAt: override.updatedAt || item.updatedAt,
    }
  })

  return {
    commands,
    persistedCount: persisted.filter((item) => canonicalByCode.has(item.commandCode)).length,
    missingCount: missing.length,
    driftCount,
    unknownPersisted,
  }
}

export async function readRevenueCommandKernel(
  tenantId?: string,
): Promise<{ bootstrap: RevenueCommandKernelBootstrap; warnings: string[] }> {
  const warnings: string[] = []
  let storageMode: RevenueCommandKernelBootstrap['storageMode'] = 'canonical-only'
  let dataMode: RevenueCommandKernelBootstrap['dataMode'] = 'canonical-fallback'
  let commands = cumulativeCommands as RevenueCommandDefinition[]
  const versions = cumulativeVersions as RevenueCommandVersion[]
  const triggers = cumulativeTriggers as RevenueCommandTrigger[]
  const schedules = cumulativeSchedules as RevenueCommandSchedule[]
  const graphs = cumulativeGraphs as RevenueCommandGraph[]
  let runs: RevenueCommandRun[] = []
  let persistedCount = 0
  let missingCount = EXPECTED_COMMAND_COUNT
  let driftCount = 0

  try {
    const client = await createServiceClient()
    const [definitionRows, runRows] = await Promise.all([
      selectRows(client, 'revenue_os_command_definitions'),
      selectRows(client, 'revenue_os_command_runs', tenantId),
    ])
    const overlay = overlayCanonicalCommands(definitionRows)
    commands = overlay.commands
    persistedCount = overlay.persistedCount
    missingCount = overlay.missingCount
    driftCount = overlay.driftCount
    runs = runRows as RevenueCommandRun[]
    storageMode = missingCount === 0 && driftCount === 0 ? 'supabase-overlay' : 'degraded'
    dataMode = missingCount === 0 && driftCount === 0 ? 'live' : 'degraded'

    if (missingCount) warnings.push(`${missingCount} commandes canoniques sont absentes du registre Supabase; la bibliothèque embarquée reste autorité de lecture.`)
    if (driftCount) warnings.push(`${driftCount} divergences de registre ont été détectées; seules les propriétés runtime sûres sont superposées.`)
  } catch (error) {
    warnings.push(`${publicRevenueOsMessage(error instanceof Error ? error.message : 'Source indisponible.')} La bibliothèque canonique Commandes 3000 reste active.`)
  }

  const validation = validateRevenueCommandKernel(commands, graphs, schedules)
  const issues = [...validation.issues]
  if (missingCount) {
    issues.unshift({
      id: 'registry-missing-canonical-commands',
      code: 'REGISTRY_INCOMPLETE',
      severity: 'high',
      category: 'registry',
      title: 'Registre Supabase incomplet',
      detail: `${missingCount} commandes canoniques sont absentes du registre persisté.`,
      status: 'open',
      resourceType: 'command_registry',
      remediation: 'Exécuter le réparateur idempotent Commands 3000 et revalider le snapshot.',
    })
  }
  if (driftCount) {
    issues.unshift({
      id: 'registry-drift-detected',
      code: 'REGISTRY_DRIFT',
      severity: 'high',
      category: 'registry',
      title: 'Dérive du registre Commandes 3000',
      detail: `${driftCount} définitions persistées divergent du contrat canonique.`,
      status: 'open',
      resourceType: 'command_registry',
      remediation: 'Réconcilier les définitions persistées depuis la bibliothèque canonique signée.',
    })
  }

  const readiness = {
    ...validation.readiness,
    schemaIntegrity: commands.length === EXPECTED_COMMAND_COUNT ? validation.readiness.schemaIntegrity : 0,
    registryIntegrity: Math.max(0, Math.round(((EXPECTED_COMMAND_COUNT - missingCount - driftCount) / EXPECTED_COMMAND_COUNT) * 100)),
  }
  readiness.overall = Math.round(Object.values(readiness).reduce((sum, value) => sum + value, 0) / Object.keys(readiness).length)

  const bootstrap: RevenueCommandKernelBootstrap = {
    contractVersion: REVENUE_OS_CONTRACT_VERSION,
    releaseCode: REVENUE_COMMAND_KERNEL_RELEASE_CODE,
    moduleVersion: REVENUE_COMMAND_KERNEL_MODULE_VERSION,
    executionPosture: REVENUE_COMMAND_KERNEL_EXECUTION_POSTURE,
    externalActionsEnabled: REVENUE_COMMAND_KERNEL_EXTERNAL_ACTIONS,
    generatedAt: new Date().toISOString(),
    storageMode,
    dataMode,
    expectedCount: EXPECTED_COMMAND_COUNT,
    persistedCount,
    missingCount,
    driftCount,
    families: REVENUE_COMMAND_FAMILIES,
    commands,
    versions,
    triggers,
    schedules,
    graphs,
    runs,
    issues,
    readiness,
    counters: {
      commands: commands.length,
      approved: commands.filter((command) => command.status === 'approved').length,
      rejected: commands.filter((command) => command.status === 'rejected').length,
      families: REVENUE_COMMAND_FAMILIES.length,
      triggers: triggers.length,
      schedules: schedules.length,
      graphs: graphs.length,
      runs: runs.length,
      issues: issues.length,
      externalActions: 0,
      golden300: commands.filter((command) => command.tags.includes('golden-300')).length,
      mz07New700: commands.filter((command) => command.tags.includes('new-700')).length,
      commands1000: commands.filter((command) => command.tags.includes('golden-300') || command.tags.includes('new-700')).length,
      mz08New1000: commands.filter((command) => command.tags.includes('new-1000')).length,
      commands2000: commands.filter((command) => command.tags.includes('golden-300') || command.tags.includes('new-700') || command.tags.includes('new-1000')).length,
      mz09Final1000: commands.filter((command) => command.tags.includes('final-1000')).length,
      commands3000: commands.length,
      persistedCommands: persistedCount,
      missingCommands: missingCount,
      registryDrift: driftCount,
    },
  }

  return { bootstrap, warnings }
}

export async function simulateRevenueCommandSituation(situation: RevenueCommandSituation) {
  const { bootstrap } = await readRevenueCommandKernel(situation.tenantId)
  const plan = routeRevenueCommands(bootstrap.commands, situation)
  const execution = executeShadowPlan(plan, bootstrap.commands)
  return { plan, execution, posture: 'shadow', externalActionsPerformed: 0 }
}

export async function persistKernelValidation(tenantId: string, actorId: string) {
  const { bootstrap, warnings } = await readRevenueCommandKernel(tenantId)
  const client = await createServiceClient()
  const snapshot = {
    tenant_id: tenantId,
    actor_id: actorId,
    expected_count: bootstrap.expectedCount,
    persisted_count: bootstrap.persistedCount,
    missing_count: bootstrap.missingCount,
    drift_count: bootstrap.driftCount,
    readiness: bootstrap.readiness,
    issues: bootstrap.issues,
    warnings,
    storage_mode: bootstrap.storageMode,
    data_mode: bootstrap.dataMode,
    validated_at: new Date().toISOString(),
  }
  const result = await client.from('revenue_os_command_validation_snapshots').insert(snapshot).select('*').single()
  if (result.error) {
    throw new RevenueOsError('REVENUE_OS_STORAGE_FAILED', 'Impossible de persister le snapshot de validation Commandes 3000.', {
      status: 503,
      recoverable: true,
      cause: result.error,
      context: { table: 'revenue_os_command_validation_snapshots' },
    })
  }
  return { ...snapshot, id: result.data.id, persisted: true }
}
