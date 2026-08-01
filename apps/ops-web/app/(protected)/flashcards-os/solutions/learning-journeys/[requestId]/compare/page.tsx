import { notFound } from 'next/navigation'
import JourneyScenarioTheatre from '@/components/flashcards-os/solutions/JourneyScenarioTheatre'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadJourneyRequest } from '@/lib/flashcards-os/solutions/server/repository'
export default async function JourneyComparePage({params}:{params:Promise<{requestId:string}>}){await requireFlashcardsPageAccess('flashcards_os.view_solutions');const {requestId}=await params;const data=await loadJourneyRequest(decodeURIComponent(requestId));if(!data.request)notFound();return <JourneyScenarioTheatre request={data.request} scenarios={data.scenarios}/>}
