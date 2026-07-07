import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Angelcare360AdmissionsPageShell from '@/components/angelcare360/admissions/Angelcare360AdmissionsPageShell'
import Angelcare360AdmissionLeadDetail from '@/components/angelcare360/admissions/Angelcare360AdmissionLeadDetail'
import Angelcare360AdministrationContextRow from '@/components/angelcare360/administration/Angelcare360AdministrationContextRow'
import { getAngelcare360AccessContext, getAngelcare360AdmissionLeadById } from '@/lib/angelcare360/server'

export const dynamic = 'force-dynamic'

export default async function Angelcare360AdmissionLeadDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center/admissions')

  const lead = await getAngelcare360AdmissionLeadById(id)
  if (!lead) notFound()

  return (
    <Angelcare360AdmissionsPageShell
      title="Dossier de demande"
      subtitle="Lecture détaillée d’une demande d’inscription, avec historique et navigation vers le dossier associé."
      badge="Demandes"
      statusLabel={String(lead.status)}
      contextRow={(
        <Angelcare360AdministrationContextRow
          items={[
            { label: 'Établissement actif', value: String(context.school.name) },
            { label: 'Année active', value: context.academicYear?.label ? String(context.academicYear.label) : 'Non définie' },
            { label: 'Code demande', value: String(lead.lead_code) },
          ]}
        />
      )}
      secondaryActions={(
        <>
          <Link href="/angelcare-360-command-center/admissions/demandes" style={secondaryLinkStyle}>Retour à la liste</Link>
          <Link href="/angelcare-360-command-center/admissions/dossiers" style={secondaryLinkStyle}>Voir les dossiers</Link>
        </>
      )}
    >
      <Angelcare360AdmissionLeadDetail
        lead={lead as unknown as never}
        schoolId={String(context.school.id)}
        canConvert={context.permissions.has('admissions.create') || context.access.accessLevel === 'super_admin'}
      />
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
