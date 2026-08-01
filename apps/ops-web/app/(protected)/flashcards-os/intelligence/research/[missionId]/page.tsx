import { notFound } from 'next/navigation'
import ResearchObservatory from '@/components/flashcards-os/intelligence/ResearchObservatory'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadResearchMission } from '@/lib/flashcards-os/intelligence/server/repository'

export default async function ResearchMissionPage({ params }: { params: Promise<{ missionId: string }> }) {
  await requireFlashcardsPageAccess('flashcards_os.view_intelligence')
  const { missionId } = await params
  const result = await loadResearchMission(decodeURIComponent(missionId))
  if (!result.mission) notFound()
  return <ResearchObservatory mission={result.mission} sources={result.sources} claims={result.claims} />
}
