import EmailOSErrorBoundary from "@/components/email-os-core/EmailOSErrorBoundary"
import EmailOSMailboxGateDispatcher from "@/components/email-os-core/EmailOSMailboxGateDispatcher"

export default function Page() {
  return (
    <EmailOSErrorBoundary>
      <EmailOSMailboxGateDispatcher />
    </EmailOSErrorBoundary>
  )
}
