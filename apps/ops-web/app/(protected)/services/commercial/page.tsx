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
    <AppShell title="Commercial" subtitle="ServiceOS enterprise layer" breadcrumbs={[{ label: 'Services', href: '/services' }, { label: 'Commercial' }]}>
      <ServiceOSHeader title="Commercial" subtitle="Real synchronized Commercial layer connected to shared AngelCare ServiceOS blueprints, rules, pricing, deployments and missions." />
      <><ServiceOSPanel>
        <div className="mb-4">
          <h2 className="text-xl font-black text-slate-950">Commercial cockpit</h2>
          <p className="mt-1 text-sm text-slate-600">Packages, upsells, B2B contracts and service portfolio growth.</p>
        </div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12}}><ServiceOSKpi label="Blueprints sellable" value={blueprints.length}/><ServiceOSKpi label="Subscription ready" value={blueprints.filter(b=>b.modules.includes('subscription_ready') || b.family === 'subscription').length}/><ServiceOSKpi label="B2B ready" value={blueprints.filter(b=>b.modules.includes('institution_contract') || b.modules.includes('sla_contract')).length}/></div></ServiceOSPanel></>
    </AppShell>
  )
}
