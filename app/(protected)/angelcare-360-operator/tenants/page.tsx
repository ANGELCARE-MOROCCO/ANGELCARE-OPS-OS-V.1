import Link from 'next/link'
import { notFound } from 'next/navigation'
import Angelcare360OperatorActionDrawer from '@/components/angelcare360/operator/Angelcare360OperatorActionDrawer'
import Angelcare360OperatorDataTable from '@/components/angelcare360/operator/Angelcare360OperatorDataTable'
import Angelcare360OperatorLockedPanel from '@/components/angelcare360/operator/Angelcare360OperatorLockedPanel'
import Angelcare360OperatorPageShell from '@/components/angelcare360/operator/Angelcare360OperatorPageShell'
import Angelcare360OperatorStatusBadge from '@/components/angelcare360/operator/Angelcare360OperatorStatusBadge'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'
import { listOperatorClients } from '@/lib/angelcare360/operator/clients'
import { listOperatorTenants } from '@/lib/angelcare360/operator/tenants'

export const dynamic = 'force-dynamic'

export default async function Angelcare360OperatorTenantsPage() {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()
  const [tenants, clients] = await Promise.all([listOperatorTenants(), listOperatorClients()])
  const tenantOptions = tenants.map((tenant) => ({ label: `${String(tenant.tenant_slug || tenant.id)} · ${String(tenant.status || '—')}`, value: String(tenant.id) }))
  const clientOptions = clients.map((client) => ({ label: `${String(client.display_name || 'Client')} · ${String(client.client_code || client.id)}`, value: String(client.id) }))

  return (
    <Angelcare360OperatorPageShell
      badge="Tenants"
      statusLabel={`${tenants.length} tenant(s)`}
      title="Tenants client"
      subtitle="Statut de mise en service, environnement, accès au command center et état de provisionnement."
      primaryAction={<Link href="/angelcare-360-operator" style={linkStyle}>Retour au cockpit</Link>}
    >
      <Angelcare360OperatorActionDrawer
        title="Actions tenants"
        subtitle="Créer ou relier un tenant et mettre à jour son statut de mise en service."
        actions={[
          {
            id: 'create-tenant',
            label: 'Créer tenant',
            endpoint: '/api/angelcare360/operator/tenants',
            operation: 'create',
            submitLabel: 'Créer',
            successMessage: 'Tenant créé ou lié.',
            fields: [
              { name: 'clientId', label: 'Client', kind: 'select', required: true, options: clientOptions },
              { name: 'schoolId', label: 'School ID', kind: 'text' },
              { name: 'tenantSlug', label: 'Slug tenant', kind: 'text', required: true, placeholder: 'ecole-lumiere' },
              { name: 'environment', label: 'Environnement', kind: 'select', required: true, options: [{ label: 'Pilote', value: 'pilot' }, { label: 'Production', value: 'production' }, { label: 'Sandbox', value: 'sandbox' }] },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'Non créé', value: 'not_created' }, { label: 'Provisionnement', value: 'provisioning' }, { label: 'Actif', value: 'active' }, { label: 'Suspendu', value: 'suspended' }, { label: 'Archivé', value: 'archived' }] },
              { name: 'provisioningStatus', label: 'Provisionnement', kind: 'text' },
              { name: 'commandCenterUrl', label: 'URL command center', kind: 'text' },
              { name: 'goLiveDate', label: 'Date de mise en ligne', kind: 'date' },
            ],
          },
          {
            id: 'update-status',
            label: 'Mettre à jour statut',
            endpoint: '/api/angelcare360/operator/tenants',
            operation: 'status',
            submitLabel: 'Mettre à jour',
            successMessage: 'Statut tenant mis à jour.',
            fields: [
              { name: 'id', label: 'Tenant', kind: 'select', required: true, options: tenantOptions },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'Non créé', value: 'not_created' }, { label: 'Provisionnement', value: 'provisioning' }, { label: 'Actif', value: 'active' }, { label: 'Suspendu', value: 'suspended' }, { label: 'Archivé', value: 'archived' }] },
              { name: 'provisioningStatus', label: 'Provisionnement', kind: 'text' },
              { name: 'commandCenterUrl', label: 'URL command center', kind: 'text' },
            ],
          },
        ]}
      />
      <Angelcare360OperatorLockedPanel
        title="Provisioning"
        message="Le provisioning automatique reste verrouillé tant que la création d’espace client et les chaînes d’accès ne sont pas industrialisées."
        note="Les statuts restent traçables manuellement et les accès peuvent être suivis dossier par dossier."
      />
      <Angelcare360OperatorDataTable
        title="Espaces client"
        rows={tenants}
        emptyTitle="Aucun tenant"
        emptyDescription="Aucun espace client n’est encore lié."
        rowKey={(row) => String((row as Record<string, unknown>).id)}
        columns={[
          { key: 'tenant_slug', label: 'Slug', render: (row) => String((row as Record<string, unknown>).tenant_slug || '—') },
          { key: 'environment', label: 'Environnement', render: (row) => String((row as Record<string, unknown>).environment || '—') },
          { key: 'status', label: 'Statut', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).status || '—')} /> },
          { key: 'provisioning_status', label: 'Provisioning', render: (row) => String((row as Record<string, unknown>).provisioning_status || '—') },
          { key: 'command_center_url', label: 'URL', render: (row) => String((row as Record<string, unknown>).command_center_url || '—') },
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
