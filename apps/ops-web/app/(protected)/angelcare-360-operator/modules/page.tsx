import { notFound } from 'next/navigation'
import Angelcare360OperatorDataTable from '@/components/angelcare360/operator/Angelcare360OperatorDataTable'
import Angelcare360OperatorPageShell from '@/components/angelcare360/operator/Angelcare360OperatorPageShell'
import Angelcare360OperatorStatusBadge from '@/components/angelcare360/operator/Angelcare360OperatorStatusBadge'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'
import { getOperatorModuleEntitlements } from '@/lib/angelcare360/operator/features'

export const dynamic = 'force-dynamic'

export default async function Angelcare360OperatorModulesPage() {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()

  const entitlements = await getOperatorModuleEntitlements()

  return (
    <Angelcare360OperatorPageShell
      badge="Modules"
      statusLabel={`${entitlements.features.length} activation(s)`}
      title="Matrice des modules"
      subtitle="Lecture croisée des modules activés, verrouillés ou nécessitant configuration."
    >
      <Angelcare360OperatorDataTable
        title="Modules et dépendances"
        rows={entitlements.features}
        emptyTitle="Aucun module"
        emptyDescription="Les modules activés ou verrouillés par client apparaîtront ici."
        rowKey={(row) => String((row as Record<string, unknown>).id)}
        columns={[
          { key: 'feature_label', label: 'Fonction', render: (row) => String((row as Record<string, unknown>).feature_label || '—') },
          { key: 'client_id', label: 'Client', render: (row) => String((row as Record<string, unknown>).client_id || '—') },
          { key: 'module_key', label: 'Module', render: (row) => String((row as Record<string, unknown>).module_key || '—') },
          { key: 'status', label: 'Statut', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).status || '—')} /> },
          { key: 'enabled', label: 'Actif', render: (row) => String(Boolean((row as Record<string, unknown>).enabled) ? 'Oui' : 'Non') },
        ]}
      />
      <Angelcare360OperatorDataTable
        title="Plans commerciaux"
        rows={entitlements.plans}
        emptyTitle="Aucun plan"
        emptyDescription="Les plans liés aux modules sont affichés ici."
        rowKey={(row) => String((row as Record<string, unknown>).id)}
        columns={[
          { key: 'plan_code', label: 'Plan', render: (row) => String((row as Record<string, unknown>).plan_code || '—') },
          { key: 'name', label: 'Nom', render: (row) => String((row as Record<string, unknown>).name || '—') },
          { key: 'status', label: 'Statut', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).status || '—')} /> },
        ]}
      />
    </Angelcare360OperatorPageShell>
  )
}
