import { notFound } from 'next/navigation'
import Angelcare360OperatorActionDrawer from '@/components/angelcare360/operator/Angelcare360OperatorActionDrawer'
import Angelcare360OperatorDataTable from '@/components/angelcare360/operator/Angelcare360OperatorDataTable'
import Angelcare360OperatorPageShell from '@/components/angelcare360/operator/Angelcare360OperatorPageShell'
import Angelcare360OperatorStatusBadge from '@/components/angelcare360/operator/Angelcare360OperatorStatusBadge'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'
import { listOperatorClients } from '@/lib/angelcare360/operator/clients'
import { listOperatorTenants } from '@/lib/angelcare360/operator/tenants'
import { listOperatorTasks } from '@/lib/angelcare360/operator/service'

export const dynamic = 'force-dynamic'

export default async function Angelcare360OperatorTasksPage() {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()

  const [tasks, clients, tenants] = await Promise.all([listOperatorTasks(), listOperatorClients(), listOperatorTenants()])
  const taskOptions = tasks.map((task) => ({ label: `${String(task.title || task.id)} · ${String(task.status || '—')}`, value: String(task.id) }))
  const clientOptions = clients.map((client) => ({ label: `${String(client.display_name || 'Client')} · ${String(client.client_code || client.id)}`, value: String(client.id) }))
  const tenantOptions = tenants.map((tenant) => ({ label: `${String(tenant.tenant_slug || tenant.id)} · ${String(tenant.status || '—')}`, value: String(tenant.id) }))

  return (
    <Angelcare360OperatorPageShell
      badge="Tâches"
      statusLabel={`${tasks.length} tâche(s)`}
      title="Tâches internes"
      subtitle="Travaux internes AngelCare pour l’exploitation, l’implémentation et le support client."
    >
      <Angelcare360OperatorActionDrawer
        title="Actions tâches"
        subtitle="Créer, modifier et clôturer les tâches internes."
        actions={[
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
            id: 'update-task',
            label: 'Modifier tâche',
            endpoint: '/api/angelcare360/operator/service',
            entity: 'task',
            operation: 'update',
            submitLabel: 'Mettre à jour',
            successMessage: 'Tâche mise à jour.',
            fields: [
              { name: 'id', label: 'Tâche', kind: 'select', required: true, options: taskOptions },
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
            label: 'Marquer terminée',
            endpoint: '/api/angelcare360/operator/service',
            entity: 'task',
            operation: 'complete',
            submitLabel: 'Terminer',
            successMessage: 'Tâche terminée.',
            fields: [{ name: 'id', label: 'Tâche', kind: 'select', required: true, options: taskOptions }],
          },
        ]}
      />
      <Angelcare360OperatorDataTable
        title="Tâches"
        rows={tasks}
        emptyTitle="Aucune tâche"
        emptyDescription="Les tâches opérateur apparaîtront ici."
        rowKey={(row) => String((row as Record<string, unknown>).id)}
        columns={[
          { key: 'title', label: 'Tâche', render: (row) => String((row as Record<string, unknown>).title || '—') },
          { key: 'priority', label: 'Priorité', render: (row) => String((row as Record<string, unknown>).priority || '—') },
          { key: 'status', label: 'Statut', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).status || '—')} /> },
          { key: 'due_date', label: 'Échéance', render: (row) => String((row as Record<string, unknown>).due_date || '—') },
        ]}
      />
    </Angelcare360OperatorPageShell>
  )
}
