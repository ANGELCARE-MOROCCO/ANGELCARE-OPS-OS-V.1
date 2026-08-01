import OpportunityRegistry from '@/components/flashcards-os/revenue/OpportunityRegistry'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { listB2BAccounts, listOpportunities } from '@/lib/flashcards-os/revenue/server/repository'
export default async function Page(){await requireFlashcardsPageAccess('flashcards_os.manage_b2b_opportunities');const [opportunities,accounts]=await Promise.all([listOpportunities('b2b'),listB2BAccounts()]);return <OpportunityRegistry universe="b2b" opportunities={opportunities} customers={accounts.map(item=>({id:item.id,name:item.commercialName,universe:'b2b' as const}))}/>}
