import { notFound } from 'next/navigation'
import Angelcare360OperatorActionDrawer from '@/components/angelcare360/operator/Angelcare360OperatorActionDrawer'
import Angelcare360OperatorDataTable from '@/components/angelcare360/operator/Angelcare360OperatorDataTable'
import Angelcare360OperatorPageShell from '@/components/angelcare360/operator/Angelcare360OperatorPageShell'
import Angelcare360OperatorStatusBadge from '@/components/angelcare360/operator/Angelcare360OperatorStatusBadge'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'
import { listOperatorClients } from '@/lib/angelcare360/operator/clients'
import { listOperatorTenants } from '@/lib/angelcare360/operator/tenants'
import { listOperatorIncidents } from '@/lib/angelcare360/operator/service'

export const dynamic = 'force-dynamic'

export default async function Angelcare360OperatorIncidentsPage() {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()

  const [incidents, clients, tenants] = await Promise.all([listOperatorIncidents(), listOperatorClients(), listOperatorTenants()])
  const incidentOptions = incidents.map((incident) => ({ label: `${String(incident.title || incident.id)} · ${String(incident.status || '—')}`, value: String(incident.id) }))
  const clientOptions = clients.map((client) => ({ label: `${String(client.display_name || 'Client')} · ${String(client.client_code || client.id)}`, value: String(client.id) }))
  const tenantOptions = tenants.map((tenant) => ({ label: `${String(tenant.tenant_slug || tenant.id)} · ${String(tenant.status || '—')}`, value: String(tenant.id) }))

  return (
    <Angelcare360OperatorPageShell
      badge="Incidents"
      statusLabel={`${incidents.length} incident(s)`}
      title="Incidents"
      subtitle="Événements critiques ou sensibles nécessitant une surveillance opérateur."
    >
      <Angelcare360OperatorActionDrawer
        title="Actions incidents"
        subtitle="Créer et résoudre les incidents internes ou clients."
        actions={[
          {
            id: 'create-incident',
            label: 'Créer incident',
            endpoint: '/api/angelcare360/operator/service',
            entity: 'incident',
            operation: 'create',
            submitLabel: 'Créer',
            successMessage: 'Incident créé.',
            fields: [
              { name: 'clientId', label: 'Client', kind: 'select', options: clientOptions },
              { name: 'tenantId', label: 'Tenant', kind: 'select', options: tenantOptions },
              { name: 'severity', label: 'Sévérité', kind: 'select', required: true, options: [{ label: 'Basse', value: 'low' }, { label: 'Moyenne', value: 'medium' }, { label: 'Élevée', value: 'high' }, { label: 'Critique', value: 'critical' }] },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'Ouvert', value: 'open' }, { label: 'En investigation', value: 'investigating' }, { label: 'Stabilisé', value: 'mitigated' }, { label: 'Résolu', value: 'resolved' }, { label: 'Archivé', value: 'archived' }] },
              { name: 'title', label: 'Titre', kind: 'text', required: true },
              { name: 'description', label: 'Description', kind: 'textarea', rows: 3, required: true },
              { name: 'startedAt', label: 'Début', kind: 'date' },
            ],
          },
          {
            id: 'resolve-incident',
            label: 'Résoudre incident',
            endpoint: '/api/angelcare360/operator/service',
            entity: 'incident',
            operation: 'resolve',
            submitLabel: 'Résoudre',
            successMessage: 'Incident résolu.',
            fields: [{ name: 'id', label: 'Incident', kind: 'select', required: true, options: incidentOptions }],
          },
        ]}
      />
      <Angelcare360OperatorDataTable
        title="Incidents"
        rows={incidents}
        emptyTitle="Aucun incident"
        emptyDescription="Les incidents apparaîtront ici."
        rowKey={(row) => String((row as Record<string, unknown>).id)}
        columns={[
          { key: 'title', label: 'Incident', render: (row) => String((row as Record<string, unknown>).title || '—') },
          { key: 'severity', label: 'Sévérité', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).severity || '—')} /> },
          { key: 'status', label: 'Statut', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).status || '—')} /> },
          { key: 'started_at', label: 'Début', render: (row) => String((row as Record<string, unknown>).started_at || '—') },
        ]}
      />
    </Angelcare360OperatorPageShell>
  )
}
