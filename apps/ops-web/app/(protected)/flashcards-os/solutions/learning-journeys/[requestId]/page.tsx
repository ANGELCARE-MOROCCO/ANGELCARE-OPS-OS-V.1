import { notFound } from 'next/navigation'
import JourneyRequestControlRoom from '@/components/flashcards-os/solutions/JourneyRequestControlRoom'
import JourneyScenarioTheatre from '@/components/flashcards-os/solutions/JourneyScenarioTheatre'
import DaySessionTimeline from '@/components/flashcards-os/solutions/DaySessionTimeline'
import CollectionCardMappingCanvas from '@/components/flashcards-os/solutions/CollectionCardMappingCanvas'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadJourneyRequest } from '@/lib/flashcards-os/solutions/server/repository'
export default async function JourneyRequestPage({params,searchParams}:{params:Promise<{requestId:string}>;searchParams:Promise<{scenario?:string}>}){await requireFlashcardsPageAccess('flashcards_os.view_solutions');const {requestId}=await params;const query=await searchParams;const data=await loadJourneyRequest(decodeURIComponent(requestId));if(!data.request)notFound();const selected=data.scenarios.find((item)=>item.id===query.scenario)||data.scenarios[0];return <><JourneyRequestControlRoom request={data.request} scenarios={data.scenarios} releases={data.releases} ontology={data.ontology}/><JourneyScenarioTheatre request={data.request} scenarios={data.scenarios}/>{selected?<><DaySessionTimeline scenario={selected}/><CollectionCardMappingCanvas scenario={selected} releases={data.releases}/></>:null}</>}
