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
    <AppShell title="Capacity" subtitle="ServiceOS enterprise layer" breadcrumbs={[{ label: 'Services', href: '/services' }, { label: 'Capacity' }]}>
      <ServiceOSHeader title="Capacity" subtitle="Real synchronized Capacity layer connected to shared AngelCare ServiceOS blueprints, rules, pricing, deployments and missions." />
      <ServiceOSPanel>
        <div className="mb-4">
          <h2 className="text-xl font-black text-slate-950">Capacity control</h2>
          <p className="mt-1 text-sm text-slate-600">See city capacity, staff pressure and deployability by service.</p>
        </div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:12}}>{deployments.slice(0,24).map((d,i)=><div key={i} style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:18,padding:14}}><b>{d.city} • {d.blueprintCode}</b><p>Capacity {d.capacityScore}% • Demand {d.demandScore}%</p><p>Staff: {d.staffAvailable} • Priority: {d.launchPriority}</p></div>)}</div></ServiceOSPanel>
    </AppShell>
  )
}
