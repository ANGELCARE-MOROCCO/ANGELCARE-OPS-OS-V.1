export interface WorkspaceAccessRow {id:string;app_user_id:string;workspace_key:string;enabled:boolean;territory_id:string|null;tenant_id:string|null;starts_at:string|null;expires_at:string|null;reason:string|null;granted_by:string|null;created_at:string;updated_at:string}
export interface WorkspaceAccessUser {id:string;email:string|null;display_name:string;source_role:string}
export interface WorkspaceAccessSnapshot {users:WorkspaceAccessUser[];access:WorkspaceAccessRow[]}
