import type { Angelcare360BaseRecord, Angelcare360Json, Angelcare360UUID } from './database'
import type { Angelcare360AuditRecord } from './audit'

export type Angelcare360AdmissionsRouteKey =
  | 'overview'
  | 'pipeline'
  | 'demandes'
  | 'dossiers'
  | 'documents'
  | 'entretiens'
  | 'conversions'
  | 'audit'

export type Angelcare360AdmissionsStage =
  | 'nouvelle_demande'
  | 'a_contacter'
  | 'contacte'
  | 'qualifie'
  | 'non_qualifie'
  | 'dossier_ouvert'
  | 'informations_incompletes'
  | 'documents_en_attente'
  | 'entretien_a_planifier'
  | 'entretien_planifie'
  | 'en_etude'
  | 'accepte'
  | 'refuse'
  | 'liste_attente'
  | 'converti_en_dossier'
  | 'converti'
  | 'abandonne'
  | 'archive'

export type Angelcare360AdmissionDocumentStatus = 'requis' | 'en_attente' | 'recu' | 'validé' | 'rejete' | 'expire'

export type Angelcare360AdmissionsColumnKind = 'text' | 'status' | 'date' | 'datetime' | 'number' | 'boolean' | 'chips'
export type Angelcare360AdmissionsFieldKind = 'text' | 'textarea' | 'email' | 'tel' | 'date' | 'datetime' | 'number' | 'select' | 'multi-select' | 'switch'

export interface Angelcare360AdmissionsFieldOption {
  label: string
  value: string
  hint?: string
}

export interface Angelcare360AdmissionsColumnDefinition {
  key: string
  label: string
  kind?: Angelcare360AdmissionsColumnKind
  width?: string
}

export interface Angelcare360AdmissionsFieldDefinition {
  name: string
  label: string
  kind: Angelcare360AdmissionsFieldKind
  required?: boolean
  placeholder?: string
  helpText?: string
  options?: Angelcare360AdmissionsFieldOption[]
  min?: number
  max?: number
  step?: number
  readOnly?: boolean
  disabledReason?: string
}

export interface Angelcare360AdmissionsFilterDefinition {
  name: string
  label: string
  options: Angelcare360AdmissionsFieldOption[]
  defaultValue?: string
}

export interface Angelcare360AdmissionsRowActionDefinition {
  key: string
  label: string
  kind?: 'primary' | 'secondary' | 'danger'
  permission?: string
  disabledReason?: string
  operation?: string
  value?: string
}

export interface Angelcare360AdmissionsEntityConfig {
  routeKey: Angelcare360AdmissionsRouteKey
  resource: string
  title: string
  subtitle: string
  headerBadge?: string
  listPermission: string
  createPermission?: string
  updatePermission?: string
  approvePermission?: string
  searchPlaceholder: string
  emptyTitle: string
  emptyDescription: string
  fields: Angelcare360AdmissionsFieldDefinition[]
  columns: Angelcare360AdmissionsColumnDefinition[]
  filters?: Angelcare360AdmissionsFilterDefinition[]
  rowActions?: Angelcare360AdmissionsRowActionDefinition[]
  createLabel?: string
  editLabel?: string
  disabledCreateReason?: string
  disabledEditReason?: string
  statusField?: string
  statusValues?: string[]
  fixedValues?: Record<string, string | number | boolean | null>
  searchableKeys?: string[]
  detailHrefKey?: string
}

export interface Angelcare360AdmissionsNavigationItem {
  key: Angelcare360AdmissionsRouteKey
  label: string
  href: string
  summary: string
  permission: string
  badge?: string
  disabledReason?: string
}

export interface Angelcare360AdmissionLeadRecord extends Angelcare360BaseRecord {
  lead_code: string
  parent_name: string
  parent_phone?: string | null
  parent_email?: string | null
  student_full_name: string
  child_first_name?: string | null
  child_last_name?: string | null
  child_date_of_birth?: string | null
  relationship_type?: string | null
  desired_level?: string | null
  source_channel?: string | null
  assigned_staff_id?: Angelcare360UUID | null
  contacted_at?: string | null
  converted_at?: string | null
  next_action?: string | null
  next_action_at?: string | null
  responsible_staff_id?: Angelcare360UUID | null
  priority?: string | null
  notes?: string | null
  status: string
  metadata_json?: Angelcare360Json & {
    message?: string | null
    source?: string | null
  }
}

export interface Angelcare360AdmissionLeadListRecord extends Angelcare360AdmissionLeadRecord {
  application_count?: number
  document_count?: number
  missing_document_count?: number
  assigned_staff_name?: string | null
  assigned_staff_code?: string | null
  detail_href?: string
}

