import { MultiDayJourneyWorkspace } from '@/components/carelink/service-design/planning/workspaces/MultiDayJourneyWorkspace'

export default async function Page({ params }: { params: Promise<{ scenarioId: string }> }) {
  const { scenarioId } = await params
  return <MultiDayJourneyWorkspace scenarioId={scenarioId} />
}
