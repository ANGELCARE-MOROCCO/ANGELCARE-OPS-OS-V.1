import { MasteryRecordWorkspace } from '@/components/carelink/service-design/mastery/MasteryRecordWorkspace'

export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ incidentId: string }> }) {
  const { incidentId } = await params
  return <MasteryRecordWorkspace domain="incident" id={incidentId} />
}
