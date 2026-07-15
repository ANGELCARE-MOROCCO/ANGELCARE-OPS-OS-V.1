import Link from 'next/link'
import { notFound } from 'next/navigation'
import Angelcare360OperatorActionDrawer from '@/components/angelcare360/operator/Angelcare360OperatorActionDrawer'
import Angelcare360OperatorActionQueue from '@/components/angelcare360/operator/Angelcare360OperatorActionQueue'
import Angelcare360OperatorDataTable from '@/components/angelcare360/operator/Angelcare360OperatorDataTable'
import Angelcare360OperatorKpiCard from '@/components/angelcare360/operator/Angelcare360OperatorKpiCard'
import Angelcare360OperatorLockedPanel from '@/components/angelcare360/operator/Angelcare360OperatorLockedPanel'
import Angelcare360OperatorPageShell from '@/components/angelcare360/operator/Angelcare360OperatorPageShell'
import Angelcare360OperatorRightPanel from '@/components/angelcare360/operator/Angelcare360OperatorRightPanel'
import Angelcare360OperatorStatusBadge from '@/components/angelcare360/operator/Angelcare360OperatorStatusBadge'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'
import { listOperatorBillingAccounts, listOperatorDunningActions, listOperatorInvoices, listOperatorPayments } from '@/lib/angelcare360/operator/billing'
import { listOperatorClients } from '@/lib/angelcare360/operator/clients'
import { listOperatorPaymentGates } from '@/lib/angelcare360/operator/payment-gates'
import { listOperatorSubscriptions } from '@/lib/angelcare360/operator/subscriptions'

export const dynamic = 'force-dynamic'

