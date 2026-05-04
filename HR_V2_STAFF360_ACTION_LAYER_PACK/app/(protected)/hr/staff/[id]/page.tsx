import HRStaff360Page from '../../_components/HRStaff360Page'

export default function Page({ params }: { params: { id: string } }) {
  return <HRStaff360Page staffId={params.id} />
}
