import { notFound } from 'next/navigation'
import Angelcare360OperatorActionDrawer from '@/components/angelcare360/operator/Angelcare360OperatorActionDrawer'
import Angelcare360OperatorDataTable from '@/components/angelcare360/operator/Angelcare360OperatorDataTable'
import Angelcare360OperatorPageShell from '@/components/angelcare360/operator/Angelcare360OperatorPageShell'
import Angelcare360OperatorStatusBadge from '@/components/angelcare360/operator/Angelcare360OperatorStatusBadge'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'
import { listOperatorClients } from '@/lib/angelcare360/operator/clients'
import { listOperatorTenants } from '@/lib/angelcare360/operator/tenants'
import { listOperatorNotes } from '@/lib/angelcare360/operator/service'

export const dynamic = 'force-dynamic'

export default async function Angelcare360OperatorNotesPage() {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()

  const [notes, clients, tenants] = await Promise.all([listOperatorNotes(), listOperatorClients(), listOperatorTenants()])
  const clientOptions = clients.map((client) => ({ label: `${String(client.display_name || 'Client')} · ${String(client.client_code || client.id)}`, value: String(client.id) }))
  const tenantOptions = tenants.map((tenant) => ({ label: `${String(tenant.tenant_slug || tenant.id)} · ${String(tenant.status || '—')}`, value: String(tenant.id) }))

  return (
    <Angelcare360OperatorPageShell
      badge="Notes internes"
      statusLabel={`${notes.length} note(s)`}
      title="Notes internes"
      subtitle="Journal interne confidentiel pour le pilotage opérateur."
    >
      <Angelcare360OperatorActionDrawer
        title="Actions notes"
        subtitle="Ajouter des notes internes confidentielles liées à un client ou un tenant."
        actions={[
          {
            id: 'create-note',
            label: 'Ajouter note',
            endpoint: '/api/angelcare360/operator/service',
            entity: 'note',
            operation: 'create',
            submitLabel: 'Ajouter',
            successMessage: 'Note ajoutée.',
            fields: [
              { name: 'clientId', label: 'Client', kind: 'select', options: clientOptions },
              { name: 'tenantId', label: 'Tenant', kind: 'select', options: tenantOptions },
              { name: 'authorId', label: 'Auteur', kind: 'text' },
              { name: 'noteType', label: 'Type de note', kind: 'text', required: true },
              { name: 'body', label: 'Contenu', kind: 'textarea', rows: 4, required: true },
              { name: 'visibility', label: 'Visibilité', kind: 'select', required: true, options: [{ label: 'Interne', value: 'internal' }, { label: 'Restreinte', value: 'restricted' }, { label: 'Publique', value: 'public' }] },
            ],
          },
        ]}
      />
      <Angelcare360OperatorDataTable
        title="Notes"
        rows={notes}
        emptyTitle="Aucune note"
        emptyDescription="Les notes internes apparaîtront ici."
        rowKey={(row) => String((row as Record<string, unknown>).id)}
        columns={[
          { key: 'note_type', label: 'Type', render: (row) => String((row as Record<string, unknown>).note_type || '—') },
          { key: 'visibility', label: 'Visibilité', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).visibility || '—')} /> },
          { key: 'client_id', label: 'Client', render: (row) => String((row as Record<string, unknown>).client_id || '—') },
          { key: 'body', label: 'Contenu', render: (row) => String((row as Record<string, unknown>).body || '—') },
        ]}
      />
    </Angelcare360OperatorPageShell>
  )
}
