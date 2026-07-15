import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRV3Snapshot } from '@/lib/hr-unified/v3-data'
import { V3Hero, V3MetricCard, V3Panel, V3Row } from '../_components/V3Primitives'

export default async function NotificationsPage() {
  const snap = await getHRV3Snapshot()
  return <AppShell title="HR Notifications Center" subtitle="SUBHR Notifications Center" breadcrumbs={[{label:'HR',href:'/hr'},{label:'Notifications'}]} actions={<><PageAction href="/hr">HR Dashboard</PageAction><PageAction href="/hr/approvals" variant="light">Approvals</PageAction></>}>
    <V3Hero title="HR Notifications Center" subtitle="SUBHR Notifications Center" />
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:16,marginBottom:22}}>
      {snap.metrics.slice(0,4).map((m:any)=><V3MetricCard key={m.label} {...m}/>)}
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1.25fr .75fr',gap:20}}>
      <V3Panel title="Execution queue" subtitle="Live HR records requiring action, review, approval or escalation.">
        {snap.audits.slice(0,12).map((x:any)=><V3Row key={x.id} title={`${x.action || 'Audit event'}`} meta={`Entity ${x.entity_type || 'hr'} • ${x.status || 'ok'}`} status={x.status || x.stage}/>)}
      </V3Panel>
      <V3Panel title="Command controls" subtitle="Use these links to move across the HR executive control layer.">
        <div style={{display:'grid',gap:10}}>
          <a href="/hr/executive" style={link}>Executive Cockpit</a>
          <a href="/hr/approvals" style={link}>Approvals Center</a>
          <a href="/hr/workforce-intelligence" style={link}>Workforce Intelligence</a>
          <a href="/hr/documents" style={link}>Documents Control</a>
          <a href="/hr/reports" style={link}>Reports</a>
          <a href="/hr/notifications" style={link}>Notifications</a>
        </div>
      </V3Panel>
    </div>
  </AppShell>
}
const link={display:'block',padding:'14px 16px',borderRadius:16,background:'#f8fafc',border:'1px solid #e2e8f0',color:'#0f172a',fontWeight:900,textDecoration:'none'}
