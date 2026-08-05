import { MasteryRecordWorkspace } from '@/components/carelink/service-design/mastery/MasteryRecordWorkspace'

export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ signalId: string }> }) {
  const { signalId } = await params
  return <MasteryRecordWorkspace domain="quality_signal" id={signalId} />
}
