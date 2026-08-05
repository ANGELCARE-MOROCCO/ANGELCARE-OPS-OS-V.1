import { MasteryRecordWorkspace } from '@/components/carelink/service-design/mastery/MasteryRecordWorkspace'

export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ sellableId: string }> }) {
  const { sellableId } = await params
  return <MasteryRecordWorkspace domain="sellable" id={sellableId} />
}
