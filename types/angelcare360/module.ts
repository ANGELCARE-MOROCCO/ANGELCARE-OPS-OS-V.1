export type Angelcare360ModuleStage = 'actif' | 'prévu'

export type Angelcare360ModuleGroup =
  | 'Pilotage'
  | 'Scolarité'
  | 'Gestion'
  | 'Services'
  | 'Gouvernance'

export type Angelcare360AccessLevel =
  | 'super_admin'
  | 'direction'
  | 'administration'
  | 'reception'
  | 'enseignant'
  | 'parent'
  | 'eleve'
  | 'comptabilite'
  | 'rh'
  | 'transport'
  | 'bibliotheque'
  | 'qualite'
  | 'support'

export interface Angelcare360SessionUser {
  id: string
  email?: string | null
  name?: string | null
  full_name?: string | null
  role?: string | null
  role_key?: string | null
  permissions?: string[] | null
}

export interface Angelcare360AccessProfile {
  accessLevel: Angelcare360AccessLevel
  roleLabel: string
  scopeLabel: string
  summary: string
  canOpenModuleDrawer: boolean
  canSeeSensitiveFinance: boolean
  canSeeAuditData: boolean
  canSeeConfiguration: boolean
  canSeePeopleData: boolean
  canSeeOperationalData: boolean
}

export interface Angelcare360ModuleRecord {
  id: string
  label: string
  group: Angelcare360ModuleGroup
  href: string
  stage: Angelcare360ModuleStage
  badge: string
  description: string
  operationalPurpose: string
  accessNote: string
  previewActionLabel: string
  disabledActionLabel: string
  disabledActionReason: string
  keywords: string[]
}

export interface Angelcare360ModuleSection {
  group: Angelcare360ModuleGroup
  label: string
  summary: string
  items: Angelcare360ModuleRecord[]
}

export interface Angelcare360ModuleDrawerState {
  moduleId: string | null
  isOpen: boolean
}

