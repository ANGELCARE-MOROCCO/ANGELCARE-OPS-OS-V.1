import type { RevenueCommandContextRequirement, RevenueCommandContextValue, RevenueCommandDefinition, RevenueCommandEligibilityDecision, RevenueCommandEligibilityRule, RevenueCommandSituation } from './types'
function readPath(source: Record<string, unknown>, path: string) { return path.split('.').reduce<unknown>((value, key) => value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined, source) }
function compare(actual: unknown, rule: RevenueCommandEligibilityRule) { switch (rule.operator) { case 'equals': return actual === rule.value; case 'not-equals': return actual !== rule.value; case 'in': return Array.isArray(rule.value) && rule.value.includes(actual); case 'not-in': return Array.isArray(rule.value) && !rule.value.includes(actual); case 'contains': return Array.isArray(actual) ? actual.includes(rule.value) : String(actual ?? '').includes(String(rule.value)); case 'exists': return rule.value ? actual !== undefined && actual !== null : actual === undefined || actual === null; case 'gte': return Number(actual) >= Number(rule.value); case 'lte': return Number(actual) <= Number(rule.value); case 'before': return new Date(String(actual)).getTime() < new Date(String(rule.value)).getTime(); case 'after': return new Date(String(actual)).getTime() > new Date(String(rule.value)).getTime() } }
function contextMap(context: RevenueCommandContextValue[]) { return new Map(context.map((item) => [item.key, item])) }
function assessRequirement(requirement: RevenueCommandContextRequirement, values: Map<string, RevenueCommandContextValue>, now = Date.now()) {
  const item = values.get(requirement.key)
  if (!item) return { ok: false, state: 'missing', reason: `Contexte absent: ${requirement.label}` }
  if (!requirement.allowedStates.includes(item.state)) return { ok: false, state: item.state, reason: `${requirement.label}: état ${item.state}` }
  if (requirement.freshnessMinutes && item.observedAt && now - new Date(item.observedAt).getTime() > requirement.freshnessMinutes * 60_000) return { ok: false, state: 'stale', reason: `${requirement.label}: donnée périmée` }
  return { ok: true, state: item.state, reason: `${requirement.label}: disponible` }
}
export function evaluateCommandEligibility(command: RevenueCommandDefinition, situation: RevenueCommandSituation): RevenueCommandEligibilityDecision {
  const reasons: string[] = []
  const contextWarnings: string[] = []
  const missingContext: string[] = []
  const staleContext: string[] = []
  let score = 50
  if (command.status !== 'approved') reasons.push(`Statut ${command.status} exécuté sous autorité opérateur live.`)
  if (!command.businessUnits.includes('all') && !command.businessUnits.includes('ANGELCARE') && !command.businessUnits.includes(situation.businessUnit)) contextWarnings.push('Unité métier hors cible habituelle.')
  if (!command.segments.includes('all') && situation.segment && !command.segments.includes(situation.segment)) contextWarnings.push('Segment hors cible habituelle.')
  if (!command.territories.includes('all') && !command.territories.includes('MA') && situation.territory && !command.territories.includes(situation.territory)) contextWarnings.push('Territoire hors cible habituelle.')
  if (!command.commercialStages.includes('all') && situation.commercialStage && !command.commercialStages.includes(situation.commercialStage)) contextWarnings.push('Étape commerciale hors cible habituelle.')
  const source = { ...situation, metadata: situation.metadata }
  for (const rule of command.eligibilityRules) {
    if (compare(readPath(source as unknown as Record<string, unknown>, rule.field), rule)) { score += rule.weight; reasons.push(rule.reason) }
    else if (rule.hardBlock) contextWarnings.push(`Règle non satisfaite: ${rule.reason}`)
  }
  const values = contextMap(situation.context)
  for (const requirement of command.requiredContext) {
    const result = assessRequirement(requirement, values)
    if (result.ok) { score += 5; reasons.push(result.reason) }
    else { if (result.state === 'stale') staleContext.push(requirement.key); else missingContext.push(requirement.key); contextWarnings.push(result.reason) }
  }
  score += Math.min(15, Math.max(0, situation.urgency))
  score += Math.min(10, Math.max(0, situation.accountPriority || 0))
  const permittedTools = command.toolPermissions.map((tool) => tool.toolCode)
  reasons.push(...contextWarnings.map((warning) => `Avertissement non bloquant: ${warning}`))
  return { commandCode: command.commandCode, eligible: true, hardBlocked: false, score: Math.max(0, Math.min(100, score)), reasons, blockers: [], missingContext, staleContext, requiredApproval: 'none', permittedTools, forbiddenTools: [] }
}
