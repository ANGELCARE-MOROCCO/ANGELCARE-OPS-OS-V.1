import Link from 'next/link'
import { notFound } from 'next/navigation'
import Angelcare360OperatorActionDrawer from '@/components/angelcare360/operator/Angelcare360OperatorActionDrawer'
import Angelcare360OperatorDataTable from '@/components/angelcare360/operator/Angelcare360OperatorDataTable'
import Angelcare360OperatorPageShell from '@/components/angelcare360/operator/Angelcare360OperatorPageShell'
import Angelcare360OperatorStatusBadge from '@/components/angelcare360/operator/Angelcare360OperatorStatusBadge'
import { listOperatorClients } from '@/lib/angelcare360/operator/clients'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'
import { listOperatorPlans } from '@/lib/angelcare360/operator/plans'
import { listOperatorTenants } from '@/lib/angelcare360/operator/tenants'

export const dynamic = 'force-dynamic'

export default async function Angelcare360OperatorClientsPage() {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()
  const [clients, plans, tenants] = await Promise.all([
    listOperatorClients(),
    listOperatorPlans(),
    listOperatorTenants(),
  ])

  const clientOptions = clients.map((client) => ({ label: `${String(client.display_name || 'Client')} · ${String(client.client_code || client.id)}`, value: String(client.id) }))
  const planOptions = plans.map((plan) => ({ label: `${String(plan.name || 'Plan')} · ${String(plan.plan_code || plan.id)}`, value: String(plan.id) }))
  const tenantOptions = tenants.map((tenant) => ({ label: `${String(tenant.tenant_slug || tenant.id)} · ${String(tenant.status || '—')}`, value: String(tenant.id) }))

  return (
    <Angelcare360OperatorPageShell
      badge="Clients"
      statusLabel={`${clients.length} client(s)`}
      title="Clients écoles / crèches"
      subtitle="Dossiers opérateur, cycle commercial, accès SaaS, facturation et santé client."
      primaryAction={<Link href="/angelcare-360-operator" style={actionLinkStyle}>Retour au cockpit</Link>}
      secondaryActions={<Link href="/angelcare-360-operator/clients" style={secondaryLinkStyle}>Rafraîchir la liste</Link>}
      contextRow={
        <>
          <span style={contextPillStyle}>Clients: {clients.length}</span>
          <span style={contextPillStyle}>Plans: {plans.length}</span>
          <span style={contextPillStyle}>Tenants: {tenants.length}</span>
        </>
      }
    >
      <Angelcare360OperatorActionDrawer
        title="Actions clients"
        subtitle="Créer, mettre à jour, archiver et lancer les flux client, tenant, abonnement, facturation et support."
        actions={[
          {
            id: 'create-client',
            label: 'Nouveau client',
            endpoint: '/api/angelcare360/operator/clients',
            operation: 'create',
            submitLabel: 'Créer le client',
            successMessage: 'Client créé avec succès.',
            fields: [
              { name: 'clientCode', label: 'Code client', kind: 'text', required: true, placeholder: 'CLI-2026-001' },
              { name: 'displayName', label: 'Nom affiché', kind: 'text', required: true, placeholder: 'École Lumière' },
              { name: 'clientType', label: 'Type de client', kind: 'select', required: true, options: [{ label: 'École', value: 'school' }, { label: 'Crèche', value: 'nursery' }, { label: 'Groupe', value: 'group' }] },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'Prospect', value: 'prospect' }, { label: 'Pilote', value: 'pilot' }, { label: 'Actif', value: 'active' }, { label: 'Suspendu', value: 'suspended' }, { label: 'Résilié', value: 'churned' }, { label: 'Archivé', value: 'archived' }] },
              { name: 'lifecycleStage', label: 'Cycle de vie', kind: 'select', required: true, options: [{ label: 'Lead', value: 'lead' }, { label: 'Qualifié', value: 'qualified' }, { label: 'Démo faite', value: 'demo_done' }, { label: 'Proposition envoyée', value: 'proposal_sent' }, { label: 'Contrat en attente', value: 'contract_pending' }, { label: 'Onboarding', value: 'onboarding' }, { label: 'En ligne', value: 'live' }, { label: 'Renouvellement', value: 'renewal' }, { label: 'À risque', value: 'at_risk' }, { label: 'Résilié', value: 'churned' }] },
              { name: 'city', label: 'Ville', kind: 'text', placeholder: 'Casablanca' },
              { name: 'country', label: 'Pays', kind: 'text', placeholder: 'Maroc' },
              { name: 'legalName', label: 'Raison sociale', kind: 'text' },
              { name: 'primaryContactName', label: 'Contact principal', kind: 'text' },
              { name: 'primaryContactEmail', label: 'Email principal', kind: 'text' },
              { name: 'primaryContactPhone', label: 'Téléphone principal', kind: 'text' },
              { name: 'source', label: 'Source', kind: 'text' },
              { name: 'healthStatus', label: 'Santé', kind: 'text' },
              { name: 'riskLevel', label: 'Risque', kind: 'text' },
              { name: 'notes', label: 'Notes', kind: 'textarea', rows: 3 },
            ],
          },
          {
            id: 'update-client',
            label: 'Modifier client',
            endpoint: '/api/angelcare360/operator/clients',
            operation: 'update',
            submitLabel: 'Mettre à jour',
            successMessage: 'Client mis à jour.',
            fields: [
              { name: 'id', label: 'Client', kind: 'select', required: true, options: clientOptions },
              { name: 'clientCode', label: 'Code client', kind: 'text', required: true },
              { name: 'displayName', label: 'Nom affiché', kind: 'text', required: true },
              { name: 'clientType', label: 'Type de client', kind: 'select', required: true, options: [{ label: 'École', value: 'school' }, { label: 'Crèche', value: 'nursery' }, { label: 'Groupe', value: 'group' }] },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'Prospect', value: 'prospect' }, { label: 'Pilote', value: 'pilot' }, { label: 'Actif', value: 'active' }, { label: 'Suspendu', value: 'suspended' }, { label: 'Résilié', value: 'churned' }, { label: 'Archivé', value: 'archived' }] },
              { name: 'lifecycleStage', label: 'Cycle de vie', kind: 'select', required: true, options: [{ label: 'Lead', value: 'lead' }, { label: 'Qualifié', value: 'qualified' }, { label: 'Démo faite', value: 'demo_done' }, { label: 'Proposition envoyée', value: 'proposal_sent' }, { label: 'Contrat en attente', value: 'contract_pending' }, { label: 'Onboarding', value: 'onboarding' }, { label: 'En ligne', value: 'live' }, { label: 'Renouvellement', value: 'renewal' }, { label: 'À risque', value: 'at_risk' }, { label: 'Résilié', value: 'churned' }] },
              { name: 'city', label: 'Ville', kind: 'text' },
              { name: 'country', label: 'Pays', kind: 'text' },
              { name: 'legalName', label: 'Raison sociale', kind: 'text' },
              { name: 'primaryContactName', label: 'Contact principal', kind: 'text' },
              { name: 'primaryContactEmail', label: 'Email principal', kind: 'text' },
              { name: 'primaryContactPhone', label: 'Téléphone principal', kind: 'text' },
              { name: 'source', label: 'Source', kind: 'text' },
              { name: 'healthStatus', label: 'Santé', kind: 'text' },
              { name: 'riskLevel', label: 'Risque', kind: 'text' },
              { name: 'notes', label: 'Notes', kind: 'textarea', rows: 3 },
            ],
          },
          {
            id: 'archive-client',
            label: 'Archiver client',
            endpoint: '/api/angelcare360/operator/clients',
            operation: 'archive',
            tone: 'danger',
            submitLabel: 'Archiver',
            successMessage: 'Client archivé.',
            confirmTitle: 'Archivage client',
            confirmMessage: 'L’archivage conserve l’historique mais retire le client du cycle opérationnel actif.',
            fields: [
              { name: 'id', label: 'Client', kind: 'select', required: true, options: clientOptions },
              { name: 'reason', label: 'Motif', kind: 'textarea', rows: 3, placeholder: 'Motif d’archivage interne' },
            ],
          },
          {
            id: 'create-tenant',
            label: 'Créer tenant',
            endpoint: '/api/angelcare360/operator/tenants',
            operation: 'create',
            submitLabel: 'Créer le tenant',
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
            id: 'create-subscription',
            label: 'Créer abonnement',
            endpoint: '/api/angelcare360/operator/subscriptions',
            operation: 'create',
            submitLabel: 'Créer l’abonnement',
            successMessage: 'Abonnement créé.',
            fields: [
              { name: 'clientId', label: 'Client', kind: 'select', required: true, options: clientOptions },
              { name: 'tenantId', label: 'Tenant', kind: 'select', options: tenantOptions },
              { name: 'planId', label: 'Plan', kind: 'select', required: true, options: planOptions },
              { name: 'subscriptionCode', label: 'Code abonnement', kind: 'text', required: true },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'Essai', value: 'trial' }, { label: 'Actif', value: 'active' }, { label: 'En retard', value: 'past_due' }, { label: 'Suspendu', value: 'suspended' }, { label: 'Annulé', value: 'cancelled' }, { label: 'Expiré', value: 'expired' }, { label: 'Archivé', value: 'archived' }] },
              { name: 'startDate', label: 'Date de début', kind: 'date', required: true },
              { name: 'trialEndsAt', label: 'Fin d’essai', kind: 'date' },
              { name: 'currentPeriodStart', label: 'Début période', kind: 'date' },
              { name: 'currentPeriodEnd', label: 'Fin période', kind: 'date' },
              { name: 'billingCycle', label: 'Cycle', kind: 'text', required: true, placeholder: 'monthly' },
              { name: 'billingAmountMad', label: 'Montant MAD', kind: 'number', required: true },
              { name: 'discountAmountMad', label: 'Remise MAD', kind: 'number' },
              { name: 'cancellationReason', label: 'Motif annulation', kind: 'textarea', rows: 2 },
              { name: 'suspendedReason', label: 'Motif suspension', kind: 'textarea', rows: 2 },
            ],
          },
          {
            id: 'create-billing-account',
            label: 'Compte facturation',
            endpoint: '/api/angelcare360/operator/billing',
            operation: 'create',
            entity: 'account',
            submitLabel: 'Créer le compte',
            successMessage: 'Compte de facturation créé.',
            fields: [
              { name: 'clientId', label: 'Client', kind: 'select', required: true, options: clientOptions },
              { name: 'billingName', label: 'Nom de facturation', kind: 'text', required: true },
              { name: 'billingEmail', label: 'Email de facturation', kind: 'text', required: true },
              { name: 'billingPhone', label: 'Téléphone', kind: 'text' },
              { name: 'billingAddress', label: 'Adresse', kind: 'textarea', rows: 3 },
              { name: 'taxIdentifier', label: 'Identifiant fiscal', kind: 'text' },
              { name: 'paymentTermsDays', label: 'Délai de paiement (jours)', kind: 'number' },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'Actif', value: 'active' }, { label: 'Inactif', value: 'inactive' }, { label: 'Archivé', value: 'archived' }] },
            ],
          },
          {
            id: 'create-support-ticket',
            label: 'Ticket support',
            endpoint: '/api/angelcare360/operator/support',
            operation: 'create',
            submitLabel: 'Créer le ticket',
            successMessage: 'Ticket support créé.',
            fields: [
              { name: 'clientId', label: 'Client', kind: 'select', required: true, options: clientOptions },
              { name: 'tenantId', label: 'Tenant', kind: 'select', options: tenantOptions },
              { name: 'subject', label: 'Sujet', kind: 'text', required: true },
              { name: 'description', label: 'Description', kind: 'textarea', rows: 4, required: true },
              { name: 'category', label: 'Catégorie', kind: 'text', required: true },
              { name: 'priority', label: 'Priorité', kind: 'select', required: true, options: [{ label: 'Basse', value: 'low' }, { label: 'Normale', value: 'normal' }, { label: 'Haute', value: 'high' }, { label: 'Urgente', value: 'urgent' }] },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'Nouvelle', value: 'new' }, { label: 'Triage', value: 'triage' }, { label: 'Assignée', value: 'assigned' }, { label: 'En attente client', value: 'waiting_client' }, { label: 'En attente interne', value: 'waiting_internal' }, { label: 'Résolue', value: 'resolved' }, { label: 'Clôturée', value: 'closed' }, { label: 'Archivée', value: 'archived' }] },
            ],
          },
        ]}
      />
      <Angelcare360OperatorDataTable
        title="Compte client"
        description="Les lignes ci-dessous combinent le statut commercial, la santé et le solde indicatif."
        rows={clients}
        rowKey={(row) => String((row as Record<string, unknown>).id)}
        hrefKey={(row) => `/angelcare-360-operator/clients/${String((row as Record<string, unknown>).id)}`}
        emptyTitle="Aucun client configuré"
        emptyDescription="Créez le premier compte client pour commencer le suivi opérateur."
        columns={[
          { key: 'display_name', label: 'Client', render: (row) => String((row as Record<string, unknown>).display_name || '—') },
          { key: 'status', label: 'Statut', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).status || '—')} /> },
          { key: 'lifecycle_stage', label: 'Cycle', render: (row) => String((row as Record<string, unknown>).lifecycle_stage || '—') },
          { key: 'city', label: 'Ville', render: (row) => String((row as Record<string, unknown>).city || '—') },
          { key: 'active_subscription_status', label: 'Abonnement', render: (row) => String((row as Record<string, unknown>).active_subscription_status || '—') },
          { key: 'balance_due_mad', label: 'Solde dû', align: 'right', render: (row) => `${Number((row as Record<string, unknown>).balance_due_mad || 0).toLocaleString('fr-FR')} MAD` },
          { key: 'support_count', label: 'Support', align: 'right', render: (row) => String((row as Record<string, unknown>).support_count || 0) },
        ]}
      />
    </Angelcare360OperatorPageShell>
  )
}

const actionLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 14,
  background: '#0f172a',
  color: '#fff',
  textDecoration: 'none',
  padding: '10px 14px',
  fontWeight: 800,
}

const secondaryLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 14,
  background: '#fff',
  color: '#0f172a',
  textDecoration: 'none',
  padding: '10px 14px',
  fontWeight: 800,
  border: '1px solid #dbe4ef',
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
