import { RevenueEventTimelinePanel } from "@/components/revenue-command-center/RevenueEventTimelinePanel"

export const dynamic = "force-dynamic"

export default function Page() {
  return (
    <main className="min-h-screen w-full min-w-0 bg-[#050b16] p-4 text-white">
      <div className="w-full min-w-0 ">
        <header className="mb-4 rounded-[32px] border border-[#244365] bg-[#07111f]/90 p-6">
          <div className="text-xs font-black uppercase tracking-[.18em] text-emerald-300">AngelCare Revenue Command Center</div>
          <h1 className="mt-1 text-3xl font-black">Activity Timeline & Escalations</h1>
          <p className="mt-1 text-sm font-semibold text-[#cbd5e1]">Permanent audit trail and real escalation center.</p>
        </header>
        <RevenueEventTimelinePanel />
      </div>
    </main>
  )
}
