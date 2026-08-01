import { notFound } from 'next/navigation'
import DaySessionTimeline from '@/components/flashcards-os/solutions/DaySessionTimeline'
import CollectionCardMappingCanvas from '@/components/flashcards-os/solutions/CollectionCardMappingCanvas'
import PriceMarginWaterfall from '@/components/flashcards-os/solutions/PriceMarginWaterfall'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadReadyPlan } from '@/lib/flashcards-os/solutions/server/repository'
export default async function ReadyPlanPage({params}:{params:Promise<{planId:string}>}){await requireFlashcardsPageAccess('flashcards_os.view_solutions');const {planId}=await params;const data=await loadReadyPlan(decodeURIComponent(planId));if(!data.plan||!data.scenario)notFound();return <><DaySessionTimeline scenario={data.scenario}/><CollectionCardMappingCanvas scenario={data.scenario} releases={data.releases}/><PriceMarginWaterfall calculation={data.scenario.commercial} title={`${data.plan.name} · Commercial structure`}/></>}
