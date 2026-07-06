import type { Angelcare360BaseRecord, Angelcare360UUID } from './database'

export interface Angelcare360StudentRecord extends Angelcare360BaseRecord {
  student_code: string
  portal_app_user_id?: Angelcare360UUID | null
  first_name: string
  last_name: string
  full_name: string
  date_of_birth?: string | null
  current_class_id?: Angelcare360UUID | null
  current_section_id?: Angelcare360UUID | null
  admission_status: string
}

export interface Angelcare360ParentRecord extends Angelcare360BaseRecord {
  parent_code: string
  portal_app_user_id?: Angelcare360UUID | null
  first_name: string
  last_name: string
  full_name: string
  email?: string | null
  phone?: string | null
}

export interface Angelcare360StudentParentLinkRecord {
  id: Angelcare360UUID
  school_id: Angelcare360UUID
  student_id: Angelcare360UUID
  parent_id: Angelcare360UUID
  relationship_type: string
  is_primary: boolean
  can_pickup: boolean
  can_receive_messages: boolean
  can_pay_fees: boolean
  status: string
  created_at: string
  updated_at: string
}

export interface Angelcare360StaffRecord extends Angelcare360BaseRecord {
  staff_code: string
  portal_app_user_id?: Angelcare360UUID | null
  first_name: string
  last_name: string
  full_name: string
  staff_type: string
  email?: string | null
  phone?: string | null
}

export interface Angelcare360DocumentRecord extends Angelcare360BaseRecord {
  document_code: string
  documentable_type: string
  documentable_id: Angelcare360UUID
  category: string
  title: string
  file_name: string
  file_path: string
  mime_type?: string | null
  file_size_bytes?: number | null
  visibility: string
}

