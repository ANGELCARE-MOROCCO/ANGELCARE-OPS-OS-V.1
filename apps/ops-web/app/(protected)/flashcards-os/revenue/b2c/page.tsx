import B2CPipelineTheatre from '@/components/flashcards-os/revenue/B2CPipelineTheatre'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { listOpportunities } from '@/lib/flashcards-os/revenue/server/repository'
export default async function Page(){await requireFlashcardsPageAccess('flashcards_os.view_b2c_crm');return <B2CPipelineTheatre opportunities={await listOpportunities('b2c')}/>}
