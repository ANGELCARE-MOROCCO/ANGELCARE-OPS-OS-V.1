import AmbassadorSubpage from "@/components/market-os/ambassadors/ambassador-subpage"

export const dynamic = "force-dynamic"

type PageProps = { params: Promise<{ id: string }> }

export default async function Page({ params }: PageProps) {
  const { id } = await params
  return <AmbassadorSubpage mode="edit" id={id} />
}
