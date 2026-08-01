import ProductVaultRoom from '@/components/flashcards-os/production/ProductVaultRoom'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadProductionOverview } from '@/lib/flashcards-os/production/server/repository'
export default async function Page(){await requireFlashcardsPageAccess('flashcards_os.view_vault');return <ProductVaultRoom data={await loadProductionOverview()}/>}
