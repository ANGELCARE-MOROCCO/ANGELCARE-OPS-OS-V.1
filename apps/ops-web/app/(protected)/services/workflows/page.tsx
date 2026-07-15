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
    <AppShell title="Workflows" subtitle="ServiceOS enterprise layer" breadcrumbs={[{ label: 'Services', href: '/services' }, { label: 'Workflows' }]}>
      <ServiceOSHeader title="Workflows" subtitle="Real synchronized Workflows layer connected to shared AngelCare ServiceOS blueprints, rules, pricing, deployments and missions." />
      <ServiceOSPanel>
        <div className="mb-4">
          <h2 className="text-xl font-black text-slate-950">Workflow builder</h2>
          <p className="mt-1 text-sm text-slate-600">Default workflows are generated from the blueprint and can be specialized by family, city or risk.</p>
        </div><div style={{display:'grid',gap:14}}>{blueprints.slice(0,8).map((b: any)=><div key={b.code} style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:18,padding:16}}><h3>{b.code} — {b.name}</h3><p>{(Array.isArray(b.defaultWorkflow) ? b.defaultWorkflow : []).join(' → ')}</p></div>)}</div></ServiceOSPanel>
    </AppShell>
  )
}
