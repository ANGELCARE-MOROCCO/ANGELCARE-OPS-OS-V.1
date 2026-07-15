import Link from "next/link"
import { ArrowRight, BadgeCheck, DatabaseZap, ShieldCheck, Sparkles } from "lucide-react"

const gateCards = [
  {
    title: "Old Ambassador submodule retired",
    text: "All legacy Ambassador pages, APIs, components and runtime libraries are removed from the active route tree by the replacement script.",
    icon: ShieldCheck,
  },
  {
    title: "RefferQ becomes the new growth layer",
    text: "The route now opens a referral, affiliate, partner, payout and tracking control plane instead of the previous ambassador cockpit.",
    icon: Sparkles,
  },
  {
    title: "Safe cutover pattern",
    text: "The old active source is moved to an excluded backup folder before replacement, so it cannot keep compiling or drifting in the app.",
    icon: DatabaseZap,
  },
]

export default function RefferQGateway() {
  return (
    <main className="min-h-screen bg-white px-6 py-8 text-slate-950 md:px-10">
      <section className="mx-auto flex max-w-7xl flex-col gap-8">
        <div className="rounded-[36px] border border-sky-100 bg-gradient-to-br from-white via-sky-50 to-indigo-50 p-8 shadow-[0_28px_90px_rgba(15,23,42,0.10)]">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black uppercase tracking-[0.22em] text-emerald-700">
                <BadgeCheck size={16} /> New Market OS route gate
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
                  Ambassador is now the RefferQ Referral Growth Engine.
                </h1>
                <p className="max-w-2xl text-lg font-semibold leading-8 text-slate-600">
                  Final cutover: the old Ambassador submodule is no longer the operating system. This route now acts as a clean gate into a dedicated RefferQ mega module for partners, referrals, commissions, payouts, resources, tracking and program governance.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/market-os/ambassadors/refferq"
                  className="inline-flex items-center gap-3 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-white shadow-xl shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-sky-700"
                >
                  Open RefferQ mega module <ArrowRight size={18} />
                </Link>
                <Link
                  href="/market-os"
                  className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:text-sky-700"
                >
                  Back to Market OS
                </Link>
              </div>
            </div>

            <div className="grid min-w-0 gap-4 rounded-[28px] border border-white bg-white/70 p-5 shadow-2xl shadow-sky-100 lg:w-[360px]">
              {[
                ["Active replacement", "RefferQ"],
                ["Main route", "/market-os/ambassadors"],
                ["Module entry", "/market-os/ambassadors/refferq"],
                ["Legacy fallback", "Redirected"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-3xl border border-slate-100 bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
                  <p className="mt-1 text-lg font-black text-slate-950">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {gateCards.map((card) => {
            const Icon = card.icon
            return (
              <article key={card.title} className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                  <Icon size={22} />
                </div>
                <h2 className="text-xl font-black text-slate-950">{card.title}</h2>
                <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">{card.text}</p>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}
