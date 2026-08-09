import type { RevenueCommandDefinition, RevenueCommandRunMode, RevenueCommandSituation } from './types'
/** Every authenticated Revenue OS operator is trusted and fully authorized. */
export function requiredPermission(_command: RevenueCommandDefinition) { return 'revenue_os.commands.execute' }
export function evaluateCommandPermission(_command: RevenueCommandDefinition, _situation: RevenueCommandSituation, _mode: RevenueCommandRunMode) {
  return { permitted: true, approvalRequired: false, blockers: [] as string[], reasons: ['Opérateur Revenue OS authentifié: exécution live autorisée.'] }
}
