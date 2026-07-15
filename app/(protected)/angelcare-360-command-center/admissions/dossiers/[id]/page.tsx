import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Angelcare360AdmissionsPageShell from '@/components/angelcare360/admissions/Angelcare360AdmissionsPageShell'
import Angelcare360AdmissionDossier from '@/components/angelcare360/admissions/Angelcare360AdmissionDossier'
import Angelcare360AdmissionConversionChecklist from '@/components/angelcare360/admissions/Angelcare360AdmissionConversionChecklist'
import Angelcare360AdmissionsConversionPanel from '@/components/angelcare360/admissions/Angelcare360AdmissionConversionPanel'
import Angelcare360AdministrationContextRow from '@/components/angelcare360/administration/Angelcare360AdministrationContextRow'
import { getAngelcare360AccessContext, getAngelcare360AdmissionApplicationById, getAngelcare360AdmissionConversionChecklist } from '@/lib/angelcare360/server'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function Angelcare360AdmissionDossierDetailPage({ params }: PageProps) {
  const { id } = await params
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center/admissions')

  const application = await getAngelcare360AdmissionApplicationById(id)
  if (!application) notFound()

  const conversion = await getAngelcare360AdmissionConversionChecklist(id)

  return (
    <Angelcare360AdmissionsPageShell
      title="Dossier d’admission"
      subtitle="Lecture détaillée du dossier, des pièces et du statut de conversion."
      badge="Dossiers"
      statusLabel={String(application.status)}
      contextRow={(
        <Angelcare360AdministrationContextRow
          items={[
            { label: 'Établissement actif', value: String(context.school.name) },
            { label: 'Année active', value: context.academicYear?.label ? String(context.academicYear.label) : 'Non définie' },
            { label: 'Code dossier', value: String(application.application_code) },
          ]}
        />
      )}
      secondaryActions={(
        <>
          <Link href="/angelcare-360-command-center/admissions/dossiers" style={secondaryLinkStyle}>Retour à la liste</Link>
          <Link href="/angelcare-360-command-center/admissions/conversions" style={secondaryLinkStyle}>Aller à la conversion</Link>
        </>
      )}
    >
      <Angelcare360AdmissionDossier application={application as unknown as never} checklist={conversion?.checklist || null} />
      {conversion ? (
        <Angelcare360AdmissionsConversionPanel
          applicationId={String(application.id)}
          readinessLabel={conversion.checklist.every((item) => item.ok) ? 'Le dossier est convertible.' : 'Le dossier nécessite encore des vérifications.'}
          canConvert={context.permissions.has('admissions.approve') || context.access.accessLevel === 'super_admin'}
          disabledReason={conversion.checklist.every((item) => item.ok) ? undefined : 'La checklist de conversion n’est pas complète.'}
          conversionHref="/angelcare-360-command-center/admissions/conversions"
        />
      ) : null}
      {conversion ? (
        <Angelcare360AdmissionConversionChecklist
          checklist={conversion.checklist}
          duplicateCount={conversion.duplicates?.duplicates?.length || 0}
          capacityWarning={conversion.capacity?.warning || null}
        />
      ) : null}
    </Angelcare360AdmissionsPageShell>
  )
}

const secondaryLinkStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 14,
  padding: '11px 14px',
  background: '#fff',
  color: '#0f172a',
  textDecoration: 'none',
  fontWeight: 800,
}
