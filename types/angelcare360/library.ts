import type { Angelcare360AuditRecord } from './audit'
import type { Angelcare360BaseRecord, Angelcare360UUID } from './database'

export type Angelcare360LibraryBookStatus = 'active' | 'archived'
export type Angelcare360LibraryCopyStatus = 'available' | 'loaned' | 'damaged' | 'lost' | 'archived' | 'reserved'
export type Angelcare360LibraryLoanStatus = 'open' | 'active' | 'returned' | 'overdue' | 'lost' | 'cancelled' | 'archived'
export type Angelcare360LibraryBorrowerType = 'student' | 'staff'

export interface Angelcare360LibraryBookRecord extends Angelcare360BaseRecord {
  school_id: Angelcare360UUID
  book_code: string
  isbn?: string | null
  title: string
  author?: string | null
  publisher?: string | null
  category?: string | null
  language: string
  status: Angelcare360LibraryBookStatus | string
}

export interface Angelcare360LibraryBookListRecord extends Angelcare360LibraryBookRecord {
  copy_count?: number
  available_copy_count?: number
  loan_count?: number
  overdue_loan_count?: number
  damaged_copy_count?: number
  lost_copy_count?: number
  detail_href?: string
}

export interface Angelcare360LibraryCopyRecord extends Angelcare360BaseRecord {
  school_id: Angelcare360UUID
  book_id: Angelcare360UUID
  copy_code: string
  barcode?: string | null
  acquisition_date?: string | null
  shelf_location?: string | null
  condition: string
  status: Angelcare360LibraryCopyStatus | string
}

export interface Angelcare360LibraryCopyListRecord extends Angelcare360LibraryCopyRecord {
  book_title?: string | null
  book_code?: string | null
  loan_status?: string | null
  borrower_full_name?: string | null
  borrower_code?: string | null
  due_at?: string | null
  detail_href?: string
}

export interface Angelcare360LibraryLoanRecord extends Angelcare360BaseRecord {
  school_id: Angelcare360UUID
  copy_id: Angelcare360UUID
  borrower_type: Angelcare360LibraryBorrowerType
  borrower_student_id?: Angelcare360UUID | null
  borrower_staff_id?: Angelcare360UUID | null
  loaned_at: string
  due_at: string
  returned_at?: string | null
  fine_amount: number
  status: Angelcare360LibraryLoanStatus | string
}

export interface Angelcare360LibraryLoanListRecord extends Angelcare360LibraryLoanRecord {
  book_title?: string | null
  book_code?: string | null
  copy_code?: string | null
  borrower_full_name?: string | null
  borrower_code?: string | null
  borrower_class_name?: string | null
  borrower_section_name?: string | null
  days_overdue?: number | null
  detail_href?: string
}

export interface Angelcare360LibraryAvailabilityRecord {
  school_id: Angelcare360UUID
  book_id: Angelcare360UUID
  book_code: string
  title: string
  copy_count: number
  available_copy_count: number
  loaned_copy_count: number
  damaged_copy_count: number
  lost_copy_count: number
  status: 'ready' | 'incomplete' | 'blocked'
}

export interface Angelcare360LibraryOverviewRecord {
  schoolId: Angelcare360UUID
  schoolName: string
  activeAcademicYearId?: Angelcare360UUID | null
  activeAcademicYearLabel?: string | null
  bookCount: number
  copyCount: number
  availableCopyCount: number
  loanCount: number
  overdueLoanCount: number
  damagedCopyCount: number
  lostCopyCount: number
  booksWithoutCopiesCount: number
  latestAuditEvents: Angelcare360AuditRecord[]
  risks: string[]
}

export interface Angelcare360LibraryAuditFilter {
  schoolId?: Angelcare360UUID | null
  module?: string | null
  action?: string | null
  severity?: string | null
  entityType?: string | null
  entityId?: Angelcare360UUID | null
  actorUserId?: Angelcare360UUID | null
  status?: string | null
  search?: string | null
  from?: string | null
  to?: string | null
}

export interface Angelcare360LibraryMutationResult<T = unknown> {
  ok: boolean
  record?: T | null
  records?: T[]
  error?: string
  warning?: string | null
  idempotent?: boolean
  locked?: boolean
  reason?: string | null
}
