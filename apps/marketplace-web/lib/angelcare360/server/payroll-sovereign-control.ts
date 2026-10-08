import { createClient } from '@/lib/supabase/server'
import { requireAngelcare360Permission } from '@/lib/angelcare360/server/context'
import { recordAngelcare360AuditEventServer } from '@/lib/angelcare360/server/audit'
import type {
  PayrollAdvance,
  PayrollAudit,
  PayrollBatch,
  PayrollIntegrity,
  PayrollLegacyRecord,
  PayrollMutationResult,
  PayrollPaymentItem,
  PayrollPeriod,
  PayrollReconciliation,
  PayrollResult,
  PayrollRun,
  PayrollSnapshot,
  PayrollStaffDirectoryEntry,
  PayrollVersion,
} from '@/types/angelcare360/payroll-sovereign-control'

type Row = Record<string, any>
const MODULE = 'payroll'

function s(value: unknown, fallback = '') {
  return value === null || value === undefined ? fallback : String(value)
}
function n(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}
function nullable(value: unknown) {
  const parsed = s(value).trim()
  return parsed ? parsed : null
}
function bool(value: unknown) {
  return value === true || value === 'true' || value === 1
}
function fullName(row: Row) {
  return s(row.full_name) || [s(row.first_name), s(row.last_name)].filter(Boolean).join(' ').trim() || s(row.staff_code, 'Personnel')
}
function nowIso() {
  return new Date().toISOString()
}

async function access(permission: string, schoolId?: string | null) {
  const ctx = await requireAngelcare360Permission(permission, { schoolId })
  if (!ctx.school) throw new Error('Aucun établissement actif.')
  return ctx
}

async function audit(schoolId: string, action: string, entityType: string, entityId: string, metadata?: Record<string, unknown>) {
  try {
    await recordAngelcare360AuditEventServer({
      category: 'payroll',
      module: MODULE,
      action,
      schoolId,
      entityType,
      entityId,
      severity: 'info',
      metadata,
    })
  } catch {}
}

async function rows(client: any, table: string, schoolId: string, order = 'created_at') {
  let query = client.from(table).select('*').eq('school_id', schoolId).range(0, 4999)
  if (order) query = query.order(order, { ascending: false })
  const { data, error } = await query
  if (error) throw new Error(`${table}: ${error.message}`)
  return (data || []) as Row[]
}

async function safeRows(client: any, table: string, schoolId: string, order = 'created_at') {
  try {
    return await rows(client, table, schoolId, order)
  } catch {
    return [] as Row[]
  }
}

function emptyIntegrity(message: string): PayrollIntegrity {
  return {
    installed: false,
    safeForOperations: false,
    criticalCount: 0,
    runPeriodMismatch: 0,
    resultReferenceMismatch: 0,
    inputReferenceMismatch: 0,
    paymentReferenceMismatch: 0,
    reconciliationMismatch: 0,
    finalizationMismatch: 0,
    message,
  }
}

async function loadIntegrity(client: any, schoolId: string) {
  const { data, error } = await client.rpc('angelcare360_payroll_integrity_status_v1', { p_school_id: schoolId })
  if (error || !data) return emptyIntegrity('Le garde-fou SANILA Payroll est indisponible. Les mutations souveraines restent verrouillées.')
  const row = (Array.isArray(data) ? data[0] : data) as Row
  return {
    installed: true,
    safeForOperations: bool(row.safeForOperations ?? row.safe_for_operations),
    criticalCount: n(row.criticalCount ?? row.critical_count),
    runPeriodMismatch: n(row.runPeriodMismatch ?? row.run_period_mismatch),
    resultReferenceMismatch: n(row.resultReferenceMismatch ?? row.result_reference_mismatch),
    inputReferenceMismatch: n(row.inputReferenceMismatch ?? row.input_reference_mismatch),
    paymentReferenceMismatch: n(row.paymentReferenceMismatch ?? row.payment_reference_mismatch),
    reconciliationMismatch: n(row.reconciliationMismatch ?? row.reconciliation_mismatch),
    finalizationMismatch: n(row.finalizationMismatch ?? row.finalization_mismatch),
    message: nullable(row.message) || undefined,
  } satisfies PayrollIntegrity
}

