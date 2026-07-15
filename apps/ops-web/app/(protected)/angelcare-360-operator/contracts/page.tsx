import { notFound } from 'next/navigation'
import Angelcare360OperatorActionDrawer from '@/components/angelcare360/operator/Angelcare360OperatorActionDrawer'
import Angelcare360OperatorDataTable from '@/components/angelcare360/operator/Angelcare360OperatorDataTable'
import Angelcare360OperatorPageShell from '@/components/angelcare360/operator/Angelcare360OperatorPageShell'
import Angelcare360OperatorStatusBadge from '@/components/angelcare360/operator/Angelcare360OperatorStatusBadge'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'
import { listOperatorContracts } from '@/lib/angelcare360/operator/contracts'
import { listOperatorClients } from '@/lib/angelcare360/operator/clients'
import { listOperatorSubscriptions } from '@/lib/angelcare360/operator/subscriptions'

export const dynamic = 'force-dynamic'

export default async function Angelcare360OperatorContractsPage() {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()

  const [contracts, clients, subscriptions] = await Promise.all([listOperatorContracts(), listOperatorClients(), listOperatorSubscriptions()])
  const contractOptions = contracts.map((contract) => ({ label: `${String(contract.contract_code || contract.id)} · ${String(contract.status || '—')}`, value: String(contract.id) }))
  const clientOptions = clients.map((client) => ({ label: `${String(client.display_name || 'Client')} · ${String(client.client_code || client.id)}`, value: String(client.id) }))
  const subscriptionOptions = subscriptions.map((subscription) => ({ label: `${String(subscription.subscription_code || subscription.id)} · ${String(subscription.status || '—')}`, value: String(subscription.id) }))

  return (
    <Angelcare360OperatorPageShell
      badge="Contrats"
      statusLabel={`${contracts.length} contrat(s)`}
      title="Contrats clients"
      subtitle="Métadonnées contractuelles, dates de validité et état de signature."
    >
      <Angelcare360OperatorActionDrawer
        title="Actions contrats"
        subtitle="Créer les métadonnées contractuelles et mettre à jour le statut."
        actions={[
          {
            id: 'create-contract',
            label: 'Créer contrat',
            endpoint: '/api/angelcare360/operator/contracts',
            operation: 'create',
            submitLabel: 'Créer',
            successMessage: 'Contrat créé.',
            fields: [
              { name: 'clientId', label: 'Client', kind: 'select', required: true, options: clientOptions },
              { name: 'subscriptionId', label: 'Abonnement', kind: 'select', options: subscriptionOptions },
              { name: 'contractCode', label: 'Code contrat', kind: 'text', required: true },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'Brouillon', value: 'draft' }, { label: 'Envoyé', value: 'sent' }, { label: 'Signé', value: 'signed' }, { label: 'Actif', value: 'active' }, { label: 'Expiré', value: 'expired' }, { label: 'Annulé', value: 'cancelled' }, { label: 'Archivé', value: 'archived' }] },
              { name: 'startDate', label: 'Début', kind: 'date', required: true },
              { name: 'endDate', label: 'Fin', kind: 'date' },
              { name: 'renewalDate', label: 'Renouvellement', kind: 'date' },
              { name: 'signedAt', label: 'Signé le', kind: 'date' },
              { name: 'documentUrl', label: 'URL document', kind: 'text' },
              { name: 'notes', label: 'Notes', kind: 'textarea', rows: 3 },
            ],
          },
          {
            id: 'update-status',
            label: 'Changer statut contrat',
            endpoint: '/api/angelcare360/operator/contracts',
            operation: 'status',
            submitLabel: 'Mettre à jour',
            successMessage: 'Statut contrat mis à jour.',
            fields: [
              { name: 'id', label: 'Contrat', kind: 'select', required: true, options: contractOptions },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'Brouillon', value: 'draft' }, { label: 'Envoyé', value: 'sent' }, { label: 'Signé', value: 'signed' }, { label: 'Actif', value: 'active' }, { label: 'Expiré', value: 'expired' }, { label: 'Annulé', value: 'cancelled' }, { label: 'Archivé', value: 'archived' }] },
            ],
          },
        ]}
      />
      <Angelcare360OperatorDataTable
        title="Contrats"
        rows={contracts}
        emptyTitle="Aucun contrat"
        emptyDescription="Les contrats clients seront listés ici."
        rowKey={(row) => String((row as Record<string, unknown>).id)}
        columns={[
          { key: 'contract_code', label: 'Contrat', render: (row) => String((row as Record<string, unknown>).contract_code || '—') },
          { key: 'client_id', label: 'Client', render: (row) => String((row as Record<string, unknown>).client_id || '—') },
          { key: 'status', label: 'Statut', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).status || '—')} /> },
          { key: 'start_date', label: 'Début', render: (row) => String((row as Record<string, unknown>).start_date || '—') },
          { key: 'renewal_date', label: 'Renouvellement', render: (row) => String((row as Record<string, unknown>).renewal_date || '—') },
        ]}
      />
    </Angelcare360OperatorPageShell>
  )
}
