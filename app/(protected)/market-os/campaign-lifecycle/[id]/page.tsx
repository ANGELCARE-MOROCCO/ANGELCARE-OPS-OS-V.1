import { notFound } from 'next/navigation'
import { CampaignV2WarRoom } from '@/components/market-os/campaign-v2-war-room'
import { getCampaignV2, listCampaignTasksV2 } from '@/lib/market-os/campaign-v2-db'

type PageProps = { params: Promise<{ id: string }> }
export default async function Page({ params }: PageProps) {
  const { id } = await params
  const campaign = await getCampaignV2(id)
  if (!campaign) return notFound()
  const tasks = await listCampaignTasksV2(id)
  return <CampaignV2WarRoom campaign={campaign} tasks={tasks} />
}
