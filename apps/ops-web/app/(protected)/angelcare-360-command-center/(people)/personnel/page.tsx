import { redirect } from 'next/navigation'
import Angelcare360ErrorState from '@/components/angelcare360/states/Angelcare360ErrorState'
import Angelcare360PeopleHub from '@/components/angelcare360/people/Angelcare360PeopleHub'
import Angelcare360AdministrationContextRow from '@/components/angelcare360/administration/Angelcare360AdministrationContextRow'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { listAngelcare360Staff } from '@/lib/angelcare360/server/people'
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
  const config = {
    ...createStaffPeopleConfig({ schoolId: context.school.id, staffType: 'personnel' }),
    fixedValues: {
      schoolId: context.school.id,
      staffType: 'personnel',
    },
  }

  const canCreate = context.access.accessLevel === 'super_admin' || context.permissions.has('personnel.create')
  const canUpdate = context.access.accessLevel === 'super_admin' || context.permissions.has('personnel.update')

  const contextRow = (
    <Angelcare360AdministrationContextRow
      items={[
        { label: 'Établissement', value: context.school.name },
        { label: 'Année active', value: context.academicYear?.label || 'Non définie' },
        { label: 'Membres', value: String(staff.length) },
        { label: 'En congé', value: String(staff.filter((row) => row.status === 'on_leave').length) },
      ]}
    />
  )

  return (
    <Angelcare360PeopleHub
      config={config}
      rows={staff as unknown as Array<Record<string, unknown>>}
      contextRow={contextRow}
      canCreate={canCreate}
      canUpdate={canUpdate}
      createDisabledReason="La création d’un membre du personnel est réservée aux rôles autorisés."
      updateDisabledReason="La modification d’un membre du personnel est réservée aux rôles autorisés."
    />
  )
}
