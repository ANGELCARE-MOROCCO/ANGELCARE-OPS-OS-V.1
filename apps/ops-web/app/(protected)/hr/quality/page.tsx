import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRPhase5 } from '@/lib/hr-unified/max-phase5-data'
import { createQualityReviewPhase5 } from '@/lib/hr-unified/max-phase5-actions'
import { HRHero, HRPanel, HRRow, HRGrid, HRMetric, HRButton, HRInput, HRSelect, HRTextarea, HRSubmit } from '../_components/HRMaxUI'

export default async function Page() {
  const data = await getHRPhase5()
  const rows = data.quality
  return <AppShell title="HR Quality Reviews" subtitle="Quality assurance and data-control reviews for HR records." breadcrumbs={[{label:'HR',href:'/hr'},{label:'HR Quality Reviews'}]} actions={<><PageAction href="/hr">HR Dashboard</PageAction><PageAction href="/hr/control-room" variant="light">Control Room</PageAction></>}>
    <HRHero title="HR Quality Reviews" subtitle="Quality assurance and data-control reviews for HR records." actions={<><HRButton href="/hr/control-room" variant="blue">Control Room</HRButton><HRButton href="/hr/search" variant="light">Search</HRButton></>} />
    <HRGrid min={210}>{data.metrics.slice(0,4).map((m:any)=><HRMetric key={m.label} {...m} />)}</HRGrid>
    <div style={{height:22}} />
    <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) 420px',gap:20}}>
      <HRPanel title="Operational records" subtitle="Phase 5 command expansion records.">
        {rows.slice(0,70).map((x:any,i:number)=><HRRow key={x.id || i} title={x.title} meta={`${x.review_type || 'quality'} • score ${x.score || 0}`} status={x.status || x.stage || 'active'} />)}
      </HRPanel>
      <HRPanel title="Create / configure" subtitle="Actionable Phase 5 form.">
        <form action={createQualityReviewPhase5} style={{display:'grid',gap:12}}>
          <HRInput name="title" label="Review title" required />
          <HRSelect name="review_type" label="Review type" options={['profile_quality','document_quality','recruitment_quality','attendance_quality','roster_quality','onboarding_quality']} />
          <HRInput name="entity_type" label="Entity type" defaultValue="hr" />
          <HRInput name="entity_id" label="Entity ID optional" />
          <HRInput name="score" label="Score" type="number" />
          <HRTextarea name="findings" label="Findings" />
          <HRTextarea name="action_plan" label="Action plan" />
          <HRSubmit>Create review</HRSubmit>
        </form>
      </HRPanel>
    </div>
  </AppShell>
}
