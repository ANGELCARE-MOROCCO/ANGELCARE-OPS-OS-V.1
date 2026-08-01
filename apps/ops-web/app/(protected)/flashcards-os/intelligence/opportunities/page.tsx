import OpportunityRadar from '@/components/flashcards-os/intelligence/OpportunityRadar'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadIntelligenceOverview } from '@/lib/flashcards-os/intelligence/server/repository'

export default async function OpportunitiesPage() {
  await requireFlashcardsPageAccess('flashcards_os.manage_opportunities')
  const data = await loadIntelligenceOverview()
  return <OpportunityRadar opportunities={data.opportunities} />
}
