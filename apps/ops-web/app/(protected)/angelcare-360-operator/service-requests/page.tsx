import { notFound } from 'next/navigation'
import Angelcare360OperatorActionDrawer from '@/components/angelcare360/operator/Angelcare360OperatorActionDrawer'
import Angelcare360OperatorDataTable from '@/components/angelcare360/operator/Angelcare360OperatorDataTable'
import Angelcare360OperatorPageShell from '@/components/angelcare360/operator/Angelcare360OperatorPageShell'
import Angelcare360OperatorStatusBadge from '@/components/angelcare360/operator/Angelcare360OperatorStatusBadge'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'
import { listOperatorClients } from '@/lib/angelcare360/operator/clients'
import { listOperatorTenants } from '@/lib/angelcare360/operator/tenants'
import { listOperatorServiceRequests } from '@/lib/angelcare360/operator/service'

export const dynamic = 'force-dynamic'

export default async function Angelcare360OperatorServiceRequestsPage() {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()

  const [requests, clients, tenants] = await Promise.all([listOperatorServiceRequests(), listOperatorClients(), listOperatorTenants()])
  const requestOptions = requests.map((request) => ({ label: `${String(request.title || request.id)} · ${String(request.status || '—')}`, value: String(request.id) }))
  const clientOptions = clients.map((client) => ({ label: `${String(client.display_name || 'Client')} · ${String(client.client_code || client.id)}`, value: String(client.id) }))
  const tenantOptions = tenants.map((tenant) => ({ label: `${String(tenant.tenant_slug || tenant.id)} · ${String(tenant.status || '—')}`, value: String(tenant.id) }))

  return (
    <Angelcare360OperatorPageShell
      badge="Demandes service"
      statusLabel={`${requests.length} demande(s)`}
      title="Demandes de service"
      subtitle="Suivi des demandes client ou internes qui nécessitent une action opérateur."
    >
      <Angelcare360OperatorActionDrawer
        title="Actions demandes de service"
        subtitle="Créer, mettre à jour et clôturer les demandes service."
        actions={[
          {
            id: 'create-request',
            label: 'Créer demande',
            endpoint: '/api/angelcare360/operator/service',
            entity: 'request',
            operation: 'create',
            submitLabel: 'Créer',
            successMessage: 'Demande de service créée.',
            fields: [
              { name: 'clientId', label: 'Client', kind: 'select', options: clientOptions },
              { name: 'tenantId', label: 'Tenant', kind: 'select', options: tenantOptions },
              { name: 'requestType', label: 'Type', kind: 'text', required: true },
              { name: 'title', label: 'Titre', kind: 'text', required: true },
              { name: 'description', label: 'Description', kind: 'textarea', rows: 3, required: true },
              { name: 'priority', label: 'Priorité', kind: 'select', required: true, options: [{ label: 'Basse', value: 'low' }, { label: 'Normale', value: 'normal' }, { label: 'Haute', value: 'high' }, { label: 'Urgente', value: 'urgent' }] },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'Nouvelle', value: 'new' }, { label: 'Triage', value: 'triage' }, { label: 'Assignée', value: 'assigned' }, { label: 'En attente client', value: 'waiting_client' }, { label: 'En attente interne', value: 'waiting_internal' }, { label: 'Résolue', value: 'resolved' }, { label: 'Clôturée', value: 'closed' }, { label: 'Archivée', value: 'archived' }] },
              { name: 'assignedTo', label: 'Assigné à', kind: 'text' },
              { name: 'dueDate', label: 'Échéance', kind: 'date' },
            ],
          },
          {
            id: 'update-request',
            label: 'Modifier demande',
            endpoint: '/api/angelcare360/operator/service',
            entity: 'request',
            operation: 'update',
            submitLabel: 'Mettre à jour',
            successMessage: 'Demande mise à jour.',
            fields: [
              { name: 'id', label: 'Demande', kind: 'select', required: true, options: requestOptions },
              { name: 'clientId', label: 'Client', kind: 'select', options: clientOptions },
              { name: 'tenantId', label: 'Tenant', kind: 'select', options: tenantOptions },
              { name: 'requestType', label: 'Type', kind: 'text', required: true },
              { name: 'title', label: 'Titre', kind: 'text', required: true },
              { name: 'description', label: 'Description', kind: 'textarea', rows: 3, required: true },
              { name: 'priority', label: 'Priorité', kind: 'select', required: true, options: [{ label: 'Basse', value: 'low' }, { label: 'Normale', value: 'normal' }, { label: 'Haute', value: 'high' }, { label: 'Urgente', value: 'urgent' }] },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'Nouvelle', value: 'new' }, { label: 'Triage', value: 'triage' }, { label: 'Assignée', value: 'assigned' }, { label: 'En attente client', value: 'waiting_client' }, { label: 'En attente interne', value: 'waiting_internal' }, { label: 'Résolue', value: 'resolved' }, { label: 'Clôturée', value: 'closed' }, { label: 'Archivée', value: 'archived' }] },
              { name: 'assignedTo', label: 'Assigné à', kind: 'text' },
              { name: 'dueDate', label: 'Échéance', kind: 'date' },
            ],
          },
          {
            id: 'complete-request',
            label: 'Marquer terminée',
            endpoint: '/api/angelcare360/operator/service',
            entity: 'request',
            operation: 'complete',
            submitLabel: 'Clôturer',
            successMessage: 'Demande de service clôturée.',
            fields: [{ name: 'id', label: 'Demande', kind: 'select', required: true, options: requestOptions }],
          },
        ]}
      />
      <Angelcare360OperatorDataTable
        title="Demandes"
        rows={requests}
        emptyTitle="Aucune demande"
        emptyDescription="Les demandes de service apparaîtront ici."
        rowKey={(row) => String((row as Record<string, unknown>).id)}
        columns={[
          { key: 'title', label: 'Demande', render: (row) => String((row as Record<string, unknown>).title || '—') },
          { key: 'request_type', label: 'Type', render: (row) => String((row as Record<string, unknown>).request_type || '—') },
          { key: 'priority', label: 'Priorité', render: (row) => String((row as Record<string, unknown>).priority || '—') },
          { key: 'status', label: 'Statut', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).status || '—')} /> },
        ]}
      />
    </Angelcare360OperatorPageShell>
  )
}
