import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360TransportPageShell from '@/components/angelcare360/transport/Angelcare360TransportPageShell'
import Angelcare360TransportVehicleDetail from '@/components/angelcare360/transport/Angelcare360TransportVehicleDetail'
import { ANGELCARE360_TRANSPORT_NAVIGATION } from '@/data/angelcare360/transport-navigation'
import { getAngelcare360TransportVehicleById } from '@/lib/angelcare360/server/transport'
import { getAngelcare360TransportContext } from '../../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360TransportVehicleDetailPage({ params }: { params: { id: string } }) {
  const context = await getAngelcare360TransportContext()
  const vehicle = await getAngelcare360TransportVehicleById(params.id)

  if (!vehicle) {
    return (
      <Angelcare360EmptyState
        title="Véhicule introuvable"
        description="Le véhicule demandé n’existe pas dans cet établissement."
        actionLabel="Retour aux véhicules"
        actionHref="/angelcare-360-command-center/transport/vehicules"
      />
    )
  }

  return (
    <Angelcare360TransportPageShell
      title={`Véhicule ${vehicle.vehicle_code}`}
      subtitle="Détail du véhicule, capacité, chauffeur et affectation du circuit."
      badge="Disponible"
      statusLabel={vehicle.status}
      navigationItems={ANGELCARE360_TRANSPORT_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/transport/vehicules" style={secondaryLinkStyle}>Retour</Link>}
      contextRow={<Badge label={`Plaque: ${vehicle.plate_number}`} />}
    >
      <Angelcare360TransportVehicleDetail schoolId={context.school.id} vehicle={vehicle} />
    </Angelcare360TransportPageShell>
  )
}

function Badge({ label }: { label: string }) {
  return <span style={badgeStyle}>{label}</span>
}

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  padding: '6px 10px',
  background: '#f0f9ff',
  color: '#0369a1',
  fontSize: 12,
  fontWeight: 900,
}

const secondaryLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 14,
  border: '1px solid #cbd5e1',
  background: '#fff',
  color: '#0f172a',
  padding: '10px 14px',
  textDecoration: 'none',
  fontWeight: 800,
}

