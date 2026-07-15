import Link from 'next/link'
import { notFound } from 'next/navigation'
import Angelcare360OperatorActionDrawer from '@/components/angelcare360/operator/Angelcare360OperatorActionDrawer'
import Angelcare360OperatorDataTable from '@/components/angelcare360/operator/Angelcare360OperatorDataTable'
import Angelcare360OperatorPageShell from '@/components/angelcare360/operator/Angelcare360OperatorPageShell'
import Angelcare360OperatorStatusBadge from '@/components/angelcare360/operator/Angelcare360OperatorStatusBadge'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'
import { listOperatorBillingAccounts, listOperatorInvoices } from '@/lib/angelcare360/operator/billing'
import { listOperatorClients } from '@/lib/angelcare360/operator/clients'
import { listOperatorSubscriptions } from '@/lib/angelcare360/operator/subscriptions'
import { listOperatorPaymentGates } from '@/lib/angelcare360/operator/payment-gates'

export const dynamic = 'force-dynamic'

export default async function Angelcare360OperatorInvoicesPage() {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()

  const [invoices, clients, subscriptions, billingAccounts, paymentGates] = await Promise.all([
    listOperatorInvoices(),
    listOperatorClients(),
    listOperatorSubscriptions(),
    listOperatorBillingAccounts(),
    listOperatorPaymentGates(),
  ])
  const clientOptions = clients.map((client) => ({ label: `${String(client.display_name || 'Client')} · ${String(client.client_code || client.id)}`, value: String(client.id) }))
  const subscriptionOptions = subscriptions.map((subscription) => ({ label: `${String(subscription.subscription_code || subscription.id)} · ${String(subscription.status || '—')}`, value: String(subscription.id) }))
  const billingAccountOptions = billingAccounts.map((account) => ({ label: `${String(account.billing_name || account.id)} · ${String(account.status || '—')}`, value: String(account.id) }))
  const invoiceOptions = invoices.map((invoice) => ({ label: `${String(invoice.invoice_number || invoice.id)} · ${String(invoice.status || '—')}`, value: String(invoice.id) }))
  const paymentGateOptions = paymentGates.map((gate) => ({ label: `${String(gate.gate_code || gate.id)} · ${String(gate.status || '—')}`, value: String(gate.id) }))

  const actionStateOptions = [{ label: 'Brouillon', value: 'draft' }, { label: 'Émise', value: 'issued' }, { label: 'Partiellement payée', value: 'partially_paid' }, { label: 'Payée', value: 'paid' }, { label: 'En retard', value: 'overdue' }, { label: 'Annulée', value: 'cancelled' }, { label: 'Archivée', value: 'archived' }]

  return (
    <Angelcare360OperatorPageShell
      badge="Factures SaaS"
      statusLabel={`${invoices.length} facture(s)`}
      title="Factures AngelCare"
      subtitle="Factures émises aux établissements clients, avec suivi du statut et du solde."
    >
      <Angelcare360OperatorActionDrawer
        title="Actions factures"
        subtitle="Créer, émettre ou annuler les factures SaaS AngelCare."
        actions={[
          {
            id: 'create-invoice',
            label: 'Créer facture brouillon',
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
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: actionStateOptions },
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
            id: 'cancel-invoice',
            label: 'Annuler facture',
            endpoint: '/api/angelcare360/operator/billing',
            entity: 'invoice',
            operation: 'cancel',
            tone: 'danger',
            submitLabel: 'Annuler',
            successMessage: 'Facture annulée.',
            confirmTitle: 'Annulation de facture',
            confirmMessage: 'L’annulation conserve l’historique mais retire la facture du cycle actif.',
            fields: [
              { name: 'id', label: 'Facture', kind: 'select', required: true, options: invoiceOptions },
              { name: 'reason', label: 'Motif', kind: 'textarea', rows: 3, required: true },
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
            id: 'create-payment-gate',
            label: 'Créer gate paiement',
            endpoint: '/api/angelcare360/operator/payment-gates',
            operation: 'create',
            submitLabel: 'Créer',
            successMessage: 'Gate de paiement créé.',
            fields: [
              { name: 'clientId', label: 'Client', kind: 'select', required: true, options: clientOptions },
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
        ]}
      />
      <Angelcare360OperatorDataTable
        title="Historique des factures"
        rows={invoices}
        emptyTitle="Aucune facture"
        emptyDescription="Les factures seront listées ici dès leur émission."
        rowKey={(row) => String((row as Record<string, unknown>).id)}
        columns={[
          { key: 'invoice_number', label: 'Facture', render: (row) => String((row as Record<string, unknown>).invoice_number || '—') },
          { key: 'client_id', label: 'Client', render: (row) => String((row as Record<string, unknown>).client_id || '—') },
          { key: 'status', label: 'Statut', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).status || '—')} /> },
          { key: 'issue_date', label: 'Émise', render: (row) => String((row as Record<string, unknown>).issue_date || '—') },
          { key: 'due_date', label: 'Échéance', render: (row) => String((row as Record<string, unknown>).due_date || '—') },
          { key: 'total_mad', label: 'Total', align: 'right', render: (row) => `${Number((row as Record<string, unknown>).total_mad || 0).toLocaleString('fr-FR')} MAD` },
          { key: 'balance_due_mad', label: 'Solde dû', align: 'right', render: (row) => `${Number((row as Record<string, unknown>).balance_due_mad || 0).toLocaleString('fr-FR')} MAD` },
          {
            key: 'actions',
            label: 'Actions',
            render: (row) => (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <Link href={`/angelcare-360-operator/billing/invoices/${String((row as Record<string, unknown>).id)}/print`} style={rowLinkStyle}>A4</Link>
              </div>
            ),
          },
        ]}
      />
    </Angelcare360OperatorPageShell>
  )
}

const rowLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 12,
  border: '1px solid #dbe4ef',
  background: '#fff',
  color: '#0f172a',
  textDecoration: 'none',
  padding: '7px 10px',
  fontWeight: 800,
}
