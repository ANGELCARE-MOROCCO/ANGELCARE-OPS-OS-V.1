import { notFound } from 'next/navigation'
import Angelcare360OperatorActionDrawer from '@/components/angelcare360/operator/Angelcare360OperatorActionDrawer'
import Angelcare360OperatorDataTable from '@/components/angelcare360/operator/Angelcare360OperatorDataTable'
import Angelcare360OperatorPageShell from '@/components/angelcare360/operator/Angelcare360OperatorPageShell'
import Angelcare360OperatorStatusBadge from '@/components/angelcare360/operator/Angelcare360OperatorStatusBadge'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'
import { listOperatorFeatureFlags, listOperatorUsageLimits } from '@/lib/angelcare360/operator/features'

export const dynamic = 'force-dynamic'

export default async function Angelcare360OperatorFeaturesPage() {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()

  const [flags, usageLimits] = await Promise.all([listOperatorFeatureFlags(), listOperatorUsageLimits()])
  const flagOptions = flags.map((flag) => ({ label: `${String(flag.feature_label || 'Fonction')} · ${String(flag.status || '—')}`, value: String(flag.id) }))
  const usageOptions = usageLimits.map((limit) => ({ label: `${String(limit.label || 'Limite')} · ${String(limit.status || '—')}`, value: String(limit.id) }))

  return (
    <Angelcare360OperatorPageShell
      badge="Feature flags"
      statusLabel={`${flags.length} drapeau(x)`}
      title="Feature flags"
      subtitle="Activation, verrouillage et configuration des capacités par client ou tenant."
    >
      <Angelcare360OperatorActionDrawer
        title="Actions fonctionnalités"
        subtitle="Activer, verrouiller ou reconfigurer les fonctionnalités et limites opérateur."
        actions={[
          {
            id: 'update-flag',
            label: 'Modifier feature flag',
            endpoint: '/api/angelcare360/operator/features',
            entity: 'flag',
            operation: 'update',
            submitLabel: 'Mettre à jour',
            successMessage: 'Feature flag mis à jour.',
            fields: [
              { name: 'id', label: 'Feature flag', kind: 'select', required: true, options: flagOptions },
              { name: 'enabled', label: 'Activé', kind: 'select', required: true, options: [{ label: 'Oui', value: 'true' }, { label: 'Non', value: 'false' }] },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'Activé', value: 'enabled' }, { label: 'Désactivé', value: 'disabled' }, { label: 'Verrouillé', value: 'locked' }, { label: 'Planifié', value: 'scheduled' }, { label: 'Configuration requise', value: 'requires_configuration' }] },
              { name: 'lockedReason', label: 'Motif du verrouillage', kind: 'textarea', rows: 3 },
              { name: 'scheduledFor', label: 'Date de planification', kind: 'date' },
            ],
          },
          {
            id: 'update-limit',
            label: 'Modifier limite d’usage',
            endpoint: '/api/angelcare360/operator/features',
            entity: 'usage',
            operation: 'update',
            submitLabel: 'Mettre à jour',
            successMessage: 'Limite d’usage mise à jour.',
            fields: [
              { name: 'id', label: 'Limite', kind: 'select', required: true, options: usageOptions },
              { name: 'allowedValue', label: 'Valeur autorisée', kind: 'number' },
              { name: 'currentValue', label: 'Valeur actuelle', kind: 'number' },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'Active', value: 'active' }, { label: 'En pause', value: 'paused' }, { label: 'Archivée', value: 'archived' }] },
              { name: 'resetCycle', label: 'Cycle de remise à zéro', kind: 'text' },
            ],
          },
        ]}
      />
      <Angelcare360OperatorDataTable
        title="Drapeaux de fonctionnalités"
        rows={flags}
        emptyTitle="Aucun feature flag"
        emptyDescription="Les activations de modules et les verrous opérationnels apparaîtront ici."
        rowKey={(row) => String((row as Record<string, unknown>).id)}
        columns={[
          { key: 'feature_label', label: 'Fonction', render: (row) => String((row as Record<string, unknown>).feature_label || '—') },
          { key: 'module_key', label: 'Module', render: (row) => String((row as Record<string, unknown>).module_key || '—') },
          { key: 'status', label: 'Statut', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).status || '—')} /> },
          { key: 'enabled', label: 'Activé', render: (row) => String(Boolean((row as Record<string, unknown>).enabled) ? 'Oui' : 'Non') },
          { key: 'locked_reason', label: 'Motif', render: (row) => String((row as Record<string, unknown>).locked_reason || '—') },
        ]}
      />
    </Angelcare360OperatorPageShell>
  )
}
