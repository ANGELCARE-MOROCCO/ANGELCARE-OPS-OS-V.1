import Link from 'next/link'
import { notFound } from 'next/navigation'
import Angelcare360CommunicationMutationForm from '@/components/angelcare360/communication/Angelcare360CommunicationMutationForm'
import Angelcare360ConversationDetail from '@/components/angelcare360/communication/Angelcare360ConversationDetail'
import Angelcare360CommunicationSectionScreen from '@/components/angelcare360/communication/Angelcare360CommunicationSectionScreen'
import { getAngelcare360ConversationById } from '@/lib/angelcare360/server/communication'
import { getAngelcare360CommunicationContext, secondaryLinkStyle } from '../../_utils'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

export const dynamic = 'force-dynamic'

export default async function Angelcare360ConversationDetailPage({ params }: { params: { id: string } }) {
  const context = await getAngelcare360CommunicationContext()
  const detail = await getAngelcare360ConversationById(params.id, { schoolId: context.school.id })
  if (!detail) notFound()

  return (
    <Angelcare360CommunicationSectionScreen
      title={`Conversation ${detail.conversation_code}`}
      description="Détail du fil, participants, messages et archivage serveur."
      actions={<Link href="/angelcare-360-command-center/messagerie/conversations" style={secondaryLinkStyle}>Retour aux conversations</Link>}
    >
      <Angelcare360ConversationDetail conversation={detail} participants={detail.participants} messages={detail.messages}>
        <div style={stackStyle}>
          <Angelcare360CommunicationMutationForm
            title="Nouveau message interne"
            description="Le message est persisté côté serveur et peut cibler des participants internes."
            entity="message"
            operation="create"
            submitLabel="Envoyer le message"
            endpoint="/api/angelcare360/communication"
            schoolId={context.school.id}
            recordId={detail.id}
            fields={[
              { name: 'messageCode', label: 'Code message', kind: 'text', required: true },
              { name: 'subject', label: 'Sujet', kind: 'text' },
              { name: 'body', label: 'Contenu', kind: 'textarea', required: true },
              { name: 'recipientStudentIds', label: 'Élèves (IDs séparés par virgule)', kind: 'text' },
              { name: 'recipientParentIds', label: 'Parents (IDs séparés par virgule)', kind: 'text' },
              { name: 'recipientStaffIds', label: 'Personnel (IDs séparés par virgule)', kind: 'text' },
              { name: 'recipientAppUserIds', label: 'Comptes utilisateurs (IDs séparés par virgule)', kind: 'text' },
            ]}
          />
          <Angelcare360CommunicationMutationForm
            title="Archiver la conversation"
            description="L’archivage passe par une opération réelle et auditable."
            entity="conversation"
            operation="archive"
            submitLabel="Archiver"
            endpoint="/api/angelcare360/communication"
            schoolId={context.school.id}
            recordId={detail.id}
            lockedReason={detail.archived_at ? 'Conversation déjà archivée' : null}
            fields={[]}
          />
          {detail.messages.length === 0 ? (
            <Angelcare360EmptyState title="Aucun message" description="Aucun message interne n’est disponible dans ce fil." />
          ) : null}
        </div>
      </Angelcare360ConversationDetail>
    </Angelcare360CommunicationSectionScreen>
  )
}

const stackStyle: React.CSSProperties = { display: 'grid', gap: 12 }