export default async function Angelcare360OperatorBillingPage() {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()

  const [invoices, payments, dunning, clients, subscriptions, billingAccounts, paymentGates] = await Promise.all([
    listOperatorInvoices(),
    listOperatorPayments(),
    listOperatorDunningActions(),
    listOperatorClients(),
    listOperatorSubscriptions(),
    listOperatorBillingAccounts(),
    listOperatorPaymentGates(),
  ])

  const confirmedPayments = payments.filter((payment) => String(payment.status) === 'confirmed')
  const overdueInvoices = invoices.filter((invoice) => String(invoice.status) === 'overdue')
  const unpaidBalance = invoices.reduce((sum, invoice) => sum + Number(invoice.balance_due_mad || 0), 0)
  const totalBilled = invoices.reduce((sum, invoice) => sum + Number(invoice.total_mad || 0), 0)
  const totalPaid = confirmedPayments.reduce((sum, payment) => sum + Number(payment.amount_mad || 0), 0)
  const clientOptions = clients.map((client) => ({ label: `${String(client.display_name || 'Client')} · ${String(client.client_code || client.id)}`, value: String(client.id) }))
  const subscriptionOptions = subscriptions.map((subscription) => ({ label: `${String(subscription.subscription_code || subscription.id)} · ${String(subscription.status || '—')}`, value: String(subscription.id) }))
  const invoiceOptions = invoices.map((invoice) => ({ label: `${String(invoice.invoice_number || invoice.id)} · ${String(invoice.status || '—')}`, value: String(invoice.id) }))
  const paymentOptions = payments.map((payment) => ({ label: `${String(payment.payment_reference || payment.id)} · ${String(payment.status || '—')}`, value: String(payment.id) }))
  const billingAccountOptions = billingAccounts.map((account) => ({ label: `${String(account.billing_name || account.id)} · ${String(account.status || '—')}`, value: String(account.id) }))
  const paymentGateOptions = paymentGates.map((gate) => ({ label: `${String(gate.gate_code || gate.id)} · ${String(gate.status || '—')}`, value: String(gate.id) }))

  return (
    <Angelcare360OperatorPageShell
      badge="Facturation AngelCare"
      statusLabel={`${invoices.length} facture(s)`}
      title="Cockpit facturation SaaS"
      subtitle="Pilotage des factures clients, paiements manuels, encours et actions de recouvrement internes."
      primaryAction={<Link href="/angelcare-360-operator/billing/invoices" style={linkStyle}>Factures</Link>}
      secondaryActions={
        <div style={secondaryActionsStyle}>
          <Link href="/angelcare-360-operator/billing/payments" style={secondaryLinkStyle}>Paiements</Link>
          <Link href="/api/angelcare360/exports/download?exportKey=operator-clients-csv" style={downloadLinkStyle}>Clients CSV</Link>
          <Link href="/api/angelcare360/exports/download?exportKey=operator-invoices-csv" style={downloadLinkStyle}>Factures CSV</Link>
          <Link href="/api/angelcare360/exports/download?exportKey=operator-payments-csv" style={downloadLinkStyle}>Paiements CSV</Link>
        </div>
      }
      contextRow={
        <>
          <span style={contextPillStyle}>Émises: {invoices.length}</span>
          <span style={contextPillStyle}>En retard: {overdueInvoices.length}</span>
          <span style={contextPillStyle}>Encaissé: {totalPaid.toLocaleString('fr-FR')} MAD</span>
          <span style={contextPillStyle}>Impayé: {unpaidBalance.toLocaleString('fr-FR')} MAD</span>
        </>
      }
    >
      <Angelcare360OperatorActionDrawer
        title="Actions facturation"
        subtitle="Créer des factures, enregistrer des paiements et suivre les relances internes."
        actions={[
          {
            id: 'create-invoice',
            label: 'Créer facture',
            endpoint: '/api/angelcare360/operator/billing',
            entity: 'invoice',
            operation: 'create',
            submitLabel: 'Créer',
            successMessage: 'Facture créée.',
            fields: [
              { name: 'clientId', label: 'Client', kind: 'select', required: true, options: clientOptions },
              { name: 'subscriptionId', label: 'Abonnement', kind: 'select', options: subscriptionOptions },
              { name: 'billingAccountId', label: 'Compte facturation', kind: 'select', options: billingAccountOptions },
              { name: 'invoiceNumber', label: 'Numéro facture', kind: 'text', required: true },
              { name: 'issueDate', label: 'Date d’émission', kind: 'date', required: true },
              { name: 'dueDate', label: 'Date d’échéance', kind: 'date', required: true },
              { name: 'periodStart', label: 'Début période', kind: 'date' },
              { name: 'periodEnd', label: 'Fin période', kind: 'date' },
              { name: 'subtotalMad', label: 'Sous-total MAD', kind: 'number', required: true },
              { name: 'discountMad', label: 'Remise MAD', kind: 'number' },
              { name: 'totalMad', label: 'Total MAD', kind: 'number', required: true },
              { name: 'amountPaidMad', label: 'Montant payé MAD', kind: 'number' },
              { name: 'balanceDueMad', label: 'Solde dû MAD', kind: 'number' },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'Brouillon', value: 'draft' }, { label: 'Émise', value: 'issued' }, { label: 'Partiellement payée', value: 'partially_paid' }, { label: 'Payée', value: 'paid' }, { label: 'En retard', value: 'overdue' }, { label: 'Annulée', value: 'cancelled' }, { label: 'Archivée', value: 'archived' }] },
              { name: 'notes', label: 'Notes', kind: 'textarea', rows: 3 },
            ],
          },
          {
            id: 'issue-invoice',
            label: 'Émettre facture',
            endpoint: '/api/angelcare360/operator/billing',
            entity: 'invoice',
            operation: 'issue',
            submitLabel: 'Émettre',
            successMessage: 'Facture émise.',
            fields: [{ name: 'id', label: 'Facture', kind: 'select', required: true, options: invoiceOptions }],
          },
          {
            id: 'record-payment',
            label: 'Enregistrer paiement',
            endpoint: '/api/angelcare360/operator/billing',
            entity: 'payment',
            operation: 'record',
            submitLabel: 'Enregistrer',
            successMessage: 'Paiement enregistré.',
            fields: [
              { name: 'clientId', label: 'Client', kind: 'select', required: true, options: clientOptions },
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
            entity: 'payment',
            operation: 'confirm',
            submitLabel: 'Confirmer',
            successMessage: 'Paiement confirmé.',
            fields: [{ name: 'id', label: 'Paiement', kind: 'select', required: true, options: paymentOptions }],
          },
          {
            id: 'reject-payment',
            label: 'Rejeter paiement',
            endpoint: '/api/angelcare360/operator/billing',
            entity: 'payment',
            operation: 'reject',
            tone: 'danger',
            submitLabel: 'Rejeter',
            successMessage: 'Paiement rejeté.',
            confirmTitle: 'Rejet de paiement',
            confirmMessage: 'Le rejet maintient l’historique du paiement dans le suivi interne.',
            fields: [
              { name: 'id', label: 'Paiement', kind: 'select', required: true, options: paymentOptions },
              { name: 'reason', label: 'Motif', kind: 'textarea', rows: 3, required: true },
            ],
          },
          {
            id: 'create-dunning',
            label: 'Créer relance',
            endpoint: '/api/angelcare360/operator/billing',
            entity: 'dunning',
            operation: 'create',
            submitLabel: 'Créer',
            successMessage: 'Action de relance créée.',
            fields: [
              { name: 'clientId', label: 'Client', kind: 'select', required: true, options: clientOptions },
              { name: 'invoiceId', label: 'Facture', kind: 'select', options: invoiceOptions },
              { name: 'actionType', label: 'Type d’action', kind: 'text', required: true },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'Planifiée', value: 'planned' }, { label: 'En cours', value: 'in_progress' }, { label: 'Terminée', value: 'completed' }, { label: 'Bloquée', value: 'blocked' }, { label: 'Annulée', value: 'cancelled' }] },
              { name: 'dueDate', label: 'Échéance', kind: 'date' },
              { name: 'notes', label: 'Notes', kind: 'textarea', rows: 3 },
            ],
          },
          {
            id: 'complete-dunning',
            label: 'Clôturer relance',
            endpoint: '/api/angelcare360/operator/billing',
            entity: 'dunning',
            operation: 'complete',
            submitLabel: 'Clôturer',
            successMessage: 'Relance clôturée.',
            fields: [
              { name: 'id', label: 'Action de relance', kind: 'select', required: true, options: dunning.map((item) => ({ label: `${String(item.action_type || item.id)} · ${String(item.status || '—')}`, value: String(item.id) })) },
            ],
          },
          {
            id: 'send-invoice-email',
            label: 'Envoyer facture par email',
            endpoint: '/api/angelcare360/operator/billing',
            entity: 'email',
            operation: 'invoice',
            submitLabel: 'Envoyer',
            successMessage: 'Facture envoyée par email.',
            fields: [
              { name: 'id', label: 'Facture', kind: 'select', required: true, options: invoiceOptions },
              { name: 'recipientEmail', label: 'Email destinataire', kind: 'text', placeholder: 'facturation@exemple.ma' },
              { name: 'note', label: 'Note', kind: 'textarea', rows: 2 },
            ],
          },
          {
            id: 'send-receipt-email',
            label: 'Envoyer reçu par email',
            endpoint: '/api/angelcare360/operator/billing',
            entity: 'email',
            operation: 'receipt',
            submitLabel: 'Envoyer',
            successMessage: 'Reçu envoyé par email.',
            fields: [
              { name: 'id', label: 'Paiement', kind: 'select', required: true, options: paymentOptions },
              { name: 'recipientEmail', label: 'Email destinataire', kind: 'text', placeholder: 'facturation@exemple.ma' },
              { name: 'note', label: 'Note', kind: 'textarea', rows: 2 },
            ],
          },
          {
            id: 'send-reminder-email',
            label: 'Envoyer relance email',
            endpoint: '/api/angelcare360/operator/billing',
            entity: 'email',
            operation: 'reminder',
            submitLabel: 'Envoyer',
            successMessage: 'Relance envoyée par email.',
            fields: [
              { name: 'id', label: 'Facture', kind: 'select', required: true, options: invoiceOptions },
              { name: 'recipientEmail', label: 'Email destinataire', kind: 'text', placeholder: 'facturation@exemple.ma' },
              { name: 'note', label: 'Note', kind: 'textarea', rows: 2 },
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
              { name: 'clientId', label: 'Client', kind: 'select', required: true, options: clientOptions },
              { name: 'tenantId', label: 'Tenant', kind: 'text' },
              { name: 'invoiceId', label: 'Facture', kind: 'select', options: invoiceOptions },
              { name: 'subscriptionId', label: 'Abonnement', kind: 'select', options: subscriptionOptions },
              { name: 'gateCode', label: 'Code gate', kind: 'text', required: true },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'Actif', value: 'active' }, { label: 'Traitement en ligne', value: 'online_processing' }, { label: 'Validation manuelle', value: 'manual_pending' }, { label: 'Traité', value: 'processed' }, { label: 'Levée', value: 'waived' }, { label: 'Annulé', value: 'cancelled' }, { label: 'Expiré', value: 'expired' }] },
              { name: 'amountDueMad', label: 'Montant dû MAD', kind: 'number', required: true },
              { name: 'currency', label: 'Devise', kind: 'text', placeholder: 'MAD' },
              { name: 'reason', label: 'Motif', kind: 'textarea', rows: 3, required: true },
              { name: 'dueDate', label: 'Date d’échéance', kind: 'date' },
              { name: 'blocking', label: 'Blocage', kind: 'select', required: true, options: [{ label: 'Bloquant', value: 'true' }, { label: 'Non bloquant', value: 'false' }] },
              { name: 'providerKey', label: 'Provider key', kind: 'text' },
              { name: 'checkoutUrl', label: 'URL checkout', kind: 'text' },
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
            id: 'gate-waive',
            label: 'Lever le blocage',
            endpoint: '/api/angelcare360/operator/payment-gates',
            operation: 'waive',
            submitLabel: 'Lever',
            tone: 'secondary',
            successMessage: 'Blocage levé.',
            fields: [
              { name: 'id', label: 'Gate', kind: 'select', required: true, options: paymentGateOptions },
              { name: 'resolutionReason', label: 'Motif', kind: 'textarea', rows: 2, required: true },
            ],
          },
          {
            id: 'gate-cancel',
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
        ]}
      />
      <section style={kpiGridStyle}>
        <Angelcare360OperatorKpiCard label="Total facturé" value={`${totalBilled.toLocaleString('fr-FR')} MAD`} detail="Somme des factures générées." />
        <Angelcare360OperatorKpiCard label="Total encaissé" value={`${totalPaid.toLocaleString('fr-FR')} MAD`} detail="Paiements confirmés manuellement." />
        <Angelcare360OperatorKpiCard label="Impayés" value={`${unpaidBalance.toLocaleString('fr-FR')} MAD`} detail="Encours à suivre." />
        <Angelcare360OperatorKpiCard label="Factures en retard" value={String(overdueInvoices.length)} detail="Factures passées à échéance." />
      </section>

      <section style={splitGridStyle}>
        <Angelcare360OperatorActionQueue
          title="File de facturation"
          items={[
            { title: `${invoices.length} facture(s)`, detail: 'Préparation, émission et clôture des factures clients.' },
            { title: `${payments.length} paiement(s)`, detail: 'Encaissements manuels et rapprochement opérateur.' },
            { title: `${dunning.length} action(s) de relance`, detail: 'Relances internes à suivre par l’équipe finance.' },
          ]}
        />
        <Angelcare360OperatorRightPanel title="Fonctions verrouillées" subtitle="Les paiements en ligne et les PDF automatiques restent verrouillés.">
          <Angelcare360OperatorLockedPanel
            title="Infrastructure requise"
            message="Paiement en ligne verrouillé : passerelle non configurée. PDF facture verrouillé : moteur documentaire requis. Envoi email automatique verrouillé : infrastructure email à valider."
            note="Le suivi manuel reste disponible dans les listes de facturation et de paiements."
          />
        </Angelcare360OperatorRightPanel>
      </section>

      <Angelcare360OperatorDataTable
        title="Factures récentes"
        rows={invoices.slice(0, 12)}
        emptyTitle="Aucune facture"
        emptyDescription="Les factures SaaS émises pour les écoles clientes seront listées ici."
        rowKey={(row) => String((row as Record<string, unknown>).id)}
        columns={[
          { key: 'invoice_number', label: 'Facture', render: (row) => String((row as Record<string, unknown>).invoice_number || '—') },
          { key: 'client_id', label: 'Client', render: (row) => String((row as Record<string, unknown>).client_id || '—') },
          { key: 'status', label: 'Statut', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).status || '—')} /> },
          { key: 'issue_date', label: 'Émise le', render: (row) => String((row as Record<string, unknown>).issue_date || '—') },
          { key: 'due_date', label: 'Échéance', render: (row) => String((row as Record<string, unknown>).due_date || '—') },
          { key: 'balance_due_mad', label: 'Solde dû', align: 'right', render: (row) => `${Number((row as Record<string, unknown>).balance_due_mad || 0).toLocaleString('fr-FR')} MAD` },
        ]}
      />

      <Angelcare360OperatorDataTable
        title="Encaissements récents"
        rows={payments.slice(0, 12)}
        emptyTitle="Aucun paiement"
        emptyDescription="Les paiements clients apparaîtront ici dès leur enregistrement."
        rowKey={(row) => String((row as Record<string, unknown>).id)}
        columns={[
          { key: 'payment_reference', label: 'Référence', render: (row) => String((row as Record<string, unknown>).payment_reference || '—') },
          { key: 'client_id', label: 'Client', render: (row) => String((row as Record<string, unknown>).client_id || '—') },
          { key: 'status', label: 'Statut', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).status || '—')} /> },
          { key: 'payment_date', label: 'Date', render: (row) => String((row as Record<string, unknown>).payment_date || '—') },
          { key: 'amount_mad', label: 'Montant', align: 'right', render: (row) => `${Number((row as Record<string, unknown>).amount_mad || 0).toLocaleString('fr-FR')} MAD` },
        ]}
      />

      <Angelcare360OperatorDataTable
        title="Clientèles à suivre"
        description="Lecture par client des balances et du statut de souscription."
        rows={clients.slice(0, 10)}
        emptyTitle="Aucun client"
        emptyDescription="Les clients apparaîtront ici avec leurs signaux de collection."
        rowKey={(row) => String((row as Record<string, unknown>).id)}
        hrefKey={(row) => `/angelcare-360-operator/clients/${String((row as Record<string, unknown>).id)}`}
        columns={[
          { key: 'display_name', label: 'Client', render: (row) => String((row as Record<string, unknown>).display_name || '—') },
          { key: 'status', label: 'Statut', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).status || '—')} /> },
          { key: 'lifecycle_stage', label: 'Cycle', render: (row) => String((row as Record<string, unknown>).lifecycle_stage || '—') },
          { key: 'active_subscription_status', label: 'Abonnement', render: (row) => String((row as Record<string, unknown>).active_subscription_status || '—') },
          { key: 'balance_due_mad', label: 'Solde dû', align: 'right', render: (row) => `${Number((row as Record<string, unknown>).balance_due_mad || 0).toLocaleString('fr-FR')} MAD` },
        ]}
      />

      <Angelcare360OperatorDataTable
        title="Payment gates"
        description="Blocages de paiement pilotés par AngelCare, liés aux clients, tenants et factures."
        rows={paymentGates}
        emptyTitle="Aucun gate"
        emptyDescription="Les gates actifs, en attente manuelle ou résolus apparaîtront ici."
        rowKey={(row) => String((row as Record<string, unknown>).id)}
        columns={[
          { key: 'gate_code', label: 'Gate', render: (row) => String((row as Record<string, unknown>).gate_code || '—') },
          { key: 'client_display_name', label: 'Client', render: (row) => String((row as Record<string, unknown>).client_display_name || (row as Record<string, unknown>).client_id || '—') },
          { key: 'status', label: 'Statut', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).status || '—')} /> },
          { key: 'amount_due_mad', label: 'Montant', align: 'right', render: (row) => `${Number((row as Record<string, unknown>).amount_due_mad || 0).toLocaleString('fr-FR')} MAD` },
          { key: 'due_date', label: 'Échéance', render: (row) => String((row as Record<string, unknown>).due_date || '—') },
        ]}
      />
    </Angelcare360OperatorPageShell>
  )
}

const kpiGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
}

const splitGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
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

const secondaryActionsStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  justifyContent: 'end',
}

const downloadLinkStyle: React.CSSProperties = {
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
