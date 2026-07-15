import { notFound } from 'next/navigation'
import Angelcare360OperatorActionDrawer from '@/components/angelcare360/operator/Angelcare360OperatorActionDrawer'
import Angelcare360OperatorDataTable from '@/components/angelcare360/operator/Angelcare360OperatorDataTable'
import Angelcare360OperatorPageShell from '@/components/angelcare360/operator/Angelcare360OperatorPageShell'
import Angelcare360OperatorStatusBadge from '@/components/angelcare360/operator/Angelcare360OperatorStatusBadge'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'
import { listOperatorClients } from '@/lib/angelcare360/operator/clients'
import { listOperatorSubscriptions } from '@/lib/angelcare360/operator/subscriptions'
import { listOperatorRenewals } from '@/lib/angelcare360/operator/renewals'

export const dynamic = 'force-dynamic'

export default async function Angelcare360OperatorRenewalsPage() {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()

  const [renewals, clients, subscriptions] = await Promise.all([listOperatorRenewals(), listOperatorClients(), listOperatorSubscriptions()])
  const renewalOptions = renewals.map((renewal) => ({ label: `${String(renewal.renewal_date || renewal.id)} · ${String(renewal.status || '—')}`, value: String(renewal.id) }))
  const clientOptions = clients.map((client) => ({ label: `${String(client.display_name || 'Client')} · ${String(client.client_code || client.id)}`, value: String(client.id) }))
  const subscriptionOptions = subscriptions.map((subscription) => ({ label: `${String(subscription.subscription_code || subscription.id)} · ${String(subscription.status || '—')}`, value: String(subscription.id) }))

  return (
    <Angelcare360OperatorPageShell
      badge="Renouvellements"
      statusLabel={`${renewals.length} renouvellement(s)`}
      title="Renouvellements"
      subtitle="Pipeline de renouvellement, probabilité et montant attendu par client."
    >
      <Angelcare360OperatorActionDrawer
        title="Actions renouvellements"
        subtitle="Créer, mettre à jour et qualifier le pipeline de renouvellement."
        actions={[
          {
            id: 'create-renewal',
            label: 'Créer renouvellement',
            endpoint: '/api/angelcare360/operator/renewals',
            operation: 'create',
            submitLabel: 'Créer',
            successMessage: 'Renouvellement créé.',
            fields: [
              { name: 'clientId', label: 'Client', kind: 'select', required: true, options: clientOptions },
              { name: 'subscriptionId', label: 'Abonnement', kind: 'select', options: subscriptionOptions },
              { name: 'renewalDate', label: 'Date de renouvellement', kind: 'date', required: true },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'À venir', value: 'upcoming' }, { label: 'En discussion', value: 'in_discussion' }, { label: 'Proposition envoyée', value: 'proposal_sent' }, { label: 'Renouvelé', value: 'renewed' }, { label: 'À risque', value: 'at_risk' }, { label: 'Perdu', value: 'lost' }, { label: 'Annulé', value: 'cancelled' }] },
              { name: 'probability', label: 'Probabilité', kind: 'number' },
              { name: 'expectedAmountMad', label: 'Montant attendu MAD', kind: 'number' },
              { name: 'ownerId', label: 'Responsable', kind: 'text' },
              { name: 'notes', label: 'Notes', kind: 'textarea', rows: 3 },
            ],
          },
          {
            id: 'change-status',
            label: 'Changer statut',
            endpoint: '/api/angelcare360/operator/renewals',
            operation: 'status',
            submitLabel: 'Mettre à jour',
            successMessage: 'Statut renouvellement mis à jour.',
            fields: [
              { name: 'id', label: 'Renouvellement', kind: 'select', required: true, options: renewalOptions },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'À venir', value: 'upcoming' }, { label: 'En discussion', value: 'in_discussion' }, { label: 'Proposition envoyée', value: 'proposal_sent' }, { label: 'Renouvelé', value: 'renewed' }, { label: 'À risque', value: 'at_risk' }, { label: 'Perdu', value: 'lost' }, { label: 'Annulé', value: 'cancelled' }] },
            ],
          },
        ]}
      />
      <Angelcare360OperatorDataTable
        title="Pipeline de renouvellement"
        rows={renewals}
        emptyTitle="Aucun renouvellement"
        emptyDescription="Les renouvellements à suivre apparaîtront ici."
        rowKey={(row) => String((row as Record<string, unknown>).id)}
        columns={[
          { key: 'client_id', label: 'Client', render: (row) => String((row as Record<string, unknown>).client_id || '—') },
          { key: 'renewal_date', label: 'Date', render: (row) => String((row as Record<string, unknown>).renewal_date || '—') },
          { key: 'status', label: 'Statut', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).status || '—')} /> },
          { key: 'probability', label: 'Probabilité', render: (row) => `${String((row as Record<string, unknown>).probability ?? '—')}%` },
          { key: 'expected_amount_mad', label: 'Montant attendu', align: 'right', render: (row) => `${Number((row as Record<string, unknown>).expected_amount_mad || 0).toLocaleString('fr-FR')} MAD` },
        ]}
      />
    </Angelcare360OperatorPageShell>
  )
}
