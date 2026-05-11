import AppShell from '@/app/components/erp/AppShell'
import { getHRDashboardData } from '@/lib/hr-production/repository'
import { getHRSyncReadiness } from '@/lib/hr-production/sync'
import { HRCard, HRSection, HRStatusPill, HRTable } from '../_components/HRProductionUI'

export default async function Page() {
  const data = await getHRDashboardData()
  const readiness = await getHRSyncReadiness()
  return <AppShell title="HR Sync Center" subtitle="Cross-module synchronization readiness for users, missions, payroll, documents and recruitment." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Sync center'}]}>
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3"><HRCard title="Sync events" value={data.syncEvents.length} /><HRCard title="Connected domains" value={readiness.filter((x)=>['connected','ready','active'].includes(x.status)).length} /><HRCard title="Needs mapping" value={readiness.filter((x)=>!['connected','ready','active'].includes(x.status)).length} /></div>
      <HRSection title="Synchronization readiness"><HRTable headers={['Module','Status','Required action']} rows={readiness.map((x)=>[x.module, <HRStatusPill value={x.status} />, x.detail])} /></HRSection>
      <HRSection title="Recent sync events"><HRTable headers={['Type','Source','Target','Status']} rows={data.syncEvents.map((x:any)=>[x.sync_type, x.source_module || '-', x.target_module || '-', <HRStatusPill value={x.status || 'pending'} />])} /></HRSection>
    </div>
  </AppShell>
}
