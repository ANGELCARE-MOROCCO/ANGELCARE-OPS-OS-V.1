import Link from 'next/link'
import { notFound } from 'next/navigation'
import Angelcare360CommunicationMutationForm from '@/components/angelcare360/communication/Angelcare360CommunicationMutationForm'
import Angelcare360ClaimsSectionScreen from '@/components/angelcare360/claims/Angelcare360ClaimsSectionScreen'
import Angelcare360ClaimTicketDetail from '@/components/angelcare360/claims/Angelcare360ClaimTicketDetail'
import { getAngelcare360ClaimTicketById } from '@/lib/angelcare360/server/claims'
import { getAngelcare360ClaimsContext, secondaryLinkStyle } from '../../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360ClaimTicketDetailPage({ params }: { params: { id: string } }) {
  const context = await getAngelcare360ClaimsContext()
  const ticket = await getAngelcare360ClaimTicketById(params.id, { schoolId: context.school.id })
  if (!ticket) notFound()

  return (
    <Angelcare360ClaimsSectionScreen
      title={`Ticket ${ticket.reclamation_code}`}
      description="Détail du ticket, affectation, statut et résolution."
      actions={<Link href="/angelcare-360-command-center/reclamations/tickets" style={secondaryLinkStyle}>Retour aux tickets</Link>}
    >
      <Angelcare360ClaimTicketDetail ticket={ticket} />
      <div style={stackStyle}>
        <Angelcare360CommunicationMutationForm
          title="Assigner le ticket"
          description="Assignation réelle à un membre du personnel."
          entity="claim"
          operation="assign"
          submitLabel="Assigner"
          endpoint="/api/angelcare360/claims"
          schoolId={context.school.id}
          recordId={ticket.id}
          fields={[
            { name: 'assignedStaffId', label: 'Personnel assigné (ID)', kind: 'text', required: true },
            { name: 'note', label: 'Note', kind: 'textarea' },
          ]}
        />
        <Angelcare360CommunicationMutationForm
          title="Changer le statut"
          entity="claim"
          operation="status"
          submitLabel="Changer le statut"
          endpoint="/api/angelcare360/claims"
          schoolId={context.school.id}
          recordId={ticket.id}
          fields={[
            { name: 'status', label: 'Statut', kind: 'text', required: true, helperText: 'new, in_review, assigned, waiting_parent, waiting_internal, resolved, closed, archived' },
            { name: 'note', label: 'Note', kind: 'textarea' },
          ]}
        />
        <Angelcare360CommunicationMutationForm
          title="Résoudre le ticket"
          entity="claim"
          operation="resolve"
          submitLabel="Résoudre"
          endpoint="/api/angelcare360/claims"
          schoolId={context.school.id}
          recordId={ticket.id}
          fields={[
            { name: 'resolutionSummary', label: 'Résumé de résolution', kind: 'textarea', required: true },
            { name: 'note', label: 'Note', kind: 'textarea' },
          ]}
        />
        <Angelcare360CommunicationMutationForm
          title="Clôturer le ticket"
          entity="claim"
          operation="close"
          submitLabel="Clôturer"
          endpoint="/api/angelcare360/claims"
          schoolId={context.school.id}
          recordId={ticket.id}
          lockedReason={ticket.status === 'closed' ? 'Ticket déjà clôturé' : null}
          fields={[
            { name: 'resolutionSummary', label: 'Résumé de résolution', kind: 'textarea', required: true },
            { name: 'note', label: 'Note', kind: 'textarea' },
          ]}
        />
      </div>
    </Angelcare360ClaimsSectionScreen>
  )
}

const stackStyle: React.CSSProperties = { display: 'grid', gap: 12 }

