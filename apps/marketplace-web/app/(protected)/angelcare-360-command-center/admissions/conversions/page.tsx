import { redirect } from 'next/navigation'
import Angelcare360AdmissionsConversionWorkspace from '@/components/angelcare360/admissions/Angelcare360AdmissionsConversionWorkspace'
import Angelcare360AdministrationContextRow from '@/components/angelcare360/administration/Angelcare360AdministrationContextRow'
import type { Angelcare360AdmissionApplicationListRecord } from '@/types/angelcare360/admissions'
import {
  getAngelcare360AccessContext,
  getAngelcare360AdmissionConversionChecklist,
  listAngelcare360AdmissionConversionCandidates,
} from '@/lib/angelcare360/server'

export const dynamic = 'force-dynamic'

export default async function Angelcare360AdmissionsConversionsPage() {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center/admissions')

  const candidates = await listAngelcare360AdmissionConversionCandidates({ schoolId: context.school.id, academicYearId: context.academicYear?.id || null })
  const enriched: Array<Angelcare360AdmissionApplicationListRecord & {
    conversionChecklist?: Array<{ key: string; label: string; ok: boolean; explanation: string }> | null
    capacityWarning?: string | null
    duplicatesCount?: number
  }> = await Promise.all(
    candidates.map(async (application) => {
      const checklist = await getAngelcare360AdmissionConversionChecklist(String(application.id))
      return {
        ...application,
        conversionChecklist: checklist?.checklist || null,
        capacityWarning: checklist?.capacity?.warning || null,
        duplicatesCount: checklist?.duplicates?.duplicates?.length || 0,
      }
    }),
  )

  return (
    <Angelcare360AdmissionsConversionWorkspace
      contextRow={(
        <Angelcare360AdministrationContextRow
          items={[
            { label: 'Établissement actif', value: context.school.name },
            { label: 'Année active', value: context.academicYear?.label || 'Non définie' },
            { label: 'Convertible(s)', value: String(enriched.length) },
          ]}
        />
      )}
      title="Conversions admissions"
      subtitle="Checklist de conversion et transfert sécurisé vers les dossiers personnes."
      applications={enriched}
      schoolId={context.school.id}
      canConvert={context.permissions.has('admissions.approve') || context.access.accessLevel === 'super_admin'}
      disabledReason="Vous n’avez pas la permission d’exécuter une conversion d’admission."
    />
  )
}
