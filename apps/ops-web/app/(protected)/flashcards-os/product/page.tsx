import PortfolioLandscape from '@/components/flashcards-os/PortfolioLandscape'
import { loadFlashcardsDashboard } from '@/lib/flashcards-os/server/repository'

export default async function FlashcardsPortfolioPage() {
  const data = await loadFlashcardsDashboard()
  return <PortfolioLandscape data={data} />
}
