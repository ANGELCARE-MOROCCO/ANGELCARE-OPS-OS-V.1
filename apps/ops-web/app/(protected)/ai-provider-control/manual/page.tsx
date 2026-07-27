import AiSovereigntyOperatorAcademy from '@/components/ai-provider-control/headquarters/AiSovereigntyOperatorAcademy'
import { requireAiProviderUser } from '@/lib/ai-provider-control/auth'

export const dynamic = 'force-dynamic'

export default async function AiProviderManualPage() {
  const actor = await requireAiProviderUser('view')
  return <AiSovereigntyOperatorAcademy actor={{ id: actor.id, name: actor.name, role: actor.role }} />
}
