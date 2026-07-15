import Link from 'next/link'
import Angelcare360CommunicationMutationForm from '@/components/angelcare360/communication/Angelcare360CommunicationMutationForm'
import Angelcare360CommunicationSectionScreen from '@/components/angelcare360/communication/Angelcare360CommunicationSectionScreen'
import { listAngelcare360Announcements, publishAngelcare360AnnouncementInternally } from '@/lib/angelcare360/server/communication'
import { getAngelcare360CommunicationContext, primaryLinkStyle, secondaryLinkStyle } from '../_utils'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

export const dynamic = 'force-dynamic'

export default async function Angelcare360AnnouncementsPage() {
  const context = await getAngelcare360CommunicationContext()
  const announcements = await listAngelcare360Announcements({ schoolId: context.school.id })

  return (
    <Angelcare360CommunicationSectionScreen
      title="Annonces"
      description="Créer, mettre à jour et publier des annonces internes avec audience contrôlée."
      actions={<Link href="/angelcare-360-command-center/messagerie" style={secondaryLinkStyle}>Retour au cockpit</Link>}
    >
      <div style={stackStyle}>
        <Angelcare360CommunicationMutationForm
          title="Nouvelle annonce"
          description="Une annonce interne ne peut être publiée qu’avec une audience réelle."
          entity="announcement"
          operation="create"
          submitLabel="Créer l’annonce"
          endpoint="/api/angelcare360/communication"
          schoolId={context.school.id}
          fields={[
            { name: 'announcementCode', label: 'Code', kind: 'text', required: true },
            { name: 'title', label: 'Titre', kind: 'text', required: true },
            { name: 'body', label: 'Contenu', kind: 'textarea', required: true },
            { name: 'audience', label: 'Audience', kind: 'text', required: true, helperText: 'Ex: parents, staff, classes:A1' },
            { name: 'academicYearId', label: 'Année scolaire (facultatif)', kind: 'text' },
          ]}
        />
        {announcements.length ? announcements.map((announcement) => (
          <article key={announcement.id} style={cardStyle}>
            <div style={headerStyle}>
              <div>
                <strong>{announcement.title}</strong>
                <div style={metaStyle}>{announcement.announcement_code}</div>
              </div>
              <span>{announcement.status}</span>
            </div>
            <p style={bodyStyle}>{announcement.body}</p>
            <div style={metaStyle}>Audience: {announcement.audience || 'Non définie'}</div>
            <div style={actionsStyle}>
              <Link href={`${`/angelcare-360-command-center/messagerie/modeles`}`} style={primaryLinkStyle}>Modèles</Link>
              <Angelcare360CommunicationMutationForm
                title="Publier en interne"
                description="Publication auditable vers l’audience enregistrée."
                entity="announcement"
                operation="publishInternal"
                submitLabel="Publier"
                endpoint="/api/angelcare360/communication"
                schoolId={context.school.id}
                recordId={announcement.id}
                lockedReason={announcement.status === 'published_internal' ? 'Annonce déjà publiée' : null}
                fields={[
                  { name: 'audience', label: 'Audience', kind: 'text', required: true, placeholder: announcement.audience || 'parents' },
                ]}
              />
            </div>
          </article>
        )) : (
          <Angelcare360EmptyState title="Aucune annonce" description="Aucune annonce interne n’est disponible." />
        )}
      </div>
    </Angelcare360CommunicationSectionScreen>
  )
}

const stackStyle: React.CSSProperties = { display: 'grid', gap: 12 }
const cardStyle: React.CSSProperties = { display: 'grid', gap: 8, padding: 14, borderRadius: 18, border: '1px solid #e2e8f0', background: '#fff' }
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }
const metaStyle: React.CSSProperties = { color: '#64748b', fontSize: 12, fontWeight: 700 }
const bodyStyle: React.CSSProperties = { margin: 0, color: '#334155', lineHeight: 1.65 }
const actionsStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }

