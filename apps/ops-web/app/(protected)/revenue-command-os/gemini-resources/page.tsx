import { requireAccess } from '@/lib/auth/requireAccess'
import GeminiResourcesWorkspace from './_components/GeminiResourcesWorkspace'

export const dynamic = 'force-dynamic'

export default async function GeminiResourcesPage() {
  await requireAccess(['revenue_os.strategy.manage', 'revenue_os.ai.generate', 'revenue_os.manage'])
  return <GeminiResourcesWorkspace />
}
