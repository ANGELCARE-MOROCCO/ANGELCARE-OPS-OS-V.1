import { notFound } from 'next/navigation'
import ResearchSynthesisChamber from '@/components/flashcards-os/intelligence/ResearchSynthesisChamber'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadResearchSynthesis } from '@/lib/flashcards-os/intelligence/server/repository'

export default async function ResearchSynthesisPage({ params }: { params: Promise<{ synthesisId: string }> }) {
  await requireFlashcardsPageAccess('flashcards_os.view_intelligence')
  const { synthesisId } = await params
  const synthesis = await loadResearchSynthesis(decodeURIComponent(synthesisId))
  if (!synthesis.synthesis || !synthesis.mission) notFound()
  return <ResearchSynthesisChamber mission={synthesis.mission} synthesis={synthesis.synthesis} claims={synthesis.claims} />
}
