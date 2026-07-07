import { redirect } from 'next/navigation'
import Angelcare360ErrorState from '@/components/angelcare360/states/Angelcare360ErrorState'
import Angelcare360PeopleHub from '@/components/angelcare360/people/Angelcare360PeopleHub'
import Angelcare360AdministrationContextRow from '@/components/angelcare360/administration/Angelcare360AdministrationContextRow'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { listAngelcare360Parents } from '@/lib/angelcare360/server/people'
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
  const config = createParentPeopleConfig({ schoolId: context.school.id })
  const canCreate = context.access.accessLevel === 'super_admin' || context.permissions.has('parents.create')
  const canUpdate = context.access.accessLevel === 'super_admin' || context.permissions.has('parents.update')

  const contextRow = (
    <Angelcare360AdministrationContextRow
      items={[
        { label: 'Établissement', value: context.school.name },
        { label: 'Année active', value: context.academicYear?.label || 'Non définie' },
        { label: 'Parents', value: String(rows.length) },
        { label: 'Liens enfants', value: String(rows.reduce((total, row) => total + Number(row.child_count || 0), 0)) },
      ]}
    />
  )

  return (
    <Angelcare360PeopleHub
      config={config}
      rows={rows as Array<Record<string, unknown>>}
      contextRow={contextRow}
      canCreate={canCreate}
      canUpdate={canUpdate}
      createDisabledReason="La création d’un parent est réservée aux rôles autorisés."
      updateDisabledReason="La modification d’un parent est réservée aux rôles autorisés."
    />
  )
}
