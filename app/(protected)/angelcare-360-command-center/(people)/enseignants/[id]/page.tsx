import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import Angelcare360ErrorState from '@/components/angelcare360/states/Angelcare360ErrorState'
import Angelcare360PeopleDossier from '@/components/angelcare360/people/Angelcare360PeopleDossier'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { getAngelcare360TeacherById } from '@/lib/angelcare360/server/people'

export const dynamic = 'force-dynamic'

function asText(value: unknown) {
  if (value === null || value === undefined || value === '') return '—'
  if (Array.isArray(value)) return value.map(String).join(' · ')
  return String(value)
}

export default async function Angelcare360TeacherDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  if (!context.access.canSeePeopleData && !context.permissions.has('enseignants.view') && context.access.accessLevel !== 'super_admin') {
    return (
      <Angelcare360ErrorState
        title="Accès aux enseignants verrouillé"
        description="Votre rôle ne permet pas encore de consulter ce dossier enseignant."
        actionLabel="Retour à la liste"
        actionHref="/angelcare-360-command-center/enseignants"
      />
    )
  }

  const teacher = await getAngelcare360TeacherById(id)
  if (!teacher) notFound()

  const metadata = (teacher.metadata_json as Record<string, unknown> | undefined) || {}
  const assignments = (teacher.assignments as Array<Record<string, unknown>>) || []
  const contracts = (teacher.contracts as Array<Record<string, unknown>>) || []
  const documents = (teacher.documents as Array<Record<string, unknown>>) || []
  const contacts = (teacher.emergency_contacts as Array<Record<string, unknown>>) || []
  const audits = (teacher.latest_audit_events as Array<Record<string, unknown>>) || []

  return (
    <Angelcare360PeopleDossier
      title={asText(teacher.full_name)}
      subtitle={`Enseignant ${asText(teacher.staff_code)} · ${asText(teacher.department || metadata.speciality)} · ${asText(teacher.status)}`}
      summaryItems={[
        { label: 'Matricule', value: asText(teacher.staff_code) },
        { label: 'Fonction', value: asText(teacher.staff_type) },
        { label: 'Département', value: asText(teacher.department) },
        { label: 'Spécialité', value: asText(metadata.speciality) },
        { label: 'Email', value: asText(teacher.email) },
        { label: 'Téléphone', value: asText(teacher.phone) },
        { label: 'Date d’entrée', value: asText(teacher.hire_date) },
        { label: 'Statut', value: asText(teacher.status) },
      ]}
      relatedPanels={[
        {
          title: 'Affectations',
          items: assignments.length
            ? assignments.map((assignment) => ({
                label: asText(assignment.assignment_type || 'Affectation'),
                value: `${asText(assignment.class?.name || assignment.class_name)} · ${asText(assignment.section?.name || assignment.section_name)} · ${asText(assignment.subject?.name || assignment.subject_name)}`,
              }))
            : [{ label: 'Affectation', value: 'Aucune affectation active' }],
        },
        {
          title: 'Contrats',
          items: contracts.length
            ? contracts.map((contract) => ({
                label: asText(contract.contract_number),
                value: `${asText(contract.contract_type)} · ${asText(contract.status)} · ${asText(contract.starts_on)} → ${asText(contract.ends_on)}`,
              }))
            : [{ label: 'Contrat', value: 'Aucun contrat renseigné' }],
        },
        {
          title: 'Documents',
          items: documents.length
            ? documents.map((document) => ({
                label: asText(document.category),
                value: `${asText(document.title)} · ${asText(document.status)}`,
              }))
            : [{ label: 'Document', value: 'Aucun document référencé' }],
        },
        {
          title: 'Contacts d’urgence',
          items: contacts.length
            ? contacts.map((contact) => ({
                label: asText(contact.relationship_type || 'Contact'),
                value: `${asText(contact.contact_name)} · ${asText(contact.phone)}`,
              }))
            : [{ label: 'Contact', value: 'Aucun contact d’urgence' }],
        },
      ]}
      lockedTabs={[
        { label: 'Emploi du temps', reason: 'Le planning pédagogique détaillé arrive dans la phase suivante.' },
        { label: 'Présence', reason: 'Le suivi des présences des enseignants sera activé plus tard.' },
        { label: 'Paie', reason: 'La paie est verrouillée jusqu’à la phase financière.' },
      ]}
      timeline={audits.map((event) => ({
        label: `${asText(event.module)} · ${asText(event.action)}`,
        detail: `${asText(event.severity)} · ${asText(event.entity_type)} · ${asText(event.entity_id)}`,
        date: asText(event.created_at),
      }))}
      actions={
        <div style={actionsStyle}>
          <Link href="/angelcare-360-command-center/enseignants" style={secondaryLinkStyle}>
            Retour aux enseignants
          </Link>
          <Link href="/angelcare-360-command-center/personnel" style={secondaryLinkStyle}>
            Ouvrir le personnel
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
