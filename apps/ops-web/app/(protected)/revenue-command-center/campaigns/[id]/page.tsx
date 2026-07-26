import RevenueCampaignWorkspace from "@/components/revenue-command-center/campaign-enterprise/RevenueCampaignWorkspace"

export const dynamic = "force-dynamic"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <RevenueCampaignWorkspace experience="campaign-dossier" contextId={id} />
}
