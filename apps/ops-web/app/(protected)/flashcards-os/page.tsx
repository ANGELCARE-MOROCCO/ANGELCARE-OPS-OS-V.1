import ExecutiveCommandTheatre from '@/components/flashcards-os/experience/ExecutiveCommandTheatre'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadFlashcardsDashboard } from '@/lib/flashcards-os/server/repository'
import { loadExperienceOverview } from '@/lib/flashcards-os/experience/server/repository'
export default async function Page(){await requireFlashcardsPageAccess('flashcards_os.view_executive');const [legacy,data]=await Promise.all([loadFlashcardsDashboard(),loadExperienceOverview()]);return <ExecutiveCommandTheatre data={data} legacy={{totalCollections:legacy.collections,knownCards:legacy.expectedCards,openIssues:legacy.openIssues}}/>}
