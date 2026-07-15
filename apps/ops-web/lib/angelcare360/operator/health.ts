import { requireAngelcare360OperatorPermission } from './access'
import { writeOperatorAuditLog } from './audit'
import {
  operatorServiceEventCreateSchema,
} from './validation'
import { safeCount } from './shared'
import type {
  Angelcare360OperatorHealthDashboard,
  Angelcare360OperatorServiceEventRecord,
} from '@/types/angelcare360/operator'

export async function getOperatorCustomerHealthDashboard(): Promise<Angelcare360OperatorHealthDashboard> {
  await requireAngelcare360OperatorPermission('operator.audit.view').catch(() => null)

  const [
    activeSubscriptions,
    overdueInvoices,
    openUrgentSupport,
    blockedOnboarding,
    unresolvedIncidents,
    atRiskClients,
  ] = await Promise.all([
    safeCount('angelcare360_operator_subscriptions', [['status', 'eq', 'active']]),
    safeCount('angelcare360_operator_invoices', [['status', 'eq', 'overdue']]),
    safeCount('angelcare360_operator_support_tickets', [['priority', 'eq', 'urgent'], ['status', 'in', ['new', 'triage', 'assigned', 'waiting_client', 'waiting_internal']]]),
    safeCount('angelcare360_operator_onboarding_tasks', [['status', 'in', ['todo', 'blocked', 'in_progress']]]),
    safeCount('angelcare360_operator_incidents', [['status', 'in', ['open', 'investigating', 'mitigated']]]),
    safeCount('angelcare360_operator_clients', [['lifecycle_stage', 'eq', 'at_risk']]),
  ])

  const factors = [
    {
      label: 'Abonnements actifs',
      status: activeSubscriptions > 0 ? 'good' : 'warning',
      value: activeSubscriptions,
      detail: activeSubscriptions > 0 ? 'Base facturable détectée.' : 'Aucun abonnement actif détecté.',
    },
    {
      label: 'Factures en retard',
      status: overdueInvoices === 0 ? 'good' : overdueInvoices < 5 ? 'warning' : 'critical',
      value: overdueInvoices,
      detail: overdueInvoices === 0 ? 'Aucun impayé détecté.' : 'Suivi de recouvrement requis.',
    },
    {
      label: 'Support urgent',
      status: openUrgentSupport === 0 ? 'good' : 'warning',
      value: openUrgentSupport,
      detail: openUrgentSupport === 0 ? 'Aucun ticket urgent ouvert.' : 'Escalade recommandée.',
    },
    {
      label: 'Onboarding bloqué',
      status: blockedOnboarding === 0 ? 'good' : 'warning',
      value: blockedOnboarding,
      detail: blockedOnboarding === 0 ? 'Aucune tâche bloquée.' : 'L’implémentation nécessite un suivi.',
    },
    {
      label: 'Incidents ouverts',
      status: unresolvedIncidents === 0 ? 'good' : 'critical',
      value: unresolvedIncidents,
      detail: unresolvedIncidents === 0 ? 'Aucun incident ouvert.' : 'Incident opérationnel à traiter.',
    },
    {
      label: 'Clients à risque',
      status: atRiskClients === 0 ? 'good' : 'warning',
      value: atRiskClients,
      detail: atRiskClients === 0 ? 'Aucun client explicitement à risque.' : 'Pipeline de renouvellement à surveiller.',
    },
  ] satisfies Angelcare360OperatorHealthDashboard['factors']

  const riskScore = Math.max(0, 100 - overdueInvoices * 14 - openUrgentSupport * 10 - blockedOnboarding * 5 - unresolvedIncidents * 15 - atRiskClients * 8)

  return {
    scoreLabel: 'Score opérationnel indicatif',
    scoreValue: Number.isFinite(riskScore) ? riskScore : null,
    factors,
    summary: 'Score calculé uniquement à partir de signaux réels: abonnements, factures, support, onboarding et incidents.',
  }
}

export async function createOperatorServiceEvent(input: unknown) {
  const parsed = operatorServiceEventCreateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.errors[0]?.message || 'Les données de l’événement sont invalides.' }
  }

  const session = await requireAngelcare360OperatorPermission('operator.service.update')
  const supabase = await (await import('./shared')).getOperatorClient()
  const payload = {
    client_id: parsed.data.clientId || null,
    tenant_id: parsed.data.tenantId || null,
    event_type: parsed.data.eventType,
    severity: parsed.data.severity,
    title: parsed.data.title,
    description: parsed.data.description || null,
    status: parsed.data.status,
    occurred_at: parsed.data.occurredAt || new Date().toISOString(),
  }

  const { data, error } = await supabase.from('angelcare360_operator_service_events').insert(payload).select('*').single()
  if (error) return { ok: false, error: error.message }

  await writeOperatorAuditLog({
    module: 'service',
    action: 'service_event.created',
    entityType: 'angelcare360_operator_service_events',
    entityId: String(data.id),
    clientId: parsed.data.clientId || null,
    tenantId: parsed.data.tenantId || null,
    severity: parsed.data.severity === 'critical' ? 'critical' : 'notice',
    afterData: payload,
    metadata: { operator_role: session.operatorRole },
  })

  return { ok: true, record: data as Angelcare360OperatorServiceEventRecord }
}
