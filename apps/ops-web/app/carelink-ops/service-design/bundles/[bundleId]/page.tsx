import { MasteryRecordWorkspace } from '@/components/carelink/service-design/mastery/MasteryRecordWorkspace'

export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ bundleId: string }> }) {
  const { bundleId } = await params
  return <MasteryRecordWorkspace domain="bundle" id={bundleId} />
}
