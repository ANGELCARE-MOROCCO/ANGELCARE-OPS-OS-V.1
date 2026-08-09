import type { ContractPaymentCase, ContractReleaseGate, EnforcementRisk } from '@/types/sales/contract-payment'

export function calculatePaymentCompletion(amountDue: number, amountPaid: number): number {
  if (!amountDue || amountDue <= 0) return 0
  return Math.min(100, Math.round((amountPaid / amountDue) * 100))
}

export function evaluateEnforcementRisk(item: ContractPaymentCase): EnforcementRisk {
  const completion = calculatePaymentCompletion(item.amount_due, item.amount_paid)
  const deadline = item.deadline_at ? new Date(item.deadline_at).getTime() : null
  const now = Date.now()

  if (item.contract_status !== 'signed' && item.payment_status !== 'payment_confirmed') return 'critical'
  if (deadline && deadline < now && completion < 100) return 'critical'
  if (completion < 30) return 'high'
  if (completion < 100) return 'medium'
  return 'low'
}

export function evaluateReleaseGate(gate: Omit<ContractReleaseGate, 'release_allowed'>): ContractReleaseGate {
  const release_allowed =
    gate.manager_override ||
    (gate.contract_signed && gate.payment_confirmed && gate.documents_verified)

  return { ...gate, release_allowed }
}

export function getContractPaymentNextAction(item: ContractPaymentCase): string {
  if (item.contract_status !== 'signed') return 'Secure contract signature before activation release.'
  if (item.amount_paid < item.amount_due) return 'Apply payment enforcement sequence and confirm collection.'
  if (item.risk === 'critical') return 'Escalate to manager and block release until resolved.'
  return 'Release deal to activation with sales assurance note.'
}
