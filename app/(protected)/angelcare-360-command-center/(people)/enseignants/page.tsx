import { redirect } from 'next/navigation'
import Angelcare360ErrorState from '@/components/angelcare360/states/Angelcare360ErrorState'
import Angelcare360PeopleHub from '@/components/angelcare360/people/Angelcare360PeopleHub'
import Angelcare360AdministrationContextRow from '@/components/angelcare360/administration/Angelcare360AdministrationContextRow'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { listAngelcare360Teachers } from '@/lib/angelcare360/server/people'
import { createStaffPeopleConfig } from '@/data/angelcare360/people-pages'

export const dynamic = 'force-dynamic'

export default async function Angelcare360TeachersPage() {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  if (!context.access.canSeePeopleData && !context.permissions.has('enseignants.view') && context.access.accessLevel !== 'super_admin') {
    return (
      <Angelcare360ErrorState
        title="Accès aux enseignants verrouillé"
        description="Votre rôle ne permet pas encore d’accéder aux dossiers enseignants."
        actionLabel="Retour au cockpit"
        actionHref="/angelcare-360-command-center"
      />
    )
  }

  const teachers = await listAngelcare360Teachers({ schoolId: context.school.id })
  const rows = teachers.map((row) => ({
    ...row,
    detail_href: `/angelcare-360-command-center/enseignants/${row.id}`,
  }))
  const config = {
    ...createStaffPeopleConfig({ schoolId: context.school.id, staffType: 'teacher' }),
    fixedValues: {
      schoolId: context.school.id,
      staffType: 'teacher',
    },
  }

  const canCreate = context.access.accessLevel === 'super_admin' || context.permissions.has('enseignants.create')
  const canUpdate = context.access.accessLevel === 'super_admin' || context.permissions.has('enseignants.update')

  const contextRow = (
    <Angelcare360AdministrationContextRow
      items={[
        { label: 'Établissement', value: context.school.name },
        { label: 'Année active', value: context.academicYear?.label || 'Non définie' },
        { label: 'Enseignants', value: String(rows.length) },
        { label: 'Affectations', value: String(rows.reduce((total, row) => total + Number(row.assignment_count || 0), 0)) },
      ]}
    />
  )

  return (
    <Angelcare360PeopleHub
      config={config}
      rows={rows as unknown as Array<Record<string, unknown>>}
      contextRow={contextRow}
      canCreate={canCreate}
      canUpdate={canUpdate}
      createDisabledReason="La création d’un enseignant est réservée aux rôles autorisés."
      updateDisabledReason="La modification d’un enseignant est réservée aux rôles autorisés."
    />
  )
}
