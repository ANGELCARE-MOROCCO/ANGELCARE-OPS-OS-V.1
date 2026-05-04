import { getHrFinalCoreSnapshot } from '../lib/final-core-data'
import { HrFinalCoreHero, HrMetricGrid, HrSourceMatrix, HrUnifiedFeed } from '../components/HrFinalCoreUI'

export default async function Page() {
  const data = await getHrFinalCoreSnapshot()
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <HrFinalCoreHero title="HR System Sync Center" subtitle="Live compatibility view across users, attendance, missions, tasks, caregivers, academy, contracts and incidents." />
        <HrMetricGrid cards={data.commandCards} />
        <HrSourceMatrix sources={data.sources} />
        
        
      </div>
    </main>
  )
}
