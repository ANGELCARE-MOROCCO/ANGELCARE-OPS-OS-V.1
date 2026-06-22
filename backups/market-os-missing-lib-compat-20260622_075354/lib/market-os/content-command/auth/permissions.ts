export type ContentCommandRole =
  | 'viewer'
  | 'creator'
  | 'reviewer'
  | 'publisher'
  | 'brand_manager'
  | 'marketing_director'
  | 'executive'
  | 'admin';

export type ContentCommandPermission =
  | 'content:read'
  | 'content:create'
  | 'content:update'
  | 'content:archive'
  | 'approval:review'
  | 'publishing:queue'
  | 'ai:run'
  | 'audit:read'
  | 'admin:configure';

const rolePermissions: Record<ContentCommandRole, ContentCommandPermission[]> = {
  viewer: ['content:read'],
  creator: ['content:read', 'content:create', 'content:update', 'ai:run'],
  reviewer: ['content:read', 'approval:review'],
  publisher: ['content:read', 'publishing:queue'],
  brand_manager: ['content:read', 'approval:review', 'audit:read'],
  marketing_director: ['content:read', 'content:create', 'content:update', 'content:archive', 'approval:review', 'publishing:queue', 'ai:run', 'audit:read'],
  executive: ['content:read', 'audit:read'],
  admin: ['content:read', 'content:create', 'content:update', 'content:archive', 'approval:review', 'publishing:queue', 'ai:run', 'audit:read', 'admin:configure'],
};

export function hasContentCommandPermission(role: ContentCommandRole, permission: ContentCommandPermission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function assertContentCommandPermission(role: ContentCommandRole, permission: ContentCommandPermission): void {
  if (!hasContentCommandPermission(role, permission)) {
    throw new Error(`Missing permission: ${permission}`);
  }
}