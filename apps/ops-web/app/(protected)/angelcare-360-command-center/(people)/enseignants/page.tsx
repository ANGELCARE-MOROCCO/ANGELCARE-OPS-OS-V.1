import { redirect } from 'next/navigation'
import Angelcare360ErrorState from '@/components/angelcare360/states/Angelcare360ErrorState'
import Angelcare360TeachersOverview from '@/components/angelcare360/people/Angelcare360TeachersOverview'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { listAngelcare360Teachers } from '@/lib/angelcare360/server/people'
import { getAngelcare360TeachersOverviewData } from '@/lib/angelcare360/server/teachers-overview'
import { createStaffPeopleConfig } from '@/data/angelcare360/people-pages'

export const dynamic = 'force-dynamic'

export default async function Angelcare360TeachersPage() {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  if (!context.access.canSeePeopleData && !context.permissions.has('enseignants.view') && context.access.accessLevel !== 'super_admin') {
    return (
      <Angelcare360ErrorState
        title="Accès aux enseignants verrouillé"
        description="Votre rôle ne permet pas encore d’accéder aux profils pédagogiques."
        actionLabel="Retour au cockpit"
        actionHref="/angelcare-360-command-center"
      />
    )
  }

  const rows = await listAngelcare360Teachers({ schoolId: context.school.id })
  const overview = await getAngelcare360TeachersOverviewData({
    schoolId: context.school.id,
    teachers: rows as unknown as Array<Record<string, unknown>>,
  })
  const config = createStaffPeopleConfig({ schoolId: context.school.id, staffType: 'teacher' })
  const canCreate = context.access.accessLevel === 'super_admin' || context.permissions.has('enseignants.create')
  const canUpdate = context.access.accessLevel === 'super_admin' || context.permissions.has('enseignants.update')

  return (
    <Angelcare360TeachersOverview
      config={config}
      rows={rows as unknown as Array<Record<string, unknown>>}
      overview={overview}
      schoolName={context.school.name}
      academicYearLabel={context.academicYear?.label || 'Année scolaire à configurer'}
      canCreate={canCreate}
      canUpdate={canUpdate}
      createDisabledReason="La création d’un enseignant est réservée aux rôles autorisés."
      updateDisabledReason="La modification d’un enseignant est réservée aux rôles autorisés."
    />
  )
}
