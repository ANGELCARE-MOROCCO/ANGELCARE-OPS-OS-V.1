import { getHrFinalCoreSnapshot } from '../lib/final-core-data'
import { HrFinalCoreHero, HrMetricGrid, HrSourceMatrix, HrUnifiedFeed } from '../components/HrFinalCoreUI'

export default async function Page() {
  const data = await getHrFinalCoreSnapshot()
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <HrFinalCoreHero title="HR Compliance Center" subtitle="Control staff documents, certifications, audits, disciplinary status and HR risk." />
        <HrMetricGrid cards={data.commandCards} />
        
        <HrUnifiedFeed items={data.unifiedFeed} />
        
      </div>
    </main>
  )
}
