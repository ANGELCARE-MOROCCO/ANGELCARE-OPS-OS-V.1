import { createClient } from '@/lib/supabase/server'
import { requireAngelcare360Permission } from '@/lib/angelcare360/server/context'
import { recordAngelcare360AuditEventServer } from '@/lib/angelcare360/server/audit'
import type {
  LibraryAuditEvent,
  LibraryBook,
  LibraryBorrower,
  LibraryCategoryPulse,
  LibraryCirculationEvent,
  LibraryCopy,
  LibraryIntegrity,
  LibraryInterventionItem,
  LibraryLoan,
  LibraryMutationResult,
  LibrarySnapshot,
} from '@/types/angelcare360/library-circulation'

type Row = Record<string, any>
const ACTIVE_LOAN_STATES = new Set(['open', 'active', 'overdue'])
const LIBRARY_MODULE = 'bibliotheque'

function text(value: unknown, fallback = '') {
  if (value === null || value === undefined) return fallback
  return String(value)
}
function nullable(value: unknown) {
  const result = text(value).trim()
  return result ? result : null
}
function numberValue(value: unknown, fallback = 0) {
  const result = Number(value)
  return Number.isFinite(result) ? result : fallback
}
function dayKey(date: Date, timeZone: string) {
  if (!Number.isFinite(date.getTime())) return ''
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const get = (type: string) => parts.find((part) => part.type === type)?.value || ''
  return `${get('year')}-${get('month')}-${get('day')}`
}
function sameDayInZone(a: Date, b: Date, timeZone: string) {
  return dayKey(a, timeZone) === dayKey(b, timeZone)
}
function overdueDays(dueAt: string | null, returnedAt: string | null) {
  if (!dueAt || returnedAt) return 0
  const due = new Date(dueAt)
  if (!Number.isFinite(due.getTime())) return 0
  const delta = Date.now() - due.getTime()
  return delta > 0 ? Math.max(1, Math.ceil(delta / 86_400_000)) : 0
}
function activeLoan(row: Row) {
  return !row.returned_at && ACTIVE_LOAN_STATES.has(text(row.status))
}
function effectiveLoanStatus(row: Row) {
  if (row.returned_at || text(row.status) === 'returned') return 'returned'
  if (['lost', 'cancelled', 'archived'].includes(text(row.status))) return text(row.status)
  return overdueDays(nullable(row.due_at), nullable(row.returned_at)) > 0 ? 'overdue' : text(row.status || 'open')
}

async function context(permission: string, schoolId?: string | null) {
  const result = await requireAngelcare360Permission(permission, { schoolId })
  if (!result.school) throw new Error('Aucun établissement actif n’est disponible.')
  return result
}

async function audit(input: {
  action: string
  schoolId: string
  entityType: string
  entityId: string
  severity?: 'debug' | 'info' | 'notice' | 'warning' | 'critical'
  beforeData?: Record<string, unknown>
  afterData?: Record<string, unknown>
  metadata?: Record<string, unknown>
}) {
  return recordAngelcare360AuditEventServer({
    category: 'library',
    module: LIBRARY_MODULE,
    action: input.action,
    schoolId: input.schoolId,
    entityType: input.entityType,
    entityId: input.entityId,
    severity: input.severity || 'info',
    beforeData: input.beforeData,
    afterData: input.afterData,
    metadata: input.metadata,
  })
}

function bookMap(rows: Row[]) {
  return new Map<string, Row>(rows.map((row: Row) => [text(row.id), row] as [string, Row]))
}
function copyMap(rows: Row[]) {
  return new Map<string, Row>(rows.map((row: Row) => [text(row.id), row] as [string, Row]))
}
function borrowerMap(students: Row[], staff: Row[], classes: Row[]) {
  const classById = new Map<string, Row>(classes.map((row: Row) => [text(row.id), row] as [string, Row]))
  const result = new Map<string, LibraryBorrower>()
  for (const row of students) {
    const classRow = classById.get(text(row.current_class_id))
    result.set(text(row.id), {
      id: text(row.id),
      type: 'student',
      code: text(row.student_code),
      fullName: text(row.full_name),
      secondary: classRow ? text(classRow.name) : nullable(row.status),
      status: text(row.status),
      classId: nullable(row.current_class_id),
      classLabel: classRow ? text(classRow.name) : null,
      activeLoanCount: 0,
      overdueLoanCount: 0,
      totalLoanCount: 0,
      returnedLoanCount: 0,
      lostLoanCount: 0,
      currentTitles: [],
      lastActivityAt: null,
      eligibility: text(row.status) === 'active' ? 'eligible' : 'inactive',
      eligibilityReason: text(row.status) === 'active'
        ? 'Membre actif. Aucun plafond de prêt ou blocage automatique supplémentaire n’est prouvé par l’autorité Bibliothèque actuelle.'
        : 'Membre inactif : le RPC de circulation refusera le prêt.',
    })
  }
  for (const row of staff) {
    result.set(text(row.id), {
      id: text(row.id),
      type: 'staff',
      code: text(row.staff_code),
      fullName: text(row.full_name),
      secondary: nullable(row.department),
      status: text(row.status),
      classId: null,
      classLabel: null,
      activeLoanCount: 0,
      overdueLoanCount: 0,
      totalLoanCount: 0,
      returnedLoanCount: 0,
      lostLoanCount: 0,
      currentTitles: [],
      lastActivityAt: null,
      eligibility: text(row.status) === 'active' ? 'eligible' : 'inactive',
      eligibilityReason: text(row.status) === 'active'
        ? 'Membre actif. Aucun plafond de prêt ou blocage automatique supplémentaire n’est prouvé par l’autorité Bibliothèque actuelle.'
        : 'Membre inactif : le RPC de circulation refusera le prêt.',
    })
  }
  return result
}

