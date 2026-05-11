import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRDashboardData } from '@/lib/hr-production/repository'
import { getHRProductionMetrics, getHRProductionScore } from '@/lib/hr-production/metrics'
import { HR_PRODUCTION_NAV } from '@/lib/hr-production/navigation'
import { HRAction, HRCard, HRLightAction, HRSection, HRStatusPill, HRTable } from './_components/HRProductionUI'

export default async function Page() {
  const data = await getHRDashboardData()
  const metrics = getHRProductionMetrics(data)
  const score = getHRProductionScore(data)
  return <AppShell title="HR Production Command Center" subtitle="Unified HR management: staff, recruitment, attendance, roster, compliance, approvals and sync." breadcrumbs={[{label:'HR'}]} actions={<><PageAction href="/hr/staff" variant="light">Staff</PageAction><PageAction href="/hr/reports" variant="light">Reports</PageAction></>}>
    <div className="space-y-6">
      <div className="rounded-[36px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-8 text-white shadow-sm">
        <div className="text-xs font-black uppercase tracking-[0.28em] text-slate-300">AngelCare HR OS</div>
        <h1 className="mt-3 text-3xl font-black">Production readiness score: {score}%</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-300">This dashboard is now based on the unified HR production repository, not fragmented static data.</p>
        <div className="mt-5 flex flex-wrap gap-2"><HRAction href="/hr/data-quality">Run quality control</HRAction><HRLightAction href="/hr/sync-center">Sync center</HRLightAction><HRLightAction href="/hr/reports">Export reports</HRLightAction></div>
      </div>
      <div className="grid gap-4 md:grid-cols-4"><HRCard title="Active staff" value={metrics.activeStaff} /><HRCard title="Open roles" value={metrics.openRoles} /><HRCard title="Pending approvals" value={metrics.pendingApprovals} /><HRCard title="Open quality issues" value={metrics.openQuality} /></div>
      <div className="grid gap-4 md:grid-cols-4"><HRCard title="Attendance not validated" value={metrics.unvalidatedAttendance} /><HRCard title="Roster conflicts" value={metrics.rosterConflicts} /><HRCard title="Missing documents" value={metrics.missingDocs} /><HRCard title="Open tasks" value={metrics.openTasks} /></div>
      <HRSection title="HR module map" subtitle="Core routes that should now be valid and synchronized.">
        <div className="grid gap-3 md:grid-cols-4">{HR_PRODUCTION_NAV.map((x)=><a key={x.href} href={x.href} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-800 hover:bg-white">{x.label}</a>)}</div>
      </HRSection>
      <HRSection title="Recent execution tasks" subtitle="Use this as the daily HR execution queue.">
        <HRTable headers={['Task','Owner','Priority','Status']} rows={data.tasks.slice(0,8).map((x:any)=>[x.title, x.owner || 'Unassigned', x.priority || 'medium', <HRStatusPill value={x.status || 'open'} />])} />
      </HRSection>
    </div>
  </AppShell>
}
