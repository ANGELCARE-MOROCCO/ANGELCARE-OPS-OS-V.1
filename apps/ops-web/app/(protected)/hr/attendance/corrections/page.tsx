import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRRestoreLists } from '@/lib/hr-unified/route-restore-data'
import { createCorrectionRestore, updateRestore } from '@/lib/hr-unified/route-restore-actions'
import { HRHero, HRPanel, HRRow, HRInput, HRSelect, HRTextarea, HRSubmit } from '../../_components/HRMaxUI'

export default async function CorrectionsPage() {
  const data = await getHRRestoreLists()
  return <AppShell title="Attendance Corrections" subtitle="Restored correction workflow." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Attendance',href:'/hr/attendance'},{label:'Corrections'}]} actions={<PageAction href="/hr/attendance" variant="light">Attendance</PageAction>}>
    <HRHero title="Attendance Correction Workflow" subtitle="Create and update attendance correction requests." />
    <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) 420px',gap:20}}>
      <HRPanel title="Correction queue" subtitle="Correction records.">
        {(data as any).corrections?.map((x:any)=><HRRow key={x.id} title={x.correction_type || 'Correction'} meta={x.reason || 'No reason'} status={x.status || x.stage}/>)}
      </HRPanel>
      <HRPanel title="Create correction" subtitle="Manual attendance correction.">
        <form action={createCorrectionRestore} style={{display:'grid',gap:12}}>
          <HRInput name="staff_id" label="Staff ID" />
          <HRSelect name="correction_type" label="Type" options={['manual_correction','missing_clock_in','missing_clock_out','wrong_time','absence_review','late_justification']} />
          <HRInput name="original_value" label="Original value" />
          <HRInput name="requested_value" label="Requested value" />
          <HRTextarea name="reason" label="Reason" />
          <HRTextarea name="notes" label="Notes" />
          <HRSubmit>Create correction</HRSubmit>
        </form>
      </HRPanel>
    </div>
  </AppShell>
}
