import Link from 'next/link'
import Angelcare360NotificationsSectionScreen from '@/components/angelcare360/notifications/Angelcare360NotificationsSectionScreen'
import Angelcare360NotificationHistoryWorkspace from '@/components/angelcare360/notifications/Angelcare360NotificationHistoryWorkspace'
import { listAngelcare360NotificationHistory } from '@/lib/angelcare360/server/notifications'
import { getAngelcare360NotificationsContext, secondaryLinkStyle } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360NotificationHistoryPage() {
  const context = await getAngelcare360NotificationsContext()
  const notifications = await listAngelcare360NotificationHistory({ schoolId: context.school.id })

  return (
    <Angelcare360NotificationsSectionScreen
      title="Historique"
      description="Historique réel des notifications internes persistées."
      actions={<Link href="/angelcare-360-command-center/notifications" style={secondaryLinkStyle}>Retour au cockpit</Link>}
    >
      <Angelcare360NotificationHistoryWorkspace notifications={notifications} />
    </Angelcare360NotificationsSectionScreen>
  )
}

