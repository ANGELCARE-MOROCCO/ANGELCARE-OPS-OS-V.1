import { notFound } from 'next/navigation'
import CoverageIntelligenceMap from '@/components/flashcards-os/solutions/CoverageIntelligenceMap'
import PriceMarginWaterfall from '@/components/flashcards-os/solutions/PriceMarginWaterfall'
import ScenarioDecisionDock from '@/components/flashcards-os/solutions/ScenarioDecisionDock'
import ScenarioComparisonTheatre from '@/components/flashcards-os/solutions/ScenarioComparisonTheatre'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadSolutionScenario } from '@/lib/flashcards-os/solutions/server/repository'
export default async function SolutionScenarioPage({params}:{params:Promise<{scenarioId:string}>}){await requireFlashcardsPageAccess('flashcards_os.view_solutions');const {scenarioId}=await params;const data=await loadSolutionScenario(decodeURIComponent(scenarioId));if(!data.scenario||!data.request)notFound();return <><ScenarioComparisonTheatre request={data.request} scenarios={[data.scenario]}/><CoverageIntelligenceMap request={data.request} scenario={data.scenario}/><PriceMarginWaterfall calculation={data.scenario.commercial}/><ScenarioDecisionDock scenario={data.scenario} request={data.request}/></>}