function emptyIntegrity(message: string): LibraryIntegrity {
  return {
    installed: false,
    safeForCirculation: false,
    duplicateActiveLoans: 0,
    activeLoanCopyStateMismatch: 0,
    loanedCopiesWithoutActiveLoan: 0,
    invalidBorrowers: 0,
    barcodeDuplicates: 0,
    message,
  }
}

async function loadIntegrity(client: any, schoolId: string): Promise<LibraryIntegrity> {
  const { data, error } = await client.rpc('angelcare360_library_integrity_status_v1', { p_school_id: schoolId })
  if (error || !data) {
    return emptyIntegrity('Le garde-fou transactionnel Bibliothèque est indisponible dans ce runtime. Les mutations restent verrouillées jusqu’à rétablissement de l’autorité existante ; aucun SQL supplémentaire n’est supposé par cette interface.')
  }
  const row = (Array.isArray(data) ? data[0] : data) as Row
  return {
    installed: Boolean(row.installed ?? true),
    safeForCirculation: Boolean(row.safeForCirculation ?? row.safe_for_circulation),
    duplicateActiveLoans: numberValue(row.duplicateActiveLoans ?? row.duplicate_active_loans),
    activeLoanCopyStateMismatch: numberValue(row.activeLoanCopyStateMismatch ?? row.active_loan_copy_state_mismatch),
    loanedCopiesWithoutActiveLoan: numberValue(row.loanedCopiesWithoutActiveLoan ?? row.loaned_copies_without_active_loan),
    invalidBorrowers: numberValue(row.invalidBorrowers ?? row.invalid_borrowers),
    barcodeDuplicates: numberValue(row.barcodeDuplicates ?? row.barcode_duplicates),
    message: nullable(row.message) || undefined,
  }
}

async function rawSnapshot(client: any, schoolId: string) {
  const [booksResult, copiesResult, loansResult, studentsResult, staffResult, classesResult, auditResult] = await Promise.all([
    client.from('angelcare360_library_books')
      .select('id,school_id,book_code,isbn,title,author,publisher,category,language,status,created_at,updated_at')
      .eq('school_id', schoolId).order('title', { ascending: true }).range(0, 9999),
    client.from('angelcare360_library_copies')
      .select('id,school_id,book_id,copy_code,barcode,acquisition_date,shelf_location,condition,status,created_at,updated_at')
      .eq('school_id', schoolId).order('copy_code', { ascending: true }).range(0, 9999),
    client.from('angelcare360_library_loans')
      .select('id,school_id,copy_id,borrower_type,borrower_student_id,borrower_staff_id,loaned_at,due_at,returned_at,fine_amount,status,created_at,updated_at,metadata_json')
      .eq('school_id', schoolId).order('loaned_at', { ascending: false }).range(0, 9999),
    client.from('angelcare360_students')
      .select('id,school_id,student_code,full_name,status,current_class_id,current_section_id')
      .eq('school_id', schoolId).eq('status', 'active').order('full_name').range(0, 9999),
    client.from('angelcare360_staff')
      .select('id,school_id,staff_code,full_name,department,status')
      .eq('school_id', schoolId).eq('status', 'active').order('full_name').range(0, 9999),
    client.from('angelcare360_classes')
      .select('id,school_id,class_code,name,level,status')
      .eq('school_id', schoolId).eq('status', 'active').order('name').range(0, 9999),
    client.from('angelcare360_audit_logs')
      .select('id,actor_user_id,actor_role,action,entity_type,entity_id,severity,before_data,after_data,metadata,created_at,module')
      .eq('school_id', schoolId).in('module', ['bibliotheque', 'library']).order('created_at', { ascending: false }).limit(250),
  ])
  const firstError = [booksResult, copiesResult, loansResult, studentsResult, staffResult, classesResult].find((item: any) => item.error)?.error
  if (firstError) throw new Error(firstError.message || 'Impossible de charger la Bibliothèque.')
  return {
    books: (booksResult.data || []) as Row[],
    copies: (copiesResult.data || []) as Row[],
    loans: (loansResult.data || []) as Row[],
    students: (studentsResult.data || []) as Row[],
    staff: (staffResult.data || []) as Row[],
    classes: (classesResult.data || []) as Row[],
    audit: (auditResult.data || []) as Row[],
  }
}

