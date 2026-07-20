import AmbassadorMarketSidebar from "@/components/market-os/ambassadors/ambassador-market-sidebar"
import AmbassadorDirectoryRoute from "@/components/market-os/ambassadors/routes/AmbassadorDirectoryRoute"

export default function AmbassadorDirectoryPage() {
  return (
    <div
      data-ambassador-directory-shell="shared-sidebar"
      className="flex min-h-screen min-w-0 bg-[#f5f7fb] text-slate-950"
    >
      <AmbassadorMarketSidebar />
      <AmbassadorDirectoryRoute />
    </div>
  )
}
