import { MasteryRecordWorkspace } from '@/components/carelink/service-design/mastery/MasteryRecordWorkspace'

export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ amendmentId: string }> }) {
  const { amendmentId } = await params
  return <MasteryRecordWorkspace domain="handoff_amendment" id={amendmentId} />
}
