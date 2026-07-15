import Link from 'next/link'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360TransportPageShell from '@/components/angelcare360/transport/Angelcare360TransportPageShell'
import Angelcare360TransportRouteDetail from '@/components/angelcare360/transport/Angelcare360TransportRouteDetail'
import { ANGELCARE360_TRANSPORT_NAVIGATION } from '@/data/angelcare360/transport-navigation'
import { getAngelcare360TransportRouteById } from '@/lib/angelcare360/server/transport'
import { getAngelcare360TransportContext } from '../../_utils'
import { listAngelcare360TransportStops } from '@/lib/angelcare360/server/transport'
import { listAngelcare360TransportAssignments } from '@/lib/angelcare360/server/transport'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function Angelcare360TransportRouteDetailPage({ params }: PageProps) {
  const context = await getAngelcare360TransportContext()
  const { id } = await params
  const [route, stops, assignments] = await Promise.all([
    getAngelcare360TransportRouteById(id),
    listAngelcare360TransportStops({ schoolId: context.school.id, routeId: id }),
    listAngelcare360TransportAssignments({ schoolId: context.school.id, routeId: id }),
  ])

  if (!route) {
    return (
      <Angelcare360EmptyState
        title="Circuit introuvable"
        description="Le circuit demandé n’existe pas dans cet établissement."
        actionLabel="Retour aux circuits"
        actionHref="/angelcare-360-command-center/transport/circuits"
      />
    )
  }

  return (
    <Angelcare360TransportPageShell
      title={`Circuit ${route.label}`}
      subtitle="Lecture détaillée du circuit, de ses arrêts et de son état de préparation."
      badge="Disponible"
      statusLabel={route.status}
      navigationItems={ANGELCARE360_TRANSPORT_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/transport/circuits" style={secondaryLinkStyle}>Retour</Link>}
      contextRow={<Badge label={`Arrêts: ${stops.length}`} />}
    >
      <Angelcare360TransportRouteDetail schoolId={context.school.id} route={{ ...route, stop_count: stops.length, assignment_count: assignments.length, active_assignment_count: assignments.filter((assignment) => assignment.status === 'active').length }} />
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
