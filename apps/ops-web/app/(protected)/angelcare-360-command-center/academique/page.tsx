import { redirect } from 'next/navigation'
import AcademicLearningAuthority from '@/components/angelcare360/customer-academic-authority/AcademicLearningAuthority'
import AcademicZoneAFrame from '@/components/angelcare360/zone-a-academic/AcademicZoneAFrame'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { getAngelcare360AcademicCommandOverview } from '@/lib/angelcare360/server/academic-command-overview'
import { getAcademicAuthoritySignals } from '@/lib/angelcare360/server/customer-academic-authority'

export const dynamic = 'force-dynamic'

export default async function Angelcare360AcademiquePage({ searchParams }: { searchParams?: Promise<{ date?: string; plane?: string }> }) {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')
  const query = (await searchParams) || {}
  const [data, signals] = await Promise.all([
    getAngelcare360AcademicCommandOverview({ schoolId: context.school.id, academicYearId: context.academicYear?.id || null, academicYearLabel: context.academicYear?.label || null, selectedDate: query.date || null }),
    getAcademicAuthoritySignals(context.school.id),
  ])
  const canCreate = context.access.accessLevel === 'super_admin' || context.permissions.has('academics.create')
  const canUpdate = context.access.accessLevel === 'super_admin' || context.permissions.has('academics.update')
  return (
    <AcademicZoneAFrame>
      <AcademicLearningAuthority data={data} signals={signals} plane={query.plane || 'command'} canCreate={canCreate} canUpdate={canUpdate} />
    </AcademicZoneAFrame>
  )
}
