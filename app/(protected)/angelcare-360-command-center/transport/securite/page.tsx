import Link from 'next/link'
import Angelcare360TransportPageShell from '@/components/angelcare360/transport/Angelcare360TransportPageShell'
import Angelcare360TransportSafetyWorkspace from '@/components/angelcare360/transport/Angelcare360TransportSafetyWorkspace'
import { ANGELCARE360_TRANSPORT_NAVIGATION } from '@/data/angelcare360/transport-navigation'
import { getAngelcare360TransportSafetyReadiness } from '@/lib/angelcare360/server/transport'
import { getAngelcare360TransportContext } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360TransportSafetyPage() {
  const context = await getAngelcare360TransportContext()
  const safety = await getAngelcare360TransportSafetyReadiness({ schoolId: context.school.id, academicYearId: context.academicYear?.id || null })

  return (
    <Angelcare360TransportPageShell
      title="Sécurité"
      subtitle="Contrôle des chauffeurs, accompagnateurs, capacité, arrêt et verrous techniques."
      badge="Disponible"
      statusLabel={safety.overallStatus}
      navigationItems={ANGELCARE360_TRANSPORT_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/transport" style={secondaryLinkStyle}>Retour au cockpit</Link>}
    >
      <Angelcare360TransportSafetyWorkspace schoolId={context.school.id} safety={safety} />
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

