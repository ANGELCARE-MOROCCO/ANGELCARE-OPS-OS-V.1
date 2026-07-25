import ProspectEnterpriseDossier from "@/components/revenue-command-center/prospects-enterprise/ProspectEnterpriseDossier"

export const dynamic = "force-dynamic"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ProspectEnterpriseDossier prospectId={id} mode="negotiation" />
}
