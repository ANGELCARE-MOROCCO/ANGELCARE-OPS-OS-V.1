import { MissionWorkbench } from '@/components/carelink/service-design/product-experience/MissionWorkbench'

export default async function Page({ params }: { params: Promise<{ scenarioId: string }> }) {
  const { scenarioId } = await params
  return <MissionWorkbench scenarioId={scenarioId} />
}
