import AppShell from '@/app/components/erp/AppShell'
import { HR_PRODUCTION_NAV } from '@/lib/hr-production/navigation'
import { HRSection, HRTable } from '../_components/HRProductionUI'

export default async function Page() {
  return <AppShell title="HR Settings" subtitle="Operational settings map for roles, routes and governance." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Settings'}]}>
    <div className="space-y-6">
      <HRSection title="Recommended role model" subtitle="Use this to align page access and server actions.">
        <HRTable headers={['Role','Scope','Sensitive actions']} rows={[
          ['CEO','Full HR command, reports, approval overrides','All'],
          ['HR Manager','Staff, recruitment, onboarding, documents, attendance, reports','Create/update/delete HR records'],
          ['Coordinator','Rosters, attendance, tasks, service requests','Create/update operational records'],
          ['Finance/Payroll','Approved attendance and compensation reports','Export payroll inputs'],
          ['Staff','Own profile, requests and documents','Self-service only'],
        ]} />
      </HRSection>
      <HRSection title="Active route registry"><HRTable headers={['Route','Label']} rows={HR_PRODUCTION_NAV.map((x)=>[x.href, x.label])} /></HRSection>
    </div>
  </AppShell>
}