export async function getLibraryCommandSnapshot(options?: { schoolId?: string | null }): Promise<LibrarySnapshot> {
  const access = await context('bibliotheque.view', options?.schoolId)
  const client = await createClient()
  const raw = await rawSnapshot(client, access.school!.id)
  const booksById = bookMap(raw.books)
  const copiesById = copyMap(raw.copies)
  const borrowersById = borrowerMap(raw.students, raw.staff, raw.classes)
  const activeLoanByCopy = new Map<string, Row>()

  for (const loan of raw.loans) {
    if (activeLoan(loan) && !activeLoanByCopy.has(text(loan.copy_id))) activeLoanByCopy.set(text(loan.copy_id), loan)
  }

  const loans: LibraryLoan[] = raw.loans.map((row) => {
    const copy = copiesById.get(text(row.copy_id)) || {}
    const book = booksById.get(text(copy.book_id)) || {}
    const borrowerId = text(row.borrower_student_id || row.borrower_staff_id)
    const borrower = borrowersById.get(borrowerId)
    return {
      id: text(row.id),
      schoolId: text(row.school_id),
      copyId: text(row.copy_id),
      borrowerType: text(row.borrower_type) === 'staff' ? 'staff' : 'student',
      borrowerStudentId: nullable(row.borrower_student_id),
      borrowerStaffId: nullable(row.borrower_staff_id),
      borrowerName: borrower?.fullName || 'Emprunteur non résolu',
      borrowerCode: borrower?.code || '—',
      loanedAt: text(row.loaned_at),
      dueAt: text(row.due_at),
      returnedAt: nullable(row.returned_at),
      fineAmount: numberValue(row.fine_amount),
      storedStatus: text(row.status),
      effectiveStatus: effectiveLoanStatus(row),
      daysOverdue: overdueDays(nullable(row.due_at), nullable(row.returned_at)),
      bookId: text(book.id),
      bookTitle: text(book.title, 'Ouvrage non résolu'),
      bookCode: text(book.book_code, '—'),
      author: nullable(book.author),
      copyCode: text(copy.copy_code, '—'),
      barcode: nullable(copy.barcode),
      shelfLocation: nullable(copy.shelf_location),
      copyCondition: text(copy.condition, '—'),
      copyStatus: text(copy.status, '—'),
    }
  })

  const copies: LibraryCopy[] = raw.copies.map((row) => {
    const book = booksById.get(text(row.book_id)) || {}
    const loan = activeLoanByCopy.get(text(row.id))
    const borrowerId = loan ? text(loan.borrower_student_id || loan.borrower_staff_id) : ''
    const borrower = borrowerId ? borrowersById.get(borrowerId) : undefined
    return {
      id: text(row.id),
      schoolId: text(row.school_id),
      bookId: text(row.book_id),
      copyCode: text(row.copy_code),
      barcode: nullable(row.barcode),
      acquisitionDate: nullable(row.acquisition_date),
      shelfLocation: nullable(row.shelf_location),
      condition: text(row.condition, 'good'),
      status: text(row.status),
      bookTitle: text(book.title, 'Ouvrage non résolu'),
      bookCode: text(book.book_code, '—'),
      author: nullable(book.author),
      activeLoanId: loan ? text(loan.id) : null,
      borrowerName: borrower?.fullName || null,
      borrowerCode: borrower?.code || null,
      borrowerType: loan ? (text(loan.borrower_type) === 'staff' ? 'staff' : 'student') : null,
      dueAt: loan ? text(loan.due_at) : null,
      daysOverdue: loan ? overdueDays(nullable(loan.due_at), nullable(loan.returned_at)) : 0,
      lastActivityAt: loan ? nullable(loan.returned_at || loan.updated_at || loan.loaned_at) : nullable(row.updated_at || row.created_at),
    }
  })

  const counts = new Map<string, {copies:number;available:number;loaned:number;damaged:number;lost:number;reserved:number;activeLoans:number;overdue:number}>()
  for (const row of raw.books) counts.set(text(row.id), { copies:0, available:0, loaned:0, damaged:0, lost:0, reserved:0, activeLoans:0, overdue:0 })
  for (const copy of copies) {
    const c = counts.get(copy.bookId) || { copies:0, available:0, loaned:0, damaged:0, lost:0, reserved:0, activeLoans:0, overdue:0 }
    c.copies += 1
    if (copy.status === 'available') c.available += 1
    if (copy.status === 'loaned') c.loaned += 1
    if (copy.status === 'damaged') c.damaged += 1
    if (copy.status === 'lost') c.lost += 1
    if (copy.status === 'reserved') c.reserved += 1
    if (copy.activeLoanId) c.activeLoans += 1
    if (copy.daysOverdue > 0) c.overdue += 1
    counts.set(copy.bookId, c)
  }
  const circulationByBook = new Map<string, { count: number; lastAt: string | null }>()
  for (const loan of loans) {
    const current = circulationByBook.get(loan.bookId) || { count: 0, lastAt: null }
    current.count += 1
    const activity = loan.returnedAt || loan.loanedAt
    if (activity && (!current.lastAt || activity > current.lastAt)) current.lastAt = activity
    circulationByBook.set(loan.bookId, current)
  }


  const books: LibraryBook[] = raw.books.map((row) => {
    const c = counts.get(text(row.id)) || { copies:0, available:0, loaned:0, damaged:0, lost:0, reserved:0, activeLoans:0, overdue:0 }
    return {
      id: text(row.id),
      schoolId: text(row.school_id),
      bookCode: text(row.book_code),
      isbn: nullable(row.isbn),
      title: text(row.title),
      author: nullable(row.author),
      publisher: nullable(row.publisher),
      category: nullable(row.category),
      language: text(row.language, 'fr'),
      status: text(row.status),
      copyCount: c.copies,
      availableCount: c.available,
      loanedCount: c.loaned,
      damagedCount: c.damaged,
      lostCount: c.lost,
      reservedCount: c.reserved,
      activeLoanCount: c.activeLoans,
      overdueCount: c.overdue,
      circulationCount: circulationByBook.get(text(row.id))?.count || 0,
      lastCirculatedAt: circulationByBook.get(text(row.id))?.lastAt || null,
    }
  })

  for (const borrower of borrowersById.values()) {
    const related = loans.filter((loan) => (loan.borrowerStudentId || loan.borrowerStaffId) === borrower.id)
    const active = related.filter((loan) => !loan.returnedAt && ACTIVE_LOAN_STATES.has(loan.storedStatus))
    const overdue = active.filter((loan) => loan.effectiveStatus === 'overdue')
    borrower.totalLoanCount = related.length
    borrower.activeLoanCount = active.length
    borrower.overdueLoanCount = overdue.length
    borrower.returnedLoanCount = related.filter((loan) => loan.effectiveStatus === 'returned').length
    borrower.lostLoanCount = related.filter((loan) => loan.effectiveStatus === 'lost').length
    borrower.currentTitles = active.map((loan) => loan.bookTitle)
    borrower.lastActivityAt = related.reduce<string | null>((latest, loan) => {
      const candidate = loan.returnedAt || loan.loanedAt
      return candidate && (!latest || candidate > latest) ? candidate : latest
    }, null)
    if (borrower.status !== 'active') {
      borrower.eligibility = 'inactive'
      borrower.eligibilityReason = 'Membre inactif : le RPC de circulation refusera le prêt.'
    } else if (borrower.overdueLoanCount > 0) {
      borrower.eligibility = 'attention'
      borrower.eligibilityReason = `${borrower.overdueLoanCount} prêt(s) en retard. Information opérationnelle uniquement : aucune règle de blocage automatique supplémentaire n’est prouvée par le schéma.`
    } else {
      borrower.eligibility = 'eligible'
      borrower.eligibilityReason = 'Membre actif. Aucun plafond de prêt ou blocage automatique supplémentaire n’est prouvé par l’autorité Bibliothèque actuelle.'
    }
  }

  const categoryMap = new Map<string, LibraryCategoryPulse>()
  for (const book of books) {
    const label = book.category || 'Non classé'
    const current = categoryMap.get(label) || { label, works: 0, copies: 0, available: 0, activeLoans: 0, overdue: 0, damaged: 0, lost: 0 }
    current.works += 1
    current.copies += book.copyCount
    current.available += book.availableCount
    current.activeLoans += book.activeLoanCount
    current.overdue += book.overdueCount
    current.damaged += book.damagedCount
    current.lost += book.lostCount
    categoryMap.set(label, current)
  }
  const categories = Array.from(categoryMap.values()).sort((a, b) => b.works - a.works || a.label.localeCompare(b.label, 'fr'))

  const today = new Date()
  const schoolTimezone = access.school!.timezone || 'Africa/Casablanca'
  const audit: LibraryAuditEvent[] = raw.audit.map((row) => ({
    id: text(row.id),
    actorUserId: nullable(row.actor_user_id),
    actorRole: nullable(row.actor_role),
    action: text(row.action),
    entityType: nullable(row.entity_type),
    entityId: nullable(row.entity_id),
    severity: text(row.severity, 'info'),
    createdAt: text(row.created_at),
    beforeData: (row.before_data || {}) as Record<string, unknown>,
    afterData: (row.after_data || {}) as Record<string, unknown>,
    metadata: (row.metadata || {}) as Record<string, unknown>,
  }))

  const integrity = await loadIntegrity(client, access.school!.id)
  const borrowers = Array.from(borrowersById.values()).sort((a, b) => a.fullName.localeCompare(b.fullName, 'fr'))
  const metrics = {
    works: books.filter((book) => book.status === 'active').length,
    copies: copies.filter((copy) => copy.status !== 'archived').length,
    available: copies.filter((copy) => copy.status === 'available').length,
    circulating: copies.filter((copy) => copy.status === 'loaned').length,
    overdue: loans.filter((loan) => loan.effectiveStatus === 'overdue').length,
    damaged: copies.filter((copy) => copy.status === 'damaged').length,
    lost: copies.filter((copy) => copy.status === 'lost').length,
    reserved: copies.filter((copy) => copy.status === 'reserved').length,
    dueToday: loans.filter((loan) => !loan.returnedAt && ACTIVE_LOAN_STATES.has(loan.storedStatus) && sameDayInZone(new Date(loan.dueAt), today, schoolTimezone)).length,
    returnedToday: loans.filter((loan) => loan.returnedAt && sameDayInZone(new Date(loan.returnedAt), today, schoolTimezone)).length,
    worksWithoutCopies: books.filter((book) => book.copyCount === 0).length,
    copiesWithoutShelf: copies.filter((copy) => copy.status !== 'archived' && !copy.shelfLocation).length,
    titlesUnavailable: books.filter((book) => book.status === 'active' && book.copyCount > 0 && book.availableCount === 0).length,
    activeBorrowers: borrowers.filter((borrower) => borrower.activeLoanCount > 0).length,
    borrowersWithOverdue: borrowers.filter((borrower) => borrower.overdueLoanCount > 0).length,
  }

  const interventions: LibraryInterventionItem[] = []
  for (const loan of loans) {
    if (loan.effectiveStatus === 'overdue') interventions.push({
      id: `overdue:${loan.id}`, kind: 'overdue', tone: 'bad', rank: 120 + Math.min(loan.daysOverdue, 60),
      title: `${loan.copyCode} · ${loan.bookTitle}`, detail: `${loan.borrowerName} · ${loan.daysOverdue} jour(s) de retard`, href: `/angelcare-360-command-center/bibliotheque/prets/${loan.id}`,
    })
    else if (!loan.returnedAt && ACTIVE_LOAN_STATES.has(loan.storedStatus) && sameDayInZone(new Date(loan.dueAt), today, schoolTimezone)) interventions.push({
      id: `due:${loan.id}`, kind: 'due_today', tone: 'warn', rank: 90, title: `${loan.copyCode} · retour attendu aujourd’hui`, detail: `${loan.borrowerName} · ${loan.bookTitle}`, href: `/angelcare-360-command-center/bibliotheque/prets/${loan.id}`,
    })
  }
  for (const copy of copies) {
    if (copy.status === 'lost' || copy.status === 'damaged') interventions.push({
      id: `copy:${copy.id}`, kind: 'copy_exception', tone: 'bad', rank: copy.status === 'lost' ? 115 : 105, title: `${copy.copyCode} · ${copy.status === 'lost' ? 'perdu' : 'endommagé'}`, detail: `${copy.bookTitle}${copy.shelfLocation ? ` · ${copy.shelfLocation}` : ''}`, href: `/angelcare-360-command-center/bibliotheque/exemplaires/${copy.id}`,
    })
    if (copy.status === 'reserved') interventions.push({
      id: `reserved:${copy.id}`, kind: 'reserved_state', tone: 'warn', rank: 65, title: `${copy.copyCode} · état réservé observé`, detail: 'État factuel existant. Aucun workflow de réservation n’est inventé par SANILA sans autorité dédiée.', href: `/angelcare-360-command-center/bibliotheque/exemplaires/${copy.id}`,
    })
    if (copy.status !== 'archived' && !copy.shelfLocation) interventions.push({
      id: `shelf:${copy.id}`, kind: 'location_gap', tone: 'neutral', rank: 38, title: `${copy.copyCode} · rayon non renseigné`, detail: `${copy.bookTitle} · localisation textuelle à compléter`, href: `/angelcare-360-command-center/bibliotheque/exemplaires/${copy.id}`,
    })
  }
  for (const borrower of borrowers.filter((item) => item.overdueLoanCount > 1)) interventions.push({
    id: `member:${borrower.id}`, kind: 'member_attention', tone: 'bad', rank: 100 + borrower.overdueLoanCount, title: `${borrower.fullName} · ${borrower.overdueLoanCount} retards`, detail: `${borrower.activeLoanCount} prêt(s) actif(s) · information de circulation`, href: `/angelcare-360-command-center/bibliotheque/membres/${borrower.id}`,
  })
  for (const book of books.filter((item) => item.status === 'active' && item.copyCount > 0 && item.availableCount === 0)) interventions.push({
    id: `unavailable:${book.id}`, kind: 'title_unavailable', tone: 'warn', rank: 58 + book.overdueCount, title: `${book.title} · aucun exemplaire disponible`, detail: `${book.copyCount} exemplaire(s) · ${book.activeLoanCount} prêt(s) actif(s)`, href: `/angelcare-360-command-center/bibliotheque/livres/${book.id}`,
  })
  interventions.sort((a, b) => b.rank - a.rank || a.title.localeCompare(b.title, 'fr'))

  const todayEvents: LibraryCirculationEvent[] = []
  for (const loan of loans) {
    if (sameDayInZone(new Date(loan.loanedAt), today, schoolTimezone)) todayEvents.push({
      id: `checkout:${loan.id}`, type: 'checkout', at: loan.loanedAt, title: `Prêt · ${loan.copyCode}`, detail: `${loan.bookTitle} → ${loan.borrowerName}`, href: `/angelcare-360-command-center/bibliotheque/prets/${loan.id}`, tone: 'neutral',
    })
    if (loan.returnedAt && sameDayInZone(new Date(loan.returnedAt), today, schoolTimezone)) todayEvents.push({
      id: `return:${loan.id}`, type: 'return', at: loan.returnedAt, title: `Retour · ${loan.copyCode}`, detail: `${loan.bookTitle} · ${loan.borrowerName}`, href: `/angelcare-360-command-center/bibliotheque/prets/${loan.id}`, tone: 'good',
    })
    if (loan.effectiveStatus === 'lost' && sameDayInZone(new Date(loan.returnedAt || loan.loanedAt), today, schoolTimezone)) todayEvents.push({
      id: `lost:${loan.id}`, type: 'lost', at: loan.returnedAt || loan.loanedAt, title: `Perte · ${loan.copyCode}`, detail: `${loan.bookTitle} · historique conservé`, href: `/angelcare-360-command-center/bibliotheque/prets/${loan.id}`, tone: 'bad',
    })
    if (loan.effectiveStatus === 'cancelled' && sameDayInZone(new Date(loan.loanedAt), today, schoolTimezone)) todayEvents.push({
      id: `cancelled:${loan.id}`, type: 'cancelled', at: loan.loanedAt, title: `Annulation · ${loan.copyCode}`, detail: `${loan.bookTitle} · prêt annulé`, href: `/angelcare-360-command-center/bibliotheque/prets/${loan.id}`, tone: 'neutral',
    })
  }
  todayEvents.sort((a, b) => b.at.localeCompare(a.at))

  return {
    schoolId: access.school!.id,
    schoolName: access.school!.name || access.school!.school_code || 'Établissement',
    schoolTimezone,
    generatedAt: new Date().toISOString(),
    books, copies, loans, borrowers, audit, categories, integrity, metrics,
    interventions: interventions.slice(0, 16),
    todayEvents: todayEvents.slice(0, 20),
    capabilities: {
      atomicCheckout: true, atomicReturn: true, atomicLoss: true, atomicCancel: true,
      reservationWorkflow: false, reservationTruth: 'status_only', renewalWorkflow: false,
      financialFineAuthority: false, reminderDeliveryAuthority: false, shelfLocationAuthority: 'recorded_text_only', isbnMetadataProvider: false,
    },
  }

}

