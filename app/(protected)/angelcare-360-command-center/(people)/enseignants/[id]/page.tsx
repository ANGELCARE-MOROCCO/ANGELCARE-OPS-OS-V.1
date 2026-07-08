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

  const teacherRecord = teacher as Record<string, unknown>
  const metadata = (teacherRecord.metadata_json as Record<string, unknown> | undefined) || {}
  const assignments = (teacher.assignments as unknown as Array<Record<string, unknown>>) || []
  const contracts = (teacher.contracts as unknown as Array<Record<string, unknown>>) || []
  const documents = (teacher.documents as unknown as Array<Record<string, unknown>>) || []
  const contacts = (teacher.emergency_contacts as unknown as Array<Record<string, unknown>>) || []
  const audits = (teacher.latest_audit_events as unknown as Array<Record<string, unknown>>) || []

  return (
    <Angelcare360PeopleDossier
      title={asText(teacherRecord.full_name)}
      subtitle={`Enseignant ${asText(teacherRecord.staff_code)} · ${asText(teacherRecord.department || metadata.speciality)} · ${asText(teacherRecord.status)}`}
      summaryItems={[
        { label: 'Matricule', value: asText(teacherRecord.staff_code) },
        { label: 'Fonction', value: asText(teacherRecord.staff_type) },
        { label: 'Département', value: asText(teacherRecord.department) },
        { label: 'Spécialité', value: asText(metadata.speciality) },
        { label: 'Email', value: asText(teacherRecord.email) },
        { label: 'Téléphone', value: asText(teacherRecord.phone) },
        { label: 'Date d’entrée', value: asText(teacherRecord.hire_date) },
        { label: 'Statut', value: asText(teacherRecord.status) },
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
        { label: 'Emploi du temps', reason: 'Le planning pédagogique détaillé arrivera après configuration.' },
        { label: 'Présence', reason: 'Le suivi des présences des enseignants sera activé plus tard.' },
        { label: 'Paie', reason: 'La paie est verrouillée jusqu’à activation du périmètre financier.' },
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
