import { notFound } from 'next/navigation'
import Angelcare360OperatorActionDrawer from '@/components/angelcare360/operator/Angelcare360OperatorActionDrawer'
import Angelcare360OperatorActionQueue from '@/components/angelcare360/operator/Angelcare360OperatorActionQueue'
import Angelcare360OperatorDataTable from '@/components/angelcare360/operator/Angelcare360OperatorDataTable'
import Angelcare360OperatorLockedPanel from '@/components/angelcare360/operator/Angelcare360OperatorLockedPanel'
import Angelcare360OperatorPageShell from '@/components/angelcare360/operator/Angelcare360OperatorPageShell'
import Angelcare360OperatorStatusBadge from '@/components/angelcare360/operator/Angelcare360OperatorStatusBadge'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'
import { listOperatorClients } from '@/lib/angelcare360/operator/clients'
import { listOperatorOnboardingTasks } from '@/lib/angelcare360/operator/onboarding'
import { listOperatorTenants } from '@/lib/angelcare360/operator/tenants'

export const dynamic = 'force-dynamic'

export default async function Angelcare360OperatorOnboardingPage() {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()

  const [tasks, clients, tenants] = await Promise.all([listOperatorOnboardingTasks(), listOperatorClients(), listOperatorTenants()])
  const taskOptions = tasks.map((task) => ({ label: `${String(task.title || task.id)} · ${String(task.status || '—')}`, value: String(task.id) }))
  const clientOptions = clients.map((client) => ({ label: `${String(client.display_name || 'Client')} · ${String(client.client_code || client.id)}`, value: String(client.id) }))
  const tenantOptions = tenants.map((tenant) => ({ label: `${String(tenant.tenant_slug || tenant.id)} · ${String(tenant.status || '—')}`, value: String(tenant.id) }))

  return (
    <Angelcare360OperatorPageShell
      badge="Onboarding"
      statusLabel={`${tasks.length} tâche(s)`}
      title="Onboarding client"
      subtitle="Plan d’implémentation, blocages, priorités et suivi des ouvertures de tenant."
    >
      <Angelcare360OperatorActionDrawer
        title="Actions onboarding"
        subtitle="Créer, mettre à jour ou clôturer les tâches d’implémentation."
        actions={[
          {
            id: 'create-task',
            label: 'Créer tâche',
            endpoint: '/api/angelcare360/operator/onboarding',
            operation: 'create',
            submitLabel: 'Créer',
            successMessage: 'Tâche onboarding créée.',
            fields: [
              { name: 'clientId', label: 'Client', kind: 'select', required: true, options: clientOptions },
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
            endpoint: '/api/angelcare360/operator/onboarding',
            operation: 'update',
            submitLabel: 'Mettre à jour',
            successMessage: 'Tâche mise à jour.',
            fields: [
              { name: 'id', label: 'Tâche', kind: 'select', required: true, options: taskOptions },
              { name: 'clientId', label: 'Client', kind: 'select', required: true, options: clientOptions },
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
            endpoint: '/api/angelcare360/operator/onboarding',
            operation: 'complete',
            submitLabel: 'Terminer',
            successMessage: 'Tâche terminée.',
            fields: [{ name: 'id', label: 'Tâche', kind: 'select', required: true, options: taskOptions }],
          },
          {
            id: 'onboarding-email',
            label: 'Email onboarding',
            endpoint: '/api/angelcare360/operator/onboarding',
            entity: 'email',
            operation: 'onboarding',
            submitLabel: 'Envoyer',
            successMessage: 'Email onboarding envoyé.',
            fields: [
              { name: 'clientId', label: 'Client', kind: 'select', required: true, options: clientOptions },
              { name: 'subject', label: 'Objet', kind: 'text', placeholder: 'Onboarding AngelCare 360' },
              { name: 'body', label: 'Message', kind: 'textarea', rows: 4 },
            ],
          },
        ]}
      />
      <section style={gridStyle}>
        <Angelcare360OperatorActionQueue
          title="File onboarding"
          items={[
            { title: `${tasks.filter((task) => String(task.status) === 'blocked').length} tâche(s) bloquée(s)`, detail: 'Priorité de déblocage avant mise en service.' },
            { title: `${tasks.filter((task) => String(task.status) === 'todo').length} tâche(s) à faire`, detail: 'Préparation des jalons à lancer.' },
            { title: `${tasks.filter((task) => String(task.status) === 'done').length} tâche(s) terminée(s)`, detail: 'Implémentation validée.' },
          ]}
        />
        <Angelcare360OperatorLockedPanel
          title="Relances externes verrouillées"
          message="Aucune relance automatique n’est envoyée tant que l’infrastructure email/SMS n’est pas validée."
          note="Le pilotage manuel des tâches reste disponible."
        />
      </section>
      <Angelcare360OperatorDataTable
        title="Tâches d’onboarding"
        rows={tasks}
        emptyTitle="Aucune tâche"
        emptyDescription="Les tâches d’implémentation apparaîtront ici."
        rowKey={(row) => String((row as Record<string, unknown>).id)}
        columns={[
          { key: 'title', label: 'Tâche', render: (row) => String((row as Record<string, unknown>).title || '—') },
          { key: 'client_id', label: 'Client', render: (row) => String((row as Record<string, unknown>).client_id || '—') },
          { key: 'status', label: 'Statut', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).status || '—')} /> },
          { key: 'priority', label: 'Priorité', render: (row) => String((row as Record<string, unknown>).priority || '—') },
          { key: 'due_date', label: 'Échéance', render: (row) => String((row as Record<string, unknown>).due_date || '—') },
        ]}
      />
    </Angelcare360OperatorPageShell>
  )
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
}
