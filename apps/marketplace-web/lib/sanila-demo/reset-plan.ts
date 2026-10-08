export const SANILA_MASTER_DEMO_RESET_PRESERVED_TABLES = Object.freeze([
  'angelcare360_schools',
  'angelcare360_operator_tenants',
  'angelcare360_operator_tenant_access_accounts',
  'angelcare360_user_roles',
  'angelcare360_access_scopes',
  'angelcare360_sensitive_access_grants',
  'angelcare360_temporary_access_grants',
])

export function isMasterDemoResetCandidate(tableName: string, columns: readonly string[]) {
  const securityAuthority = tableName.startsWith('angelcare360_access_') || tableName.startsWith('angelcare360_operator_tenant_')
  return tableName.startsWith('angelcare360_') && columns.includes('school_id') && !securityAuthority && !SANILA_MASTER_DEMO_RESET_PRESERVED_TABLES.includes(tableName)
}
