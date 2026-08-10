import Link from 'next/link'
import { notFound } from 'next/navigation'
import Angelcare360OperatorActionDrawer from '@/components/angelcare360/operator/Angelcare360OperatorActionDrawer'
import Angelcare360OperatorDataTable from '@/components/angelcare360/operator/Angelcare360OperatorDataTable'
import Angelcare360OperatorPageShell from '@/components/angelcare360/operator/Angelcare360OperatorPageShell'
import Angelcare360OperatorStatusBadge from '@/components/angelcare360/operator/Angelcare360OperatorStatusBadge'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'
import { listOperatorPackages } from '@/lib/angelcare360/operator/packages'

export const dynamic = 'force-dynamic'

export default async function Angelcare360OperatorPackagesPage() {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()
  const packages = await listOperatorPackages()
  const packageOptions = packages.map((entry) => ({ label: `${String(entry.name || 'Package')} · ${String(entry.package_code || entry.id)}`, value: String(entry.id) }))

  return (
    <Angelcare360OperatorPageShell
      badge="Packages"
      statusLabel={`${packages.length} package(s)`}
      title="Packages modules"
      subtitle="Bundles de modules et de fonctionnalités pour les offres clients."
      primaryAction={<Link href="/angelcare-360-operator" style={linkStyle}>Retour au cockpit</Link>}
    >
      <Angelcare360OperatorActionDrawer
        title="Actions packages"
        subtitle="Créer, modifier et archiver les packages modules."
        actions={[
          {
            id: 'create-package',
            label: 'Créer package',
            endpoint: '/api/angelcare360/operator/packages',
            operation: 'create',
            submitLabel: 'Créer le package',
            successMessage: 'Package créé.',
            fields: [
              { name: 'packageCode', label: 'Code package', kind: 'text', required: true },
              { name: 'name', label: 'Nom', kind: 'text', required: true },
              { name: 'description', label: 'Description', kind: 'textarea', rows: 3 },
              { name: 'moduleKeys', label: 'Modules', kind: 'textarea', rows: 2, help: 'Séparer les clés par virgule.' },
              { name: 'featureKeys', label: 'Fonctions', kind: 'textarea', rows: 2, help: 'Séparer les clés par virgule.' },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'Brouillon', value: 'draft' }, { label: 'Actif', value: 'active' }, { label: 'Retiré', value: 'retired' }, { label: 'Archivé', value: 'archived' }] },
            ],
          },
          {
            id: 'update-package',
            label: 'Modifier package',
            endpoint: '/api/angelcare360/operator/packages',
            operation: 'update',
            submitLabel: 'Mettre à jour',
            successMessage: 'Package mis à jour.',
            fields: [
              { name: 'id', label: 'Package', kind: 'select', required: true, options: packageOptions },
              { name: 'packageCode', label: 'Code package', kind: 'text', required: true },
              { name: 'name', label: 'Nom', kind: 'text', required: true },
              { name: 'description', label: 'Description', kind: 'textarea', rows: 3 },
              { name: 'moduleKeys', label: 'Modules', kind: 'textarea', rows: 2, help: 'Séparer les clés par virgule.' },
              { name: 'featureKeys', label: 'Fonctions', kind: 'textarea', rows: 2, help: 'Séparer les clés par virgule.' },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'Brouillon', value: 'draft' }, { label: 'Actif', value: 'active' }, { label: 'Retiré', value: 'retired' }, { label: 'Archivé', value: 'archived' }] },
            ],
          },
        ]}
      />
      <Angelcare360OperatorDataTable
        title="Catalogue de packages"
        rows={packages}
        emptyTitle="Aucun package"
        emptyDescription="Les packages de modules seront suivis ici."
        rowKey={(row) => String((row as Record<string, unknown>).id)}
        columns={[
          { key: 'package_code', label: 'Code', render: (row) => String((row as Record<string, unknown>).package_code || '—') },
          { key: 'name', label: 'Nom', render: (row) => String((row as Record<string, unknown>).name || '—') },
          {
            key: 'module_keys',
            label: 'Modules',
            render: (row) => {
              const moduleKeys = Array.isArray((row as Record<string, unknown>).module_keys) ? ((row as Record<string, unknown>).module_keys as string[]) : []
              return moduleKeys.length ? moduleKeys.join(' · ') : '—'
            },
          },
          {
            key: 'feature_keys',
            label: 'Fonctions',
            render: (row) => {
              const featureKeys = Array.isArray((row as Record<string, unknown>).feature_keys) ? ((row as Record<string, unknown>).feature_keys as string[]) : []
              return featureKeys.length ? featureKeys.join(' · ') : '—'
            },
          },
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
