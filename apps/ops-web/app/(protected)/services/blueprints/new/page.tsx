import AppShell from '@/app/components/erp/AppShell'
import { ServiceOSPanel } from '@/components/service-os/ServiceOSPrimitives'
import { ServiceOSBlueprintForm } from '@/components/service-os/production/ServiceOSBlueprintForm'

export default function Page() {
  return <AppShell title="Nouveau Service Blueprint" subtitle="Créer un service configurable AngelCare prêt pour opérations, pricing, staff et expansion." breadcrumbs={[{label:'Services',href:'/services'},{label:'Blueprints',href:'/services/blueprints'},{label:'Nouveau'}]}><ServiceOSPanel>
        <div className="mb-4">
          <h2 className="text-xl font-black text-slate-950">Blueprint production</h2>
        </div><ServiceOSBlueprintForm /></ServiceOSPanel></AppShell>
}
