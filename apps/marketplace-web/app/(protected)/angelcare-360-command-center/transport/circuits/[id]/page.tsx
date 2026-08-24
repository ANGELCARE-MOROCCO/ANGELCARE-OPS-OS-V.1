import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360TransportPageShell from '@/components/angelcare360/transport/Angelcare360TransportPageShell'
import { RouteOperationsChamber } from '@/components/angelcare360/transport/sovereign/TransportViews'
import { ANGELCARE360_TRANSPORT_NAVIGATION } from '@/data/angelcare360/transport-navigation'
import { getTransportRouteDossier } from '@/lib/angelcare360/server/transport-mobility-command'
import styles from '@/components/angelcare360/transport/sovereign/TransportSovereign.module.css'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ id: string }> }

export default async function Angelcare360TransportRouteDetailPage({ params }: PageProps) {
  const { id } = await params
  const dossier = await getTransportRouteDossier(id)
  if (!dossier) return <Angelcare360EmptyState title="Circuit introuvable" description="Le circuit demandé n’existe pas pour cet établissement." actionLabel="Retour aux circuits" actionHref="/angelcare-360-command-center/transport/circuits" />
  return <Angelcare360TransportPageShell
    title={`${dossier.route.code} · ${dossier.route.label}`}
    subtitle="Route Operations Dossier : séquence, population, readiness, exécutions et vérité opérationnelle du circuit."
    badge="Dossier circuit"
    statusLabel={dossier.route.capacityPressure ? 'Capacité à contrôler' : dossier.route.status}
    navigationItems={ANGELCARE360_TRANSPORT_NAVIGATION}
    contextRow={<><span className={styles.contextPill}>{dossier.stops.length} arrêts</span><span className={styles.contextPill}>{dossier.assignments.length} élèves</span><span className={styles.contextPill}>{dossier.runs.length} course(s)</span></>}
    primaryAction={<Link className={styles.shellAction} href="/angelcare-360-command-center/transport/circuits">Tous les circuits</Link>}
  >
    <RouteOperationsChamber snapshot={dossier.snapshot} route={dossier.route} stops={dossier.stops} assignments={dossier.assignments} runs={dossier.runs} />
  </Angelcare360TransportPageShell>
}
