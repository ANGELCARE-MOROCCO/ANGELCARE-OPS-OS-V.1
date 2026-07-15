import type { Angelcare360BaseRecord, Angelcare360UUID } from './database'

export type Angelcare360PermissionDomainKey =
  | 'direction'
  | 'admissions'
  | 'eleves'
  | 'parents'
  | 'enseignants'
  | 'personnel'
  | 'classes'
  | 'matieres'
  | 'annees_scolaires'
  | 'presences'
  | 'emploi_du_temps'
  | 'academics'
  | 'examens'
  | 'bulletins'
  | 'finance'
  | 'paiements'
  | 'paie'
  | 'transport'
  | 'bibliotheque'
  | 'inventaire'
  | 'messagerie'
  | 'notifications'
  | 'reclamations'
  | 'documents'
  | 'rapports'
  | 'exports'
  | 'parametres'
  | 'audit'
  | 'securite'

export type Angelcare360PermissionActionKey =
  | 'view'
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'export'
  | 'assign'
  | 'notify'
  | 'configure'
  | 'audit'

export interface Angelcare360PermissionRecord {
  permission_key: string
  domain_key: Angelcare360PermissionDomainKey | string
  action_key: Angelcare360PermissionActionKey | string
  label: string
  description?: string | null
  risk_level?: 'low' | 'medium' | 'high' | 'critical' | string
  status?: string
}

export interface Angelcare360RoleRecord extends Angelcare360BaseRecord {
  school_id: Angelcare360UUID
  role_key: string
  label: string
  description?: string | null
  scope: 'platform' | 'school' | 'module' | 'class' | 'family'
  is_system_locked?: boolean
}

export interface Angelcare360RolePermissionRecord {
  id: Angelcare360UUID
  role_id: Angelcare360UUID
  permission_key: string
  effect: 'allow' | 'deny'
  created_at: string
  metadata_json?: Record<string, unknown>
}

export interface Angelcare360UserRoleRecord extends Angelcare360BaseRecord {
  app_user_id: Angelcare360UUID
  role_id: Angelcare360UUID
  access_scope_id?: Angelcare360UUID | null
  starts_at: string
  ends_at?: string | null
}

export interface Angelcare360AccessScopeRecord extends Angelcare360BaseRecord {
  scope_key: string
  scope_type: 'module' | 'route' | 'action' | 'entity' | 'school'
  module_key?: string | null
  route_path?: string | null
  action_key?: string | null
  entity_type?: string | null
  entity_id?: string | null
  label: string
  description?: string | null
}
