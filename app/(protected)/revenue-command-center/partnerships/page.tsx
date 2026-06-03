import RevenuePartnershipsEnterpriseWorkspace from "@/components/revenue-command-center/RevenuePartnershipsEnterpriseWorkspace"
import PartnershipsWhiteTextGuard from "@/components/revenue-command-center/PartnershipsWhiteTextGuard"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default function Page() {
  return (
    <PartnershipsWhiteTextGuard>
      <RevenuePartnershipsEnterpriseWorkspace initialTab="overview" />
    </PartnershipsWhiteTextGuard>
  )
}
