import Link from 'next/link'
import Angelcare360CommunicationMutationForm from '@/components/angelcare360/communication/Angelcare360CommunicationMutationForm'
import Angelcare360ClaimsSectionScreen from '@/components/angelcare360/claims/Angelcare360ClaimsSectionScreen'
import Angelcare360ClaimTicketsWorkspace from '@/components/angelcare360/claims/Angelcare360ClaimTicketsWorkspace'
import { listAngelcare360ClaimTickets } from '@/lib/angelcare360/server/claims'
import { getAngelcare360ClaimsContext, primaryLinkStyle, secondaryLinkStyle } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360ClaimTicketsPage() {
  const context = await getAngelcare360ClaimsContext()
  const tickets = await listAngelcare360ClaimTickets({ schoolId: context.school.id })

  return (
    <Angelcare360ClaimsSectionScreen
      title="Tickets"
      description="Créer, suivre et mettre à jour les réclamations avec statut audité."
      actions={<Link href="/angelcare-360-command-center/reclamations" style={secondaryLinkStyle}>Retour au cockpit</Link>}
    >
      <div style={stackStyle}>
        <Angelcare360CommunicationMutationForm
          title="Nouveau ticket"
          description="Le ticket est persisté côté serveur et exige un résumé de résolution avant fermeture."
          entity="claim"
          operation="create"
          submitLabel="Créer le ticket"
          endpoint="/api/angelcare360/claims"
          schoolId={context.school.id}
          fields={[
            { name: 'reclamationCode', label: 'Code', kind: 'text', required: true },
            { name: 'subject', label: 'Sujet', kind: 'text', required: true },
            { name: 'description', label: 'Description', kind: 'textarea', required: true },
            { name: 'priority', label: 'Priorité', kind: 'text', required: true, helperText: 'low, normal, high, urgent' },
            { name: 'category', label: 'Catégorie', kind: 'text' },
            { name: 'submittedByParentId', label: 'Parent (ID)', kind: 'text' },
            { name: 'submittedByStudentId', label: 'Élève (ID)', kind: 'text' },
            { name: 'submittedByStaffId', label: 'Personnel (ID)', kind: 'text' },
          ]}
        />
        <Angelcare360ClaimTicketsWorkspace tickets={tickets} />
        {tickets.map((ticket) => (
          <article key={ticket.id} style={actionCardStyle}>
            <Link href={`/angelcare-360-command-center/reclamations/tickets/${ticket.id}`} style={primaryLinkStyle}>Ouvrir le ticket</Link>
          </article>
        ))}
      </div>
    </Angelcare360ClaimsSectionScreen>
  )
}

const stackStyle: React.CSSProperties = { display: 'grid', gap: 12 }
const actionCardStyle: React.CSSProperties = { display: 'grid', gap: 12, padding: 14, borderRadius: 18, border: '1px solid #e2e8f0', background: '#fff' }
