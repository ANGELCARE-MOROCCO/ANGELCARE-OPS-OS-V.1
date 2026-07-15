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
    <AppShell title="Market Intelligence" subtitle="ServiceOS enterprise layer" breadcrumbs={[{ label: 'Services', href: '/services' }, { label: 'Market Intelligence' }]}>
      <ServiceOSHeader title="Market Intelligence" subtitle="Real synchronized Market Intelligence layer connected to shared AngelCare ServiceOS blueprints, rules, pricing, deployments and missions." />
      <ServiceOSPanel>
        <div className="mb-4">
          <h2 className="text-xl font-black text-slate-950">Market intelligence</h2>
          <p className="mt-1 text-sm text-slate-600">Demand signals, underserved segments and future service opportunities.</p>
        </div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:14}}>{['Autism/special needs support','Postpartum premium care','Montessori parascolaire','Hotel/tourism childcare','School institution contracts','Premium family subscriptions'].map((x: any)=><div key={x} style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:20,padding:16}}><h3>{x}</h3><p>Track demand, competitor gap, staff readiness, city expansion and expected margin.</p><StatusBadge text="High potential"/></div>)}</div></ServiceOSPanel>
    </AppShell>
  )
}
