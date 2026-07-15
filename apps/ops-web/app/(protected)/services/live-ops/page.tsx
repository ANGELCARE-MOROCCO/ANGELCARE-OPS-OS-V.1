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
    <AppShell title="Live Ops" subtitle="ServiceOS enterprise layer" breadcrumbs={[{ label: 'Services', href: '/services' }, { label: 'Live Ops' }]}>
      <ServiceOSHeader title="Live Ops" subtitle="Real synchronized Live Ops layer connected to shared AngelCare ServiceOS blueprints, rules, pricing, deployments and missions." />
      <ServiceOSPanel>
        <div className="mb-4">
          <h2 className="text-xl font-black text-slate-950">Live operations center</h2>
          <p className="mt-1 text-sm text-slate-600">Active missions, delays, alerts and operational risks across AngelCare services.</p>
        </div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:12}}>{missions.filter(m=>['assigned','live','incident'].includes(m.status ?? '')).map((m: any)=><div key={m.id} style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:18,padding:14}}><b>{m.blueprintCode} • {m.city}</b><p>{m.client} • {m.staff}</p><StatusBadge text={m.status}/><p>Value {m.valueMad} MAD</p></div>)}</div></ServiceOSPanel>
    </AppShell>
  )
}
