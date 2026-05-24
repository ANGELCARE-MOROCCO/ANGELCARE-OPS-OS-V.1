import RevenuePartnershipsEnterpriseWorkspace from "@/components/revenue-command-center/RevenuePartnershipsEnterpriseWorkspace"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default function Page() {
  return <RevenuePartnershipsEnterpriseWorkspace initialTab="meetings" />
}
