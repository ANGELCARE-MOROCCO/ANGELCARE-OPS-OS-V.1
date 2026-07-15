import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getCurrentUser } from '@/lib/getUser'
import { getStaffPortalPhase1Data } from '@/lib/staff-portal-os/phase1-data'
import { getMegaStaffPortalData } from '@/lib/staff-portal-os/mega-phase7'
import { EnterpriseButton, EnterpriseHero, EnterpriseMetric, EnterprisePageShell, EnterprisePanel, EnterpriseRow, enterpriseGrid } from '@/components/angelcare-enterprise/EnterpriseCommandUI'

export default async function Page() {
  const user = await getCurrentUser()
  const data = getMegaStaffPortalData(user, await getStaffPortalPhase1Data(user))
  return (
    <AppShell title="Staff Portal Command" subtitle="Central operating surface for execution, services, memos and role-aware workspaces." breadcrumbs={[{ label: 'Staff Portal', href: '/staff-home' }, { label: 'Command' }]} actions={<PageAction href="/staff-home" variant="light">Home</PageAction>}>
      <EnterprisePageShell>
        <EnterpriseHero eyebrow="Staff Portal OS Mega Phase 7" title="Staff Portal Command" subtitle="Central operating surface for execution, services, memos and role-aware workspaces." tone="blue" stats={[
          { label: 'Persona', value: data.persona.label },
          { label: 'Routes', value: data.accessRoutes.length },
          { label: 'Today tasks', value: data.tasksToday.length },
          { label: 'Memos', value: data.memos.length },
        ]} actions={<><EnterpriseButton href="/staff-home" tone="blue">Portal Home</EnterpriseButton><EnterpriseButton href="/staff-services" tone="green">Services</EnterpriseButton><EnterpriseButton href="/staff-memos" tone="red">Memos</EnterpriseButton></>} />
        <div style={enterpriseGrid}>{data.executiveSignals.map((item) => <EnterpriseMetric key={item.label} {...item} />)}</div>
        <div style={{ height: 22 }} />
        <EnterprisePanel title="Command Zones" subtitle="Open the correct operating workspace." tone="blue">
          {data.commandZones.map((zone) => <EnterpriseRow key={zone.href} title={zone.title} meta={zone.detail} status="open" href={zone.href} tone={zone.tone} />)}
        </EnterprisePanel>
      </EnterprisePageShell>
    </AppShell>
  )
}
