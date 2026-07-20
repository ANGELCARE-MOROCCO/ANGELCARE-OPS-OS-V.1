import AmbassadorMarketSidebar from "@/components/market-os/ambassadors/ambassador-market-sidebar"
import AmbassadorTerritoriesRoute from "@/components/market-os/ambassadors/routes/AmbassadorTerritoriesRoute"

export const dynamic = "force-dynamic"

export default function Page() {
  return (
    <div data-ambassador-territories-shell="shared-sidebar" className="flex min-h-screen min-w-0 bg-[#f5f7fb] text-slate-950">
      <AmbassadorMarketSidebar />
      <AmbassadorTerritoriesRoute />
    </div>
  )
}
