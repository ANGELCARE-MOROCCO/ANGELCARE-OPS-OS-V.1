import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRPhase11Data } from '@/lib/hr-unified/max-phase11-data'
import { createHRSavedViewPhase11 } from '@/lib/hr-unified/max-phase11-actions'
import { HRHero, HRPanel, HRRow, HRInput, HRSelect, HRTextarea, HRSubmit } from '../_components/HRMaxUI'

export default async function HRSavedViewsPage() {
  const data = await getHRPhase11Data()

  return (
    <AppShell title="HR Saved Views" subtitle="Reusable operating views and filters." breadcrumbs={[{ label: 'HR', href: '/hr' }, { label: 'Saved Views' }]} actions={<PageAction href="/hr/enterprise-dashboard" variant="light">Enterprise</PageAction>}>
      <HRHero title="Saved Operating Views" subtitle="Create reusable operating views for recruitment, staff, rosters, attendance, compliance and executive routines." />
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 420px', gap: 20 }}>
        <HRPanel title="Saved views" subtitle="Reusable navigation + filter presets.">
          {data.savedViews.map((view: any) => (
            <HRRow key={view.id} title={view.title} meta={`${view.view_type || 'dashboard'} • ${view.route || '/hr'} • ${view.priority || 'medium'}`} status={view.status || 'active'} href={view.route || '/hr'} />
          ))}
        </HRPanel>
        <HRPanel title="Create saved view" subtitle="Add an operating preset.">
          <form action={createHRSavedViewPhase11} style={{ display: 'grid', gap: 12 }}>
            <HRInput name="title" label="Title" required />
            <HRSelect name="view_type" label="View type" options={['dashboard', 'queue', 'board', 'report', 'risk_view', 'daily_view']} />
            <HRInput name="route" label="Route" defaultValue="/hr" />
            <HRSelect name="priority" label="Priority" options={['low', 'medium', 'high', 'critical']} />
            <HRInput name="area" label="Area filter" />
            <HRInput name="owner" label="Owner filter" />
            <HRInput name="filter_status" label="Status filter" />
            <HRTextarea name="notes" label="Notes" />
            <HRSubmit>Create view</HRSubmit>
          </form>
        </HRPanel>
      </div>
    </AppShell>
  )
}
