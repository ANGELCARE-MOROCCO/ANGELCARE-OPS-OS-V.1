import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRRestoreLists } from '@/lib/hr-unified/route-restore-data'
import { createCandidateRestore } from '@/lib/hr-unified/route-restore-actions'
import { HRHero, HRPanel, HRRow, HRInput, HRSelect, HRTextarea, HRSubmit } from '../../_components/HRMaxUI'

export default async function CandidatesPage() {
  const data = await getHRRestoreLists()
  return <AppShell title="Candidate Database" subtitle="Create and control recruitment candidates." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Recruitment',href:'/hr/recruitment'},{label:'Candidates'}]} actions={<PageAction href="/hr/recruitment/kanban">Kanban</PageAction>}>
    <HRHero title="Candidate Database & Intake" subtitle="Add candidates, qualify them, move stages and keep recruitment execution synchronized." />
    <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) 420px',gap:20}}>
      <HRPanel title="Candidates list" subtitle="Open candidate detail.">
        {data.candidates.slice(0,50).map((c:any)=><HRRow key={c.id} title={c.full_name} meta={`${c.phone || c.email || 'no contact'} • ${c.city || 'Morocco'}`} status={c.stage || c.status} href={`/hr/recruitment/candidates/${c.id}`}/>)}
      </HRPanel>
      <HRPanel title="Add candidate" subtitle="Production candidate intake form.">
        <form action={createCandidateRestore} style={{display:'grid',gap:13}}>
          <HRInput name="full_name" label="Full name" required />
          <HRInput name="phone" label="Phone" />
          <HRInput name="email" label="Email" />
          <HRInput name="city" label="City" />
          <HRSelect name="source" label="Source" options={['manual','whatsapp','facebook','referral','academy','indeed','linkedin','agency','walk_in']} />
          <HRSelect name="stage" label="Stage" options={['new','screening','interview','trial','offer','hired','rejected']} />
          <HRInput name="rating" label="Rating" type="number" />
          <HRTextarea name="next_action" label="Next action" />
          <HRTextarea name="notes" label="Notes" />
          <HRSubmit>Add candidate</HRSubmit>
        </form>
      </HRPanel>
    </div>
  </AppShell>
}
