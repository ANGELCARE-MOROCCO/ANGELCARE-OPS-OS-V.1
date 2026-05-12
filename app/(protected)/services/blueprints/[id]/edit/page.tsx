import AppShell from '@/app/components/erp/AppShell'
import { ServiceOSPanel } from '@/components/service-os/ServiceOSPrimitives'
import { ServiceOSBlueprintForm } from '@/components/service-os/production/ServiceOSBlueprintForm'
import { listServiceOSBlueprints } from '@/lib/service-os/production/repository'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const blueprint = (await listServiceOSBlueprints()).find((b) => b.id === id || b.code === id)
  return <AppShell title="Modifier Service Blueprint" subtitle="Édition production synchronisée du service." breadcrumbs={[{label:'Services',href:'/services'},{label:'Blueprints',href:'/services/blueprints'},{label:id}]}><ServiceOSPanel>
        <div className="mb-4">
          <h2 className="text-xl font-black text-slate-950">Configuration</h2>
        </div><ServiceOSBlueprintForm blueprint={blueprint} /></ServiceOSPanel></AppShell>
}
