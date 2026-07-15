import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import Angelcare360ErrorState from '@/components/angelcare360/states/Angelcare360ErrorState'
import Angelcare360PeopleDossier from '@/components/angelcare360/people/Angelcare360PeopleDossier'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { getAngelcare360StaffById } from '@/lib/angelcare360/server/people'

export const dynamic = 'force-dynamic'

function asText(value: unknown) {
  if (value === null || value === undefined || value === '') return '—'
  if (Array.isArray(value)) return value.map(String).join(' · ')
  return String(value)
}

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function Angelcare360StaffDetailPage({ params }: PageProps) {
  const { id } = await params
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  if (!context.access.canSeePeopleData && !context.permissions.has('personnel.view') && context.access.accessLevel !== 'super_admin') {
    return (
      <Angelcare360ErrorState
        title="Accès au personnel verrouillé"
        description="Votre rôle ne permet pas encore de consulter ce dossier personnel."
        actionLabel="Retour à la liste"
        actionHref="/angelcare-360-command-center/personnel"
      />
    )
  }

  const staff = await getAngelcare360StaffById(id)
  if (!staff) notFound()

  const staffRecord = staff as Record<string, unknown>
  const metadata = (staffRecord.metadata_json as Record<string, unknown> | undefined) || {}
  const assignments = (staffRecord.assignments as unknown as Array<Record<string, unknown>>) || []
  const contracts = (staffRecord.contracts as unknown as Array<Record<string, unknown>>) || []
  const documents = (staffRecord.documents as unknown as Array<Record<string, unknown>>) || []
  const contacts = (staffRecord.emergency_contacts as unknown as Array<Record<string, unknown>>) || []
  const audits = (staffRecord.latest_audit_events as unknown as Array<Record<string, unknown>>) || []

  return (
    <Angelcare360PeopleDossier
      title={asText(staffRecord.full_name)}
      subtitle={`Personnel ${asText(staffRecord.staff_code)} · ${asText(staffRecord.staff_type)} · ${asText(staffRecord.status)}`}
      summaryItems={[
        { label: 'Matricule', value: asText(staffRecord.staff_code) },
        { label: 'Fonction', value: asText(staffRecord.staff_type) },
        { label: 'Département', value: asText(staffRecord.department) },
        { label: 'Spécialité', value: asText(metadata.speciality) },
        { label: 'Email', value: asText(staffRecord.email) },
        { label: 'Téléphone', value: asText(staffRecord.phone) },
        { label: 'Date d’entrée', value: asText(staffRecord.hire_date) },
        { label: 'Statut', value: asText(staffRecord.status) },
      ]}
      relatedPanels={[
        {
          title: 'Affectations',
          items: assignments.length
            ? assignments.map((assignment) => {
                const assignmentRecord = assignment as Record<string, unknown>
                const classRecord = assignmentRecord.class as Record<string, unknown> | undefined
                const sectionRecord = assignmentRecord.section as Record<string, unknown> | undefined
                const subjectRecord = assignmentRecord.subject as Record<string, unknown> | undefined
                return {
                  label: asText(assignmentRecord.assignment_type || 'Affectation'),
                  value: `${asText(classRecord?.name || assignmentRecord.class_name)} · ${asText(sectionRecord?.name || assignmentRecord.section_name)} · ${asText(subjectRecord?.name || assignmentRecord.subject_name)}`,
                }
              })
            : [{ label: 'Affectation', value: 'Aucune affectation active' }],
        },
        {
          title: 'Contrats',
          items: contracts.length
            ? contracts.map((contract) => {
                const contractRecord = contract as Record<string, unknown>
                return {
                  label: asText(contractRecord.contract_number),
                  value: `${asText(contractRecord.contract_type)} · ${asText(contractRecord.status)} · ${asText(contractRecord.starts_on)} → ${asText(contractRecord.ends_on)}`,
                }
              })
            : [{ label: 'Contrat', value: 'Aucun contrat renseigné' }],
        },
        {
          title: 'Documents',
          items: documents.length
            ? documents.map((document) => {
                const documentRecord = document as Record<string, unknown>
                return {
                  label: asText(documentRecord.category),
                  value: `${asText(documentRecord.title)} · ${asText(documentRecord.status)}`,
                }
              })
            : [{ label: 'Document', value: 'Aucun document référencé' }],
        },
        {
          title: 'Contacts d’urgence',
          items: contacts.length
            ? contacts.map((contact) => {
                const contactRecord = contact as Record<string, unknown>
                return {
                  label: asText(contactRecord.relationship_type || 'Contact'),
                  value: `${asText(contactRecord.contact_name)} · ${asText(contactRecord.phone)}`,
                }
              })
            : [{ label: 'Contact', value: 'Aucun contact d’urgence' }],
        },
      ]}
      lockedTabs={[
        { label: 'Présence', reason: 'Le suivi des présences du personnel sera activé plus tard.' },
        { label: 'Paie', reason: 'La paie du personnel sera ajoutée après activation du périmètre financier.' },
        { label: 'Performance', reason: 'Le suivi RH avancé n’est pas encore ouvert.' },
      ]}
      timeline={audits.map((event) => ({
        label: `${asText(event.module)} · ${asText(event.action)}`,
        detail: `${asText(event.severity)} · ${asText(event.entity_type)} · ${asText(event.entity_id)}`,
        date: asText(event.created_at),
      }))}
      actions={
        <div style={actionsStyle}>
          <Link href="/angelcare-360-command-center/personnel" style={secondaryLinkStyle}>
            Retour au personnel
          </Link>
          <Link href="/angelcare-360-command-center/enseignants" style={secondaryLinkStyle}>
            Ouvrir les enseignants
          </Link>
        </div>
      }
    />
  )
}

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
}

const secondaryLinkStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 14,
  padding: '10px 14px',
  background: '#fff',
  color: '#0f172a',
  textDecoration: 'none',
  fontWeight: 800,
}