export async function getLibraryBookDossier(id: string, schoolId?: string | null) {
  const snapshot = await getLibraryCommandSnapshot({ schoolId })
  const book = snapshot.books.find((item) => item.id === id)
  if (!book) return null
  const copies = snapshot.copies.filter((item) => item.bookId === id)
  const copyIds = new Set(copies.map((item) => item.id))
  const loans = snapshot.loans.filter((item) => copyIds.has(item.copyId))
  return { snapshot, book, copies, loans }
}

export async function getLibraryCopyDossier(id: string, schoolId?: string | null) {
  const snapshot = await getLibraryCommandSnapshot({ schoolId })
  const copy = snapshot.copies.find((item) => item.id === id)
  if (!copy) return null
  const book = snapshot.books.find((item) => item.id === copy.bookId) || null
  const loans = snapshot.loans.filter((item) => item.copyId === id)
  return { snapshot, copy, book, loans }
}

export async function getLibraryLoanDossier(id: string, schoolId?: string | null) {
  const snapshot = await getLibraryCommandSnapshot({ schoolId })
  const loan = snapshot.loans.find((item) => item.id === id)
  if (!loan) return null
  const copy = snapshot.copies.find((item) => item.id === loan.copyId) || null
  const book = snapshot.books.find((item) => item.id === loan.bookId) || null
  const borrower = snapshot.borrowers.find((item) =>
    item.id === (loan.borrowerStudentId || loan.borrowerStaffId),
  ) || null
  return { snapshot, loan, copy, book, borrower }
}

