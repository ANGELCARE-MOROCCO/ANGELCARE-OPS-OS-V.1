import RefundApprovalChamber from '@/components/flashcards-os/experience/RefundApprovalChamber'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadExperienceOverview } from '@/lib/flashcards-os/experience/server/repository'
export default async function Page(){await requireFlashcardsPageAccess('flashcards_os.view_refunds');const data=await loadExperienceOverview();return <RefundApprovalChamber refunds={data.refunds}/>}
