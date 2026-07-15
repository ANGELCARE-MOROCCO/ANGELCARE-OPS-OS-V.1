import Link from 'next/link'
import { notFound } from 'next/navigation'
import Angelcare360OperatorActionDrawer from '@/components/angelcare360/operator/Angelcare360OperatorActionDrawer'
import Angelcare360OperatorInvoiceRowActions from '@/components/angelcare360/operator/Angelcare360OperatorInvoiceRowActions'
import Angelcare360OperatorActionQueue from '@/components/angelcare360/operator/Angelcare360OperatorActionQueue'
import Angelcare360OperatorHealthPanel from '@/components/angelcare360/operator/Angelcare360OperatorHealthPanel'
import Angelcare360OperatorPageShell from '@/components/angelcare360/operator/Angelcare360OperatorPageShell'
import Angelcare360OperatorDataTable from '@/components/angelcare360/operator/Angelcare360OperatorDataTable'
import Angelcare360OperatorLockedPanel from '@/components/angelcare360/operator/Angelcare360OperatorLockedPanel'
import Angelcare360OperatorRightPanel from '@/components/angelcare360/operator/Angelcare360OperatorRightPanel'
import Angelcare360OperatorStatusBadge from '@/components/angelcare360/operator/Angelcare360OperatorStatusBadge'
import Angelcare360OperatorDossierHero from '@/components/angelcare360/operator/dossier/Angelcare360OperatorDossierHero'
import Angelcare360OperatorDossierKpiRail from '@/components/angelcare360/operator/dossier/Angelcare360OperatorDossierKpiRail'
import Angelcare360OperatorDossierSection from '@/components/angelcare360/operator/dossier/Angelcare360OperatorDossierSection'
import Angelcare360OperatorDossierTabs from '@/components/angelcare360/operator/dossier/Angelcare360OperatorDossierTabs'
import { formatClientDate, formatClientShortDate, formatMad, firstDefinedLabel } from '@/components/angelcare360/operator/dossier/Angelcare360OperatorDossierFormat'
import { ANGELCARE360_OPERATOR_COLORS } from '@/components/angelcare360/operator/Angelcare360OperatorVisualSystem'
import { getOperatorClientById } from '@/lib/angelcare360/operator/clients'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'
import { listOperatorPlans } from '@/lib/angelcare360/operator/plans'
import { isAngelcare360EmailBridgeAvailable } from '@/lib/angelcare360/email/email-os-bridge'
import Angelcare360OperatorPaymentRowActions from '@/components/angelcare360/operator/Angelcare360OperatorPaymentRowActions'
import type { Angelcare360OperatorHealthDashboard } from '@/types/angelcare360/operator'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function Angelcare360OperatorClientDetailPage({ params }: PageProps) {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()
  const { id } = await params
  const [client, plans] = await Promise.all([
    getOperatorClientById(id),
    listOperatorPlans(),
  ])
  if (!client) notFound()

  const subscriptionRows = client.subscriptions || []
  const invoiceRows = client.invoices || []
  const paymentRows = client.payments || []
  const billingAccount = client.billingAccounts?.[0] || null
  const activeSubscription = client.activeSubscription || subscriptionRows.find((subscription) => String(subscription.status) === 'active') || subscriptionRows[0] || null
  const onboardingRows = client.onboardingTasks || []
  const supportRows = client.supportTickets || []
  const contractRows = client.contracts || []
  const renewalRows = client.renewals || []
  const serviceRows = client.serviceEvents || []
  const auditRows = client.auditLogs || []
  const tenantOptions = (client.tenants || []).map((tenant) => ({ label: `${String(tenant.tenant_slug || tenant.id)} · ${String(tenant.status || '—')}`, value: String(tenant.id) }))
  const subscriptionOptions = subscriptionRows.map((subscription) => ({ label: `${String(subscription.subscription_code || subscription.id)} · ${String(subscription.status || '—')}`, value: String(subscription.id) }))
  const invoiceOptions = invoiceRows.map((invoice) => ({ label: `${String(invoice.invoice_number || invoice.id)} · ${String(invoice.status || '—')}`, value: String(invoice.id) }))
  const paymentOptions = paymentRows.map((payment) => ({ label: `${String(payment.payment_reference || payment.id)} · ${String(payment.status || '—')}`, value: String(payment.id) }))
  const onboardingOptions = onboardingRows.map((task) => ({ label: `${String(task.title || task.id)} · ${String(task.status || '—')}`, value: String(task.id) }))
  const supportOptions = supportRows.map((ticket) => ({ label: `${String(ticket.subject || ticket.id)} · ${String(ticket.status || '—')}`, value: String(ticket.id) }))
  const contractOptions = contractRows.map((contract) => ({ label: `${String(contract.contract_code || contract.id)} · ${String(contract.status || '—')}`, value: String(contract.id) }))
  const renewalOptions = renewalRows.map((renewal) => ({ label: `${String(renewal.renewal_date || renewal.id)} · ${String(renewal.status || '—')}`, value: String(renewal.id) }))
  const planOptions = plans.map((plan) => ({ label: `${String(plan.name || plan.id)} · ${String(plan.status || '—')}`, value: String(plan.id) }))
  const paymentGateRows = client.paymentGates || []
  const paymentGateOptions = paymentGateRows.map((gate) => ({ label: `${String(gate.gate_code || gate.id)} · ${String(gate.status || '—')}`, value: String(gate.id) }))
  const emailBridgeAvailable = isAngelcare360EmailBridgeAvailable()
  const clientLabel = String(client.display_name || client.legal_name || client.client_code || client.id)
  const billingRecipientEmail = String(billingAccount?.billing_email || client.primary_contact_email || '').trim()
  const dashboardLinks = [
    { href: '/angelcare-360-operator/billing/invoices', label: 'Voir toutes les factures' },
    { href: '/angelcare-360-operator/billing/payments', label: 'Voir tous les paiements' },
    { href: '/angelcare-360-operator/support', label: 'Voir les tickets support' },
    { href: '/angelcare-360-operator/onboarding', label: 'Voir l’onboarding' },
    { href: '/angelcare-360-operator/renewals', label: 'Voir les renouvellements' },
    { href: '/angelcare-360-operator/audit', label: 'Voir l’audit complet' },
    { href: '/angelcare-360-operator/billing', label: 'Voir les gates paiement' },
  ]
  const primaryTenant = client.tenants?.[0] || null
  const latestInvoice = invoiceRows[0] || null
  const latestPayment = paymentRows[0] || null
  const primaryTenantId = primaryTenant ? String(primaryTenant.id) : null
  const overdueInvoices = invoiceRows.filter((invoice) => String(invoice.status) === 'overdue')
  const openSupportTickets = supportRows.filter((ticket) => ['new', 'triage', 'assigned', 'waiting_client', 'waiting_internal'].includes(String(ticket.status)))
  const activePaymentGates = paymentGateRows.filter((gate) => ['active', 'online_processing', 'manual_pending'].includes(String(gate.status)))
  const pendingPayments = paymentRows.filter((payment) => String(payment.status) === 'pending')
  const latestServiceEvent = serviceRows[0] || null
  const latestAuditEvent = auditRows[0] || null
  const nextDueLabel = formatClientDate(
    firstDefinedLabel(
      overdueInvoices[0]?.due_date as string | null | undefined,
      invoiceRows[0]?.due_date as string | null | undefined,
      activeSubscription?.current_period_end as string | null | undefined,
      renewalRows[0]?.renewal_date as string | null | undefined,
    ),
  )
  const clientSinceLabel = formatClientDate(
    firstDefinedLabel(primaryTenant?.go_live_date as string | null | undefined, client.created_at as string | null | undefined),
  )
  const mrrMad = Number(activeSubscription?.billing_amount_mad || 0)
  const balanceDueMad = Number(client.balance_due_mad || 0)
  const overdueAmountMad = Number(overdueInvoices.reduce((sum, invoice) => sum + Number(invoice.balance_due_mad || 0), 0))
  const healthScore = Math.max(
    0,
    100 - overdueInvoices.length * 14 - openSupportTickets.length * 9 - activePaymentGates.length * 12 - pendingPayments.length * 6,
  )
  const clientHealthDashboard: Angelcare360OperatorHealthDashboard = {
    scoreLabel: 'Santé du dossier',
    scoreValue: healthScore,
    summary: 'Lecture synthétique du dossier basée sur les signaux visibles: facturation, paiement, support et renouvellement.',
    factors: [
      {
        label: 'Statut client',
        status: String(client.status) === 'active' ? 'good' : String(client.status) === 'pilot' ? 'warning' : 'critical',
        value: String(client.status || '—'),
        detail: `Cycle de vie: ${String(client.lifecycle_stage || '—')}`,
      },
      {
        label: 'Solde dû',
        status: balanceDueMad > 0 ? 'warning' : 'good',
        value: formatMad(balanceDueMad),
        detail: overdueAmountMad > 0 ? `Dont ${formatMad(overdueAmountMad)} en retard.` : 'Aucun retard visible.',
      },
      {
        label: 'Factures en retard',
        status: overdueInvoices.length > 0 ? 'warning' : 'good',
        value: overdueInvoices.length,
        detail: overdueInvoices.length > 0 ? 'Une relance ou un gate peut être nécessaire.' : 'Aucune facture en retard.',
      },
      {
        label: 'Paiements en attente',
        status: pendingPayments.length > 0 ? 'warning' : 'good',
        value: pendingPayments.length,
        detail: pendingPayments.length > 0 ? 'Validation opérateur requise.' : 'Aucun paiement en attente.',
      },
      {
        label: 'Gates paiement',
        status: activePaymentGates.length > 0 ? 'warning' : 'good',
        value: activePaymentGates.length,
        detail: activePaymentGates.length > 0 ? 'Blocage ou validation active visible.' : 'Aucun gate actif.',
      },
      {
        label: 'Support ouvert',
        status: openSupportTickets.length > 0 ? 'warning' : 'good',
        value: openSupportTickets.length,
        detail: openSupportTickets.length > 0 ? 'Le support mérite un suivi.' : 'Aucun ticket ouvert.',
      },
    ],
  }
  const dossierTabs = [
    { label: 'Vue d’ensemble', href: '#vue-densemble', active: true },
    { label: 'Identité', href: '#identite' },
    { label: 'Accès SaaS', href: '#acces-saas' },
    { label: 'Facturation', href: '#facturation' },
    { label: 'Abonnements', href: '#abonnements' },
    { label: 'Factures', href: '#factures' },
    { label: 'Paiements', href: '#paiements' },
    { label: 'Gates paiement', href: '#gates-paiement' },
    { label: 'Recouvrement', href: '#recouvrement' },
    { label: 'Support', href: '#support' },
    { label: 'Contrats', href: '#contrats' },
    { label: 'Renouvellements', href: '#renouvellements' },
    { label: 'Événements de service', href: '#service' },
    { label: 'Audit', href: '#audit' },
  ]
  const actionGroups = [
    { title: 'Client', description: 'Identité et cycle de vie', actionIds: ['update-client', 'archive-client'] },
    { title: 'Tenant & accès', description: 'Provisionnement et statut SaaS', actionIds: ['link-tenant', 'update-tenant-status'] },
    { title: 'Abonnement', description: 'Souscription et cycle tarifaire', actionIds: ['create-subscription'] },
    { title: 'Facturation', description: 'Compte de facturation et émission', actionIds: ['create-billing-account', 'issue-invoice'] },
    { title: 'Paiement', description: 'Enregistrement et validation', actionIds: ['record-payment', 'confirm-payment', 'reject-payment'] },
    { title: 'Gates paiement', description: 'Blocage et résolution', actionIds: ['create-payment-gate', 'gate-manual-pending', 'gate-manual-processed', 'waive-payment-gate', 'cancel-payment-gate'] },
    { title: 'Support', description: 'Onboarding et tickets', actionIds: ['create-onboarding', 'create-support'] },
    { title: 'Contrat & renouvellement', description: 'Engagement et échéance', actionIds: ['create-contract', 'update-contract-status', 'create-renewal'] },
    { title: 'Notes', description: 'Journal interne', actionIds: ['add-note'] },
  ]

  return (
    <Angelcare360OperatorPageShell
      badge="Client 360"
      statusLabel={String(client.status)}
      title={String(client.display_name)}
      subtitle="Dossier client opérateur récapitulatif : identité, tenant, abonnement, facturation et historique récent borné. L’historique complet reste dans les pages dédiées."
      primaryAction={<Link href="/angelcare-360-operator/clients" style={linkStyle}>Retour à la liste</Link>}
      secondaryActions={
        <div style={secondaryActionsStyle}>
          <Link href={`/angelcare-360-operator/clients/${id}/statement-print`} style={secondaryLinkStyle}>État de compte A4</Link>
          <span style={metaChipStyle}>Encours affiché: {Number(client.balance_due_mad || 0).toLocaleString('fr-FR')} MAD</span>
        </div>
      }
      contextRow={
        <>
          <span style={contextPillStyle}>Abonnement actif: {activeSubscription ? String(activeSubscription.subscription_code || activeSubscription.id) : '—'}</span>
          <span style={contextPillStyle}>Tenant principal: {primaryTenant ? String(primaryTenant.tenant_slug || primaryTenant.id) : '—'}</span>
          <span style={contextPillStyle}>Factures récentes: {invoiceRows.length}</span>
          <span style={contextPillStyle}>Paiements récents: {paymentRows.length}</span>
          <span style={contextPillStyle}>Gates actifs: {paymentGateRows.length}</span>
        </>
      }
    >
      <Angelcare360OperatorDossierHero
        eyebrow="Dossier client opérateur"
        title={String(client.display_name)}
        subtitle="Cockpit premium du compte: lecture synthétique, actions réelles et historique borné pour piloter l’exécution sans alourdir le chargement initial."
        metaLine={`${String(client.client_type || 'Client')} · ${String(client.city || 'Ville non renseignée')} · ${String(client.country || 'Maroc')} · Client depuis ${clientSinceLabel}`}
        chips={[
          { label: `Code ${String(client.client_code)}`, tone: 'blue' },
          { label: String(client.lifecycle_stage || 'Cycle non renseigné'), tone: 'neutral' },
          { label: String(primaryTenant?.tenant_slug || 'Tenant non provisionné'), tone: primaryTenant ? 'green' : 'amber' },
          { label: String(client.risk_level || 'Risque non renseigné'), tone: String(client.risk_level || '').toLowerCase() === 'low' ? 'green' : 'amber' },
          { label: String(client.status || 'Statut non renseigné'), tone: String(client.status) === 'active' ? 'green' : String(client.status) === 'suspended' ? 'red' : 'blue' },
        ]}
        contacts={[
          { label: 'Contact principal', value: String(client.primary_contact_name || '—'), tone: 'blue' },
          { label: 'Email de facturation', value: billingRecipientEmail || '—', tone: 'green' },
          { label: 'Téléphone', value: String(client.primary_contact_phone || '—'), tone: 'neutral' },
          { label: 'Tenant SaaS', value: String(primaryTenant?.tenant_slug || 'Non provisionné'), tone: primaryTenant ? 'green' : 'amber' },
        ]}
        highlights={[
          { label: 'Santé du dossier', value: `${healthScore}/100`, detail: String(client.health_status || 'Lecture croisée des signaux opérationnels'), tone: healthScore > 80 ? 'green' : healthScore > 55 ? 'amber' : 'red' },
          { label: 'MRR mensuel', value: formatMad(mrrMad), detail: activeSubscription ? String(activeSubscription.subscription_code || activeSubscription.id) : 'Aucun abonnement actif', tone: mrrMad > 0 ? 'blue' : 'neutral' },
          { label: 'Solde dû', value: formatMad(balanceDueMad), detail: overdueAmountMad > 0 ? `${formatMad(overdueAmountMad)} en retard` : 'Aucun solde en retard visible', tone: balanceDueMad > 0 ? 'amber' : 'green' },
          { label: 'Prochaine échéance', value: nextDueLabel, detail: 'Facture, période ou renouvellement le plus proche', tone: activePaymentGates.length > 0 ? 'amber' : 'blue' },
        ]}
        actions={
          <div style={heroActionsStyle}>
            <Link href={`/angelcare-360-operator/clients/${id}/statement-print`} style={heroActionLinkStyle}>
              État de compte A4
            </Link>
            <Link href="#factures" style={heroActionSecondaryStyle}>
              Voir les factures
            </Link>
            <Link href="#paiements" style={heroActionSecondaryStyle}>
              Voir les paiements
            </Link>
            <Link href="#audit" style={heroActionSecondaryStyle}>
              Voir l’audit
            </Link>
          </div>
        }
      />

      <Angelcare360OperatorDossierKpiRail
        items={[
          { label: 'MRR mensuel', value: formatMad(mrrMad), detail: activeSubscription ? String(activeSubscription.billing_cycle || 'Cycle non renseigné') : 'Aucun abonnement actif', tone: 'blue' },
          { label: 'Factures', value: String(invoiceRows.length), detail: `${String(overdueInvoices.length)} en retard`, tone: overdueInvoices.length > 0 ? 'amber' : 'green' },
          { label: 'Solde dû', value: formatMad(balanceDueMad), detail: 'Encours du dossier', tone: balanceDueMad > 0 ? 'amber' : 'green' },
          { label: 'Paiements', value: String(paymentRows.length), detail: `${String(pendingPayments.length)} en attente`, tone: pendingPayments.length > 0 ? 'amber' : 'green' },
          { label: 'Gates actifs', value: String(activePaymentGates.length), detail: activePaymentGates.length > 0 ? 'Blocage visible' : 'Aucun gate actif', tone: activePaymentGates.length > 0 ? 'amber' : 'green' },
          { label: 'Support ouvert', value: String(openSupportTickets.length), detail: 'Tickets récents visibles', tone: openSupportTickets.length > 0 ? 'amber' : 'green' },
          { label: 'Prochaine échéance', value: nextDueLabel, detail: 'Facture ou période la plus proche', tone: 'blue' },
          { label: 'Santé', value: `${healthScore}/100`, detail: String(client.health_status || 'Synthèse dossier'), tone: healthScore > 80 ? 'green' : healthScore > 55 ? 'amber' : 'red' },
        ]}
      />

      <Angelcare360OperatorDossierTabs tabs={dossierTabs} />

      <Angelcare360OperatorDossierSection
        id="navigation-detaillee"
        eyebrow="Navigation"
        title="Pages détaillées du dossier"
        subtitle="Les vues de suivi complet restent disponibles dans les pages dédiées, sans charger tout l’historique dans le dossier résumé."
      >
        <div style={detailLinkRailStyle}>
          {dashboardLinks.map((item) => (
            <Link key={item.href} href={item.href} style={detailLinkStyle}>
              {item.label}
            </Link>
          ))}
          <Link href={`/angelcare-360-operator/clients/${id}/statement-print`} style={detailLinkPrimaryStyle}>
            État de compte A4
          </Link>
        </div>
      </Angelcare360OperatorDossierSection>

      <Angelcare360OperatorActionDrawer
        title="Actions du dossier client"
        subtitle="Actions opérateur sur l’identité, le tenant, l’abonnement, la facturation, le support, les contrats et le renouvellement."
        groups={actionGroups}
        actions={[
          {
            id: 'update-client',
            label: 'Modifier client',
            endpoint: '/api/angelcare360/operator/clients',
            operation: 'update',
            submitLabel: 'Mettre à jour',
            successMessage: 'Client mis à jour.',
            defaultValues: {
              id: String(client.id),
              clientCode: String(client.client_code || ''),
              displayName: String(client.display_name || ''),
              legalName: String(client.legal_name || ''),
              clientType: String(client.client_type || ''),
              city: String(client.city || ''),
              country: String(client.country || 'Maroc'),
              primaryContactName: String(client.primary_contact_name || ''),
              primaryContactEmail: String(client.primary_contact_email || ''),
              primaryContactPhone: String(client.primary_contact_phone || ''),
              status: String(client.status || ''),
              lifecycleStage: String(client.lifecycle_stage || ''),
              source: String(client.source || ''),
              healthStatus: String(client.health_status || ''),
              riskLevel: String(client.risk_level || ''),
              notes: String(client.notes || ''),
            },
            fields: [
              { name: 'id', label: 'Client', kind: 'readonly', required: true, defaultValue: String(client.id) },
              { name: 'clientCode', label: 'Code client', kind: 'text', required: true },
              { name: 'displayName', label: 'Nom affiché', kind: 'text', required: true },
              { name: 'clientType', label: 'Type de client', kind: 'select', required: true, options: [{ label: 'École', value: 'school' }, { label: 'Crèche', value: 'nursery' }, { label: 'Groupe', value: 'group' }] },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'Prospect', value: 'prospect' }, { label: 'Pilote', value: 'pilot' }, { label: 'Actif', value: 'active' }, { label: 'Suspendu', value: 'suspended' }, { label: 'Résilié', value: 'churned' }, { label: 'Archivé', value: 'archived' }] },
              { name: 'lifecycleStage', label: 'Cycle de vie', kind: 'select', required: true, options: [{ label: 'Lead', value: 'lead' }, { label: 'Qualifié', value: 'qualified' }, { label: 'Démo faite', value: 'demo_done' }, { label: 'Proposition envoyée', value: 'proposal_sent' }, { label: 'Contrat en attente', value: 'contract_pending' }, { label: 'Onboarding', value: 'onboarding' }, { label: 'En ligne', value: 'live' }, { label: 'Renouvellement', value: 'renewal' }, { label: 'À risque', value: 'at_risk' }, { label: 'Résilié', value: 'churned' }] },
              { name: 'legalName', label: 'Raison sociale', kind: 'text' },
              { name: 'city', label: 'Ville', kind: 'text' },
              { name: 'country', label: 'Pays', kind: 'text' },
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
            confirmMessage: 'L’archivage conserve l’historique mais retire ce client du cycle actif.',
            fields: [
              { name: 'id', label: 'Client', kind: 'readonly', required: true, defaultValue: String(client.id) },
              { name: 'reason', label: 'Motif', kind: 'textarea', rows: 3, placeholder: 'Motif d’archivage interne' },
            ],
          },
          {
            id: 'link-tenant',
            label: 'Créer / lier tenant',
            endpoint: '/api/angelcare360/operator/tenants',
            operation: 'create',
            submitLabel: 'Enregistrer le tenant',
            successMessage: 'Tenant enregistré.',
            fields: [
              { name: 'clientId', label: 'Client', kind: 'readonly', required: true, defaultValue: String(client.id) },
              { name: 'schoolId', label: 'ID école', kind: 'text' },
              { name: 'tenantSlug', label: 'Slug tenant', kind: 'text', required: true },
              { name: 'environment', label: 'Environnement', kind: 'select', required: true, options: [{ label: 'Pilote', value: 'pilot' }, { label: 'Production', value: 'production' }, { label: 'Sandbox', value: 'sandbox' }] },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'Non créé', value: 'not_created' }, { label: 'Provisionnement', value: 'provisioning' }, { label: 'Actif', value: 'active' }, { label: 'Suspendu', value: 'suspended' }, { label: 'Archivé', value: 'archived' }] },
              { name: 'provisioningStatus', label: 'Provisionnement', kind: 'text' },
              { name: 'commandCenterUrl', label: 'Lien centre de commande', kind: 'text' },
              { name: 'goLiveDate', label: 'Date de mise en ligne', kind: 'date' },
            ],
          },
          {
            id: 'update-tenant-status',
            label: 'Statut tenant',
            endpoint: '/api/angelcare360/operator/tenants',
            operation: 'status',
            submitLabel: 'Mettre à jour',
            successMessage: 'Statut tenant mis à jour.',
            fields: [
              { name: 'id', label: 'Tenant', kind: 'select', required: true, options: tenantOptions },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'Non créé', value: 'not_created' }, { label: 'Provisionnement', value: 'provisioning' }, { label: 'Actif', value: 'active' }, { label: 'Suspendu', value: 'suspended' }, { label: 'Archivé', value: 'archived' }] },
              { name: 'provisioningStatus', label: 'Provisionnement', kind: 'text' },
              { name: 'commandCenterUrl', label: 'Lien centre de commande', kind: 'text' },
            ],
          },
          {
            id: 'create-subscription',
            label: 'Créer abonnement',
            endpoint: '/api/angelcare360/operator/subscriptions',
            operation: 'create',
            submitLabel: 'Créer',
            successMessage: 'Abonnement créé.',
            fields: [
              { name: 'clientId', label: 'Client', kind: 'readonly', required: true, defaultValue: String(client.id) },
              { name: 'tenantId', label: 'Tenant', kind: 'select', options: tenantOptions },
              { name: 'planId', label: 'Plan', kind: 'select', required: true, options: planOptions },
              { name: 'subscriptionCode', label: 'Code abonnement', kind: 'text', required: true },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'Essai', value: 'trial' }, { label: 'Actif', value: 'active' }, { label: 'En retard', value: 'past_due' }, { label: 'Suspendu', value: 'suspended' }, { label: 'Annulé', value: 'cancelled' }, { label: 'Expiré', value: 'expired' }, { label: 'Archivé', value: 'archived' }] },
              { name: 'startDate', label: 'Date de début', kind: 'date', required: true },
              { name: 'billingCycle', label: 'Cycle de facturation', kind: 'text', required: true },
              { name: 'billingAmountMad', label: 'Montant mensuel MAD', kind: 'number', required: true },
              { name: 'discountAmountMad', label: 'Remise MAD', kind: 'number' },
              { name: 'trialEndsAt', label: 'Fin d’essai', kind: 'date' },
              { name: 'currentPeriodStart', label: 'Début période', kind: 'date' },
              { name: 'currentPeriodEnd', label: 'Fin période', kind: 'date' },
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
            submitLabel: 'Créer',
            successMessage: 'Compte de facturation créé.',
            fields: [
              { name: 'clientId', label: 'Client', kind: 'readonly', required: true, defaultValue: String(client.id) },
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
            id: 'issue-invoice',
            label: 'Émettre facture',
            endpoint: '/api/angelcare360/operator/billing',
            operation: 'issue',
            entity: 'invoice',
            submitLabel: 'Émettre',
            successMessage: 'Facture émise.',
            fields: [
              { name: 'id', label: 'Facture', kind: 'select', required: true, options: invoiceOptions },
            ],
          },
          {
            id: 'record-payment',
            label: 'Enregistrer paiement',
            endpoint: '/api/angelcare360/operator/billing',
            operation: 'record',
            entity: 'payment',
            submitLabel: 'Enregistrer',
            successMessage: 'Paiement enregistré.',
            fields: [
              { name: 'clientId', label: 'Client', kind: 'readonly', required: true, defaultValue: String(client.id) },
              { name: 'invoiceId', label: 'Facture', kind: 'select', options: invoiceOptions },
              { name: 'paymentReference', label: 'Référence paiement', kind: 'text', required: true },
              { name: 'paymentDate', label: 'Date de paiement', kind: 'date', required: true },
              { name: 'amountMad', label: 'Montant MAD', kind: 'number', required: true },
              { name: 'method', label: 'Méthode', kind: 'select', required: true, options: [{ label: 'Virement bancaire', value: 'bank_transfer' }, { label: 'Espèces', value: 'cash' }, { label: 'Chèque', value: 'cheque' }, { label: 'Carte manuelle', value: 'card_manual' }, { label: 'Autre', value: 'other' }] },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'En attente', value: 'pending' }, { label: 'Confirmé', value: 'confirmed' }, { label: 'Rejeté', value: 'rejected' }, { label: 'Remboursé', value: 'refunded' }, { label: 'Annulé', value: 'cancelled' }] },
              { name: 'notes', label: 'Notes', kind: 'textarea', rows: 2 },
            ],
          },
          {
            id: 'confirm-payment',
            label: 'Confirmer paiement',
            endpoint: '/api/angelcare360/operator/billing',
            operation: 'confirm',
            entity: 'payment',
            tone: 'primary',
            submitLabel: 'Confirmer',
            successMessage: 'Paiement confirmé.',
            fields: [
              { name: 'id', label: 'Paiement', kind: 'select', required: true, options: paymentOptions },
            ],
          },
          {
            id: 'reject-payment',
            label: 'Rejeter paiement',
            endpoint: '/api/angelcare360/operator/billing',
            operation: 'reject',
            entity: 'payment',
            tone: 'danger',
            submitLabel: 'Rejeter',
            successMessage: 'Paiement rejeté.',
            confirmTitle: 'Rejet de paiement',
            confirmMessage: 'Le rejet maintient le suivi du paiement dans l’historique interne.',
            fields: [
              { name: 'id', label: 'Paiement', kind: 'select', required: true, options: paymentOptions },
              { name: 'reason', label: 'Motif', kind: 'textarea', rows: 3, required: true },
            ],
          },
          {
            id: 'create-onboarding',
            label: 'Tâche onboarding',
            endpoint: '/api/angelcare360/operator/onboarding',
            operation: 'create',
            submitLabel: 'Créer la tâche',
            successMessage: 'Tâche onboarding créée.',
            fields: [
              { name: 'clientId', label: 'Client', kind: 'readonly', required: true, defaultValue: String(client.id) },
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
            id: 'create-support',
            label: 'Ouvrir ticket support',
            endpoint: '/api/angelcare360/operator/support',
            operation: 'create',
            submitLabel: 'Créer le ticket',
            successMessage: 'Ticket support créé.',
            fields: [
              { name: 'clientId', label: 'Client', kind: 'readonly', required: true, defaultValue: String(client.id) },
              { name: 'tenantId', label: 'Tenant', kind: 'select', options: tenantOptions },
              { name: 'subject', label: 'Sujet', kind: 'text', required: true },
              { name: 'description', label: 'Description', kind: 'textarea', rows: 4, required: true },
              { name: 'category', label: 'Catégorie', kind: 'text', required: true },
              { name: 'priority', label: 'Priorité', kind: 'select', required: true, options: [{ label: 'Basse', value: 'low' }, { label: 'Normale', value: 'normal' }, { label: 'Haute', value: 'high' }, { label: 'Urgente', value: 'urgent' }] },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'Nouvelle', value: 'new' }, { label: 'Triage', value: 'triage' }, { label: 'Assignée', value: 'assigned' }, { label: 'En attente client', value: 'waiting_client' }, { label: 'En attente interne', value: 'waiting_internal' }, { label: 'Résolue', value: 'resolved' }, { label: 'Clôturée', value: 'closed' }, { label: 'Archivée', value: 'archived' }] },
            ],
          },
          {
            id: 'create-contract',
            label: 'Créer contrat',
            endpoint: '/api/angelcare360/operator/contracts',
            operation: 'create',
            submitLabel: 'Créer le contrat',
            successMessage: 'Contrat créé.',
            fields: [
              { name: 'clientId', label: 'Client', kind: 'readonly', required: true, defaultValue: String(client.id) },
              { name: 'subscriptionId', label: 'Abonnement', kind: 'select', options: subscriptionOptions },
              { name: 'contractCode', label: 'Code contrat', kind: 'text', required: true },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'Brouillon', value: 'draft' }, { label: 'Envoyé', value: 'sent' }, { label: 'Signé', value: 'signed' }, { label: 'Actif', value: 'active' }, { label: 'Expiré', value: 'expired' }, { label: 'Annulé', value: 'cancelled' }, { label: 'Archivé', value: 'archived' }] },
              { name: 'startDate', label: 'Début', kind: 'date', required: true },
              { name: 'endDate', label: 'Fin', kind: 'date' },
              { name: 'renewalDate', label: 'Renouvellement', kind: 'date' },
              { name: 'signedAt', label: 'Signé le', kind: 'date' },
              { name: 'documentUrl', label: 'URL document', kind: 'text' },
              { name: 'notes', label: 'Notes', kind: 'textarea', rows: 3 },
            ],
          },
          {
            id: 'update-contract-status',
            label: 'Statut contrat',
            endpoint: '/api/angelcare360/operator/contracts',
            operation: 'status',
            submitLabel: 'Mettre à jour',
            successMessage: 'Statut contrat mis à jour.',
            fields: [
              { name: 'id', label: 'Contrat', kind: 'select', required: true, options: contractOptions },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'Brouillon', value: 'draft' }, { label: 'Envoyé', value: 'sent' }, { label: 'Signé', value: 'signed' }, { label: 'Actif', value: 'active' }, { label: 'Expiré', value: 'expired' }, { label: 'Annulé', value: 'cancelled' }, { label: 'Archivé', value: 'archived' }] },
            ],
          },
          {
            id: 'create-renewal',
            label: 'Créer renouvellement',
            endpoint: '/api/angelcare360/operator/renewals',
            operation: 'create',
            submitLabel: 'Créer',
            successMessage: 'Renouvellement créé.',
            fields: [
              { name: 'clientId', label: 'Client', kind: 'readonly', required: true, defaultValue: String(client.id) },
              { name: 'subscriptionId', label: 'Abonnement', kind: 'select', options: subscriptionOptions },
              { name: 'renewalDate', label: 'Date de renouvellement', kind: 'date', required: true },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'À venir', value: 'upcoming' }, { label: 'En discussion', value: 'in_discussion' }, { label: 'Proposition envoyée', value: 'proposal_sent' }, { label: 'Renouvelé', value: 'renewed' }, { label: 'À risque', value: 'at_risk' }, { label: 'Perdu', value: 'lost' }, { label: 'Annulé', value: 'cancelled' }] },
              { name: 'probability', label: 'Probabilité', kind: 'number' },
              { name: 'expectedAmountMad', label: 'Montant attendu MAD', kind: 'number' },
              { name: 'ownerId', label: 'Responsable', kind: 'text' },
              { name: 'notes', label: 'Notes', kind: 'textarea', rows: 3 },
            ],
          },
          {
            id: 'create-payment-gate',
            label: 'Créer gate paiement',
            endpoint: '/api/angelcare360/operator/payment-gates',
            operation: 'create',
            submitLabel: 'Créer',
            successMessage: 'Gate de paiement créé.',
            fields: [
              { name: 'clientId', label: 'Client', kind: 'readonly', required: true, defaultValue: String(client.id) },
              { name: 'tenantId', label: 'Tenant', kind: 'select', options: tenantOptions },
              { name: 'invoiceId', label: 'Facture', kind: 'select', options: invoiceOptions },
              { name: 'subscriptionId', label: 'Abonnement', kind: 'select', options: subscriptionOptions },
              { name: 'gateCode', label: 'Code gate', kind: 'text', required: true },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'Actif', value: 'active' }, { label: 'Traitement en ligne', value: 'online_processing' }, { label: 'Validation manuelle', value: 'manual_pending' }, { label: 'Traité', value: 'processed' }, { label: 'Levée', value: 'waived' }, { label: 'Annulé', value: 'cancelled' }, { label: 'Expiré', value: 'expired' }] },
              { name: 'amountDueMad', label: 'Montant dû MAD', kind: 'number', required: true },
              { name: 'currency', label: 'Devise', kind: 'text', placeholder: 'MAD' },
              { name: 'reason', label: 'Motif', kind: 'textarea', rows: 3, required: true },
              { name: 'dueDate', label: 'Date d’échéance', kind: 'date' },
              { name: 'blocking', label: 'Blocage', kind: 'select', required: true, options: [{ label: 'Bloquant', value: 'true' }, { label: 'Non bloquant', value: 'false' }] },
              { name: 'providerKey', label: 'Clé fournisseur', kind: 'text' },
              { name: 'checkoutUrl', label: 'Lien de paiement', kind: 'text' },
              { name: 'onlinePaymentReference', label: 'Référence en ligne', kind: 'text' },
            ],
          },
          {
            id: 'gate-manual-pending',
            label: 'Gate attente manuelle',
            endpoint: '/api/angelcare360/operator/payment-gates',
            operation: 'manual_pending',
            submitLabel: 'Marquer en attente',
            successMessage: 'Gate marqué en attente manuelle.',
            fields: [{ name: 'id', label: 'Gate', kind: 'select', required: true, options: paymentGateOptions }],
          },
          {
            id: 'gate-manual-processed',
            label: 'Gate traité manuellement',
            endpoint: '/api/angelcare360/operator/payment-gates',
            operation: 'manual_processed',
            submitLabel: 'Marquer traité',
            successMessage: 'Gate traité manuellement.',
            fields: [
              { name: 'id', label: 'Gate', kind: 'select', required: true, options: paymentGateOptions },
              { name: 'resolutionReason', label: 'Raison', kind: 'textarea', rows: 2, required: true },
            ],
          },
          {
            id: 'waive-payment-gate',
            label: 'Lever gate',
            endpoint: '/api/angelcare360/operator/payment-gates',
            operation: 'waive',
            tone: 'secondary',
            submitLabel: 'Lever',
            successMessage: 'Gate levé.',
            fields: [
              { name: 'id', label: 'Gate', kind: 'select', required: true, options: paymentGateOptions },
              { name: 'resolutionReason', label: 'Raison', kind: 'textarea', rows: 2, required: true },
            ],
          },
          {
            id: 'cancel-payment-gate',
            label: 'Annuler gate',
            endpoint: '/api/angelcare360/operator/payment-gates',
            operation: 'cancel',
            tone: 'danger',
            submitLabel: 'Annuler',
            successMessage: 'Gate annulé.',
            fields: [
              { name: 'id', label: 'Gate', kind: 'select', required: true, options: paymentGateOptions },
              { name: 'resolutionReason', label: 'Motif', kind: 'textarea', rows: 2, required: true },
            ],
          },
          {
            id: 'add-note',
            label: 'Ajouter note',
            endpoint: '/api/angelcare360/operator/service',
            operation: 'create',
            entity: 'note',
            submitLabel: 'Ajouter la note',
            successMessage: 'Note ajoutée.',
            fields: [
              { name: 'clientId', label: 'Client', kind: 'readonly', required: true, defaultValue: String(client.id) },
              { name: 'tenantId', label: 'Tenant', kind: 'select', options: tenantOptions },
              { name: 'authorId', label: 'Auteur', kind: 'text' },
              { name: 'noteType', label: 'Type de note', kind: 'text', required: true },
              { name: 'body', label: 'Contenu', kind: 'textarea', rows: 4, required: true },
              { name: 'visibility', label: 'Visibilité', kind: 'select', required: true, options: [{ label: 'Interne', value: 'internal' }, { label: 'Restreinte', value: 'restricted' }, { label: 'Publique', value: 'public' }] },
            ],
          },
        ]}
      />
      <Angelcare360OperatorDossierSection
        id="vue-densemble"
        eyebrow="Vue d’ensemble"
        title="Résumé exécutif du compte"
        subtitle="Les cartes ci-dessous donnent la lecture immédiate du dossier, tandis que les détails complets restent dans les sections dédiées plus bas."
      >
        <div style={overviewLayoutStyle}>
          <div style={overviewCardsGridStyle}>
            <article style={overviewCardStyle}>
              <div style={overviewCardEyebrowStyle}>Identité</div>
              <div style={overviewCardTitleStyle}>{String(client.legal_name || client.display_name)}</div>
              <div style={overviewCardTextStyle}>{String(client.client_type || 'Type non renseigné')}</div>
              <div style={overviewCardTextStyle}>{String(client.city || 'Ville non renseignée')} · {String(client.country || 'Maroc')}</div>
              <div style={overviewCardTextStyle}>{String(client.primary_contact_name || 'Contact principal non renseigné')}</div>
            </article>
            <article style={overviewCardStyle}>
              <div style={overviewCardEyebrowStyle}>Accès SaaS</div>
              <div style={overviewCardTitleStyle}>{String(primaryTenant?.tenant_slug || 'Tenant non provisionné')}</div>
              <div style={overviewCardTextStyle}>Environnement: {String(primaryTenant?.environment || 'pilot')}</div>
              <div style={overviewCardTextStyle}>Centre de commande: {String(primaryTenant?.command_center_url || 'Non renseigné')}</div>
              <div style={overviewCardTextStyle}>Mise en ligne: {clientSinceLabel}</div>
            </article>
            <article style={overviewCardStyle}>
              <div style={overviewCardEyebrowStyle}>Facturation</div>
              <div style={overviewCardTitleStyle}>{billingAccount ? String(billingAccount.billing_name || 'Compte de facturation') : 'Aucun compte de facturation'}</div>
              <div style={overviewCardTextStyle}>{billingAccount ? String(billingAccount.billing_email || 'Email non renseigné') : 'Aucun compte de facturation chargé'}</div>
              <div style={overviewCardTextStyle}>Dernière facture: {latestInvoice ? String(latestInvoice.invoice_number || latestInvoice.id) : 'Aucune'}</div>
              <div style={overviewCardTextStyle}>Dernier paiement: {latestPayment ? String(latestPayment.payment_reference || latestPayment.id) : 'Aucun'}</div>
            </article>
            <article style={overviewCardStyle}>
              <div style={overviewCardEyebrowStyle}>Exécution</div>
              <div style={overviewCardTitleStyle}>{String(activeSubscription?.subscription_code || 'Aucun abonnement actif')}</div>
              <div style={overviewCardTextStyle}>Support ouvert: {String(openSupportTickets.length)}</div>
              <div style={overviewCardTextStyle}>Gates actifs: {String(activePaymentGates.length)}</div>
              <div style={overviewCardTextStyle}>Prochaine échéance: {nextDueLabel}</div>
            </article>
          </div>

          <div style={overviewSideStackStyle}>
            <Angelcare360OperatorHealthPanel health={clientHealthDashboard} />
            <Angelcare360OperatorRightPanel title="Prochaines actions suggérées" subtitle="Liens réels vers les pages de suivi complet ou vers les actions opérateur à lancer depuis ce dossier.">
              <div style={suggestedLinksStyle}>
                <Link href="#factures" style={suggestedLinkStyle}>Voir les factures</Link>
                <Link href="#paiements" style={suggestedLinkStyle}>Voir les paiements</Link>
                <Link href="#gates-paiement" style={suggestedLinkStyle}>Voir les gates paiement</Link>
                <Link href="#support" style={suggestedLinkStyle}>Voir le support</Link>
                <Link href="#audit" style={suggestedLinkStyle}>Voir l’audit complet</Link>
              </div>
            </Angelcare360OperatorRightPanel>
            <Angelcare360OperatorActionQueue
              title="File prioritaire"
              items={[
                {
                  title: `${overdueInvoices.length} facture(s) en retard`,
                  detail: overdueAmountMad > 0 ? `Montant en retard: ${formatMad(overdueAmountMad)}` : 'Aucun retard visible.',
                  tone: overdueInvoices.length > 0 ? 'critical' : 'info',
                },
                {
                  title: `${openSupportTickets.length} ticket(s) ouvert(s)`,
                  detail: openSupportTickets.length > 0 ? 'Le support mérite une passe de suivi.' : 'Aucun ticket ouvert.',
                  tone: openSupportTickets.length > 0 ? 'warning' : 'info',
                },
                {
                  title: `${activePaymentGates.length} gate(s) actif(s)`,
                  detail: activePaymentGates.length > 0 ? 'Validation ou levée à traiter.' : 'Aucun gate actif.',
                  tone: activePaymentGates.length > 0 ? 'warning' : 'info',
                },
              ]}
            />
            <Angelcare360OperatorLockedPanel
              title="Fonctions verrouillées"
              message="Le paiement en ligne, l’email automatique et certains exports restent verrouillés tant que l’infrastructure dédiée n’est pas validée."
              note="Le suivi manuel, les notes opérateur et les validations internes restent disponibles."
            />
          </div>
        </div>
      </Angelcare360OperatorDossierSection>

      <section style={detailGridStyle}>
        <Angelcare360OperatorDossierSection
          id="identite"
          eyebrow="Identité"
          title="Identité juridique et contact"
          subtitle="Les champs sensibles sont visibles et éditables via les actions opérateur. Les modifications alimentent l’audit interne."
        >
          <div style={twoColumnCardsStyle}>
            <article style={detailCardStyle}>
              <div style={detailCardEyebrowStyle}>Identité légale</div>
              <div style={detailCardTitleStyle}>{String(client.legal_name || client.display_name)}</div>
              <div style={detailCardTextStyle}>Code client: {String(client.client_code || '—')}</div>
              <div style={detailCardTextStyle}>Type: {String(client.client_type || '—')}</div>
              <div style={detailCardTextStyle}>Ville / pays: {String(client.city || '—')} · {String(client.country || 'Maroc')}</div>
            </article>
            <article style={detailCardStyle}>
              <div style={detailCardEyebrowStyle}>Contact et gouvernance</div>
              <div style={detailCardTitleStyle}>{String(client.primary_contact_name || 'Contact principal non renseigné')}</div>
              <div style={detailCardTextStyle}>{String(client.primary_contact_email || 'Email non renseigné')}</div>
              <div style={detailCardTextStyle}>{String(client.primary_contact_phone || 'Téléphone non renseigné')}</div>
              <div style={detailCardTextStyle}>Santé: {String(client.health_status || '—')} · Risque: {String(client.risk_level || '—')}</div>
            </article>
          </div>
        </Angelcare360OperatorDossierSection>

        <Angelcare360OperatorDossierSection
          id="acces-saas"
          eyebrow="Accès SaaS"
          title="Tenant, environnement et accès"
          subtitle="Le tenant est affiché avec l’état de provisioning, le centre de commande et le go-live lorsqu’ils existent."
        >
          <div style={twoColumnCardsStyle}>
            <article style={detailCardStyle}>
              <div style={detailCardEyebrowStyle}>Tenant principal</div>
              <div style={detailCardTitleStyle}>{String(primaryTenant?.tenant_slug || 'Non provisionné')}</div>
              <div style={detailCardTextStyle}>Environnement: {String(primaryTenant?.environment || 'pilot')}</div>
              <div style={detailCardTextStyle}>Statut: {String(primaryTenant?.status || '—')}</div>
              <div style={detailCardTextStyle}>Provisioning: {String(primaryTenant?.provisioning_status || '—')}</div>
            </article>
            <article style={detailCardStyle}>
              <div style={detailCardEyebrowStyle}>Accès opérationnel</div>
              <div style={detailCardTitleStyle}>{String(primaryTenant?.command_center_url || 'URL non renseignée')}</div>
              <div style={detailCardTextStyle}>Mise en ligne: {clientSinceLabel}</div>
              <div style={detailCardTextStyle}>Abonnement actif: {activeSubscription ? String(activeSubscription.subscription_code || activeSubscription.id) : 'Aucun'}</div>
              <div style={detailCardTextStyle}>Plan actif: {activeSubscription ? String(activeSubscription.plan_id || '—') : '—'}</div>
            </article>
          </div>
        </Angelcare360OperatorDossierSection>

        <Angelcare360OperatorDossierSection
          id="facturation"
          eyebrow="Facturation"
          title="Compte et pression de facturation"
          subtitle="Le dossier présente un compte facturation, la pression de solde et les repères de cycle, sans charger l’historique complet."
        >
          <div style={threeColumnCardsStyle}>
            <article style={detailCardStyle}>
              <div style={detailCardEyebrowStyle}>Compte facturation</div>
              <div style={detailCardTitleStyle}>{billingAccount ? String(billingAccount.billing_name || 'Compte de facturation') : 'Aucun compte'}</div>
              <div style={detailCardTextStyle}>{billingAccount ? String(billingAccount.billing_email || 'Email non renseigné') : 'Aucun compte de facturation chargé'}</div>
              <div style={detailCardTextStyle}>Délais: {billingAccount ? `${String(billingAccount.payment_terms_days || '—')} jours` : '—'}</div>
            </article>
            <article style={detailCardStyle}>
              <div style={detailCardEyebrowStyle}>Encours</div>
              <div style={detailCardTitleStyle}>{formatMad(balanceDueMad)}</div>
              <div style={detailCardTextStyle}>Factures en retard: {String(overdueInvoices.length)}</div>
              <div style={detailCardTextStyle}>Paiements en attente: {String(pendingPayments.length)}</div>
            </article>
            <article style={detailCardStyle}>
              <div style={detailCardEyebrowStyle}>Échéance la plus proche</div>
              <div style={detailCardTitleStyle}>{nextDueLabel}</div>
              <div style={detailCardTextStyle}>MRR mensuel: {formatMad(mrrMad)}</div>
              <div style={detailCardTextStyle}>Gates actifs: {String(activePaymentGates.length)}</div>
            </article>
          </div>
        </Angelcare360OperatorDossierSection>

        <Angelcare360OperatorDossierSection
          id="abonnements"
          eyebrow="Abonnements"
          title="Abonnements du dossier"
          subtitle="Historique récent borné à cinq lignes. Les modifications passent par le panneau d’actions opérateur."
        >
          <Angelcare360OperatorDataTable
            title="Abonnements"
            rows={subscriptionRows}
            emptyTitle="Aucun abonnement"
            emptyDescription="Le client n’a pas encore d’abonnement actif ou historique."
            rowKey={(row) => String((row as Record<string, unknown>).id)}
            minWidth={760}
            columns={[
              { key: 'subscription_code', label: 'Code', render: (row) => String((row as Record<string, unknown>).subscription_code || '—') },
              { key: 'status', label: 'Statut', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).status || '—')} /> },
              { key: 'billing_cycle', label: 'Cycle', render: (row) => String((row as Record<string, unknown>).billing_cycle || '—') },
              { key: 'billing_amount_mad', label: 'Montant', align: 'right', render: (row) => formatMad((row as Record<string, unknown>).billing_amount_mad as number | string | null | undefined) },
            ]}
          />
        </Angelcare360OperatorDossierSection>

        <Angelcare360OperatorDossierSection
          id="factures"
          eyebrow="Factures"
          title="Factures récentes"
          subtitle="Chaque ligne ouvre l’impression A4 et les actions de facture réelles."
          actions={<Link href="/angelcare-360-operator/billing/invoices" style={sectionLinkStyle}>Voir toutes les factures</Link>}
        >
          <Angelcare360OperatorDataTable
            title="Factures"
            rows={invoiceRows}
            emptyTitle="Aucune facture"
            emptyDescription="Les factures du client apparaîtront ici après émission."
            rowKey={(row) => String((row as Record<string, unknown>).id)}
            hrefKey={(row) => `/angelcare-360-operator/billing/invoices/${String((row as Record<string, unknown>).id)}/print`}
            minWidth={860}
            columns={[
              { key: 'invoice_number', label: 'Facture', render: (row) => String((row as Record<string, unknown>).invoice_number || '—') },
              { key: 'status', label: 'Statut', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).status || '—')} /> },
              { key: 'due_date', label: 'Échéance', render: (row) => String((row as Record<string, unknown>).due_date || '—') },
              { key: 'balance_due_mad', label: 'Solde dû', align: 'right', render: (row) => formatMad((row as Record<string, unknown>).balance_due_mad as number | string | null | undefined) },
              {
                key: 'actions',
                label: 'Actions',
                render: (row) => {
                  const invoice = row as Record<string, unknown>
                  const invoiceId = String(invoice.id)
                  const invoiceNumber = String(invoice.invoice_number || invoice.id)
                  const balanceDueMad = Number(invoice.balance_due_mad || 0)
                  const subscriptionId = invoice.subscription_id ? String(invoice.subscription_id) : null
                  const gateCode = `AC360-GATE-${invoiceNumber.replace(/^AC360-INV-/, '').replace(/[^A-Z0-9]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || invoiceId.slice(-8)}`
                  const hasActiveGate = paymentGateRows.some((gate) => String(gate.invoice_id || '') === invoiceId)
                  return (
                    <Angelcare360OperatorInvoiceRowActions
                      invoiceId={invoiceId}
                      invoiceNumber={invoiceNumber}
                      clientId={String(client.id)}
                      clientLabel={clientLabel}
                      recipientEmail={billingRecipientEmail || null}
                      emailBridgeAvailable={emailBridgeAvailable}
                      balanceDueMad={balanceDueMad}
                      dueDate={invoice.due_date ? String(invoice.due_date) : null}
                      gateCode={gateCode}
                      subscriptionId={subscriptionId}
                      tenantId={primaryTenantId}
                      hasActiveGate={hasActiveGate}
                    />
                  )
                },
              },
            ]}
          />
        </Angelcare360OperatorDossierSection>

        <Angelcare360OperatorDossierSection
          id="paiements"
          eyebrow="Paiements"
          title="Paiements récents"
          subtitle="Les reçus A4 restent accessibles et l’envoi email dépend du bridge Email-OS réellement disponible."
          actions={<Link href="/angelcare-360-operator/billing/payments" style={sectionLinkStyle}>Voir tous les paiements</Link>}
        >
          <Angelcare360OperatorDataTable
            title="Paiements"
            rows={paymentRows}
            emptyTitle="Aucun paiement"
            emptyDescription="Les paiements manuels et les confirmations apparaîtront ici."
            rowKey={(row) => String((row as Record<string, unknown>).id)}
            hrefKey={(row) => `/angelcare-360-operator/billing/payments/${String((row as Record<string, unknown>).id)}/receipt-print`}
            minWidth={780}
            columns={[
              { key: 'payment_reference', label: 'Référence', render: (row) => String((row as Record<string, unknown>).payment_reference || '—') },
              { key: 'status', label: 'Statut', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).status || '—')} /> },
              { key: 'payment_date', label: 'Date', render: (row) => String((row as Record<string, unknown>).payment_date || '—') },
              { key: 'amount_mad', label: 'Montant', align: 'right', render: (row) => formatMad((row as Record<string, unknown>).amount_mad as number | string | null | undefined) },
              {
                key: 'actions',
                label: 'Actions',
                render: (row) => {
                  const payment = row as Record<string, unknown>
                  return (
                    <Angelcare360OperatorPaymentRowActions
                      paymentId={String(payment.id)}
                      paymentReference={String(payment.payment_reference || payment.id)}
                      recipientEmail={billingRecipientEmail || null}
                      emailBridgeAvailable={emailBridgeAvailable}
                    />
                  )
                },
              },
            ]}
          />
        </Angelcare360OperatorDossierSection>

        <Angelcare360OperatorDossierSection
          id="gates-paiement"
          eyebrow="Gates paiement"
          title="Blocages et validations de paiement"
          subtitle="Seuls les gates actifs et utiles au dossier sont visibles ici. Le comportement manuel reste disponible depuis les actions opérateur."
        >
          <div style={twoColumnCardsStyle}>
            <Angelcare360OperatorDataTable
              title="Gates paiement"
              rows={paymentGateRows}
              emptyTitle="Aucun gate paiement"
              emptyDescription="Les contrôles de paiement apparaîtront ici lorsqu’un blocage est créé."
              rowKey={(row) => String((row as Record<string, unknown>).id)}
              minWidth={760}
              columns={[
                { key: 'gate_code', label: 'Gate', render: (row) => String((row as Record<string, unknown>).gate_code || '—') },
                { key: 'status', label: 'Statut', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).status || '—')} /> },
                { key: 'amount_due_mad', label: 'Montant dû', align: 'right', render: (row) => formatMad((row as Record<string, unknown>).amount_due_mad as number | string | null | undefined) },
                { key: 'due_date', label: 'Échéance', render: (row) => String((row as Record<string, unknown>).due_date || '—') },
                { key: 'reason', label: 'Motif', render: (row) => String((row as Record<string, unknown>).reason || '—') },
                { key: 'blocking', label: 'Blocage', render: (row) => String((row as Record<string, unknown>).blocking ? 'Oui' : 'Non') },
              ]}
            />
            <Angelcare360OperatorRightPanel title="Recouvrement" subtitle="Repères immédiats pour la relance et la pression de paiement.">
              <div style={recouvrementStackStyle}>
                <div style={recouvrementMetricStyle}>
                  <div style={recouvrementMetricLabelStyle}>Montant en retard</div>
                  <div style={recouvrementMetricValueStyle}>{formatMad(overdueAmountMad)}</div>
                </div>
                <div style={recouvrementMetricStyle}>
                  <div style={recouvrementMetricLabelStyle}>Factures en retard</div>
                  <div style={recouvrementMetricValueStyle}>{String(overdueInvoices.length)}</div>
                </div>
                <div style={recouvrementMetricStyle}>
                  <div style={recouvrementMetricLabelStyle}>Action recommandée</div>
                  <div style={recouvrementMetricValueStyle}>{activePaymentGates.length > 0 ? 'Gate ou validation manuelle' : 'Relance classique'}</div>
                </div>
                <div style={recouvrementLinkRowStyle}>
                  <Link href="#factures" style={sectionLinkStyle}>Voir les factures</Link>
                  <Link href="#paiements" style={sectionLinkStyle}>Voir les paiements</Link>
                </div>
              </div>
            </Angelcare360OperatorRightPanel>
          </div>
        </Angelcare360OperatorDossierSection>

        <Angelcare360OperatorDossierSection
          id="recouvrement"
          eyebrow="Recouvrement"
          title="Suivi des relances"
          subtitle="Le dossier affiche ici les indicateurs liés au retard, à la relance et à la pression de paiement."
        >
          <div style={threeColumnCardsStyle}>
            <article style={detailCardStyle}>
              <div style={detailCardEyebrowStyle}>Retard global</div>
              <div style={detailCardTitleStyle}>{formatMad(overdueAmountMad)}</div>
              <div style={detailCardTextStyle}>Factures en retard: {String(overdueInvoices.length)}</div>
            </article>
            <article style={detailCardStyle}>
              <div style={detailCardEyebrowStyle}>Signal de pression</div>
              <div style={detailCardTitleStyle}>{String(activePaymentGates.length > 0 ? 'Présent' : 'Absent')}</div>
              <div style={detailCardTextStyle}>{String(activePaymentGates.length)} gate(s) actif(s)</div>
            </article>
            <article style={detailCardStyle}>
              <div style={detailCardEyebrowStyle}>Prochaine date utile</div>
              <div style={detailCardTitleStyle}>{nextDueLabel}</div>
              <div style={detailCardTextStyle}>Dernière activité: {formatClientShortDate((latestAuditEvent?.created_at as string | undefined) || null)}</div>
            </article>
          </div>
        </Angelcare360OperatorDossierSection>

        <Angelcare360OperatorDossierSection
          id="support"
          eyebrow="Support"
          title="Tickets support et onboarding"
          subtitle="Les tickets et les tâches d’implémentation restent bornés à quelques lignes récentes, avec accès au détail complet ailleurs."
          actions={<Link href="/angelcare-360-operator/support" style={sectionLinkStyle}>Voir les tickets support</Link>}
        >
          <div style={twoColumnCardsStyle}>
            <Angelcare360OperatorDataTable
              title="Support"
              rows={supportRows}
              emptyTitle="Aucun ticket support"
              emptyDescription="Les tickets support client sont suivis ici."
              rowKey={(row) => String((row as Record<string, unknown>).id)}
              minWidth={760}
              columns={[
                { key: 'subject', label: 'Sujet', render: (row) => String((row as Record<string, unknown>).subject || '—') },
                { key: 'priority', label: 'Priorité', render: (row) => String((row as Record<string, unknown>).priority || '—') },
                { key: 'status', label: 'Statut', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).status || '—')} /> },
                { key: 'resolution_summary', label: 'Résolution', render: (row) => String((row as Record<string, unknown>).resolution_summary || '—') },
              ]}
            />
            <Angelcare360OperatorDataTable
              title="Onboarding"
              rows={onboardingRows}
              emptyTitle="Aucune tâche onboarding"
              emptyDescription="Les tâches d’implémentation s’afficheront ici."
              rowKey={(row) => String((row as Record<string, unknown>).id)}
              minWidth={700}
              columns={[
                { key: 'title', label: 'Tâche', render: (row) => String((row as Record<string, unknown>).title || '—') },
                { key: 'status', label: 'Statut', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).status || '—')} /> },
                { key: 'priority', label: 'Priorité', render: (row) => String((row as Record<string, unknown>).priority || '—') },
                { key: 'due_date', label: 'Échéance', render: (row) => String((row as Record<string, unknown>).due_date || '—') },
              ]}
            />
          </div>
        </Angelcare360OperatorDossierSection>

        <Angelcare360OperatorDossierSection
          id="contrats"
          eyebrow="Contrats"
          title="Contrats et engagement"
          subtitle="Les contrats restent visibles dans leur état réel, avec une synthèse de signature et de renouvellement."
          actions={<Link href="/angelcare-360-operator/contracts" style={sectionLinkStyle}>Voir les contrats</Link>}
        >
          <Angelcare360OperatorDataTable
            title="Contrats"
            rows={contractRows}
            emptyTitle="Aucun contrat"
            emptyDescription="Les contrats client apparaîtront ici avec leurs métadonnées."
            rowKey={(row) => String((row as Record<string, unknown>).id)}
            minWidth={760}
            columns={[
              { key: 'contract_code', label: 'Contrat', render: (row) => String((row as Record<string, unknown>).contract_code || '—') },
              { key: 'status', label: 'Statut', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).status || '—')} /> },
              { key: 'renewal_date', label: 'Renouvellement', render: (row) => String((row as Record<string, unknown>).renewal_date || '—') },
              { key: 'signed_at', label: 'Signature', render: (row) => String((row as Record<string, unknown>).signed_at || '—') },
            ]}
          />
        </Angelcare360OperatorDossierSection>

        <Angelcare360OperatorDossierSection
          id="renouvellements"
          eyebrow="Renouvellements"
          title="Pipeline de renouvellement"
          subtitle="La pression commerciale et le niveau de probabilité restent visibles sans charger tout le pipeline historique."
          actions={<Link href="/angelcare-360-operator/renewals" style={sectionLinkStyle}>Voir les renouvellements</Link>}
        >
          <Angelcare360OperatorDataTable
            title="Renouvellements"
            rows={renewalRows}
            emptyTitle="Aucun renouvellement"
            emptyDescription="Le pipeline de renouvellement sera visible ici."
            rowKey={(row) => String((row as Record<string, unknown>).id)}
            minWidth={760}
            columns={[
              { key: 'renewal_date', label: 'Date', render: (row) => String((row as Record<string, unknown>).renewal_date || '—') },
              { key: 'status', label: 'Statut', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).status || '—')} /> },
              { key: 'probability', label: 'Probabilité', render: (row) => `${Number((row as Record<string, unknown>).probability || 0)}%` },
              { key: 'expected_amount_mad', label: 'Montant attendu', align: 'right', render: (row) => formatMad((row as Record<string, unknown>).expected_amount_mad as number | string | null | undefined) },
            ]}
          />
        </Angelcare360OperatorDossierSection>

        <Angelcare360OperatorDossierSection
          id="service"
          eyebrow="Événements de service"
          title="Derniers événements de service"
          subtitle="L’historique de service est borné à dix lignes pour éviter les chargements massifs."
          actions={<Link href="/angelcare-360-operator/service-operations" style={sectionLinkStyle}>Voir les événements de service</Link>}
        >
          <div style={twoColumnCardsStyle}>
            <Angelcare360OperatorDataTable
              title="Événements de service"
              rows={serviceRows}
              emptyTitle="Aucun événement"
              emptyDescription="Les incidents et événements de service apparaîtront ici."
              rowKey={(row) => String((row as Record<string, unknown>).id)}
              minWidth={700}
              columns={[
                { key: 'title', label: 'Titre', render: (row) => String((row as Record<string, unknown>).title || '—') },
                { key: 'event_type', label: 'Type', render: (row) => String((row as Record<string, unknown>).event_type || '—') },
                { key: 'severity', label: 'Sévérité', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).severity || '—')} /> },
                { key: 'status', label: 'Statut', render: (row) => String((row as Record<string, unknown>).status || '—') },
              ]}
            />
            <Angelcare360OperatorRightPanel title="Repères opérationnels" subtitle="La lecture rapide du dossier reste possible même sans ouvrir les historiques détaillés.">
              <div style={recouvrementStackStyle}>
                <div style={recouvrementMetricStyle}>
                  <div style={recouvrementMetricLabelStyle}>Dernier service</div>
                  <div style={recouvrementMetricValueStyle}>{latestServiceEvent ? String(latestServiceEvent.title || latestServiceEvent.event_type || '—') : 'Aucun'}</div>
                </div>
                <div style={recouvrementMetricStyle}>
                  <div style={recouvrementMetricLabelStyle}>Dernier audit</div>
                  <div style={recouvrementMetricValueStyle}>{latestAuditEvent ? String(latestAuditEvent.action || '—') : 'Aucun'}</div>
                </div>
                <div style={recouvrementMetricStyle}>
                  <div style={recouvrementMetricLabelStyle}>Horodatage</div>
                  <div style={recouvrementMetricValueStyle}>{formatClientShortDate((latestAuditEvent?.created_at as string | undefined) || null)}</div>
                </div>
              </div>
            </Angelcare360OperatorRightPanel>
          </div>
        </Angelcare360OperatorDossierSection>

        <Angelcare360OperatorDossierSection
          id="audit"
          eyebrow="Audit"
          title="Journal d’audit récent"
          subtitle="Le dossier expose les dix derniers événements d’audit, avec un accès direct au journal complet."
          actions={<Link href="/angelcare-360-operator/audit" style={sectionLinkStyle}>Voir l’audit complet</Link>}
        >
          <Angelcare360OperatorDataTable
            title="Audit"
            rows={auditRows}
            emptyTitle="Aucun événement d’audit"
            emptyDescription="Les actions opérateur seront journalisées ici."
            rowKey={(row) => String((row as Record<string, unknown>).id)}
            minWidth={820}
            columns={[
              { key: 'module', label: 'Module', render: (row) => String((row as Record<string, unknown>).module || '—') },
              { key: 'action', label: 'Action', render: (row) => String((row as Record<string, unknown>).action || '—') },
              { key: 'severity', label: 'Sévérité', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).severity || '—')} /> },
              { key: 'created_at', label: 'Horodatage', render: (row) => String((row as Record<string, unknown>).created_at || '—') },
            ]}
          />
        </Angelcare360OperatorDossierSection>
      </section>
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

const metaChipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  padding: '6px 10px',
  background: '#eff6ff',
  color: '#1d4ed8',
  fontWeight: 900,
}

const secondaryActionsStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  alignItems: 'center',
  justifyContent: 'end',
}

const secondaryLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 14,
  border: '1px solid #dbe4ef',
  background: '#fff',
  color: '#0f172a',
  textDecoration: 'none',
  padding: '10px 14px',
  fontWeight: 800,
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

const summaryGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 12,
}

const quickLinksStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
  marginBottom: 12,
}

const quickLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  padding: '9px 12px',
  background: '#eff6ff',
  border: '1px solid #bfdbfe',
  color: '#1d4ed8',
  textDecoration: 'none',
  fontWeight: 850,
}

const summaryNoticeStyle: React.CSSProperties = {
  borderRadius: 18,
  border: '1px solid #cbd5e1',
  background: 'linear-gradient(180deg, rgba(255,255,255,.96) 0%, rgba(241,245,249,.96) 100%)',
  color: '#334155',
  padding: '12px 14px',
  fontWeight: 700,
  lineHeight: 1.6,
  marginBottom: 16,
}

const cardStyle: React.CSSProperties = {
  borderRadius: 24,
  border: '1px solid #dbe4ef',
  background: '#fff',
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
  padding: 20,
  display: 'grid',
  gap: 8,
}

