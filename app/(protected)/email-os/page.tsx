import EmailOSErrorBoundary from "@/components/email-os-core/EmailOSErrorBoundary"
import EmailOSWorkspacePro from "@/components/email-os-core/EmailOSWorkspacePro"

export default function Page() {
  return (
    <EmailOSErrorBoundary>
      <EmailOSWorkspacePro />
    </EmailOSErrorBoundary>
  )
}
