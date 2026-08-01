import B2CHousehold360 from '@/components/flashcards-os/revenue/B2CHousehold360'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { getHousehold, listOpportunities } from '@/lib/flashcards-os/revenue/server/repository'
export default async function Page({params}:{params:Promise<{householdId:string}>}){await requireFlashcardsPageAccess('flashcards_os.view_b2c_crm');const {householdId}=await params;const household=await getHousehold(householdId);if(!household)return null;return <B2CHousehold360 household={household} opportunities={(await listOpportunities('b2c')).filter(item=>item.customerId===household.id)}/>}
