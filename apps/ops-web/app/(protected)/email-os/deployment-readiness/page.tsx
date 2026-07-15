import OpsReportPanel from "@/components/email-os-core/OpsReportPanel"

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <OpsReportPanel />

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-black text-slate-950">Deployment Readiness</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Use this page before pushing Email-OS changes to production.
          </p>

          <div className="mt-6 grid gap-3">
            {[
              "npm run build passed",
              "Supabase SQL phases applied",
              "Provider readiness API reviewed",
              "CSV export works",
              "Backup manifest reviewed",
              "SMTP queue fallback tested",
              "IMAP sync tested",
              "Vercel env vars confirmed"
            ].map((item) => (
              <label key={item} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-4">
                <input type="checkbox" className="h-4 w-4 cursor-pointer" />
                <span className="text-sm font-bold text-slate-700">{item}</span>
              </label>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
