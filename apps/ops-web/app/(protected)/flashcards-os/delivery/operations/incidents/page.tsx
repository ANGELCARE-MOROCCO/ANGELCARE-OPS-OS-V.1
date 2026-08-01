import IncidentCommandCentre from '@/components/flashcards-os/experience/IncidentCommandCentre'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadExperienceOverview } from '@/lib/flashcards-os/experience/server/repository'
export default async function Page(){await requireFlashcardsPageAccess('flashcards_os.manage_incidents');const data=await loadExperienceOverview();return <IncidentCommandCentre incidents={data.incidents}/>}
