import IntelligenceCommandBridge from '@/components/flashcards-os/intelligence/IntelligenceCommandBridge'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadIntelligenceOverview } from '@/lib/flashcards-os/intelligence/server/repository'

export default async function FlashcardsIntelligencePage() {
  await requireFlashcardsPageAccess('flashcards_os.view_intelligence')
  return <IntelligenceCommandBridge data={await loadIntelligenceOverview()} />
}
