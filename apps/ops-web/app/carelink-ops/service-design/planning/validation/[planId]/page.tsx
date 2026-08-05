import { MasteryRecordWorkspace } from '@/components/carelink/service-design/mastery/MasteryRecordWorkspace'

export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params
  return <MasteryRecordWorkspace domain="planning_plan" id={planId} />
}
