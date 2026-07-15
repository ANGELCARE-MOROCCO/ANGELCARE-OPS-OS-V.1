import { createClient } from '@/lib/supabase/server'
import { getAngelcare360AccessContext, requireAngelcare360Permission } from './context'
import { recordAngelcare360AuditEventServer } from './audit'
import {
  angelcare360LibraryAuditQueryFiltersSchema,
  angelcare360LibraryBookCreateSchema,
  angelcare360LibraryBookStatusChangeSchema,
  angelcare360LibraryBookUpdateSchema,
  angelcare360LibraryCopyCreateSchema,
  angelcare360LibraryCopyStatusChangeSchema,
  angelcare360LibraryCopyUpdateSchema,
  angelcare360LibraryLoanCancelSchema,
  angelcare360LibraryLoanCreateSchema,
  angelcare360LibraryLoanLostSchema,
  angelcare360LibraryLoanReturnSchema,
} from '@/lib/angelcare360/validation'
import type { Angelcare360AuditRecord } from '@/types/angelcare360/audit'
import type {
  Angelcare360LibraryAuditFilter,
  Angelcare360LibraryAvailabilityRecord,
  Angelcare360LibraryBookListRecord,
  Angelcare360LibraryBookRecord,
  Angelcare360LibraryCopyListRecord,
  Angelcare360LibraryCopyRecord,
  Angelcare360LibraryLoanListRecord,
  Angelcare360LibraryLoanRecord,
  Angelcare360LibraryMutationResult,
  Angelcare360LibraryOverviewRecord,
} from '@/types/angelcare360/library'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>
type Row = Record<string, any>

const LIBRARY_MODULE = 'bibliotheque'
const BLOCKED_EXPORT_MESSAGE = 'L’export PDF sera activé dans la phase Rapports & Exports.'
const BLOCKED_BARCODE_MESSAGE = 'La lecture code-barres nécessite une intégration dédiée.'
const BLOCKED_REMINDER_MESSAGE = 'Les relances automatiques seront activées avec le module Messagerie.'

function asString(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value)
}

function asOptionalString(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  return typeof value === 'string' ? value : String(value)
}

function asNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) return Number(value)
  return null
}

function buildHref(basePath: string, id: string) {
  return `${basePath}/${id}`
}

function baseRecordFields(row: Row) {
  const createdAt = asString(row.created_at || new Date().toISOString())
  return {
    created_at: createdAt,
    updated_at: asString(row.updated_at || row.created_at || createdAt),
  }
}

function pickRecord(value: unknown) {
  return (value && typeof value === 'object' && !Array.isArray(value) ? value : {}) as Row
}

async function getContextOrThrow(permissionKey: string, schoolId?: string | null) {
  const context = await requireAngelcare360Permission(permissionKey, { schoolId })
  if (!context.school) {
    throw new Error('Aucun établissement actif n’est disponible.')
  }
  return context
}

