import WhatsAppSessionControl from "@/components/whatsapp-os/WhatsAppSessionControl"
import WhatsAppGovernanceStatusPanel from "@/components/whatsapp-os/WhatsAppGovernanceStatusPanel"

export default function WhatsAppSessionControlPage() {
  return <main className="min-h-screen bg-slate-50 p-4 lg:p-7"><WhatsAppGovernanceStatusPanel /><WhatsAppSessionControl /></main>
}
