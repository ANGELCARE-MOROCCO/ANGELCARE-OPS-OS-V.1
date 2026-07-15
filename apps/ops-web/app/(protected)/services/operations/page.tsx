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
    <AppShell title="Operations" subtitle="ServiceOS enterprise layer" breadcrumbs={[{ label: 'Services', href: '/services' }, { label: 'Operations' }]}>
      <ServiceOSHeader title="Operations" subtitle="Real synchronized Operations layer connected to shared AngelCare ServiceOS blueprints, rules, pricing, deployments and missions." />
      <ServiceOSPanel>
        <div className="mb-4">
          <h2 className="text-xl font-black text-slate-950">Operational lifecycle</h2>
          <p className="mt-1 text-sm text-slate-600">From request to launch to quality review, every mission follows an executable path.</p>
        </div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:12}}>{missions.map((m: any)=><div key={m.id} style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:18,padding:14}}><b>{m.client}</b><p>{m.blueprintCode} • {m.city}</p><StatusBadge text={m.status}/><p>{m.valueMad} MAD • risk {m.risk}</p></div>)}</div></ServiceOSPanel>
    </AppShell>
  )
}
