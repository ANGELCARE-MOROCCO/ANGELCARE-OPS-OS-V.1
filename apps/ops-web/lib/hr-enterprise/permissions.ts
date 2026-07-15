export const HR_ROLE_MATRIX = {
  ceo: ['read_all','write_all','approve_all','export_all','configure_hr'],
  hr_manager: ['read_all','write_hr','approve_hr','export_hr'],
  operations_manager: ['read_staff','read_attendance','write_rosters','approve_attendance'],
  finance: ['read_payroll','export_payroll','read_attendance'],
  coordinator: ['read_staff','write_attendance','write_rosters'],
  staff: ['read_self','request_leave','view_attendance'],
  caregiver: ['read_self','punch_attendance','view_missions'],
} as const
export function canHR(role: string, permission: string){ return ((HR_ROLE_MATRIX as any)[role] || []).includes(permission) }
