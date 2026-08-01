import ShipmentControlTower from '@/components/flashcards-os/experience/ShipmentControlTower'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadExperienceOverview } from '@/lib/flashcards-os/experience/server/repository'
export default async function Page(){await requireFlashcardsPageAccess('flashcards_os.manage_shipments');const data=await loadExperienceOverview();return <ShipmentControlTower shipments={data.shipments} plans={data.fulfilmentPlans}/>}
