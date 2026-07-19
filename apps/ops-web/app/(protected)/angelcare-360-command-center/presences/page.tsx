import { redirect } from 'next/navigation'
import Angelcare360ErrorState from '@/components/angelcare360/states/Angelcare360ErrorState'
import Angelcare360PresencesOverview from '@/components/angelcare360/attendance/Angelcare360PresencesOverview'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { getAngelcare360PresencesOverview } from '@/lib/angelcare360/server/presences-overview'

export const dynamic = 'force-dynamic'

export default async function Angelcare360PresencesPage({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string }>
}) {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  const query = (await searchParams) || {}
  const data = await getAngelcare360PresencesOverview({
    schoolId: context.school.id,
    selectedDate: query.date || null,
    activeAcademicYearLabel: context.academicYear?.label || null,
  })

  if (!data) {
    return (
      <Angelcare360ErrorState
        title="Cockpit Présences indisponible"
        description="Le contexte de l’établissement n’a pas permis de charger le suivi des présences."
        actionLabel="Retour au cockpit"
        actionHref="/angelcare-360-command-center"
      />
    )
  }

  return <Angelcare360PresencesOverview data={data} schoolName={context.school.name} />
}
