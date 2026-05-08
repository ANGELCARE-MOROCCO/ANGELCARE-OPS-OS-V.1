import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRPhase3 } from '@/lib/hr-unified/max-phase3-data'
import { verifyDocumentPhase3 } from '@/lib/hr-unified/max-phase3-actions'
import { HRHero, HRPanel, HRRow, HRGrid, HRMetric, HRSubmit } from '../_components/HRMaxUI'

export default async function DocumentsCenterPage() {
  const data = await getHRPhase3()
  const pending = data.docs.filter((d:any)=>String(d.verification_status||'pending')==='pending')
  const verified = data.docs.filter((d:any)=>String(d.verification_status||'')==='verified')
  const expiring = data.docs.filter((d:any)=>d.expiry_date && ((new Date(d.expiry_date).getTime()-Date.now())/86400000)<=45)
  const metrics = [
    {label:'Documents',value:data.docs.length,detail:'Total staff files',tone:'#2563eb'},
    {label:'Pending',value:pending.length,detail:'Need verification',tone:'#d97706'},
    {label:'Verified',value:verified.length,detail:'Approved files',tone:'#059669'},
    {label:'Expiring',value:expiring.length,detail:'Within 45 days / overdue',tone:'#dc2626'},
  ]
  return <AppShell title="HR Documents Center" subtitle="Verification and compliance control." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Documents'}]} actions={<PageAction href="/hr/staff" variant="light">Staff</PageAction>}>
    <HRHero title="Documents Verification Center" subtitle="Central control for staff documents, verification status, expiry risks and compliance readiness." />
    <HRGrid min={210}>{metrics.map((m:any)=><HRMetric key={m.label} {...m}/>)}</HRGrid>
    <div style={{height:22}} />
    <HRPanel title="Document queue" subtitle="Verify/reject documents directly.">
      {data.docs.slice(0,80).map((d:any)=><div key={d.id} style={{borderBottom:'1px solid #f1f5f9',padding:'12px 0'}}>
        <HRRow title={d.title || d.document_type} meta={`${d.document_type || 'document'} • expiry ${d.expiry_date || 'none'} • staff ${d.staff_id || '—'}`} status={d.verification_status || d.status}/>
        <form action={verifyDocumentPhase3} style={{display:'flex',gap:8,marginTop:8}}>
          <input type="hidden" name="id" value={d.id} />
          <select name="verification_status" defaultValue={d.verification_status || 'pending'} style={{height:34,borderRadius:10,border:'1px solid #cbd5e1',fontWeight:800}}>
            {['pending','verified','rejected','expired'].map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <HRSubmit>Update</HRSubmit>
        </form>
      </div>)}
    </HRPanel>
  </AppShell>
}
