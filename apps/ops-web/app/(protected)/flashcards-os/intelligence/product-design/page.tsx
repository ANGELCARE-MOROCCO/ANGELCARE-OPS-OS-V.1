import ProductDesignPortfolio from '@/components/flashcards-os/intelligence/ProductDesignPortfolio'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadIntelligenceOverview } from '@/lib/flashcards-os/intelligence/server/repository'

export default async function ProductDesignPage() {
  await requireFlashcardsPageAccess('flashcards_os.manage_product_design')
  const data = await loadIntelligenceOverview()
  return <ProductDesignPortfolio designs={data.designs} />
}
