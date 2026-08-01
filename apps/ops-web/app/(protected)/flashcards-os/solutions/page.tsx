import SolutionsCommandBridge from '@/components/flashcards-os/solutions/SolutionsCommandBridge'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadSolutionsOverview } from '@/lib/flashcards-os/solutions/server/repository'
export default async function FlashcardsSolutionsPage(){await requireFlashcardsPageAccess('flashcards_os.view_solutions');return <SolutionsCommandBridge data={await loadSolutionsOverview()}/>}
