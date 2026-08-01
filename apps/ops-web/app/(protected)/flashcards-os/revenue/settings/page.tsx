import RevenueGovernanceConsole from '@/components/flashcards-os/revenue/RevenueGovernanceConsole'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
export default async function Page(){await requireFlashcardsPageAccess('flashcards_os.manage_document_settings');return <RevenueGovernanceConsole/>}
