import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRPhase11Data } from '@/lib/hr-unified/max-phase11-data'
import { createHRActivityTimelinePhase11 } from '@/lib/hr-unified/max-phase11-actions'
import { HRHero, HRPanel, HRRow, HRInput, HRSelect, HRTextarea, HRSubmit } from '../_components/HRMaxUI'

export default async function HRActivityTimelinePage() {
  const data = await getHRPhase11Data()

  return (
    <AppShell title="HR Activity Timeline" subtitle="Operating timeline and executive trace." breadcrumbs={[{ label: 'HR', href: '/hr' }, { label: 'Activity Timeline' }]} actions={<PageAction href="/hr/enterprise-dashboard" variant="light">Enterprise</PageAction>}>
      <HRHero title="HR Activity Timeline" subtitle="A chronological operating timeline for HR decisions, events, risks, milestones and manual executive notes." />
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 420px', gap: 20 }}>
        <HRPanel title="Timeline" subtitle="Latest HR timeline events.">
          {data.timeline.map((item: any) => (
            <HRRow key={item.id} title={item.title} meta={`${item.event_type || 'event'} • ${item.entity_type || 'hr'} • ${item.event_at || item.created_at || ''}`} status={item.severity || item.status || 'normal'} />
          ))}
        </HRPanel>
        <HRPanel title="Add timeline event" subtitle="Create an executive timeline note.">
          <form action={createHRActivityTimelinePhase11} style={{ display: 'grid', gap: 12 }}>
            <HRInput name="title" label="Title" required />
            <HRSelect name="event_type" label="Event type" options={['manual_note', 'decision', 'risk', 'milestone', 'approval', 'incident', 'achievement']} />
            <HRSelect name="entity_type" label="Entity type" options={['hr', 'staff', 'candidate', 'opening', 'task', 'approval', 'document']} />
            <HRSelect name="severity" label="Severity" options={['normal', 'positive', 'warning', 'risk', 'critical']} />
            <HRInput name="event_at" label="Event time" type="datetime-local" />
            <HRTextarea name="summary" label="Summary" />
            <HRTextarea name="notes" label="Notes" />
            <HRSubmit>Add event</HRSubmit>
          </form>
        </HRPanel>
      </div>
    </AppShell>
  )
}