export async function getLibraryMemberDossier(id: string, schoolId?: string | null) {
  const snapshot = await getLibraryCommandSnapshot({ schoolId })
  const borrower = snapshot.borrowers.find((item) => item.id === id)
  if (!borrower) return null
  const loans = snapshot.loans.filter((loan) => (loan.borrowerStudentId || loan.borrowerStaffId) === id)
  return { snapshot, borrower, loans }
}

export async function findLibraryCopyByBarcode(query: string, schoolId?: string | null) {
  const access = await context('bibliotheque.view', schoolId)
  const client = await createClient()
  const needle = query.trim()
  if (!needle) return null
  const columns = 'id,school_id,book_id,copy_code,barcode,acquisition_date,shelf_location,condition,status'
  const barcodeResult = await client.from('angelcare360_library_copies')
    .select(columns).eq('school_id', access.school!.id).eq('barcode', needle).limit(1).maybeSingle()
  if (barcodeResult.error) throw new Error(barcodeResult.error.message)
  let data = barcodeResult.data
  if (!data) {
    const codeResult = await client.from('angelcare360_library_copies')
      .select(columns).eq('school_id', access.school!.id).eq('copy_code', needle).limit(1).maybeSingle()
    if (codeResult.error) throw new Error(codeResult.error.message)
    data = codeResult.data
  }
  if (!data) return null
  const dossier = await getLibraryCopyDossier(text(data.id), access.school!.id)
  return dossier?.copy || null
}

