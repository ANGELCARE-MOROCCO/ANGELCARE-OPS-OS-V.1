import CommercialApprovalChamber from '@/components/flashcards-os/revenue/CommercialApprovalChamber'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { listApprovals } from '@/lib/flashcards-os/revenue/server/repository'
export default async function Page(){await requireFlashcardsPageAccess('flashcards_os.approve_quotations');return <CommercialApprovalChamber approvals={await listApprovals()}/>} 
