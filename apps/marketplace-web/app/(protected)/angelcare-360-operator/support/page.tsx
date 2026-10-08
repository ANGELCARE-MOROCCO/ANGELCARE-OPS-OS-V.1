import { notFound } from 'next/navigation'
import Angelcare360OperatorActionDrawer from '@/components/angelcare360/operator/Angelcare360OperatorActionDrawer'
import Angelcare360OperatorDataTable from '@/components/angelcare360/operator/Angelcare360OperatorDataTable'
import Angelcare360OperatorLockedPanel from '@/components/angelcare360/operator/Angelcare360OperatorLockedPanel'
import Angelcare360OperatorPageShell from '@/components/angelcare360/operator/Angelcare360OperatorPageShell'
import Angelcare360OperatorStatusBadge from '@/components/angelcare360/operator/Angelcare360OperatorStatusBadge'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'
import { listOperatorClients } from '@/lib/angelcare360/operator/clients'
import { listOperatorTenants } from '@/lib/angelcare360/operator/tenants'
import { listOperatorSupportTickets } from '@/lib/angelcare360/operator/support'

export const dynamic = 'force-dynamic'

export default async function Angelcare360OperatorSupportPage() {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()

  const [tickets, clients, tenants] = await Promise.all([listOperatorSupportTickets(), listOperatorClients(), listOperatorTenants()])
  const ticketOptions = tickets.map((ticket) => ({ label: `${String(ticket.subject || ticket.id)} · ${String(ticket.status || '—')}`, value: String(ticket.id) }))
  const clientOptions = clients.map((client) => ({ label: `${String(client.display_name || 'Client')} · ${String(client.client_code || client.id)}`, value: String(client.id) }))
  const tenantOptions = tenants.map((tenant) => ({ label: `${String(tenant.tenant_slug || tenant.id)} · ${String(tenant.status || '—')}`, value: String(tenant.id) }))

  return (
    <Angelcare360OperatorPageShell
      badge="Support"
      statusLabel={`${tickets.length} ticket(s)`}
      title="Support clients"
      subtitle="Triage, assignation, résolution et suivi des tickets clients AngelCare."
      contextRow={
        <>
          <span style={contextPillStyle}>Tickets: {tickets.length}</span>
          <span style={contextPillStyle}>Clients: {clients.length}</span>
          <span style={contextPillStyle}>Tenants: {tenants.length}</span>
        </>
      }
    >
      <Angelcare360OperatorActionDrawer
        title="Actions support"
        subtitle="Créer, assigner et résoudre les tickets clients."
        actions={[
          {
            id: 'create-ticket',
            label: 'Créer ticket',
            endpoint: '/api/angelcare360/operator/support',
            operation: 'create',
            submitLabel: 'Créer',
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
          {
            id: 'assign-ticket',
            label: 'Assigner ticket',
            endpoint: '/api/angelcare360/operator/support',
            operation: 'assign',
            submitLabel: 'Assigner',
            successMessage: 'Ticket assigné.',
            fields: [
              { name: 'id', label: 'Ticket', kind: 'select', required: true, options: ticketOptions },
              { name: 'assignedTo', label: 'Assigné à', kind: 'text', required: true, placeholder: 'ID utilisateur opérateur' },
            ],
          },
          {
            id: 'change-status',
            label: 'Changer statut',
            endpoint: '/api/angelcare360/operator/support',
            operation: 'status',
            submitLabel: 'Mettre à jour',
            successMessage: 'Statut du ticket mis à jour.',
            fields: [
              { name: 'id', label: 'Ticket', kind: 'select', required: true, options: ticketOptions },
              { name: 'status', label: 'Statut', kind: 'select', required: true, options: [{ label: 'Nouvelle', value: 'new' }, { label: 'Triage', value: 'triage' }, { label: 'Assignée', value: 'assigned' }, { label: 'En attente client', value: 'waiting_client' }, { label: 'En attente interne', value: 'waiting_internal' }, { label: 'Résolue', value: 'resolved' }, { label: 'Clôturée', value: 'closed' }, { label: 'Archivée', value: 'archived' }] },
              { name: 'reason', label: 'Motif / résumé', kind: 'textarea', rows: 3 },
            ],
          },
          {
            id: 'resolve-ticket',
            label: 'Résoudre ticket',
            endpoint: '/api/angelcare360/operator/support',
            operation: 'resolve',
            submitLabel: 'Résoudre',
            successMessage: 'Ticket résolu.',
            fields: [
              { name: 'id', label: 'Ticket', kind: 'select', required: true, options: ticketOptions },
              { name: 'resolutionSummary', label: 'Résumé de résolution', kind: 'textarea', rows: 4, required: true },
            ],
          },
          {
            id: 'support-follow-up-email',
            label: 'Email de suivi',
            endpoint: '/api/angelcare360/operator/support',
            entity: 'email',
            operation: 'follow_up',
            submitLabel: 'Envoyer',
            successMessage: 'Email de suivi envoyé.',
            fields: [
              { name: 'clientId', label: 'Client', kind: 'select', required: true, options: clientOptions },
              { name: 'subject', label: 'Objet', kind: 'text', placeholder: 'Suivi support AngelCare 360' },
              { name: 'body', label: 'Message', kind: 'textarea', rows: 4 },
            ],
          },
        ]}
      />
      <Angelcare360OperatorLockedPanel
        title="SLA en lecture seule"
        message="Aucun moteur SLA automatique n’est activé pour l’instant. Le support reste piloté manuellement."
        note="Les résolutions exigent un résumé avant clôture."
      />
      <Angelcare360OperatorDataTable
        title="Tickets support"
        rows={tickets}
        emptyTitle="Aucun ticket"
        emptyDescription="Les tickets client apparaîtront ici avec leur statut et leur priorité."
        rowKey={(row) => String((row as Record<string, unknown>).id)}
        columns={[
          { key: 'subject', label: 'Sujet', render: (row) => String((row as Record<string, unknown>).subject || '—') },
          { key: 'client_id', label: 'Client', render: (row) => String((row as Record<string, unknown>).client_id || '—') },
          { key: 'priority', label: 'Priorité', render: (row) => String((row as Record<string, unknown>).priority || '—') },
          { key: 'status', label: 'Statut', render: (row) => <Angelcare360OperatorStatusBadge status={String((row as Record<string, unknown>).status || '—')} /> },
          { key: 'assigned_to', label: 'Assigné à', render: (row) => String((row as Record<string, unknown>).assigned_to || '—') },
        ]}
      />
    </Angelcare360OperatorPageShell>
  )
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
