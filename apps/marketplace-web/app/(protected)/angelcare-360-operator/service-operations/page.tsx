import { notFound } from 'next/navigation'
import Angelcare360OperatorActionDrawer from '@/components/angelcare360/operator/Angelcare360OperatorActionDrawer'
import Angelcare360OperatorActionQueue from '@/components/angelcare360/operator/Angelcare360OperatorActionQueue'
import Angelcare360OperatorDataTable from '@/components/angelcare360/operator/Angelcare360OperatorDataTable'
import Angelcare360OperatorPageShell from '@/components/angelcare360/operator/Angelcare360OperatorPageShell'
import Angelcare360OperatorStatusBadge from '@/components/angelcare360/operator/Angelcare360OperatorStatusBadge'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'
import { listOperatorClients } from '@/lib/angelcare360/operator/clients'
import { listOperatorTenants } from '@/lib/angelcare360/operator/tenants'
import { listOperatorIncidents, listOperatorNotes, listOperatorServiceEvents, listOperatorServiceRequests, listOperatorTasks } from '@/lib/angelcare360/operator/service'

export const dynamic = 'force-dynamic'

export default async function Angelcare360OperatorServiceOperationsPage() {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()

  const [events, requests, incidents, tasks, notes] = await Promise.all([
    listOperatorServiceEvents(),
    listOperatorServiceRequests(),
    listOperatorIncidents(),
    listOperatorTasks(),
    listOperatorNotes(),
  ])
  const [clients, tenants] = await Promise.all([listOperatorClients(), listOperatorTenants()])
  const clientOptions = clients.map((client) => ({ label: `${String(client.display_name || 'Client')} · ${String(client.client_code || client.id)}`, value: String(client.id) }))
  const tenantOptions = tenants.map((tenant) => ({ label: `${String(tenant.tenant_slug || tenant.id)} · ${String(tenant.status || '—')}`, value: String(tenant.id) }))
  const requestOptions = requests.map((request) => ({ label: `${String(request.title || request.id)} · ${String(request.status || '—')}`, value: String(request.id) }))
  const incidentOptions = incidents.map((incident) => ({ label: `${String(incident.title || incident.id)} · ${String(incident.status || '—')}`, value: String(incident.id) }))
  const taskOptions = tasks.map((task) => ({ label: `${String(task.title || task.id)} · ${String(task.status || '—')}`, value: String(task.id) }))

  return (
    <Angelcare360OperatorPageShell
      badge="Service operations"
      statusLabel={`${events.length} événement(s)`}
      title="Opérations de service"
      subtitle="Tableau de bord interne des incidents, demandes, tâches et notes de pilotage."
      contextRow={
        <>
          <span style={contextPillStyle}>Demandes: {requests.length}</span>
          <span style={contextPillStyle}>Incidents: {incidents.length}</span>
          <span style={contextPillStyle}>Tâches: {tasks.length}</span>
          <span style={contextPillStyle}>Notes: {notes.length}</span>
        </>
      }
    >
      <Angelcare360OperatorActionDrawer
        title="Actions service"
        subtitle="Créer et clôturer les demandes, incidents, tâches et notes internes."
        actions={[
          {
            id: 'create-request',
            label: 'Créer demande service',
            endpoint: '/api/angelcare360/operator/service',
            entity: 'request',
            operation: 'create',
            submitLabel: 'Créer',
            successMessage: 'Demande service créée.',
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
            id: 'complete-request',
            label: 'Clôturer demande',
            endpoint: '/api/angelcare360/operator/service',
            entity: 'request',
            operation: 'complete',
            submitLabel: 'Clôturer',
            successMessage: 'Demande de service clôturée.',
            fields: [{ name: 'id', label: 'Demande', kind: 'select', required: true, options: requestOptions }],
          },
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
          {
            id: 'create-task',
            label: 'Créer tâche',
            endpoint: '/api/angelcare360/operator/service',
            entity: 'task',
            operation: 'create',
            submitLabel: 'Créer',
            successMessage: 'Tâche créée.',
            fields: [
              { name: 'clientId', label: 'Client', kind: 'select', options: clientOptions },
              { name: 'tenantId', label: 'Tenant', kind: 'select', options: tenantOptions },
              { name: 'title', label: 'Titre', kind: 'text', required: true },
              { name: 'description', label: 'Description', kind: 'textarea', rows: 3 },
              { name: 'ownerId', label: 'Responsable', kind: 'text' },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'À faire', value: 'todo' }, { label: 'En cours', value: 'in_progress' }, { label: 'Bloquée', value: 'blocked' }, { label: 'Terminée', value: 'done' }, { label: 'Annulée', value: 'cancelled' }] },
              { name: 'priority', label: 'Priorité', kind: 'select', required: true, options: [{ label: 'Basse', value: 'low' }, { label: 'Normale', value: 'normal' }, { label: 'Haute', value: 'high' }, { label: 'Urgente', value: 'urgent' }] },
              { name: 'dueDate', label: 'Échéance', kind: 'date' },
            ],
          },
          {
            id: 'complete-task',
            label: 'Terminer tâche',
            endpoint: '/api/angelcare360/operator/service',
            entity: 'task',
            operation: 'complete',
            submitLabel: 'Terminer',
            successMessage: 'Tâche terminée.',
            fields: [{ name: 'id', label: 'Tâche', kind: 'select', required: true, options: taskOptions }],
          },
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
      <Angelcare360OperatorActionQueue
        title="Synthèse opérationnelle"
        items={[
          { title: `${requests.length} demande(s) de service`, detail: 'Pilotage de configuration ou d’assistance.' },
          { title: `${incidents.length} incident(s)`, detail: 'Événements critiques ou à surveiller.' },
          { title: `${tasks.length} tâche(s)`, detail: 'Travaux internes à exécuter.' },
          { title: `${notes.length} note(s)`, detail: 'Notes internes confidentielles.' },
        ]}
      />
      <Angelcare360OperatorDataTable
        title="Événements de service"
        rows={events}
        emptyTitle="Aucun événement"
        emptyDescription="Les événements de service apparaîtront ici."
        rowKey={(row) => String((row as Record<string, unknown>).id)}
        columns={[
          { key: 'title', label: 'Événement', render: (row) => String((row as Record<string, unknown>).title || '—') },
          { key: 'event_type', label: 'Type', render: (row) => String((row as Record<string, unknown>).event_type || '—') },
          { key: 'severity', label: 'Sévérité', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).severity || '—')} /> },
          { key: 'status', label: 'Statut', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).status || '—')} /> },
        ]}
      />
    </Angelcare360OperatorPageShell>
  )
}

const contextPillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  padding: '7px 11px',
  background: '#fff',
  border: '1px solid #dbe4ef',
  color: '#0f172a',
  fontSize: 12,
  fontWeight: 800,
  boxShadow: '0 10px 24px rgba(15,23,42,.04)',
}
