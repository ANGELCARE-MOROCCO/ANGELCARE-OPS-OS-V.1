import HardeningGovernanceConsole from '@/components/flashcards-os/experience/HardeningGovernanceConsole'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadExperienceOverview } from '@/lib/flashcards-os/experience/server/repository'
export default async function Page(){await requireFlashcardsPageAccess('flashcards_os.admin_production_hardening');return <HardeningGovernanceConsole data={await loadExperienceOverview()}/>}
