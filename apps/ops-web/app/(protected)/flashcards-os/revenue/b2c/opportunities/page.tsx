import OpportunityRegistry from '@/components/flashcards-os/revenue/OpportunityRegistry'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { listHouseholds, listOpportunities } from '@/lib/flashcards-os/revenue/server/repository'
export default async function Page(){await requireFlashcardsPageAccess('flashcards_os.manage_b2c_opportunities');const [opportunities,households]=await Promise.all([listOpportunities('b2c'),listHouseholds()]);return <OpportunityRegistry universe="b2c" opportunities={opportunities} customers={households.map(item=>({id:item.id,name:item.displayName,universe:'b2c' as const}))}/>}
