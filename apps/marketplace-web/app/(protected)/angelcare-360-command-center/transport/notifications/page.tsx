import Link from 'next/link'
import Angelcare360TransportPageShell from '@/components/angelcare360/transport/Angelcare360TransportPageShell'
import { NotificationsTruth } from '@/components/angelcare360/transport/sovereign/TransportViews'
import { ANGELCARE360_TRANSPORT_NAVIGATION } from '@/data/angelcare360/transport-navigation'
import { getTransportMobilitySnapshot } from '@/lib/angelcare360/server/transport-mobility-command'
import styles from '@/components/angelcare360/transport/sovereign/TransportSovereign.module.css'

export const dynamic = 'force-dynamic'

export default async function Angelcare360TransportNotificationsPage() {
  const snapshot = await getTransportMobilitySnapshot()
  return <Angelcare360TransportPageShell title="Notifications" subtitle="Communication Readiness : distinguer événement interne, message préparé et livraison fournisseur réellement prouvée." badge="Commercial Truth" statusLabel="Fournisseurs externes verrouillés" navigationItems={ANGELCARE360_TRANSPORT_NAVIGATION} primaryAction={<Link className={styles.shellAction} href="/angelcare-360-command-center/transport">Retour au cockpit</Link>}>
    <NotificationsTruth snapshot={snapshot} />
  </Angelcare360TransportPageShell>
}
