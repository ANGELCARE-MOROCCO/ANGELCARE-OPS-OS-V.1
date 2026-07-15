import Link from 'next/link'
import Angelcare360CommunicationMutationForm from '@/components/angelcare360/communication/Angelcare360CommunicationMutationForm'
import Angelcare360NotificationsSectionScreen from '@/components/angelcare360/notifications/Angelcare360NotificationsSectionScreen'
import Angelcare360InternalNotificationsWorkspace from '@/components/angelcare360/notifications/Angelcare360InternalNotificationsWorkspace'
import { listAngelcare360InternalNotifications } from '@/lib/angelcare360/server/notifications'
import { getAngelcare360NotificationsContext, secondaryLinkStyle } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360InternalNotificationsPage() {
  const context = await getAngelcare360NotificationsContext()
  const notifications = await listAngelcare360InternalNotifications({ schoolId: context.school.id })

  return (
    <Angelcare360NotificationsSectionScreen
      title="Notifications internes"
      description="Créer, marquer comme lue et archiver une notification interne persistée."
      actions={<Link href="/angelcare-360-command-center/notifications" style={secondaryLinkStyle}>Retour au cockpit</Link>}
    >
      <div style={stackStyle}>
        <Angelcare360CommunicationMutationForm
          title="Nouvelle notification interne"
          description="La notification est créée côté serveur uniquement."
          entity="notification"
          operation="create"
          submitLabel="Créer la notification"
          endpoint="/api/angelcare360/notifications"
          schoolId={context.school.id}
          fields={[
            { name: 'notificationCode', label: 'Code', kind: 'text', required: true },
            { name: 'title', label: 'Titre', kind: 'text', required: true },
            { name: 'body', label: 'Contenu', kind: 'textarea', required: true },
            { name: 'recipientRole', label: 'Rôle destinataire', kind: 'text' },
            { name: 'recipientAppUserId', label: 'Compte utilisateur (ID)', kind: 'text' },
            { name: 'recipientStudentId', label: 'Élève (ID)', kind: 'text' },
            { name: 'recipientParentId', label: 'Parent (ID)', kind: 'text' },
            { name: 'recipientStaffId', label: 'Personnel (ID)', kind: 'text' },
            { name: 'channel', label: 'Canal', kind: 'text' },
          ]}
        />
        <Angelcare360InternalNotificationsWorkspace notifications={notifications} />
        {notifications.map((notification) => (
          <article key={`${notification.id}-actions`} style={actionCardStyle}>
            <Angelcare360CommunicationMutationForm
              title="Marquer comme lue"
              entity="notification"
              operation="read"
              submitLabel="Marquer lue"
              endpoint="/api/angelcare360/notifications"
              schoolId={context.school.id}
              recordId={notification.id}
              fields={[]}
              lockedReason={notification.read_at ? 'Notification déjà lue' : null}
            />
            <Angelcare360CommunicationMutationForm
              title="Archiver"
              entity="notification"
              operation="archive"
              submitLabel="Archiver"
              endpoint="/api/angelcare360/notifications"
              schoolId={context.school.id}
              recordId={notification.id}
              fields={[]}
              lockedReason={notification.status === 'archived' ? 'Notification déjà archivée' : null}
            />
          </article>
        ))}
      </div>
    </Angelcare360NotificationsSectionScreen>
  )
}

const stackStyle: React.CSSProperties = { display: 'grid', gap: 12 }
const actionCardStyle: React.CSSProperties = { display: 'grid', gap: 12, padding: 14, borderRadius: 18, border: '1px solid #e2e8f0', background: '#fff' }
