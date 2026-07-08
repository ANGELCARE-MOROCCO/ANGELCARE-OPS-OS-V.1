import Link from 'next/link'
import Angelcare360TransportNotificationsWorkspace from '@/components/angelcare360/transport/Angelcare360TransportNotificationsWorkspace'
import Angelcare360TransportPageShell from '@/components/angelcare360/transport/Angelcare360TransportPageShell'
import { ANGELCARE360_TRANSPORT_NAVIGATION } from '@/data/angelcare360/transport-navigation'
import { getAngelcare360TransportNotificationReadiness } from '@/lib/angelcare360/server/transport'
import { getAngelcare360TransportContext } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360TransportNotificationsPage() {
  const context = await getAngelcare360TransportContext()
  const readiness = await getAngelcare360TransportNotificationReadiness({ schoolId: context.school.id })

  return (
    <Angelcare360TransportPageShell
      title="Notifications"
      subtitle="Les notifications parents restent verrouillées tant que le module Messagerie n’est pas actif."
      badge="Phase 10"
      statusLabel={readiness.overallStatus}
      navigationItems={ANGELCARE360_TRANSPORT_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/transport" style={secondaryLinkStyle}>Retour au cockpit</Link>}
    >
      <Angelcare360TransportNotificationsWorkspace schoolId={context.school.id} readiness={readiness} />
    </Angelcare360TransportPageShell>
  )
}

const secondaryLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 14,
  border: '1px solid #cbd5e1',
  background: '#fff',
  color: '#0f172a',
  padding: '10px 14px',
  textDecoration: 'none',
  fontWeight: 800,
}

