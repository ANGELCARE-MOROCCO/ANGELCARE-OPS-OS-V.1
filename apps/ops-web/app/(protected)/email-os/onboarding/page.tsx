import MailboxOnboardingPanel from "@/components/email-os-core/MailboxOnboardingPanel"
import ProviderProfilesPanel from "@/components/email-os-core/ProviderProfilesPanel"

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <ProviderProfilesPanel />
        <MailboxOnboardingPanel />
      </div>
    </main>
  )
}
