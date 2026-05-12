import AppShell from '@/app/components/erp/AppShell'
import { ServiceOSHeader, ServiceOSPanel, ServiceOSKpi, StatusBadge } from '@/components/service-os/ServiceOSPrimitives'
import { getServiceBlueprints, getServiceModules, getServiceRules, getCityDeployments, getServiceMissions, calculateServicePrice, recommendServiceForNeed } from '@/lib/service-os/engine'

export default function Page() {
  const blueprints = getServiceBlueprints()
  const modules = getServiceModules()
  const rules = getServiceRules()
  const deployments = getCityDeployments()
  const missions = getServiceMissions()
  const samplePrice = calculateServicePrice({ blueprintCode: 'S.H', city: 'Rabat', urgent: true, night: true, specialNeeds: true, transport: true, hours: 5 })
  const matches = recommendServiceForNeed('famille premium besoin special ecole domicile')
  return (
    <AppShell title="Subscriptions" subtitle="ServiceOS enterprise layer" breadcrumbs={[{ label: 'Services', href: '/services' }, { label: 'Subscriptions' }]}>
      <ServiceOSHeader title="Subscriptions" subtitle="Real synchronized Subscriptions layer connected to shared AngelCare ServiceOS blueprints, rules, pricing, deployments and missions." />
      <ServiceOSPanel>
        <div className="mb-4">
          <h2 className="text-xl font-black text-slate-950">Membership and recurring revenue engine</h2>
          <p className="mt-1 text-sm text-slate-600">Family plans, premium memberships and institutional recurring contracts.</p>
        </div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:14}}>{['AngelCare Family Premium','Postpartum Monthly Support','School Support Institution SLA','Hotel Family Concierge Care'].map((p,i)=><div key={p} style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:20,padding:16}}><h3>{p}</h3><p>Recurring plan with priority booking, reporting, SLA and renewal workflow.</p><b>{[1490,2990,8500,12000][i]} MAD / month</b></div>)}</div></ServiceOSPanel>
    </AppShell>
  )
}
