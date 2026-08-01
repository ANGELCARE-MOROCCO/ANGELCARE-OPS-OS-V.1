import ConstraintArchitectureStudio from '@/components/flashcards-os/solutions/ConstraintArchitectureStudio'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadSolutionsOverview } from '@/lib/flashcards-os/solutions/server/repository'
export default async function FlashcardsSolutionComposerPage(){await requireFlashcardsPageAccess('flashcards_os.create_solution_requests');const data=await loadSolutionsOverview();return <ConstraintArchitectureStudio releases={data.releases} ontology={data.ontology}/>}
