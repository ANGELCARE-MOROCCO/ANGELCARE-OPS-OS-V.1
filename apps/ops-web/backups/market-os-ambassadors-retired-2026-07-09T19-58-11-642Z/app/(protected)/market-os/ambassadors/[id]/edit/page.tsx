import AmbassadorProductionWorkspace from "@/components/market-os/ambassadors/ambassador-production-workspace"

export const dynamic = "force-dynamic"

type PageProps = { params: Promise<{ id: string }> }

export default async function Page({ params }: PageProps) {
  const { id } = await params
  return <AmbassadorProductionWorkspace mode="edit" id={id} />
}
