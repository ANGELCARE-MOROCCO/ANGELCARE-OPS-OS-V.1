import ExecutiveAnalyticsBoard from "@/components/email-os-core/ExecutiveAnalyticsBoard"

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <ExecutiveAnalyticsBoard />

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">
            Executive Operations Overview
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              "Mailbox performance",
              "Queue execution health",
              "Approval velocity",
              "SLA breach pressure"
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="text-sm font-black text-slate-950">
                  {item}
                </div>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Operational visibility panel prepared for enterprise monitoring.
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
