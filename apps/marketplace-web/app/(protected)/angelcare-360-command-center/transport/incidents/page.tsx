import Link from 'next/link'
import Angelcare360TransportPageShell from '@/components/angelcare360/transport/Angelcare360TransportPageShell'
import { IncidentCommand } from '@/components/angelcare360/transport/sovereign/TransportViews'
import { ANGELCARE360_TRANSPORT_NAVIGATION } from '@/data/angelcare360/transport-navigation'
import { getTransportMobilitySnapshot } from '@/lib/angelcare360/server/transport-mobility-command'
import styles from '@/components/angelcare360/transport/sovereign/TransportSovereign.module.css'

export const dynamic = 'force-dynamic'

export default async function Angelcare360TransportIncidentsPage() {
  const snapshot = await getTransportMobilitySnapshot()
  const incidentCount = snapshot.runs.filter((run) => run.status === 'incident').length + snapshot.events.filter((event) => event.eventType === 'incident').length + snapshot.safetyChecks.filter((check) => ['failed', 'blocked'].includes(check.result)).length
  return <Angelcare360TransportPageShell title="Incidents" subtitle="Incident Truth : consolider uniquement les incidents, exceptions de course et échecs sécurité réellement enregistrés par l’autorité active." badge="Incident Command" statusLabel={incidentCount ? `${incidentCount} signal(s)` : 'Aucun signal ouvert'} navigationItems={ANGELCARE360_TRANSPORT_NAVIGATION} primaryAction={<Link className={styles.shellAction} href="/angelcare-360-command-center/transport/securite">Sécurité</Link>}>
    <IncidentCommand snapshot={snapshot} />
  </Angelcare360TransportPageShell>
}
