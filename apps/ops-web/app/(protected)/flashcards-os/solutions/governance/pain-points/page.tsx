import ObjectiveOntologyArchitect from '@/components/flashcards-os/solutions/ObjectiveOntologyArchitect'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadSolutionsOverview } from '@/lib/flashcards-os/solutions/server/repository'
export default async function PainPointOntologyPage(){await requireFlashcardsPageAccess('flashcards_os.manage_objective_ontology');const data=await loadSolutionsOverview();return <ObjectiveOntologyArchitect options={data.ontology}/>}