async function auditLibraryEvent(input: {
  action: string
  severity?: 'debug' | 'info' | 'notice' | 'warning' | 'critical'
  schoolId: string
  entityType: string
  entityId: string
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

async function countRows(client: SupabaseClient, table: string, schoolId: string, filters?: Array<[string, 'eq' | 'gte' | 'lte' | 'in', unknown]>) {
  let query = client.from(table).select('id', { count: 'exact', head: true }).eq('school_id', schoolId)
  for (const [column, operator, value] of filters || []) {
    if (operator === 'eq') query = query.eq(column, value as never)
    if (operator === 'gte') query = query.gte(column, value as never)
    if (operator === 'lte') query = query.lte(column, value as never)
    if (operator === 'in' && Array.isArray(value)) query = query.in(column, value as never[])
  }
  const { count } = await query
  return count ?? 0
}

function daysOverdue(dueAt?: string | null) {
  if (!dueAt) return null
  const due = new Date(dueAt)
  if (Number.isNaN(due.getTime())) return null
  const delta = Math.floor((Date.now() - due.getTime()) / (1000 * 60 * 60 * 24))
  return delta > 0 ? delta : 0
}

function mapBookRecord(row: Row, countsByBook: Map<string, { copies: number; available: number; loans: number; overdue: number; damaged: number; lost: number }>): Angelcare360LibraryBookListRecord {
  const counts = countsByBook.get(asString(row.id)) || { copies: 0, available: 0, loans: 0, overdue: 0, damaged: 0, lost: 0 }
  return {
    ...baseRecordFields(row),
    id: asString(row.id),
    school_id: asString(row.school_id),
    book_code: asString(row.book_code),
    isbn: row.isbn ? asString(row.isbn) : null,
    title: asString(row.title),
    author: row.author ? asString(row.author) : null,
    publisher: row.publisher ? asString(row.publisher) : null,
    category: row.category ? asString(row.category) : null,
    language: asString(row.language || 'fr'),
    status: asString(row.status),
    copy_count: counts.copies,
    available_copy_count: counts.available,
    loan_count: counts.loans,
    overdue_loan_count: counts.overdue,
    damaged_copy_count: counts.damaged,
    lost_copy_count: counts.lost,
    detail_href: buildHref('/angelcare-360-command-center/bibliotheque/livres', asString(row.id)),
  }
}

function mapCopyRecord(row: Row, activeLoanByCopy: Map<string, Row>, borrowerLookup: Map<string, Row>): Angelcare360LibraryCopyListRecord {
  const loan = activeLoanByCopy.get(asString(row.id))
  const borrower = loan ? borrowerLookup.get(asString(loan.borrower_student_id || loan.borrower_staff_id || '')) : null
  return {
    ...baseRecordFields(row),
    id: asString(row.id),
    school_id: asString(row.school_id),
    book_id: asString(row.book_id),
    copy_code: asString(row.copy_code),
    barcode: row.barcode ? asString(row.barcode) : null,
    acquisition_date: row.acquisition_date ? asString(row.acquisition_date) : null,
    shelf_location: row.shelf_location ? asString(row.shelf_location) : null,
    condition: asString(row.condition || 'good'),
    status: asString(row.status),
    book_title: row.book?.title ? asString(row.book.title) : null,
    book_code: row.book?.book_code ? asString(row.book.book_code) : null,
    loan_status: loan ? asString(loan.status) : null,
    borrower_full_name: borrower?.full_name ? asString(borrower.full_name) : null,
    borrower_code: borrower?.student_code || borrower?.staff_code ? asString(borrower.student_code || borrower.staff_code) : null,
    due_at: loan?.due_at ? asString(loan.due_at) : null,
    detail_href: buildHref('/angelcare-360-command-center/bibliotheque/exemplaires', asString(row.id)),
  }
}

function mapLoanRecord(row: Row): Angelcare360LibraryLoanListRecord {
  const borrower = row.borrower_student || row.borrower_staff || {}
  const copy = row.copy || {}
  const book = copy.book || {}
  return {
    ...baseRecordFields(row),
    id: asString(row.id),
    school_id: asString(row.school_id),
    copy_id: asString(row.copy_id),
    borrower_type: asString(row.borrower_type) as 'student' | 'staff',
    borrower_student_id: row.borrower_student_id ? asString(row.borrower_student_id) : null,
    borrower_staff_id: row.borrower_staff_id ? asString(row.borrower_staff_id) : null,
    loaned_at: asString(row.loaned_at),
    due_at: asString(row.due_at),
    returned_at: row.returned_at ? asString(row.returned_at) : null,
    fine_amount: asNumber(row.fine_amount) || 0,
    status: asString(row.status),
    book_title: book.title ? asString(book.title) : null,
    book_code: book.book_code ? asString(book.book_code) : null,
    copy_code: copy.copy_code ? asString(copy.copy_code) : null,
    borrower_full_name: borrower.full_name ? asString(borrower.full_name) : null,
    borrower_code: borrower.student_code ? asString(borrower.student_code) : borrower.staff_code ? asString(borrower.staff_code) : null,
    days_overdue: daysOverdue(row.due_at),
    detail_href: buildHref('/angelcare-360-command-center/bibliotheque/prets', asString(row.id)),
  }
}

async function resolveBookCounts(client: SupabaseClient, schoolId: string) {
  const [booksResponse, copiesResponse, loansResponse] = await Promise.all([
    client.from('angelcare360_library_books').select('id, school_id, book_code, isbn, title, author, publisher, category, language, status, created_at, updated_at').eq('school_id', schoolId).order('title', { ascending: true }).limit(500),
    client.from('angelcare360_library_copies').select('id, school_id, book_id, status').eq('school_id', schoolId),
    client.from('angelcare360_library_loans').select('id, school_id, copy_id, due_at, status, returned_at, copy:angelcare360_library_copies(id, book_id)').eq('school_id', schoolId),
  ])

  const countsByBook = new Map<string, { copies: number; available: number; loans: number; overdue: number; damaged: number; lost: number }>()
  for (const copy of copiesResponse.data || []) {
    const copyRow = copy as Row
    const bookId = asString(copyRow.book_id)
    if (!bookId) continue
    const current = countsByBook.get(bookId) || { copies: 0, available: 0, loans: 0, overdue: 0, damaged: 0, lost: 0 }
    current.copies += 1
    if (asString(copyRow.status) === 'available') current.available += 1
    if (asString(copyRow.status) === 'damaged') current.damaged += 1
    if (asString(copyRow.status) === 'lost') current.lost += 1
    countsByBook.set(bookId, current)
  }
  for (const loan of loansResponse.data || []) {
    const loanRow = loan as Row
    const copy = pickRecord(loanRow.copy)
    const bookId = asString(copy.book_id || '')
    if (!bookId) continue
    const current = countsByBook.get(bookId) || { copies: 0, available: 0, loans: 0, overdue: 0, damaged: 0, lost: 0 }
    if (['open', 'active', 'overdue'].includes(asString(loanRow.status)) && !loanRow.returned_at) {
      current.loans += 1
      if (daysOverdue(loanRow.due_at) && daysOverdue(loanRow.due_at)! > 0) {
        current.overdue += 1
      }
    }
    countsByBook.set(bookId, current)
  }

  return { books: (booksResponse.data || []) as Row[], countsByBook }
}

export async function getAngelcare360LibraryOverview(options?: { schoolId?: string | null }): Promise<Angelcare360LibraryOverviewRecord | null> {
  const context = await getAngelcare360AccessContext({ schoolId: options?.schoolId })
  if (!context?.school) return null
  const supabase = await createClient()
  const schoolId = context.school.id
  const [booksCount, copiesCount, availableCopyCount, loanCount, overdueLoanCount, damagedCopyCount, lostCopyCount, booksWithoutCopiesCount, auditRows] = await Promise.all([
    countRows(supabase, 'angelcare360_library_books', schoolId, [['status', 'eq', 'active']]),
    countRows(supabase, 'angelcare360_library_copies', schoolId),
    countRows(supabase, 'angelcare360_library_copies', schoolId, [['status', 'eq', 'available']]),
    countRows(supabase, 'angelcare360_library_loans', schoolId, [['status', 'in', ['open', 'active', 'overdue']]]),
    countRows(supabase, 'angelcare360_library_loans', schoolId, [['status', 'eq', 'overdue']]),
    countRows(supabase, 'angelcare360_library_copies', schoolId, [['status', 'eq', 'damaged']]),
    countRows(supabase, 'angelcare360_library_copies', schoolId, [['status', 'eq', 'lost']]),
    (async () => {
      const [books, copies] = await Promise.all([
        supabase.from('angelcare360_library_books').select('id').eq('school_id', schoolId),
        supabase.from('angelcare360_library_copies').select('book_id').eq('school_id', schoolId),
      ])
      const bookIdsWithCopies = new Set((copies.data || []).map((row) => asString((row as Row).book_id)))
      return ((books.data || []) as Row[]).filter((row) => !bookIdsWithCopies.has(asString(row.id))).length
    })(),
    supabase
      .from('angelcare360_audit_logs')
      .select('id, school_id, actor_user_id, actor_role, module, action, entity_type, entity_id, severity, request_id, metadata, created_at')
      .eq('school_id', schoolId)
      .or('module.eq.bibliotheque,module.eq.library')
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const risks = []
  if (booksWithoutCopiesCount > 0) risks.push(`${booksWithoutCopiesCount} livre(s) sans exemplaire physique.`)
  if (overdueLoanCount > 0) risks.push(`${overdueLoanCount} prêt(s) en retard doivent être traités.`)
  if (damagedCopyCount > 0) risks.push(`${damagedCopyCount} exemplaire(s) endommagé(s).`)
  if (lostCopyCount > 0) risks.push(`${lostCopyCount} exemplaire(s) perdu(s).`)
  if (availableCopyCount === 0 && copiesCount > 0) risks.push('Aucun exemplaire disponible à l’emprunt.')
  risks.push(BLOCKED_REMINDER_MESSAGE)

  return {
    schoolId: schoolId as Angelcare360LibraryOverviewRecord['schoolId'],
    schoolName: context.school.name,
    activeAcademicYearId: context.academicYear?.id || null,
    activeAcademicYearLabel: context.academicYear?.label || null,
    bookCount: booksCount,
    copyCount: copiesCount,
    availableCopyCount,
    loanCount,
    overdueLoanCount,
    damagedCopyCount,
    lostCopyCount,
    booksWithoutCopiesCount,
    latestAuditEvents: (auditRows.data || []) as Angelcare360AuditRecord[],
    risks,
  }
}

export async function listAngelcare360LibraryBooks(options?: { schoolId?: string | null }) {
  const context = await getContextOrThrow('bibliotheque.view', options?.schoolId)
  const supabase = await createClient()
  const { books, countsByBook } = await resolveBookCounts(supabase, context.school!.id)
  return (books || []).map((row) => mapBookRecord(row, countsByBook))
}

export async function getAngelcare360LibraryBookById(id: string, options?: { schoolId?: string | null }) {
  const context = await getContextOrThrow('bibliotheque.view', options?.schoolId)
  const supabase = await createClient()
  const { data } = await supabase
    .from('angelcare360_library_books')
    .select('id, school_id, book_code, isbn, title, author, publisher, category, language, status, created_at, updated_at')
    .eq('school_id', context.school!.id)
    .eq('id', id)
    .maybeSingle()

  if (!data) return null
  const { countsByBook } = await resolveBookCounts(supabase, context.school!.id)
  return mapBookRecord(data as Row, countsByBook)
}

async function upsertLibraryBook(input: ReturnType<typeof angelcare360LibraryBookCreateSchema.parse>, existingId?: string | null): Promise<Angelcare360LibraryMutationResult<Angelcare360LibraryBookRecord>> {
  const context = await getContextOrThrow(existingId ? 'bibliotheque.update' : 'bibliotheque.create', input.schoolId)
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('angelcare360_library_books')
    .select('*')
    .eq('school_id', context.school!.id)
    .eq('book_code', input.bookCode)
    .maybeSingle()

  if (existing && !existingId) {
    return { ok: true, record: existing as Angelcare360LibraryBookRecord, warning: 'Le livre existe déjà. Aucun doublon créé.', idempotent: true }
  }

  const payload = {
    school_id: context.school!.id,
    book_code: input.bookCode,
    isbn: input.isbn || null,
    title: input.title,
    author: input.author || null,
    publisher: input.publisher || null,
    category: input.category || null,
    language: input.language || 'fr',
    status: input.status || 'active',
    created_by: context.user.id,
    updated_by: context.user.id,
  }

  const query = existingId
    ? supabase.from('angelcare360_library_books').update(payload).eq('school_id', context.school!.id).eq('id', existingId)
    : supabase.from('angelcare360_library_books').insert(payload)

  const { data, error } = await query.select('*').single()
  if (error || !data) return { ok: false, error: error?.message || 'Impossible d’enregistrer le livre.' }

  await auditLibraryEvent({
    action: existingId ? 'library_book.updated' : 'library_book.created',
    schoolId: context.school!.id,
    entityType: 'library_book',
    entityId: String(data.id),
    afterData: data as Record<string, unknown>,
  })

  return { ok: true, record: data as Angelcare360LibraryBookRecord }
}

export async function createAngelcare360LibraryBook(input: Record<string, unknown>) {
  const parsed = angelcare360LibraryBookCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Livre invalide.' }
  return upsertLibraryBook(parsed.data)
}

export async function updateAngelcare360LibraryBook(input: Record<string, unknown>) {
  const parsed = angelcare360LibraryBookUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Livre invalide.' }
  return upsertLibraryBook(parsed.data, parsed.data.id)
}

export async function changeAngelcare360LibraryBookStatus(input: Record<string, unknown>) {
  const parsed = angelcare360LibraryBookStatusChangeSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Statut de livre invalide.' }
  const context = await getContextOrThrow('bibliotheque.update', parsed.data.schoolId)
  const supabase = await createClient()
  const { data: current } = await supabase.from('angelcare360_library_books').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!current) return { ok: false, error: 'Livre introuvable.' }
  if (asString(current.status) === parsed.data.status) return { ok: true, record: current as Angelcare360LibraryBookRecord, idempotent: true }
  const { data, error } = await supabase
    .from('angelcare360_library_books')
    .update({ status: parsed.data.status, updated_by: context.user.id })
    .eq('school_id', context.school!.id)
    .eq('id', parsed.data.id)
    .select('*')
    .single()
  if (error || !data) return { ok: false, error: error?.message || 'Impossible de changer le statut du livre.' }
  await auditLibraryEvent({
    action: 'library_book.updated',
    schoolId: context.school!.id,
    entityType: 'library_book',
    entityId: String(data.id),
    beforeData: current as Record<string, unknown>,
    afterData: data as Record<string, unknown>,
    severity: 'warning',
  })
  return { ok: true, record: data as Angelcare360LibraryBookRecord }
}

export async function listAngelcare360LibraryCopies(options?: { schoolId?: string | null }) {
  const context = await getContextOrThrow('bibliotheque.view', options?.schoolId)
  const supabase = await createClient()
  const [copiesResponse, loansResponse, borrowersResponse] = await Promise.all([
    supabase
      .from('angelcare360_library_copies')
      .select('id, school_id, book_id, copy_code, barcode, acquisition_date, shelf_location, condition, status, created_at, updated_at, book:angelcare360_library_books(id, book_code, title)')
      .eq('school_id', context.school!.id)
      .order('copy_code', { ascending: true }),
    supabase
      .from('angelcare360_library_loans')
      .select('id, school_id, copy_id, borrower_type, borrower_student_id, borrower_staff_id, loaned_at, due_at, returned_at, fine_amount, status')
      .eq('school_id', context.school!.id)
      .in('status', ['open', 'active', 'overdue']),
    supabase
      .from('angelcare360_students')
      .select('id, student_code, full_name')
      .eq('school_id', context.school!.id)
      .limit(500),
  ])

  const activeLoanByCopy = new Map<string, Row>()
  for (const loan of loansResponse.data || []) {
    const loanRow = loan as Row
    if (loanRow.returned_at) continue
    activeLoanByCopy.set(asString(loanRow.copy_id), loanRow)
  }
  const borrowerLookup = new Map<string, Row>()
  for (const row of borrowersResponse.data || []) {
    const student = row as Row
    borrowerLookup.set(asString(student.id), student)
  }
  return (((copiesResponse.data || []) as Row[]).map((row) => mapCopyRecord(row, activeLoanByCopy, borrowerLookup)))
}

async function upsertLibraryCopy(input: ReturnType<typeof angelcare360LibraryCopyCreateSchema.parse>, existingId?: string | null): Promise<Angelcare360LibraryMutationResult<Angelcare360LibraryCopyRecord>> {
  const context = await getContextOrThrow(existingId ? 'bibliotheque.update' : 'bibliotheque.create', input.schoolId)
  const supabase = await createClient()
  const { data: existing } = await supabase.from('angelcare360_library_copies').select('*').eq('school_id', context.school!.id).eq('copy_code', input.copyCode).maybeSingle()
  if (existing && !existingId) {
    return { ok: true, record: existing as Angelcare360LibraryCopyRecord, warning: 'L’exemplaire existe déjà. Aucun doublon créé.', idempotent: true }
  }

  const payload = {
    school_id: context.school!.id,
    book_id: input.bookId,
    copy_code: input.copyCode,
    barcode: input.barcode || null,
    acquisition_date: input.acquisitionDate || null,
    shelf_location: input.shelfLocation || null,
    condition: input.condition || 'good',
    status: input.status || 'available',
    created_by: context.user.id,
    updated_by: context.user.id,
  }

  const query = existingId
    ? supabase.from('angelcare360_library_copies').update(payload).eq('school_id', context.school!.id).eq('id', existingId)
    : supabase.from('angelcare360_library_copies').insert(payload)

  const { data, error } = await query.select('*').single()
  if (error || !data) return { ok: false, error: error?.message || 'Impossible d’enregistrer l’exemplaire.' }

  await auditLibraryEvent({
    action: existingId ? 'library_copy.updated' : 'library_copy.created',
    schoolId: context.school!.id,
    entityType: 'library_copy',
    entityId: String(data.id),
    afterData: data as Record<string, unknown>,
  })
  return { ok: true, record: data as Angelcare360LibraryCopyRecord }
}

export async function createAngelcare360LibraryCopy(input: Record<string, unknown>) {
  const parsed = angelcare360LibraryCopyCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Exemplaire invalide.' }
  return upsertLibraryCopy(parsed.data)
}

export async function updateAngelcare360LibraryCopy(input: Record<string, unknown>) {
  const parsed = angelcare360LibraryCopyUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Exemplaire invalide.' }
  return upsertLibraryCopy(parsed.data, parsed.data.id)
}

export async function changeAngelcare360LibraryCopyStatus(input: Record<string, unknown>) {
  const parsed = angelcare360LibraryCopyStatusChangeSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Statut exemplaire invalide.' }
  const context = await getContextOrThrow('bibliotheque.update', parsed.data.schoolId)
  const supabase = await createClient()
  const { data: current } = await supabase.from('angelcare360_library_copies').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!current) return { ok: false, error: 'Exemplaire introuvable.' }
  if (asString(current.status) === parsed.data.status) return { ok: true, record: current as Angelcare360LibraryCopyRecord, idempotent: true }
  const { data, error } = await supabase
    .from('angelcare360_library_copies')
    .update({
      status: parsed.data.status,
      condition: parsed.data.reason && ['damaged', 'lost'].includes(parsed.data.status) ? parsed.data.status : current.condition,
      metadata_json: { ...(current.metadata_json || {}), reason: parsed.data.reason || null },
      updated_by: context.user.id,
    })
    .eq('school_id', context.school!.id)
    .eq('id', parsed.data.id)
    .select('*')
    .single()
  if (error || !data) return { ok: false, error: error?.message || 'Impossible de changer le statut de l’exemplaire.' }
  await auditLibraryEvent({
    action: 'library_copy.status_changed',
    schoolId: context.school!.id,
    entityType: 'library_copy',
    entityId: String(data.id),
    beforeData: current as Record<string, unknown>,
    afterData: data as Record<string, unknown>,
    severity: parsed.data.status === 'lost' || parsed.data.status === 'damaged' ? 'warning' : 'info',
    metadata: { reason: parsed.data.reason || null },
  })
  return { ok: true, record: data as Angelcare360LibraryCopyRecord }
}

export async function listAngelcare360LibraryLoans(options?: { schoolId?: string | null }) {
  const context = await getContextOrThrow('bibliotheque.view', options?.schoolId)
  const supabase = await createClient()
  const { data } = await supabase
    .from('angelcare360_library_loans')
    .select(`
      id,
      school_id,
      copy_id,
      borrower_type,
      borrower_student_id,
      borrower_staff_id,
      loaned_at,
      due_at,
      returned_at,
      fine_amount,
      status,
      created_at,
      updated_at,
      copy:angelcare360_library_copies(
        id,
        copy_code,
        book_id,
        book:angelcare360_library_books(id, book_code, title)
      ),
      borrower_student:angelcare360_students(id, student_code, full_name, current_class_id, current_section_id, class:angelcare360_classes(id, name, class_code), section:angelcare360_sections(id, name, section_code)),
      borrower_staff:angelcare360_staff(id, staff_code, full_name)
    `)
    .eq('school_id', context.school!.id)
    .order('loaned_at', { ascending: false })
    .limit(500)
  return ((data || []) as Row[]).map((row) => mapLoanRecord(row))
}

export async function getAngelcare360LibraryLoanById(id: string, options?: { schoolId?: string | null }) {
  const context = await getContextOrThrow('bibliotheque.view', options?.schoolId)
  const supabase = await createClient()
  const { data } = await supabase
    .from('angelcare360_library_loans')
    .select(`
      id,
      school_id,
      copy_id,
      borrower_type,
      borrower_student_id,
      borrower_staff_id,
      loaned_at,
      due_at,
      returned_at,
      fine_amount,
      status,
      created_at,
      updated_at,
      copy:angelcare360_library_copies(
        id,
        copy_code,
        book_id,
        book:angelcare360_library_books(id, book_code, title)
      ),
      borrower_student:angelcare360_students(id, student_code, full_name, current_class_id, current_section_id, class:angelcare360_classes(id, name, class_code), section:angelcare360_sections(id, name, section_code)),
      borrower_staff:angelcare360_staff(id, staff_code, full_name)
    `)
    .eq('school_id', context.school!.id)
    .eq('id', id)
    .maybeSingle()
  return data ? mapLoanRecord(data as Row) : null
}

export async function createAngelcare360LibraryLoan(input: Record<string, unknown>): Promise<Angelcare360LibraryMutationResult<Angelcare360LibraryLoanRecord>> {
  const parsed = angelcare360LibraryLoanCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Prêt invalide.' }
  const context = await getContextOrThrow('bibliotheque.create', parsed.data.schoolId)
  const supabase = await createClient()
  const { data: copy } = await supabase.from('angelcare360_library_copies').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.copyId).maybeSingle()
  if (!copy) return { ok: false, error: 'Exemplaire introuvable.' }
  if (asString(copy.status) !== 'available') return { ok: false, locked: true, reason: 'L’exemplaire n’est pas disponible pour un nouveau prêt.' }
  const { data: activeLoan } = await supabase
    .from('angelcare360_library_loans')
    .select('*')
    .eq('school_id', context.school!.id)
    .eq('copy_id', parsed.data.copyId)
    .in('status', ['open', 'active', 'overdue'])
    .is('returned_at', null)
    .maybeSingle()
  if (activeLoan) return { ok: true, record: activeLoan as Angelcare360LibraryLoanRecord, warning: 'Un prêt actif existe déjà pour cet exemplaire.', idempotent: true }

  const payload = {
    school_id: context.school!.id,
    copy_id: parsed.data.copyId,
    borrower_type: parsed.data.borrowerType,
    borrower_student_id: parsed.data.borrowerStudentId || null,
    borrower_staff_id: parsed.data.borrowerStaffId || null,
    loaned_at: parsed.data.loanedAt || new Date().toISOString(),
    due_at: parsed.data.dueAt,
    returned_at: null,
    fine_amount: 0,
    status: parsed.data.status || 'open',
    created_by: context.user.id,
    updated_by: context.user.id,
  }

  const { data, error } = await supabase.from('angelcare360_library_loans').insert(payload).select('*').single()
  if (error || !data) return { ok: false, error: error?.message || 'Impossible d’enregistrer le prêt.' }

  await supabase.from('angelcare360_library_copies').update({ status: 'loaned', updated_by: context.user.id }).eq('school_id', context.school!.id).eq('id', parsed.data.copyId)
  await auditLibraryEvent({
    action: 'library_loan.created',
    schoolId: context.school!.id,
    entityType: 'library_loan',
    entityId: String(data.id),
    afterData: data as Record<string, unknown>,
  })
  return { ok: true, record: data as Angelcare360LibraryLoanRecord }
}

export async function returnAngelcare360LibraryLoan(input: Record<string, unknown>): Promise<Angelcare360LibraryMutationResult<Angelcare360LibraryLoanRecord>> {
  const parsed = angelcare360LibraryLoanReturnSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Retour invalide.' }
  const context = await getContextOrThrow('bibliotheque.update', parsed.data.schoolId)
  const supabase = await createClient()
  const { data: current } = await supabase.from('angelcare360_library_loans').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!current) return { ok: false, error: 'Prêt introuvable.' }
  if (asString(current.status) === 'returned' && current.returned_at) return { ok: true, record: current as Angelcare360LibraryLoanRecord, idempotent: true }
  const { data, error } = await supabase
    .from('angelcare360_library_loans')
    .update({
      status: 'returned',
      returned_at: parsed.data.returnedAt || new Date().toISOString(),
      updated_by: context.user.id,
      metadata_json: { ...(current.metadata_json || {}), return_notes: parsed.data.notes || null },
    })
    .eq('school_id', context.school!.id)
    .eq('id', parsed.data.id)
    .select('*')
    .single()
  if (error || !data) return { ok: false, error: error?.message || 'Impossible de clôturer le prêt.' }
  await supabase.from('angelcare360_library_copies').update({ status: 'available', updated_by: context.user.id }).eq('school_id', context.school!.id).eq('id', current.copy_id)
  await auditLibraryEvent({
    action: 'library_loan.returned',
    schoolId: context.school!.id,
    entityType: 'library_loan',
    entityId: String(data.id),
    beforeData: current as Record<string, unknown>,
    afterData: data as Record<string, unknown>,
  })
  return { ok: true, record: data as Angelcare360LibraryLoanRecord }
}

