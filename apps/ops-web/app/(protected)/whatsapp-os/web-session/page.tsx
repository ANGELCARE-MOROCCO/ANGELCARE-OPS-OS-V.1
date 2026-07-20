import WhatsAppDesktopWorkspace from "@/components/whatsapp-os/WhatsAppDesktopWorkspace"
import WhatsAppGovernanceGate from "@/components/whatsapp-os/WhatsAppGovernanceGate"

export default function WhatsAppWebSessionPage() {
  return <WhatsAppGovernanceGate><WhatsAppDesktopWorkspace /></WhatsAppGovernanceGate>
}