const labelStyle: React.CSSProperties = {
  color: '#2563eb',
  textTransform: 'uppercase',
  letterSpacing: 1.1,
  fontSize: 12,
  fontWeight: 900,
}

const headingStyle: React.CSSProperties = {
  margin: 0,
  color: '#0f172a',
  fontSize: 20,
  fontWeight: 950,
}

const textStyle: React.CSSProperties = {
  margin: 0,
  color: '#475569',
  lineHeight: 1.65,
  fontWeight: 600,
}

const statusRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
}

const detailGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 16,
}

const heroActionsStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
}

const heroActionLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 14,
  padding: '10px 14px',
  background: ANGELCARE360_OPERATOR_COLORS.navy,
  color: ANGELCARE360_OPERATOR_COLORS.white,
  textDecoration: 'none',
  fontWeight: 850,
  boxShadow: '0 12px 24px rgba(15,23,42,.12)',
}

const heroActionSecondaryStyle: React.CSSProperties = {
  ...heroActionLinkStyle,
  background: ANGELCARE360_OPERATOR_COLORS.white,
  color: ANGELCARE360_OPERATOR_COLORS.navy,
  border: `1px solid ${ANGELCARE360_OPERATOR_COLORS.border}`,
  boxShadow: '0 10px 22px rgba(15,23,42,.04)',
}

const detailLinkRailStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

const detailLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  border: `1px solid ${ANGELCARE360_OPERATOR_COLORS.blueBorder}`,
  background: ANGELCARE360_OPERATOR_COLORS.blueSoft,
  color: ANGELCARE360_OPERATOR_COLORS.blueDeep,
  textDecoration: 'none',
  padding: '10px 14px',
  fontWeight: 850,
}

const detailLinkPrimaryStyle: React.CSSProperties = {
  ...detailLinkStyle,
  background: ANGELCARE360_OPERATOR_COLORS.navy,
  color: ANGELCARE360_OPERATOR_COLORS.white,
  borderColor: ANGELCARE360_OPERATOR_COLORS.navy,
}

const sectionLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 14,
  border: `1px solid ${ANGELCARE360_OPERATOR_COLORS.border}`,
  background: ANGELCARE360_OPERATOR_COLORS.white,
  color: ANGELCARE360_OPERATOR_COLORS.blueDeep,
  textDecoration: 'none',
  padding: '9px 12px',
  fontWeight: 850,
}

const overviewLayoutStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, .9fr)',
  gap: 16,
  alignItems: 'start',
}

const overviewCardsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 12,
}

const overviewCardStyle: React.CSSProperties = {
  borderRadius: 24,
  border: `1px solid ${ANGELCARE360_OPERATOR_COLORS.border}`,
  background:
    'linear-gradient(180deg, rgba(255,255,255,.99) 0%, rgba(248,250,252,.98) 100%)',
  boxShadow: '0 16px 40px rgba(15,23,42,.04)',
  padding: 16,
  display: 'grid',
  gap: 6,
}

const overviewCardEyebrowStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.blue,
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontSize: 11,
  fontWeight: 900,
}

const overviewCardTitleStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.navy,
  fontWeight: 950,
  fontSize: 18,
  lineHeight: 1.25,
}

const overviewCardTextStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.slate,
  lineHeight: 1.55,
  fontWeight: 600,
}

const overviewSideStackStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
}

const suggestedLinksStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
}

const suggestedLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 14,
  border: `1px solid ${ANGELCARE360_OPERATOR_COLORS.border}`,
  background: ANGELCARE360_OPERATOR_COLORS.white,
  color: ANGELCARE360_OPERATOR_COLORS.navy,
  textDecoration: 'none',
  padding: '10px 12px',
  fontWeight: 850,
}

const twoColumnCardsStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 12,
}

const threeColumnCardsStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 12,
}

const detailCardStyle: React.CSSProperties = {
  borderRadius: 24,
  border: `1px solid ${ANGELCARE360_OPERATOR_COLORS.border}`,
  background:
    'linear-gradient(180deg, rgba(255,255,255,.99) 0%, rgba(248,250,252,.98) 100%)',
  boxShadow: '0 16px 40px rgba(15,23,42,.04)',
  padding: 16,
  display: 'grid',
  gap: 8,
}

const detailCardEyebrowStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.blue,
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontSize: 11,
  fontWeight: 900,
}

const detailCardTitleStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.navy,
  fontSize: 18,
  fontWeight: 950,
  lineHeight: 1.25,
}

const detailCardTextStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.slate,
  lineHeight: 1.55,
  fontWeight: 600,
}

const recouvrementStackStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
}

const recouvrementMetricStyle: React.CSSProperties = {
  borderRadius: 18,
  border: `1px solid ${ANGELCARE360_OPERATOR_COLORS.borderSoft}`,
  background: ANGELCARE360_OPERATOR_COLORS.background,
  padding: 12,
  display: 'grid',
  gap: 4,
}

const recouvrementMetricLabelStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.slateMuted,
  textTransform: 'uppercase',
  letterSpacing: 0.8,
  fontSize: 11,
  fontWeight: 900,
}

const recouvrementMetricValueStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.navy,
  fontWeight: 900,
  lineHeight: 1.45,
}

const recouvrementLinkRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
}
