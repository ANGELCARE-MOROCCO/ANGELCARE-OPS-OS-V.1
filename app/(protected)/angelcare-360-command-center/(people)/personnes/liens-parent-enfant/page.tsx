import { redirect } from 'next/navigation'
import Angelcare360ErrorState from '@/components/angelcare360/states/Angelcare360ErrorState'
import Angelcare360PeopleHub from '@/components/angelcare360/people/Angelcare360PeopleHub'
import Angelcare360AdministrationContextRow from '@/components/angelcare360/administration/Angelcare360AdministrationContextRow'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { listAngelcare360Parents, listAngelcare360StudentParentLinks, listAngelcare360Students } from '@/lib/angelcare360/server/people'
import {
  createParentOptions,
  createStudentOptions,
  createStudentParentLinkPeopleConfig,
} from '@/data/angelcare360/people-pages'

export const dynamic = 'force-dynamic'

export default async function Angelcare360ParentChildLinksPage() {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  if (
    !context.access.canSeePeopleData &&
    !context.permissions.has('parents.view') &&
    !context.permissions.has('eleves.view') &&
    context.access.accessLevel !== 'super_admin'
  ) {
    return (
      <Angelcare360ErrorState
        title="Accès aux liens parent/enfant verrouillé"
        description="Votre rôle ne permet pas encore de gérer les relations parent/enfant."
        actionLabel="Retour au cockpit"
        actionHref="/angelcare-360-command-center"
      />
    )
  }

  const [links, students, parents] = await Promise.all([
    listAngelcare360StudentParentLinks({ schoolId: context.school.id }),
    listAngelcare360Students({ schoolId: context.school.id, academicYearId: context.academicYear?.id || null }),
    listAngelcare360Parents({ schoolId: context.school.id }),
  ])

  const config = createStudentParentLinkPeopleConfig({
    schoolId: context.school.id,
    studentOptions: createStudentOptions(students as unknown as Array<Record<string, unknown>>),
    parentOptions: createParentOptions(parents as unknown as Array<Record<string, unknown>>),
  })

  const canCreate = context.access.accessLevel === 'super_admin' || context.permissions.has('parents.update')
  const canUpdate = canCreate

  const contextRow = (
    <Angelcare360AdministrationContextRow
      items={[
        { label: 'Établissement', value: context.school.name },
        { label: 'Année active', value: context.academicYear?.label || 'Non définie' },
        { label: 'Liens', value: String(links.length) },
        { label: 'Principaux', value: String(links.filter((row) => row.is_primary).length) },
      ]}
    />
  )

  return (
    <Angelcare360PeopleHub
      config={config}
      rows={links as unknown as Array<Record<string, unknown>>}
      contextRow={contextRow}
      canCreate={canCreate}
      canUpdate={canUpdate}
      createDisabledReason="La création d’un lien parent/enfant est réservée aux rôles autorisés."
      updateDisabledReason="La modification d’un lien parent/enfant est réservée aux rôles autorisés."
    />
  )
}
