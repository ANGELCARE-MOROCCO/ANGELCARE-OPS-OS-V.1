import type { ReactNode } from 'react'
import type { Angelcare360AccessProfile, Angelcare360SessionUser } from './module'
import type { Angelcare360AuditRecord } from './audit'

export type Angelcare360AdministrationRouteKey =
  | 'overview'
  | 'etablissements'
  | 'annees-scolaires'
  | 'periodes'
  | 'classes'
  | 'sections'
  | 'matieres'
  | 'affectations'
  | 'roles-permissions'
  | 'parametres'
  | 'audit'

export type Angelcare360AdminColumnKind = 'text' | 'status' | 'date' | 'datetime' | 'number' | 'boolean' | 'chips'

export type Angelcare360AdminFieldKind =
  | 'text'
  | 'textarea'
  | 'email'
  | 'tel'
  | 'date'
  | 'datetime'
  | 'number'
  | 'select'
  | 'multi-select'
  | 'switch'

export interface Angelcare360AdminFieldOption {
  label: string
  value: string
  hint?: string
}

export interface Angelcare360AdminColumnDefinition {
  key: string
  label: string
  kind?: Angelcare360AdminColumnKind
  width?: string
}

export interface Angelcare360AdminFieldDefinition {
  name: string
  label: string
  kind: Angelcare360AdminFieldKind
  required?: boolean
  placeholder?: string
  helpText?: string
  options?: Angelcare360AdminFieldOption[]
  min?: number
  max?: number
  step?: number
  readOnly?: boolean
  disabledReason?: string
}

export interface Angelcare360AdminFilterDefinition {
  name: string
  label: string
  options: Angelcare360AdminFieldOption[]
  defaultValue?: string
}

export interface Angelcare360AdminRowActionDefinition {
  key: string
  label: string
  kind?: 'primary' | 'secondary' | 'danger'
  permission?: string
  disabledReason?: string
  operation?: string
  value?: string
}

export interface Angelcare360AdminEntityConfig {
  routeKey: Angelcare360AdministrationRouteKey
  resource: string
  title: string
  subtitle: string
  headerBadge?: string
  listPermission: string
  createPermission?: string
  updatePermission?: string
  searchPlaceholder: string
  emptyTitle: string
  emptyDescription: string
  fields: Angelcare360AdminFieldDefinition[]
  columns: Angelcare360AdminColumnDefinition[]
  filters?: Angelcare360AdminFilterDefinition[]
  rowActions?: Angelcare360AdminRowActionDefinition[]
  createLabel?: string
  editLabel?: string
  disabledCreateReason?: string
  disabledEditReason?: string
  statusField?: string
  statusValues?: string[]
  fixedValues?: Record<string, string | number | boolean | null>
  searchableKeys?: string[]
}

export interface Angelcare360AdministrationNavItem {
  key: Angelcare360AdministrationRouteKey
  label: string
  href: string
  summary: string
  permission: string
  badge?: string
  disabledReason?: string
}

export interface Angelcare360AdministrationOverview {
  schoolCount: number
  academicYearCount: number
  termCount: number
  classCount: number
  sectionCount: number
  subjectCount: number
  activeRoleCount: number
  permissionCatalogReady: boolean
  setupScore: number
  currentSchool: {
    id: string
    school_code: string
    name: string
    city?: string | null
    status: string
  } | null
  currentAcademicYear: {
    id: string
    year_code: string
    label: string
    starts_on: string
    ends_on: string
    status: string
    is_current?: boolean
  } | null
  latestAuditEvents: Angelcare360AuditRecord[]
  risks: string[]
}

export interface Angelcare360AdministrationPageProps {
  user: Angelcare360SessionUser
  access: Angelcare360AccessProfile
  overview: Angelcare360AdministrationOverview
  children?: ReactNode
}
