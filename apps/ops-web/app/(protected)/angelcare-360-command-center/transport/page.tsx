import Link from 'next/link'
import Angelcare360TransportHub from '@/components/angelcare360/transport/Angelcare360TransportHub'
import Angelcare360TransportPageShell from '@/components/angelcare360/transport/Angelcare360TransportPageShell'
import { ANGELCARE360_TRANSPORT_NAVIGATION } from '@/data/angelcare360/transport-navigation'
import { getAngelcare360TransportOverview } from '@/lib/angelcare360/server/transport'
import { getAngelcare360TransportContext } from './_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360TransportPage() {
  const context = await getAngelcare360TransportContext()
  const overview = await getAngelcare360TransportOverview({ schoolId: context.school.id })

  const contextRow = (
    <>
      <Badge label={`Établissement: ${overview.schoolName}`} />
      <Badge label={`Année: ${overview.activeAcademicYearLabel || 'Non résolue'}`} />
      <Badge label={`Circuits actifs: ${overview.activeRouteCount}`} />
      <Badge label={`Véhicules actifs: ${overview.activeVehicleCount}`} />
    </>
  )

  return (
    <Angelcare360TransportPageShell
      title="Transport & Sécurité"
      subtitle="Le cockpit transport suit les circuits, les arrêts, les véhicules, les affectations élèves et les verrouillages de sécurité."
      badge="Disponible"
      statusLabel={overview.safety.overallStatus === 'ready' ? 'Prêt' : 'Contrôle requis'}
      contextRow={contextRow}
      navigationItems={ANGELCARE360_TRANSPORT_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/transport/circuits" style={primaryLinkStyle}>Voir les circuits</Link>}
      secondaryActions={<Link href="/angelcare-360-command-center/transport/audit" style={secondaryLinkStyle}>Audit transport</Link>}
    >
      <Angelcare360TransportHub overview={overview} />
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

const primaryLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 14,
  border: '1px solid #0f172a',
  background: '#0f172a',
  color: '#fff',
  padding: '10px 14px',
  textDecoration: 'none',
  fontWeight: 800,
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

