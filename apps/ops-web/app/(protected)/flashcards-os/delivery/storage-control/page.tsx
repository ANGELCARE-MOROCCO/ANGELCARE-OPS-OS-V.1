import StorageOperationsConsole from '@/components/flashcards-os/production/StorageOperationsConsole'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadProductionOverview } from '@/lib/flashcards-os/production/server/repository'
import { controlledProductionOverview } from '@/lib/flashcards-os/production/bootstrap'
export default async function Page(){await requireFlashcardsPageAccess('flashcards_os.manage_storage');const data=await loadProductionOverview();return <StorageOperationsConsole initial={data.nodes[0]||controlledProductionOverview().nodes[0]}/>}
