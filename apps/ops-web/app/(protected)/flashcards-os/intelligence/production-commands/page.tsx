import ProductionCommandPortfolio from '@/components/flashcards-os/production/ProductionCommandPortfolio'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadProductionOverview } from '@/lib/flashcards-os/production/server/repository'
export default async function Page(){await requireFlashcardsPageAccess('flashcards_os.view_commands');return <ProductionCommandPortfolio data={await loadProductionOverview()}/>}
