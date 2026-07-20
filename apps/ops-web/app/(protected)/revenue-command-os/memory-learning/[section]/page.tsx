import { notFound } from 'next/navigation'
import { REVENUE_KNOWLEDGE_SECTIONS } from '@/lib/revenue-command-os/knowledge-memory/constants'
import type { RevenueKnowledgeSectionKey } from '@/lib/revenue-command-os/types'
import KnowledgeMemoryWorkspace from '../_components/KnowledgeMemoryWorkspace'

export const dynamic = 'force-dynamic'

export default async function RevenueKnowledgeMemorySectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  const found = REVENUE_KNOWLEDGE_SECTIONS.find((item) => item.key === section && item.key !== 'overview')
  if (!found) notFound()
  return <KnowledgeMemoryWorkspace sectionKey={found.key as RevenueKnowledgeSectionKey} />
}
