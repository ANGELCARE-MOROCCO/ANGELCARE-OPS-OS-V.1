import ExperienceCommandBridge from '@/components/flashcards-os/experience/ExperienceCommandBridge'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadExperienceOverview } from '@/lib/flashcards-os/experience/server/repository'
export default async function Page(){await requireFlashcardsPageAccess('flashcards_os.view_delivery_experience');return <ExperienceCommandBridge data={await loadExperienceOverview()}/>}
