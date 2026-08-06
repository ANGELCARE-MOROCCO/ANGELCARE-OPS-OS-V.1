import { evaluateCommandEligibility } from './eligibility'
import { createRunIdempotencyKey, sha256 } from './idempotency'
import { evaluateCommandPermission } from './permissions'
import type { RevenueCommandDefinition, RevenueCommandRunPlan, RevenueCommandSituation } from './types'
export function routeRevenueCommands(commands: RevenueCommandDefinition[], situation: RevenueCommandSituation): RevenueCommandRunPlan {
  const requestedCode = String(situation.metadata.requestedCommandCode || '').trim()
  const candidates = requestedCode ? commands.filter((command) => command.commandCode === requestedCode) : commands
  if (requestedCode && !candidates.length) throw new Error(`COMMAND_NOT_FOUND:${requestedCode}`)
  const decisions = candidates.map((command) => {
    const eligibility = evaluateCommandEligibility(command, situation)
    const permission = evaluateCommandPermission(command, situation, 'live')
    eligibility.reasons.push(...permission.reasons)
    return eligibility
  }).sort((left, right) => right.score - left.score || left.commandCode.localeCompare(right.commandCode))
  const eligible = decisions
  const byCode = new Map(candidates.map((command) => [command.commandCode, command]))
  const steps = eligible.map((decision, index) => {
    const command = byCode.get(decision.commandCode)!
    return { order: (index + 1) * 10, commandCode: command.commandCode, version: command.activeVersion, mode: 'live' as const, status: 'ready' as const, dependsOn: [], intendedTools: command.toolPermissions.map((tool) => tool.toolCode), expectedOutput: command.outputSchema.map((field) => field.key), reasons: decision.reasons }
  })
  const contextFingerprint = sha256(situation.context.map((context) => ({ key: context.key, state: context.state, value: context.value, observedAt: context.observedAt, source: context.source })))
  const commandCodes = steps.map((step) => step.commandCode)
  const idempotencyKey = createRunIdempotencyKey({ tenantId: situation.tenantId, situationId: situation.id, commandCodes, mode: 'live', contextFingerprint, window: new Date().toISOString().slice(0, 13) })
  const deterministicBasis = { situationId: situation.id, idempotencyKey, mode: 'live' as const, eligible, excluded: [], blocked: [], steps, approvalClasses: ['none' as const], prohibitedActions: [] as string[] }
  const deterministicHash = sha256(deterministicBasis)
  return { id: `plan_${deterministicHash.slice(0, 24)}`, ...deterministicBasis, createdAt: new Date().toISOString(), deterministicHash }
}
