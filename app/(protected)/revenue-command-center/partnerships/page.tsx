import RevenuePartnershipsEnterprisePage from "@/components/revenue-command-center/RevenuePartnershipsEnterprisePage"
import PartnershipsWhiteTextGuard from "@/components/revenue-command-center/PartnershipsWhiteTextGuard"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default function Page() {
  return (
    <PartnershipsWhiteTextGuard>
      <RevenuePartnershipsEnterprisePage />
    </PartnershipsWhiteTextGuard>
  )
}
