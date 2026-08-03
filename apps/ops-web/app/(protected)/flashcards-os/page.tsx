import FlashcardsCommandHall2030 from '@/components/flashcards-os/studio/FlashcardsCommandHall2030'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadFlashcardsDashboard } from '@/lib/flashcards-os/server/repository'
import { loadExperienceOverview } from '@/lib/flashcards-os/experience/server/repository'
export default async function Page(){await requireFlashcardsPageAccess('flashcards_os.view');const[dashboard,experience]=await Promise.all([loadFlashcardsDashboard(),loadExperienceOverview()]);return <FlashcardsCommandHall2030 dashboard={dashboard} experience={experience}/>}
