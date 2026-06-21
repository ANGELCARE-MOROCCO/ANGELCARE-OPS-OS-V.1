import CampaignExecutionV2 from "@/components/market-os/campaign-lifecycle/campaign-execution-v2"

export const dynamic = "force-dynamic"

export default function Page() {
  return (
    <section className="min-h-screen bg-white text-slate-950">
      <CampaignExecutionV2 />
    </section>
  )
}
