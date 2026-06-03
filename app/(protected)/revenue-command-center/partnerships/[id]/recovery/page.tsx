import RevenuePartnershipsEnterpriseWorkspace from "@/components/revenue-command-center/RevenuePartnershipsEnterpriseWorkspace"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <RevenuePartnershipsEnterpriseWorkspace initialTab="risk" focusPartnerId={id} />
}
