import PhysicalFulfilmentBoard from '@/components/flashcards-os/experience/PhysicalFulfilmentBoard'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadExperienceOverview } from '@/lib/flashcards-os/experience/server/repository'
export default async function Page(){await requireFlashcardsPageAccess('flashcards_os.manage_physical_fulfilment');const data=await loadExperienceOverview();return <PhysicalFulfilmentBoard workOrders={data.workOrders} plans={data.fulfilmentPlans}/>}
