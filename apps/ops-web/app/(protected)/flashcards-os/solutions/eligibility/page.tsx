import EligibilityControlRoom from '@/components/flashcards-os/solutions/EligibilityControlRoom'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadSolutionsOverview } from '@/lib/flashcards-os/solutions/server/repository'
export default async function EligibilityPage(){await requireFlashcardsPageAccess('flashcards_os.view_solutions');const data=await loadSolutionsOverview();const request=data.requests[0]||null;const results=request?data.eligibility.filter((item)=>item.requestId===request.id):[];return <EligibilityControlRoom request={request} releases={data.releases} results={results}/>}
