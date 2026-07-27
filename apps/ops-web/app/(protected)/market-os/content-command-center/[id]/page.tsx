import DossierWorkspace from "@/components/market-os/content-command/headquarters/DossierWorkspace"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <DossierWorkspace dossierId={id} compatibilityMode />
}
