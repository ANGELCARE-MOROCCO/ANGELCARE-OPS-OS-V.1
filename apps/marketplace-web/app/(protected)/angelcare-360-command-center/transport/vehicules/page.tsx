import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360TransportPageShell from '@/components/angelcare360/transport/Angelcare360TransportPageShell'
import Angelcare360TransportVehiclesWorkspace from '@/components/angelcare360/transport/Angelcare360TransportVehiclesWorkspace'
import { ANGELCARE360_TRANSPORT_NAVIGATION } from '@/data/angelcare360/transport-navigation'
import { listAngelcare360TransportVehicles } from '@/lib/angelcare360/server/transport'
import { getAngelcare360TransportContext } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360TransportVehiclesPage() {
  const context = await getAngelcare360TransportContext()
  const vehicles = await listAngelcare360TransportVehicles({ schoolId: context.school.id })

  return (
    <Angelcare360TransportPageShell
      title="Véhicules"
      subtitle="Lecture et édition des véhicules scolaires, de leur capacité et de leur statut opérationnel."
      badge="Disponible"
      statusLabel={`${vehicles.length} véhicule(s)`}
      navigationItems={ANGELCARE360_TRANSPORT_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/transport" style={secondaryLinkStyle}>Retour au cockpit</Link>}
    >
      {vehicles.length === 0 ? (
        <Angelcare360EmptyState
          title="Aucun véhicule"
          description="Créez un véhicule pour pouvoir affecter des circuits et des chauffeurs."
          actionLabel="Voir les circuits"
          actionHref="/angelcare-360-command-center/transport/circuits"
        />
      ) : (
        <Angelcare360TransportVehiclesWorkspace schoolId={context.school.id} vehicles={vehicles} />
      )}
    </Angelcare360TransportPageShell>
  )
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

