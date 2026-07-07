import type { Angelcare360AuditRecord } from './audit'
import type { Angelcare360BaseRecord, Angelcare360Json, Angelcare360UUID } from './database'

export type Angelcare360FeeStructureStatus = 'draft' | 'active' | 'inactive' | 'archived'
export type Angelcare360FeeItemStatus = 'active' | 'inactive' | 'archived'
export type Angelcare360StudentFeeAssignmentStatus = 'active' | 'inactive' | 'archived'
export type Angelcare360InvoiceStatus = 'draft' | 'issued' | 'sent' | 'partial' | 'partially_paid' | 'paid' | 'overdue' | 'void' | 'cancelled' | 'archived'
export type Angelcare360PaymentStatus = 'pending' | 'confirmed' | 'failed' | 'rejected' | 'refunded' | 'cancelled'
export type Angelcare360ReceiptStatus = 'draft' | 'issued' | 'void' | 'cancelled' | 'archived'
export type Angelcare360DiscountStatus = 'requested' | 'approved' | 'rejected' | 'applied' | 'cancelled' | 'active' | 'inactive' | 'archived'
export type Angelcare360ReminderStatus = 'planned' | 'scheduled' | 'sent' | 'blocked' | 'failed' | 'cancelled' | 'archived'
export type Angelcare360ExpenseStatus = 'draft' | 'approved' | 'paid' | 'cancelled' | 'archived'
export type Angelcare360PaymentMethod = 'cash' | 'transfer' | 'cheque' | 'card' | 'other' | string

export interface Angelcare360FeeStructureRecord extends Angelcare360BaseRecord {
  school_id: Angelcare360UUID
  academic_year_id: Angelcare360UUID
  fee_code: string
  label: string
  description?: string | null
  due_day_of_month?: number | null
  currency: string
  applies_to_level?: string | null
  status: Angelcare360FeeStructureStatus | string
}

export interface Angelcare360FeeStructureListRecord extends Angelcare360FeeStructureRecord {
  academic_year_label?: string | null
  fee_item_count?: number
  student_assignment_count?: number
  detail_href?: string
}

export interface Angelcare360FeeItemRecord extends Angelcare360BaseRecord {
  school_id: Angelcare360UUID
  fee_structure_id: Angelcare360UUID
  item_code: string
  label: string
  fee_type: string
  amount: number
  due_on?: string | null
  is_required: boolean
  status: Angelcare360FeeItemStatus | string
}

export interface Angelcare360FeeItemListRecord extends Angelcare360FeeItemRecord {
  fee_structure_label?: string | null
  fee_structure_code?: string | null
  detail_href?: string
}

export interface Angelcare360StudentFeeAssignmentRecord extends Angelcare360BaseRecord {
  school_id: Angelcare360UUID
  academic_year_id: Angelcare360UUID
  student_id: Angelcare360UUID
  fee_structure_id: Angelcare360UUID
  class_id?: Angelcare360UUID | null
  section_id?: Angelcare360UUID | null
  assigned_on: string
  status: Angelcare360StudentFeeAssignmentStatus | string
}

export interface Angelcare360StudentFeeAssignmentListRecord extends Angelcare360StudentFeeAssignmentRecord {
  student_full_name?: string | null
  student_code?: string | null
  class_name?: string | null
  class_code?: string | null
  section_name?: string | null
  section_code?: string | null
  fee_structure_label?: string | null
  fee_structure_code?: string | null
}

export interface Angelcare360InvoiceRecord extends Angelcare360BaseRecord {
  school_id: Angelcare360UUID
  academic_year_id: Angelcare360UUID
  student_id: Angelcare360UUID
  invoice_number: string
  invoice_type: string
  invoice_date: string
  due_date?: string | null
  currency: string
  subtotal_amount: number
  discount_total: number
  tax_total: number
  total_amount: number
  amount_paid: number
  balance_due?: number
  status: Angelcare360InvoiceStatus | string
}

export interface Angelcare360InvoiceListRecord extends Angelcare360InvoiceRecord {
  student_full_name?: string | null
  student_code?: string | null
  class_name?: string | null
  class_code?: string | null
  section_name?: string | null
  section_code?: string | null
  academic_year_label?: string | null
  line_count?: number
  payment_count?: number
  detail_href?: string
}

export interface Angelcare360InvoiceLineRecord extends Angelcare360BaseRecord {
  school_id: Angelcare360UUID
  invoice_id: Angelcare360UUID
  fee_item_id?: Angelcare360UUID | null
  line_code?: string | null
  label: string
  quantity: number
  unit_amount: number
  line_total: number
  status: string
}

export interface Angelcare360InvoiceLineListRecord extends Angelcare360InvoiceLineRecord {
  fee_item_label?: string | null
  fee_item_code?: string | null
}

export interface Angelcare360PaymentRecord extends Angelcare360BaseRecord {
  school_id: Angelcare360UUID
  academic_year_id: Angelcare360UUID
  invoice_id?: Angelcare360UUID | null
  student_id?: Angelcare360UUID | null
  payment_number: string
  payment_date: string
  method: Angelcare360PaymentMethod | string
  amount: number
  allocated_amount: number
  reference?: string | null
  recorded_by?: Angelcare360UUID | null
  status: Angelcare360PaymentStatus | string
}

export interface Angelcare360PaymentListRecord extends Angelcare360PaymentRecord {
  invoice_number?: string | null
  student_full_name?: string | null
  student_code?: string | null
  receipt_number?: string | null
  detail_href?: string
}

