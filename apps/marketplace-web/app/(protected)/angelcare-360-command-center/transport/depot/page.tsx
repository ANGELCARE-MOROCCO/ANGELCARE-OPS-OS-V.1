import Link from 'next/link'
import Angelcare360TransportPageShell from '@/components/angelcare360/transport/Angelcare360TransportPageShell'
import { DropoffControl } from '@/components/angelcare360/transport/sovereign/TransportViews'
import { ANGELCARE360_TRANSPORT_NAVIGATION } from '@/data/angelcare360/transport-navigation'
import { getTransportMobilitySnapshot } from '@/lib/angelcare360/server/transport-mobility-command'
import styles from '@/components/angelcare360/transport/sovereign/TransportSovereign.module.css'

export const dynamic = 'force-dynamic'

export default async function Angelcare360TransportDropoffPage() {
  const snapshot = await getTransportMobilitySnapshot()
  return <Angelcare360TransportPageShell title="Dépôt" subtitle="Dropoff Operations : élèves à déposer, événements enregistrés, enfants restant à résoudre et clôture factuelle du service." badge="Retour élèves" statusLabel={`${snapshot.metrics.runsOpen} course(s) ouverte(s)`} navigationItems={ANGELCARE360_TRANSPORT_NAVIGATION} primaryAction={<Link className={styles.shellAction} href="/angelcare-360-command-center/transport/ramassage">Voir le ramassage</Link>}>
    <DropoffControl snapshot={snapshot} />
  </Angelcare360TransportPageShell>
}
