import { TimelineCanvas } from '@/components/carelink/service-design/planning/workspaces/TimelineCanvas'
export default async function Page({ params }: { params: Promise<{ scenarioId: string }> }) { const { scenarioId } = await params; return <TimelineCanvas scenarioId={scenarioId} /> }
