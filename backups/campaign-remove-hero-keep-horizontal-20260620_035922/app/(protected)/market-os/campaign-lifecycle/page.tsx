import Link from "next/link"
import CampaignExecutionV2 from "@/components/market-os/campaign-lifecycle/campaign-execution-v2"

export const dynamic = "force-dynamic"

const menuItems = [
  {
    label: "Command board",
    href: "/market-os/campaign-lifecycle",
    icon: "◎",
    active: true,
    note: "Main cockpit",
  },
  {
    label: "Create campaign",
    href: "/market-os/campaign-lifecycle/create",
    icon: "+",
    active: true,
    note: "New campaign",
  },
  {
    label: "Launch control",
    href: "/market-os/campaign-lifecycle",
    icon: "↗",
    active: false,
    note: "Select campaign",
  },
  {
    label: "Budget cockpit",
    href: "/market-os/campaign-lifecycle",
    icon: "MAD",
    active: false,
    note: "Select campaign",
  },
  {
    label: "Risk center",
    href: "/market-os/campaign-lifecycle",
    icon: "!",
    active: false,
    note: "Select campaign",
  },
  {
    label: "Execution tasks",
    href: "/market-os/campaign-lifecycle",
    icon: "✓",
    active: false,
    note: "Select campaign",
  },
  {
    label: "Performance",
    href: "/market-os/campaign-lifecycle",
    icon: "↗",
    active: false,
    note: "Select campaign",
  },
]

function CampaignLifecycleRouteSidebar() {
  return (
    <aside className="sticky top-32 h-fit overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
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
          Classic lifecycle sidebar for campaign operations, creation, launch, budget, risk, execution and performance.
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

              {!item.active ? (
                <span className="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.10em] text-amber-700">
                  Locked
                </span>
              ) : (
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              )}
            </>
          )

          if (!item.active) {
            return (
              <div
                key={item.label}
                className="flex cursor-not-allowed items-center gap-3 rounded-2xl px-3 py-2.5 text-slate-400 opacity-75"
                title="Select a campaign inside the cockpit first."
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
            Board mode active
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
    <section className="min-h-screen bg-white text-slate-950">
      <div className="grid gap-6 p-4 lg:p-8 xl:grid-cols-[300px_minmax(0,1fr)]">
        <CampaignLifecycleRouteSidebar />

        <div className="min-w-0">
          <CampaignExecutionV2 />
        </div>
      </div>
    </section>
  )
}
