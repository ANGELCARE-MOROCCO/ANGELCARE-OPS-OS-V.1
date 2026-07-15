import Link from 'next/link'
import Angelcare360NotificationsSectionScreen from '@/components/angelcare360/notifications/Angelcare360NotificationsSectionScreen'
import Angelcare360NotificationAuditDrawer from '@/components/angelcare360/notifications/Angelcare360NotificationAuditDrawer'
import { listAngelcare360NotificationAuditEvents } from '@/lib/angelcare360/server/notifications'
import { getAngelcare360NotificationsContext, secondaryLinkStyle } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360NotificationAuditPage() {
  const context = await getAngelcare360NotificationsContext()
  const events = await listAngelcare360NotificationAuditEvents({ schoolId: context.school.id, filters: {} })

  return (
    <Angelcare360NotificationsSectionScreen
      title="Audit notifications"
      description="Journal des actions et blocages sur les notifications internes."
      actions={<Link href="/angelcare-360-command-center/notifications" style={secondaryLinkStyle}>Retour au cockpit</Link>}
    >
      <Angelcare360NotificationAuditDrawer events={events} />
    </Angelcare360NotificationsSectionScreen>
  )
}

