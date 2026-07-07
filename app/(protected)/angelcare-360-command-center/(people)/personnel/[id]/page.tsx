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

export default async function Angelcare360StaffDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
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

  const metadata = (staff.metadata_json as Record<string, unknown> | undefined) || {}
  const assignments = (staff.assignments as Array<Record<string, unknown>>) || []
  const contracts = (staff.contracts as Array<Record<string, unknown>>) || []
  const documents = (staff.documents as Array<Record<string, unknown>>) || []
  const contacts = (staff.emergency_contacts as Array<Record<string, unknown>>) || []
  const audits = (staff.latest_audit_events as Array<Record<string, unknown>>) || []

  return (
    <Angelcare360PeopleDossier
      title={asText(staff.full_name)}
      subtitle={`Personnel ${asText(staff.staff_code)} · ${asText(staff.staff_type)} · ${asText(staff.status)}`}
      summaryItems={[
        { label: 'Matricule', value: asText(staff.staff_code) },
        { label: 'Fonction', value: asText(staff.staff_type) },
        { label: 'Département', value: asText(staff.department) },
        { label: 'Spécialité', value: asText(metadata.speciality) },
        { label: 'Email', value: asText(staff.email) },
        { label: 'Téléphone', value: asText(staff.phone) },
        { label: 'Date d’entrée', value: asText(staff.hire_date) },
        { label: 'Statut', value: asText(staff.status) },
      ]}
      relatedPanels={[
        {
          title: 'Affectations',
          items: assignments.length
            ? assignments.map((assignment) => ({
                label: asText(assignment.assignment_type || 'Affectation'),
                value: `${asText((assignment.class as Record<string, unknown> | undefined)?.name || assignment.class_name)} · ${asText((assignment.section as Record<string, unknown> | undefined)?.name || assignment.section_name)} · ${asText((assignment.subject as Record<string, unknown> | undefined)?.name || assignment.subject_name)}`,
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
        { label: 'Présence', reason: 'Le suivi des présences du personnel sera activé plus tard.' },
        { label: 'Paie', reason: 'La paie du personnel sera ajoutée dans la phase finance.' },
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
