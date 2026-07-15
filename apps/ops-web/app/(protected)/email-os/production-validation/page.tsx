import ProductionValidationPanel from "@/components/email-os-core/ProductionValidationPanel"
import RouteProtectionPanel from "@/components/email-os-core/RouteProtectionPanel"

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <ProductionValidationPanel />
        <RouteProtectionPanel />
      </div>
    </main>
  )
}
