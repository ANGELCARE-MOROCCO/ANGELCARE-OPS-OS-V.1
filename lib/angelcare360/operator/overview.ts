import { getOperatorCustomerHealthDashboard } from './health'
import { listOperatorServiceEvents } from './service'
import { requireAngelcare360OperatorPermission } from './access'
import { safeCount, safeList, summarizeMoney } from './shared'
import type { Angelcare360OperatorOverviewRecord } from '@/types/angelcare360/operator'
import type { Angelcare360AuditRecord } from '@/types/angelcare360/audit'

export async function getOperatorOverview(): Promise<Angelcare360OperatorOverviewRecord> {
  await requireAngelcare360OperatorPermission('operator.audit.view')
  const [
    totalClients,
    activeClients,
    pilotClients,
    atRiskClients,
    suspendedClients,
    activeSubscriptions,
    overdueInvoices,
    openSupportTickets,
    urgentSupportTickets,
    blockedOnboardingTasks,
    upcomingRenewals,
    modulesRequiringConfiguration,
    featureFlagsLocked,
    subscriptions,
    invoices,
    recentAuditEvents,
  ] = await Promise.all([
    safeCount('angelcare360_operator_clients'),
    safeCount('angelcare360_operator_clients', [['status', 'eq', 'active']]),
    safeCount('angelcare360_operator_clients', [['status', 'eq', 'pilot']]),
    safeCount('angelcare360_operator_clients', [['lifecycle_stage', 'eq', 'at_risk']]),
    safeCount('angelcare360_operator_clients', [['status', 'eq', 'suspended']]),
    safeCount('angelcare360_operator_subscriptions', [['status', 'eq', 'active']]),
    safeCount('angelcare360_operator_invoices', [['status', 'eq', 'overdue']]),
    safeCount('angelcare360_operator_support_tickets', [['status', 'in', ['new', 'triage', 'assigned', 'waiting_client', 'waiting_internal']]]),
    safeCount('angelcare360_operator_support_tickets', [['priority', 'eq', 'urgent'], ['status', 'in', ['new', 'triage', 'assigned', 'waiting_client', 'waiting_internal']]]),
    safeCount('angelcare360_operator_onboarding_tasks', [['status', 'in', ['todo', 'blocked', 'in_progress']]]),
    safeCount('angelcare360_operator_renewals', [['status', 'in', ['upcoming', 'in_discussion', 'proposal_sent', 'at_risk']]]),
    safeCount('angelcare360_operator_feature_flags', [['status', 'eq', 'requires_configuration']]),
    safeCount('angelcare360_operator_feature_flags', [['status', 'eq', 'locked']]),
    safeList('angelcare360_operator_subscriptions', '*', [['status', 'eq', 'active']]),
    safeList('angelcare360_operator_invoices', '*', [['status', 'in', ['issued', 'partially_paid', 'overdue']]]),
    safeList('angelcare360_operator_audit_logs', '*', [], ['created_at', { ascending: false }]),
  ])

  const subscriptionRows = subscriptions as Array<Record<string, unknown>>
  const invoiceRows = invoices as Array<Record<string, unknown>>
  const auditRows = recentAuditEvents as Angelcare360AuditRecord[]
  const mrrEstimateMad = summarizeMoney(subscriptionRows.map((item) => item.billing_amount_mad))
  const arrEstimateMad = mrrEstimateMad * 12
  const unpaidBalanceMad = summarizeMoney(invoiceRows.map((item) => item.balance_due_mad))

  return {
    totalClients,
    activeClients,
    pilotClients,
    atRiskClients,
    suspendedClients,
    activeSubscriptions,
    mrrEstimateMad,
    arrEstimateMad,
    overdueInvoices,
    unpaidBalanceMad,
    openSupportTickets,
    urgentSupportTickets,
    blockedOnboardingTasks,
    upcomingRenewals,
    modulesRequiringConfiguration,
    featureFlagsLocked,
    customerHealth: await getOperatorCustomerHealthDashboard(),
    recentServiceEvents: await listOperatorServiceEvents(),
    recentAuditEvents: auditRows,
    quickActions: [
      { label: 'Nouveau client', href: '/angelcare-360-operator/clients' },
      { label: 'Créer abonnement', href: '/angelcare-360-operator/subscriptions' },
      { label: 'Émettre facture', href: '/angelcare-360-operator/billing/invoices' },
      { label: 'Enregistrer paiement', href: '/angelcare-360-operator/billing/payments' },
      { label: 'Ouvrir ticket support', href: '/angelcare-360-operator/support' },
      { label: 'Planifier onboarding', href: '/angelcare-360-operator/onboarding' },
      { label: 'Activer module', href: '/angelcare-360-operator/features' },
      { label: 'Voir audit', href: '/angelcare-360-operator/audit' },
    ],
  }
}
