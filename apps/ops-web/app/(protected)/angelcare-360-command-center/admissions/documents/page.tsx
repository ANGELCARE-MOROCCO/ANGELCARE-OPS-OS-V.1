import { redirect } from 'next/navigation'
import Angelcare360AdmissionsDocumentsWorkspace from '@/components/angelcare360/admissions/Angelcare360AdmissionsDocumentsWorkspace'
import Angelcare360AdministrationContextRow from '@/components/angelcare360/administration/Angelcare360AdministrationContextRow'
import { getAngelcare360AccessContext, listAngelcare360AdmissionDocumentSubmissions, listAngelcare360AdmissionRequiredDocuments } from '@/lib/angelcare360/server'

export const dynamic = 'force-dynamic'

export default async function Angelcare360AdmissionsDocumentsPage() {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center/admissions')

  const [requiredDocuments, submissions] = await Promise.all([
    listAngelcare360AdmissionRequiredDocuments({ schoolId: context.school.id, academicYearId: context.academicYear?.id || null }),
    listAngelcare360AdmissionDocumentSubmissions({ schoolId: context.school.id, academicYearId: context.academicYear?.id || null }),
  ])

  return (
    <Angelcare360AdmissionsDocumentsWorkspace
      contextRow={(
        <Angelcare360AdministrationContextRow
          items={[
            { label: 'Établissement actif', value: context.school.name },
            { label: 'Année active', value: context.academicYear?.label || 'Non définie' },
            { label: 'Documents requis', value: String(requiredDocuments.length) },
            { label: 'Soumissions', value: String(submissions.length) },
          ]}
        />
      )}
      title="Documents admissions"
      subtitle="Référentiel des pièces requises, des statuts de soumission et des pièces validées."
      schoolId={context.school.id}
      requiredDocuments={requiredDocuments}
      submissions={submissions}
      canCreate={context.permissions.has('documents.create') || context.access.accessLevel === 'super_admin'}
      canUpdate={context.permissions.has('documents.update') || context.access.accessLevel === 'super_admin'}
      createDisabledReason="Vous n’avez pas la permission de créer un document requis."
      updateDisabledReason="Vous n’avez pas la permission de modifier le statut documentaire."
    />
  )
}
