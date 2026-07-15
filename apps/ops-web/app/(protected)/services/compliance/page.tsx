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
    <AppShell title="Compliance" subtitle="ServiceOS enterprise layer" breadcrumbs={[{ label: 'Services', href: '/services' }, { label: 'Compliance' }]}>
      <ServiceOSHeader title="Compliance" subtitle="Real synchronized Compliance layer connected to shared AngelCare ServiceOS blueprints, rules, pricing, deployments and missions." />
      <ServiceOSPanel>
        <div className="mb-4">
          <h2 className="text-xl font-black text-slate-950">Compliance center</h2>
          <p className="mt-1 text-sm text-slate-600">Required documents, staff certification and client authorizations by service risk.</p>
        </div><div>{blueprints.map((b: any)=><p key={b.code}><b>{b.code}</b>: {(Array.isArray(b.requiredDocuments) ? b.requiredDocuments : []).join(', ')} • Skills: {b.requiredSkills.join(', ')}</p>)}</div></ServiceOSPanel>
    </AppShell>
  )
}
