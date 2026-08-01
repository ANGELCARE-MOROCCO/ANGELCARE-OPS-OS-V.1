import ReconciliationControlRoom from '@/components/flashcards-os/experience/ReconciliationControlRoom'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadExperienceOverview } from '@/lib/flashcards-os/experience/server/repository'
export default async function Page(){await requireFlashcardsPageAccess('flashcards_os.run_reconciliation');const data=await loadExperienceOverview();return <ReconciliationControlRoom runs={data.reconciliations}/>}
