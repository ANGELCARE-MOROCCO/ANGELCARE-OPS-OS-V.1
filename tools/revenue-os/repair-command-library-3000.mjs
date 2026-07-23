#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')
const opsRoot = path.join(repoRoot, 'apps', 'ops-web')
const sourceRoot = path.join(opsRoot, 'lib', 'revenue-command-os', 'command-kernel', 'commands-3000')
const apply = process.argv.includes('--apply')
const batchSize = 100

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(sourceRoot, name), 'utf8'))
}

const commands = readJson('commands-3000.commands.json')
const versions = readJson('commands-3000.versions.json')
const triggers = readJson('commands-3000.triggers.json')
const schedules = readJson('commands-3000.schedules.json')
const graphs = readJson('commands-3000.graphs.json')

function assertCanonical() {
  if (commands.length !== 3000) throw new Error(`Expected 3000 commands; found ${commands.length}`)
  const codes = new Set(commands.map((item) => item.commandCode))
  if (codes.size !== 3000) throw new Error(`Command codes are not unique: ${codes.size}/3000`)
  for (const collection of [versions, triggers, schedules]) {
    for (const item of collection) {
      if (!codes.has(item.commandCode)) throw new Error(`Unknown command code in canonical asset: ${item.commandCode}`)
    }
  }
  for (const graph of graphs) {
    for (const node of graph.nodes ?? []) {
      if (!codes.has(node.commandCode)) throw new Error(`Unknown graph command code: ${node.commandCode}`)
    }
  }
  return codes
}

const canonicalCodes = assertCanonical()
console.log(JSON.stringify({
  mode: apply ? 'apply' : 'dry-run',
  commands: commands.length,
  versions: versions.length,
  triggers: triggers.length,
  schedules: schedules.length,
  graphs: graphs.length,
}, null, 2))

if (!apply) {
  console.log('DRY_RUN_OK: canonical assets are internally consistent. Add --apply to repair Supabase.')
  process.exit(0)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')
}

const { createClient } = await import('@supabase/supabase-js')
const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function upsertBatches(table, rows, onConflict) {
  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize)
    const result = await supabase.from(table).upsert(batch, { onConflict })
    if (result.error) throw new Error(`${table} batch ${index / batchSize + 1}: ${result.error.message}`)
    process.stdout.write(`\r${table}: ${Math.min(index + batch.length, rows.length)}/${rows.length}`)
  }
  process.stdout.write('\n')
}

const commandRows = commands.map((item) => ({
  command_code: item.commandCode,
  name: item.name,
  family_code: item.family,
  purpose: item.purpose,
  owner_role: item.ownerRole,
  status: item.status,
  active_version: item.activeVersion,
  business_units: item.businessUnits,
  segments: item.segments,
  territories: item.territories,
  commercial_stages: item.commercialStages,
  trigger_types: item.triggerTypes,
  eligibility_rules: item.eligibilityRules,
  required_context: item.requiredContext,
  optional_context: item.optionalContext,
  tool_permissions: item.toolPermissions,
  input_schema: item.inputSchema,
  output_schema: item.outputSchema,
  validator_chain: item.validatorChain,
  approval_class: item.approvalClass,
  downstream_compiler: item.downstreamCompiler ?? null,
  cooldown_policy: item.cooldown,
  retry_policy: item.retryPolicy,
  failure_policy: item.failurePolicy,
  fallback_command_codes: item.fallbackCommandCodes,
  performance_metrics: item.performanceMetrics,
  prohibited_cases: item.prohibitedCases,
  expected_outcomes: item.expectedOutcomes,
  tags: item.tags,
  created_at: item.createdAt,
  updated_at: item.updatedAt,
}))

await upsertBatches('revenue_os_command_definitions', commandRows, 'command_code')

const idByCode = new Map()
for (let from = 0; ; from += 1000) {
  const result = await supabase
    .from('revenue_os_command_definitions')
    .select('id,command_code')
    .range(from, from + 999)
  if (result.error) throw new Error(`Read command IDs: ${result.error.message}`)
  for (const row of result.data ?? []) idByCode.set(row.command_code, row.id)
  if ((result.data ?? []).length < 1000) break
}

const missingIds = [...canonicalCodes].filter((code) => !idByCode.has(code))
if (missingIds.length) throw new Error(`Database is missing ${missingIds.length} canonical command IDs after upsert.`)

const commandByCode = new Map(commands.map((item) => [item.commandCode, item]))
const versionRows = versions.map((item) => ({
  command_id: idByCode.get(item.commandCode),
  command_code: item.commandCode,
  version: item.version,
  status: item.status,
  snapshot: commandByCode.get(item.commandCode),
  schema_hash: item.schemaHash,
  effective_at: item.effectiveAt,
  approved_at: item.approvedAt ?? null,
  approved_by: null,
  change_summary: item.changeSummary,
  created_at: item.createdAt,
}))
await upsertBatches('revenue_os_command_versions', versionRows, 'command_code,version')

const triggerRows = triggers.map((item) => ({
  code: item.code,
  command_code: item.commandCode,
  trigger_type: item.type,
  source: item.source,
  event_type: item.eventType ?? null,
  condition_expression: item.conditionExpression ?? null,
  active: item.active,
  replay_window_minutes: item.replayWindowMinutes,
  priority: item.priority,
  updated_at: new Date().toISOString(),
}))
await upsertBatches('revenue_os_command_triggers', triggerRows, 'code')

const scheduleRows = schedules.map((item) => ({
  code: item.code,
  command_code: item.commandCode,
  label: item.label,
  enabled: item.enabled,
  timezone: item.timezone,
  cadence: item.cadence,
  business_hours_only: item.businessHoursOnly,
  next_run_at: item.nextRunAt ?? null,
  missed_run_policy: item.missedRunPolicy,
  owner_role: item.ownerRole,
  execution_mode: item.executionMode,
  updated_at: new Date().toISOString(),
}))
await upsertBatches('revenue_os_command_schedules', scheduleRows, 'code')

const graphRows = graphs.map((item) => ({
  code: item.code,
  version: item.version,
  name: item.name,
  description: item.description,
  status: item.status,
  graph_payload: item,
  created_at: item.createdAt,
  updated_at: item.updatedAt,
}))
await upsertBatches('revenue_os_command_graphs', graphRows, 'code,version')

const persistedCodes = new Set()
for (let from = 0; ; from += 1000) {
  const result = await supabase
    .from('revenue_os_command_definitions')
    .select('command_code')
    .range(from, from + 999)
  if (result.error) throw new Error(`Verify command registry: ${result.error.message}`)
  for (const row of result.data ?? []) persistedCodes.add(row.command_code)
  if ((result.data ?? []).length < 1000) break
}

const missing = [...canonicalCodes].filter((code) => !persistedCodes.has(code))
if (missing.length) throw new Error(`COMMAND_LIBRARY_REPAIR_FAILED: ${missing.length} canonical commands remain missing.`)

await supabase.from('revenue_os_system_checks').upsert({
  check_key: 'revenue-os-production-consistency',
  label: 'Cohérence production Revenue Command OS',
  status: 'operational',
  detail: 'Registre canonique Commandes 3000 réparé et vérifié.',
  recommended_action: null,
  checked_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  metadata: { expectedCommands: 3000, canonicalCommandsPresent: 3000, externalActionsEnabled: false },
}, { onConflict: 'check_key' })

console.log('COMMAND_LIBRARY_3000_REPAIR_OK: 3000 canonical commands are persisted.')
