import type { EmailOsPermission, EmailOsResult } from './types';

export type PermissionAction = 'read' | 'send' | 'approve' | 'admin';

export function assertPermission(permission: EmailOsPermission | null | undefined, action: PermissionAction): EmailOsResult<true> {
  if (!permission) return { status: 'blocked', blockedReason: 'permission_missing', message: 'No mailbox permission record exists for this user.' };
  const allowed = action === 'read' ? permission.canRead : action === 'send' ? permission.canSend : action === 'approve' ? permission.canApprove : permission.canAdmin;
  if (!allowed) return { status: 'blocked', blockedReason: 'permission_denied', message: `User is not allowed to ${action} for this mailbox.` };
  return { status: 'ok', data: true, message: 'Permission granted.' };
}
