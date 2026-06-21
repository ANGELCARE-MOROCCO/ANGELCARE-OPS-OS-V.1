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
    status: "Open",
    note: "Open command",
    active: true,
  },
  {
    label: "Budget cockpit",
    href: "/market-os/campaign-lifecycle",
    icon: "MAD",
    status: "Open",
    note: "Open command",
    active: true,
  },
  {
    label: "Risk center",
    href: "/market-os/campaign-lifecycle",
    icon: "!",
    status: "Open",
    note: "Open command",
    active: true,
  },
  {
    label: "Execution tasks",
    href: "/market-os/campaign-lifecycle",
    icon: "✓",
    status: "Open",
    note: "Open command",
    active: true,
  },
  {
    label: "Performance pulse",
    href: "/market-os/campaign-lifecycle",
    icon: "↗",
    status: "Open",
    note: "Open command",
    active: true,
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
                className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.10em] text-emerald-700"
              >
                {item.status}
              </span>
            </>
          )

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
    <>

      <style
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: `
            [data-campaign-lifecycle-fluid] {
              width: 100%;
            }

            [data-campaign-lifecycle-fluid] * {
              box-sizing: border-box;
            }

            [data-campaign-lifecycle-workspace] {
              width: 100%;
              min-width: 0;
            }

            [data-campaign-lifecycle-workspace] main {
              width: 100% !important;
              min-width: 0 !important;
            }

            [data-campaign-lifecycle-workspace] main > div,
            [data-campaign-lifecycle-workspace] main > section,
            [data-campaign-lifecycle-workspace] .mx-auto {
              max-width: none !important;
              width: 100% !important;
              margin-left: 0 !important;
              margin-right: 0 !important;
            }

            [data-campaign-lifecycle-workspace] [class*="max-w-"] {
              max-width: none !important;
            }

            [data-campaign-lifecycle-workspace] [class*="grid-cols"] {
              min-width: 0;
            }

            @media (max-width: 1279px) {
              [data-campaign-lifecycle-fluid] > div {
                grid-template-columns: 1fr !important;
              }

              [data-campaign-lifecycle-fluid] aside {
                position: relative !important;
                top: auto !important;
                width: 100% !important;
              }
            }

            @media (min-width: 1600px) {
              [data-campaign-lifecycle-fluid] {
                padding-left: 32px;
                padding-right: 32px;
              }
            }
          `,
        }}
      />

    <section data-campaign-lifecycle-fluid className="min-h-screen w-full overflow-x-hidden bg-white px-3 py-4 text-slate-950 sm:px-4 lg:px-5 xl:px-6">
      <div className="grid w-full max-w-none gap-5 xl:grid-cols-[300px_minmax(0,1fr)] 2xl:grid-cols-[320px_minmax(0,1fr)]">
        <CampaignLifecycleSidebar />

        <div data-campaign-lifecycle-workspace className="min-w-0 w-full">
          <CampaignExecutionV2 />
        </div>
      </div>
    </section>
    </>
  )
}
