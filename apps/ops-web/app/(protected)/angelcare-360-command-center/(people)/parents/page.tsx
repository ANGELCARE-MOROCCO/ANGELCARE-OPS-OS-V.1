import { redirect } from 'next/navigation'
import Angelcare360ErrorState from '@/components/angelcare360/states/Angelcare360ErrorState'
import Angelcare360ParentsOverview from '@/components/angelcare360/people/Angelcare360ParentsOverview'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { listAngelcare360Parents } from '@/lib/angelcare360/server/people'
import { getAngelcare360ParentsOverviewData } from '@/lib/angelcare360/server/parents-overview'
import { createParentPeopleConfig } from '@/data/angelcare360/people-pages'

export const dynamic = 'force-dynamic'

export default async function Angelcare360ParentsPage() {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  if (!context.access.canSeePeopleData && !context.permissions.has('parents.view') && context.access.accessLevel !== 'super_admin') {
    return (
      <Angelcare360ErrorState
        title="Accès aux parents verrouillé"
        description="Votre rôle ne permet pas encore d’accéder aux dossiers familles."
        actionLabel="Retour au cockpit"
        actionHref="/angelcare-360-command-center"
      />
    )
  }

  const rows = await listAngelcare360Parents({ schoolId: context.school.id })
  const overview = await getAngelcare360ParentsOverviewData({
    schoolId: context.school.id,
    parents: rows as unknown as Array<Record<string, unknown>>,
  })
  const config = createParentPeopleConfig({ schoolId: context.school.id })
  const canCreate = context.access.accessLevel === 'super_admin' || context.permissions.has('parents.create')
  const canUpdate = context.access.accessLevel === 'super_admin' || context.permissions.has('parents.update')

  return (
    <Angelcare360ParentsOverview
      config={config}
      rows={rows as unknown as Array<Record<string, unknown>>}
      overview={overview}
      schoolName={context.school.name}
      academicYearLabel={context.academicYear?.label || 'Année scolaire à configurer'}
      canCreate={canCreate}
      canUpdate={canUpdate}
      createDisabledReason="La création d’un parent est réservée aux rôles autorisés."
      updateDisabledReason="La modification d’un parent est réservée aux rôles autorisés."
    />
  )
}
