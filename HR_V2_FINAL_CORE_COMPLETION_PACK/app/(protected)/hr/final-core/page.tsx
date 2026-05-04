import Link from 'next/link'
import { getHrFinalCoreSnapshot } from '../lib/final-core-data'
import { HrFinalCoreHero, HrMetricGrid, HrSourceMatrix, HrUnifiedFeed } from '../components/HrFinalCoreUI'

export default async function HrFinalCorePage() {
  const data = await getHrFinalCoreSnapshot()

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <HrFinalCoreHero
          title="HR Final Core Completion Center"
          subtitle="The final HR backbone layer: real sync visibility, workforce intelligence, payroll preparation, compliance control and unified HR activity."
        />

        <HrMetricGrid cards={data.commandCards} />

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <HrUnifiedFeed items={data.unifiedFeed} />
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">Final Core Gateways</h2>
            <p className="mt-1 text-sm text-slate-500">Direct routes to the new production control areas.</p>
            <div className="mt-5 grid gap-3">
              {[
                ['/hr/sync-center','System Sync Center','Verify module connectivity and fallback status.'],
                ['/hr/intelligence','HR Intelligence','Risk alerts, recommendations and workforce warnings.'],
                ['/hr/payroll-prep','Payroll Preparation','Prepare attendance/salary checks before payroll execution.'],
                ['/hr/compliance-center','Compliance Center','Document, certification and operational compliance.'],
                ['/hr/staff','Staff Directory','Open staff operations and staff 360 profiles.'],
                ['/hr/roster/monthly','Monthly Roster','Manage monthly duties and workforce coverage.'],
              ].map(([href,title,desc]) => (
                <Link href={href} key={href} className="rounded-2xl border bg-slate-50 p-4 transition hover:bg-slate-950 hover:text-white">
                  <div className="font-black">{title}</div>
                  <div className="mt-1 text-sm opacity-80">{desc}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <HrSourceMatrix sources={data.sources} />
      </div>
    </main>
  )
}
