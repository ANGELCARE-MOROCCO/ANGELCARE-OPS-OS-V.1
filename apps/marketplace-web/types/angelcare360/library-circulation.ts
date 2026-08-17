export type LibraryBookStatus = 'active' | 'inactive' | 'archived'
export type LibraryCopyStatus = 'available' | 'loaned' | 'damaged' | 'lost' | 'archived' | 'reserved'
export type LibraryLoanStatus = 'open' | 'active' | 'returned' | 'overdue' | 'lost' | 'cancelled' | 'archived'
export type LibraryBorrowerType = 'student' | 'staff'

export interface LibraryBook {
  id: string
  schoolId: string
  bookCode: string
  isbn: string | null
  title: string
  author: string | null
  publisher: string | null
  category: string | null
  language: string
  status: LibraryBookStatus | string
  copyCount: number
  availableCount: number
  loanedCount: number
  damagedCount: number
  lostCount: number
  reservedCount: number
  activeLoanCount: number
  overdueCount: number
}

export interface LibraryCopy {
  id: string
  schoolId: string
  bookId: string
  copyCode: string
  barcode: string | null
  acquisitionDate: string | null
  shelfLocation: string | null
  condition: string
  status: LibraryCopyStatus | string
  bookTitle: string
  bookCode: string
  author: string | null
  activeLoanId: string | null
  borrowerName: string | null
  borrowerCode: string | null
  borrowerType: LibraryBorrowerType | null
  dueAt: string | null
  daysOverdue: number
}

export interface LibraryLoan {
  id: string
  schoolId: string
  copyId: string
  borrowerType: LibraryBorrowerType
  borrowerStudentId: string | null
  borrowerStaffId: string | null
  borrowerName: string
  borrowerCode: string
  loanedAt: string
  dueAt: string
  returnedAt: string | null
  fineAmount: number
  storedStatus: LibraryLoanStatus | string
  effectiveStatus: LibraryLoanStatus | string
  daysOverdue: number
  bookId: string
  bookTitle: string
  bookCode: string
  author: string | null
  copyCode: string
  barcode: string | null
  shelfLocation: string | null
  copyCondition: string
  copyStatus: string
}

export interface LibraryBorrower {
  id: string
  type: LibraryBorrowerType
  code: string
  fullName: string
  secondary: string | null
  status: string
}

export interface LibraryAuditEvent {
  id: string
  actorUserId: string | null
  actorRole: string | null
  action: string
  entityType: string | null
  entityId: string | null
  severity: string
  createdAt: string
  beforeData: Record<string, unknown>
  afterData: Record<string, unknown>
  metadata: Record<string, unknown>
}

export interface LibraryIntegrity {
  installed: boolean
  safeForCirculation: boolean
  duplicateActiveLoans: number
  activeLoanCopyStateMismatch: number
  loanedCopiesWithoutActiveLoan: number
  invalidBorrowers: number
  barcodeDuplicates: number
  message?: string
}

export interface LibraryCategoryPulse {
  label: string
  works: number
  copies: number
  available: number
  activeLoans: number
  overdue: number
  damaged: number
  lost: number
}

export interface LibrarySnapshot {
  schoolId: string
  schoolName: string
  schoolTimezone: string
  generatedAt: string
  books: LibraryBook[]
  copies: LibraryCopy[]
  loans: LibraryLoan[]
  borrowers: LibraryBorrower[]
  audit: LibraryAuditEvent[]
  categories: LibraryCategoryPulse[]
  integrity: LibraryIntegrity
  metrics: {
    works: number
    copies: number
    available: number
    circulating: number
    overdue: number
    damaged: number
    lost: number
    reserved: number
    dueToday: number
    returnedToday: number
    worksWithoutCopies: number
    copiesWithoutShelf: number
  }
}

export interface LibraryMutationResult<T = unknown> {
  ok: boolean
  record?: T
  error?: string
  locked?: boolean
  reason?: string
}
