import Link from 'next/link'
import Angelcare360TransportPageShell from '@/components/angelcare360/transport/Angelcare360TransportPageShell'
import { MobilityCommandTheatre, Watchtower } from '@/components/angelcare360/transport/sovereign/TransportViews'
import { ANGELCARE360_TRANSPORT_NAVIGATION } from '@/data/angelcare360/transport-navigation'
import { getTransportMobilitySnapshot } from '@/lib/angelcare360/server/transport-mobility-command'
import styles from '@/components/angelcare360/transport/sovereign/TransportSovereign.module.css'

export const dynamic = 'force-dynamic'

export default async function Angelcare360TransportPage() {
  const snapshot = await getTransportMobilitySnapshot()
  const blockers = snapshot.metrics.routesWithoutDriver + snapshot.metrics.routesWithoutVehicle + snapshot.metrics.failedSafetyChecks + snapshot.metrics.capacityWarnings

  return (
    <Angelcare360TransportPageShell
      title="Transport & Sécurité"
      subtitle="Pilotez la mobilité scolaire quotidienne sans quitter l’architecture SANILA : circuits, flotte, affectations, ramassage, dépôt, sécurité, exceptions et preuve opérationnelle."
      badge="Opérations scolaires"
      statusLabel={blockers === 0 ? 'Prêt' : `${blockers} point(s) à traiter`}
      contextRow={<>
        <span className={styles.contextPill}>{snapshot.schoolName}</span>
        <span className={styles.contextPill} data-tone={snapshot.authority === 'advanced' ? 'good' : 'warn'}>{snapshot.authority === 'advanced' ? 'Autorité avancée' : 'Planification historique'}</span>
        <span className={styles.contextPill}>GPS live non activé</span>
      </>}
      navigationItems={ANGELCARE360_TRANSPORT_NAVIGATION}
      primaryAction={<Link className={styles.shellAction} href="/angelcare-360-command-center/transport/ramassage">Aujourd’hui</Link>}
      secondaryActions={<Link className={styles.shellAction} href="/angelcare-360-command-center/transport/securite">Contrôle sécurité</Link>}
    >
      <MobilityCommandTheatre snapshot={snapshot} />
      <Watchtower snapshot={snapshot} />
    </Angelcare360TransportPageShell>
  )
}
