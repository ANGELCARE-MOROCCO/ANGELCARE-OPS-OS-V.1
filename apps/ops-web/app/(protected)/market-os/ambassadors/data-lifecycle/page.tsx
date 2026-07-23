import AmbassadorMarketSidebar from "@/components/market-os/ambassadors/ambassador-market-sidebar"

import AmbassadorDataLifecycleControlCenter from "@/components/market-os/ambassadors/data-lifecycle/AmbassadorDataLifecycleControlCenter"

export const dynamic =
  "force-dynamic"

export const revalidate = 0

export default function
AmbassadorDataLifecyclePage() {
  return (
    <div className="flex min-h-screen min-w-0 bg-[#f5f7fb] text-slate-950">
      <AmbassadorMarketSidebar />

      <AmbassadorDataLifecycleControlCenter />
    </div>
  )
}
