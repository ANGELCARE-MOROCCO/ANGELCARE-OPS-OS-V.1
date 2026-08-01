import ReturnExchangeRoom from '@/components/flashcards-os/experience/ReturnExchangeRoom'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadExperienceOverview } from '@/lib/flashcards-os/experience/server/repository'
export default async function Page(){await requireFlashcardsPageAccess('flashcards_os.manage_returns');const data=await loadExperienceOverview();return <ReturnExchangeRoom returns={data.returns} exchanges={data.exchanges} cases={data.cases}/>}