export interface Angelcare360AdmissionApplicationRecord extends Angelcare360BaseRecord {
  application_code: string
  lead_id?: Angelcare360UUID | null
  parent_id?: Angelcare360UUID | null
  student_id?: Angelcare360UUID | null
  academic_year_id?: Angelcare360UUID | null
  class_id?: Angelcare360UUID | null
  section_id?: Angelcare360UUID | null
  child_first_name?: string | null
  child_last_name?: string | null
  child_date_of_birth?: string | null
  child_gender?: string | null
  child_nationality?: string | null
  parent_first_name?: string | null
  parent_last_name?: string | null
  relationship_type?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  application_stage: string
  application_date: string
  decision_date?: string | null
  decision_status?: string | null
  decision_reason?: string | null
  priority?: string | null
  next_action?: string | null
  next_action_at?: string | null
  responsible_staff_id?: Angelcare360UUID | null
  converted_at?: string | null
  converted_student_id?: Angelcare360UUID | null
  converted_parent_id?: Angelcare360UUID | null
  converted_enrollment_id?: Angelcare360UUID | null
  status: string
  metadata_json?: Angelcare360Json & {
    source?: string | null
    requested_class_code?: string | null
    requested_section_code?: string | null
  }
}

export interface Angelcare360AdmissionApplicationListRecord extends Angelcare360AdmissionApplicationRecord {
  lead_code?: string | null
  lead_parent_name?: string | null
  lead_student_full_name?: string | null
  class_name?: string | null
  class_code?: string | null
  section_name?: string | null
  section_code?: string | null
  document_count?: number
  missing_document_count?: number
  ready_for_conversion?: boolean
  detail_href?: string
}

export interface Angelcare360AdmissionRequiredDocumentRecord extends Angelcare360BaseRecord {
  academic_year_id?: Angelcare360UUID | null
  document_key: string
  title: string
  description?: string | null
  required_for_stage?: string | null
  sort_order: number
  is_required?: boolean
  metadata_json?: Angelcare360Json
}

export interface Angelcare360AdmissionRequiredDocumentListRecord extends Angelcare360AdmissionRequiredDocumentRecord {
  submission_count?: number
  complete_count?: number
  missing_count?: number
}

export interface Angelcare360AdmissionDocumentSubmissionRecord extends Angelcare360BaseRecord {
  application_id: Angelcare360UUID
  required_document_id: Angelcare360UUID
  document_id?: Angelcare360UUID | null
  submitted_by?: Angelcare360UUID | null
  submitted_at?: string | null
  verification_status: string
  reviewed_by?: Angelcare360UUID | null
  reviewed_at?: string | null
  notes?: string | null
  status: string
  metadata_json?: Angelcare360Json & {
    rejection_reason?: string | null
  }
}

export interface Angelcare360AdmissionDocumentSubmissionListRecord extends Angelcare360AdmissionDocumentSubmissionRecord {
  application_code?: string | null
  required_document_key?: string | null
  required_document_title?: string | null
  linked_document_title?: string | null
  detail_href?: string
}

export interface Angelcare360AdmissionsOverviewRecord {
  schoolCount: number
  activeSchoolName?: string | null
  activeAcademicYearLabel?: string | null
  leadCount: number
  newLeadCount: number
  openApplicationCount: number
  missingDocumentApplicationCount: number
  interviewReadyCount: number
  acceptedCount: number
  conversionReadyCount: number
  convertedCount: number
  archivedOrRefusedCount: number
  availableClassCount: number
  availableSectionCount: number
  missingDocumentRequirementCount: number
  duplicateRiskCount: number
  latestAuditEvents: Angelcare360AuditRecord[]
  risks: string[]
  setupReadiness: {
    schoolReady: boolean
    academicYearReady: boolean
    classReady: boolean
    documentReady: boolean
    duplicateScanReady: boolean
  }
}

export interface Angelcare360AdmissionsAuditFilter {
  search?: string | null
  module?: string | null
  action?: string | null
  severity?: string | null
  entityType?: string | null
  actorRole?: string | null
  from?: string | null
  to?: string | null
}

export interface Angelcare360AdmissionsPipelineCard {
  id: string
  title: string
  subtitle?: string | null
  status: string
  nextAction?: string | null
  nextActionAt?: string | null
  missingDocumentCount?: number
  readyForConversion?: boolean
  detailHref: string
}

export interface Angelcare360AdmissionConversionChecklistItem {
  key: string
  label: string
  ok: boolean
  explanation: string
}
