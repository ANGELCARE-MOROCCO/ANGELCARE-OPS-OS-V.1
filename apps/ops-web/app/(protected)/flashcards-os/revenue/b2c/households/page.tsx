import { HouseholdRegistry } from '@/components/flashcards-os/revenue/CustomerRegistry'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { listHouseholds } from '@/lib/flashcards-os/revenue/server/repository'
export default async function Page(){await requireFlashcardsPageAccess('flashcards_os.view_b2c_crm');return <HouseholdRegistry households={await listHouseholds()}/>}
