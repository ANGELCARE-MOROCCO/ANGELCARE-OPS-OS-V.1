import AiSovereigntyOperationsHeadquarters from '@/components/ai-provider-control/headquarters/AiSovereigntyOperationsHeadquarters'
import { requireAiProviderUser } from '@/lib/ai-provider-control/auth'

export const dynamic = 'force-dynamic'

export default async function AiProviderControlPage() {
  const actor = await requireAiProviderUser('view')
  return <AiSovereigntyOperationsHeadquarters actor={{ id: actor.id, name: actor.name, role: actor.role }} />
}
