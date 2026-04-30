import AppShell from '@/app/components/erp/AppShell'
import { requireAccess } from '@/lib/auth/requireAccess'
import { EnterpriseCard, EnterpriseGrid, EnterpriseHero, EnterpriseTable } from '../_components/EnterprisePanels'
import { getAcademyIntegrationReadiness } from '../_lib/integrationReadiness'

export default async function AcademyIntegrationsPage() {
  await requireAccess('academy.view')
  const items = getAcademyIntegrationReadiness()
  return (
    <AppShell title="Academy Integrations" subtitle="Readiness layer for PDF, WhatsApp, email, Drive, revenue and partner dispatch integrations." breadcrumbs={[{ label: 'Academy' }, { label: 'Integrations' }]}>
      <div style={{ display: 'grid', gap: 20 }}>
        <EnterpriseHero title="Academy Integration Readiness" subtitle="Prepare Academy for external communication, document delivery, storage and cross-module synchronization without breaking the operational core." badge="INTEGRATION CONTROL" />
        <EnterpriseGrid>
          <EnterpriseCard title="Ready" value={String(items.filter(i=>i.status==='ready').length)} subtitle="Can be activated with credentials/config only." />
          <EnterpriseCard title="Partial" value={String(items.filter(i=>i.status==='partial').length)} subtitle="Requires provider/config mapping." />
          <EnterpriseCard title="Blocked" value={String(items.filter(i=>i.status==='blocked').length)} subtitle="Requires missing design/data dependency." />
          <EnterpriseCard title="Avg readiness" value={`${Math.round(items.reduce((s,i)=>s+i.readiness,0)/items.length)}%`} subtitle="Integration maturity score." />
        </EnterpriseGrid>
        <EnterpriseTable rows={items.map(i => ({ Integration: i.label, Status: i.status, Readiness: `${i.readiness}%`, 'Next step': i.nextStep }))} />
      </div>
    </AppShell>
  )
}
