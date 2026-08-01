import ReadyLearningPlansRegistry from '@/components/flashcards-os/solutions/ReadyLearningPlansRegistry'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadSolutionsOverview } from '@/lib/flashcards-os/solutions/server/repository'
export default async function ReadyPlansPage(){await requireFlashcardsPageAccess('flashcards_os.view_solutions');const data=await loadSolutionsOverview();return <ReadyLearningPlansRegistry plans={data.readyPlans}/>}
