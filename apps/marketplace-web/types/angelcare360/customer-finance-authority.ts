export type FinanceAuthorityScene =
  | 'command'
  | 'billing'
  | 'payments'
  | 'collections'
  | 'expenses'
  | 'documents'

export type FinanceAuthorityTone = 'healthy' | 'active' | 'warning' | 'critical' | 'governed' | 'neutral'

export type FinanceAuthorityOperationKey =
  | 'finance.workspace.view'
  | 'finance.fee.create'
  | 'finance.fee.item.create'
  | 'finance.installment_plan.create'
  | 'finance.invoice.create'
  | 'finance.payment.confirm'
  | 'finance.discount.apply'
  | 'finance.reminder.create'
  | 'finance.dispute.open'
  | 'finance.reconciliation.session.open'
  | 'finance.period.create'
  | 'finance.document.template.publish'
  | 'finance.fee.version.publish'
  | 'finance.assignment.create'
  | 'finance.installment_plan.approve'
  | 'finance.billing_run.preview'
  | 'finance.billing_run.execute'
  | 'finance.invoice.issue'
  | 'finance.invoice.credit'
  | 'finance.invoice.cancel'
  | 'finance.payment.capture'
  | 'finance.payment.allocate'
  | 'finance.payment.reallocate'
  | 'finance.receipt.issue'
  | 'finance.refund.request'
  | 'finance.refund.approve'
  | 'finance.refund.execute'
  | 'finance.discount.request'
  | 'finance.discount.approve'
  | 'finance.collection_case.open'
  | 'finance.commitment.record'
  | 'finance.commitment.resolve'
  | 'finance.dispute.decide'
  | 'finance.statement.generate'
  | 'finance.expense.submit'
  | 'finance.expense.approve'
  | 'finance.expense.mark_paid'
  | 'finance.reconciliation.resolve'
  | 'finance.period.close'
  | 'finance.period.reopen'
  | 'finance.document.generate'
  | 'finance.report.execute'
  | 'finance.export.execute'
  | 'finance.approval.decide'

export type FinanceAuthorityPlane = {
  key: string
  label: string
  description: string
  scene: FinanceAuthorityScene
  permission?: string
  entitlementKey?: string
}

export type FinanceAuthorityMetric = {
  key: string
  label: string
  value: string
  detail: string
  tone: FinanceAuthorityTone
  href?: string | null
}

export type FinanceAuthorityRecord = {
  id: string
  code: string
  title: string
  subtitle: string
  status: string
  tone: FinanceAuthorityTone
  amount?: string | null
  date?: string | null
  owner?: string | null
  href?: string | null
  meta?: Record<string, string | number | boolean | null>
}

export type FinanceAuthoritySnapshot = {
  generatedAt: string
  schoolId: string
  schoolName: string
  academicYearId: string | null
  academicYearLabel: string | null
  currency: string
  scene: FinanceAuthorityScene
  permissions: string[]
  entitlementKeys: string[]
  metrics: FinanceAuthorityMetric[]
  records: Record<string, FinanceAuthorityRecord[]>
  aging: Array<{ bucket: string; amount: string; invoices: number; tone: FinanceAuthorityTone }>
  paymentMethods: Array<{ method: string; amount: string; count: number }>
  collectionPerformance: Array<{ label: string; value: number; target: number }>
  exceptions: FinanceAuthorityRecord[]
  period: {
    id: string | null
    label: string
    status: string
    blockers: number
  }
  system: {
    productAuthority: boolean
    sharedApprovalEngine: boolean
    sharedAudit: boolean
    notificationOutbox: boolean
    documentAuthority: boolean
    financialInvariants: boolean
  }
}

export type FinanceAuthorityCommandRequest = {
  operationKey: FinanceAuthorityOperationKey
  entityId?: string | null
  idempotencyKey?: string | null
  reason?: string | null
  payload?: Record<string, unknown>
}

export type FinanceAuthorityCommandResult = {
  ok: boolean
  state: 'completed' | 'approval_required' | 'rejected' | 'failed' | 'replayed'
  message: string
  operationKey: FinanceAuthorityOperationKey
  executionId?: string | null
  approvalId?: string | null
  entityId?: string | null
  result?: Record<string, unknown>
}
