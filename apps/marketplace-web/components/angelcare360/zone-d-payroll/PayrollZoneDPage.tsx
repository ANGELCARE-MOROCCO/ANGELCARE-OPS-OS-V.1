import {
  getAngelcare360PayrollComplianceReadiness,
  getAngelcare360PayrollOverview,
  getAngelcare360PayrollPeriodById,
  getAngelcare360PayrollRecordById,
  listAngelcare360PayrollAdjustments,
  listAngelcare360PayrollAdvances,
  listAngelcare360PayrollAuditEvents,
  listAngelcare360PayrollBonuses,
  listAngelcare360PayrollDeductions,
  listAngelcare360PayrollItems,
  listAngelcare360PayrollPeriods,
  listAngelcare360PayrollRecords,
  listAngelcare360PayrollReimbursements,
  listAngelcare360StaffPayrollHistory,
} from '@/lib/angelcare360/server/payroll'
import { getPayrollSovereignSnapshot } from '@/lib/angelcare360/server/payroll-sovereign'
import type { PayrollRecord } from '@/types/angelcare360/payroll-sovereign'
import PayrollZoneDWorkspace, { type PayrollZoneDData, type PayrollZoneDMode } from './PayrollZoneDWorkspace'

type Props = { mode: PayrollZoneDMode; entityId?: string | null }

export default async function PayrollZoneDPage({ mode, entityId }: Props) {
  const data: PayrollZoneDData = { mode, entityId: entityId || null }

  if (mode === 'command') {
    const [overview, periods, records] = await Promise.all([
      getAngelcare360PayrollOverview(),
      listAngelcare360PayrollPeriods(),
      listAngelcare360PayrollRecords(),
    ])
    data.overview = overview
    data.periods = periods
    data.records = records
  } else if (mode === 'periods') {
    const [overview, periods] = await Promise.all([getAngelcare360PayrollOverview(), listAngelcare360PayrollPeriods()])
    data.overview = overview
    data.periods = periods
  } else if (mode === 'period-detail' && entityId) {
    data.period = await getAngelcare360PayrollPeriodById(entityId)
  } else if (mode === 'records') {
    const [records, workforce] = await Promise.all([
      listAngelcare360PayrollRecords(),
      getPayrollSovereignSnapshot('workforce'),
    ])
    data.records = records
    data.staffOptions = (workforce?.records.staff || []) as PayrollRecord[]
    data.periods = await listAngelcare360PayrollPeriods()
  } else if (mode === 'record-detail' && entityId) {
    data.record = await getAngelcare360PayrollRecordById(entityId)
  } else if (mode === 'items') {
    data.items = await listAngelcare360PayrollItems()
    data.records = await listAngelcare360PayrollRecords()
  } else if (mode === 'bonuses') {
    data.items = await listAngelcare360PayrollBonuses()
    data.records = await listAngelcare360PayrollRecords()
  } else if (mode === 'deductions') {
    data.items = await listAngelcare360PayrollDeductions()
    data.records = await listAngelcare360PayrollRecords()
  } else if (mode === 'advances') {
    data.items = await listAngelcare360PayrollAdvances()
    data.records = await listAngelcare360PayrollRecords()
  } else if (mode === 'adjustments') {
    data.items = await listAngelcare360PayrollAdjustments()
    data.records = await listAngelcare360PayrollRecords()
  } else if (mode === 'reimbursements') {
    data.items = await listAngelcare360PayrollReimbursements()
    data.records = await listAngelcare360PayrollRecords()
  } else if (mode === 'validation') {
    const [overview, records, compliance] = await Promise.all([
      getAngelcare360PayrollOverview(),
      listAngelcare360PayrollRecords(),
      getAngelcare360PayrollComplianceReadiness(),
    ])
    data.overview = overview
    data.records = records
    data.compliance = compliance
  } else if (mode === 'payments') {
    data.records = await listAngelcare360PayrollRecords()
  } else if (mode === 'history') {
    data.records = await listAngelcare360StaffPayrollHistory()
  } else if (mode === 'compliance') {
    const [compliance, overview] = await Promise.all([getAngelcare360PayrollComplianceReadiness(), getAngelcare360PayrollOverview()])
    data.compliance = compliance
    data.overview = overview
  } else if (mode === 'audit') {
    data.audit = await listAngelcare360PayrollAuditEvents()
  }

  return <PayrollZoneDWorkspace data={data} />
}
