import B2CVitrineCommand from '@/components/flashcards-os/solutions/B2CVitrineCommand'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadSolutionsOverview } from '@/lib/flashcards-os/solutions/server/repository'
export default async function B2CVitrinePage(){await requireFlashcardsPageAccess('flashcards_os.view_solutions');const data=await loadSolutionsOverview();return <B2CVitrineCommand sellables={data.b2cSellables}/>}
