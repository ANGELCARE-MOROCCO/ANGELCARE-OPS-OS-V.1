import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360TransportPageShell from '@/components/angelcare360/transport/Angelcare360TransportPageShell'
import Angelcare360TransportStopsWorkspace from '@/components/angelcare360/transport/Angelcare360TransportStopsWorkspace'
import { ANGELCARE360_TRANSPORT_NAVIGATION } from '@/data/angelcare360/transport-navigation'
import { listAngelcare360TransportRoutes, listAngelcare360TransportStops } from '@/lib/angelcare360/server/transport'
import { getAngelcare360TransportContext } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360TransportStopsPage() {
  const context = await getAngelcare360TransportContext()
  const [routes, stops] = await Promise.all([
    listAngelcare360TransportRoutes({ schoolId: context.school.id }),
    listAngelcare360TransportStops({ schoolId: context.school.id }),
  ])

  const routeOptions = routes.map((route) => ({ label: `${route.route_code} · ${route.label}`, value: route.id }))

  return (
    <Angelcare360TransportPageShell
      title="Arrêts"
      subtitle="Création et édition des arrêts, de leur ordre de passage et de leur horaire prévu."
      badge="Phase 10"
      statusLabel={`${stops.length} arrêt(s)`}
      navigationItems={ANGELCARE360_TRANSPORT_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/transport" style={secondaryLinkStyle}>Retour au cockpit</Link>}
    >
      {routes.length === 0 ? (
        <Angelcare360EmptyState
          title="Aucun circuit disponible"
          description="Créez d’abord un circuit pour pouvoir y rattacher des arrêts."
          actionLabel="Créer un circuit"
          actionHref="/angelcare-360-command-center/transport/circuits"
        />
      ) : (
        <Angelcare360TransportStopsWorkspace schoolId={context.school.id} stops={stops} routes={routeOptions} />
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

