import Link from 'next/link'
import Angelcare360TransportPageShell from '@/components/angelcare360/transport/Angelcare360TransportPageShell'
import { SafetyDepartureGate } from '@/components/angelcare360/transport/sovereign/TransportViews'
import { ANGELCARE360_TRANSPORT_NAVIGATION } from '@/data/angelcare360/transport-navigation'
import { getTransportMobilitySnapshot } from '@/lib/angelcare360/server/transport-mobility-command'
import styles from '@/components/angelcare360/transport/sovereign/TransportSovereign.module.css'

export const dynamic = 'force-dynamic'

export default async function Angelcare360TransportSafetyPage() {
  const snapshot = await getTransportMobilitySnapshot()
  const blockers = snapshot.metrics.failedSafetyChecks + snapshot.metrics.routesWithoutDriver + snapshot.metrics.routesWithoutVehicle + snapshot.metrics.capacityWarnings
  return <Angelcare360TransportPageShell title="Sécurité" subtitle="Departure Safety Gate : véhicule, chauffeur, capacité, conformité et contrôles pré-départ avant mouvement." badge="Safety Gate" statusLabel={blockers ? `${blockers} blocage(s)/alerte(s)` : 'Prêt'} navigationItems={ANGELCARE360_TRANSPORT_NAVIGATION} primaryAction={<Link className={styles.shellAction} href="/angelcare-360-command-center/transport">Retour au cockpit</Link>}>
    <SafetyDepartureGate snapshot={snapshot} />
  </Angelcare360TransportPageShell>
}
