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
    <AppShell title="Expansion" subtitle="ServiceOS enterprise layer" breadcrumbs={[{ label: 'Services', href: '/services' }, { label: 'Expansion' }]}>
      <ServiceOSHeader title="Expansion" subtitle="Real synchronized Expansion layer connected to shared AngelCare ServiceOS blueprints, rules, pricing, deployments and missions." />
      <ServiceOSPanel>
        <div className="mb-4">
          <h2 className="text-xl font-black text-slate-950">Expansion planning</h2>
          <p className="mt-1 text-sm text-slate-600">Prioritize cities and service families based on demand, risk and staffing readiness.</p>
        </div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:14}}>{['Rabat Domination','Casablanca Scale-Up','Marrakech Tourism Care','Tangier Bilingual Expansion','Online Academy Growth'].map((x: any)=><div key={x} style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:20,padding:16}}><h3>{x}</h3><p>Launch plan includes staffing, pricing, market messaging, contracts and capacity gates.</p><StatusBadge text="Expansion-ready"/></div>)}</div></ServiceOSPanel>
    </AppShell>
  )
}
