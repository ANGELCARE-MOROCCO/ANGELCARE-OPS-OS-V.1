import CXResolutionCockpit from '@/components/flashcards-os/experience/CXResolutionCockpit'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadExperienceOverview } from '@/lib/flashcards-os/experience/server/repository'
import { listHouseholds, listB2BAccounts } from '@/lib/flashcards-os/revenue/server/repository'
export default async function Page(){await requireFlashcardsPageAccess('flashcards_os.view_customer_experience');const [data,households,accounts]=await Promise.all([loadExperienceOverview(),listHouseholds(),listB2BAccounts()]);return <CXResolutionCockpit data={data} customers={[...households.map(x=>({id:x.id,name:x.displayName,universe:'b2c' as const})),...accounts.map(x=>({id:x.id,name:x.commercialName||x.legalName,universe:'b2b' as const}))]}/>}