export async function createLibraryBook(input: Row): Promise<LibraryMutationResult> {
  const access = await context('bibliotheque.create', nullable(input.schoolId))
  const client = await createClient()
  const bookCode = text(input.bookCode).trim()
  const title = text(input.title).trim()
  if (!bookCode || !title) return { ok: false, error: 'Code ouvrage et titre sont obligatoires.' }
  const payload = {
    school_id: access.school!.id,
    book_code: bookCode,
    isbn: nullable(input.isbn),
    title,
    author: nullable(input.author),
    publisher: nullable(input.publisher),
    category: nullable(input.category),
    language: text(input.language || 'fr').trim() || 'fr',
    status: 'active',
    created_by: access.user.id,
    updated_by: access.user.id,
  }
  const { data, error } = await client.from('angelcare360_library_books').insert(payload).select('*').single()
  if (error || !data) return { ok: false, error: error?.message || 'Impossible de créer l’ouvrage.' }
  await audit({ action: 'library_book.created', schoolId: access.school!.id, entityType: 'library_book', entityId: text(data.id), afterData: data })
  return { ok: true, record: data }
}

export async function updateLibraryBook(input: Row): Promise<LibraryMutationResult> {
  const access = await context('bibliotheque.update', nullable(input.schoolId))
  const client = await createClient()
  const id = text(input.id)
  const { data: before } = await client.from('angelcare360_library_books').select('*').eq('school_id', access.school!.id).eq('id', id).maybeSingle()
  if (!before) return { ok: false, error: 'Ouvrage introuvable.' }
  const status = ['active', 'inactive', 'archived'].includes(text(input.status)) ? text(input.status) : text(before.status)
  if (status === 'archived' && text(before.status) !== 'archived') {
    const { data: bookCopies, error: copyError } = await client.from('angelcare360_library_copies').select('id').eq('school_id', access.school!.id).eq('book_id', id)
    if (copyError) return { ok: false, error: copyError.message }
    const copyIds = ((bookCopies || []) as Row[]).map((row: Row) => text(row.id)).filter(Boolean)
    if (copyIds.length > 0) {
      const { count: activeCopyLoans, error: loanError } = await client.from('angelcare360_library_loans').select('id', { count: 'exact', head: true })
        .eq('school_id', access.school!.id).is('returned_at', null).in('status', ['open', 'active', 'overdue']).in('copy_id', copyIds)
      if (loanError) return { ok: false, error: loanError.message }
      if ((activeCopyLoans || 0) > 0) return { ok: false, error: 'Cet ouvrage possède encore un prêt actif. Clôturez la circulation avant archivage.' }
    }
  }
  const payload = {
    book_code: text(input.bookCode || before.book_code).trim(),
    isbn: input.isbn === undefined ? before.isbn : nullable(input.isbn),
    title: text(input.title || before.title).trim(),
    author: input.author === undefined ? before.author : nullable(input.author),
    publisher: input.publisher === undefined ? before.publisher : nullable(input.publisher),
    category: input.category === undefined ? before.category : nullable(input.category),
    language: text(input.language || before.language || 'fr').trim(),
    status,
    updated_by: access.user.id,
  }
  if (!payload.book_code || !payload.title) return { ok: false, error: 'Code ouvrage et titre sont obligatoires.' }
  const { data, error } = await client.from('angelcare360_library_books').update(payload).eq('school_id', access.school!.id).eq('id', id).select('*').single()
  if (error || !data) return { ok: false, error: error?.message || 'Impossible de modifier l’ouvrage.' }
  await audit({ action: 'library_book.updated', schoolId: access.school!.id, entityType: 'library_book', entityId: id, beforeData: before, afterData: data })
  return { ok: true, record: data }
}

