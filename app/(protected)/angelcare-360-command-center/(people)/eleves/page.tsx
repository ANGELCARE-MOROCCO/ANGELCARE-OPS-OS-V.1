import { redirect } from 'next/navigation'
import Angelcare360ErrorState from '@/components/angelcare360/states/Angelcare360ErrorState'
import Angelcare360PeopleHub from '@/components/angelcare360/people/Angelcare360PeopleHub'
import Angelcare360AdministrationContextRow from '@/components/angelcare360/administration/Angelcare360AdministrationContextRow'
import { getAngelcare360AccessContext, listAngelcare360Classes } from '@/lib/angelcare360/server'
import { listAngelcare360Sections } from '@/lib/angelcare360/server/administration'
import { listAngelcare360Students } from '@/lib/angelcare360/server/people'
import {
  createClassOptions,
  createSectionOptions,
  createStudentPeopleConfig,
} from '@/data/angelcare360/people-pages'

export const dynamic = 'force-dynamic'

export default async function Angelcare360StudentsPage() {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  if (!context.access.canSeePeopleData && !context.permissions.has('eleves.view') && context.access.accessLevel !== 'super_admin') {
    return (
      <Angelcare360ErrorState
        title="Accès aux élèves verrouillé"
        description="Votre rôle ne permet pas encore d’accéder aux dossiers élèves."
        actionLabel="Retour au cockpit"
        actionHref="/angelcare-360-command-center"
      />
    )
  }

  const [rows, classRows, sectionRows] = await Promise.all([
    listAngelcare360Students({ schoolId: context.school.id, academicYearId: context.academicYear?.id || null }),
    listAngelcare360Classes(context.school.id, context.academicYear?.id || null),
    listAngelcare360Sections(context.school.id, context.academicYear?.id || null),
  ])

  const config = createStudentPeopleConfig({
    schoolId: context.school.id,
    academicYearId: context.academicYear?.id || null,
    classOptions: createClassOptions(classRows as unknown as Array<Record<string, unknown>>),
    sectionOptions: createSectionOptions(sectionRows as unknown as Array<Record<string, unknown>>),
    classRows: classRows as unknown as Array<Record<string, unknown>>,
    sectionRows: sectionRows as unknown as Array<Record<string, unknown>>,
  })

  const canCreate = context.access.accessLevel === 'super_admin' || context.permissions.has('eleves.create')
  const canUpdate = context.access.accessLevel === 'super_admin' || context.permissions.has('eleves.update')

  const assigned = rows.filter((row) => Boolean(row.current_class_id) && Boolean(row.current_section_id)).length
  const contextRow = (
    <Angelcare360AdministrationContextRow
      items={[
        { label: 'Établissement', value: context.school.name },
        { label: 'Année active', value: context.academicYear?.label || 'Non définie' },
        { label: 'Élèves', value: String(rows.length) },
        { label: 'Affectés', value: `${rows.length ? Math.round((assigned / rows.length) * 100) : 0}%` },
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
      createDisabledReason="La création d’un élève est réservée aux rôles autorisés."
      updateDisabledReason="La modification d’un élève est réservée aux rôles autorisés."
    />
  )
}
