import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360TransportPageShell from '@/components/angelcare360/transport/Angelcare360TransportPageShell'
import { VehicleDossier } from '@/components/angelcare360/transport/sovereign/TransportViews'
import { ANGELCARE360_TRANSPORT_NAVIGATION } from '@/data/angelcare360/transport-navigation'
import { getTransportVehicleDossier } from '@/lib/angelcare360/server/transport-mobility-command'
import styles from '@/components/angelcare360/transport/sovereign/TransportSovereign.module.css'

export const dynamic = 'force-dynamic'
type PageProps = { params: Promise<{ id: string }> }

export default async function Angelcare360TransportVehicleDetailPage({ params }: PageProps) {
  const { id } = await params
  const dossier = await getTransportVehicleDossier(id)
  if (!dossier) return <Angelcare360EmptyState title="Véhicule introuvable" description="Le véhicule demandé n’existe pas pour cet établissement." actionLabel="Retour aux véhicules" actionHref="/angelcare-360-command-center/transport/vehicules" />
  return <Angelcare360TransportPageShell title={`${dossier.vehicle.code} · ${dossier.vehicle.label}`} subtitle="Vehicle Readiness Dossier : capacité, conformité, circuits, courses et contrôles sécurité." badge="Dossier véhicule" statusLabel={dossier.vehicle.status} navigationItems={ANGELCARE360_TRANSPORT_NAVIGATION} primaryAction={<Link className={styles.shellAction} href="/angelcare-360-command-center/transport/vehicules">Toute la flotte</Link>}>
    <VehicleDossier snapshot={dossier.snapshot} vehicle={dossier.vehicle} routes={dossier.routes} runs={dossier.runs} safety={dossier.safety} />
  </Angelcare360TransportPageShell>
}
