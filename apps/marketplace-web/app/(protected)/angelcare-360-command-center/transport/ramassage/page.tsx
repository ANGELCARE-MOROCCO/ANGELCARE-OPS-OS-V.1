import Link from 'next/link'
import Angelcare360TransportPageShell from '@/components/angelcare360/transport/Angelcare360TransportPageShell'
import { PickupControl } from '@/components/angelcare360/transport/sovereign/TransportViews'
import { ANGELCARE360_TRANSPORT_NAVIGATION } from '@/data/angelcare360/transport-navigation'
import { getTransportMobilitySnapshot } from '@/lib/angelcare360/server/transport-mobility-command'
import styles from '@/components/angelcare360/transport/sovereign/TransportSovereign.module.css'

export const dynamic = 'force-dynamic'

export default async function Angelcare360TransportPickupPage() {
  const snapshot = await getTransportMobilitySnapshot()
  return <Angelcare360TransportPageShell title="Ramassage" subtitle="Pickup Operations : plan du jour, courses enregistrées, montée, absence et preuves d’événements — sans simulation GPS." badge="Aujourd’hui" statusLabel={`${snapshot.metrics.runsOpen} course(s) ouverte(s)`} navigationItems={ANGELCARE360_TRANSPORT_NAVIGATION} primaryAction={<Link className={styles.shellAction} href="/angelcare-360-command-center/transport/depot">Voir le dépôt</Link>}>
    <PickupControl snapshot={snapshot} />
  </Angelcare360TransportPageShell>
}
