import { redirect } from 'next/navigation'
import Angelcare360ErrorState from '@/components/angelcare360/states/Angelcare360ErrorState'
import Angelcare360PersonnelOverview from '@/components/angelcare360/people/Angelcare360PersonnelOverview'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { listAngelcare360Staff } from '@/lib/angelcare360/server/people'
import { getAngelcare360PersonnelOverviewData } from '@/lib/angelcare360/server/personnel-overview'
import { createStaffPeopleConfig } from '@/data/angelcare360/people-pages'

export const dynamic = 'force-dynamic'

export default async function Angelcare360PersonnelPage() {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  if (!context.access.canSeePeopleData && !context.permissions.has('personnel.view') && context.access.accessLevel !== 'super_admin') {
    return (
      <Angelcare360ErrorState
        title="Accès au personnel verrouillé"
        description="Votre rôle ne permet pas encore d’accéder aux dossiers du personnel."
        actionLabel="Retour au cockpit"
        actionHref="/angelcare-360-command-center"
      />
    )
  }

  const staff = await listAngelcare360Staff({ schoolId: context.school.id })
  const overview = await getAngelcare360PersonnelOverviewData({
    schoolId: context.school.id,
    staff: staff as unknown as Array<Record<string, unknown>>,
  })
  const config = {
    ...createStaffPeopleConfig({ schoolId: context.school.id, staffType: 'personnel' }),
    fixedValues: {
      schoolId: context.school.id,
      staffType: 'personnel',
    },
  }
  const canCreate = context.access.accessLevel === 'super_admin' || context.permissions.has('personnel.create')
  const canUpdate = context.access.accessLevel === 'super_admin' || context.permissions.has('personnel.update')

  return (
    <Angelcare360PersonnelOverview
      config={config}
      rows={staff as unknown as Array<Record<string, unknown>>}
      overview={overview}
      schoolName={context.school.name}
      academicYearLabel={context.academicYear?.label || 'Année scolaire à configurer'}
      canCreate={canCreate}
      canUpdate={canUpdate}
      createDisabledReason="La création d’un membre du personnel est réservée aux rôles autorisés."
      updateDisabledReason="La modification d’un membre du personnel est réservée aux rôles autorisés."
    />
  )
}
