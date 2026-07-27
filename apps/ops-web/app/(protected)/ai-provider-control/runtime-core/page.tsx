import AiProviderControlWorkspace from '@/components/ai-provider-control/AiProviderControlWorkspace'
import { requireAiProviderUser } from '@/lib/ai-provider-control/auth'

export const dynamic = 'force-dynamic'

export default async function AiProviderRuntimeCorePage() {
  const actor = await requireAiProviderUser('view')
  return <AiProviderControlWorkspace actor={{ id: actor.id, name: actor.name, role: actor.role }} />
}
