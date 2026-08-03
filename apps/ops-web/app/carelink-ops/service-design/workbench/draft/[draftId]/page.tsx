import { MissionWorkbench } from '@/components/carelink/service-design/product-experience/MissionWorkbench'

export default async function Page({ params }: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await params
  return <MissionWorkbench draftId={draftId} />
}
