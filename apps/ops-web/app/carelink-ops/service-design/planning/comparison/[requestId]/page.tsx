import { ScenarioComparisonWorkspace } from '@/components/carelink/service-design/planning/workspaces/ScenarioComparisonWorkspace'
export default async function Page({ params }: { params: Promise<{ requestId: string }> }) { const { requestId } = await params; return <ScenarioComparisonWorkspace requestId={requestId} /> }
