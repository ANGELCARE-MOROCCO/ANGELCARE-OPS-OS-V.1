import Link from "next/link"
import CampaignExecutionV2 from "@/components/market-os/campaign-lifecycle/campaign-execution-v2"

export const dynamic = "force-dynamic"

const menuItems = [
  {
    label: "Command board",
    href: "/market-os/campaign-lifecycle",
    icon: "◎",
    status: "Open",
    note: "Main workspace",
    active: true,
  },
  {
    label: "Create campaign",
    href: "/market-os/campaign-lifecycle/create",
    icon: "+",
    status: "Open",
    note: "New record",
    active: true,
  },
  {
    label: "Launch control",
    href: "/market-os/campaign-lifecycle",
    icon: "↗",
    status: "Select",
    note: "Use selected campaign",
    active: false,
  },
  {
    label: "Budget cockpit",
    href: "/market-os/campaign-lifecycle",
    icon: "MAD",
    status: "Select",
    note: "Use selected campaign",
    active: false,
  },
  {
    label: "Risk center",
    href: "/market-os/campaign-lifecycle",
    icon: "!",
    status: "Select",
    note: "Use selected campaign",
    active: false,
  },
  {
    label: "Execution tasks",
    href: "/market-os/campaign-lifecycle",
    icon: "✓",
    status: "Select",
    note: "Use selected campaign",
    active: false,
  },
  {
    label: "Performance pulse",
    href: "/market-os/campaign-lifecycle",
    icon: "↗",
    status: "Select",
    note: "Use selected campaign",
    active: false,
  },
]

function CampaignLifecycleSidebar() {
  return (
    <aside className="sticky top-28 h-fit overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
      <div className="border-b border-slate-100 bg-gradient-to-br from-white via-slate-50 to-blue-50 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 to-violet-600 text-sm font-black text-white shadow-[0_14px_30px_rgba(59,130,246,0.20)]">
            AC
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-700">
              ANGELCARE
            </p>
            <h2 className="text-lg font-black tracking-[-0.04em] text-slate-950">
              Campaign OS
            </h2>
          </div>
        </div>

        <p className="mt-4 text-xs font-bold leading-5 text-slate-500">
          Lifecycle navigation for command, creation, launch, budget, risk, tasks and performance.
        </p>
      </div>

      <nav className="grid gap-1 p-3">
        {menuItems.map((item) => {
          const content = (
            <>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-[11px] font-black text-slate-700">
                {item.icon}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-black">
                  {item.label}
                </span>
                <span className="block truncate text-[11px] font-bold text-slate-400">
                  {item.note}
                </span>
              </span>

              <span
                className={
                  item.active
                    ? "rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.10em] text-emerald-700"
                    : "rounded-full bg-amber-50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.10em] text-amber-700"
                }
              >
                {item.status}
              </span>
            </>
          )

          if (!item.active) {
            return (
              <div
                key={item.label}
                className="flex cursor-not-allowed items-center gap-3 rounded-2xl px-3 py-2.5 text-slate-400 opacity-75"
                title="Select a campaign in the workspace first."
              >
                {content}
              </div>
            )
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
            >
              {content}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
              Production
            </span>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <p className="mt-1 text-xs font-bold text-emerald-800">
            Sidebar menu active
          </p>
        </div>

        <Link
          href="/market-os"
          className="mt-3 flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
        >
          ← Back to Market OS
        </Link>
      </div>
    </aside>
  )
}

export default function Page() {
  return (
    <section className="min-h-screen bg-white p-4 text-slate-950 lg:p-8">
      <div className="mx-auto grid max-w-[1900px] gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <CampaignLifecycleSidebar />

        <div className="min-w-0">
          <CampaignExecutionV2 />
        </div>
      </div>
    </section>
  )
}
