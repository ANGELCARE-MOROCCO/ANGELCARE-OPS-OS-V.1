import RevenueProspectsLiveSyncCommandCenter from "@/components/revenue-command-center/RevenueProspectsLiveSyncCommandCenter"

export const dynamic = "force-dynamic"

export default function Page() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#050b16]">
      <RevenueProspectsLiveSyncCommandCenter />
    </div>
  )
}
