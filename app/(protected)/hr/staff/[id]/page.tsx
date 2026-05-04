import HRDominationWorkspace from '../../_components/HRDominationWorkspace'

export default function Page({ params }: { params: { id: string } }) {
  return <HRDominationWorkspace kind="staff-detail" staffId={params.id} />
}
