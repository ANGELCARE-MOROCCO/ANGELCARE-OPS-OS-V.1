import TaxonomyAtlas from '@/components/flashcards-os/TaxonomyAtlas'
import { loadTaxonomyAtlas } from '@/lib/flashcards-os/server/repository'

export default async function FlashcardsTaxonomyPage() {
  const data = await loadTaxonomyAtlas()
  return <TaxonomyAtlas nodes={data.nodes} sourceMode={data.sourceMode} />
}
