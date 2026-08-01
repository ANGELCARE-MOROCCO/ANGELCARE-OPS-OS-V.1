import ResearchMissionBuilder from '@/components/flashcards-os/intelligence/ResearchMissionBuilder'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'

export default async function NewResearchMissionPage() {
  await requireFlashcardsPageAccess('flashcards_os.create_research')
  return <ResearchMissionBuilder />
}
