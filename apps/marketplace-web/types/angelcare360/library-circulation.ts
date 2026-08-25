export type LibraryBookStatus = 'active' | 'inactive' | 'archived'
export type LibraryCopyStatus = 'available' | 'loaned' | 'damaged' | 'lost' | 'archived' | 'reserved'
export type LibraryLoanStatus = 'open' | 'active' | 'returned' | 'overdue' | 'lost' | 'cancelled' | 'archived'
export type LibraryBorrowerType = 'student' | 'staff'
export type LibraryAttentionTone = 'good' | 'neutral' | 'warn' | 'bad'

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
  circulationCount: number
  lastCirculatedAt: string | null
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
  lastActivityAt: string | null
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
  classId: string | null
  classLabel: string | null
  activeLoanCount: number
  overdueLoanCount: number
  totalLoanCount: number
  returnedLoanCount: number
  lostLoanCount: number
  currentTitles: string[]
  lastActivityAt: string | null
  eligibility: 'eligible' | 'attention' | 'inactive'
  eligibilityReason: string
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

export interface LibraryInterventionItem {
  id: string
  kind: 'overdue' | 'due_today' | 'copy_exception' | 'reserved_state' | 'location_gap' | 'member_attention' | 'title_unavailable'
  tone: LibraryAttentionTone
  title: string
  detail: string
  href: string
  rank: number
}

export interface LibraryCirculationEvent {
  id: string
  type: 'checkout' | 'return' | 'lost' | 'cancelled'
  at: string
  title: string
  detail: string
  href: string
  tone: LibraryAttentionTone
}

export interface LibraryCapabilities {
  atomicCheckout: true
  atomicReturn: true
  atomicLoss: true
  atomicCancel: true
  reservationWorkflow: false
  reservationTruth: 'status_only'
  renewalWorkflow: false
  financialFineAuthority: false
  reminderDeliveryAuthority: false
  shelfLocationAuthority: 'recorded_text_only'
  isbnMetadataProvider: false
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
  capabilities: LibraryCapabilities
  interventions: LibraryInterventionItem[]
  todayEvents: LibraryCirculationEvent[]
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
    titlesUnavailable: number
    activeBorrowers: number
    borrowersWithOverdue: number
  }
}

export interface LibraryMutationResult<T = unknown> {
  ok: boolean
  record?: T
  error?: string
  locked?: boolean
  reason?: string
}
