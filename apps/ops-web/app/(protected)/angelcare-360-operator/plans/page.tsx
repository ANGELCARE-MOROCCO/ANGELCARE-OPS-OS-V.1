import Link from 'next/link'
import { notFound } from 'next/navigation'
import Angelcare360OperatorActionDrawer from '@/components/angelcare360/operator/Angelcare360OperatorActionDrawer'
import Angelcare360OperatorDataTable from '@/components/angelcare360/operator/Angelcare360OperatorDataTable'
import Angelcare360OperatorPageShell from '@/components/angelcare360/operator/Angelcare360OperatorPageShell'
import Angelcare360OperatorStatusBadge from '@/components/angelcare360/operator/Angelcare360OperatorStatusBadge'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'
import { listOperatorPlans } from '@/lib/angelcare360/operator/plans'

export const dynamic = 'force-dynamic'

export default async function Angelcare360OperatorPlansPage() {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()
  const plans = await listOperatorPlans()
  const planOptions = plans.map((plan) => ({ label: `${String(plan.name || 'Plan')} · ${String(plan.plan_code || plan.id)}`, value: String(plan.id) }))

  return (
    <Angelcare360OperatorPageShell
      badge="Plans"
      statusLabel={`${plans.length} plan(s)`}
      title="Plans commerciaux"
      subtitle="Offres AngelCare 360, cycle de facturation, capacités incluses et niveau de support."
      primaryAction={<Link href="/angelcare-360-operator" style={linkStyle}>Retour au cockpit</Link>}
    >
      <Angelcare360OperatorActionDrawer
        title="Actions plans"
        subtitle="Créer, modifier et retirer les offres commerciales AngelCare."
        actions={[
          {
            id: 'create-plan',
            label: 'Créer plan',
            endpoint: '/api/angelcare360/operator/plans',
            operation: 'create',
            entity: 'plan',
            submitLabel: 'Créer le plan',
            successMessage: 'Plan créé.',
            fields: [
              { name: 'planCode', label: 'Code plan', kind: 'text', required: true },
              { name: 'name', label: 'Nom', kind: 'text', required: true },
              { name: 'description', label: 'Description', kind: 'textarea', rows: 3 },
              { name: 'monthlyPriceMad', label: 'Prix mensuel MAD', kind: 'number', required: true },
              { name: 'annualPriceMad', label: 'Prix annuel MAD', kind: 'number', required: true },
              { name: 'billingCycle', label: 'Cycle de facturation', kind: 'text', required: true },
              { name: 'maxStudents', label: 'Max élèves', kind: 'number' },
              { name: 'maxStaff', label: 'Max personnel', kind: 'number' },
              { name: 'maxUsers', label: 'Max utilisateurs', kind: 'number' },
              { name: 'maxSites', label: 'Max sites', kind: 'number' },
              { name: 'includedModules', label: 'Modules inclus', kind: 'textarea', rows: 2, help: 'Séparer les modules par virgule.' },
              { name: 'includedFeatures', label: 'Fonctionnalités incluses', kind: 'textarea', rows: 2, help: 'Séparer les fonctionnalités par virgule.' },
              { name: 'supportLevel', label: 'Niveau de support', kind: 'text' },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'Brouillon', value: 'draft' }, { label: 'Actif', value: 'active' }, { label: 'Retiré', value: 'retired' }, { label: 'Archivé', value: 'archived' }] },
            ],
          },
          {
            id: 'update-plan',
            label: 'Modifier plan',
            endpoint: '/api/angelcare360/operator/plans',
            operation: 'update',
            entity: 'plan',
            submitLabel: 'Mettre à jour',
            successMessage: 'Plan mis à jour.',
            fields: [
              { name: 'id', label: 'Plan', kind: 'select', required: true, options: planOptions },
              { name: 'planCode', label: 'Code plan', kind: 'text', required: true },
              { name: 'name', label: 'Nom', kind: 'text', required: true },
              { name: 'description', label: 'Description', kind: 'textarea', rows: 3 },
              { name: 'monthlyPriceMad', label: 'Prix mensuel MAD', kind: 'number', required: true },
              { name: 'annualPriceMad', label: 'Prix annuel MAD', kind: 'number', required: true },
              { name: 'billingCycle', label: 'Cycle de facturation', kind: 'text', required: true },
              { name: 'maxStudents', label: 'Max élèves', kind: 'number' },
              { name: 'maxStaff', label: 'Max personnel', kind: 'number' },
              { name: 'maxUsers', label: 'Max utilisateurs', kind: 'number' },
              { name: 'maxSites', label: 'Max sites', kind: 'number' },
              { name: 'includedModules', label: 'Modules inclus', kind: 'textarea', rows: 2, help: 'Séparer les modules par virgule.' },
              { name: 'includedFeatures', label: 'Fonctionnalités incluses', kind: 'textarea', rows: 2, help: 'Séparer les fonctionnalités par virgule.' },
              { name: 'supportLevel', label: 'Niveau de support', kind: 'text' },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'Brouillon', value: 'draft' }, { label: 'Actif', value: 'active' }, { label: 'Retiré', value: 'retired' }, { label: 'Archivé', value: 'archived' }] },
            ],
          },
          {
            id: 'retire-plan',
            label: 'Retirer plan',
            endpoint: '/api/angelcare360/operator/plans',
            operation: 'retire',
            entity: 'plan',
            tone: 'danger',
            submitLabel: 'Retirer',
            successMessage: 'Plan retiré.',
            confirmTitle: 'Retrait de plan',
            confirmMessage: 'Le retrait garde l’historique mais retire le plan du catalogue actif.',
            fields: [
              { name: 'id', label: 'Plan', kind: 'select', required: true, options: planOptions },
            ],
          },
        ]}
      />
      <Angelcare360OperatorDataTable
        title="Catalogue de plans"
        rows={plans}
        emptyTitle="Aucun plan"
        emptyDescription="Créez un plan pour formaliser une offre commerciale."
        rowKey={(row) => String((row as Record<string, unknown>).id)}
        columns={[
          { key: 'plan_code', label: 'Code', render: (row) => String((row as Record<string, unknown>).plan_code || '—') },
          { key: 'name', label: 'Nom', render: (row) => String((row as Record<string, unknown>).name || '—') },
          { key: 'monthly_price_mad', label: 'Mensuel', align: 'right', render: (row) => `${Number((row as Record<string, unknown>).monthly_price_mad || 0).toLocaleString('fr-FR')} MAD` },
          { key: 'annual_price_mad', label: 'Annuel', align: 'right', render: (row) => `${Number((row as Record<string, unknown>).annual_price_mad || 0).toLocaleString('fr-FR')} MAD` },
          { key: 'support_level', label: 'Support', render: (row) => String((row as Record<string, unknown>).support_level || '—') },
          { key: 'status', label: 'Statut', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).status || '—')} /> },
        ]}
      />
    </Angelcare360OperatorPageShell>
  )
}

const linkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 14,
  background: '#0f172a',
  color: '#fff',
  textDecoration: 'none',
  padding: '10px 14px',
  fontWeight: 800,
}
