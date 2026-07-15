import Link from 'next/link'
import Angelcare360CommunicationSectionScreen from '@/components/angelcare360/communication/Angelcare360CommunicationSectionScreen'
import Angelcare360CommunicationMutationForm from '@/components/angelcare360/communication/Angelcare360CommunicationMutationForm'
import { listAngelcare360Conversations } from '@/lib/angelcare360/server/communication'
import { getAngelcare360CommunicationContext, primaryLinkStyle, secondaryLinkStyle } from '../_utils'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

export const dynamic = 'force-dynamic'

export default async function Angelcare360ConversationsPage() {
  const context = await getAngelcare360CommunicationContext()
  const conversations = await listAngelcare360Conversations({ schoolId: context.school.id })

  return (
    <Angelcare360CommunicationSectionScreen
      title="Conversations"
      description="Créer une conversation interne, suivre les participants et ouvrir le détail."
      actions={<Link href="/angelcare-360-command-center/messagerie" style={secondaryLinkStyle}>Retour au cockpit</Link>}
    >
      <div style={stackStyle}>
        <Angelcare360CommunicationMutationForm
          title="Nouvelle conversation"
          description="La conversation est créée côté serveur avec participants internes."
          entity="conversation"
          operation="create"
          submitLabel="Créer la conversation"
          endpoint="/api/angelcare360/communication"
          schoolId={context.school.id}
          fields={[
            { name: 'conversationCode', label: 'Code', kind: 'text', required: true },
            { name: 'subject', label: 'Sujet', kind: 'text', required: true },
            { name: 'participantStudentIds', label: 'Élèves (IDs séparés par virgule)', kind: 'text' },
            { name: 'participantParentIds', label: 'Parents (IDs séparés par virgule)', kind: 'text' },
            { name: 'participantStaffIds', label: 'Personnel (IDs séparés par virgule)', kind: 'text' },
            { name: 'participantAppUserIds', label: 'Comptes utilisateurs (IDs séparés par virgule)', kind: 'text' },
          ]}
        />

        {conversations.length ? conversations.map((conversation) => (
          <article key={conversation.id} style={cardStyle}>
            <div style={headerStyle}>
              <div>
                <strong>{conversation.subject}</strong>
                <div style={metaStyle}>{conversation.conversation_code}</div>
              </div>
              <span>{conversation.status}</span>
            </div>
            <div style={metaStyle}>
              Participants: {conversation.participant_count} · Messages: {conversation.message_count} · Non lus: {conversation.unread_count}
            </div>
            <Link href={`/angelcare-360-command-center/messagerie/conversations/${conversation.id}`} style={primaryLinkStyle}>Ouvrir le fil</Link>
          </article>
        )) : (
          <Angelcare360EmptyState title="Aucune conversation" description="Aucun fil de discussion ne correspond aux données courantes." />
        )}
      </div>
    </Angelcare360CommunicationSectionScreen>
  )
}

const stackStyle: React.CSSProperties = { display: 'grid', gap: 12 }
const cardStyle: React.CSSProperties = { display: 'grid', gap: 8, padding: 14, borderRadius: 18, border: '1px solid #e2e8f0', background: '#fff' }
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }
const metaStyle: React.CSSProperties = { color: '#64748b', fontSize: 12, fontWeight: 700 }

