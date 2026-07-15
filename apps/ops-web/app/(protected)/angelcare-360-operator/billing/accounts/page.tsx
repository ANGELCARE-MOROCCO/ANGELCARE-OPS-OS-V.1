import { notFound } from 'next/navigation'
import Angelcare360OperatorActionDrawer from '@/components/angelcare360/operator/Angelcare360OperatorActionDrawer'
import Angelcare360OperatorDataTable from '@/components/angelcare360/operator/Angelcare360OperatorDataTable'
import Angelcare360OperatorPageShell from '@/components/angelcare360/operator/Angelcare360OperatorPageShell'
import Angelcare360OperatorStatusBadge from '@/components/angelcare360/operator/Angelcare360OperatorStatusBadge'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'
import { listOperatorClients } from '@/lib/angelcare360/operator/clients'
import { listOperatorBillingAccounts } from '@/lib/angelcare360/operator/billing'

export const dynamic = 'force-dynamic'

export default async function Angelcare360OperatorBillingAccountsPage() {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()

  const [accounts, clients] = await Promise.all([listOperatorBillingAccounts(), listOperatorClients()])
  const clientOptions = clients.map((client) => ({ label: `${String(client.display_name || 'Client')} · ${String(client.client_code || client.id)}`, value: String(client.id) }))
  const accountOptions = accounts.map((account) => ({ label: `${String(account.billing_name || account.id)} · ${String(account.status || '—')}`, value: String(account.id) }))

  return (
    <Angelcare360OperatorPageShell
      badge="Comptes de facturation"
      statusLabel={`${accounts.length} compte(s)`}
      title="Comptes de facturation"
      subtitle="Identité de facturation des clients opérés par AngelCare."
    >
      <Angelcare360OperatorActionDrawer
        title="Actions comptes de facturation"
        subtitle="Créer ou mettre à jour l’identité de facturation des clients."
        actions={[
          {
            id: 'create-account',
            label: 'Créer compte facturation',
            endpoint: '/api/angelcare360/operator/billing',
            entity: 'account',
            operation: 'create',
            submitLabel: 'Créer',
            successMessage: 'Compte de facturation créé.',
            fields: [
              { name: 'clientId', label: 'Client', kind: 'select', required: true, options: clientOptions },
              { name: 'billingName', label: 'Nom de facturation', kind: 'text', required: true },
              { name: 'billingEmail', label: 'Email de facturation', kind: 'text', required: true },
              { name: 'billingPhone', label: 'Téléphone', kind: 'text' },
              { name: 'billingAddress', label: 'Adresse', kind: 'textarea', rows: 3 },
              { name: 'taxIdentifier', label: 'Identifiant fiscal', kind: 'text' },
              { name: 'paymentTermsDays', label: 'Délai de paiement (jours)', kind: 'number' },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'Actif', value: 'active' }, { label: 'Inactif', value: 'inactive' }, { label: 'Archivé', value: 'archived' }] },
            ],
          },
          {
            id: 'update-account',
            label: 'Modifier compte',
            endpoint: '/api/angelcare360/operator/billing',
            entity: 'account',
            operation: 'update',
            submitLabel: 'Mettre à jour',
            successMessage: 'Compte de facturation mis à jour.',
            fields: [
              { name: 'id', label: 'Compte', kind: 'select', required: true, options: accountOptions },
              { name: 'clientId', label: 'Client', kind: 'select', required: true, options: clientOptions },
              { name: 'billingName', label: 'Nom de facturation', kind: 'text', required: true },
              { name: 'billingEmail', label: 'Email de facturation', kind: 'text', required: true },
              { name: 'billingPhone', label: 'Téléphone', kind: 'text' },
              { name: 'billingAddress', label: 'Adresse', kind: 'textarea', rows: 3 },
              { name: 'taxIdentifier', label: 'Identifiant fiscal', kind: 'text' },
              { name: 'paymentTermsDays', label: 'Délai de paiement (jours)', kind: 'number' },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'Actif', value: 'active' }, { label: 'Inactif', value: 'inactive' }, { label: 'Archivé', value: 'archived' }] },
            ],
          },
        ]}
      />
      <Angelcare360OperatorDataTable
        title="Comptes actifs"
        rows={accounts}
        emptyTitle="Aucun compte"
        emptyDescription="Les comptes de facturation clients seront suivis ici."
        rowKey={(row) => String((row as Record<string, unknown>).id)}
        columns={[
          { key: 'billing_name', label: 'Nom de facturation', render: (row) => String((row as Record<string, unknown>).billing_name || '—') },
          { key: 'billing_email', label: 'Email', render: (row) => String((row as Record<string, unknown>).billing_email || '—') },
          { key: 'payment_terms_days', label: 'Délais', render: (row) => `${Number((row as Record<string, unknown>).payment_terms_days || 0)} j` },
          { key: 'tax_identifier', label: 'Identifiant fiscal', render: (row) => String((row as Record<string, unknown>).tax_identifier || '—') },
          { key: 'status', label: 'Statut', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).status || '—')} /> },
        ]}
      />
    </Angelcare360OperatorPageShell>
  )
}
