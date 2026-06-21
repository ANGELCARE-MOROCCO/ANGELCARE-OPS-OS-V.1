import { RisksPage } from "@/components/market-os/campaign-lifecycle/campaign-execution-v2"

export const dynamic = "force-dynamic"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <RisksPage id={id} />
}
