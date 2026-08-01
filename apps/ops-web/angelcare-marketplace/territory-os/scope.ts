import type { MarketplaceRequestContext } from '../domain/types'
import { MarketplaceError } from '../server/errors'

export function hasGlobalTerritoryScope(context: MarketplaceRequestContext): boolean {
  return context.assignments.some((assignment) => assignment.scopeType === 'global') ||
    context.roleKeys.includes('marketplace_executive') ||
    context.roleKeys.includes('marketplace_admin')
}

export function allowedTerritoryIds(context: MarketplaceRequestContext): string[] {
  return [...new Set([
    ...context.assignments.map((assignment) => assignment.territoryId).filter((value): value is string => Boolean(value)),
    ...(context.territoryId ? [context.territoryId] : []),
  ])]
}

export function assertTerritoryScope(context: MarketplaceRequestContext, territoryId: string): void {
  if (hasGlobalTerritoryScope(context)) return
  if (allowedTerritoryIds(context).includes(territoryId)) return
  throw new MarketplaceError('SCOPE_MISMATCH', 'Ce territoire ne fait pas partie de votre périmètre autorisé.')
}

export function applyTerritoryScope<T extends { in: (column: string, values: string[]) => T }>(
  query: T,
  context: MarketplaceRequestContext,
  column = 'id',
): T {
  if (hasGlobalTerritoryScope(context)) return query
  const allowed = allowedTerritoryIds(context)
  if (!allowed.length) throw new MarketplaceError('SCOPE_MISMATCH', 'Aucun territoire n’est assigné à ce compte.')
  return query.in(column, allowed)
}
