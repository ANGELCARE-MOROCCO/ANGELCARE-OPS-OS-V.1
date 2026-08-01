import OperationalHealthCentre from '@/components/flashcards-os/experience/OperationalHealthCentre'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadExperienceOverview } from '@/lib/flashcards-os/experience/server/repository'
export default async function Page(){await requireFlashcardsPageAccess('flashcards_os.view_operational_health');const data=await loadExperienceOverview();return <OperationalHealthCentre checks={data.healthChecks} incidents={data.incidents}/>}
