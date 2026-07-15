import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360TransportPageShell from '@/components/angelcare360/transport/Angelcare360TransportPageShell'
import Angelcare360TransportRoutesWorkspace from '@/components/angelcare360/transport/Angelcare360TransportRoutesWorkspace'
import { ANGELCARE360_TRANSPORT_NAVIGATION } from '@/data/angelcare360/transport-navigation'
import { listAngelcare360TransportRoutes } from '@/lib/angelcare360/server/transport'
import { getAngelcare360TransportContext } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360TransportCircuitsPage() {
  const context = await getAngelcare360TransportContext()
  const routes = await listAngelcare360TransportRoutes({ schoolId: context.school.id })

  return (
    <Angelcare360TransportPageShell
      title="Circuits"
      subtitle="Création, édition et lecture des circuits de transport avec contrôle de capacité et journal d’audit."
      badge="Disponible"
      statusLabel={`${routes.length} circuit(s)`}
      navigationItems={ANGELCARE360_TRANSPORT_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/transport" style={secondaryLinkStyle}>Retour au cockpit</Link>}
    >
      {routes.length === 0 ? (
        <Angelcare360EmptyState
          title="Aucun circuit"
          description="Créez un circuit pour commencer à rattacher des arrêts, véhicules et chauffeurs."
        />
      ) : (
        <Angelcare360TransportRoutesWorkspace schoolId={context.school.id} routes={routes} />
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

