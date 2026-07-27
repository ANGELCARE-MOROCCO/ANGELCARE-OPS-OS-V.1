import type { AcCapitalOsRolePermission } from './types';

export const AC_CAPITAL_OS_ROLE_PERMISSIONS: AcCapitalOsRolePermission[] = [
  {
    role: 'founder',
    canView: true,
    canCreate: true,
    canApprove: true,
    canExecuteExternalCommunication: true,
    canInjectDoctrine: true,
    canManageAi: true,
  },
  {
    role: 'capital-admin',
    canView: true,
    canCreate: true,
    canApprove: true,
    canExecuteExternalCommunication: false,
    canInjectDoctrine: true,
    canManageAi: false,
  },
  {
    role: 'coordinator',
    canView: true,
    canCreate: true,
    canApprove: false,
    canExecuteExternalCommunication: false,
    canInjectDoctrine: false,
    canManageAi: false,
  },
  {
    role: 'viewer',
    canView: true,
    canCreate: false,
    canApprove: false,
    canExecuteExternalCommunication: false,
    canInjectDoctrine: false,
    canManageAi: false,
  },
  {
    role: 'ai-system',
    canView: true,
    canCreate: true,
    canApprove: false,
    canExecuteExternalCommunication: false,
    canInjectDoctrine: false,
    canManageAi: false,
  },
];

export function canAccessAcCapitalOs(role: AcCapitalOsRolePermission['role'] | null | undefined) {
  if (!role) return false;
  return AC_CAPITAL_OS_ROLE_PERMISSIONS.some((permission) => permission.role === role && permission.canView);
}

export function getAcCapitalOsRolePermission(role: AcCapitalOsRolePermission['role']) {
  return AC_CAPITAL_OS_ROLE_PERMISSIONS.find((permission) => permission.role === role);
}
