import type { Angelcare360AuditRecord } from './audit'
import type { Angelcare360BaseRecord, Angelcare360Json, Angelcare360UUID } from './database'

export type Angelcare360PayrollPeriodStatus =
  | 'draft'
  | 'planned'
  | 'open'
  | 'calculated'
  | 'validated'
  | 'paid'
  | 'closed'
  | 'cancelled'
  | 'archived'

export type Angelcare360PayrollRecordStatus =
  | 'draft'
  | 'pending_review'
  | 'validated'
  | 'payment_pending'
  | 'paid'
  | 'blocked'
  | 'cancelled'
  | 'approved'
  | 'archived'

export type Angelcare360PayrollItemType =
  | 'base_salary'
  | 'bonus'
  | 'deduction'
  | 'advance'
  | 'adjustment'
  | 'reimbursement'
  | 'other'
  | 'earning'
  | 'allowance'

export type Angelcare360PayrollItemStatus = 'active' | 'archived'
export type Angelcare360PayrollPaymentStatus = 'not_ready' | 'pending' | 'confirmed' | 'blocked' | 'cancelled' | 'partial' | 'paid' | 'failed'
export type Angelcare360PayrollComplianceStatus = 'not_configured' | 'pending_validation' | 'locked' | 'ready_later'

export interface Angelcare360PayrollPeriodRecord extends Angelcare360BaseRecord {
  school_id: Angelcare360UUID
  academic_year_id: Angelcare360UUID
  period_code: string
  label: string
  starts_on: string
  ends_on: string
  payment_date?: string | null
  status: Angelcare360PayrollPeriodStatus | string
  validated_at?: string | null
  validated_by?: Angelcare360UUID | null
  closed_at?: string | null
  blocked_reason?: string | null
  idempotency_key?: string | null
}

export interface Angelcare360PayrollPeriodListRecord extends Angelcare360PayrollPeriodRecord {
  academic_year_label?: string | null
  payroll_record_count?: number
  validated_record_count?: number
  paid_record_count?: number
  gross_total?: number
  net_total?: number
  detail_href?: string
}

export interface Angelcare360PayrollPeriodDetailRecord extends Angelcare360PayrollPeriodListRecord {
  records?: Angelcare360PayrollRecordListRecord[]
}

export interface Angelcare360PayrollRecord extends Angelcare360BaseRecord {
  school_id: Angelcare360UUID
  payroll_period_id: Angelcare360UUID
  staff_id: Angelcare360UUID
  payroll_number: string
  base_salary: number
  gross_amount: number
  deductions_total: number
  bonuses_total: number
  net_amount: number
  payment_status: Angelcare360PayrollPaymentStatus | string
  paid_at?: string | null
  payment_date?: string | null
  payment_method?: string | null
  payment_reference?: string | null
  validated_at?: string | null
  validated_by?: Angelcare360UUID | null
  blocked_reason?: string | null
  status: Angelcare360PayrollRecordStatus | string
  idempotency_key?: string | null
}

export interface Angelcare360PayrollRecordListRecord extends Angelcare360PayrollRecord {
  staff_full_name?: string | null
  staff_code?: string | null
  staff_type?: string | null
  department?: string | null
  period_label?: string | null
  period_code?: string | null
  academic_year_label?: string | null
  contract_salary_amount?: number | null
  contract_currency?: string | null
  item_count?: number
  bonus_total?: number
  deduction_total?: number
  advance_total?: number
  reimbursement_total?: number
  detail_href?: string
}

export interface Angelcare360PayrollRecordDetailRecord extends Angelcare360PayrollRecordListRecord {
  items?: Angelcare360PayrollItemListRecord[]
}

export interface Angelcare360PayrollItemRecord extends Angelcare360BaseRecord {
  school_id: Angelcare360UUID
  payroll_record_id: Angelcare360UUID
  item_code: string
  item_type: Angelcare360PayrollItemType | string
  label: string
  amount: number
  notes?: string | null
  status: Angelcare360PayrollItemStatus | string
  idempotency_key?: string | null
}

export interface Angelcare360PayrollItemListRecord extends Angelcare360PayrollItemRecord {
  payroll_number?: string | null
  staff_full_name?: string | null
  staff_code?: string | null
  staff_type?: string | null
  period_label?: string | null
  period_code?: string | null
  detail_href?: string
}

export interface Angelcare360PayrollReadinessRecord {
  schoolId: Angelcare360UUID
  academicYearId?: Angelcare360UUID | null
  payrollPeriodId?: Angelcare360UUID | null
  staffId?: Angelcare360UUID | null
  payrollRecordCount: number
  payrollItemCount: number
  baseSalaryReady: boolean
  formulaReady: boolean
  periodSelected: boolean
  staffSelected: boolean
  canCalculate: boolean
  reason?: string | null
}

export interface Angelcare360PayrollComplianceCheckpointRecord {
  key: string
  label: string
  status: Angelcare360PayrollComplianceStatus
  reason: string
}

export interface Angelcare360PayrollComplianceReadinessRecord {
  schoolId: Angelcare360UUID
  overallStatus: Angelcare360PayrollComplianceStatus
  checkpoints: Angelcare360PayrollComplianceCheckpointRecord[]
}

export interface Angelcare360PayrollOverviewRecord {
  schoolId: Angelcare360UUID
  schoolName: string
  activeAcademicYearId?: Angelcare360UUID | null
  activeAcademicYearLabel?: string | null
  activePayrollPeriodId?: Angelcare360UUID | null
  activePayrollPeriodLabel?: string | null
  staffCount: number
  teacherCount: number
  payrollPeriodCount: number
  payrollRecordCount: number
  pendingReviewCount: number
  validatedCount: number
  paidCount: number
  blockedCount: number
  openPeriodCount: number
  grossTotal: number
  netTotal: number
  baseSalaryTotal: number
  bonusTotal: number
  deductionTotal: number
  advanceTotal: number
  reimbursementTotal: number
  latestAuditEvents: Angelcare360AuditRecord[]
  risks: string[]
  readiness: Angelcare360PayrollReadinessRecord
  compliance: Angelcare360PayrollComplianceReadinessRecord
  monthLabel?: string | null
}

export interface Angelcare360PayrollAuditFilter {
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

export interface Angelcare360PayrollHistoryFiltersInput {
  schoolId?: Angelcare360UUID | null
  payrollPeriodId?: Angelcare360UUID | null
  staffId?: Angelcare360UUID | null
  status?: string | null
  search?: string | null
  from?: string | null
  to?: string | null
}

export interface Angelcare360PayrollItemCreateInput {
  schoolId?: Angelcare360UUID | null
  payrollRecordId: Angelcare360UUID
  itemType: Angelcare360PayrollItemType
  label: string
  amount: number
  notes?: string | null
  itemCode?: string | null
  status?: Angelcare360PayrollItemStatus | null
  idempotencyKey?: string | null
}

export interface Angelcare360PayrollMutationResult<T = unknown> {
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
