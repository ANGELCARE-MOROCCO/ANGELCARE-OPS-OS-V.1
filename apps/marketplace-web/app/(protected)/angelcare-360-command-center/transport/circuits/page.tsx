import Link from 'next/link'
import Angelcare360TransportPageShell from '@/components/angelcare360/transport/Angelcare360TransportPageShell'
import { RoutesCommand } from '@/components/angelcare360/transport/sovereign/TransportViews'
import { ANGELCARE360_TRANSPORT_NAVIGATION } from '@/data/angelcare360/transport-navigation'
import { getTransportMobilitySnapshot } from '@/lib/angelcare360/server/transport-mobility-command'
import styles from '@/components/angelcare360/transport/sovereign/TransportSovereign.module.css'

export const dynamic = 'force-dynamic'

export default async function Angelcare360TransportCircuitsPage() {
  const snapshot = await getTransportMobilitySnapshot()
  const incomplete = snapshot.routes.filter((route) => route.status === 'active' && (!route.vehicleId || !route.driverId || route.stopCount === 0 || route.capacityPressure)).length
  return <Angelcare360TransportPageShell
    title="Circuits"
    subtitle="Route Command : préparation, charge, séquence d’arrêts, véhicule, chauffeur et population transportée."
    badge="Route Command"
    statusLabel={incomplete ? `${incomplete} à revoir` : `${snapshot.routes.length} circuit(s)`}
    navigationItems={ANGELCARE360_TRANSPORT_NAVIGATION}
    primaryAction={<Link className={styles.shellAction} href="/angelcare-360-command-center/transport">Retour au cockpit</Link>}
  >
    <RoutesCommand snapshot={snapshot} />
  </Angelcare360TransportPageShell>
}
