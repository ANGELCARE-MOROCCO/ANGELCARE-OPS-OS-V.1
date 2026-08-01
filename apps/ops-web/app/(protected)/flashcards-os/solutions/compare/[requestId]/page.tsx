import { notFound } from 'next/navigation'
import ScenarioComparisonTheatre from '@/components/flashcards-os/solutions/ScenarioComparisonTheatre'
import ScenarioAssemblyDock from '@/components/flashcards-os/solutions/ScenarioAssemblyDock'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadSolutionRequest } from '@/lib/flashcards-os/solutions/server/repository'
export default async function CompareSolutionsPage({params}:{params:Promise<{requestId:string}>}){await requireFlashcardsPageAccess('flashcards_os.view_solutions');const {requestId}=await params;const data=await loadSolutionRequest(decodeURIComponent(requestId));if(!data.request)notFound();return <><ScenarioComparisonTheatre request={data.request} scenarios={data.scenarios}/><ScenarioAssemblyDock request={data.request} scenarios={data.scenarios}/></>}
