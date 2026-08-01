import PilotControlRoom from '@/components/flashcards-os/experience/PilotControlRoom'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadExperienceOverview } from '@/lib/flashcards-os/experience/server/repository'
export default async function Page(){await requireFlashcardsPageAccess('flashcards_os.manage_production_pilot');const data=await loadExperienceOverview();return <PilotControlRoom pilots={data.pilots} incidents={data.incidents}/>}
