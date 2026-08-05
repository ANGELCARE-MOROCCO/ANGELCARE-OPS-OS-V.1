import { MasteryRecordWorkspace } from '@/components/carelink/service-design/mastery/MasteryRecordWorkspace'

export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params
  return <MasteryRecordWorkspace domain="planning_request" id={requestId} />
}