function versionRows(kind: PayrollVersion['kind'], data: Row[]): PayrollVersion[] {
  return data.map(row => ({
    id: s(row.id),
    kind,
    code: s(row.code),
    name: s(row.name || row.code),
    version: n(row.version_number, 1),
    status: s(row.status),
    effectiveFrom: s(row.effective_from),
    effectiveTo: nullable(row.effective_to),
    publishedAt: nullable(row.published_at),
  }))
}

export async function getPayrollSovereignSnapshot(options?: { schoolId?: string | null }): Promise<PayrollSnapshot> {
  const ctx = await access('payroll.view', options?.schoolId)
  const client = await createClient()
  const schoolId = ctx.school!.id

  const [periodRows, runRows, resultRows, inputRows, advanceRows, batchRows, paymentItemRows, reconciliationRows, calendarRows, policyRows, componentRows, exportRows, offcycleRows, settlementRows, payslipRows, legacyRows, staffRows, auditResponse] = await Promise.all([
    safeRows(client, 'angelcare360_payroll_periods', schoolId, 'starts_on'),
    safeRows(client, 'angelcare360_payroll_run_executions', schoolId),
    safeRows(client, 'angelcare360_payroll_employee_results', schoolId),
    safeRows(client, 'angelcare360_payroll_input_revisions', schoolId),
    safeRows(client, 'angelcare360_payroll_advances_sovereign', schoolId),
    safeRows(client, 'angelcare360_payroll_payment_batches', schoolId),
    safeRows(client, 'angelcare360_payroll_payment_items', schoolId),
    safeRows(client, 'angelcare360_payroll_reconciliation_sessions', schoolId),
    safeRows(client, 'angelcare360_payroll_calendar_versions', schoolId),
    safeRows(client, 'angelcare360_payroll_policy_versions', schoolId),
    safeRows(client, 'angelcare360_payroll_component_versions', schoolId),
    safeRows(client, 'angelcare360_payroll_controlled_exports', schoolId),
    safeRows(client, 'angelcare360_payroll_offcycle_runs', schoolId),
    safeRows(client, 'angelcare360_payroll_final_settlement_runs', schoolId),
    safeRows(client, 'angelcare360_payroll_payslip_versions', schoolId),
    safeRows(client, 'angelcare360_payroll_records', schoolId),
    safeRows(client, 'angelcare360_staff', schoolId, 'full_name'),
    client.from('angelcare360_audit_logs').select('id,action,entity_type,entity_id,severity,actor_role,created_at,metadata,module').eq('school_id', schoolId).in('module', ['payroll', 'paie']).order('created_at', { ascending: false }).limit(800),
  ])

  const staffMap = new Map<string, Row>(staffRows.map(row => [s(row.id), row] as [string, Row]))
  const periodMap = new Map<string, Row>(periodRows.map(row => [s(row.id), row] as [string, Row]))
  const resultMap = new Map<string, Row>(resultRows.map(row => [s(row.id), row] as [string, Row]))
  const countByRun = new Map<string, number>()
  const netByRun = new Map<string, number>()
  const exceptionByRun = new Map<string, number>()

  for (const row of resultRows) {
    const runId = s(row.payroll_run_id)
    countByRun.set(runId, (countByRun.get(runId) || 0) + 1)
    netByRun.set(runId, (netByRun.get(runId) || 0) + n(row.net_payable_minor))
    const calculation = row.calculation_json || {}
    const hasException = Array.isArray(calculation.exceptions) ? calculation.exceptions.length > 0 : Boolean(calculation.exception || calculation.blocker)
    if (hasException) exceptionByRun.set(runId, (exceptionByRun.get(runId) || 0) + 1)
  }

  const itemsByBatch = new Map<string, Row[]>()
  for (const row of paymentItemRows) {
    const batchId = s(row.payment_batch_id)
    itemsByBatch.set(batchId, [...(itemsByBatch.get(batchId) || []), row])
  }

  const integrity = await loadIntegrity(client, schoolId)
  const hasSovereign = runRows.length + resultRows.length + inputRows.length + batchRows.length + advanceRows.length > 0
  const authority = hasSovereign ? 'sovereign' : legacyRows.length ? 'legacy' : 'sovereign-ready'

  const periods: PayrollPeriod[] = periodRows.map(row => ({
    id: s(row.id),
    code: s(row.period_code),
    label: s(row.label),
    startsOn: s(row.starts_on),
    endsOn: s(row.ends_on),
    paymentDate: nullable(row.payment_date),
    status: s(row.status),
    inputCutoffAt: nullable(row.input_cutoff_at),
    finalizedAt: nullable(row.finalized_at),
  }))

  const runs: PayrollRun[] = runRows.map(row => ({
    id: s(row.id),
    periodId: s(row.payroll_period_id),
    periodCode: s(periodMap.get(s(row.payroll_period_id))?.period_code, '—'),
    runCode: s(row.run_code),
    runType: s(row.run_type),
    status: s(row.status),
    inputHash: s(row.input_hash),
    totals: (row.totals_json || {}) as Record<string, unknown>,
    startedAt: nullable(row.started_at),
    completedAt: nullable(row.completed_at),
    validatedAt: nullable(row.validated_at),
    approvedAt: nullable(row.approved_at),
    finalizedAt: nullable(row.finalized_at),
    resultCount: countByRun.get(s(row.id)) || 0,
    netMinor: netByRun.get(s(row.id)) || 0,
    exceptionCount: exceptionByRun.get(s(row.id)) || 0,
  }))

  const results: PayrollResult[] = resultRows.map(row => {
    const staff = staffMap.get(s(row.staff_id)) || {}
    return {
      id: s(row.id),
      runId: s(row.payroll_run_id),
      periodId: s(row.payroll_period_id),
      staffId: s(row.staff_id),
      staffCode: s(staff.staff_code, '—'),
      staffName: fullName(staff),
      baseMinor: n(row.base_minor),
      earningsMinor: n(row.earnings_minor),
      grossMinor: n(row.gross_minor),
      employeeContributionsMinor: n(row.employee_contributions_minor),
      employerContributionsMinor: n(row.employer_contributions_minor),
      deductionsMinor: n(row.deductions_minor),
      reimbursementsMinor: n(row.reimbursements_minor),
      netPayableMinor: n(row.net_payable_minor),
      employerCostMinor: n(row.employer_cost_minor),
      status: s(row.status),
      calculationHash: s(row.calculation_hash),
      finalizedAt: nullable(row.finalized_at),
      calculation: (row.calculation_json || {}) as Record<string, unknown>,
    }
  })

  const inputs = inputRows.map(row => {
    const staff = staffMap.get(s(row.staff_id)) || {}
    return {
      id: s(row.id), periodId: s(row.payroll_period_id), staffId: s(row.staff_id), staffCode: s(staff.staff_code, '—'), staffName: fullName(staff),
      componentCode: s(row.component_code), inputType: s(row.input_type), amountMinor: n(row.amount_minor), quantity: n(row.quantity, 1), currency: s(row.currency, 'MAD'),
      sourceType: s(row.source_type), status: s(row.status), approvedAt: nullable(row.approved_at), createdAt: s(row.created_at), evidence: (row.evidence_json || {}) as Record<string, unknown>,
    }
  })

  const advances: PayrollAdvance[] = advanceRows.map(row => {
    const staff = staffMap.get(s(row.staff_id)) || {}
    return {
      id: s(row.id), staffId: s(row.staff_id), staffCode: s(staff.staff_code, '—'), staffName: fullName(staff), advanceCode: s(row.advance_code),
      principalMinor: n(row.principal_minor), recoveredMinor: n(row.recovered_minor), remainingMinor: n(row.remaining_minor), installmentMinor: n(row.installment_minor), installmentCount: n(row.installment_count),
      recoveryStartPeriodId: nullable(row.recovery_start_period_id), status: s(row.status), reason: nullable(row.reason), approvedAt: nullable(row.approved_at), disbursedAt: nullable(row.disbursed_at),
    }
  })

  const batches: PayrollBatch[] = batchRows.map(row => {
    const batchItems = itemsByBatch.get(s(row.id)) || []
    return {
      id: s(row.id), runId: s(row.payroll_run_id), batchCode: s(row.batch_code), paymentMethod: s(row.payment_method), currency: s(row.currency, 'MAD'), paymentDate: s(row.payment_date),
      totalMinor: n(row.total_minor), status: s(row.status), approvedAt: nullable(row.approved_at), reconciledAt: nullable(row.reconciled_at), itemCount: batchItems.length,
      paidCount: batchItems.filter(item => s(item.status) === 'paid').length, failedCount: batchItems.filter(item => s(item.status) === 'failed').length,
      pendingCount: batchItems.filter(item => s(item.status) === 'pending').length, paidMinor: batchItems.filter(item => s(item.status) === 'paid').reduce((sum, item) => sum + n(item.amount_minor), 0),
    }
  })

  const paymentItems: PayrollPaymentItem[] = paymentItemRows.map(row => {
    const staff = staffMap.get(s(row.staff_id)) || {}
    return {
      id: s(row.id), batchId: s(row.payment_batch_id), resultId: s(row.payroll_employee_result_id), staffId: s(row.staff_id), staffName: fullName(staff), amountMinor: n(row.amount_minor),
      status: s(row.status), providerReference: nullable(row.provider_reference), paidAt: nullable(row.paid_at), failureReason: nullable(row.failure_reason),
    }
  })

  const reconciliations: PayrollReconciliation[] = reconciliationRows.map(row => ({
    id: s(row.id), batchId: s(row.payment_batch_id), batchCode: s(batchRows.find(batch => s(batch.id) === s(row.payment_batch_id))?.batch_code, '—'), status: s(row.status),
    expectedMinor: n(row.expected_minor), paidMinor: n(row.paid_minor), failedCount: n(row.failed_count), pendingCount: n(row.pending_count), resolvedAt: nullable(row.resolved_at), createdAt: s(row.created_at),
  }))

  const versions = [
    ...versionRows('calendar', calendarRows), ...versionRows('policy', policyRows), ...versionRows('component', componentRows),
    ...versionRows('export', exportRows), ...versionRows('offcycle', offcycleRows), ...versionRows('settlement', settlementRows),
  ]

  const payslips = payslipRows.map(row => ({
    id: s(row.id), runId: s(row.payroll_run_id), resultId: s(row.payroll_employee_result_id), staffId: s(row.staff_id), staffName: fullName(staffMap.get(s(row.staff_id)) || {}),
    version: n(row.version_number), versionCode: s(row.version_code), sourceSignature: s(row.source_signature), documentPath: s(row.document_path), status: s(row.status), generatedAt: nullable(row.generated_at), publishedAt: nullable(row.published_at),
  }))

  const legacyRecords: PayrollLegacyRecord[] = legacyRows.map(row => ({
    id: s(row.id), periodId: s(row.payroll_period_id), staffId: s(row.staff_id), staffName: fullName(staffMap.get(s(row.staff_id)) || {}), payrollNumber: s(row.payroll_number),
    baseSalary: n(row.base_salary), grossAmount: n(row.gross_amount), deductionsTotal: n(row.deductions_total), bonusesTotal: n(row.bonuses_total), netAmount: n(row.net_amount), paymentStatus: s(row.payment_status), status: s(row.status),
  }))

  const audits: PayrollAudit[] = ((auditResponse.data || []) as Row[]).map(row => ({
    id: s(row.id), action: s(row.action), entityType: nullable(row.entity_type), entityId: nullable(row.entity_id), severity: s(row.severity, 'info'), actorRole: nullable(row.actor_role), createdAt: s(row.created_at), metadata: row.metadata && typeof row.metadata === 'object' ? row.metadata as Record<string, unknown> : null,
  }))

  const staffDirectory: PayrollStaffDirectoryEntry[] = staffRows.map(row => ({
    id: s(row.id), staffCode: s(row.staff_code, '—'), name: fullName(row), department: nullable(row.department), staffType: nullable(row.staff_type), status: s(row.status, 'active'),
  }))

  const latestRun = runs[0]
  const relevantResults = latestRun ? results.filter(result => result.runId === latestRun.id) : results
  const staffIds = new Set(relevantResults.map(result => result.staffId))
  const pendingItems = paymentItems.filter(item => item.status === 'pending')

  return {
    schoolId,
    schoolName: ctx.school!.name,
    schoolCode: ctx.school!.school_code,
    generatedAt: nowIso(),
    authority,
    authorityReason: authority === 'sovereign'
      ? 'Autorité souveraine angelcare360_payroll_* déjà alimentée; les nouvelles écritures restent dans cette génération.'
      : authority === 'legacy'
        ? 'Données historiques présentes; aucune dual-write n’est autorisée. La souveraineté reste en lecture tant qu’un run souverain n’est pas établi.'
        : 'Autorité souveraine prête; aucune donnée historique ne sera copiée silencieusement.',
    integrity,
    staffDirectory,
    periods,
    runs,
    results,
    inputs,
    advances,
    batches,
    paymentItems,
    reconciliations,
    versions,
    payslips,
    legacyRecords,
    audits,
    metrics: {
      periods: periods.length,
      openPeriods: periods.filter(period => !['closed', 'cancelled', 'archived'].includes(period.status)).length,
      runs: runs.length,
      results: results.length,
      employees: staffIds.size,
      staffPopulation: staffDirectory.filter(staff => ['active', 'on_leave'].includes(staff.status)).length,
      netMinor: relevantResults.reduce((sum, result) => sum + result.netPayableMinor, 0),
      grossMinor: relevantResults.reduce((sum, result) => sum + result.grossMinor, 0),
      employerCostMinor: relevantResults.reduce((sum, result) => sum + result.employerCostMinor, 0),
      exceptions: latestRun ? latestRun.exceptionCount : 0,
      submittedInputs: inputs.filter(input => input.status === 'submitted').length,
      unapprovedInputs: inputs.filter(input => !['approved', 'rejected', 'archived'].includes(input.status)).length,
      advancesOpen: advances.filter(advance => !['settled', 'cancelled', 'archived'].includes(advance.status)).length,
      advanceRemainingMinor: advances.filter(advance => !['settled', 'cancelled', 'archived'].includes(advance.status)).reduce((sum, advance) => sum + advance.remainingMinor, 0),
      batchesOpen: batches.filter(batch => !['reconciled', 'cancelled', 'archived'].includes(batch.status)).length,
      pendingPayments: pendingItems.length,
      failedPayments: paymentItems.filter(item => item.status === 'failed').length,
      pendingPaymentMinor: pendingItems.reduce((sum, item) => sum + item.amountMinor, 0),
      unreconciledBatches: batches.filter(batch => batch.status !== 'reconciled').length,
    },
    capabilities: {
      calculationEngineProven: false,
      automaticBankTransfer: false,
      cnssAutomatic: false,
      taxAutomatic: false,
      payslipPdfEngineProven: false,
      controlledExportEngineProven: false,
      externalDeclarationSubmission: false,
    },
  }
}

