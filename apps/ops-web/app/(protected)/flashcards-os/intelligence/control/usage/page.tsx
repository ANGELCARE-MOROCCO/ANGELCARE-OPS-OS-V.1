import UsageControlCentre from '@/components/flashcards-os/intelligence/UsageControlCentre'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadIntelligenceOverview } from '@/lib/flashcards-os/intelligence/server/repository'

export default async function UsageControlPage() {
  await requireFlashcardsPageAccess('flashcards_os.view_intelligence_costs')
  const data = await loadIntelligenceOverview()
  return <UsageControlCentre usage={data.usage} runs={data.runs} />
}
