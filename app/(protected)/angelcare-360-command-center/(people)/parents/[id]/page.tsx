import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import Angelcare360ErrorState from '@/components/angelcare360/states/Angelcare360ErrorState'
import Angelcare360PeopleDossier from '@/components/angelcare360/people/Angelcare360PeopleDossier'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { getAngelcare360ParentById } from '@/lib/angelcare360/server/people'

export const dynamic = 'force-dynamic'

function asText(value: unknown) {
  if (value === null || value === undefined || value === '') return '—'
  if (Array.isArray(value)) return value.map(String).join(' · ')
  return String(value)
}

export default async function Angelcare360ParentDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  if (!context.access.canSeePeopleData && !context.permissions.has('parents.view') && context.access.accessLevel !== 'super_admin') {
    return (
      <Angelcare360ErrorState
        title="Accès aux parents verrouillé"
        description="Votre rôle ne permet pas encore de consulter ce dossier famille."
        actionLabel="Retour à la liste"
        actionHref="/angelcare-360-command-center/parents"
      />
    )
  }

  const parent = await getAngelcare360ParentById(id)
  if (!parent) notFound()

  const metadata = (parent.metadata_json as Record<string, unknown> | undefined) || {}
  const children = (parent.children as Array<Record<string, unknown>>) || []
  const links = (parent.child_links as Array<Record<string, unknown>>) || []
  const documents = (parent.documents as Array<Record<string, unknown>>) || []
  const audits = (parent.latest_audit_events as Array<Record<string, unknown>>) || []

  return (
    <Angelcare360PeopleDossier
      title={asText(parent.full_name)}
      subtitle={`Parent ${asText(parent.parent_code)} · ${asText(parent.relationship_type)} · ${asText(parent.status)}`}
      summaryItems={[
        { label: 'Code parent', value: asText(parent.parent_code) },
        { label: 'Relation', value: asText(parent.relationship_type) },
        { label: 'Téléphone', value: asText(parent.phone) },
        { label: 'Email', value: asText(parent.email) },
        { label: 'Profession', value: asText(parent.occupation) },
        { label: 'Langue préférée', value: asText(parent.preferred_language) },
        { label: 'Adresse', value: asText(parent.address) },
        { label: 'Statut', value: asText(parent.status) },
      ]}
      relatedPanels={[
        {
          title: 'Enfants liés',
          items: children.length
            ? children.map((child) => ({
                label: asText(child.student_code || child.full_name),
                value: (
                  <Link href={`/angelcare-360-command-center/eleves/${child.id}`}>
                    {asText(child.full_name)} · {asText(child.status)}
                  </Link>
                ),
              }))
            : [{ label: 'Enfant', value: 'Aucun enfant lié' }],
        },
        {
          title: 'Préférences de contact',
          items: [
            { label: 'Téléphone secondaire', value: asText(metadata.secondary_phone) },
            { label: 'Notes', value: asText(metadata.notes) },
          ],
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
          title: 'Liens parent/enfant',
          items: links.length
            ? links.map((link) => ({
                label: asText(link.relationship_type),
                value: `${asText(link.is_primary ? 'Principal' : 'Secondaire')} · ${asText(link.is_guardian ? 'Responsable légal' : 'Non gardien')}`,
              }))
            : [{ label: 'Lien', value: 'Aucun lien enregistré' }],
        },
      ]}
      lockedTabs={[
        { label: 'Paiements', reason: 'Le suivi des paiements parentaux sera ouvert dans une phase dédiée.' },
        { label: 'Messages', reason: 'La messagerie parentale est verrouillée pour l’instant.' },
        { label: 'Historique', reason: 'L’historique métier complet sera ajouté plus tard.' },
      ]}
      timeline={audits.map((event) => ({
        label: `${asText(event.module)} · ${asText(event.action)}`,
        detail: `${asText(event.severity)} · ${asText(event.entity_type)} · ${asText(event.entity_id)}`,
        date: asText(event.created_at),
      }))}
      actions={
        <div style={actionsStyle}>
          <Link href="/angelcare-360-command-center/parents" style={secondaryLinkStyle}>
            Retour aux parents
          </Link>
          <Link href="/angelcare-360-command-center/eleves" style={secondaryLinkStyle}>
            Ouvrir les élèves
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
