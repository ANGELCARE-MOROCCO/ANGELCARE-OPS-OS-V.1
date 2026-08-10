import Link from 'next/link'
import Angelcare360CommunicationAuditDrawer from '@/components/angelcare360/communication/Angelcare360CommunicationAuditDrawer'
import Angelcare360CommunicationSectionScreen from '@/components/angelcare360/communication/Angelcare360CommunicationSectionScreen'
import { listAngelcare360CommunicationAuditEvents } from '@/lib/angelcare360/server/communication'
import { getAngelcare360CommunicationContext, secondaryLinkStyle } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360CommunicationAuditPage() {
  const context = await getAngelcare360CommunicationContext()
  const events = await listAngelcare360CommunicationAuditEvents({ schoolId: context.school.id, filters: {} })

  return (
    <Angelcare360CommunicationSectionScreen
      title="Audit messagerie"
      description="Journal des actions communication, annonces, modèles et verrouillages des canaux externes."
      actions={<Link href="/angelcare-360-command-center/messagerie" style={secondaryLinkStyle}>Retour au cockpit</Link>}
    >
      <Angelcare360CommunicationAuditDrawer events={events} />
    </Angelcare360CommunicationSectionScreen>
  )
}

