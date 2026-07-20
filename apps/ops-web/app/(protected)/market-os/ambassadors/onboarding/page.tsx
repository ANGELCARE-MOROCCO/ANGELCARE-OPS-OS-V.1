import AmbassadorMarketSidebar from "@/components/market-os/ambassadors/ambassador-market-sidebar"
import AmbassadorOnboardingRoute from "@/components/market-os/ambassadors/routes/AmbassadorOnboardingRoute"

export default function AmbassadorOnboardingPage() {
  return (
    <div
      data-ambassador-onboarding-shell="shared-sidebar"
      className="flex min-h-screen min-w-0 bg-[#f5f7fb] text-slate-950"
    >
      <AmbassadorMarketSidebar />

      <AmbassadorOnboardingRoute />
    </div>
  )
}
