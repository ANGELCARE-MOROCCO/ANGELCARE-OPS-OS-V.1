import B2BOpportunityWarRoom from '@/components/flashcards-os/revenue/B2BOpportunityWarRoom'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { getB2BAccount, getOpportunity } from '@/lib/flashcards-os/revenue/server/repository'
export default async function Page({params}:{params:Promise<{opportunityId:string}>}){await requireFlashcardsPageAccess('flashcards_os.manage_b2b_opportunities');const {opportunityId}=await params;const item=await getOpportunity(opportunityId);if(!item)return null;return <B2BOpportunityWarRoom opportunity={item} account={await getB2BAccount(item.customerId)}/>}