export async function markAngelcare360LibraryLoanLost(input: Record<string, unknown>): Promise<Angelcare360LibraryMutationResult<Angelcare360LibraryLoanRecord>> {
  const parsed = angelcare360LibraryLoanLostSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Marquage perdu invalide.' }
  const context = await getContextOrThrow('bibliotheque.update', parsed.data.schoolId)
  const supabase = await createClient()
  const { data: current } = await supabase.from('angelcare360_library_loans').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!current) return { ok: false, error: 'Prêt introuvable.' }
  const { data, error } = await supabase
    .from('angelcare360_library_loans')
    .update({
      status: 'lost',
      returned_at: current.returned_at || new Date().toISOString(),
      updated_by: context.user.id,
      metadata_json: { ...(current.metadata_json || {}), lost_reason: parsed.data.reason },
    })
    .eq('school_id', context.school!.id)
    .eq('id', parsed.data.id)
    .select('*')
    .single()
  if (error || !data) return { ok: false, error: error?.message || 'Impossible de marquer le prêt comme perdu.' }
  await supabase.from('angelcare360_library_copies').update({ status: 'lost', updated_by: context.user.id }).eq('school_id', context.school!.id).eq('id', current.copy_id)
  await auditLibraryEvent({
    action: 'library_loan.marked_lost',
    schoolId: context.school!.id,
    entityType: 'library_loan',
    entityId: String(data.id),
    severity: 'warning',
    beforeData: current as Record<string, unknown>,
    afterData: data as Record<string, unknown>,
    metadata: { reason: parsed.data.reason },
  })
  return { ok: true, record: data as Angelcare360LibraryLoanRecord }
}

