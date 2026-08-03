import { MissionWorkbench } from '@/components/carelink/service-design/product-experience/MissionWorkbench'

export default async function Page({ params }: { params: Promise<{ compositionId: string }> }) {
  const { compositionId } = await params
  return <MissionWorkbench workspaceKey={`composition:${compositionId}`} />
}
