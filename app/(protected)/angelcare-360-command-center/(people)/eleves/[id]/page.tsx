import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import Angelcare360ErrorState from '@/components/angelcare360/states/Angelcare360ErrorState'
import Angelcare360PeopleDossier from '@/components/angelcare360/people/Angelcare360PeopleDossier'
import { getAngelcare360StudentById } from '@/lib/angelcare360/server/people'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'

export const dynamic = 'force-dynamic'

function asText(value: unknown) {
  if (value === null || value === undefined || value === '') return '—'
  if (Array.isArray(value)) return value.map(String).join(' · ')
  return String(value)
}

export default async function Angelcare360StudentDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  if (!context.access.canSeePeopleData && !context.permissions.has('eleves.view') && context.access.accessLevel !== 'super_admin') {
    return (
      <Angelcare360ErrorState
        title="Accès aux élèves verrouillé"
        description="Votre rôle ne permet pas encore de consulter ce dossier élève."
        actionLabel="Retour à la liste"
        actionHref="/angelcare-360-command-center/eleves"
      />
    )
  }

  const student = await getAngelcare360StudentById(id)
  if (!student) notFound()

  const studentRecord = student as Record<string, unknown>
  const metadata = (studentRecord.metadata_json as Record<string, unknown> | undefined) || {}
  const parents = (studentRecord.parents as unknown as Array<Record<string, unknown>>) || []
  const contacts = (studentRecord.emergency_contacts as unknown as Array<Record<string, unknown>>) || []
  const documents = (studentRecord.documents as unknown as Array<Record<string, unknown>>) || []
  const enrollments = (studentRecord.enrollments as unknown as Array<Record<string, unknown>>) || []
  const audits = (studentRecord.latest_audit_events as unknown as Array<Record<string, unknown>>) || []
  const activeEnrollment = enrollments[0] || null

  return (
    <Angelcare360PeopleDossier
      title={asText(studentRecord.full_name)}
      subtitle={`Élève ${asText(studentRecord.student_code)} · ${asText(studentRecord.status)} · ${asText(studentRecord.admission_status)}`}
      summaryItems={[
        { label: 'Matricule', value: asText(studentRecord.student_code) },
        { label: 'Date de naissance', value: asText(studentRecord.date_of_birth) },
        { label: 'Sexe', value: asText(studentRecord.gender) },
        { label: 'Nationalité', value: asText(metadata.nationality) },
        { label: 'Classe', value: asText(studentRecord.class_name || activeEnrollment?.class_name) },
        { label: 'Section', value: asText(studentRecord.section_name || activeEnrollment?.section_name) },
        { label: 'Statut', value: asText(studentRecord.status) },
        { label: 'Transport', value: studentRecord.transport_required ? 'Oui' : 'Non' },
      ]}
      relatedPanels={[
        {
          title: 'Famille liée',
          items: parents.length
            ? parents.map((parent) => {
                const parentRecord = parent as Record<string, unknown>
                return {
                label: asText(parentRecord.relationship_type || parentRecord.relationship || 'Relation'),
                value: (
                  <Link href={`/angelcare-360-command-center/parents/${parentRecord.id}`}>
                    {asText(parentRecord.full_name || parentRecord.first_name)} · {asText(parentRecord.parent_code)}
                  </Link>
                ),
                }
              })
            : [{ label: 'Parent', value: 'Aucun parent lié' }],
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
            : [{ label: 'Contact', value: 'Aucun contact d’urgence enregistré' }],
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
          title: 'Affectation active',
          items: activeEnrollment
            ? [
                { label: 'Année scolaire', value: asText(activeEnrollment.academic_year_id) },
                { label: 'Classe', value: asText(activeEnrollment.class_name) },
                { label: 'Section', value: asText(activeEnrollment.section_name) },
                { label: 'Numéro', value: asText(activeEnrollment.enrollment_number) },
              ]
            : [{ label: 'État', value: 'Aucune affectation active' }],
        },
      ]}
      lockedTabs={[
        { label: 'Présence', reason: 'Le suivi des présences sera ouvert dans la phase suivante.' },
        { label: 'Finance', reason: 'Les factures et paiements arrivent après la mise en place du socle humain.' },
        { label: 'Académique', reason: 'Notes, examens et bulletins sont verrouillés pour l’instant.' },
        { label: 'Transport', reason: 'L’exploitation transport sera activée dans une phase dédiée.' },
      ]}
      timeline={audits.map((event) => ({
        label: `${asText(event.module)} · ${asText(event.action)}`,
        detail: `${asText(event.severity)} · ${asText(event.entity_type)} · ${asText(event.entity_id)}`,
        date: asText(event.created_at),
      }))}
      actions={
        <div style={actionsStyle}>
          <Link href="/angelcare-360-command-center/eleves" style={secondaryLinkStyle}>
            Retour aux élèves
          </Link>
          <Link href="/angelcare-360-command-center/parents" style={secondaryLinkStyle}>
            Ouvrir les parents
          </Link>
          <Link href="/angelcare-360-command-center/personnes/documents" style={secondaryLinkStyle}>
            Voir les documents
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
