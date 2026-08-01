import PricingControlLedger from '@/components/flashcards-os/solutions/PricingControlLedger'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadSolutionsOverview } from '@/lib/flashcards-os/solutions/server/repository'
export default async function PricingControlPage(){await requireFlashcardsPageAccess('flashcards_os.manage_price_books');const data=await loadSolutionsOverview();return <PricingControlLedger releases={data.releases} priceBooks={data.priceBooks} scenarios={data.scenarios}/>}
