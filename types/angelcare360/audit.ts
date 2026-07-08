import type { Angelcare360UUID } from './database'

export type Angelcare360AuditSeverity = 'debug' | 'info' | 'notice' | 'warning' | 'critical'

export type Angelcare360AuditCategory =
  | 'auth'
  | 'rbac'
  | 'student'
  | 'parent'
  | 'staff'
  | 'attendance'
  | 'admissions'
  | 'academic'
  | 'finance'
  | 'payroll'
  | 'transport'
  | 'library'
  | 'inventory'
  | 'messaging'
  | 'reports'
  | 'documents'
  | 'timetable'
  | 'settings'
  | 'security'

export interface Angelcare360AuditRecord {
  id: Angelcare360UUID
  school_id: Angelcare360UUID
  actor_user_id?: Angelcare360UUID | null
  actor_role?: string | null
  module: string
  action: string
  entity_type?: string | null
  entity_id?: Angelcare360UUID | null
  severity: Angelcare360AuditSeverity
  ip_address?: string | null
  user_agent?: string | null
  request_id?: string | null
  before_data?: Record<string, unknown>
  after_data?: Record<string, unknown>
  metadata?: Record<string, unknown>
  created_at: string
}

export interface Angelcare360AuditEventInput {
  category?: Angelcare360AuditCategory
  module: string
  action: string
  schoolId?: Angelcare360UUID | null
  actorUserId?: Angelcare360UUID | null
  actorRole?: string | null
  entityType?: string | null
  entityId?: Angelcare360UUID | null
  severity?: Angelcare360AuditSeverity
  route?: string | null
  requestId?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  beforeData?: Record<string, unknown>
  afterData?: Record<string, unknown>
  metadata?: Record<string, unknown>
}
