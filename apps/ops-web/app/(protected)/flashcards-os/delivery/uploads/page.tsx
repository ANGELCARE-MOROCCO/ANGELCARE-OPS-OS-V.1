import LargeUploadStation from '@/components/flashcards-os/production/LargeUploadStation'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadProductionOverview } from '@/lib/flashcards-os/production/server/repository'
export default async function Page(){await requireFlashcardsPageAccess('flashcards_os.upload_deliverables');return <LargeUploadStation data={await loadProductionOverview()}/>}