export async function cancelAngelcare360LibraryLoan(input: Record<string, unknown>): Promise<Angelcare360LibraryMutationResult<Angelcare360LibraryLoanRecord>> {
  const parsed = angelcare360LibraryLoanCancelSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Annulation invalide.' }
  const context = await getContextOrThrow('bibliotheque.update', parsed.data.schoolId)
  const supabase = await createClient()
  const { data: current } = await supabase.from('angelcare360_library_loans').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!current) return { ok: false, error: 'Prêt introuvable.' }
  if (asString(current.status) === 'archived') return { ok: true, record: current as Angelcare360LibraryLoanRecord, idempotent: true }
  const { data, error } = await supabase
    .from('angelcare360_library_loans')
    .update({
      status: 'archived',
      updated_by: context.user.id,
      metadata_json: { ...(current.metadata_json || {}), cancel_reason: parsed.data.reason },
    })
    .eq('school_id', context.school!.id)
    .eq('id', parsed.data.id)
    .select('*')
    .single()
  if (error || !data) return { ok: false, error: error?.message || 'Impossible d’annuler le prêt.' }
  await auditLibraryEvent({
    action: 'library_loan.cancelled',
    schoolId: context.school!.id,
    entityType: 'library_loan',
    entityId: String(data.id),
    severity: 'warning',
    beforeData: current as Record<string, unknown>,
    afterData: data as Record<string, unknown>,
    metadata: { reason: parsed.data.reason },
  })
  return { ok: true, record: data as Angelcare360LibraryLoanRecord }
}

