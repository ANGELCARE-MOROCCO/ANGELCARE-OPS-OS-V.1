import { REVENUE_COMMAND_FAMILIES } from './constants'
import { validateCommandGraph } from './graph'
import { validateSchedule } from './scheduler'
import { validateCommandDefinition } from './schemas'
import type { RevenueCommandDefinition, RevenueCommandGraph, RevenueCommandKernelIssue, RevenueCommandKernelReadiness, RevenueCommandSchedule } from './types'
export function validateRevenueCommandKernel(commands: RevenueCommandDefinition[], graphs: RevenueCommandGraph[], schedules: RevenueCommandSchedule[]) {
  const issues: RevenueCommandKernelIssue[] = []
  const add = (code: string, severity: RevenueCommandKernelIssue['severity'], category: string, title: string, detail: string, resourceType: string, resourceId: string | undefined, remediation: string) => issues.push({ id: `issue-${issues.length + 1}`, code, severity, category, title, detail, status: 'open', resourceType, resourceId, remediation })
  const codes = new Set<string>()
  for (const command of commands) {
    if (codes.has(command.commandCode)) add('DUPLICATE_COMMAND', 'critical', 'registry', 'Code commande dupliqué', command.commandCode, 'command', command.id, 'Attribuer un code unique.')
    codes.add(command.commandCode)
    for (const error of validateCommandDefinition(command)) add('COMMAND_SCHEMA', 'high', 'schema', `Commande invalide ${command.commandCode}`, error, 'command', command.id, 'Corriger le schéma technique.')
  }
  for (const graph of graphs) for (const error of validateCommandGraph(graph, commands).errors) add('GRAPH_INVALID', 'high', 'graph', `Graphe invalide ${graph.code}`, error, 'graph', graph.id, 'Corriger les nœuds ou dépendances.')
  for (const schedule of schedules) for (const error of validateSchedule(schedule).errors) add('SCHEDULE_INVALID', 'high', 'schedule', `Planification invalide ${schedule.code}`, error, 'schedule', schedule.id, 'Corriger la cadence.')
  for (const family of REVENUE_COMMAND_FAMILIES) if (!commands.some((command) => command.family === family.code)) add('FAMILY_UNSEEDED', 'low', 'taxonomy', 'Famille sans commande', family.name, 'family', family.id, 'Ajouter une commande.')
  const metric = (category: string, total: number) => Math.max(0, Math.round(100 - (issues.filter((issue) => issue.category === category).length / Math.max(1, total)) * 100))
  const readiness: RevenueCommandKernelReadiness = { schemaIntegrity: metric('schema', commands.length), registryIntegrity: metric('registry', commands.length), eligibilityCoverage: metric('eligibility', commands.length), routingDeterminism: metric('routing', commands.length), graphSafety: metric('graph', Math.max(1, graphs.length)), permissionSafety: 100, shadowSafety: 100, rollbackReadiness: metric('rollback', commands.length), testCoverage: metric('test', commands.length), overall: 0 }
  readiness.overall = Math.round(Object.entries(readiness).filter(([key]) => key !== 'overall').reduce((sum, [, value]) => sum + value, 0) / 9)
  return { issues, readiness }
}
