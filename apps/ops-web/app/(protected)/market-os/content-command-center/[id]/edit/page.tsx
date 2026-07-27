import GovernedContentEditWorkspace from "@/components/market-os/content-command/headquarters/dossier/GovernedContentEditWorkspace"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <GovernedContentEditWorkspace id={id} />
}