export async function listAngelcare360LibraryOverdueLoans(options?: { schoolId?: string | null }) {
  const context = await getContextOrThrow('bibliotheque.view', options?.schoolId)
  const loans = await listAngelcare360LibraryLoans({ schoolId: context.school!.id })
  return loans.filter((loan) => ['open', 'active', 'overdue'].includes(loan.status) && loan.days_overdue !== null && (loan.days_overdue || 0) > 0)
}

export async function getAngelcare360LibraryAvailability(options?: { schoolId?: string | null }) {
  const context = await getContextOrThrow('bibliotheque.view', options?.schoolId)
  const supabase = await createClient()
  const { books, countsByBook } = await resolveBookCounts(supabase, context.school!.id)
  return (books || []).map((row) => {
    const counts = countsByBook.get(asString(row.id)) || { copies: 0, available: 0, loans: 0, overdue: 0, damaged: 0, lost: 0 }
    const status = counts.copies === 0 ? 'incomplete' : counts.available > 0 ? 'ready' : 'blocked'
    const record: Angelcare360LibraryAvailabilityRecord = {
      school_id: context.school!.id,
      book_id: asString(row.id),
      book_code: asString(row.book_code),
      title: asString(row.title),
      copy_count: counts.copies,
      available_copy_count: counts.available,
      loaned_copy_count: counts.loans,
      damaged_copy_count: counts.damaged,
      lost_copy_count: counts.lost,
      status,
    }
    return record
  })
}

