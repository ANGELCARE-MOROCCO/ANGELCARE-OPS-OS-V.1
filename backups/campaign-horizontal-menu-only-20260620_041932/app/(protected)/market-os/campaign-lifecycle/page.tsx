import Link from "next/link"

export const dynamic = "force-dynamic"

const actionCards = [
  {
    title: "Command board",
    description: "Open campaign lifecycle control.",
    href: "/market-os/campaign-lifecycle/board",
    icon: "◎",
    cta: "Open command",
    active: true,
  },
  {
    title: "Create campaign",
    description: "Create a new campaign record.",
    href: "/market-os/campaign-lifecycle/create",
    icon: "+",
    cta: "Create record",
    active: true,
  },
  {
    title: "Launch control",
    description: "Approval, readiness and launch gates.",
    href: "/market-os/campaign-lifecycle",
    icon: "↗",
    cta: "Select campaign",
    active: false,
  },
  {
    title: "Budget cockpit",
    description: "Budget, spend and ROI signals.",
    href: "/market-os/campaign-lifecycle",
    icon: "MAD",
    cta: "Select campaign",
    active: false,
  },
  {
    title: "Risk center",
    description: "Risks, blockers and escalations.",
    href: "/market-os/campaign-lifecycle",
    icon: "!",
    cta: "Select campaign",
    active: false,
  },
  {
    title: "Execution tasks",
    description: "Tasks, owners and completion.",
    href: "/market-os/campaign-lifecycle",
    icon: "✓",
    cta: "Select campaign",
    active: false,
  },
  {
    title: "Performance pulse",
    description: "Leads, conversion and revenue KPIs.",
    href: "/market-os/campaign-lifecycle",
    icon: "↗",
    cta: "Select campaign",
    active: false,
  },
]

export default function Page() {
  return (
    <section className="min-h-screen bg-white p-4 text-slate-950 lg:p-8">
      <div className="mx-auto max-w-[1900px]">
        <section className="rounded-[34px] border border-slate-200 bg-white p-5 shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 px-1">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-700">
                ANGELCARE Campaign Lifecycle
              </p>
              <h1 className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">
                Operational command menu
              </h1>
            </div>

            <Link
              href="/market-os"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
            >
              ← Market OS
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
            {actionCards.map((card) => {
              const body = (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-xs font-black text-slate-800">
                      {card.icon}
                    </span>

                    <span
                      className={
                        card.active
                          ? "rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700"
                          : "rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-amber-700"
                      }
                    >
                      {card.active ? "Open" : "Locked"}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-lg font-black tracking-[-0.03em] text-slate-950">
                      {card.title}
                    </h2>
                    <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
                      {card.description}
                    </p>
                  </div>

                  <span className="text-xs font-black text-slate-700">
                    {card.cta}
                  </span>
                </>
              )

              if (!card.active) {
                return (
                  <div
                    key={card.title}
                    className="grid min-h-[190px] content-between rounded-[26px] border border-slate-200 bg-slate-50/70 p-5 opacity-75"
                  >
                    {body}
                  </div>
                )
              }

              return (
                <Link
                  key={card.title}
                  href={card.href}
                  className="grid min-h-[190px] content-between rounded-[26px] border border-slate-200 bg-white p-5 text-slate-950 shadow-sm transition hover:-translate-y-1 hover:border-sky-200 hover:shadow-[0_20px_48px_rgba(15,23,42,0.09)]"
                >
                  {body}
                </Link>
              )
            })}
          </div>
        </section>
      </div>
    </section>
  )
}
