import ContentCommandHeadquartersWorkspace from "@/components/market-os/content-command/headquarters/ContentCommandHeadquartersWorkspace"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ContentCommandHeadquartersWorkspace view="dossier" dossierId={id} />
}
