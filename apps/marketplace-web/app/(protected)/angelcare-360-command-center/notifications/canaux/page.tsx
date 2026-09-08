import Link from 'next/link'
import Angelcare360NotificationsSectionScreen from '@/components/angelcare360/notifications/Angelcare360NotificationsSectionScreen'
import Angelcare360NotificationChannelsWorkspace from '@/components/angelcare360/notifications/Angelcare360NotificationChannelsWorkspace'
import { getAngelcare360NotificationChannelReadiness } from '@/lib/angelcare360/server/notifications'
import { getAngelcare360NotificationsContext, secondaryLinkStyle } from '../_utils'
import { requireAngelcare360RouteAccess } from '@/lib/angelcare360/server/route-guard'

export const dynamic = 'force-dynamic'

export default async function Angelcare360NotificationChannelsPage() {
  await requireAngelcare360RouteAccess('/angelcare-360-command-center/notifications/canaux')
  const context = await getAngelcare360NotificationsContext()
  const readiness = await getAngelcare360NotificationChannelReadiness({ schoolId: context.school.id })

  return (
    <Angelcare360NotificationsSectionScreen
      title="Canaux"
      description="Email, SMS, WhatsApp et push restent verrouillés tant qu’une infrastructure réelle n’est pas configurée."
      actions={<Link href="/angelcare-360-command-center/notifications" style={secondaryLinkStyle}>Retour au cockpit</Link>}
    >
      <Angelcare360NotificationChannelsWorkspace readiness={readiness} />
    </Angelcare360NotificationsSectionScreen>
  )
}
