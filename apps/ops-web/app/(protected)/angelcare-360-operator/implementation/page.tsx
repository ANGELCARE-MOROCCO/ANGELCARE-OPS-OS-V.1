import { notFound } from 'next/navigation'
import Angelcare360OperatorDataTable from '@/components/angelcare360/operator/Angelcare360OperatorDataTable'
import Angelcare360OperatorPageShell from '@/components/angelcare360/operator/Angelcare360OperatorPageShell'
import Angelcare360OperatorStatusBadge from '@/components/angelcare360/operator/Angelcare360OperatorStatusBadge'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'
import { listOperatorServiceRequests } from '@/lib/angelcare360/operator/service'
import { listOperatorOnboardingTasks } from '@/lib/angelcare360/operator/onboarding'

export const dynamic = 'force-dynamic'

export default async function Angelcare360OperatorImplementationPage() {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()

  const [tasks, serviceRequests] = await Promise.all([listOperatorOnboardingTasks(), listOperatorServiceRequests()])

  return (
    <Angelcare360OperatorPageShell
      badge="Implémentation"
      statusLabel={`${tasks.length + serviceRequests.length} élément(s)`}
      title="Implémentation client"
      subtitle="Vue consolidée des tâches projet, des demandes de service et des blocages opérationnels."
    >
      <Angelcare360OperatorDataTable
        title="Tâches projet"
        rows={tasks}
        emptyTitle="Aucune tâche"
        emptyDescription="Les tâches d’implémentation sont suivies dans la page onboarding."
        rowKey={(row) => String((row as Record<string, unknown>).id)}
        columns={[
          { key: 'title', label: 'Tâche', render: (row) => String((row as Record<string, unknown>).title || '—') },
          { key: 'status', label: 'Statut', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).status || '—')} /> },
          { key: 'priority', label: 'Priorité', render: (row) => String((row as Record<string, unknown>).priority || '—') },
          { key: 'due_date', label: 'Échéance', render: (row) => String((row as Record<string, unknown>).due_date || '—') },
        ]}
      />
      <Angelcare360OperatorDataTable
        title="Demandes de service"
        rows={serviceRequests}
        emptyTitle="Aucune demande"
        emptyDescription="Les demandes d’accompagnement technique sont suivies ici."
        rowKey={(row) => String((row as Record<string, unknown>).id)}
        columns={[
          { key: 'title', label: 'Demande', render: (row) => String((row as Record<string, unknown>).title || '—') },
          { key: 'request_type', label: 'Type', render: (row) => String((row as Record<string, unknown>).request_type || '—') },
          { key: 'status', label: 'Statut', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).status || '—')} /> },
          { key: 'priority', label: 'Priorité', render: (row) => String((row as Record<string, unknown>).priority || '—') },
        ]}
      />
    </Angelcare360OperatorPageShell>
  )
}
