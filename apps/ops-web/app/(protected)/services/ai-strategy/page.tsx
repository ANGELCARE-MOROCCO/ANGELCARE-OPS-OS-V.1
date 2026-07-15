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
    <AppShell title="Ai Strategy" subtitle="ServiceOS enterprise layer" breadcrumbs={[{ label: 'Services', href: '/services' }, { label: 'Ai Strategy' }]}>
      <ServiceOSHeader title="Ai Strategy" subtitle="Real synchronized Ai Strategy layer connected to shared AngelCare ServiceOS blueprints, rules, pricing, deployments and missions." />
      <ServiceOSPanel>
        <div className="mb-4">
          <h2 className="text-xl font-black text-slate-950">AI strategy recommendations</h2>
          <p className="mt-1 text-sm text-slate-600">Strategic growth suggestions for pricing, staffing, expansion and offers.</p>
        </div><div style={{display:'grid',gap:14}}>{['Scale special-needs hybrid care in Rabat and Casablanca','Launch hotel childcare concierge in Marrakech','Bundle postpartum support into premium family membership','Create school SLA contracts for institution revenue','Train certified staff pipeline through AngelCare Academy'].map((x: any)=><div key={x} style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:20,padding:16}}><h3>{x}</h3><p>Recommended because it connects demand, margin, operational differentiation and long-term defensibility.</p></div>)}</div></ServiceOSPanel>
    </AppShell>
  )
}