export async function createLibraryCopy(input: Row): Promise<LibraryMutationResult> {
  const access = await context('bibliotheque.create', nullable(input.schoolId))
  const client = await createClient()
  const bookId = text(input.bookId)
  const copyCode = text(input.copyCode).trim()
  if (!bookId || !copyCode) return { ok: false, error: 'Ouvrage et code exemplaire sont obligatoires.' }
  const { data: book } = await client.from('angelcare360_library_books').select('id').eq('school_id', access.school!.id).eq('id', bookId).maybeSingle()
  if (!book) return { ok: false, error: 'Ouvrage introuvable dans cet établissement.' }
  const status = ['available', 'damaged', 'lost', 'archived'].includes(text(input.status)) ? text(input.status) : 'available'
  const payload = {
    school_id: access.school!.id,
    book_id: bookId,
    copy_code: copyCode,
    barcode: nullable(input.barcode),
    acquisition_date: nullable(input.acquisitionDate),
    shelf_location: nullable(input.shelfLocation),
    condition: text(input.condition || 'good').trim() || 'good',
    status,
    created_by: access.user.id,
    updated_by: access.user.id,
  }
  const { data, error } = await client.from('angelcare360_library_copies').insert(payload).select('*').single()
  if (error || !data) return { ok: false, error: error?.message || 'Impossible d’enregistrer l’exemplaire.' }
  await audit({ action: 'library_copy.created', schoolId: access.school!.id, entityType: 'library_copy', entityId: text(data.id), afterData: data })
  return { ok: true, record: data }
}

