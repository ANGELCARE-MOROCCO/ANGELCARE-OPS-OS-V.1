import type { Angelcare360BaseRecord, Angelcare360EntityStatus, Angelcare360Json, Angelcare360UUID } from './database'
import type { Angelcare360AuditRecord } from './audit'

export type Angelcare360PeopleStatus = Extract<Angelcare360EntityStatus, 'active' | 'inactive' | 'archived' | 'suspended'> | string
export type Angelcare360PeopleRecordStatus = 'active' | 'inactive' | 'archived'
export type Angelcare360DocumentLifecycleStatus = 'requis' | 'recu' | 'validé' | 'expire' | 'archived'
export type Angelcare360PeopleNormalizationKey =
  | 'student'
  | 'parent'
  | 'staff'
  | 'emergency-contact'
  | 'document'
  | 'link'
  | 'enrollment'
  | 'raw'

export interface Angelcare360StudentRecord extends Angelcare360BaseRecord {
  student_code: string
  portal_app_user_id?: Angelcare360UUID | null
  first_name: string
  last_name: string
  full_name: string
  gender?: string | null
  date_of_birth?: string | null
  national_id?: string | null
  current_class_id?: Angelcare360UUID | null
  current_section_id?: Angelcare360UUID | null
  admission_status: string
  admission_date?: string | null
  exit_date?: string | null
  transport_required?: boolean
  metadata_json?: Angelcare360Json & {
    nationality?: string | null
    address?: string | null
    administrative_notes?: string | null
  }
}

export interface Angelcare360StudentListRecord extends Angelcare360StudentRecord {
  current_class_name?: string | null
  current_class_code?: string | null
  current_section_name?: string | null
  current_section_code?: string | null
  parent_count?: number
  parent_names?: string[]
  emergency_contact_count?: number
  document_count?: number
  enrollment_count?: number
  detail_href?: string
}

export interface Angelcare360ParentRecord extends Angelcare360BaseRecord {
  parent_code: string
  portal_app_user_id?: Angelcare360UUID | null
  first_name: string
  last_name: string
  full_name: string
  email?: string | null
  phone?: string | null
  whatsapp?: string | null
  occupation?: string | null
  preferred_language?: string | null
  address?: string | null
  metadata_json?: Angelcare360Json & {
    secondary_phone?: string | null
    notes?: string | null
  }
}

export interface Angelcare360ParentListRecord extends Angelcare360ParentRecord {
  child_count?: number
  child_names?: string[]
  detail_href?: string
}

export interface Angelcare360StudentParentLinkRecord {
  id: Angelcare360UUID
  school_id: Angelcare360UUID
  student_id: Angelcare360UUID
  parent_id: Angelcare360UUID
  relationship_type: string
  is_primary: boolean
  is_guardian: boolean
  can_pickup: boolean
  can_receive_messages: boolean
  can_pay_fees: boolean
  status: string
  created_at: string
  updated_at: string
}

export interface Angelcare360StudentParentLinkListRecord extends Angelcare360StudentParentLinkRecord {
  student_full_name?: string | null
  student_code?: string | null
  parent_full_name?: string | null
  parent_code?: string | null
  detail_href?: string
}

export interface Angelcare360StaffRecord extends Angelcare360BaseRecord {
  staff_code: string
  portal_app_user_id?: Angelcare360UUID | null
  staff_type: string
  first_name: string
  last_name: string
  full_name: string
  email?: string | null
  phone?: string | null
  hire_date?: string | null
  end_date?: string | null
  department?: string | null
  metadata_json?: Angelcare360Json & {
    speciality?: string | null
    notes?: string | null
    contract_type?: string | null
  }
}

export interface Angelcare360StaffListRecord extends Angelcare360StaffRecord {
  contract_count?: number
  assignment_count?: number
  class_names?: string[]
  subject_names?: string[]
  detail_href?: string
}

export interface Angelcare360TeacherListRecord extends Angelcare360StaffListRecord {
  role_label?: string | null
}

export interface Angelcare360StaffContractRecord {
  id: Angelcare360UUID
  school_id: Angelcare360UUID
  staff_id: Angelcare360UUID
  contract_number: string
  contract_type: string
  starts_on: string
  ends_on?: string | null
  employment_type: string
  salary_amount: number
  currency: string
  workload_percent: number
  status: string
  metadata_json?: Angelcare360Json
  created_at: string
  updated_at: string
}

export interface Angelcare360StaffAssignmentRecord {
  id: Angelcare360UUID
  school_id: Angelcare360UUID
  academic_year_id?: Angelcare360UUID | null
  staff_id: Angelcare360UUID
  class_id?: Angelcare360UUID | null
  section_id?: Angelcare360UUID | null
  subject_id?: Angelcare360UUID | null
  assignment_type: string
  assigned_from?: string | null
  assigned_to?: string | null
  status: string
  metadata_json?: Angelcare360Json
  created_at: string
  updated_at: string
}

