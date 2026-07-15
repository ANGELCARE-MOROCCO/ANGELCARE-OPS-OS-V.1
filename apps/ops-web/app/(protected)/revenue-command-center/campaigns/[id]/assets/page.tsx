import RevenueCommandFinalWorkspace from '../../../_final/RevenueCommandFinalWorkspace'

export default function Page({ params }: { params: { id: string } }) {
  return <RevenueCommandFinalWorkspace workspace="campaignAssets" recordId={params.id} />
}
