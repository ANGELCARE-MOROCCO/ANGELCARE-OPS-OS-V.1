import { requireAiProviderUser, aiProviderApiError } from '@/lib/ai-provider-control/auth'
import { loadAiProviderSnapshot } from '@/lib/ai-provider-control/repository'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireAiProviderUser('view')
    return Response.json({ ok: true, data: await loadAiProviderSnapshot() })
  } catch (error) {
    return aiProviderApiError(error)
  }
}
