import LearningJourneyRequestStudio from '@/components/flashcards-os/solutions/LearningJourneyRequestStudio'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadSolutionsOverview } from '@/lib/flashcards-os/solutions/server/repository'
export default async function NewJourneyPage(){await requireFlashcardsPageAccess('flashcards_os.create_journey_requests');const data=await loadSolutionsOverview();return <LearningJourneyRequestStudio ontology={data.ontology} releases={data.releases}/>}