export async function updateLibraryCopy(input: Row): Promise<LibraryMutationResult> {
  const access = await context('bibliotheque.update', nullable(input.schoolId))
  const client = await createClient()
  const id = text(input.id)
  const { data: before } = await client.from('angelcare360_library_copies').select('*').eq('school_id', access.school!.id).eq('id', id).maybeSingle()
  if (!before) return { ok: false, error: 'Exemplaire introuvable.' }
  const { count } = await client.from('angelcare360_library_loans').select('id', { count: 'exact', head: true })
    .eq('school_id', access.school!.id).eq('copy_id', id).is('returned_at', null).in('status', ['open', 'active', 'overdue'])
  const hasActiveLoan = (count || 0) > 0
  let requestedStatus = text(input.status || before.status)
  if (hasActiveLoan) requestedStatus = 'loaned'
  if (!hasActiveLoan && requestedStatus === 'loaned') return { ok: false, error: 'L’état « prêté » ne peut être produit que par la circulation.' }
  if (text(before.status) === 'reserved' && requestedStatus !== 'reserved') return { ok: false, error: 'Cet exemplaire est réservé par une autorité existante. Aucun workflow de réservation n’est inventé ici.' }
  if (text(before.status) !== 'reserved' && requestedStatus === 'reserved') return { ok: false, error: 'La création d’une réservation exige une autorité dédiée non prouvée dans le schéma actuel.' }
  if (!['available', 'loaned', 'damaged', 'lost', 'archived', 'reserved'].includes(requestedStatus)) requestedStatus = text(before.status)
  const payload = {
    copy_code: text(input.copyCode || before.copy_code).trim(),
    barcode: input.barcode === undefined ? before.barcode : nullable(input.barcode),
    acquisition_date: input.acquisitionDate === undefined ? before.acquisition_date : nullable(input.acquisitionDate),
    shelf_location: input.shelfLocation === undefined ? before.shelf_location : nullable(input.shelfLocation),
    condition: text(input.condition || before.condition || 'good').trim(),
    status: requestedStatus,
    updated_by: access.user.id,
  }
  if (!payload.copy_code) return { ok: false, error: 'Le code exemplaire est obligatoire.' }
  const { data, error } = await client.from('angelcare360_library_copies').update(payload).eq('school_id', access.school!.id).eq('id', id).select('*').single()
  if (error || !data) return { ok: false, error: error?.message || 'Impossible de modifier l’exemplaire.' }
  await audit({ action: 'library_copy.updated', schoolId: access.school!.id, entityType: 'library_copy', entityId: id, beforeData: before, afterData: data })
  return { ok: true, record: data }
}

async function requireCirculationReady(client: any, schoolId: string) {
  const integrity = await loadIntegrity(client, schoolId)
  if (!integrity.installed || !integrity.safeForCirculation) {
    return { ok: false as const, integrity, error: integrity.message || 'La circulation est verrouillée tant que l’intégrité Bibliothèque n’est pas validée.' }
  }
  return { ok: true as const, integrity }
}

export async function createLibraryLoanAtomic(input: Row): Promise<LibraryMutationResult> {
  const access = await context('bibliotheque.create', nullable(input.schoolId))
  const client = await createClient()
  const ready = await requireCirculationReady(client, access.school!.id)
  if (!ready.ok) return { ok: false, locked: true, reason: ready.error, error: ready.error }
  const borrowerType = text(input.borrowerType) === 'staff' ? 'staff' : 'student'
  const borrowerId = text(input.borrowerId)
  const due = new Date(text(input.dueAt))
  if (!text(input.copyId) || !borrowerId || !Number.isFinite(due.getTime())) return { ok: false, error: 'Exemplaire, emprunteur et échéance valide sont obligatoires.' }
  const { data, error } = await client.rpc('angelcare360_library_create_loan_v1', {
    p_school_id: access.school!.id,
    p_copy_id: text(input.copyId),
    p_borrower_type: borrowerType,
    p_borrower_id: borrowerId,
    p_due_at: due.toISOString(),
    p_actor_user_id: access.user.id,
    p_notes: nullable(input.notes),
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true, record: data }
}

export async function returnLibraryLoanAtomic(input: Row): Promise<LibraryMutationResult> {
  const access = await context('bibliotheque.update', nullable(input.schoolId))
  const client = await createClient()
  const ready = await requireCirculationReady(client, access.school!.id)
  if (!ready.ok) return { ok: false, locked: true, reason: ready.error, error: ready.error }
  const conditionOutcome = text(input.conditionOutcome) === 'damaged' ? 'damaged' : 'available'
  const { data, error } = await client.rpc('angelcare360_library_return_loan_v1', {
    p_school_id: access.school!.id,
    p_loan_id: text(input.loanId),
    p_returned_at: new Date().toISOString(),
    p_copy_outcome: conditionOutcome,
    p_condition: nullable(input.condition),
    p_actor_user_id: access.user.id,
    p_notes: nullable(input.notes),
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true, record: data }
}

export async function markLibraryLoanLostAtomic(input: Row): Promise<LibraryMutationResult> {
  const access = await context('bibliotheque.update', nullable(input.schoolId))
  const client = await createClient()
  const ready = await requireCirculationReady(client, access.school!.id)
  if (!ready.ok) return { ok: false, locked: true, reason: ready.error, error: ready.error }
  const reason = text(input.reason).trim()
  if (!reason) return { ok: false, error: 'Le motif de perte est obligatoire.' }
  const { data, error } = await client.rpc('angelcare360_library_mark_lost_v1', {
    p_school_id: access.school!.id,
    p_loan_id: text(input.loanId),
    p_actor_user_id: access.user.id,
    p_reason: reason,
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true, record: data }
}

export async function cancelLibraryLoanAtomic(input: Row): Promise<LibraryMutationResult> {
  const access = await context('bibliotheque.update', nullable(input.schoolId))
  const client = await createClient()
  const ready = await requireCirculationReady(client, access.school!.id)
  if (!ready.ok) return { ok: false, locked: true, reason: ready.error, error: ready.error }
  const reason = text(input.reason).trim()
  if (!reason) return { ok: false, error: 'Le motif d’annulation est obligatoire.' }
  const { data, error } = await client.rpc('angelcare360_library_cancel_loan_v1', {
    p_school_id: access.school!.id,
    p_loan_id: text(input.loanId),
    p_actor_user_id: access.user.id,
    p_reason: reason,
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true, record: data }
}
