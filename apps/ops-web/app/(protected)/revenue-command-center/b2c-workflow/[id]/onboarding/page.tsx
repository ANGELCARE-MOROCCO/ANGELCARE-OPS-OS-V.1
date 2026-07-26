import RevenueB2CWorkspace from "@/components/revenue-command-center/b2c-enterprise/RevenueB2CWorkspace"

export const dynamic = "force-dynamic"

export default async function Page({ params }:{ params:Promise<{id:string}> }) {
  const { id } = await params
  return <RevenueB2CWorkspace experience="family-onboarding-dossier" contextId={id} />
}
