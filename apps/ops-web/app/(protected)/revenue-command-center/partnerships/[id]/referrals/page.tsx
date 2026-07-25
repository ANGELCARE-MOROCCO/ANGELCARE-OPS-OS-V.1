import RevenuePartnershipWorkspace from "@/components/revenue-command-center/partnership-enterprise/RevenuePartnershipWorkspace"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <RevenuePartnershipWorkspace experience="partner-referrals-dossier" contextId={id} />
}
