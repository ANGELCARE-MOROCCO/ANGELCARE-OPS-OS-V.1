import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRRestoreLists } from '@/lib/hr-unified/route-restore-data'
import { moveCandidateRestore } from '@/lib/hr-unified/route-restore-actions'
import { HRHero, HRPanel, HRSubmit } from '../../_components/HRMaxUI'

const stages = ['new','screening','interview','trial','offer','hired','rejected']

export default async function RecruitmentKanbanPage() {
  const data = await getHRRestoreLists()
  return <AppShell title="Recruitment Kanban" subtitle="Move candidates through hiring stages." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Recruitment',href:'/hr/recruitment'},{label:'Kanban'}]} actions={<PageAction href="/hr/recruitment/candidates">Candidates</PageAction>}>
    <HRHero title="Recruitment Pipeline Kanban" subtitle="Stage-based execution board. Each move writes to candidate stage and pipeline log." />
    <div style={{display:'grid',gridTemplateColumns:'repeat(7,minmax(230px,1fr))',gap:14,overflowX:'auto',paddingBottom:8}}>
      {stages.map(stage=><HRPanel key={stage} title={stage} subtitle={`${data.candidates.filter((c:any)=>String(c.stage||'new')===stage).length} candidates`}>
        {data.candidates.filter((c:any)=>String(c.stage||'new')===stage).slice(0,14).map((c:any)=><div key={c.id} style={{padding:12,border:'1px solid #e2e8f0',borderRadius:16,background:'#f8fafc',marginBottom:10}}>
          <a href={`/hr/recruitment/candidates/${c.id}`} style={{fontWeight:950,color:'#0f172a',textDecoration:'none'}}>{c.full_name}</a>
          <div style={{fontSize:12,color:'#64748b',fontWeight:800,margin:'4px 0 8px'}}>{c.phone || c.email || c.city || 'No contact'}</div>
          <form action={moveCandidateRestore} style={{display:'flex',gap:6}}>
            <input type="hidden" name="id" value={c.id} />
            <select name="stage" defaultValue={stage} style={{height:34,borderRadius:10,border:'1px solid #cbd5e1',fontWeight:800}}>
              {stages.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
            <HRSubmit>Move</HRSubmit>
          </form>
        </div>)}
      </HRPanel>)}
    </div>
  </AppShell>
}
