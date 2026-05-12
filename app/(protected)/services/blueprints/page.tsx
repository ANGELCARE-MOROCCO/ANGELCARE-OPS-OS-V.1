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
    <AppShell title="Blueprints" subtitle="ServiceOS enterprise layer" breadcrumbs={[{ label: 'Services', href: '/services' }, { label: 'Blueprints' }]}>
      <ServiceOSHeader title="Blueprints" subtitle="Real synchronized Blueprints layer connected to shared AngelCare ServiceOS blueprints, rules, pricing, deployments and missions." />
      <ServiceOSPanel>
        <div className="mb-4">
          <h2 className="text-xl font-black text-slate-950">Blueprint portfolio</h2>
          <p className="mt-1 text-sm text-slate-600">Every AngelCare service becomes a configurable operating blueprint instead of a static card.</p>
        </div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:14}}>{blueprints.map((b)=><div key={b.code} style={{border:'1px solid #e2e8f0',borderRadius:20,padding:16,background:'#fff'}}><div style={{display:'flex',justifyContent:'space-between',gap:12}}><b>{b.code}</b><StatusBadge text={b.status}/></div><h3>{b.name}</h3><p style={{color:'#64748b'}}>{b.marketSegment}</p><p><b>Modules:</b> {(b.modules ?? []).length} • <b>Cities:</b> {(b.cities ?? []).join(', ')}</p><p><b>Workflow:</b> {(b.defaultWorkflow ?? []).slice(0, 4).join(' → ')}...</p></div>)}</div></ServiceOSPanel>
    </AppShell>
  )
}
