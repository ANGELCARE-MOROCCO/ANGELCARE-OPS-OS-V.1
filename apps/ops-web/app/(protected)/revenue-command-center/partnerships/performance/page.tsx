import RevenuePartnershipWorkspace from "@/components/revenue-command-center/partnership-enterprise/RevenuePartnershipWorkspace"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default function Page() {
  return <RevenuePartnershipWorkspace experience="performance-command" />
}
