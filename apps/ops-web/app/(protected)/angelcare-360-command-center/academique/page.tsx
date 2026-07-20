import { redirect } from 'next/navigation'
import Angelcare360AcademicCommandOverview from '@/components/angelcare360/academics/Angelcare360AcademicCommandOverview'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { getAngelcare360AcademicCommandOverview } from '@/lib/angelcare360/server/academic-command-overview'

export const dynamic = 'force-dynamic'

export default async function Angelcare360AcademiquePage({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string }>
}) {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  const query = (await searchParams) || {}
  const data = await getAngelcare360AcademicCommandOverview({
    schoolId: context.school.id,
    academicYearId: context.academicYear?.id || null,
    academicYearLabel: context.academicYear?.label || null,
    selectedDate: query.date || null,
  })

  const canCreate = context.access.accessLevel === 'super_admin' || context.permissions.has('academics.create')
  const canUpdate = context.access.accessLevel === 'super_admin' || context.permissions.has('academics.update')

  return (
    <Angelcare360AcademicCommandOverview
      data={data}
      canCreate={canCreate}
      canUpdate={canUpdate}
    />
  )
}
