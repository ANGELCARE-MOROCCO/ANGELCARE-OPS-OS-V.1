import { notFound } from 'next/navigation'
import OpportunityDossier from '@/components/flashcards-os/intelligence/OpportunityDossier'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadProductOpportunity } from '@/lib/flashcards-os/intelligence/server/repository'

export default async function OpportunityPage({ params }: { params: Promise<{ opportunityId: string }> }) {
  await requireFlashcardsPageAccess('flashcards_os.manage_opportunities')
  const { opportunityId } = await params
  const opportunity = await loadProductOpportunity(decodeURIComponent(opportunityId))
  if (!opportunity.opportunity) notFound()
  return <OpportunityDossier opportunity={opportunity.opportunity} />
}
