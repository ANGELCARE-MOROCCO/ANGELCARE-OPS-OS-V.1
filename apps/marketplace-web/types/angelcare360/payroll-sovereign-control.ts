export type PayrollAuthority = 'sovereign' | 'legacy' | 'sovereign-ready'
export type MoneyMinor = number

export interface PayrollIntegrity {
  installed: boolean
  safeForOperations: boolean
  criticalCount: number
  runPeriodMismatch: number
  resultReferenceMismatch: number
  inputReferenceMismatch: number
  paymentReferenceMismatch: number
  reconciliationMismatch: number
  finalizationMismatch: number
  message?: string
}

export interface PayrollStaffDirectoryEntry {
  id: string
  staffCode: string
  name: string
  department: string | null
  staffType: string | null
  status: string
}

export interface PayrollPeriod {
  id: string
  code: string
  label: string
  startsOn: string
  endsOn: string
  paymentDate: string | null
  status: string
  inputCutoffAt: string | null
  finalizedAt: string | null
}

export interface PayrollRun {
  id: string
  periodId: string
  periodCode: string
  runCode: string
  runType: string
  status: string
  inputHash: string
  totals: Record<string, unknown>
  startedAt: string | null
  completedAt: string | null
  validatedAt: string | null
  approvedAt: string | null
  finalizedAt: string | null
  resultCount: number
  netMinor: number
  exceptionCount: number
}

export interface PayrollResult {
  id: string
  runId: string
  periodId: string
  staffId: string
  staffCode: string
  staffName: string
  baseMinor: number
  earningsMinor: number
  grossMinor: number
  employeeContributionsMinor: number
  employerContributionsMinor: number
  deductionsMinor: number
  reimbursementsMinor: number
  netPayableMinor: number
  employerCostMinor: number
  status: string
  calculationHash: string
  finalizedAt: string | null
  calculation: Record<string, unknown>
}

export interface PayrollInput {
  id: string
  periodId: string
  staffId: string
  staffCode: string
  staffName: string
  componentCode: string
  inputType: string
  amountMinor: number
  quantity: number
  currency: string
  sourceType: string
  status: string
  approvedAt: string | null
  createdAt: string
  evidence: Record<string, unknown>
}

export interface PayrollAdvance {
  id: string
  staffId: string
  staffCode: string
  staffName: string
  advanceCode: string
  principalMinor: number
  recoveredMinor: number
  remainingMinor: number
  installmentMinor: number
  installmentCount: number
  recoveryStartPeriodId: string | null
  status: string
  reason: string | null
  approvedAt: string | null
  disbursedAt: string | null
}

export interface PayrollBatch {
  id: string
  runId: string
  batchCode: string
  paymentMethod: string
  currency: string
  paymentDate: string
  totalMinor: number
  status: string
  approvedAt: string | null
  reconciledAt: string | null
  itemCount: number
  paidCount: number
  failedCount: number
  pendingCount: number
  paidMinor: number
}

export interface PayrollPaymentItem {
  id: string
  batchId: string
  resultId: string
  staffId: string
  staffName: string
  amountMinor: number
  status: string
  providerReference: string | null
  paidAt: string | null
  failureReason: string | null
}

export interface PayrollReconciliation {
  id: string
  batchId: string
  batchCode: string
  status: string
  expectedMinor: number
  paidMinor: number
  failedCount: number
  pendingCount: number
  resolvedAt: string | null
  createdAt: string
}

export interface PayrollVersion {
  id: string
  kind: 'calendar' | 'policy' | 'component' | 'export' | 'offcycle' | 'settlement'
  code: string
  name: string
  version: number
  status: string
  effectiveFrom: string
  effectiveTo: string | null
  publishedAt: string | null
}

export interface PayrollPayslip {
  id: string
  runId: string
  resultId: string
  staffId: string
  staffName: string
  version: number
  versionCode: string
  sourceSignature: string
  documentPath: string
  status: string
  generatedAt: string | null
  publishedAt: string | null
}

export interface PayrollLegacyRecord {
  id: string
  periodId: string
  staffId: string
  staffName: string
  payrollNumber: string
  baseSalary: number
  grossAmount: number
  deductionsTotal: number
  bonusesTotal: number
  netAmount: number
  paymentStatus: string
  status: string
}

export interface PayrollAudit {
  id: string
  action: string
  entityType: string | null
  entityId: string | null
  severity: string
  actorRole: string | null
  createdAt: string
  metadata: Record<string, unknown> | null
}

export interface PayrollSnapshot {
  schoolId: string
  schoolName: string
  schoolCode: string
  generatedAt: string
  authority: PayrollAuthority
  authorityReason: string
  integrity: PayrollIntegrity
  staffDirectory: PayrollStaffDirectoryEntry[]
  periods: PayrollPeriod[]
  runs: PayrollRun[]
  results: PayrollResult[]
  inputs: PayrollInput[]
  advances: PayrollAdvance[]
  batches: PayrollBatch[]
  paymentItems: PayrollPaymentItem[]
  reconciliations: PayrollReconciliation[]
  versions: PayrollVersion[]
  payslips: PayrollPayslip[]
  legacyRecords: PayrollLegacyRecord[]
  audits: PayrollAudit[]
  metrics: {
    periods: number
    openPeriods: number
    runs: number
    results: number
    employees: number
    staffPopulation: number
    netMinor: number
    grossMinor: number
    employerCostMinor: number
    exceptions: number
    submittedInputs: number
    unapprovedInputs: number
    advancesOpen: number
    advanceRemainingMinor: number
    batchesOpen: number
    pendingPayments: number
    failedPayments: number
    pendingPaymentMinor: number
    unreconciledBatches: number
  }
  capabilities: {
    calculationEngineProven: false
    automaticBankTransfer: false
    cnssAutomatic: false
    taxAutomatic: false
    payslipPdfEngineProven: false
    controlledExportEngineProven: false
    externalDeclarationSubmission: false
  }
}

export interface PayrollMutationResult {
  ok: boolean
  locked?: boolean
  error?: string
  message?: string
  id?: string
  data?: Record<string, unknown>
}