export interface Angelcare360EmergencyContactRecord {
  id: Angelcare360UUID
  school_id: Angelcare360UUID
  contactable_type: string
  contactable_id: Angelcare360UUID
  contact_name: string
  relationship_type?: string | null
  phone?: string | null
  email?: string | null
  priority: number
  status: string
  metadata_json?: Angelcare360Json & { notes?: string | null }
  created_at: string
  updated_at: string
}

export interface Angelcare360EmergencyContactListRecord extends Angelcare360EmergencyContactRecord {
  linked_person_name?: string | null
  linked_person_code?: string | null
  detail_href?: string
}

export interface Angelcare360DocumentRecord extends Angelcare360BaseRecord {
  document_code: string
  documentable_type: string
  documentable_id: Angelcare360UUID
  category: string
  title: string
  file_name: string
  file_path: string
  storage_provider: string
  mime_type?: string | null
  file_size_bytes?: number | null
  visibility: string
  uploaded_by?: Angelcare360UUID | null
  verified_by?: Angelcare360UUID | null
  verified_at?: string | null
  metadata_json?: Angelcare360Json & {
    document_state?: Angelcare360DocumentLifecycleStatus
    expiry_date?: string | null
    notes?: string | null
  }
}

export interface Angelcare360DocumentListRecord extends Angelcare360DocumentRecord {
  linked_person_name?: string | null
  linked_person_code?: string | null
  detail_href?: string
}

export interface Angelcare360ClassEnrollmentRecord {
  id: Angelcare360UUID
  school_id: Angelcare360UUID
  academic_year_id: Angelcare360UUID
  student_id: Angelcare360UUID
  class_id: Angelcare360UUID
  section_id?: Angelcare360UUID | null
  enrollment_number?: string | null
  enrollment_status: string
  enrolled_on: string
  left_on?: string | null
  status: string
  metadata_json?: Angelcare360Json
  created_at: string
  updated_at: string
  student_full_name?: string | null
  student_code?: string | null
  class_name?: string | null
  class_code?: string | null
  section_name?: string | null
  section_code?: string | null
  detail_href?: string
}

export interface Angelcare360PeopleOverviewRecord {
  schoolCount: number
  activeStudents: number
  activeParents: number
  activeTeachers: number
  activeStaff: number
  incompleteDossiers: number
  missingEmergencyContacts: number
  missingDocuments: number
  classAssignmentCoverage: number
  latestAuditEvents: Angelcare360AuditRecord[]
}

export interface Angelcare360PeopleAuditFilter {
  search?: string | null
  module?: string | null
  action?: string | null
  severity?: string | null
  entityType?: string | null
  actorRole?: string | null
  from?: string | null
  to?: string | null
}

export type Angelcare360PeopleFieldKind =
  | 'text'
  | 'textarea'
  | 'email'
  | 'tel'
  | 'date'
  | 'number'
  | 'select'
  | 'switch'
  | 'multi-select'

export interface Angelcare360PeopleFieldOption {
  label: string
  value: string
  hint?: string
}

export interface Angelcare360PeopleFieldDefinition {
  name: string
  label: string
  kind: Angelcare360PeopleFieldKind
  required?: boolean
  placeholder?: string
  helpText?: string
  options?: Angelcare360PeopleFieldOption[]
  min?: number
  max?: number
  step?: number
  readOnly?: boolean
  disabledReason?: string
}

export interface Angelcare360PeopleFilterDefinition {
  name: string
  label: string
  options: Angelcare360PeopleFieldOption[]
  defaultValue?: string
}

export interface Angelcare360PeopleRowActionDefinition {
  key: string
  label: string
  kind?: 'primary' | 'secondary' | 'danger'
  permission?: string
  disabledReason?: string
  operation?: string
  value?: string
}

export interface Angelcare360PeopleEntityConfig {
  resource: string
  title: string
  subtitle: string
  headerBadge?: string
  listPermission: string
  createPermission?: string
  updatePermission?: string
  searchPlaceholder?: string
  emptyTitle: string
  emptyDescription: string
  fields: Angelcare360PeopleFieldDefinition[]
  columns: Array<{ key: string; label: string; kind?: 'text' | 'status' | 'date' | 'datetime' | 'number' | 'boolean' | 'chips'; width?: string }>
  filters?: Angelcare360PeopleFilterDefinition[]
  rowActions?: Angelcare360PeopleRowActionDefinition[]
  createLabel?: string
  editLabel?: string
  disabledCreateReason?: string
  disabledEditReason?: string
  statusField?: string
  statusValues?: string[]
  fixedValues?: Record<string, string | number | boolean | null>
  searchableKeys?: string[]
  detailHrefKey?: string
  normalizeInitialValuesKey?: Angelcare360PeopleNormalizationKey
}
