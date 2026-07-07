import { redirect } from 'next/navigation'
import Angelcare360ErrorState from '@/components/angelcare360/states/Angelcare360ErrorState'
import Angelcare360PeopleHub from '@/components/angelcare360/people/Angelcare360PeopleHub'
import Angelcare360AdministrationContextRow from '@/components/angelcare360/administration/Angelcare360AdministrationContextRow'
import { getAngelcare360AccessContext, listAngelcare360Classes } from '@/lib/angelcare360/server'
import { listAngelcare360Sections } from '@/lib/angelcare360/server/administration'
import { listAngelcare360ClassEnrollments, listAngelcare360Students } from '@/lib/angelcare360/server/people'
import {
  createClassEnrollmentPeopleConfig,
  createClassOptions,
  createSectionOptions,
  createStudentOptions,
} from '@/data/angelcare360/people-pages'

export const dynamic = 'force-dynamic'

export default async function Angelcare360ClassAssignmentsPage() {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  if (
    !context.access.canSeePeopleData &&
    !context.permissions.has('classes.view') &&
    !context.permissions.has('eleves.view') &&
    context.access.accessLevel !== 'super_admin'
  ) {
    return (
      <Angelcare360ErrorState
        title="Accès aux affectations verrouillé"
        description="Votre rôle ne permet pas encore de gérer les inscriptions et rattachements de classes."
        actionLabel="Retour au cockpit"
        actionHref="/angelcare-360-command-center"
      />
    )
  }

  const [enrollments, classes, sections, students] = await Promise.all([
    listAngelcare360ClassEnrollments({ schoolId: context.school.id }),
    listAngelcare360Classes(context.school.id, context.academicYear?.id || null),
    listAngelcare360Sections(context.school.id, context.academicYear?.id || null),
    listAngelcare360Students({ schoolId: context.school.id, academicYearId: context.academicYear?.id || null }),
  ])

  const config = createClassEnrollmentPeopleConfig({
    schoolId: context.school.id,
    academicYearId: context.academicYear?.id || null,
    classOptions: createClassOptions(classes as unknown as Array<Record<string, unknown>>),
    sectionOptions: createSectionOptions(sections as unknown as Array<Record<string, unknown>>),
    studentOptions: createStudentOptions(students as unknown as Array<Record<string, unknown>>),
  })

  const hasAcademicYear = Boolean(context.academicYear?.id)
  const canCreate = (context.access.accessLevel === 'super_admin' || context.permissions.has('eleves.assign')) && hasAcademicYear
  const canUpdate = canCreate

  const contextRow = (
    <Angelcare360AdministrationContextRow
      items={[
        { label: 'Établissement', value: context.school.name },
        { label: 'Année active', value: context.academicYear?.label || 'Non définie' },
        { label: 'Affectations', value: String(enrollments.length) },
        { label: 'À compléter', value: String(enrollments.filter((row) => row.status !== 'active').length) },
      ]}
    />
  )

  return (
    <Angelcare360PeopleHub
      config={config}
      rows={enrollments as unknown as Array<Record<string, unknown>>}
      contextRow={contextRow}
      canCreate={canCreate}
      canUpdate={canUpdate}
      createDisabledReason={
        hasAcademicYear
          ? 'L’affectation de classe est réservée aux rôles autorisés.'
          : 'Une année scolaire active est requise pour affecter les élèves aux classes.'
      }
      updateDisabledReason={
        hasAcademicYear
          ? 'La modification d’une affectation est réservée aux rôles autorisés.'
          : 'Une année scolaire active est requise pour modifier les affectations.'
      }
    />
  )
}
