export function isCareLinkAgentRole(role?: string | null) {
  return ['field_agent', 'caregiver', 'childcare_specialist', 'home_care_provider'].includes(String(role || '').toLowerCase())
}

export function isCareLinkOpsRole(role?: string | null) {
  return ['admin', 'dispatcher', 'operations_manager', 'compliance_manager', 'finance_manager'].includes(String(role || '').toLowerCase())
}
