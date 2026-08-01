import B2BSolutionPortfolio from '@/components/flashcards-os/solutions/B2BSolutionPortfolio'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadSolutionsOverview } from '@/lib/flashcards-os/solutions/server/repository'
export default async function B2BPortfolioPage(){await requireFlashcardsPageAccess('flashcards_os.view_solutions');const data=await loadSolutionsOverview();return <B2BSolutionPortfolio sellables={data.b2bSellables}/>}
