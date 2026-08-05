import { MasteryRecordWorkspace } from '@/components/carelink/service-design/mastery/MasteryRecordWorkspace'

export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ improvementId: string }> }) {
  const { improvementId } = await params
  return <MasteryRecordWorkspace domain="improvement" id={improvementId} />
}
