import B2CPipelineTheatre from '@/components/flashcards-os/revenue/B2CPipelineTheatre'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { getOpportunity } from '@/lib/flashcards-os/revenue/server/repository'
export default async function Page({params}:{params:Promise<{opportunityId:string}>}){await requireFlashcardsPageAccess('flashcards_os.manage_b2c_opportunities');const {opportunityId}=await params;const item=await getOpportunity(opportunityId);return item?<B2CPipelineTheatre opportunities={[item]}/>:null}
