import { MasteryRecordWorkspace } from '@/components/carelink/service-design/mastery/MasteryRecordWorkspace'

export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params
  return <MasteryRecordWorkspace domain="customer_case" id={caseId} />
}
