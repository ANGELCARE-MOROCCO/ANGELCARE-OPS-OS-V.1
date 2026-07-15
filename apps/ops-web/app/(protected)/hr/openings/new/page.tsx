import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createOpeningRestore } from '@/lib/hr-unified/route-restore-actions'
import { HRHero, HRPanel, HRInput, HRSelect, HRTextarea, HRSubmit, formGrid } from '../../_components/HRMaxUI'

export default function NewOpeningPage() {
  return <AppShell title="New Opening" subtitle="Create job opening." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Openings',href:'/hr/openings'},{label:'New'}]} actions={<PageAction href="/hr/openings" variant="light">Back</PageAction>}>
    <HRHero title="Create Opening Job" subtitle="Define hiring demand, role, headcount, salary band, priority and requirements." />
    <HRPanel title="Opening configuration" subtitle="Synced to hr_job_openings.">
      <form action={createOpeningRestore} style={{display:'grid',gap:14}}>
        <div style={formGrid}>
          <HRInput name="title" label="Opening title" required />
          <HRInput name="department" label="Department" />
          <HRInput name="position" label="Position" />
          <HRInput name="location" label="Location" defaultValue="Morocco" />
          <HRSelect name="contract_type" label="Contract type" options={['full_time','part_time','mission_based','internship','contractor']} />
          <HRSelect name="priority" label="Priority" options={['low','medium','high','urgent','critical']} />
          <HRSelect name="status" label="Status" options={['open','paused','filled','cancelled']} />
          <HRInput name="headcount" label="Headcount" type="number" defaultValue="1" />
        </div>
        <HRTextarea name="description" label="Description" />
        <HRTextarea name="requirements" label="Requirements" />
        <HRTextarea name="notes" label="Notes" />
        <HRSubmit>Create opening</HRSubmit>
      </form>
    </HRPanel>
  </AppShell>
}
