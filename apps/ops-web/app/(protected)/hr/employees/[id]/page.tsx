import Staff360ProductionView from '@/components/hr-production/Staff360ProductionView'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <Staff360ProductionView employeeId={id} />
}
