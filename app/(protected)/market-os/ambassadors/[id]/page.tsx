import AmbassadorSubpage from "@/components/market-os/ambassadors/ambassador-subpage"
export const dynamic = "force-dynamic"
export default function Page({ params }: { params: { id: string } }){ return <AmbassadorSubpage mode="detail" id={params.id}/> }
