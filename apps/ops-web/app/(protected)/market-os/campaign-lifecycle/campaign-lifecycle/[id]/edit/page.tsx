import { EditCampaignPage } from "@/components/market-os/campaign-lifecycle/campaign-execution-v2"
export const dynamic = "force-dynamic"
export default function Page({ params }: { params: { id: string } }){ return <EditCampaignPage id={params.id} /> }