export interface Angelcare360ReceiptRecord extends Angelcare360BaseRecord {
  school_id: Angelcare360UUID
  payment_id: Angelcare360UUID
  receipt_number: string
  issued_at: string
  receipt_document_id?: Angelcare360UUID | null
  status: Angelcare360ReceiptStatus | string
}

export interface Angelcare360ReceiptListRecord extends Angelcare360ReceiptRecord {
  payment_number?: string | null
  payment_amount?: number | null
  invoice_number?: string | null
  detail_href?: string
}

export interface Angelcare360DiscountRecord extends Angelcare360BaseRecord {
  school_id: Angelcare360UUID
  academic_year_id?: Angelcare360UUID | null
  student_id?: Angelcare360UUID | null
  invoice_id?: Angelcare360UUID | null
  discount_code: string
  discount_type: string
  amount: number
  reason?: string | null
  approved_by?: Angelcare360UUID | null
  status: Angelcare360DiscountStatus | string
}

export interface Angelcare360DiscountListRecord extends Angelcare360DiscountRecord {
  student_full_name?: string | null
  student_code?: string | null
  invoice_number?: string | null
  academic_year_label?: string | null
  detail_href?: string
}

export interface Angelcare360PaymentReminderRecord extends Angelcare360BaseRecord {
  school_id: Angelcare360UUID
  invoice_id: Angelcare360UUID
  student_id?: Angelcare360UUID | null
  reminder_code: string
  reminder_type: string
  scheduled_for: string
  sent_at?: string | null
  channel: string
  notes?: string | null
  delivered_by?: Angelcare360UUID | null
  status: Angelcare360ReminderStatus | string
}

export interface Angelcare360PaymentReminderListRecord extends Angelcare360PaymentReminderRecord {
  invoice_number?: string | null
  student_full_name?: string | null
  student_code?: string | null
  detail_href?: string
}

export interface Angelcare360FinanceAccountRecord extends Angelcare360BaseRecord {
  school_id: Angelcare360UUID
  account_code: string
  label: string
  account_type: string
  currency: string
  opening_balance: number
  status: string
}

export interface Angelcare360ExpenseRecord extends Angelcare360BaseRecord {
  school_id: Angelcare360UUID
  academic_year_id?: Angelcare360UUID | null
  expense_code: string
  expense_date: string
  category: string
  vendor_name: string
  account_id?: Angelcare360UUID | null
  amount: number
  currency: string
  payment_method: string
  notes?: string | null
  status: Angelcare360ExpenseStatus | string
}

export interface Angelcare360ExpenseListRecord extends Angelcare360ExpenseRecord {
  account_label?: string | null
  academic_year_label?: string | null
  detail_href?: string
}

export interface Angelcare360StudentBalanceRecord {
  schoolId: Angelcare360UUID
  studentId: Angelcare360UUID
  studentFullName: string
  studentCode?: string | null
  className?: string | null
  classCode?: string | null
  sectionName?: string | null
  sectionCode?: string | null
  invoicedTotal: number
  paidTotal: number
  discountTotal: number
  outstandingTotal: number
  currency?: string | null
  isPartialCalculation: boolean
  detailHref: string
}

export interface Angelcare360AccountStatementMovementRecord {
  movementType: 'invoice' | 'payment' | 'discount' | 'reminder'
  movementId: string
  movementCode: string
  movementDate: string
  label: string
  amount: number
  balanceAfter: number
  status: string
}

export interface Angelcare360AccountStatementRecord {
  schoolId: Angelcare360UUID
  studentId: Angelcare360UUID
  studentFullName: string
  studentCode?: string | null
  className?: string | null
  classCode?: string | null
  sectionName?: string | null
  sectionCode?: string | null
  currency?: string | null
  openingBalance: number
  closingBalance: number
  movements: Angelcare360AccountStatementMovementRecord[]
  isPartialCalculation: boolean
}

export interface Angelcare360FinanceOverviewRecord {
  schoolId: Angelcare360UUID
  schoolName: string
  activeAcademicYearId?: Angelcare360UUID | null
  activeAcademicYearLabel?: string | null
  activeTermId?: Angelcare360UUID | null
  activeTermLabel?: string | null
  totalFeeStructures: number
  totalFeeItems: number
  totalAssignments: number
  totalInvoices: number
  issuedInvoices: number
  overdueInvoices: number
  totalPayments: number
  confirmedPayments: number
  pendingPayments: number
  totalReceipts: number
  totalDiscounts: number
  requestedDiscounts: number
  approvedDiscounts: number
  totalReminders: number
  plannedReminders: number
  blockedReminders: number
  totalBalances: number
  totalOutstanding: number
  totalExpenses: number
  studentWithFeeAssignmentCount: number
  studentsWithOutstandingCount: number
  classCount: number
  sectionCount: number
  teacherAssignmentCount: number
  latestAuditEvents: Angelcare360AuditRecord[]
  risks: string[]
  monthLabel?: string | null
}

export interface Angelcare360FinanceAuditFilter {
  schoolId?: Angelcare360UUID | null
  module?: string | null
  action?: string | null
  entityType?: string | null
  entityId?: Angelcare360UUID | null
  severity?: string | null
  actorUserId?: Angelcare360UUID | null
  search?: string | null
  from?: string | null
  to?: string | null
}

export interface Angelcare360FinanceMutationResult<T = unknown> {
  ok: boolean
  record?: T | null
  records?: T[]
  error?: string
  warning?: string | null
  idempotent?: boolean
  locked?: boolean
  reason?: string | null
  metadata?: Angelcare360Json
}
