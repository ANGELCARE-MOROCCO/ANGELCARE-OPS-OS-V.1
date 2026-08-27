import { redirect } from 'next/navigation'
import Angelcare360AdmissionsPipelineWorkspace from '@/components/angelcare360/admissions/Angelcare360AdmissionsPipelineWorkspace'
import Angelcare360AdministrationContextRow from '@/components/angelcare360/administration/Angelcare360AdministrationContextRow'
import { getAngelcare360AccessContext, listAngelcare360AdmissionPipelineCards } from '@/lib/angelcare360/server'

export const dynamic = 'force-dynamic'

export default async function Angelcare360AdmissionsPipelinePage() {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center/admissions')

  const cardsByStatus = await listAngelcare360AdmissionPipelineCards({ schoolId: context.school.id, academicYearId: context.academicYear?.id || null })

  return (
    <Angelcare360AdmissionsPipelineWorkspace
      contextRow={(
        <Angelcare360AdministrationContextRow
          items={[
            { label: 'Établissement actif', value: context.school.name },
            { label: 'Année active', value: context.academicYear?.label || 'Non définie' },
            { label: 'Dossiers visibles', value: String(Object.values(cardsByStatus).reduce((count, current) => count + current.length, 0)) },
          ]}
        />
      )}
      title="Pipeline admissions"
      subtitle="Vue en colonnes des demandes et dossiers selon leur statut réel de traitement."
      cardsByStatus={cardsByStatus}
      schoolId={context.school.id}
      canChangeStatus={context.permissions.has('admissions.update') || context.access.accessLevel === 'super_admin'}
      disabledReason="Vous n’avez pas la permission de déplacer un dossier dans le pipeline."
    />
  )
}
