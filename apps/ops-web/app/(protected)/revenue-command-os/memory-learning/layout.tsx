import { requireAccess } from '@/lib/auth/requireAccess'
import { readRevenueKnowledgeMemory } from '@/lib/revenue-command-os/knowledge-memory/repository'
import { KnowledgeMemoryProvider } from './_components/KnowledgeMemoryContext'
import KnowledgeMemoryFrame from './_components/KnowledgeMemoryFrame'

export const dynamic = 'force-dynamic'

export default async function RevenueKnowledgeMemoryLayout({ children }: { children: React.ReactNode }) {
  await requireAccess(['revenue_os.knowledge.manage', 'revenue_os.view', 'revenue.view'])
  const { bootstrap } = await readRevenueKnowledgeMemory()
  return <KnowledgeMemoryProvider initialKnowledge={bootstrap}><KnowledgeMemoryFrame>{children}</KnowledgeMemoryFrame></KnowledgeMemoryProvider>
}
