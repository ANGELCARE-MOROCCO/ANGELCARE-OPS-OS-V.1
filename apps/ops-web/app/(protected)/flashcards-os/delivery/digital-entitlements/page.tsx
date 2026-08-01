import DigitalEntitlementConsole from '@/components/flashcards-os/experience/DigitalEntitlementConsole'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadExperienceOverview } from '@/lib/flashcards-os/experience/server/repository'
export default async function Page(){await requireFlashcardsPageAccess('flashcards_os.manage_digital_entitlements');const data=await loadExperienceOverview();return <DigitalEntitlementConsole entitlements={data.entitlements} plans={data.fulfilmentPlans}/>}
