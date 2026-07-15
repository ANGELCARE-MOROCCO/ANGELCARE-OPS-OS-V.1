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
    <AppShell title="Ai Matching" subtitle="ServiceOS enterprise layer" breadcrumbs={[{ label: 'Services', href: '/services' }, { label: 'Ai Matching' }]}>
      <ServiceOSHeader title="Ai Matching" subtitle="Real synchronized Ai Matching layer connected to shared AngelCare ServiceOS blueprints, rules, pricing, deployments and missions." />
      <ServiceOSPanel>
        <div className="mb-4">
          <h2 className="text-xl font-black text-slate-950">AI-style matching engine</h2>
          <p className="mt-1 text-sm text-slate-600">Match client need to service blueprint, modules, staff logic and pricing.</p>
        </div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:14}}>{matches.slice(0,6).map((x: any)=><div key={x.blueprint.code} style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:20,padding:16}}><h3>{x.score}% — {x.blueprint.name}</h3><p>{x.blueprint.marketSegment}</p><p>{(Array.isArray(x.blueprint.modules) ? x.blueprint.modules : []).join(', ')}</p></div>)}</div></ServiceOSPanel>
    </AppShell>
  )
}
