import { notFound } from 'next/navigation'
import Angelcare360OperatorActionDrawer from '@/components/angelcare360/operator/Angelcare360OperatorActionDrawer'
import Angelcare360OperatorDataTable from '@/components/angelcare360/operator/Angelcare360OperatorDataTable'
import Angelcare360OperatorPageShell from '@/components/angelcare360/operator/Angelcare360OperatorPageShell'
import Angelcare360OperatorStatusBadge from '@/components/angelcare360/operator/Angelcare360OperatorStatusBadge'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'
import { listOperatorUsageLimits } from '@/lib/angelcare360/operator/features'

export const dynamic = 'force-dynamic'

export default async function Angelcare360OperatorUsageLimitsPage() {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()

  const limits = await listOperatorUsageLimits()
  const limitOptions = limits.map((limit) => ({ label: `${String(limit.label || 'Limite')} · ${String(limit.status || '—')}`, value: String(limit.id) }))

  return (
    <Angelcare360OperatorPageShell
      badge="Limites d’usage"
      statusLabel={`${limits.length} limite(s)`}
      title="Limites d’usage"
      subtitle="Lecture des seuils, usages mesurés et limites contractuelles par client ou tenant."
    >
      <Angelcare360OperatorActionDrawer
        title="Actions limites d’usage"
        subtitle="Mettre à jour les seuils mesurés par client ou tenant."
        actions={[
          {
            id: 'update-limit',
            label: 'Modifier limite',
            endpoint: '/api/angelcare360/operator/features',
            entity: 'usage',
            operation: 'update',
            submitLabel: 'Mettre à jour',
            successMessage: 'Limite d’usage mise à jour.',
            fields: [
              { name: 'id', label: 'Limite', kind: 'select', required: true, options: limitOptions },
              { name: 'allowedValue', label: 'Valeur autorisée', kind: 'number' },
              { name: 'currentValue', label: 'Valeur actuelle', kind: 'number' },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'Active', value: 'active' }, { label: 'En pause', value: 'paused' }, { label: 'Archivée', value: 'archived' }] },
              { name: 'resetCycle', label: 'Cycle de remise à zéro', kind: 'text' },
            ],
          },
        ]}
      />
      <Angelcare360OperatorDataTable
        title="Limites actives"
        rows={limits}
        emptyTitle="Aucune limite"
        emptyDescription="Les limites d’usage seront suivies ici."
        rowKey={(row) => String((row as Record<string, unknown>).id)}
        columns={[
          { key: 'label', label: 'Libellé', render: (row) => String((row as Record<string, unknown>).label || '—') },
          { key: 'client_id', label: 'Client', render: (row) => String((row as Record<string, unknown>).client_id || '—') },
          { key: 'allowed_value', label: 'Autorisé', align: 'right', render: (row) => String((row as Record<string, unknown>).allowed_value ?? 'Non mesuré') },
          { key: 'current_value', label: 'Consommé', align: 'right', render: (row) => String((row as Record<string, unknown>).current_value ?? 'Non mesuré') },
          { key: 'unit', label: 'Unité', render: (row) => String((row as Record<string, unknown>).unit || '—') },
          { key: 'status', label: 'Statut', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).status || '—')} /> },
        ]}
      />
    </Angelcare360OperatorPageShell>
  )
}