async function guarded(schoolId?: string | null) {
  const ctx = await access('payroll.manage', schoolId)
  const client = await createClient()
  const integrity = await loadIntegrity(client, ctx.school!.id)
  if (!integrity.installed || !integrity.safeForOperations) return { ctx, client, integrity, locked: integrity.message || 'Garde-fou Payroll requis.' }
  return { ctx, client, integrity, locked: null as string | null }
}

function err(error: any): PayrollMutationResult {
  return { ok: false, error: error?.message || String(error || 'Erreur Paie') }
}

export async function payrollSovereignMutation(input: Record<string, unknown>): Promise<PayrollMutationResult> {
  const action = s(input.action)
  const schoolId = nullable(input.schoolId)
  const guardedContext = await guarded(schoolId)
  if (guardedContext.locked) return { ok: false, locked: true, error: guardedContext.locked }
  const sid = guardedContext.ctx.school!.id
  const actor = guardedContext.ctx.user?.id || null

  try {
    if (action === 'input.submit') {
      const { data, error } = await guardedContext.client.rpc('angelcare360_payroll_submit_input_v1', {
        p_school_id: sid, p_period_id: s(input.periodId), p_staff_id: s(input.staffId), p_component_code: s(input.componentCode), p_input_type: s(input.inputType),
        p_amount_minor: n(input.amountMinor), p_quantity: n(input.quantity, 1), p_source_type: s(input.sourceType, 'manual'),
        p_evidence: input.evidence && typeof input.evidence === 'object' ? input.evidence : {}, p_idempotency_key: s(input.idempotencyKey), p_actor_app_user_id: actor,
      })
      if (error) throw error
      const id = s(data?.inputId || data?.input_id)
      await audit(sid, 'payroll.input.submit', 'payroll_input_revision', id)
      return { ok: true, id, message: 'Élément de paie enregistré. Il reste soumis au workflow de décision.' }
    }
    if (action === 'input.approve') {
      const { data, error } = await guardedContext.client.rpc('angelcare360_payroll_approve_input_v1', {
        p_school_id: sid, p_input_id: s(input.inputId), p_decision: s(input.decision, 'approved'), p_actor_app_user_id: actor,
      })
      if (error) throw error
      await audit(sid, 'payroll.input.approve', 'payroll_input_revision', s(input.inputId), { decision: input.decision })
      return { ok: true, id: s(input.inputId), data: data || undefined, message: 'Décision sur l’élément enregistrée.' }
    }
    if (action === 'advance.create') {
      const { data, error } = await guardedContext.client.rpc('angelcare360_payroll_create_advance_v1', {
        p_school_id: sid, p_staff_id: s(input.staffId), p_advance_code: s(input.advanceCode), p_principal_minor: n(input.principalMinor),
        p_installment_minor: n(input.installmentMinor), p_installment_count: n(input.installmentCount), p_recovery_start_period_id: nullable(input.recoveryStartPeriodId),
        p_reason: nullable(input.reason), p_actor_app_user_id: actor,
      })
      if (error) throw error
      const id = s(data?.advanceId || data?.advance_id)
      await audit(sid, 'payroll.advance.create', 'payroll_advance', id)
      return { ok: true, id, message: 'Avance enregistrée à l’état demandé. Aucun décaissement automatique n’a été exécuté.' }
    }
    if (action === 'advance.transition') {
      const { error } = await guardedContext.client.rpc('angelcare360_payroll_transition_advance_v1', {
        p_school_id: sid, p_advance_id: s(input.advanceId), p_target_status: s(input.targetStatus), p_actor_app_user_id: actor,
      })
      if (error) throw error
      await audit(sid, 'payroll.advance.transition', 'payroll_advance', s(input.advanceId), { targetStatus: input.targetStatus })
      return { ok: true, id: s(input.advanceId), message: 'État de l’avance mis à jour selon l’autorité atomique.' }
    }
    if (action === 'run.transition') {
      const { error } = await guardedContext.client.rpc('angelcare360_payroll_transition_run_v1', {
        p_school_id: sid, p_run_id: s(input.runId), p_target_status: s(input.targetStatus), p_actor_app_user_id: actor,
      })
      if (error) throw error
      await audit(sid, 'payroll.run.transition', 'payroll_run', s(input.runId), { targetStatus: input.targetStatus })
      return { ok: true, id: s(input.runId), message: 'Étape de gouvernance validée. Le serveur reste l’autorité de transition.' }
    }
    if (action === 'payment.batch.create') {
      const { data, error } = await guardedContext.client.rpc('angelcare360_payroll_create_payment_batch_v1', {
        p_school_id: sid, p_run_id: s(input.runId), p_batch_code: s(input.batchCode), p_payment_method: s(input.paymentMethod, 'manual'),
        p_payment_date: s(input.paymentDate), p_actor_app_user_id: actor,
      })
      if (error) throw error
      const id = s(data?.batchId || data?.batch_id)
      await audit(sid, 'payroll.payment_batch.create', 'payroll_payment_batch', id)
      return { ok: true, id, data: data || undefined, message: 'Lot de paiement préparé. Aucun virement bancaire automatique n’a été exécuté.' }
    }
    if (action === 'payment.item.transition') {
      const targetStatus = s(input.targetStatus)
      if (targetStatus === 'paid' && !nullable(input.providerReference)) {
        return { ok: false, error: 'Une référence de confirmation est requise avant de marquer un paiement comme payé.' }
      }
      const { error } = await guardedContext.client.rpc('angelcare360_payroll_transition_payment_item_v1', {
        p_school_id: sid, p_payment_item_id: s(input.paymentItemId), p_target_status: targetStatus,
        p_provider_reference: nullable(input.providerReference), p_failure_reason: nullable(input.failureReason), p_actor_app_user_id: actor,
      })
      if (error) throw error
      await audit(sid, 'payroll.payment_item.transition', 'payroll_payment_item', s(input.paymentItemId), { targetStatus, confirmationMode: 'operator_recorded' })
      return { ok: true, id: s(input.paymentItemId), message: targetStatus === 'paid' ? 'Paiement marqué payé sur confirmation opérateur enregistrée. Aucune confirmation bancaire automatique n’est revendiquée.' : 'Échec de paiement enregistré.' }
    }
    if (action === 'payment.batch.reconcile') {
      const { data, error } = await guardedContext.client.rpc('angelcare360_payroll_reconcile_batch_v1', {
        p_school_id: sid, p_payment_batch_id: s(input.batchId), p_actor_app_user_id: actor,
      })
      if (error) throw error
      const id = s(data?.reconciliationId || data?.reconciliation_id)
      await audit(sid, 'payroll.payment_batch.reconcile', 'payroll_payment_batch', s(input.batchId))
      return { ok: true, id, data: data || undefined, message: 'Réconciliation enregistrée après vérification atomique attendu/payé/pending/échecs.' }
    }
    return { ok: false, error: 'Action Payroll non reconnue.' }
  } catch (error) {
    return err(error)
  }
}
