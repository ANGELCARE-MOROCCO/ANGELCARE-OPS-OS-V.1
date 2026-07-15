import Link from 'next/link'
import Angelcare360CommunicationMutationForm from '@/components/angelcare360/communication/Angelcare360CommunicationMutationForm'
import Angelcare360CommunicationSectionScreen from '@/components/angelcare360/communication/Angelcare360CommunicationSectionScreen'
import { listAngelcare360MessageTemplates } from '@/lib/angelcare360/server/communication'
import { getAngelcare360CommunicationContext, secondaryLinkStyle } from '../_utils'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

export const dynamic = 'force-dynamic'

export default async function Angelcare360TemplatesPage() {
  const context = await getAngelcare360CommunicationContext()
  const templates = await listAngelcare360MessageTemplates({ schoolId: context.school.id })

  return (
    <Angelcare360CommunicationSectionScreen
      title="Modèles"
      description="Créer et mettre à jour les modèles de messages pour les canaux internes."
      actions={<Link href="/angelcare-360-command-center/messagerie" style={secondaryLinkStyle}>Retour au cockpit</Link>}
    >
      <div style={stackStyle}>
        <Angelcare360CommunicationMutationForm
          title="Nouveau modèle"
          description="Le modèle reste interne et audité."
          entity="template"
          operation="create"
          submitLabel="Créer le modèle"
          endpoint="/api/angelcare360/communication"
          schoolId={context.school.id}
          fields={[
            { name: 'templateCode', label: 'Code', kind: 'text', required: true },
            { name: 'channel', label: 'Canal', kind: 'text', required: true, helperText: 'in_app, email, sms, whatsapp...' },
            { name: 'name', label: 'Nom', kind: 'text', required: true },
            { name: 'content', label: 'Contenu', kind: 'textarea', required: true },
            { name: 'audienceType', label: 'Audience cible', kind: 'text' },
          ]}
        />
        {templates.length ? templates.map((template) => (
          <article key={template.id} style={cardStyle}>
            <div style={headerStyle}>
              <div>
                <strong>{template.name}</strong>
                <div style={metaStyle}>{template.template_code}</div>
              </div>
              <span>{template.status}</span>
            </div>
            <p style={bodyStyle}>{template.content}</p>
            <div style={metaStyle}>Canal: {template.channel} · Audience: {template.audience_type || 'Tous'}</div>
            <Angelcare360CommunicationMutationForm
              title="Mettre à jour le modèle"
              description="Mutation réelle côté serveur."
              entity="template"
              operation="update"
              submitLabel="Enregistrer"
              endpoint="/api/angelcare360/communication"
              schoolId={context.school.id}
              recordId={template.id}
              initialValues={{
                templateCode: template.template_code,
                channel: template.channel,
                name: template.name,
                content: template.content,
                audienceType: template.audience_type || '',
              }}
              fields={[
                { name: 'templateCode', label: 'Code', kind: 'text', required: true },
                { name: 'channel', label: 'Canal', kind: 'text', required: true },
                { name: 'name', label: 'Nom', kind: 'text', required: true },
                { name: 'content', label: 'Contenu', kind: 'textarea', required: true },
                { name: 'audienceType', label: 'Audience cible', kind: 'text' },
              ]}
            />
          </article>
        )) : (
          <Angelcare360EmptyState title="Aucun modèle" description="Aucun modèle de communication n’est enregistré." />
        )}
      </div>
    </Angelcare360CommunicationSectionScreen>
  )
}

const stackStyle: React.CSSProperties = { display: 'grid', gap: 12 }
const cardStyle: React.CSSProperties = { display: 'grid', gap: 10, padding: 14, borderRadius: 18, border: '1px solid #e2e8f0', background: '#fff' }
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }
const metaStyle: React.CSSProperties = { color: '#64748b', fontSize: 12, fontWeight: 700 }
const bodyStyle: React.CSSProperties = { margin: 0, color: '#334155', lineHeight: 1.65 }
