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
    <AppShell title="Enterprise" subtitle="ServiceOS enterprise layer" breadcrumbs={[{ label: 'Services', href: '/services' }, { label: 'Enterprise' }]}>
      <ServiceOSHeader title="Enterprise" subtitle="Real synchronized Enterprise layer connected to shared AngelCare ServiceOS blueprints, rules, pricing, deployments and missions." />
      <><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:12}}><ServiceOSKpi label="Blueprints" value={blueprints.length}/><ServiceOSKpi label="Modules" value={modules.length}/><ServiceOSKpi label="Rules" value={rules.length}/><ServiceOSKpi label="Deployments" value={deployments.length}/><ServiceOSKpi label="Live missions" value={missions.length}/></div><ServiceOSPanel>
        <div className="mb-4">
          <h2 className="text-xl font-black text-slate-950">Executive ServiceOS command center</h2>
          <p className="mt-1 text-sm text-slate-600">One synchronized cockpit for services, pricing, operations, capacity, incidents, expansion and AI strategy.</p>
        </div><p>This page validates that the entire ServiceOS reads from the same shared engine instead of isolated fake pages.</p></ServiceOSPanel></>
    </AppShell>
  )
}
