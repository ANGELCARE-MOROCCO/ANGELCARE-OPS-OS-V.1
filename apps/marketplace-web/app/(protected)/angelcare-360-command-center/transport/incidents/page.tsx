import Link from 'next/link'
import Angelcare360TransportIncidentsWorkspace from '@/components/angelcare360/transport/Angelcare360TransportIncidentsWorkspace'
import Angelcare360TransportPageShell from '@/components/angelcare360/transport/Angelcare360TransportPageShell'
import { ANGELCARE360_TRANSPORT_NAVIGATION } from '@/data/angelcare360/transport-navigation'
import { getAngelcare360TransportContext } from '../_utils'

export const dynamic = 'force-dynamic'

const LOCKED_REASON = 'Aucune table d’incident transport n’est disponible dans le socle actuel. Le module reste en lecture verrouillée tant qu’un schéma dédié n’est pas créé.'

export default async function Angelcare360TransportIncidentsPage() {
  await getAngelcare360TransportContext()

  return (
    <Angelcare360TransportPageShell
      title="Incidents"
      subtitle="Le registre des incidents transport reste verrouillé tant qu’aucun schéma d’incident n’est disponible."
      badge="Disponible"
      statusLabel="Verrouillé"
      navigationItems={ANGELCARE360_TRANSPORT_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/transport" style={secondaryLinkStyle}>Retour au cockpit</Link>}
    >
      <Angelcare360TransportIncidentsWorkspace lockedReason={LOCKED_REASON} />
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
