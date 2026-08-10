import { notFound } from 'next/navigation'
import Angelcare360OperatorActionDrawer from '@/components/angelcare360/operator/Angelcare360OperatorActionDrawer'
import Angelcare360OperatorDataTable from '@/components/angelcare360/operator/Angelcare360OperatorDataTable'
import Angelcare360OperatorLockedPanel from '@/components/angelcare360/operator/Angelcare360OperatorLockedPanel'
import Angelcare360OperatorPageShell from '@/components/angelcare360/operator/Angelcare360OperatorPageShell'
import Angelcare360OperatorStatusBadge from '@/components/angelcare360/operator/Angelcare360OperatorStatusBadge'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'
import { listOperatorDunningActions, listOperatorInvoices } from '@/lib/angelcare360/operator/billing'
import { listOperatorClients } from '@/lib/angelcare360/operator/clients'

export const dynamic = 'force-dynamic'

export default async function Angelcare360OperatorDunningPage() {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()

  const [actions, clients, invoices] = await Promise.all([listOperatorDunningActions(), listOperatorClients(), listOperatorInvoices()])
  const clientOptions = clients.map((client) => ({ label: `${String(client.display_name || 'Client')} · ${String(client.client_code || client.id)}`, value: String(client.id) }))
  const invoiceOptions = invoices.map((invoice) => ({ label: `${String(invoice.invoice_number || invoice.id)} · ${String(invoice.status || '—')}`, value: String(invoice.id) }))
  const actionOptions = actions.map((action) => ({ label: `${String(action.action_type || action.id)} · ${String(action.status || '—')}`, value: String(action.id) }))

  return (
    <Angelcare360OperatorPageShell
      badge="Relances internes"
      statusLabel={`${actions.length} action(s)`}
      title="Relances internes"
      subtitle="Suivi manuel des actions de recouvrement sans envoi externe automatisé."
    >
      <Angelcare360OperatorActionDrawer
        title="Actions de relance"
        subtitle="Planifier et clôturer les relances internes liées aux factures clients."
        actions={[
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
            fields: [{ name: 'id', label: 'Action de relance', kind: 'select', required: true, options: actionOptions }],
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
        ]}
      />
      <Angelcare360OperatorLockedPanel
        title="Relances externes verrouillées"
        message="Les relances SMS et WhatsApp restent verrouillées. L’email manuel reste disponible via Email-OS lorsque la boîte B2B est validée."
        note="Le pilotage interne des actions de relance reste disponible."
      />
      <Angelcare360OperatorDataTable
        title="Actions de relance"
        rows={actions}
        emptyTitle="Aucune relance"
        emptyDescription="Les actions de relance planifiées ou complétées apparaîtront ici."
        rowKey={(row) => String((row as Record<string, unknown>).id)}
        columns={[
          { key: 'action_type', label: 'Type', render: (row) => String((row as Record<string, unknown>).action_type || '—') },
          { key: 'client_id', label: 'Client', render: (row) => String((row as Record<string, unknown>).client_id || '—') },
          { key: 'status', label: 'Statut', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).status || '—')} /> },
          { key: 'due_date', label: 'Échéance', render: (row) => String((row as Record<string, unknown>).due_date || '—') },
        ]}
      />
    </Angelcare360OperatorPageShell>
  )
}
