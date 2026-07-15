import Link from 'next/link'
import { notFound } from 'next/navigation'
import Angelcare360OperatorActionDrawer from '@/components/angelcare360/operator/Angelcare360OperatorActionDrawer'
import Angelcare360OperatorDataTable from '@/components/angelcare360/operator/Angelcare360OperatorDataTable'
import Angelcare360OperatorPageShell from '@/components/angelcare360/operator/Angelcare360OperatorPageShell'
import Angelcare360OperatorStatusBadge from '@/components/angelcare360/operator/Angelcare360OperatorStatusBadge'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'
import { listOperatorInvoices, listOperatorPayments } from '@/lib/angelcare360/operator/billing'
import { listOperatorClients } from '@/lib/angelcare360/operator/clients'

export const dynamic = 'force-dynamic'

export default async function Angelcare360OperatorPaymentsPage() {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()

  const [payments, clients, invoices] = await Promise.all([listOperatorPayments(), listOperatorClients(), listOperatorInvoices()])
  const clientOptions = clients.map((client) => ({ label: `${String(client.display_name || 'Client')} · ${String(client.client_code || client.id)}`, value: String(client.id) }))
  const invoiceOptions = invoices.map((invoice) => ({ label: `${String(invoice.invoice_number || invoice.id)} · ${String(invoice.status || '—')}`, value: String(invoice.id) }))
  const paymentOptions = payments.map((payment) => ({ label: `${String(payment.payment_reference || payment.id)} · ${String(payment.status || '—')}`, value: String(payment.id) }))

  return (
    <Angelcare360OperatorPageShell
      badge="Paiements clients"
      statusLabel={`${payments.length} paiement(s)`}
      title="Paiements clients"
      subtitle="Enregistrements manuels, confirmations opérateur et rapprochement de paiement."
    >
      <Angelcare360OperatorActionDrawer
        title="Actions paiements"
        subtitle="Enregistrer, confirmer ou rejeter les paiements clients."
        actions={[
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
            confirmMessage: 'Le rejet conserve le paiement dans l’historique interne.',
            fields: [
              { name: 'id', label: 'Paiement', kind: 'select', required: true, options: paymentOptions },
              { name: 'reason', label: 'Motif', kind: 'textarea', rows: 3, required: true },
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
        ]}
      />
      <Angelcare360OperatorDataTable
        title="Paiements reçus"
        rows={payments}
        emptyTitle="Aucun paiement"
        emptyDescription="Les paiements enregistrés par l’équipe finance apparaîtront ici."
        rowKey={(row) => String((row as Record<string, unknown>).id)}
        columns={[
          { key: 'payment_reference', label: 'Référence', render: (row) => String((row as Record<string, unknown>).payment_reference || '—') },
          { key: 'client_id', label: 'Client', render: (row) => String((row as Record<string, unknown>).client_id || '—') },
          { key: 'invoice_id', label: 'Facture', render: (row) => String((row as Record<string, unknown>).invoice_id || '—') },
          { key: 'status', label: 'Statut', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).status || '—')} /> },
          { key: 'payment_date', label: 'Date', render: (row) => String((row as Record<string, unknown>).payment_date || '—') },
          { key: 'amount_mad', label: 'Montant', align: 'right', render: (row) => `${Number((row as Record<string, unknown>).amount_mad || 0).toLocaleString('fr-FR')} MAD` },
          {
            key: 'actions',
            label: 'Actions',
            render: (row) => (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <Link href={`/angelcare-360-operator/billing/payments/${String((row as Record<string, unknown>).id)}/receipt-print`} style={rowLinkStyle}>Reçu A4</Link>
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
