import Link from "next/link"
import AmbassadorBackoffice from "@/components/market-os/ambassador-backoffice"


export const dynamic = "force-dynamic"

export default function Page() {
  return (
    <div className="space-y-6">
      <AmbassadorBackoffice />

      <section className="mx-auto w-full max-w-[1400px] px-4 pb-10">
        <Link
          href="/market-os/ambassadors/training-academy"
          className="group block rounded-[32px] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-2xl"
        >
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
            Training Academy
          </p>

          <h3 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950">
            Ambassador OS Enterprise Academy
          </h3>

          <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-700">
            Learn missions, proofs, payouts, compliance, AI workflows, territories,
            governance, SOPs, scenarios, KPI interpretation, and production execution.
          </p>

          <div className="mt-5 inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white group-hover:bg-emerald-700">
            Open Training Academy →
          </div>
        </Link>
      </section>
    </div>
  )
}