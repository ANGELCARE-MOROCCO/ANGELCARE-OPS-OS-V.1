import Link from 'next/link'
import Angelcare360TransportPageShell from '@/components/angelcare360/transport/Angelcare360TransportPageShell'
import { FleetReadiness } from '@/components/angelcare360/transport/sovereign/TransportViews'
import { ANGELCARE360_TRANSPORT_NAVIGATION } from '@/data/angelcare360/transport-navigation'
import { getTransportMobilitySnapshot } from '@/lib/angelcare360/server/transport-mobility-command'
import styles from '@/components/angelcare360/transport/sovereign/TransportSovereign.module.css'

export const dynamic = 'force-dynamic'

export default async function Angelcare360TransportVehiclesPage() {
  const snapshot = await getTransportMobilitySnapshot()
  return <Angelcare360TransportPageShell title="Véhicules" subtitle="Fleet Readiness Command : capacité, conformité, disponibilité et responsabilité opérationnelle de la flotte." badge="Fleet Readiness" statusLabel={`${snapshot.metrics.activeVehicles}/${snapshot.metrics.vehicles} actifs`} navigationItems={ANGELCARE360_TRANSPORT_NAVIGATION} primaryAction={<Link className={styles.shellAction} href="/angelcare-360-command-center/transport">Retour au cockpit</Link>}>
    <FleetReadiness snapshot={snapshot} />
  </Angelcare360TransportPageShell>
}
