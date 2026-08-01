import ExternalProductionDispatchBoard from '@/components/flashcards-os/production/ExternalProductionDispatchBoard'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadProductionOverview } from '@/lib/flashcards-os/production/server/repository'
export default async function Page(){await requireFlashcardsPageAccess('flashcards_os.manage_external_production');const data=await loadProductionOverview();return <ExternalProductionDispatchBoard jobs={data.jobs}/>}
