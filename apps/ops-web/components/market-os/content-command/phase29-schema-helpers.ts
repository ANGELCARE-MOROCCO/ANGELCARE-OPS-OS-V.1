import type {
  Phase29MigrationReadiness,
  Phase29RlsPolicyPlan,
  Phase29TableBlueprint,
} from './phase29-schema-types';

export function getPhase29RlsRequiredTables(tables: Phase29TableBlueprint[]): Phase29TableBlueprint[] {
  return tables.filter((table) => table.rlsRequired);
}

export function getPhase29AuditRequiredTables(tables: Phase29TableBlueprint[]): Phase29TableBlueprint[] {
  return tables.filter((table) => table.auditRequired);
}

export function getPhase29PendingRlsPolicies(policies: Phase29RlsPolicyPlan[]): Phase29RlsPolicyPlan[] {
  return policies.filter((policy) => !policy.readyForMigration);
}

export function getPhase29AverageMigrationReadiness(items: Phase29MigrationReadiness[]): number {
  if (items.length === 0) return 0;
  const total = items.reduce((sum, item) => sum + item.percent, 0);
  return Math.round(total / items.length);
}