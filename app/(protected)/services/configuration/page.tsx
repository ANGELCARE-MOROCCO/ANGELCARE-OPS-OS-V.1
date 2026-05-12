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
    <AppShell title="Configuration" subtitle="ServiceOS enterprise layer" breadcrumbs={[{ label: 'Services', href: '/services' }, { label: 'Configuration' }]}>
      <ServiceOSHeader title="Configuration" subtitle="Real synchronized Configuration layer connected to shared AngelCare ServiceOS blueprints, rules, pricing, deployments and missions." />
      <><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12}}><ServiceOSKpi label="Modules" value={modules.length}/><ServiceOSKpi label="Rules" value={rules.length}/><ServiceOSKpi label="Blueprints" value={blueprints.length}/><ServiceOSKpi label="City deployments" value={deployments.length}/></div><ServiceOSPanel>
        <div className="mb-4">
          <h2 className="text-xl font-black text-slate-950">Configurable modules</h2>
          <p className="mt-1 text-sm text-slate-600">Attachable capability blocks that make services flexible for the next 10 years.</p>
        </div><div style={{columns:2}}>{modules.map((m: any)=><p key={m.key}><b>{m.label}</b> — {m.description}</p>)}</div></ServiceOSPanel></>
    </AppShell>
  )
}
