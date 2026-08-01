import EvidenceObservatory from '@/components/flashcards-os/intelligence/EvidenceObservatory'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadIntelligenceOverview } from '@/lib/flashcards-os/intelligence/server/repository'

export default async function EvidencePage() {
  await requireFlashcardsPageAccess('flashcards_os.review_evidence')
  const data = await loadIntelligenceOverview()
  return <EvidenceObservatory missions={data.missions} sources={data.sources} claims={data.claims} />
}
