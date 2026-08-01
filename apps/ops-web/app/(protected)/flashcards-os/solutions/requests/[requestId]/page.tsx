import { notFound } from 'next/navigation'
import SolutionRequestControlRoom from '@/components/flashcards-os/solutions/SolutionRequestControlRoom'
import ScenarioComparisonTheatre from '@/components/flashcards-os/solutions/ScenarioComparisonTheatre'
import ScenarioAssemblyDock from '@/components/flashcards-os/solutions/ScenarioAssemblyDock'
import EligibilityControlRoom from '@/components/flashcards-os/solutions/EligibilityControlRoom'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadSolutionRequest } from '@/lib/flashcards-os/solutions/server/repository'
export default async function SolutionRequestPage({params}:{params:Promise<{requestId:string}>}){await requireFlashcardsPageAccess('flashcards_os.view_solutions');const {requestId}=await params;const data=await loadSolutionRequest(decodeURIComponent(requestId));if(!data.request)notFound();return <><SolutionRequestControlRoom request={data.request} eligibility={data.eligibility} scenarios={data.scenarios}/><EligibilityControlRoom request={data.request} releases={data.releases} results={data.eligibility}/><ScenarioComparisonTheatre request={data.request} scenarios={data.scenarios}/>{data.scenarios.length>1?<ScenarioAssemblyDock request={data.request} scenarios={data.scenarios}/>:null}</>}
