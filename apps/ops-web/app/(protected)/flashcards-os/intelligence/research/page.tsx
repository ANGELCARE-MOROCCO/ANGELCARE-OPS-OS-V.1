import ResearchMissionControl from '@/components/flashcards-os/intelligence/ResearchMissionControl'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadIntelligenceOverview } from '@/lib/flashcards-os/intelligence/server/repository'

export default async function ResearchMissionsPage() {
  await requireFlashcardsPageAccess('flashcards_os.view_intelligence')
  const data = await loadIntelligenceOverview()
  return <ResearchMissionControl missions={data.missions} />
}