export async function listAngelcare360LibraryAuditEvents(options?: { schoolId?: string | null; filters?: Partial<Angelcare360LibraryAuditFilter> }) {
  const context = await getContextOrThrow('audit.view', options?.schoolId)
  const supabase = await createClient()
  const filters = options?.filters || {}
  let query = supabase
    .from('angelcare360_audit_logs')
    .select('id, school_id, actor_user_id, actor_role, module, action, entity_type, entity_id, severity, request_id, before_data, after_data, metadata, created_at')
    .eq('school_id', context.school!.id)
    .or('module.eq.bibliotheque,module.eq.library')
    .order('created_at', { ascending: false })
    .limit(200)
  if (filters.module) query = query.eq('module', filters.module)
  if (filters.action) query = query.eq('action', filters.action)
  if (filters.severity) query = query.eq('severity', filters.severity)
  if (filters.entityType) query = query.eq('entity_type', filters.entityType)
  if (filters.entityId) query = query.eq('entity_id', filters.entityId)
  if (filters.actorUserId) query = query.eq('actor_user_id', filters.actorUserId)
  const { data } = await query
  return (data || []) as Angelcare360AuditRecord[]
}

export async function blockAngelcare360LibraryExport(options?: { schoolId?: string | null; reason?: string | null }) {
  const context = await getContextOrThrow('bibliotheque.view', options?.schoolId)
  await auditLibraryEvent({
    action: 'library_export.blocked_not_available',
    schoolId: context.school!.id,
    entityType: 'library_export',
    entityId: context.school!.id,
    severity: 'warning',
    metadata: { reason: options?.reason || BLOCKED_EXPORT_MESSAGE },
  })
  return { ok: true, locked: true, reason: BLOCKED_EXPORT_MESSAGE }
}

export async function blockAngelcare360LibraryBarcode(options?: { schoolId?: string | null; reason?: string | null }) {
  const context = await getContextOrThrow('bibliotheque.view', options?.schoolId)
  await auditLibraryEvent({
    action: 'library_barcode.blocked_not_available',
    schoolId: context.school!.id,
    entityType: 'library_barcode',
    entityId: context.school!.id,
    severity: 'warning',
    metadata: { reason: options?.reason || BLOCKED_BARCODE_MESSAGE },
  })
  return { ok: true, locked: true, reason: BLOCKED_BARCODE_MESSAGE }
}

export async function blockAngelcare360LibraryReminder(options?: { schoolId?: string | null; reason?: string | null }) {
  const context = await getContextOrThrow('bibliotheque.view', options?.schoolId)
  await auditLibraryEvent({
    action: 'library_reminder.blocked_not_available',
    schoolId: context.school!.id,
    entityType: 'library_reminder',
    entityId: context.school!.id,
    severity: 'warning',
    metadata: { reason: options?.reason || BLOCKED_REMINDER_MESSAGE },
  })
  return { ok: true, locked: true, reason: BLOCKED_REMINDER_MESSAGE }
}
