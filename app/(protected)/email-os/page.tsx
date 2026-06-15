import EmailOSErrorBoundary from "@/components/email-os-core/EmailOSErrorBoundary"
import EmailOSEnterpriseProductionWorkspace from "@/components/email-os-core/EmailOSEnterpriseProductionWorkspace"

export default function Page() {
  return (
    <EmailOSErrorBoundary>
      <EmailOSEnterpriseProductionWorkspace />
    </EmailOSErrorBoundary>
  )
}
