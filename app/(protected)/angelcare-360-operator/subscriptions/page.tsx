import Link from 'next/link'
import { notFound } from 'next/navigation'
import Angelcare360OperatorActionDrawer from '@/components/angelcare360/operator/Angelcare360OperatorActionDrawer'
import Angelcare360OperatorDataTable from '@/components/angelcare360/operator/Angelcare360OperatorDataTable'
import Angelcare360OperatorPageShell from '@/components/angelcare360/operator/Angelcare360OperatorPageShell'
import Angelcare360OperatorStatusBadge from '@/components/angelcare360/operator/Angelcare360OperatorStatusBadge'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'
import { listOperatorClients } from '@/lib/angelcare360/operator/clients'
import { listOperatorPlans } from '@/lib/angelcare360/operator/plans'
import { listOperatorSubscriptions } from '@/lib/angelcare360/operator/subscriptions'
import { listOperatorTenants } from '@/lib/angelcare360/operator/tenants'

export const dynamic = 'force-dynamic'

export default async function Angelcare360OperatorSubscriptionsPage() {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()

  const [subscriptions, plans, clients, tenants] = await Promise.all([
    listOperatorSubscriptions(),
    listOperatorPlans(),
    listOperatorClients(),
    listOperatorTenants(),
  ])

  const subscriptionOptions = subscriptions.map((subscription) => ({
    label: `${String(subscription.subscription_code || subscription.id)} · ${String(subscription.status || '—')}`,
    value: String(subscription.id),
  }))
  const clientOptions = clients.map((client) => ({
    label: `${String(client.display_name || 'Client')} · ${String(client.client_code || client.id)}`,
    value: String(client.id),
  }))
  const tenantOptions = tenants.map((tenant) => ({
    label: `${String(tenant.tenant_slug || tenant.id)} · ${String(tenant.status || '—')}`,
    value: String(tenant.id),
  }))
  const planOptions = plans.map((plan) => ({
    label: `${String(plan.name || 'Plan')} · ${String(plan.plan_code || plan.id)}`,
    value: String(plan.id),
  }))

  const planNameById = new Map(plans.map((plan) => [plan.id, plan.name]))

  return (
    <Angelcare360OperatorPageShell
      badge="Abonnements"
      statusLabel={`${subscriptions.length} abonnement(s)`}
      title="Abonnements clients"
      subtitle="Cycle de facturation, statut contractuel et pilotage des abonnements SaaS AngelCare."
      primaryAction={<Link href="/angelcare-360-operator/plans" style={linkStyle}>Voir les plans</Link>}
    >
      <Angelcare360OperatorActionDrawer
        title="Actions abonnements"
        subtitle="Créer, modifier, suspendre ou annuler les abonnements clients."
        actions={[
          {
            id: 'create-subscription',
            label: 'Créer abonnement',
            endpoint: '/api/angelcare360/operator/subscriptions',
            operation: 'create',
            submitLabel: 'Créer',
            successMessage: 'Abonnement créé.',
            fields: [
              { name: 'clientId', label: 'Client', kind: 'select', required: true, options: clientOptions },
              { name: 'tenantId', label: 'Tenant', kind: 'select', options: tenantOptions },
              { name: 'planId', label: 'Plan', kind: 'select', required: true, options: planOptions },
              { name: 'subscriptionCode', label: 'Code abonnement', kind: 'text', required: true },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'Essai', value: 'trial' }, { label: 'Actif', value: 'active' }, { label: 'En retard', value: 'past_due' }, { label: 'Suspendu', value: 'suspended' }, { label: 'Annulé', value: 'cancelled' }, { label: 'Expiré', value: 'expired' }, { label: 'Archivé', value: 'archived' }] },
              { name: 'startDate', label: 'Date de début', kind: 'date', required: true },
              { name: 'trialEndsAt', label: 'Fin d’essai', kind: 'date' },
              { name: 'currentPeriodStart', label: 'Début période', kind: 'date' },
              { name: 'currentPeriodEnd', label: 'Fin période', kind: 'date' },
              { name: 'billingCycle', label: 'Cycle', kind: 'text', required: true, placeholder: 'monthly' },
              { name: 'billingAmountMad', label: 'Montant MAD', kind: 'number', required: true },
              { name: 'discountAmountMad', label: 'Remise MAD', kind: 'number' },
              { name: 'cancellationReason', label: 'Motif annulation', kind: 'textarea', rows: 2 },
              { name: 'suspendedReason', label: 'Motif suspension', kind: 'textarea', rows: 2 },
            ],
          },
          {
            id: 'update-subscription',
            label: 'Modifier abonnement',
            endpoint: '/api/angelcare360/operator/subscriptions',
            operation: 'update',
            submitLabel: 'Mettre à jour',
            successMessage: 'Abonnement mis à jour.',
            fields: [
              { name: 'id', label: 'Abonnement', kind: 'select', required: true, options: subscriptionOptions },
              { name: 'clientId', label: 'Client', kind: 'select', required: true, options: clientOptions },
              { name: 'tenantId', label: 'Tenant', kind: 'select', options: tenantOptions },
              { name: 'planId', label: 'Plan', kind: 'select', required: true, options: planOptions },
              { name: 'subscriptionCode', label: 'Code abonnement', kind: 'text', required: true },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'Essai', value: 'trial' }, { label: 'Actif', value: 'active' }, { label: 'En retard', value: 'past_due' }, { label: 'Suspendu', value: 'suspended' }, { label: 'Annulé', value: 'cancelled' }, { label: 'Expiré', value: 'expired' }, { label: 'Archivé', value: 'archived' }] },
              { name: 'startDate', label: 'Date de début', kind: 'date', required: true },
              { name: 'trialEndsAt', label: 'Fin d’essai', kind: 'date' },
              { name: 'currentPeriodStart', label: 'Début période', kind: 'date' },
              { name: 'currentPeriodEnd', label: 'Fin période', kind: 'date' },
              { name: 'billingCycle', label: 'Cycle', kind: 'text', required: true, placeholder: 'monthly' },
              { name: 'billingAmountMad', label: 'Montant MAD', kind: 'number', required: true },
              { name: 'discountAmountMad', label: 'Remise MAD', kind: 'number' },
              { name: 'cancellationReason', label: 'Motif annulation', kind: 'textarea', rows: 2 },
              { name: 'suspendedReason', label: 'Motif suspension', kind: 'textarea', rows: 2 },
            ],
          },
          {
            id: 'change-status',
            label: 'Changer statut',
            endpoint: '/api/angelcare360/operator/subscriptions',
            operation: 'status',
            submitLabel: 'Appliquer',
            successMessage: 'Statut abonnement mis à jour.',
            fields: [
              { name: 'id', label: 'Abonnement', kind: 'select', required: true, options: subscriptionOptions },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'Essai', value: 'trial' }, { label: 'Actif', value: 'active' }, { label: 'En retard', value: 'past_due' }, { label: 'Suspendu', value: 'suspended' }, { label: 'Annulé', value: 'cancelled' }, { label: 'Expiré', value: 'expired' }, { label: 'Archivé', value: 'archived' }] },
              { name: 'reason', label: 'Motif', kind: 'textarea', rows: 3 },
            ],
          },
          {
            id: 'cancel-subscription',
            label: 'Annuler abonnement',
            endpoint: '/api/angelcare360/operator/subscriptions',
            operation: 'cancel',
            tone: 'danger',
            submitLabel: 'Annuler',
            successMessage: 'Abonnement annulé.',
            confirmTitle: 'Annulation d’abonnement',
            confirmMessage: 'L’annulation conserve l’historique mais retire l’abonnement du cycle actif.',
            fields: [
              { name: 'id', label: 'Abonnement', kind: 'select', required: true, options: subscriptionOptions },
              { name: 'reason', label: 'Motif', kind: 'textarea', rows: 3, required: true },
            ],
          },
        ]}
      />
      <Angelcare360OperatorDataTable
        title="Cycle des abonnements"
        description="Lecture opérationnelle des abonnements actifs, en essai, en retard ou suspendus."
        rows={subscriptions}
        emptyTitle="Aucun abonnement"
        emptyDescription="Les abonnements SaaS des clients apparaîtront ici."
        rowKey={(row) => String((row as Record<string, unknown>).id)}
        columns={[
          { key: 'subscription_code', label: 'Abonnement', render: (row) => String((row as Record<string, unknown>).subscription_code || '—') },
          { key: 'client_id', label: 'Client', render: (row) => String((row as Record<string, unknown>).client_id || '—') },
          { key: 'plan_id', label: 'Plan', render: (row) => planNameById.get(String((row as Record<string, unknown>).plan_id || '')) || '—' },
          { key: 'status', label: 'Statut', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).status || '—')} /> },
          { key: 'billing_cycle', label: 'Périodicité', render: (row) => String((row as Record<string, unknown>).billing_cycle || '—') },
          { key: 'billing_amount_mad', label: 'Montant', render: (row) => `${Number((row as Record<string, unknown>).billing_amount_mad || 0).toLocaleString('fr-FR')} MAD`, align: 'right' },
        ]}
      />
    </Angelcare360OperatorPageShell>
  )
}

const linkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 14,
  background: '#0f172a',
  color: '#fff',
  textDecoration: 'none',
  padding: '10px 14px',
  fontWeight: 800,
}
